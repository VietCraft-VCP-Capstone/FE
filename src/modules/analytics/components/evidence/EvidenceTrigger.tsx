import React from 'react';
import { Info } from 'lucide-react';
import type { Evidence } from '../../types/evidence';

interface Props {
  evidence: Evidence;
  onOpen: (evidence: Evidence) => void;
  className?: string;
  size?: number;
}

export const EvidenceTrigger: React.FC<Props> = ({
  evidence,
  onOpen,
  className = '',
  size = 14,
}) => {
  return (
    <button
      type="button"
      onClick={e => {
        e.stopPropagation();
        onOpen(evidence);
      }}
      title="Con số này từ đâu ra? Bấm để xem 11 mục bằng chứng minh bạch"
      className={`inline-flex items-center justify-center p-0.5 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors focus:outline-none focus:ring-1 focus:ring-stone-400 ${className}`}
    >
      <Info size={size} className="stroke-[2.2]" />
      <span className="sr-only">Xem bằng chứng của con số</span>
    </button>
  );
};
