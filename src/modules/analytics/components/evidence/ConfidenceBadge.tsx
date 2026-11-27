import React from 'react';
import type { ConfidenceLevel } from '../../types/evidence';
import { GLOSSARY } from '../../i18n/vi.glossary';

interface Props {
  level: ConfidenceLevel;
  className?: string;
  showDesc?: boolean;
}

const BADGE_CONFIG: Record<
  ConfidenceLevel,
  { label: string; desc: string; bg: string; text: string; border: string }
> = {
  high: {
    label: GLOSSARY.confidence.high.text,
    desc: GLOSSARY.confidence.high.desc,
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
  },
  fair: {
    label: GLOSSARY.confidence.fair.text,
    desc: GLOSSARY.confidence.fair.desc,
    bg: 'bg-sky-50',
    text: 'text-sky-800',
    border: 'border-sky-200',
  },
  preliminary: {
    label: GLOSSARY.confidence.preliminary.text,
    desc: GLOSSARY.confidence.preliminary.desc,
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
  insufficient: {
    label: GLOSSARY.confidence.insufficient.text,
    desc: GLOSSARY.confidence.insufficient.desc,
    bg: 'bg-stone-100',
    text: 'text-stone-600',
    border: 'border-stone-200',
  },
};

export const ConfidenceBadge: React.FC<Props> = ({ level, className = '', showDesc = false }) => {
  const conf = BADGE_CONFIG[level] || BADGE_CONFIG.preliminary;

  return (
    <span
      title={conf.desc}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${conf.bg} ${conf.text} ${conf.border} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      <span>{conf.label}</span>
      {showDesc && <span className="font-normal opacity-80">({conf.desc})</span>}
    </span>
  );
};
