import { ArrowRight } from 'lucide-react';
import type { SeasonalStoryChapter } from '../../types';

interface Props {
  chapter?: SeasonalStoryChapter;
  /** 1 = Tổng quan · 2 = Ý tưởng · 3 = Áp dụng · 4 = Thành quả */
  step: 1 | 2 | 3 | 4;
  onNavigate: (tab: SeasonalStoryChapter['cta_tab']) => void;
}

const STEPS = ['Tổng quan', 'Ý tưởng', 'Áp dụng', 'Thành quả'];

/** Thanh dẫn 4 bước theo phong cách toàn sàn: nền trắng sạch, cô đọng, số liệu có căn cứ. */
export function StoryChapter({ chapter, step, onNavigate }: Props) {
  if (!chapter) return null;
  return (
    <div className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-2xs sm:px-5 sm:py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1.5">
        <ol className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
          {STEPS.map((label, i) => (
            <li key={label} className="flex items-center gap-1">
              <span
                className={`inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
                  i + 1 === step
                    ? 'bg-[#007700] text-white'
                    : i + 1 < step
                    ? 'bg-emerald-100 text-[#005B00]'
                    : 'bg-stone-100 text-stone-500'
                }`}
              >
                {i + 1}
              </span>
              <span className={i + 1 === step ? 'text-stone-900 font-bold' : 'text-stone-400'}>{label}</span>
              {i < STEPS.length - 1 && <span className="mx-0.5 text-stone-300">/</span>}
            </li>
          ))}
        </ol>

        <h3 className="m-0 text-sm font-bold text-stone-900 leading-snug">
          {chapter.headline}
        </h3>

        {chapter.bullets.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600">
            {chapter.bullets.map((b, i) => (
              <span key={i} className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#007700]" />
                <span>{b}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => onNavigate(chapter.cta_tab)}
        className="shrink-0 self-start sm:self-center inline-flex items-center gap-1.5 rounded-xl bg-[#007700] px-3.5 py-2 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-[#005B00]"
      >
        <span>{chapter.next_step}</span>
        <ArrowRight size={13} />
      </button>
    </div>
  );
}
