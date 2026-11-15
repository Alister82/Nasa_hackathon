import React from 'react';
import { Activity, ExternalLink, Radio, Satellite, Stethoscope, Waves } from '@/ui/components/icons';
import { MISSION_SETTINGS, SOURCES } from '@/guidance';

const GROUNDING = [
  {
    title: 'NASA OSDR, OSD-530 & SOMA',
    icon: Activity,
    body: 'OSD-530 is the JAXA Cell-Free Epigenome study: plasma cell-free RNA from six astronauts. SOMA combines longitudinal pre-, in-, and post-flight omics across missions; examples range from the 3-day Inspiration4 flight to the 340-day NASA Twins Study. These are valuable research resources, but OSD-530 is not continuous cardiovascular or wearable telemetry, and sampling schedules differ by study. Vigil uses synthetic daily values and does not ingest these datasets.',
    sources: ['src_osd_530', 'src_nasa_osdr', 'src_soma_atlas', 'src_nasa_twins_i4'],
  },
  {
    title: 'CSA / NASA Bio-Monitor telemetry architecture',
    icon: Satellite,
    body: 'The Bio-Monitor smart garment, headband, and tablet system records pulse/electrical heart activity, blood pressure, breathing rate and volume, skin temperature, blood oxygen saturation, and physical activity, with data sent to ground. Vigil models generic independent missingness (2% for ordinary indicators, 1% for radiation); those are simulator assumptions, not measured motion-artifact dropout rates. The prototype does not claim a validated 7-channel ingest or motion-artifact rejection pipeline.',
    sources: ['src_csa_biomonitor'],
  },
  {
    title: 'ExMC Earth-Independent Medical Operations (EIMO)',
    icon: Stethoscope,
    body: 'Russell et al. describe a commonly non-physician CMO with approximately 40 hours of medical training and exploration missions with communication delays exceeding 20 minutes one way. NASA ExMC’s IMPACT tool evaluates medical capability trade spaces, including resource constraints. Vigil borrows the workflow goals—guided procedures, explicit inventory status, and a structured asynchronous packet—but is not a validated NASA CDSS, does not transmit telemetry, and does not execute IMPACT logic.',
    sources: ['src_eimo_cdss', 'src_exmc_hrp_48036', 'src_nasa_mars_owlt'],
  },
  {
    title: 'Empirical simulation calibration',
    icon: Waves,
    body: 'Sleep uses NASA ISS actigraphy group means: 6.41 h at the baseline assessment, 5.86 h 11 days before launch, and 6.09 h in flight (aggregate SD 0.67 h). These are period-level anchors; applying the in-flight SD to synthetic daily values is an explicit approximation. The cited NASA CIRCA results do not support a generic HR/BP shift, so the model has no blanket cardiovascular adaptation offset. Other crew baselines, variation, temporal correlation, missingness, and scenario effects remain labeled simulation assumptions; no individual NASA telemetry is reproduced.',
    sources: ['src_nasa_sleep_actigraphy', 'src_nasa_circa'],
  },
];

export function ScientificGroundingPanel() {
  return (
    <section aria-labelledby="scientific-grounding-heading" className="panel overflow-hidden">
      <header className="border-b border-line/80 bg-surface2/50 px-4 py-3">
        <h2 id="scientific-grounding-heading" className="font-display text-[0.9rem] font-semibold tracking-[-0.02em] text-ink">
          Scientific Grounding &amp; NASA OSDR / ExMC Architecture
        </h2>
        <p className="mt-1 text-[0.68rem] leading-relaxed text-ink-soft">
          Sources inform the prototype&apos;s design. Crew records, detector outputs, and mission rates shown by Vigil are simulated; they are not derived clinical predictions or NASA telemetry.
        </p>
      </header>

      <div className="grid gap-0 divide-y divide-line/70 lg:grid-cols-4 lg:divide-x lg:divide-y-0">
        {GROUNDING.map(({ title, icon: Icon, body, sources }) => (
          <article key={title} className="p-4">
            <h3 className="flex items-center gap-2 text-[0.74rem] font-semibold text-ink">
              <Icon className="h-4 w-4 shrink-0 text-instrument" aria-hidden="true" />
              {title}
            </h3>
            <p className="mt-2 text-[0.68rem] leading-relaxed text-ink-2">{body}</p>
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
              {sources.map((id) => {
                const source = SOURCES[id];
                if (!source?.url) return null;
                return (
                  <a
                    key={id}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[32px] items-center gap-1 text-[0.62rem] font-semibold text-instrument hover:underline"
                  >
                    {source.id === 'src_osd_530' ? 'OSD-530 record' : source.id === 'src_eimo_cdss' ? 'EIMO paper' : source.id === 'src_exmc_hrp_48036' ? 'HRP-48036' : source.id === 'src_nasa_mars_owlt' ? 'NASA OWLT' : source.id === 'src_nasa_twins_i4' ? 'NASA mission datasets' : source.title}
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                );
              })}
            </div>
          </article>
        ))}
      </div>

      <div className="border-t border-line/80 bg-surface2/35 px-4 py-3">
        <h3 className="flex items-center gap-2 text-[0.72rem] font-semibold text-ink">
          <Radio className="h-3.5 w-3.5 text-instrument" aria-hidden="true" />
          Radiation setting references
        </h3>
        <ul className="mt-2 grid gap-2 md:grid-cols-3">
          {Object.values(MISSION_SETTINGS).map((setting) => {
            const source = SOURCES[setting.radiationSourceId];
            return (
              <li key={setting.id} className="rounded-[10px] border border-line/75 bg-surface2 p-2.5 text-[0.64rem] leading-relaxed text-ink-soft">
                <span className="font-semibold text-ink">{setting.label}: {setting.radiationRateMsvPerDay} mSv/day (simulator setting).</span>{' '}
                {setting.radiationBenchmark}{' '}
                {source?.url && <a href={source.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-instrument hover:underline">Source</a>}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
