import { Star } from 'lucide-react';

type Props = {
  reviewed: boolean;
  compact?: boolean;
  onClick: () => void;
};

export function ReviewActionButton({ reviewed, compact = false, onClick }: Props) {
  const label = reviewed ? 'Chỉnh sửa đánh giá' : 'Đánh giá';
  const className = compact
    ? reviewed
      ? 'inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer border border-amber-200/70 shadow-2xs'
      : 'inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer border border-emerald-200/70 shadow-2xs'
    : reviewed
      ? 'border border-amber-500 text-amber-700 hover:bg-amber-50 font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer'
      : 'border border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer';

  return <button type="button" onClick={onClick} className={className} title={reviewed ? 'Xem và chỉnh sửa đánh giá' : 'Đánh giá sản phẩm'}>
    <Star size={compact ? 11 : 14} className={reviewed ? 'fill-amber-500 text-amber-500' : ''} />
    <span>{label}</span>
  </button>;
}
