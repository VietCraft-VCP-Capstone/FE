/**
 * Phần dùng chung của F29 (Sức khoẻ sản phẩm) cho trang danh sách và trang chi tiết.
 *
 * Mọi câu chữ giải thích tiêu chí nằm ở đây để hai trang luôn nói cùng một điều.
 * Số mốc (5 ảnh, 150 ký tự, 3 tag, 90 ngày, 100 lượt xem) phải khớp
 * `vc-ai/AI-Analysic/app/core/f29/` và `HEALTH_SPEC.md`.
 */

import { AlertTriangle, ArrowRight, CheckCircle2, CircleDashed } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Chip, type Tone } from './ui';
import type { ConversionDetail, HealthAxis, HealthStatus, HealthTodo } from '../types';

export const AXIS_ORDER: HealthAxis[] = ['content', 'inventory', 'freshness', 'rating', 'conversion'];

/** Trọng số khi đủ cả năm tiêu chí (health-1.0). */
export const AXIS_WEIGHT: Record<HealthAxis, number> = {
  conversion: 0.3,
  rating: 0.25,
  content: 0.2,
  inventory: 0.15,
  freshness: 0.1,
};

export const AXIS_INFO: Record<HealthAxis, { label: string; measures: string; whyMissing: string; improve: string }> = {
  content: {
    label: 'Nội dung sản phẩm',
    measures: 'Số ảnh (nên có từ 5), độ dài mô tả (nên từ 150 ký tự) và số tag (nên từ 3).',
    whyMissing: 'Sản phẩm chưa có nội dung để chấm.',
    improve: 'Thêm ảnh rõ nét nhiều góc, mô tả chất liệu, kích thước, cách dùng, và gắn đủ tag.',
  },
  inventory: {
    label: 'Tồn kho',
    measures: 'Tỉ lệ phân loại (màu, kích cỡ) còn hàng.',
    whyMissing: 'Chỉ tính cho hàng có sẵn. Sản phẩm làm theo yêu cầu hoặc in theo mẫu không có tồn kho để chấm.',
    improve: 'Bổ sung hàng cho các phân loại đã hết, hoặc ẩn phân loại không còn bán.',
  },
  freshness: {
    label: 'Độ cập nhật',
    measures: 'Số ngày từ lần bạn sửa nội dung gần nhất. Đủ điểm trong 90 ngày, sau đó giảm dần đến 0 sau một năm.',
    whyMissing: 'Chưa xác định được lần sửa gần nhất.',
    improve: 'Xem lại ảnh, mô tả, giá định kỳ, đặc biệt trước mùa cao điểm.',
  },
  rating: {
    label: 'Đánh giá của người mua',
    measures: 'Số sao trung bình. Sản phẩm ít đánh giá được kéo về mức trung bình của sàn, để vài đánh giá đầu tiên không quyết định tất cả.',
    whyMissing: 'Chưa có người mua nào đánh giá. Tiêu chí này tự được tính khi có đánh giá đầu tiên.',
    improve: 'Giao đúng mô tả, đóng gói cẩn thận, nhắc người mua đánh giá sau khi nhận hàng.',
  },
  conversion: {
    label: 'Tỉ lệ mua',
    measures: 'Trong số người xem sản phẩm, bao nhiêu người mua, so với sản phẩm cùng danh mục.',
    whyMissing: 'Sàn mới bắt đầu ghi lượt xem. Tiêu chí này tự được tính khi sản phẩm có khoảng 100 lượt xem trong 30 ngày.',
    improve: 'Ảnh bìa hấp dẫn, giá cạnh tranh và mô tả trả lời đủ câu hỏi của người mua.',
  },
};

export const HEALTH_BANDS: { status: HealthStatus; label: string; range: string; tone: Tone }[] = [
  { status: 'good', label: 'Tốt', range: 'từ 80 điểm', tone: 'good' },
  { status: 'needs_improvement', label: 'Cần cải thiện', range: '50 đến 79', tone: 'warn' },
  { status: 'poor', label: 'Kém', range: 'dưới 50', tone: 'bad' },
];

export function healthTone(status: HealthStatus | null | undefined): Tone {
  if (status === 'good') return 'good';
  if (status === 'poor') return 'bad';
  if (status === 'needs_improvement') return 'warn';
  return 'neutral';
}

export function axisLabel(axis: string): string {
  return AXIS_INFO[axis as HealthAxis]?.label ?? axis;
}

/** Tỉ trọng THỰC áp vào điểm: tiêu chí thiếu dữ liệu bị bỏ, phần còn lại chia lại cho đủ 100%. */
export function effectiveWeights(counted: HealthAxis[]): Partial<Record<HealthAxis, number>> {
  const total = counted.reduce((s, a) => s + AXIS_WEIGHT[a], 0);
  if (!total) return {};
  return Object.fromEntries(counted.map(a => [a, AXIS_WEIGHT[a] / total]));
}

function scoreColor(score: number): string {
  if (score >= 80) return '#2f7d32';
  if (score >= 50) return '#d97706';
  return '#d03b3b';
}

export function editLink(productId: string, field?: string | null): string {
  return `/seller/products?edit=${productId}${field ? `#${field}` : ''}`;
}

/* ------------------------------------------------------------------------ */

/** Khối "Điểm này đo gì" đặt đầu trang danh sách. */
export function HealthExplainer({ counted, missing }: { counted: HealthAxis[]; missing: HealthAxis[] }) {
  const weights = effectiveWeights(counted);
  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3.5">
      <p className="m-0 text-[13px] font-bold text-stone-800">Điểm sức khoẻ cho biết listing của bạn đã chuẩn bị tốt đến đâu</p>
      <p className="m-0 mt-1 text-xs leading-relaxed text-stone-600">
        Mỗi sản phẩm được chấm 0 đến 100 điểm từ các tiêu chí dưới đây. Hiện điểm phản ánh những thứ bạn tự sửa được ngay
        (nội dung, tồn kho, độ cập nhật), <strong className="font-semibold">chưa phản ánh doanh số</strong>. Khi sản phẩm có
        lượt xem và đánh giá, điểm sẽ tính thêm hiệu quả bán hàng.
      </p>

      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
        <div>
          <p className="m-0 mb-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-stone-500">Đang dùng để chấm</p>
          <ul className="m-0 list-none space-y-1.5 p-0">
            {counted.map(axis => (
              <li key={axis} className="flex items-start gap-2 text-xs leading-relaxed text-stone-700">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[#2f7d32]" aria-hidden />
                <span>
                  <span className="font-semibold text-stone-800">{AXIS_INFO[axis].label}</span>
                  {weights[axis] != null && <span className="text-stone-500"> · chiếm {Math.round((weights[axis] as number) * 100)}% điểm</span>}
                  <span className="block text-stone-500">{AXIS_INFO[axis].measures}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        {missing.length > 0 && (
          <div>
            <p className="m-0 mb-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-stone-500">Chưa đủ dữ liệu, chưa tính</p>
            <ul className="m-0 list-none space-y-1.5 p-0">
              {missing.map(axis => (
                <li key={axis} className="flex items-start gap-2 text-xs leading-relaxed text-stone-700">
                  <CircleDashed size={14} className="mt-0.5 shrink-0 text-stone-400" aria-hidden />
                  <span>
                    <span className="font-semibold text-stone-800">{AXIS_INFO[axis].label}</span>
                    <span className="block text-stone-500">{AXIS_INFO[axis].whyMissing}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-stone-200 pt-3 text-xs text-stone-600">
        <span className="font-semibold text-stone-700">Mức điểm:</span>
        {HEALTH_BANDS.map(b => (
          <Chip key={b.status} tone={b.tone}>{b.label} · {b.range}</Chip>
        ))}
      </div>
    </div>
  );
}

function pctText(rate: number | null | undefined): string {
  return rate == null ? '—' : `${(rate * 100).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`;
}

/** Dòng giải thích riêng cho tiêu chí tỉ lệ mua: tiến độ lượt xem hoặc căn cứ so sánh. */
function ConversionNote({ detail, counted }: { detail: ConversionDetail; counted: boolean }) {
  if (counted) {
    const scope = detail.baseline_scope === 'category' ? 'cùng danh mục' : 'toàn sàn';
    return (
      <p className="m-0 mt-1 text-xs leading-relaxed text-stone-500">
        Tỉ lệ mua của sản phẩm {pctText(detail.conversion_rate)} ({detail.orders_30d} đơn / {detail.views_30d} lượt xem
        trong 30 ngày), mặt bằng sản phẩm {scope} {pctText(detail.baseline_rate)}. Bằng mặt bằng được 50 điểm, gấp đôi
        trở lên được 100 điểm.
      </p>
    );
  }
  if (detail.reason === 'not_enough_views') {
    const done = Math.min(detail.views_30d, detail.min_views);
    return (
      <div className="mt-1.5">
        <div className="mb-1 flex justify-between text-xs text-stone-500">
          <span>Đã có {detail.views_30d.toLocaleString('vi-VN')}/{detail.min_views} lượt xem trong 30 ngày</span>
          <span>{Math.round((done / detail.min_views) * 100)}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
          <div className="h-1.5 rounded-full bg-sky-500" style={{ width: `${(done / detail.min_views) * 100}%` }} />
        </div>
        <p className="m-0 mt-1 text-xs leading-relaxed text-stone-500">
          Đủ {detail.min_views} lượt xem, tiêu chí này tự được tính. Ít hơn thì tỉ lệ mua dao động quá mạnh để kết luận.
        </p>
      </div>
    );
  }
  const why = detail.reason === 'not_enough_peers'
    ? 'Sản phẩm đã đủ lượt xem, nhưng sàn chưa có đủ 5 sản phẩm đủ lượt xem để làm mặt bằng so sánh.'
    : 'Sản phẩm đã đủ lượt xem, nhưng các sản phẩm dùng để so sánh chưa có đơn nào nên chưa có mặt bằng.';
  return <p className="m-0 mt-1 text-xs leading-relaxed text-stone-500">{why}</p>;
}

/** Danh sách năm tiêu chí của MỘT sản phẩm, kèm điểm, tỉ trọng thực và giải thích. */
export function HealthAxisList({ axes, missing, conversionDetail }: {
  axes: Partial<Record<HealthAxis, number | null>>;
  missing: string[];
  conversionDetail?: ConversionDetail | null;
}) {
  const counted = AXIS_ORDER.filter(a => axes[a] != null && !missing.includes(a));
  const weights = effectiveWeights(counted);
  return (
    <ul className="m-0 list-none space-y-3.5 p-0">
      {AXIS_ORDER.map(axis => {
        const info = AXIS_INFO[axis];
        const score = axes[axis];
        const isCounted = counted.includes(axis);
        return (
          <li key={axis}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
              <span className="font-semibold text-stone-800">
                {info.label}
                {isCounted && <span className="ml-1.5 text-xs font-normal text-stone-400">chiếm {Math.round((weights[axis] ?? 0) * 100)}% điểm</span>}
              </span>
              <span className="tabular-nums font-semibold text-stone-800">
                {isCounted && score != null ? `${Math.round(score)}/100` : <span className="text-xs font-normal text-stone-500">Chưa tính</span>}
              </span>
            </div>
            {isCounted && score != null ? (
              <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                <div className="h-2 rounded-full" style={{ width: `${Math.max(2, Math.min(100, score))}%`, background: scoreColor(score) }} />
              </div>
            ) : (
              <div className="h-2 w-full rounded-full border border-dashed border-stone-200" />
            )}
            {axis === 'conversion' && conversionDetail ? (
              <ConversionNote detail={conversionDetail} counted={isCounted} />
            ) : (
              <p className="m-0 mt-1 text-xs leading-relaxed text-stone-500">
                {isCounted ? info.measures : info.whyMissing}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Một việc tăng điểm: nội dung · +điểm · nút sửa. */
export function TodoItem({ todo, index, productId }: { todo: HealthTodo; index: number; productId: string }) {
  return (
    <li className="flex items-start gap-2.5 text-[13px] leading-relaxed text-stone-700">
      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EAF0E2] text-[11px] font-bold text-[#005B00]">
        {index + 1}
      </span>
      <span className="flex-1">
        {todo.message}
        {todo.impact != null && todo.impact > 0 && (
          <span className="ml-1.5 whitespace-nowrap font-semibold text-[#005B00]">+{todo.impact.toLocaleString('vi-VN')} điểm</span>
        )}
      </span>
      {todo.field && (
        <Link
          to={editLink(productId, todo.field)}
          className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-xs font-semibold text-[#007700] no-underline hover:underline"
        >
          Sửa ngay <ArrowRight size={13} aria-hidden />
        </Link>
      )}
    </li>
  );
}

/** Một cảnh báo: không trừ điểm nhưng nên kiểm tra. */
export function WarningItem({ todo, productId }: { todo: HealthTodo; productId: string }) {
  return (
    <li className="flex items-start gap-2.5 text-[13px] leading-relaxed text-amber-900">
      <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-600" aria-hidden />
      <span className="flex-1">{todo.message}</span>
      {todo.field && (
        <Link
          to={editLink(productId, todo.field)}
          className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-xs font-semibold text-amber-800 no-underline hover:underline"
        >
          Kiểm tra <ArrowRight size={13} aria-hidden />
        </Link>
      )}
    </li>
  );
}
