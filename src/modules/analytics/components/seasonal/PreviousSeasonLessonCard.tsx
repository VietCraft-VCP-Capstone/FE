import { History, Sparkles } from 'lucide-react';
import type { PreviousSeasonLesson } from '../../types';
import { money } from '../../../../shared/utils/format';

interface Props {
  lesson?: PreviousSeasonLesson | null;
  occasionName: string;
}

const RATING: Record<NonNullable<PreviousSeasonLesson['rating']>, { label: string; cls: string }> = {
  good: { label: 'Áp dụng tốt · Đạt kỳ vọng', cls: 'bg-emerald-100 text-[#007700]' },
  neutral: { label: 'Trung bình · Cần tối ưu thêm', cls: 'bg-amber-100 text-amber-800' },
  poor: { label: 'Chưa hiệu quả', cls: 'bg-rose-100 text-rose-700' },
};

const ideaResult = (i: PreviousSeasonLesson['ideas'][number]) =>
  i.stage === 'idea'
    ? { text: 'chưa làm thành sản phẩm', cls: 'text-stone-500' }
    : i.orders > 0
    ? { text: `${i.orders} đơn · ${money(i.revenue)}`, cls: 'text-[#007700] font-semibold' }
    : { text: 'đã lên sản phẩm, 0 đơn', cls: 'text-amber-700 font-semibold' };

/** Nhắc seller đánh giá + kết quả của cùng dịp kỳ trước, và cho biết AI có dùng bài học này không. */
export function PreviousSeasonLessonCard({ lesson, occasionName }: Props) {
  if (!lesson) return null;
  const rating = lesson.rating ? RATING[lesson.rating] : null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 sm:p-5 space-y-3 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <History size={16} className="text-amber-700" />
          <h4 className="m-0 text-sm font-bold text-stone-900">
            Bài học từ {occasionName} {lesson.event_year}
          </h4>
        </div>
        {rating ? (
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${rating.cls}`}>Bạn đánh giá: {rating.label}</span>
        ) : (
          <span className="text-[11px] text-stone-500">Bạn chưa đánh giá kỳ đó</span>
        )}
      </div>

      {lesson.note && (
        <blockquote className="m-0 border-l-2 border-amber-300 pl-3 text-stone-700 italic">“{lesson.note}”</blockquote>
      )}

      {lesson.ideas.length > 0 && (
        <div>
          <div className="mb-1 text-[11px] font-semibold text-stone-500">
            Ý tưởng đã chọn kỳ đó ({lesson.totals.orders} đơn · {money(lesson.totals.revenue)})
          </div>
          <ul className="m-0 list-none space-y-1 p-0">
            {lesson.ideas.map(i => {
              const r = ideaResult(i);
              const verdict = i.rating ? RATING[i.rating] : null;
              return (
                <li key={i.title} className="space-y-0.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <span className="min-w-0 truncate text-stone-800" title={i.title}>{i.title}</span>
                    <span className={`shrink-0 text-[11px] ${r.cls}`}>{r.text}</span>
                  </div>
                  {verdict && (
                    <div className="flex flex-wrap items-baseline gap-1.5 text-[11px]">
                      <span className={`rounded-full px-2 py-px font-semibold ${verdict.cls}`}>{verdict.label}</span>
                      {i.note && <span className="italic text-stone-600">“{i.note}”</span>}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="flex items-start gap-1.5 border-t border-amber-200/70 pt-2 text-[11px] text-stone-600">
        <Sparkles size={12} className="mt-0.5 shrink-0 text-[#007700]" />
        {lesson.used_by_ai
          ? 'Ý tưởng AI mùa này đã được soạn dựa trên bài học này: phát triển hướng đã ra đơn, tránh lặp lại loại sản phẩm 0 đơn và làm theo ghi chú của bạn.'
          : 'Ý tưởng đang hiện chưa dựa trên bài học này; lần AI soạn ý tưởng tiếp theo cho dịp này sẽ dùng nó.'}
      </div>
    </div>
  );
}
