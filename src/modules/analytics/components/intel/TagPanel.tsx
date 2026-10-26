import { useState } from 'react';
import { Tag as TagIcon, Copy, Check, Sparkles } from 'lucide-react';
import type { IntelTag, IntelTagVerdict } from '../../intelTypes';
import { InsightCard } from '../ui';

const VERDICT_MAP: Record<IntelTagVerdict, { label: string; badgeClass: string; desc: string }> = {
  keep: {
    label: 'Hiệu quả cao',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    desc: 'Từ khoá phổ biến, xuất hiện nhiều ở các sản phẩm bán chạy.',
  },
  pending: {
    label: 'Từ khoá shop tự đặt',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    desc: 'Hợp lệ và đang hoạt động bình thường khi khách gõ tìm kiếm.',
  },
  weak: {
    label: 'Ít lượt tìm kiếm',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    desc: 'Khách ít gõ từ này. Nên cân nhắc thay bằng từ khoá phổ biến hơn ở mục gợi ý bên dưới.',
  },
  duplicate: {
    label: 'Trùng lặp',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    desc: 'Đã có từ khoá tương tự, nên bỏ bớt để nhường chỗ cho từ khoá mới.',
  },
};

function formatReason(rawReason: string): string {
  // Translate cryptic machine learning lift numbers if present
  return rawReason
    .replace(/độ lift\s*0[,.](\d+)/gi, 'lượt tìm kiếm cao +$1%')
    .replace(/độ lift\s*([0-9.]+)/gi, 'lượt tìm kiếm cao');
}

export function TagPanel({
  tags,
  suggested,
  bare = false,
}: {
  tags: IntelTag[];
  suggested: { tag: string; reason: string }[];
  bare?: boolean;
}) {
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  const handleCopy = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 2000);
  };

  return (
    <InsightCard
      bare={bare}
      title="Thẻ từ khoá tìm kiếm (Tags)"
      info="Kiểm tra các từ khoá shop đang gắn và gợi ý những từ khoá đang được người mua tìm kiếm nhiều nhất."
    >
      <div className="space-y-5">
        {/* Section 1: Current Tags */}
        <div>
          <div className="flex items-center justify-between border-b border-stone-100 pb-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <TagIcon size={13} className="text-stone-500" />
              <span>Từ khoá shop đang gắn ({tags.length})</span>
            </span>
            <span className="text-[11px] text-stone-400">Khuyên dùng: 3–5 từ khoá</span>
          </div>

          {tags.length === 0 ? (
            <div className="p-4 text-center rounded-lg border border-dashed border-amber-300 bg-amber-50/50 text-xs text-amber-900">
              <span className="font-semibold block">Sản phẩm chưa được gắn thẻ từ khoá nào!</span>
              <span className="text-stone-600 block mt-0.5">
                Gắn từ khoá giúp sản phẩm xuất hiện khi khách gõ tìm kiếm trên sàn.
              </span>
            </div>
          ) : (
            <div className="border border-stone-200 rounded-lg overflow-hidden divide-y divide-stone-100 bg-white">
              {tags.map((t) => {
                const info = VERDICT_MAP[t.verdict] || {
                  label: t.verdict,
                  badgeClass: 'bg-stone-100 text-stone-700 border-stone-200',
                  desc: t.reason,
                };

                return (
                  <div key={t.tag} className="p-3 flex items-center justify-between gap-3 hover:bg-stone-50/70 transition-colors duration-150">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-xs font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded">
                        #{t.tag}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${info.badgeClass}`}>
                        {info.label}
                      </span>
                      <span className="text-xs text-stone-500 truncate hidden sm:inline">
                        {info.desc}
                      </span>
                    </div>

                    <span className="text-[11px] text-stone-400 shrink-0 text-right sm:hidden">
                      {info.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2: Suggested High-Converting Tags */}
        {suggested.length > 0 && (
          <div>
            <div className="flex items-center justify-between border-b border-stone-100 pb-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <Sparkles size={13} className="text-emerald-700" />
                <span>Từ khoá gợi ý nên gắn thêm (Bấm để sao chép)</span>
              </span>
              <span className="text-[11px] text-stone-400">Từ các sản phẩm bán chạy cùng nhóm</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {suggested.map((s) => {
                const isCopied = copiedTag === s.tag;
                const cleanReason = formatReason(s.reason);

                return (
                  <div
                    key={s.tag}
                    className="p-3 rounded-lg border border-emerald-200/80 bg-emerald-50/30 hover:bg-emerald-50/60 hover:border-emerald-300 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-100/70 px-2 py-0.5 rounded">
                          #{s.tag}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(s.tag)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold transition-all duration-150 active:scale-90 cursor-pointer ${
                            isCopied
                              ? 'bg-emerald-700 text-white shadow-xs'
                              : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50 hover:border-stone-300'
                          }`}
                          title="Sao chép từ khoá này để dán vào trang sửa sản phẩm"
                        >
                          {isCopied ? (
                            <span className="inline-flex items-center gap-1 animate-pop-in">
                              <Check size={11} />
                              <span>Đã chép</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <Copy size={11} />
                              <span>Sao chép</span>
                            </span>
                          )}
                        </button>
                      </div>

                      <p className="m-0 mt-2 text-[11px] text-stone-600 leading-snug">
                        {cleanReason}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="m-0 mt-2.5 text-[11px] text-stone-400">
              💡 Mẹo: Bấm "Sao chép" ở từ khoá phù hợp rồi dán vào ô Từ khoá trong trang sửa sản phẩm để hút thêm lượt tìm kiếm.
            </p>
          </div>
        )}
      </div>
    </InsightCard>
  );
}
