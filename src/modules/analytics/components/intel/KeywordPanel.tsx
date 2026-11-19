import { Tooltip } from 'antd';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { SERIES } from '../../../../shared/components/charts/chartTheme';
import { decimal } from '../../format';
import type { IntelKeyword, IntelMaterial } from '../../intelTypes';
import { InsightCard } from '../ui';

const ABOUT = 'Lấy từ dữ liệu sản phẩm trên Tiki: so tần suất một từ xuất hiện trong tên hàng bán chạy (top 25% theo lượt bán) với tất cả sản phẩm cùng nhóm. ×1 là ngang mức chung.';

function tip(term: string, lift: number) {
  const r = Math.exp(lift);
  return r >= 1
    ? `Ở hàng bán chạy, "${term}" xuất hiện nhiều gấp ${decimal(r, 1)} lần mức chung.`
    : `Ở hàng bán chạy, "${term}" xuất hiện ít hơn mức chung ${Math.round((1 - r) * 100)}%.`;
}

function MaterialLine({ material }: { material: IntelMaterial }) {
  const found = material.declared.length ? material.declared : material.detected;
  if (!found.length) return null;
  const declared = material.declared.length > 0;
  return (
    <p className={`m-0 text-xs ${declared ? 'text-stone-600' : 'text-amber-800'}`}>
      {declared ? 'Chất liệu đã khai: ' : 'Tên có nhắc chất liệu nhưng ô Chất liệu còn trống: '}
      <b className="text-stone-800">{found.join(', ')}</b>
    </p>
  );
}

function Row({ k, max }: { k: IntelKeyword; max: number }) {
  const lift = k.lift;
  const half = lift === null ? 0 : (Math.abs(lift) / max) * 50;
  return (
    <li className="grid grid-cols-[8rem_1fr_3rem] items-center gap-3 text-xs sm:grid-cols-[10rem_1fr_3rem]">
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="truncate text-stone-800">{k.term}</span>
        {!k.in_title && <span className="shrink-0 rounded bg-stone-100 px-1 text-[10px] text-stone-500">chưa có trong tên</span>}
        {k.trend === 'up' && <ArrowUpRight size={12} className="shrink-0 text-[#1a6b1a]" aria-label="Đang được tìm nhiều hơn" />}
        {k.trend === 'down' && <ArrowDownRight size={12} className="shrink-0 text-amber-700" aria-label="Đang được tìm ít đi" />}
      </span>
      <Tooltip title={lift === null ? 'Chưa đủ dữ liệu' : tip(k.term, lift)}>
        <span className="relative block h-3 cursor-help">
          <span className="absolute inset-y-0 left-1/2 w-px bg-stone-300" aria-hidden />
          {lift !== null && (
            <span
              className="absolute top-0.5 h-2 rounded-[3px]"
              style={lift >= 0
                ? { left: '50%', width: `${Math.max(half, 1)}%`, background: SERIES.green }
                : { right: '50%', width: `${Math.max(half, 1)}%`, background: '#d6a35c' }}
            />
          )}
        </span>
      </Tooltip>
      <span className="text-right font-semibold tabular-nums text-stone-800">{lift === null ? '–' : `×${decimal(Math.exp(lift), 1)}`}</span>
    </li>
  );
}

export function KeywordPanel({ keywords, material, bare = false }: { keywords: IntelKeyword[]; material: IntelMaterial; bare?: boolean }) {
  const materials = new Set([...material.declared, ...material.detected].map(m => m.toLowerCase()));
  const shown = keywords
    .filter(k => {
      const term = k.term.trim().toLowerCase();
      return !/^\d+$/.test(term) && (term.includes(' ') || materials.has(term));
    })
    .sort((a, b) => (b.lift ?? -9) - (a.lift ?? -9));
  const max = Math.max(0.3, ...shown.map(k => Math.abs(k.lift ?? 0)));

  return (
    <InsightCard bare={bare} title="Từ trong tên có hay gặp ở hàng bán chạy không?" info={ABOUT}>
      <div className="max-w-3xl space-y-3">
        <MaterialLine material={material} />
        {shown.length === 0 ? (
          <p className="m-0 py-4 text-center text-xs text-stone-500">Tên chưa có từ khoá nổi bật. Nên có loại hàng, chất liệu, kiểu dáng.</p>
        ) : (
          <>
            <div className="grid grid-cols-[8rem_1fr_3rem] gap-3 text-[11px] text-stone-400 sm:grid-cols-[10rem_1fr_3rem]">
              <span>Từ</span>
              <span className="flex justify-between"><span>← ít gặp hơn</span><span>×1</span><span>gặp nhiều hơn →</span></span>
              <span className="text-right">Số lần</span>
            </div>
            <ul className="m-0 list-none space-y-2 p-0">
              {shown.map(k => <Row key={k.term} k={k} max={max} />)}
            </ul>
            <p className="m-0 text-[11px] text-stone-400">×2 nghĩa là từ này xuất hiện trong tên hàng bán chạy nhiều gấp 2 lần so với các sản phẩm khác cùng nhóm (dữ liệu Tiki, chỉ để tham khảo).</p>
          </>
        )}
      </div>
    </InsightCard>
  );
}
