/**
 * Định dạng riêng cho khu phân tích. Tiền và số đếm dùng lại shared/utils/format.
 *
 * Quy ước: giá trị null luôn hiện "Chưa có", không bao giờ hiện 0 — thiếu dữ liệu khác
 * với bằng không. Không dùng gạch ngang dài làm ký hiệu trống.
 */

export const NA = '—';

const VI = 'vi-VN';

/** 3.35 -> "3,35%". */
export function pct(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return NA;
  return `${value.toLocaleString(VI, { maximumFractionDigits: digits })}%`;
}

/** Biến động so kỳ trước: "+12,4%" / "-3,1%". */
export function delta(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  const text = Math.abs(value).toLocaleString(VI, { maximumFractionDigits: digits });
  if (value > 0) return `+${text}%`;
  if (value < 0) return `-${text}%`;
  return '0%';
}

/** Số thập phân kiểu Việt: 0.8292 -> "0,83". */
export function decimal(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return NA;
  return value.toLocaleString(VI, { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

/** "2026-08-01" -> "01/08". */
export function shortDate(iso: string | null | undefined): string {
  if (!iso) return NA;
  const [y, m, d] = iso.slice(0, 10).split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}`;
}

/** "2026-08-01" -> "01/08/2026". */
export function fullDate(iso: string | null | undefined): string {
  if (!iso) return NA;
  const [y, m, d] = iso.slice(0, 10).split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

/** Khoảng ngày: "01/08 đến 30/08/2026". */
export function dateRange(from: string | null | undefined, to: string | null | undefined): string {
  if (!from || !to) return NA;
  return `${shortDate(from)} đến ${fullDate(to)}`;
}

export const RANGE_OPTIONS = [
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
  { value: '90d', label: '90 ngày' },
  { value: '180d', label: '6 tháng' },
  { value: '365d', label: '1 năm' },
] as const;
