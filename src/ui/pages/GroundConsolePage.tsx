import React, { useState } from 'react';
import { useAppState } from '@/app/AppState';
import { MISSION_SETTINGS, expectedReplyMinutes } from '@/guidance';
import {
  Radio,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  FileText,
  Activity,
  ShieldCheck,
  User,
} from 'lucide-react';

export function GroundConsolePage() {
  const { crewId, crewName, viewDay, missionSetting, cards } = useAppState();
  const settingMeta = MISSION_SETTINGS[missionSetting];
  const replyTime = expectedReplyMinutes(missionSetting);

  const [surgeonNote, setSurgeonNote] = useState('');
  const [advisorySent, setAdvisorySent] = useState(false);

  const handleSendAdvisory = () => {
    if (!surgeonNote.trim()) return;
    setAdvisorySent(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-accent-teal/10 text-accent-teal border border-accent-teal/20">
              Ground Station Console
            </span>
            <span className="text-xs text-ink-soft">
              Deep Space Network Node 42 • Earth-Independent Medical Operations (EIMO)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight mt-1 flex items-center gap-2.5">
            <Radio className="w-7 h-7 text-accent-teal animate-pulse" />
            <span>Flight Surgeon Console</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-panel border border-line text-xs flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent-primary" />
            <span>Downlink delay: <strong className="text-ink font-bold tabular-nums">{settingMeta.oneWayDelayMinutes} min</strong></span>
          </div>
        </div>
      </div>

      {/* Comms Link Status Banner */}
      <div className="glass-panel p-5 rounded-3xl border border-line shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-accent-teal/10 border border-accent-teal/20 flex items-center justify-center text-accent-teal flex-shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-ink">
              Store-and-Forward Telemetry Link Active
            </h3>
            <p className="text-xs text-ink-soft">
              Observing {crewName} ({crewId}) on Day {viewDay}. Round-trip communication window: {replyTime} minutes minimum.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 text-xs">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-status-ok animate-ping" />
          <span className="font-bold text-ink">DSN Uplink Locked</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Received Telemetry Packets */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel p-5 rounded-3xl border border-line shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-ink flex items-center gap-2">
                <FileText className="w-4 h-4 text-accent-primary" />
                <span>Received Downlink Packets</span>
              </h3>
              <span className="text-xs text-ink-soft font-mono">Day {viewDay} Telemetry</span>
            </div>

            <div className="space-y-3">
              {cards.length === 0 ? (
                <div className="p-4 rounded-2xl bg-panel/70 border border-line/60 text-xs text-ink-soft text-center">
                  All physiological telemetry packets indicate baseline stability on Day {viewDay}.
                </div>
              ) : (
                cards.map((c) => (
                  <div key={c.id} className="p-4 rounded-2xl bg-panel/70 border border-line/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-ink">{c.title}</span>
                      <span className="font-bold px-2 py-0.5 rounded-full uppercase text-[10px] bg-accent-primary/10 text-accent-primary">
                        {c.severity}
                      </span>
                    </div>
                    <p className="text-ink leading-relaxed">{c.observation}</p>
                    <div className="text-ink-soft pt-1 border-t border-line/50">
                      <strong>Escalation text:</strong> {c.escalation.text}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Flight Surgeon Uplink Directives */}
        <div className="space-y-4">
          <div className="glass-panel p-5 rounded-3xl border border-line shadow-card space-y-4">
            <div>
              <h3 className="font-bold text-base text-ink flex items-center gap-2">
                <User className="w-4 h-4 text-accent-primary" />
                <span>Flight Surgeon Uplink Advisory</span>
              </h3>
              <p className="text-xs text-ink-soft mt-0.5">
                Send ground directives to astronaut onboard journal and guidance queue.
              </p>
            </div>

            <div className="space-y-2">
              <textarea
                rows={4}
                value={surgeonNote}
                onChange={(e) => setSurgeonNote(e.target.value)}
                placeholder="Enter flight surgeon guidance, countermeasure modifications, or repeat measurement orders..."
                className="w-full p-3 rounded-xl border border-line bg-panel text-ink text-xs focus:ring-2 focus:ring-accent-primary outline-none"
              />

              <button
                type="button"
                onClick={handleSendAdvisory}
                disabled={!surgeonNote.trim() || advisorySent}
                className="w-full py-2.5 px-4 rounded-xl bg-accent-primary text-panel font-bold text-xs shadow-md hover:opacity-95 transition-all min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{advisorySent ? 'Advisory In Transit' : 'Transmit Advisory Packet'}</span>
              </button>
            </div>

            {advisorySent && (
              <div className="p-3 bg-accent-teal/10 border border-accent-teal/30 rounded-xl text-xs text-accent-teal space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Uplink Dispatched</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Advisory scheduled to arrive on board in {settingMeta.oneWayDelayMinutes} minutes.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
