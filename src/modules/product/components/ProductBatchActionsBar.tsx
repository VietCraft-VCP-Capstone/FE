import { Trash2, CheckCircle2 } from 'lucide-react';

interface ProductBatchActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onSetStatus: (status: 'ACTIVE' | 'INACTIVE') => void;
  onDelete: () => void;
}

export function ProductBatchActionsBar({
  selectedCount,
  onClearSelection,
  onSetStatus,
  onDelete,
}: ProductBatchActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#EAF0E2] border border-[#BECAB6] rounded-2xl shadow-xs animate-fade-in">
      <div className="flex items-center gap-2.5 pl-2">
        <div className="w-7 h-7 rounded-full bg-[#007700] text-white flex items-center justify-center shadow-2xs">
          <CheckCircle2 size={16} />
        </div>
        <div className="flex items-center">
          <span className="text-sm font-bold text-[#005B00] font-jakarta">
            Đã chọn {selectedCount} sản phẩm
          </span>
          <button
            onClick={onClearSelection}
            className="ml-3 text-xs font-semibold text-stone-500 hover:text-stone-800 underline underline-offset-2 cursor-pointer"
          >
            Bỏ chọn
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onSetStatus('ACTIVE')}
          className="px-3.5 py-2 bg-white hover:bg-emerald-50 text-[#007700] text-xs font-bold rounded-xl border border-emerald-300 shadow-2xs transition-all cursor-pointer font-jakarta"
        >
          Chuyển Đang bán
        </button>
        <button
          onClick={() => onSetStatus('INACTIVE')}
          className="px-3.5 py-2 bg-white hover:bg-stone-100 text-stone-700 text-xs font-semibold rounded-xl border border-stone-200 shadow-2xs transition-all cursor-pointer font-jakarta"
        >
          Chuyển Tạm dừng
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-[#BA1A1A] text-xs font-bold rounded-xl border border-rose-200 shadow-2xs transition-all cursor-pointer font-jakarta"
        >
          <Trash2 size={14} /> Xóa đã chọn
        </button>
      </div>
    </div>
  );
}
