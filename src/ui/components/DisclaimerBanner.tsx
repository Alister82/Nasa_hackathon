import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { DISCLAIMER_BANNER } from '@/contracts/constants';

export interface DisclaimerBannerProps {}

export function DisclaimerBanner(_props: DisclaimerBannerProps) {
  return (
    <div role="note" className="flex items-center gap-2 text-[0.64rem] font-medium text-ink-soft">
      <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-instrument/70" aria-hidden="true" />
      <span>{DISCLAIMER_BANNER}</span>
    </div>
  );
}
