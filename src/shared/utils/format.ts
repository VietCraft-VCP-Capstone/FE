/**
 * Định dạng số / thời gian cho các màn hình thống kê.
 *
 * Gom về một chỗ để mọi bảng điều khiển hiển thị cùng một kiểu: cùng dấu phân
 * cách hàng nghìn, cùng cách rút gọn, cùng cách gọi tên khoảng thời gian.
 */

const VI = 'vi-VN';

/** 1234567 -> "1.234.567đ". Giá trị không hợp lệ về 0 chứ không hiện "NaNđ". */
export function money(value: number | null | undefined): string {
  const n = Number(value);
  return `${(Number.isFinite(n) ? n : 0).toLocaleString(VI)}đ`;
}

/**
 * Rút gọn tiền cho nhãn trục / thẻ số liệu: "1,2 tỷ", "45,2 tr", "890k".
 * Chỉ dùng nơi chật chỗ — bảng số liệu vẫn phải hiện số đầy đủ bằng money().
 *
 * "k" viết dính vào số theo đúng thói quen tiếng Việt (200k); "tr" và "tỷ" là chữ
 * viết tắt của một từ nên tách khoảng trắng cho dễ đọc.
 */
export function compactMoney(value: number | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return '0đ';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1e9) return `${sign}${trim1(abs / 1e9)} tỷ`;
  if (abs >= 1e6) return `${sign}${trim1(abs / 1e6)} tr`;
  if (abs >= 1e3) return `${sign}${trim1(abs / 1e3)}k`;
  return `${sign}${Math.round(abs)}đ`;
}

/** Một chữ số thập phân, bỏ ",0" thừa, dùng dấu phẩy kiểu Việt. */
function trim1(n: number): string {
  const s = (Math.round(n * 10) / 10).toString();
  return s.replace('.', ',');
}

/** 1234 -> "1.234". Dùng cho mọi số đếm hiển thị. */
export function count(value: number | null | undefined): string {
  const n = Number(value);
  return (Number.isFinite(n) ? n : 0).toLocaleString(VI);
}

/** Tỉ lệ phần trăm đã làm tròn. Tổng bằng 0 trả 0 thay vì NaN. */
export function percentOf(part: number, total: number): number {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

/** Dấu của biến động: "+12%", "-4%", hoặc "—" khi không so sánh được. */
export function signedPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return `${value > 0 ? '+' : ''}${value}%`;
}

/** "3 giờ trước", "hôm qua", "12/08/2026" cho mốc đã xa. */
export function timeAgo(value: string | number | Date | null | undefined): string {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';

  const diffMs = Date.now() - d.getTime();
  // Mốc trong tương lai (lệch giờ máy chủ / máy khách) không được hiện "-3 phút trước".
  if (diffMs < 0) return 'vừa xong';

  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'vừa xong';
  if (mins < 60) return `${mins} phút trước`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'hôm qua';
  if (days < 7) return `${days} ngày trước`;
  if (days < 30) return `${Math.floor(days / 7)} tuần trước`;

  return d.toLocaleDateString(VI, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** "12/08/2026 · 14:03" — dùng ở tooltip và bảng chi tiết. */
export function dateTime(value: string | number | Date | null | undefined): string {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.toLocaleDateString(VI)} · ${d.toLocaleTimeString(VI, { hour: '2-digit', minute: '2-digit' })}`;
}
