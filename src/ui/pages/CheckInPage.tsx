import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CheckInInput, CheckInResult } from '@/contracts/types';
import { CheckInForm } from '@/ui/components/CheckInForm';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export function CheckInPage() {
  const navigate = useNavigate();
  const [day] = useState(120);

  // 30-day trend data (days 91 to 120) for mood and sleep
  const trendData = Array.from({ length: 30 }, (_, i) => {
    const d = 91 + i;
    const progress = Math.min(1, (d - 70) / 40);
    return {
      day: d,
      mood: Number((3.8 - 0.9 * progress).toFixed(1)),
      sleep: Number((6.8 - 1.2 * progress).toFixed(1)),
    };
  });

  const handleCheckInSubmit = async (input: CheckInInput): Promise<CheckInResult> => {
    if (input.urgentHelpRequested) {
      return {
        level: 'urgent',
        message: 'Contact your crew medical officer and ground now. You do not have to handle this alone.',
        suggestions: [],
        escalation: {
          level: 'urgent_now',
          text: 'Contact your crew medical officer and ground now. You do not have to handle this alone.',
          expectedReplyMinutes: null,
        },
      };
    }

    if (input.mood <= 2 && input.stress >= 4) {
      return {
        level: 'support',
        message:
          'It looks like today is hard. Here are some steps that may help, and the flight surgeon or behavioral health support can talk it through with you.',
        suggestions: [
          { id: 'a1', text: 'Try slow breathing: in for 4 seconds, out for 6, for 2 minutes.', supplyAvailable: true },
          { id: 'a2', text: 'Keep a regular daily routine, including meals, exercise, and sleep.', supplyAvailable: true },
          { id: 'a3', text: 'Talk with a crew member or send a message to someone you trust.', supplyAvailable: true },
          { id: 'a4', text: 'Tell the flight surgeon or behavioral health support if this continues.', supplyAvailable: true },
        ],
        escalation: null,
      };
    }

    if (input.mood <= 2 || input.stress >= 4 || input.energy <= 2) {
      return {
        level: 'support',
        message: 'Thank you for checking in. Here are a few steps that may help.',
        suggestions: [
          { id: 'a1', text: 'Try slow breathing: in for 4 seconds, out for 6, for 2 minutes.', supplyAvailable: true },
          { id: 'a2', text: 'Keep a regular daily routine, including meals, exercise, and sleep.', supplyAvailable: true },
        ],
        escalation: null,
      };
    }

    return {
      level: 'none',
      message: 'Thanks for checking in.',
      suggestions: [],
      escalation: null,
    };
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-ink">Wellbeing check-in</h1>
        <p className="text-xs sm:text-sm text-ink-soft">
          Confidential self-assessment for Mission Day {day}
        </p>
      </div>

      <CheckInForm
        crewId="crew-1"
        day={day}
        onSubmit={handleCheckInSubmit}
        onNeedHelpNow={() => navigate('/urgent')}
      />

      {/* 30-day Trend Charts: Mood and Sleep stacked */}
      <section aria-label="30-day Wellbeing and Sleep Trend" className="bg-panel border border-line rounded-sheet p-5 shadow-sm">
        <h2 className="text-base font-bold text-ink mb-1">30-day trends</h2>
        <p className="text-xs text-ink-soft mb-4">
          Mood ratings tracked alongside sleep duration over the past 30 mission days.
        </p>

        {/* Mood chart */}
        <div className="mb-4">
          <span className="text-xs font-bold text-ink">Mood (1 to 5)</span>
          <div className="h-28 w-full mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" tick={false} stroke="var(--ink-soft)" />
                <YAxis domain={[1, 5]} ticks={[1, 3, 5]} stroke="var(--ink-soft)" fontSize={10} />
                <Tooltip />
                <Line type="monotone" dataKey="mood" stroke="var(--instrument)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sleep chart */}
        <div>
          <span className="text-xs font-bold text-ink">Sleep (hours)</span>
          <div className="h-28 w-full mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="var(--ink-soft)" fontSize={10} tickFormatter={(v) => `D${v}`} />
                <YAxis domain={[4, 8]} ticks={[4, 6, 8]} stroke="var(--ink-soft)" fontSize={10} />
                <Tooltip />
                <Line type="monotone" dataKey="sleep" stroke="var(--ink)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}
