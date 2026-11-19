import { useInsight } from '../../hooks/useInsight';
import { decimal, pct, shortDate } from '../../format';
import type { ImpactRevision, ListingImpact } from '../../healthTypes';
import { InsightBlock } from '../InsightBlock';

const CARD = 'rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs sm:p-6';
const LIMIT = 'Đây là so sánh trước/sau, không chứng minh nhân quả.';

const FIELD_LABEL: Record<string, string> = {
  title: 'tên', tags: 'tag', n_images: 'ảnh', desc_words: 'mô tả', has_size: 'size', materials: 'chất liệu', price: 'giá',
};

function statusText(d: ListingImpact): string {
  if (d.status === 'no_revision') return 'Chưa có lần sửa nội dung nào trong 60 ngày qua, nên chưa có gì để so trước và sau.';
  if (d.status === 'collecting') return `Đang thu thập dữ liệu: mới ${d.elapsed_days ?? 0}/7 ngày sau khi sửa.`;
  if (d.status === 'preliminary') return `Kết quả sơ bộ, dựa trên ${d.window_days} ngày sau khi sửa. Đủ 14 ngày sẽ có kết quả đầy đủ.`;
  return `Đã đủ ${d.window_days} ngày sau khi sửa để so sánh.`;
}

const pctOf = (x: number | null) => pct(x === null ? null : x * 100);
const signed = (x: number) => `${x > 0 ? '+' : ''}${decimal(x, 1)}`;
const changedText = (r: ImpactRevision) => r.changed.map(f => FIELD_LABEL[f] ?? f).join(', ');

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
      <div className="text-[11px] text-stone-500">{label}</div>
      <div className="mt-0.5 text-sm font-bold tabular-nums text-stone-900">{value}</div>
    </div>
  );
}

function ImpactBody({ data }: { data: ListingImpact }) {
  const v = data.views_per_day;
  const c = data.cart_rate;
  return (
    <>
      <p className="m-0 text-sm font-semibold text-stone-900">{statusText(data)}</p>
      {data.revision && (
        <p className="m-0 mt-1 text-xs text-stone-600">Lần sửa gần nhất: {shortDate(data.revision.date)} · {changedText(data.revision)}</p>
      )}
      {data.mixed_changes && (
        <p className="m-0 mt-1 text-xs text-stone-600">Trong thời gian so sánh có nhiều thay đổi (kể cả giá), nên không tách được tác động của từng thay đổi.</p>
      )}
      {data.reason === 'not_enough_peers' && <p className="m-0 mt-1 text-xs text-stone-600">Chưa đủ sản phẩm cùng danh mục để so sánh.</p>}
      {(v || c) && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {v && <Stat label="Lượt xem mỗi ngày: trước → sau" value={`${decimal(v.pre, 1)} → ${decimal(v.post, 1)}`} />}
          {v && <Stat label="Cùng danh mục, không sửa: trước → sau" value={`${decimal(v.control_pre, 1)} → ${decimal(v.control_post, 1)}`} />}
          {v && <Stat label="Chênh lệch so với cùng danh mục" value={signed(v.did)} />}
          {c && <Stat label="Tỉ lệ thêm giỏ: trước → sau" value={`${pctOf(c.pre)} → ${pctOf(c.post)}`} />}
        </div>
      )}
      {c?.post_ci && (
        <p className="m-0 mt-2 text-xs text-stone-600">
          Khoảng tin cậy 95% của tỉ lệ thêm giỏ sau khi sửa: {pctOf(c.post_ci[0])} đến {pctOf(c.post_ci[1])}.
        </p>
      )}
      <p className="m-0 mt-4 text-xs leading-relaxed text-stone-500">{LIMIT}</p>
    </>
  );
}

export function ImpactCard({ productId }: { productId: string }) {
  const { state, reload } = useInsight<ListingImpact>(`/listings/${productId}/impact`);
  return (
    <section className={CARD}>
      <h2 className="m-0 text-base font-bold text-stone-900">Hiệu quả sau khi sửa</h2>
      <div className="mt-3">
        <InsightBlock state={state} onRetry={reload} compact>
          {data => <ImpactBody data={data} />}
        </InsightBlock>
      </div>
    </section>
  );
}
