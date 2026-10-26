import type { IntelTag, IntelTagVerdict } from '../../intelTypes';
import { Chip, InsightCard, Note, type Tone } from '../ui';

const VERDICT: Record<IntelTagVerdict, { label: string; tone: Tone }> = {
  keep: { label: 'Nên giữ', tone: 'good' },
  weak: { label: 'Yếu', tone: 'warn' },
  duplicate: { label: 'Trùng', tone: 'bad' },
  pending: { label: 'Chờ duyệt', tone: 'info' },
};

export function TagPanel({ tags, suggested, bare = false }: { tags: IntelTag[]; suggested: { tag: string; reason: string }[]; bare?: boolean }) {
  return (
    <InsightCard bare={bare} title="Tag" info="Tag được xét theo từ khoá bán chạy, độ trùng lặp và trạng thái duyệt.">
      <div className="space-y-3">
        {tags.length === 0 ? (
          <Note tone="warn">Sản phẩm chưa có tag nào.</Note>
        ) : (
          <ul className="m-0 list-none divide-y divide-stone-100 p-0">
            {tags.map(t => (
              <li key={t.tag} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-[13px]">
                <span className="font-semibold text-stone-800">{t.tag}</span>
                <Chip tone={VERDICT[t.verdict]?.tone}>{VERDICT[t.verdict]?.label ?? t.verdict}</Chip>
                <span className="min-w-0 text-xs text-stone-500">{t.reason}</span>
              </li>
            ))}
          </ul>
        )}
        {suggested.length > 0 && (
          <section>
            <h3 className="m-0 text-[13px] font-bold text-stone-900">Tag nên thêm</h3>
            <ul className="m-0 mt-1 list-none p-0">
              {suggested.map(s => (
                <li key={s.tag} className="flex flex-wrap items-center gap-x-3 py-1 text-[13px]">
                  <Chip tone="brand">{s.tag}</Chip>
                  <span className="text-xs text-stone-500">{s.reason}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </InsightCard>
  );
}
