import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';

interface BottomNavProps {
  onResetData: () => void;
}

export function BottomNav({ onResetData }: BottomNavProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const navigate = useNavigate();

  const handleReset = () => {
    setMoreOpen(false);
    if (window.confirm('This clears measurements, check-ins, and the journal on this device. Reset?')) {
      onResetData();
    }
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center flex-1 py-1 text-xs font-medium min-h-[44px] ${
      isActive ? 'text-instrument font-bold' : 'text-ink-soft hover:text-ink'
    }`;

  return (
    <>
      {/* Desktop/Tablet Header Navigation tabs if screen >= lg */}
      <nav
        aria-label="Main Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 h-14 bg-panel border-t border-line flex items-center justify-around z-40"
      >
        <NavLink to="/" end className={navClass}>
          Today
        </NavLink>
        <NavLink to="/log" className={navClass}>
          Log
        </NavLink>
        <NavLink to="/checkin" className={navClass}>
          Check-in
        </NavLink>
        <NavLink to="/lab" className={navClass}>
          Lab
        </NavLink>
        <button
          type="button"
          onClick={() => setMoreOpen(!moreOpen)}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-xs font-medium min-h-[44px] ${
            moreOpen ? 'text-instrument font-bold' : 'text-ink-soft hover:text-ink'
          }`}
          aria-expanded={moreOpen}
          aria-label="More navigation options"
        >
          More
        </button>
      </nav>

      {/* More overlay sheet on mobile */}
      {moreOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-ink/30 flex flex-col justify-end"
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="bg-panel border-t border-line rounded-t-sheet p-4 shadow-card flex flex-col gap-2 max-w-lg mx-auto w-full"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Additional Navigation"
          >
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-line">
              <span className="font-bold text-ink">More screens</span>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="text-ink-soft p-2 min-h-[44px] min-w-[44px] text-sm"
              >
                Close
              </button>
            </div>
            <Link
              to="/proof"
              onClick={() => setMoreOpen(false)}
              className="py-2.5 px-3 rounded-input text-ink hover:bg-ceramic font-medium flex items-center min-h-[44px]"
            >
              Proof
            </Link>
            <Link
              to="/journal"
              onClick={() => setMoreOpen(false)}
              className="py-2.5 px-3 rounded-input text-ink hover:bg-ceramic font-medium flex items-center min-h-[44px]"
            >
              Investigation journal
            </Link>
            <Link
              to="/mission"
              onClick={() => setMoreOpen(false)}
              className="py-2.5 px-3 rounded-input text-ink hover:bg-ceramic font-medium flex items-center min-h-[44px]"
            >
              Mission setting & supplies
            </Link>
            <Link
              to="/about"
              onClick={() => setMoreOpen(false)}
              className="py-2.5 px-3 rounded-input text-ink hover:bg-ceramic font-medium flex items-center min-h-[44px]"
            >
              About & limits
            </Link>
            <button
              type="button"
              onClick={handleReset}
              className="py-2.5 px-3 rounded-input text-left text-status-urgent hover:bg-status-urgent-soft font-medium flex items-center min-h-[44px]"
            >
              Reset demo data
            </button>
          </div>
        </div>
      )}
    </>
  );
}
