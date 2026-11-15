import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Clock3,
  LifeBuoy,
  Radio,
  ShieldAlert,
  TriangleAlert,
  UserRound,
} from 'lucide-react';
import { useAppState } from '@/app/AppState';
import { MISSION_SETTINGS, expectedReplyMinutes } from '@/guidance';

export function UrgentPage() {
  const { missionSetting } = useAppState();
  const setting = MISSION_SETTINGS[missionSetting];
  const reply = expectedReplyMinutes(missionSetting);

  return (
    <div className="page-wrap">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <section className="relative overflow-hidden rounded-[24px] border border-status-urgent/30 bg-[linear-gradient(160deg,rgba(255,255,255,0.96),rgba(255,241,241,0.92))] p-5 shadow-float backdrop-blur-xl sm:p-7">
          <div
            className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(207,63,73,0.18),transparent_70%)]"
            aria-hidden="true"
          />

          <div className="relative flex flex-col items-start gap-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-status-urgent/30 bg-white/80 px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-status-urgent">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-status-urgent opacity-60" aria-hidden="true" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-status-urgent" aria-hidden="true" />
              </span>
              Emergency support
            </span>

            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-status-urgent text-white shadow-[0_10px_24px_-12px_rgba(207,63,73,0.8)]">
                <TriangleAlert className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
              </span>
              <div>
                <h1 className="font-display text-[1.8rem] font-extrabold leading-tight tracking-[-0.04em] text-ink sm:text-[2.1rem]">
                  Get help now
                </h1>
                <p className="mt-2 max-w-xl text-[0.9rem] font-medium leading-relaxed text-ink-2">
                  Contact your crew medical officer and ground now. You do not have to handle this
                  alone. Follow your emergency procedures.
                </p>
              </div>
            </div>

            {missionSetting === 'deep_space' && (
              <div className="flex w-full items-start gap-2.5 rounded-[16px] border border-status-urgent/25 bg-status-urgent-soft/80 px-4 py-3">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-status-urgent" aria-hidden="true" />
                <p className="text-[0.8rem] font-semibold leading-relaxed text-status-urgent">
                  A reply from ground may take a while. Do not wait for a reply before starting
                  emergency procedures.
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Link to="/" className="btn btn-primary !min-h-[46px] !px-5">
                Back to Today
              </Link>
              <Link to="/help" className="btn btn-secondary !min-h-[46px]">
                <LifeBuoy className="h-4 w-4" aria-hidden="true" />
                Help &amp; Support
              </Link>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <section className="panel p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-status-urgent-soft text-status-urgent">
                <UserRound className="h-4 w-4" aria-hidden="true" />
              </span>
              <h2 className="text-[0.85rem] font-bold text-ink">Who to contact</h2>
            </div>
            <ul className="mt-2.5 space-y-2 text-[0.74rem] leading-relaxed text-ink-2">
              <li className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-status-urgent" aria-hidden="true" />
                Your crew medical officer.
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-status-urgent" aria-hidden="true" />
                Mission ground support through your emergency channel.
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-status-urgent" aria-hidden="true" />
                Follow the emergency procedures for your vehicle or habitat.
              </li>
            </ul>
          </section>

          <section className="panel p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-instrument-soft text-instrument">
                <Radio className="h-4 w-4" aria-hidden="true" />
              </span>
              <h2 className="text-[0.85rem] font-bold text-ink">Current link</h2>
            </div>
            <dl className="mt-2.5 space-y-2 text-[0.74rem]">
              <div className="flex items-center justify-between gap-2 border-b border-line/60 pb-1.5">
                <dt className="text-ink-soft">Setting</dt>
                <dd className="font-semibold text-ink">{setting.label}</dd>
              </div>
              <div className="flex items-center justify-between gap-2 border-b border-line/60 pb-1.5">
                <dt className="text-ink-soft">One-way delay</dt>
                <dd className="font-semibold tabular-nums text-ink">{setting.oneWayDelayMinutes} min</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-ink-soft">Expected ground reply</dt>
                <dd className="font-semibold tabular-nums text-ink">≥ {reply} min</dd>
              </div>
            </dl>
            <p className="mt-2 text-[0.64rem] leading-relaxed text-ink-soft">
              Reply estimates are illustrative and do not change the need to act now.
            </p>
          </section>
        </div>

        <section className="flex flex-wrap items-center justify-between gap-2 rounded-[16px] border border-line bg-white/65 px-4 py-3">
          <p className="inline-flex items-center gap-1.5 text-[0.68rem] font-medium text-ink-soft">
            <ShieldAlert className="h-3.5 w-3.5 text-ink-faint" aria-hidden="true" />
            After the immediate response, record what happened in the journal.
          </p>
          <Link
            to="/journal"
            className="inline-flex items-center gap-1 text-[0.68rem] font-semibold text-instrument hover:underline"
          >
            Investigation journal
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </section>
      </div>
    </div>
  );
}
