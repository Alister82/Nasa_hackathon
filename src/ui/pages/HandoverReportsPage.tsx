import React, { useState } from 'react';
import { useAppState } from '@/app/AppState';
import { INDICATORS } from '@/contracts/indicators';
import { expectedReplyMinutes, MISSION_SETTINGS } from '@/guidance';
import {
  FileText,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Radio,
  Send,
} from 'lucide-react';

export function HandoverReportsPage() {
  const { crewId, crewName, viewDay, analysis, cards, missionSetting } = useAppState();
  const [reportNote, setReportNote] = useState('');
  const [transmitted, setTransmitted] = useState(false);

  const settingMeta = MISSION_SETTINGS[missionSetting];
  const replyTime = expectedReplyMinutes(missionSetting);

  const vitalsSummary = INDICATORS.map((meta) => {
    const ind = analysis?.indicators[meta.id];
    const base = analysis?.baselines[meta.id];
    const points = ind?.points.filter((p) => p.value !== null) ?? [];
    const recent = points.slice(-7);
    const mean =
      recent.length > 0
        ? recent.reduce((sum, p) => sum + (p.value ?? 0), 0) / recent.length
        : null;

    return {
      label: meta.label,
      unit: meta.unit,
      latest: ind?.lastValue ?? null,
      recentMean: mean !== null ? mean.toFixed(meta.decimals) : '—',
      baseline: base ? `${base.median.toFixed(meta.decimals)} ± ${base.sigma.toFixed(meta.decimals)}` : '—',
      status: ind?.status ?? 'ok',
    };
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    const packet = {
      protocol: 'NASA-EIMO-SF-v2',
      generatedAt: new Date().toISOString(),
      crewId,
      crewName,
      missionDay: viewDay,
      missionSetting,
      oneWayDelayMinutes: settingMeta.oneWayDelayMinutes,
      expectedReplyMinutes: replyTime,
      activeFindings: cards.map((c) => ({
        id: c.id,
        severity: c.severity,
        title: c.title,
        observation: c.observation,
        evidence: c.evidence,
        actions: c.recommendedActions,
      })),
      vitalsSummary,
      astronautNote: reportNote,
    };

    const blob = new Blob([JSON.stringify(packet, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vigil-handover-day${viewDay}-${crewId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTransmit = () => {
    setTransmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
              Store-and-Forward Telemetry
            </span>
            <span className="text-xs text-ink-soft">
              Day {viewDay} • Latency: {settingMeta.oneWayDelayMinutes} min
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight mt-1 flex items-center gap-2">
            <FileText className="w-7 h-7 text-accent-primary" />
            <span>Flight-Surgeon Handover Report</span>
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-panel border border-line hover:bg-panel-hover text-ink text-xs font-bold shadow-sm transition-all min-h-[44px]"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadJson}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-panel border border-line hover:bg-panel-hover text-ink text-xs font-bold shadow-sm transition-all min-h-[44px]"
          >
            <Download className="w-4 h-4" />
            <span>JSON Packet</span>
          </button>
          <button
            type="button"
            onClick={handleTransmit}
            disabled={transmitted}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-primary text-panel text-xs font-bold shadow-md hover:opacity-95 transition-all min-h-[44px] disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{transmitted ? 'Packet Queued in Uplink' : 'Send to Ground Queue'}</span>
          </button>
        </div>
      </div>

      {transmitted && (
        <div className="p-4 bg-accent-teal/10 border border-accent-teal/30 rounded-2xl text-xs text-accent-teal flex items-center gap-2 print:hidden">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>
            Handover package successfully encoded and placed into store-and-forward telemetry uplink queue. Estimated flight surgeon receipt: ~{settingMeta.oneWayDelayMinutes} minutes.
          </span>
        </div>
      )}

      {/* Printable Report Document Sheet */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-line shadow-card space-y-6 print:shadow-none print:border-none print:p-0">
        {/* Document Header */}
        <div className="border-b border-line pb-4 flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <div className="text-xs uppercase font-extrabold tracking-widest text-accent-primary">
              Vigil Flight Deck • Medical Telemetry Handover
            </div>
            <h2 className="text-xl font-extrabold text-ink mt-0.5">
              Mission Day {viewDay} Telemetry Package
            </h2>
            <div className="text-xs text-ink-soft mt-1">
              Subject: <strong className="text-ink">{crewName} ({crewId})</strong> | Mission setting: <strong className="text-ink capitalize">{missionSetting.replace('_', ' ')}</strong>
            </div>
          </div>

          <div className="text-xs text-ink-soft text-right space-y-0.5">
            <div>One-way light time: <strong className="text-ink">{settingMeta.oneWayDelayMinutes} min</strong></div>
            <div>Expected round-trip reply: <strong className="text-ink">≥ {replyTime} min</strong></div>
            <div>Generated: <span className="tabular-nums font-mono">{new Date().toISOString().slice(0, 19)}Z</span></div>
          </div>
        </div>

        {/* Section 1: Active Findings */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-ink-soft flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-accent-primary" />
            <span>Active Findings & Decision Support Items ({cards.length})</span>
          </h3>

          {cards.length === 0 ? (
            <div className="p-4 rounded-xl bg-panel/60 border border-line/60 text-xs text-ink-soft">
              No active findings on Day {viewDay}. All physiological signals remain within baseline parameters.
            </div>
          ) : (
            <div className="space-y-3">
              {cards.map((c) => (
                <div key={c.id} className="p-4 rounded-2xl bg-panel/70 border border-line/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-ink">{c.title}</span>
                    <span className="font-bold px-2 py-0.5 rounded-full uppercase text-[10px] bg-accent-primary/10 text-accent-primary">
                      {c.severity}
                    </span>
                  </div>
                  <p className="text-ink leading-relaxed">{c.observation}</p>
                  <div className="text-ink-soft">
                    <strong className="text-ink">Escalation advice:</strong> {c.escalation.text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: 7-Day Longitudinal Vitals */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-ink-soft flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent-teal" />
            <span>7-Day Telemetry Averages vs Pre-Flight Baseline</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-line text-ink-soft font-bold bg-panel/40">
                  <th className="py-2.5 px-3">Indicator</th>
                  <th className="py-2.5 px-3 text-right">Latest</th>
                  <th className="py-2.5 px-3 text-right">7-Day Mean</th>
                  <th className="py-2.5 px-3 text-right">Baseline Median</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60 tabular-nums">
                {vitalsSummary.map((item) => (
                  <tr key={item.label} className="hover:bg-panel/40">
                    <td className="py-2 px-3 font-semibold text-ink">{item.label}</td>
                    <td className="py-2 px-3 text-right text-ink font-bold">
                      {item.latest !== null ? `${item.latest} ${item.unit}` : '—'}
                    </td>
                    <td className="py-2 px-3 text-right text-ink">
                      {item.recentMean !== '—' ? `${item.recentMean} ${item.unit}` : '—'}
                    </td>
                    <td className="py-2 px-3 text-right text-ink-soft">{item.baseline} {item.unit}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        item.status === 'flagged' ? 'bg-status-review/20 text-status-review' :
                        item.status === 'watch' ? 'bg-status-watch/20 text-status-watch' :
                        'bg-status-ok/20 text-status-ok'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Astronaut Annotations */}
        <div className="space-y-2 pt-2 border-t border-line">
          <label htmlFor="report-notes" className="text-xs font-bold text-ink flex items-center gap-2">
            <span>Astronaut Operational Context & Mission Notes:</span>
          </label>
          <textarea
            id="report-notes"
            rows={3}
            value={reportNote}
            onChange={(e) => setReportNote(e.target.value)}
            placeholder="Document sleep schedule shifts, EVA exertion, symptoms, or consumable status for flight surgeon review..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-panel text-ink text-xs focus:ring-2 focus:ring-accent-primary outline-none"
          />
        </div>

        {/* Legal & Medical Verification Footer */}
        <div className="text-[11px] text-ink-soft/80 border-t border-line/60 pt-4 flex flex-col sm:flex-row justify-between gap-2">
          <div>Autonomous decision support protocol. Not an automated diagnosis device.</div>
          <div className="font-mono">NASA Space Apps Challenge 2026 • Vigil</div>
        </div>
      </div>
    </div>
  );
}
