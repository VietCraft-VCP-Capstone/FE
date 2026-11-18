import { useState } from 'react';
import { Tooltip } from 'antd';
import { Check, HelpCircle, Clock, Copy, CopyX, FileText, TrendingDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { IntelTag, IntelTagVerdict } from '../../intelTypes';
import { InsightCard } from '../ui';

const VERDICT: Record<IntelTagVerdict, { label: string; desc: string; Icon: LucideIcon; tone: string }> = {
  keep: { label: 'hay gặp ở hàng bán chạy', desc: 'Từ khoá phổ biến ở các sản phẩm bán chạy.', Icon: Check, tone: 'text-[#007700]' },
  pending: { label: 'chờ duyệt', desc: 'Tag mới shop tự đặt, chỉ có tác dụng và được tính điểm sau khi được duyệt.', Icon: Clock, tone: 'text-stone-400' },
  weak: { label: 'ít gặp ở hàng bán chạy', desc: 'Giữ nếu đúng sản phẩm, hoặc thêm từ gợi ý bên dưới.', Icon: TrendingDown, tone: 'text-amber-700' },
  duplicate: { label: 'trùng lặp', desc: 'Đã có từ khoá tương tự, nên bỏ bớt.', Icon: CopyX, tone: 'text-rose-600' },
};

const KIND = {
  fact: { Icon: FileText, label: 'có trong mô tả của bạn' },
  context: { Icon: HelpCircle, label: 'chỉ gắn nếu đúng với sản phẩm' },
};

const cleanReason = (reason: string) => reason.replace(/\s*\(độ lift\s*[\d.,]+\)/gi, '');

export function TagPanel({ tags, suggested, bare = false }: {
  tags: IntelTag[];
  suggested: { tag: string; reason: string; kind?: 'fact' | 'context' }[];
  bare?: boolean;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const verdicts = [...new Set(tags.map(t => t.verdict))].filter(v => VERDICT[v]);
  const kinds = [...new Set(suggested.map(s => s.kind ?? 'context'))];

  const copy = (tag: string) => {
    navigator.clipboard?.writeText(tag).catch(() => undefined);
    setCopied(tag);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <InsightCard bare={bare} title="Tag" info="Tag shop đang gắn và tag hay gặp ở hàng bán chạy cùng nhóm. Nên có 3–5 tag.">
      <div className="space-y-5">
        <div>
          <p className="m-0 mb-2 text-xs text-stone-500">
            Đang gắn <b className="text-stone-800">{tags.length}</b> · nên 3–5
          </p>
          {tags.length === 0 ? (
            <p className="m-0 text-xs text-amber-800">Chưa có tag nào. Tag giúp sản phẩm hiện ra khi khách tìm kiếm.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {tags.map(t => {
                const v = VERDICT[t.verdict];
                const Icon = v?.Icon;
                return (
                  <Tooltip key={t.tag} title={v ? `${v.label[0].toUpperCase()}${v.label.slice(1)}. ${v.desc}` : t.reason}>
                    <span className="inline-flex cursor-help items-center gap-1 rounded-full border border-stone-200 bg-white px-2.5 py-1 text-xs text-stone-800">
                      {Icon && <Icon size={11} className={v.tone} aria-label={v.label} />}
                      {t.tag}
                    </span>
                  </Tooltip>
                );
              })}
            </div>
          )}
          {verdicts.length > 0 && (
            <p className="m-0 mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-stone-400">
              {verdicts.map(k => {
                const { Icon, tone, label } = VERDICT[k];
                return <span key={k} className="inline-flex items-center gap-1"><Icon size={10} className={tone} /> {label}</span>;
              })}
            </p>
          )}
        </div>

        {suggested.length > 0 && (
          <div className="border-t border-stone-100 pt-4">
            <p className="m-0 mb-2 text-xs text-stone-500">Nên thêm · bấm để sao chép</p>
            <div className="flex flex-wrap gap-1.5">
              {suggested.map(s => {
                const { Icon } = KIND[s.kind ?? 'context'];
                const done = copied === s.tag;
                return (
                  <Tooltip key={s.tag} title={cleanReason(s.reason)}>
                    <button
                      type="button"
                      onClick={() => copy(s.tag)}
                      className={`inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors ${done ? 'border-[#007700] bg-[#007700] text-white' : 'border-dashed border-stone-300 bg-white text-stone-800 hover:border-[#007700]'}`}
                    >
                      <Icon size={11} className={done ? 'text-white' : 'text-stone-400'} aria-hidden />
                      {s.tag}
                      {done ? <Check size={11} aria-label="Đã chép" /> : <Copy size={11} className="text-stone-400" aria-hidden />}
                    </button>
                  </Tooltip>
                );
              })}
            </div>
            <p className="m-0 mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-stone-400">
              {kinds.map(k => {
                const { Icon, label } = KIND[k];
                return <span key={k} className="inline-flex items-center gap-1"><Icon size={10} /> {label}</span>;
              })}
            </p>
          </div>
        )}
      </div>
    </InsightCard>
  );
}
