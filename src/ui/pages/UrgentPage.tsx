import React from 'react';
import { Link } from 'react-router-dom';
import { useAppState } from '@/app/AppState';

export function UrgentPage() {
  const { missionSetting } = useAppState();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl bg-bg-surface border-2 border-status-urgent rounded-2xl shadow-glass p-8 text-center flex flex-col gap-5">
        {/* Warning icon ring */}
        <div className="mx-auto w-16 h-16 rounded-full bg-status-urgent/10 border-2 border-status-urgent flex items-center justify-center">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-status-urgent"
            aria-hidden="true"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-status-urgent">
          Get help now
        </h1>

        <p className="text-text-primary text-base sm:text-lg leading-relaxed">
          Contact your crew medical officer and ground now. You do not have to handle this
          alone. Follow your emergency procedures.
        </p>

        {missionSetting === 'deep_space' && (
          <p className="text-status-urgent font-semibold text-sm sm:text-base bg-status-urgent/10 rounded-xl px-4 py-3">
            A reply from ground may take a while. Do not wait for a reply before starting
            emergency procedures.
          </p>
        )}

        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent text-white font-bold text-base rounded-xl hover:opacity-90 transition-opacity min-h-[44px] min-w-[44px]"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Today
          </Link>
        </div>
      </div>
    </div>
  );
}
