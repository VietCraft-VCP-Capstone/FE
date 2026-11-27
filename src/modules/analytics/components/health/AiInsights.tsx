import { Sparkles } from 'lucide-react';
import type { AiFinding } from '../../healthTypes';
import { Chip, type Tone } from '../ui';

const CARD = 'rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs sm:p-6';
const TONE: Record<AiFinding['status'], Tone> = { pass: 'good', warn: 'warn', info: 'info', na: 'neutral' };
const STATUS: Record<AiFinding['status'], string> = { pass: 'Đạt', warn: 'Nên sửa', info: 'Gợi ý', na: 'Chưa có' };

export function AiInsights({ items }: { items?: AiFinding[] }) {
  if (!items?.length) return null;
  return (
    <section className={CARD}>
      <h2 className="m-0 inline-flex items-center gap-2 text-base font-bold text-stone-900">
        <Sparkles size={18} className="text-[#007700]" aria-hidden />
        AI đã thấy gì
      </h2>
      <p className="m-0 mt-1 text-xs text-stone-500">Các model AI học từ dữ liệu bán thật, chạy trên ảnh và mô tả của sản phẩm này.</p>
      <ul className="m-0 mt-3 list-none space-y-3 p-0">
        {items.map(item => (
          <li key={item.model} className="flex items-start gap-3">
            <Chip tone="brand">AI</Chip>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="m-0 text-sm font-semibold text-stone-900">{item.title}</p>
                <Chip tone={TONE[item.status]}>{STATUS[item.status]}</Chip>
                {item.confidence !== null && <span className="text-xs text-stone-500">AI chắc {Math.round(item.confidence * 100)}%</span>}
              </div>
              <p className="m-0 mt-0.5 text-sm text-stone-700">{item.finding}</p>
              <p className="m-0 mt-0.5 text-xs text-stone-500">Học từ {item.trained_on} · {item.metric}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
