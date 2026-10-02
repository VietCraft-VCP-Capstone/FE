import { useState } from 'react';
import { ChevronDown, Database } from 'lucide-react';
import { dateTime } from '../../../shared/utils/format';
import type { InsightMeta, SourceMode } from '../types';
import { Chip, type Tone } from './ui';

/**
 * Chân thẻ "Nguồn · Cập nhật · Giới hạn" — dùng chung cho cả 16 tính năng.
 *
 * Hợp đồng API bắt buộc FE hiện nhãn khi nguồn là dữ liệu mô phỏng (source.mode =
 * seed_demo). Trình bày dữ liệu mồi như số thật là lỗi nặng nhất của loại màn hình này.
 */

export const SOURCE_LABEL: Record<SourceMode, { label: string; tone: Tone; hint: string }> = {
  live: { label: 'Dữ liệu thật', tone: 'good', hint: 'Lấy từ Google Trends Việt Nam hoặc giao dịch thật trên sàn.' },
  seed_demo: { label: 'Dữ liệu mô phỏng', tone: 'warn', hint: 'Số liệu từ bộ dữ liệu mô phỏng, dùng để trình diễn cách phân tích.' },
  derived: { label: 'Kết hợp', tone: 'info', hint: 'Kết hợp nhu cầu thật (Google Trends) với nguồn cung trong dữ liệu mô phỏng.' },
};

export function SourceChip({ mode }: { mode: SourceMode }) {
  const s = SOURCE_LABEL[mode] ?? SOURCE_LABEL.seed_demo;
  return (
    <Chip tone={s.tone} icon={<Database size={12} aria-hidden />}>
      <span title={s.hint}>{s.label}</span>
    </Chip>
  );
}

export function SourceFooter({ meta, limitation, method }: {
  meta: InsightMeta;
  /** Giới hạn do service AI tự khai (trường `limitation` / `note`). */
  limitation?: string | null;
  /** Phương pháp tính, nếu muốn nêu. */
  method?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const hasDetail = Boolean(limitation || method);
  return (
    <div className="text-xs text-stone-500">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <SourceChip mode={meta.source.mode} />
        <span>Cập nhật {dateTime(meta.computed_at)}</span>
        {meta.quality?.sample_size != null && <span>Cỡ mẫu {meta.quality.sample_size.toLocaleString('vi-VN')}</span>}
        {hasDetail && (
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen(o => !o)}
            className="ml-auto inline-flex cursor-pointer items-center gap-1 rounded-lg border-none bg-transparent px-1.5 py-1 text-xs font-semibold text-stone-600 transition-colors duration-150 hover:text-[#007700] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#007700]"
          >
            Cách tính và giới hạn
            <ChevronDown size={14} className={`transition-transform duration-200 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} aria-hidden />
          </button>
        )}
      </div>
      {open && hasDetail && (
        <div className="mt-2 space-y-1.5 rounded-xl bg-stone-50 px-3 py-2.5 leading-relaxed text-stone-600">
          {method && <p className="m-0"><strong className="text-stone-700">Phương pháp:</strong> {method}</p>}
          {limitation && <p className="m-0"><strong className="text-stone-700">Giới hạn:</strong> {limitation}</p>}
        </div>
      )}
    </div>
  );
}
