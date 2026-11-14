import React from 'react';
import { DISCLAIMER_BANNER } from '@/contracts/constants';

export interface DisclaimerBannerProps {}

export function DisclaimerBanner(_props: DisclaimerBannerProps) {
  return (
    <div
      role="note"
      className="bg-instrument-soft text-ink text-xs sm:text-sm text-center py-1.5 px-4 border-b border-line"
    >
      {DISCLAIMER_BANNER}
    </div>
  );
}

