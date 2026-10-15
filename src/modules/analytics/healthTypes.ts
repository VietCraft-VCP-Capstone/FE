/**
 * Kiểu của lịch sử điểm và "xem điểm nếu sửa" (F29). Tách khỏi `types.ts` vì file đó
 * đã quá dài.
 */

import type { HealthAxis, HealthStatus } from './types';

export type HealthAxes = Partial<Record<HealthAxis, number | null>>;

/** Một ngày trong `listing_health_scores`, BE trả tăng dần theo ngày. */
export interface HealthHistoryPoint {
  date: string;
  score: number;
  status: HealthStatus | null;
  axes: HealthAxes;
}

/** Bốn chỉ số seller sửa được. Trần khớp BE `health-preview.ts` và AI `HealthPreviewBody`. */
export type PreviewLever = 'n_images' | 'description_length' | 'n_tags' | 'in_stock_ratio_pct';

export type PreviewInputs = Partial<Record<PreviewLever, number>>;

export interface HealthPreview {
  product_id: string;
  score: number | null;
  status: HealthStatus | null;
  axes: HealthAxes;
  axes_missing: string[];
  current_score: number | null;
  delta_vs_current: number | null;
  /** Giá trị đã dùng để chấm thử: lever không gửi lên thì là giá trị thật hiện tại. */
  inputs: Record<PreviewLever, number | null>;
  current_inputs: Record<PreviewLever, number | null>;
  /** Lever không áp được, vd. tồn kho với sản phẩm làm theo yêu cầu. */
  ignored: PreviewLever[];
}
