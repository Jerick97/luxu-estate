'use client';

import { useState, useTransition } from 'react';
import { setPropertyActive } from '../actions';

interface Props {
  propertyId: string;
  isActive: boolean;
  labels?: {
    deactivate?: string;
    activate?: string;
    activateShort?: string;
  };
}

export function PropertyActiveToggle({ propertyId, isActive, labels }: Props) {
  const [active, setActive] = useState(isActive);
  const [isPending, startTransition] = useTransition();

  const deactivateLabel = labels?.deactivate ?? 'Deactivate';
  const activateLabel = labels?.activate ?? 'Activate';
  const activateShort = labels?.activateShort ?? 'Activate';

  const toggle = () => {
    const next = !active;
    setActive(next); // optimistic
    startTransition(async () => {
      const res = await setPropertyActive(propertyId, next);
      if (!res?.success) setActive(!next); // revert on failure
    });
  };

  // Active row → subtle "deactivate" ghost icon.
  if (active) {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={isPending}
        title={deactivateLabel}
        aria-label={deactivateLabel}
        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all disabled:opacity-50"
      >
        <span className="material-icons text-xl">visibility_off</span>
      </button>
    );
  }

  // Inactive row → prominent "activate" call-to-action.
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      title={activateLabel}
      aria-label={activateLabel}
      className="inline-flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 rounded-lg bg-mosque text-white text-xs font-semibold shadow-sm hover:bg-nordic transition-all disabled:opacity-60"
    >
      <span className="material-icons text-[16px] leading-none">{isPending ? 'hourglass_empty' : 'visibility'}</span>
      {activateShort}
    </button>
  );
}
