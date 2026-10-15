/**
 * Phần dùng chung của F29 (Sức khoẻ sản phẩm) cho trang danh sách và trang chi tiết.
 *
 * Mọi câu chữ giải thích tiêu chí nằm ở đây để hai trang luôn nói cùng một điều.
 * Số mốc (5 ảnh, 150 ký tự, 3 tag, 90 ngày, 100 lượt xem) phải khớp
 * `vc-ai/AI-Analysic/app/core/f29/` và `HEALTH_SPEC.md`.
 */

import { AlertTriangle, CheckCircle2, Circle, CircleDashed } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Chip, type Tone } from './ui';
import type { HealthAxis, HealthStatus, HealthTodo } from '../types';

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
    measures: 'Ảnh, độ dài mô tả và số tag đã duyệt. Mỗi phần chấm theo mốc rồi lấy trung bình.',
    whyMissing: 'Sản phẩm chưa có nội dung để chấm.',
    improve: 'Thêm ảnh rõ nét nhiều góc, mô tả chất liệu, kích thước, cách dùng, và gắn đủ tag.',
  },
  inventory: {
    label: 'Tồn kho',
    measures: 'Bao nhiêu phân loại (màu, kích cỡ) đang bán còn hàng. Chỉ tính cho hàng có sẵn.',
    whyMissing: 'Hàng làm hoặc in theo yêu cầu, hoặc chưa có phân loại đang bán, nên không tính.',
    improve: 'Bổ sung hàng cho các phân loại đã hết, hoặc ẩn phân loại không còn bán.',
  },
  freshness: {
    label: 'Độ cập nhật',
    measures: 'Lần gần nhất bạn sửa ảnh, mô tả, tag hoặc tên. Sửa giá, tồn kho không tính.',
    whyMissing: 'Chưa xác định được lần sửa gần nhất.',
    improve: 'Xem lại ảnh, mô tả, giá định kỳ, đặc biệt trước mùa cao điểm.',
  },
  rating: {
    label: 'Đánh giá của người mua',
    measures: 'Số sao người mua chấm. Khi còn ít đánh giá, điểm được kéo về mức chung của sàn.',
    whyMissing: 'Chưa có đánh giá nào. Có đánh giá đầu tiên là được tính.',
    improve: 'Giao đúng mô tả, đóng gói cẩn thận, nhắc người mua đánh giá sau khi nhận hàng.',
  },
  conversion: {
    label: 'Tỉ lệ mua',
    measures: 'Trong số người xem, bao nhiêu người mua, so với sản phẩm cùng loại.',
    whyMissing: 'Cần khoảng 100 lượt xem trong 30 ngày mới tính được.',
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

/** Phần trăm điểm thật của mỗi tiêu chí: tiêu chí thiếu dữ liệu bị bỏ, phần còn lại chia lại cho đủ 100%. */
export function effectiveWeights(counted: HealthAxis[]): Partial<Record<HealthAxis, number>> {
  const total = counted.reduce((s, a) => s + AXIS_WEIGHT[a], 0);
  if (!total) return {};
  return Object.fromEntries(counted.map(a => [a, AXIS_WEIGHT[a] / total]));
}

export function editLink(productId: string, field?: string | null): string {
  return `/seller/products?edit=${productId}${field ? `#${field}` : ''}`;
}

/* ------------------------------------------------------------------------ */

/** Nội dung "Điểm được tính thế nào?" ở trang danh sách. */
export function HealthExplainer({ counted, missing }: { counted: HealthAxis[]; missing: HealthAxis[] }) {
  return (
    <div className="space-y-3 text-[13px] leading-relaxed text-stone-700">
      <p className="m-0">
        Mỗi sản phẩm được chấm từ 0 đến 100, đo mức sản phẩm đã sẵn sàng để bán. Điểm không ảnh hưởng thứ hạng
        tìm kiếm. Mỗi việc trong danh sách đi kèm số điểm bạn sẽ được cộng khi làm xong; điểm cập nhật khoảng 1 phút sau khi sửa.
      </p>
      <ul className="m-0 list-none space-y-1.5 p-0">
        {counted.map(axis => (
          <li key={axis} className="flex items-start gap-2">
            <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#2f7d32]" aria-hidden />
            <span><strong className="font-semibold text-stone-800">{AXIS_INFO[axis].label}:</strong> {AXIS_INFO[axis].measures}</span>
          </li>
        ))}
        {missing.map(axis => (
          <li key={axis} className="flex items-start gap-2 text-stone-500">
            <CircleDashed size={15} className="mt-0.5 shrink-0 text-stone-400" aria-hidden />
            <span><strong className="font-semibold text-stone-600">{AXIS_INFO[axis].label} (chưa tính):</strong> {AXIS_INFO[axis].whyMissing}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-2">
        {HEALTH_BANDS.map(b => (
          <Chip key={b.status} tone={b.tone}>{b.label} · {b.range}</Chip>
        ))}
      </div>
    </div>
  );
}

const ACTION_BTN =
  'inline-flex h-8 shrink-0 cursor-pointer items-center rounded-md border px-3 text-xs font-semibold no-underline transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none';

/** Một việc tăng điểm: ○ nội dung · +điểm · [Sửa]. */
export function TodoItem({ todo, productId }: { todo: HealthTodo; productId: string }) {
  return (
    <li className="flex flex-wrap items-center gap-x-2.5 gap-y-1 py-1.5 text-[13px] leading-snug text-stone-700">
      <Circle size={16} className="shrink-0 text-stone-400" aria-hidden />
      <span className="min-w-[10rem] flex-1">{todo.message}</span>
      <span className="ml-auto flex shrink-0 items-center gap-2.5">
        {todo.impact != null && todo.impact > 0 && (
          <span className="whitespace-nowrap text-xs font-semibold tabular-nums text-[#005B00]">+{Math.max(1, Math.round(todo.impact))} điểm</span>
        )}
        {todo.field && (
          <Link
            to={editLink(productId, todo.field)}
            className={`${ACTION_BTN} border-stone-200 bg-white text-[#007700] hover:border-[#007700] hover:bg-[#F3F7EE] focus-visible:outline-[#007700]`}
          >
            Sửa
          </Link>
        )}
      </span>
    </li>
  );
}

/** Một cảnh báo: không trừ điểm nhưng nên kiểm tra. */
export function WarningItem({ todo, productId }: { todo: HealthTodo; productId: string }) {
  return (
    <li className="flex flex-wrap items-center gap-x-2.5 gap-y-1 py-1.5 text-[13px] leading-snug text-amber-900">
      <AlertTriangle size={16} className="shrink-0 text-amber-600" aria-hidden />
      <span className="min-w-[10rem] flex-1">{todo.message}</span>
      {todo.field && (
        <Link
          to={editLink(productId, todo.field)}
          className={`ml-auto ${ACTION_BTN} border-amber-200 bg-amber-50 text-amber-900 hover:border-amber-400 hover:bg-amber-100 focus-visible:outline-amber-600`}
        >
          Kiểm tra
        </Link>
      )}
    </li>
  );
}
