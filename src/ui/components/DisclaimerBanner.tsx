import React from 'react';
import { DISCLAIMER_BANNER } from '@/contracts/constants';

export interface DisclaimerBannerProps {}

export function DisclaimerBanner(_props: DisclaimerBannerProps) {
  return (
    <div
      role="note"
      className="bg-accent/5 text-text-primary text-xs sm:text-sm text-center py-2 px-4 border-b border-border font-medium"
    >
      {DISCLAIMER_BANNER}
    </div>
  );
}
