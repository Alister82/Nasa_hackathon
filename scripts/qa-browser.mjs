/**
 * Manual checklist runner for Vigil.
 *
 * Uses the installed Chrome and its DevTools Protocol. No browser package is added.
 * Run from the repo root after `npm run build`:
 *   node scripts/qa-browser.mjs
 *
 * Screenshots are written to docs/screenshots/. The script exits non-zero if a
 * checklist assertion fails, so a failed run cannot be mistaken for a pass.
 */
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const ROOT = process.cwd();
const PORT = 4177;
const CDP_PORT = 9224;
const APP_URL = `http://127.0.0.1:${PORT}/`;
const SCREENSHOT_DIR = path.join(ROOT, 'docs', 'screenshots');
const REPORT_FILE = path.join(ROOT, 'docs', 'QA_REPORT.json');
const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  path.join(process.env.LOCALAPPDATA ?? '', 'Google/Chrome/Application/chrome.exe'),
];

const report = {
  startedAt: new Date().toISOString(),
  checks: [],
  failures: [],
  consoleErrors: [],
  screenshots: [],
  console: [],
  knownIssues: [],
};

function record(name, passed, detail) {
  report.checks.push({ name, passed, detail });
  if (!passed) report.failures.push({ name, detail });
}

function writeReport() {
  fs.writeFileSync(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`);
}

async function waitFor(fn, label, timeout = 12000) {
  const started = Date.now();
  let lastError = null;
  while (Date.now() - started < timeout) {
    try {
      const value = await fn();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await sleep(100);
  }
  throw new Error(`Timed out: ${label}${lastError ? ` (${lastError.message})` : ''}`);
}

async function waitForHttp(url, label, timeout = 15000) {
  return waitFor(async () => {
    const response = await fetch(url);
    return response.ok;
  }, label, timeout);
}

class CDP {
  static async connect(wsUrl) {
    const socket = new WebSocket(wsUrl);
    const cdp = new CDP(socket);
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true });
      socket.addEventListener('error', reject, { once: true });
    });
    return cdp;
  }

  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(
        typeof event.data === 'string' ? event.data : Buffer.from(event.data).toString('utf8'),
      );
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result);
        return;
      }
      for (const listener of this.listeners.get(message.method) ?? []) {
        listener(message.params);
      }
    });
    socket.addEventListener('close', () => {
      for (const pending of this.pending.values()) {
        pending.reject(new Error('CDP socket closed'));
      }
      this.pending.clear();
    });
  }

  on(method, listener) {
    const listeners = this.listeners.get(method) ?? [];
    listeners.push(listener);
    this.listeners.set(method, listeners);
  }

  call(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (!this.pending.has(id)) return;
        this.pending.delete(id);
        reject(new Error(`CDP timeout: ${method}`));
      }, 20000);
    });
  }

  close() {
    this.socket.close();
  }
}

async function findChrome() {
  for (const candidate of CHROME_CANDIDATES) {
    if (!candidate) continue;
    try {
      await fsp.access(candidate);
      return candidate;
    } catch {
      // try the next path
    }
  }
  throw new Error('Chrome was not found at a known path');
}

async function start() {
  await fsp.mkdir(SCREENSHOT_DIR, { recursive: true });
  const preview = spawn(
    process.execPath,
    [
      path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'),
      'preview',
      '--host',
      '127.0.0.1',
      '--port',
      String(PORT),
      '--strictPort',
    ],
    { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  let previewOutput = '';
  preview.stdout.on('data', (chunk) => {
    previewOutput += chunk.toString();
  });
  preview.stderr.on('data', (chunk) => {
    previewOutput += chunk.toString();
  });

  try {
    await waitForHttp(APP_URL, 'vite preview');
  } catch (error) {
    preview.kill();
    await sleep(300);
    throw new Error(`${error.message}\nPreview output:\n${previewOutput}`);
  }

  const chromePath = await findChrome();
  const userDataDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'vigil-qa-'));
  const chrome = spawn(
    chromePath,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--disable-sync',
      '--remote-allow-origins=*',
      `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=${userDataDir}`,
      '--window-size=1024,768',
      'about:blank',
    ],
    { stdio: 'ignore' },
  );

  await waitForHttp(`http://127.0.0.1:${CDP_PORT}/json/version`, 'Chrome DevTools');
  const targets = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
  const page = targets.find((target) => target.type === 'page');
  if (!page?.webSocketDebuggerUrl) throw new Error('Chrome page target not found');
  const cdp = await CDP.connect(page.webSocketDebuggerUrl);

  return {
    cdp,
    preview,
    chrome,
    userDataDir,
    previewOutput: () => previewOutput,
    stop: async () => {
      cdp.close();
      chrome.kill();
      preview.kill();
      await sleep(300);
      await fsp.rm(userDataDir, { recursive: true, force: true }).catch(() => {});
    },
  };
}

function normalizeText(value) {
  return String(value).replace(/\s+/g, ' ').trim();
}

function phase(name) {
  process.stderr.write(`[qa] ${name}\n`);
}

async function main() {
  const session = await start();
  const { cdp } = session;
  await cdp.call('Page.enable');
  await cdp.call('Runtime.enable');
  await cdp.call('Network.enable');
  await cdp.call('Log.enable');

  cdp.on('Runtime.exceptionThrown', (params) => {
    const text = params.exceptionDetails?.exception?.description ?? params.exceptionDetails?.text ?? 'Unknown exception';
    report.consoleErrors.push(text);
  });
  cdp.on('Log.entryAdded', (params) => {
    if (params.entry?.level === 'error') report.console.push(params.entry.text ?? '');
  });
  cdp.on('Runtime.consoleAPICalled', (params) => {
    if (params.type !== 'error' && params.type !== 'warning') return;
    report.console.push(params.args?.map((arg) => arg.value ?? arg.description ?? '').join(' '));
  });

  const evaluate = async (expression, awaitPromise = false) => {
    const result = await cdp.call('Runtime.evaluate', {
      expression,
      awaitPromise,
      returnByValue: true,
      userGesture: true,
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    }
    return result.result.value;
  };

  const bodyText = async () => evaluate('document.body.innerText');

  const setViewport = async (width, height) => {
    await cdp.call('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 600,
      screenWidth: width,
      screenHeight: height,
    });
    await sleep(250);
  };

  const go = async (hash, expectedHeading) => {
    await evaluate(`location.hash = ${JSON.stringify(hash)}`);
    await waitFor(async () => {
      const heading = await evaluate(`document.querySelector('h1')?.innerText ?? ''`);
      return (
        heading.length > 0 &&
        !heading.includes('Something went wrong') &&
        (!expectedHeading || heading.includes(expectedHeading))
      );
    }, `route ${hash}${expectedHeading ? ` heading ${expectedHeading}` : ''}`);
    await sleep(350);
  };

  const clickText = async (text) => {
    const clicked = await evaluate(`(() => {
      const wanted = ${JSON.stringify(text)};
      const elements = [...document.querySelectorAll('button, a')];
      const element = elements.find((candidate) => candidate.innerText.replace(/\\s+/g, ' ').trim() === wanted);
      if (!element) return false;
      element.click();
      return true;
    })()`);
    if (!clicked) throw new Error(`Clickable text not found: ${text}`);
    await sleep(200);
  };

  const clickButton = clickText;

  const selectValue = async (selector, value) => {
    const changed = await evaluate(`(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      if (!element) return false;
      const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
      setter.call(element, ${JSON.stringify(value)});
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`);
    if (!changed) throw new Error(`Select not found: ${selector}`);
    await sleep(500);
  };

  const setText = async (selector, value) => {
    const changed = await evaluate(`(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      if (!element) return false;
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(element, ${JSON.stringify(String(value))});
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`);
    if (!changed) throw new Error(`Input not found: ${selector}`);
    await sleep(150);
  };

  const setRange = async (selector, value) => {
    const changed = await evaluate(`(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      if (!element) return false;
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(element, ${JSON.stringify(String(value))});
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`);
    if (!changed) throw new Error(`Range not found: ${selector}`);
    await sleep(150);
  };

  const clickRadio = async (selector) => {
    const clicked = await evaluate(`(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      if (!element) return false;
      element.click();
      return true;
    })()`);
    if (!clicked) throw new Error(`Radio not found: ${selector}`);
    await sleep(800);
  };

  const setSupply = async (labelText, aboard) => {
    const result = await evaluate(`(() => {
      const label = [...document.querySelectorAll('label')].find((candidate) =>
        candidate.innerText.includes(${JSON.stringify(labelText)}),
      );
      const input = label?.querySelector('input[type="checkbox"]');
      if (!input) return null;
      if (input.checked !== ${Boolean(aboard)}) input.click();
      return input.checked;
    })()`);
    if (result === null) throw new Error(`Supply checkbox not found: ${labelText}`);
    await sleep(350);
    return result;
  };

  const cardData = async () =>
    evaluate(`(() => {
      const tiles = [...document.querySelectorAll('button[data-attention-title]')].map((tile) => ({
        title: tile.getAttribute('data-attention-title') ?? '',
        text: tile.innerText,
      }));
      const articles = [...document.querySelectorAll('article')]
        .filter((article) => article.querySelector('h2[id^="card-title-"]'))
        .map((article) => ({
          title: article.querySelector('h2[id^="card-title-"]').innerText.trim(),
          text: article.innerText,
        }));
      return [...tiles, ...articles];
    })()`);

  const openAttention = async (titlePart) => {
    const opened = await evaluate(`(() => {
      const tile = [...document.querySelectorAll('button[data-attention-title]')]
        .find((candidate) => (candidate.getAttribute('data-attention-title') ?? '').includes(${JSON.stringify(titlePart)}));
      if (!tile) return false;
      tile.click();
      return true;
    })()`);
    if (!opened) throw new Error(`Attention tile not found: ${titlePart}`);
    await waitFor(async () => await evaluate(`Boolean(document.querySelector('[role="dialog"]'))`), `attention dialog: ${titlePart}`);
  };

  const attentionText = async () =>
    evaluate(`document.querySelector('[role="dialog"]')?.innerText ?? ''`);

  const closeAttention = async () => {
    const closed = await evaluate(`(() => {
      const close = document.querySelector('[role="dialog"] button[aria-label="Close alert details"]');
      if (!close) return false;
      close.click();
      return true;
    })()`);
    if (!closed) throw new Error('Attention detail close button not found');
    await waitFor(async () => !(await evaluate(`Boolean(document.querySelector('[role="dialog"]'))`)), 'attention detail close');
  };

  const horizontal = async () =>
    evaluate(`(() => {
      const offenders = [...document.querySelectorAll('body *')]
        .map((element) => {
          const bounds = element.getBoundingClientRect();
          return {
            tag: element.tagName.toLowerCase(),
            id: element.id,
            className: typeof element.className === 'string' ? element.className.slice(0, 120) : '',
            text: (element.innerText || '').trim().slice(0, 80),
            left: Math.round(bounds.left),
            right: Math.round(bounds.right),
            width: Math.round(bounds.width)
          };
        })
        .filter((item) => item.right > window.innerWidth + 1 || item.left < -1)
        .slice(0, 12);
      return {
        innerWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        offenders
      };
    })()`);

  const screenshot = async (name, fullPage = true) => {
    let params = { format: 'png', fromSurface: true };
    if (fullPage) {
      const metrics = await cdp.call('Page.getLayoutMetrics');
      const size = metrics.cssContentSize;
      params = {
        ...params,
        captureBeyondViewport: true,
        clip: {
          x: 0,
          y: 0,
          width: Math.max(1, Math.ceil(size.width)),
          height: Math.max(1, Math.ceil(size.height)),
          scale: 1,
        },
      };
    }
    const result = await cdp.call('Page.captureScreenshot', params);
    const file = path.join(SCREENSHOT_DIR, name);
    fs.writeFileSync(file, Buffer.from(result.data, 'base64'));
    report.screenshots.push(path.relative(ROOT, file));
  };

  const captureElement = async (name, selector) => {
    const rect = await evaluate(`(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      if (!element) return null;
      const bounds = element.getBoundingClientRect();
      return { x: bounds.left + window.scrollX, y: bounds.top + window.scrollY, width: bounds.width, height: bounds.height };
    })()`);
    if (!rect) throw new Error(`Screenshot element not found: ${selector}`);
    const result = await cdp.call('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true,
      captureBeyondViewport: true,
      clip: { ...rect, scale: 1 },
    });
    const file = path.join(SCREENSHOT_DIR, name);
    fs.writeFileSync(file, Buffer.from(result.data, 'base64'));
    report.screenshots.push(path.relative(ROOT, file));
  };

  const dbCounts = async () =>
    evaluate(`new Promise((resolve, reject) => {
      const request = indexedDB.open('vigil-db');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const stores = ['entries', 'checkins', 'log'];
        const counts = {};
        let remaining = stores.length;
        for (const storeName of stores) {
          const count = db.transaction(storeName, 'readonly').objectStore(storeName).count();
          count.onerror = () => reject(count.error);
          count.onsuccess = () => {
            counts[storeName] = count.result;
            remaining -= 1;
            if (remaining === 0) {
              db.close();
              resolve(counts);
            }
          };
        }
      };
    })`, true);

  async function waitForApp() {
    await waitFor(async () => {
      const heading = await evaluate(`document.querySelector('h1')?.innerText ?? ''`);
      const ready = await evaluate('document.readyState');
      return ready === 'complete' && heading.length > 0 && !heading.includes('Something went wrong');
    }, 'app shell');
  }

  async function reloadAndWait() {
    await cdp.call('Page.reload', { ignoreCache: false });
    await waitForApp();
    await sleep(300);
  }

  try {
    phase('preview and Chrome ready');
    await setViewport(1024, 768);
    await cdp.call('Page.navigate', { url: APP_URL });
    await waitForApp();
    await waitFor(async () => (await bodyText()).includes('Crew 1 · Day 120'), 'initial demo state');
    record('initial demo state is Crew 1, day 120', true);

    let serviceWorkerState = 'not-registered';
    try {
      serviceWorkerState = await evaluate('navigator.serviceWorker.ready.then((registration) => registration.active?.state ?? "none")', true);
      await reloadAndWait();
      serviceWorkerState = await evaluate('navigator.serviceWorker.controller ? "controlled" : "not-controlled"');
    } catch (error) {
      record('service worker registration', false, String(error));
    }
    record('service worker controls the page', serviceWorkerState === 'controlled', serviceWorkerState);

    phase('initial state and service worker checked');
    await screenshot('today-1024.png');
    const desktopWidth = await horizontal();
    record('1024px layout has no horizontal scroll', desktopWidth.scrollWidth <= desktopWidth.innerWidth + 1, desktopWidth);

    await clickButton('Play demo story');
    await waitFor(async () => (await bodyText()).includes('Several measures shifted together'), 'demo pattern card');
    const demoText = await bodyText();
    record('demo story shows a review pattern card', demoText.includes('Several measures shifted together'));
    await openAttention('Several measures shifted together');
    await waitFor(async () => (await attentionText()).includes('Reply expected in at least 34 minutes'), 'attention detail modal');
    const dialogText = await attentionText();
    record('deep-space review card shows 34-minute reply', dialogText.includes('34 minutes') && dialogText.includes('Reply expected in at least 34 minutes'));
    await sleep(350);
    await screenshot('alert-card-1024.png');
    record('alert card screenshot captured', fs.existsSync(path.join(SCREENSHOT_DIR, 'alert-card-1024.png')));
    await closeAttention();
    record('attention detail modal closes', true);

    phase('demo and crew scenarios checked');
    await selectValue('#crew-select', 'crew-2');
    await waitFor(async () => (await bodyText()).includes('Crew 2 · Day 120'), 'Crew 2');
    await waitFor(async () => !(await bodyText()).includes('Several measures shifted together'), 'Crew 2 no demo pattern');
    const crew2Cards = await cardData();
    record('Crew 2 has no review or urgent card', !crew2Cards.some((card) => /Review|Urgent/.test(card.text)), crew2Cards.map((card) => card.title));

    await selectValue('#crew-select', 'crew-3');
    await waitFor(async () => (await bodyText()).includes('Crew 3 · Day 120'), 'Crew 3');
    const crew3At120 = await cardData();
    report.knownIssues.push({
      id: 'TASKS-8-2-crew-3-day-120',
      note: 'TASKS section 8 item 2 expects a Crew 3 spike card at day 120. ARCHITECTURE 6.6 keeps isolated_spike only on the spike day, so day 120 is clear. The spike card is verified at the scenario day (day 91) instead of changing detector semantics.',
      day120Titles: crew3At120.map((card) => card.title),
    });
    await setRange('#mission-day-scrubber', 91);
    await waitFor(async () => (await bodyText()).includes('Day 91'), 'Crew 3 scenario day');
    await waitFor(async () => (await cardData()).some((card) => card.title.includes('one reading stands out')), 'Crew 3 spike card at day 91');
    const crew3Cards = await cardData();
    record('Crew 3 shows a spike card and no review card at the sensor-fault day', crew3Cards.some((card) => card.title.includes('one reading stands out')) && !crew3Cards.some((card) => /Review|Urgent/.test(card.text)), crew3Cards.map((card) => card.title));
    await setRange('#mission-day-scrubber', 120);
    await waitFor(async () => (await bodyText()).includes('Day 120'), 'restore day 120');

    await clickButton('Play demo story');
    await waitFor(async () => (await bodyText()).includes('Crew 1 · Day 120'), 'demo reset for mission test');
    phase('mission, supply, check-in, and log checked');
    await go('#/mission', 'Mission context');
    await clickRadio('input[name="mission-setting"][value="station"]');
    await waitFor(async () => evaluate('document.querySelector(\'input[name="mission-setting"][value="station"]\')?.checked === true'), 'station selected');
    await go('#/');
    await waitFor(async () => (await bodyText()).includes('Several measures shifted together'), 'station demo card');
    await openAttention('Several measures shifted together');
    await waitFor(async () => (await attentionText()).includes('Ask the flight surgeon for a call today.'), 'station escalation');
    const stationText = await attentionText();
    record('station setting changes escalation text', stationText.includes('Ask the flight surgeon for a call today.'));
    record('station setting removes the deep-space reply line', !stationText.includes('Reply expected in at least 34 minutes.'));
    await closeAttention();

    await go('#/mission', 'Mission context');
    await clickRadio('input[name="mission-setting"][value="deep_space"]');
    await waitFor(async () => evaluate('document.querySelector(\'input[name="mission-setting"][value="deep_space"]\')?.checked === true'), 'deep space selected');
    const supplyState = await setSupply('Blood pressure cuff', false);
    record('blood pressure cuff can be marked unavailable', supplyState === false);
    await go('#/');
    await waitFor(async () => (await bodyText()).includes('Several measures shifted together'), 'cuff demo card');
    await openAttention('Several measures shifted together');
    await waitFor(async () => (await attentionText()).includes('No Blood pressure cuff aboard'), 'cuff alternative');
    const alternativeText = await attentionText();
    record('missing cuff shows an alternative action', alternativeText.includes('cuff reading is not available') && alternativeText.includes('No Blood pressure cuff aboard'));
    await closeAttention();

    await go('#/checkin', 'How are you feeling');
    await setRange('#mood-slider', 1);
    await setRange('#stress-slider', 5);
    const sliderText = await evaluate(`document.querySelector('#mood-slider')?.getAttribute('aria-valuetext')`);
    record('check-in sliders expose aria-valuetext', typeof sliderText === 'string' && sliderText.includes('Mood rating'));
    await clickButton('Save check-in');
    await waitFor(async () => (await bodyText()).includes('It looks like today is hard.'), 'support check-in');
    record('mood 1 and stress 5 show support message', true);
    await clickButton('I need help now');
    await waitFor(async () => (await bodyText()).includes('Get help now'), 'urgent screen');
    const urgentText = await bodyText();
    record('urgent screen opens and shows deep-space line', urgentText.includes('A reply from ground may take a while'));

    await go('#/log', 'Measurements and trends');
    await setText('#input-bp_sys', 185);
    await setText('#input-bp_dia', 95);
    await waitFor(async () => (await bodyText()).includes('Urgent attention'), 'BP urgent callout');
    record('BP 185 / 95 shows urgent callout', true);
    await clickButton('Save measurements');
    await waitFor(async () => (await bodyText()).includes('Saved for day 120'), 'BP save');

    phase('lab, proof, journal, and reset checked');
    await go('#/lab', 'Scenario Lab');
    await clickButton('Inject: sensor fault');
    await waitFor(async () => (await bodyText()).includes('Day 91'), 'sensor fault day');
    const labCards = await cardData();
    const labTable = await evaluate(`document.querySelector('table')?.innerText ?? ''`);
    record('Scenario Lab sensor fault has no review card', !labCards.some((card) => /Review|Urgent/.test(card.text)), labCards.map((card) => card.title));
    record('Scenario Lab shows the three-system table', labTable.includes('Vigil') && labTable.includes('Fixed thresholds') && labTable.includes('Rolling z-score'));

    await go('#/proof', 'Algorithmic proof');
    await waitFor(async () => (await bodyText()).includes('0.69'), 'Proof results');
    const proofText = await bodyText();
    record('Proof page renders harness numbers', proofText.includes('0.69') && proofText.includes('0.84'));

    await go('#/journal', 'Record what happened');
    await setText('#journal-obs', 'QA reset check');
    await setText('#journal-action', 'Recorded for checklist');
    await clickButton('Add journal entry');
    await waitFor(async () => (await bodyText()).includes('Saved for day 120.'), 'journal save');
    const countsBeforeReset = await dbCounts();
    record('entries, check-ins, and journal records exist before reset', countsBeforeReset.entries > 0 && countsBeforeReset.checkins > 0 && countsBeforeReset.log > 0, countsBeforeReset);

    await go('#/mission', 'Mission context');
    await evaluate('window.confirm = () => true');
    await clickButton('Reset demo data');
    await waitFor(async () => (await bodyText()).includes('Crew 1 · Day 120'), 'reset returns to Today');
    const countsAfterReset = await dbCounts();
    record('reset clears entries, check-ins, and journal', countsAfterReset.entries === 0 && countsAfterReset.checkins === 0 && countsAfterReset.log === 0, countsAfterReset);

    phase('offline and route checks');
    await waitFor(async () => (await evaluate('navigator.serviceWorker.ready.then(() => true)')), 'service worker ready after reset');
    try {
      await cdp.call('Network.emulateNetworkConditions', {
        offline: true,
        latency: 0,
        downloadThroughput: 0,
        uploadThroughput: 0,
        connectionType: 'none',
      });
      await reloadAndWait();
      const offlineText = await bodyText();
      record('offline reload renders Today', offlineText.includes('Today') && offlineText.includes('Crew 1 · Day 120'));
      const offlineRoutes = ['#/log', '#/checkin', '#/urgent', '#/lab', '#/proof', '#/mission', '#/journal', '#/about', '#/domain/cardiovascular'];
      for (const hash of offlineRoutes) {
        await go(hash);
      }
      record('all routes load while offline', true);
    } catch (error) {
      record('offline reload and routes', false, String(error));
    } finally {
      await cdp.call('Network.emulateNetworkConditions', {
        offline: false,
        latency: 0,
        downloadThroughput: -1,
        uploadThroughput: -1,
        connectionType: 'wifi',
      }).catch(() => {});
    }

    await go('#/about', 'About');
    const aboutText = await bodyText();
    const forbidden = /\b(diagnos\w*|disease|you have|risk score|probability of|predict\w*|AI doctor)\b/i;
    record('About page has no forbidden clinical language outside quoted risk names', !forbidden.test(aboutText));

    await go('#/');
    const rootText = await bodyText();
    record('Today has no forbidden clinical language', !forbidden.test(rootText));

    phase('responsive, focus, and touch-target checks');
    await setViewport(390, 844);
    await go('#/');
    await screenshot('today-390.png');
    const mobileWidth = await horizontal();
    record('390px layout has no horizontal scroll', mobileWidth.scrollWidth <= mobileWidth.innerWidth + 1, mobileWidth);
    const mobileRoutes = ['#/log', '#/checkin', '#/urgent', '#/lab', '#/proof', '#/mission', '#/journal', '#/about', '#/domain/cardiovascular'];
    for (const hash of mobileRoutes) {
      await go(hash);
      const width = await horizontal();
      record(`390px ${hash} has no horizontal scroll`, width.scrollWidth <= width.innerWidth + 1, width);
    }

    await setViewport(1024, 768);
    await go('#/');
    await screenshot('today-1024-final.png');
    const finalDesktopWidth = await horizontal();
    record('1024px final layout has no horizontal scroll', finalDesktopWidth.scrollWidth <= finalDesktopWidth.innerWidth + 1, finalDesktopWidth);

    await go('#/log', 'Measurements and trends');
    const focusedAfterRoute = await evaluate(`({ tag: document.activeElement?.tagName ?? '', text: document.activeElement?.innerText?.trim() ?? '' })`);
    record('route change focuses the screen title', focusedAfterRoute.tag === 'H1', focusedAfterRoute);

    await go('#/');
    const keyboardOpened = await evaluate(`(() => {
      const region = document.querySelector('button[aria-label^="Heart and blood pressure"]');
      if (!region) return false;
      region.focus();
      region.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      return true;
    })()`);
    if (keyboardOpened) {
      await waitFor(async () => (await evaluate(`document.querySelector('h1')?.innerText ?? ''`)).includes('Heart and blood pressure'), 'body map keyboard');
      record('body map keyboard Enter opens the domain', true);
    } else {
      record('body map keyboard Enter opens the domain', false, 'region not found');
    }

    const touchTargets = await evaluate(`(() => {
      const elements = [...document.querySelectorAll('button, a, input, select, textarea, [role="button"]')];
      return elements
        .filter((element) => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          // The skip link is deliberately 1x1 until it receives keyboard focus.
          if (element.classList.contains('sr-only-focusable') && !element.matches(':focus')) return false;
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        })
        .map((element) => ({
          label: element.innerText?.trim().slice(0, 30) || element.getAttribute('aria-label') || element.id || element.tagName,
          width: Math.round(element.getBoundingClientRect().width),
          height: Math.round(element.getBoundingClientRect().height)
        }))
        .filter((target) => target.width < 44 || target.height < 44);
    })()`);
    record('visible controls meet the 44px touch-target rule', touchTargets.length === 0, touchTargets.slice(0, 12));

    record('no runtime exceptions', report.consoleErrors.length === 0, report.consoleErrors.slice(0, 5));
    record('no browser console errors', report.console.length === 0, report.console.slice(0, 5));
  } finally {
    await session.stop();
  }

  report.finishedAt = new Date().toISOString();
  report.passed = report.failures.length === 0;
  writeReport();
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exitCode = report.passed ? 0 : 1;
}

main().catch((error) => {
  report.finishedAt = new Date().toISOString();
  report.passed = false;
  report.error = error.stack ?? String(error);
  writeReport();
  process.stderr.write(`${report.error}\n`);
  process.exitCode = 2;
});
