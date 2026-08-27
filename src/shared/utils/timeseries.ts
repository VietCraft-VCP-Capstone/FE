/**
 * Gom bản ghi theo NGÀY để vẽ biểu đồ xu hướng.
 *
 * Vì sao gom ở FE: BE chưa có endpoint thống kê theo thời gian. Mọi con số ở đây
 * suy ra từ `created_at` của bản ghi THẬT đã tải về — không sinh dữ liệu mô phỏng.
 *
 * Hệ quả phải nói rõ ngoài giao diện: cửa sổ thời gian chỉ đúng trong phạm vi số
 * bản ghi đã tải (các endpoint đều có phân trang). Nơi gọi phải đối chiếu số bản
 * ghi lấy được với tổng số và ghi chú nếu mới chỉ tính trên một phần.
 *
 * Toàn bộ mốc ngày tính theo giờ ĐỊA PHƯƠNG. Không dùng toISOString() để lấy khoá
 * ngày: hàm đó trả giờ UTC, ở múi giờ +07 sẽ đẩy mọi bản ghi tạo trước 07:00 sang
 * ngày hôm trước.
 */

export interface DayBucket {
  /** Khoá 'YYYY-MM-DD' theo giờ địa phương — dùng để tra cứu, không hiển thị. */
  key: string;
  /** Nhãn trục hoành 'DD/MM'. */
  label: string;
  /** 00:00 của ngày đó. */
  start: Date;
}

/** 00:00 giờ địa phương của ngày chứa `d`. */
export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

const pad2 = (n: number) => String(n).padStart(2, '0');

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function dayLabel(d: Date): string {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
}

/** Chuỗi `days` ngày liên tiếp KẾT THÚC ở hôm nay (bao gồm hôm nay). */
export function dayRange(days: number, now: Date = new Date()): DayBucket[] {
  const today = startOfDay(now);
  const out: DayBucket[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    out.push({ key: dayKey(d), label: dayLabel(d), start: d });
  }
  return out;
}

/** Ngày đầu tiên của cửa sổ `days` ngày kết thúc hôm nay. */
export function windowStart(days: number, now: Date = new Date()): Date {
  const today = startOfDay(now);
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1));
}

/** Chuỗi/Date/undefined -> Date hợp lệ hoặc null. Dữ liệu cũ có thể thiếu created_at. */
export function toDate(value: string | number | Date | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Đếm số bản ghi theo từng ngày. Bản ghi thiếu/sai ngày bị bỏ qua (không dồn về hôm nay). */
export function countPerDay<T>(
  items: T[],
  getDate: (item: T) => string | number | Date | null | undefined
): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of items) {
    const d = toDate(getDate(item));
    if (!d) continue;
    const key = dayKey(d);
    map.set(key, (map.get(key) || 0) + 1);
  }
  return map;
}

/** Đếm bản ghi rơi vào khoảng [from, to). `to` bỏ trống nghĩa là "đến hiện tại". */
export function countInRange<T>(
  items: T[],
  getDate: (item: T) => string | number | Date | null | undefined,
  from: Date,
  to?: Date
): number {
  const lo = from.getTime();
  const hi = to ? to.getTime() : Infinity;
  let n = 0;
  for (const item of items) {
    const d = toDate(getDate(item));
    if (!d) continue;
    const t = d.getTime();
    if (t >= lo && t < hi) n++;
  }
  return n;
}

/**
 * Số bản ghi mới trong kỳ và kỳ liền trước có ĐỘ DÀI BẰNG NHAU.
 * Hai kỳ phải bằng nhau thì tỉ lệ tăng/giảm mới có nghĩa.
 */
export function comparePeriods<T>(
  items: T[],
  getDate: (item: T) => string | number | Date | null | undefined,
  days: number,
  now: Date = new Date()
): { current: number; previous: number; deltaPercent: number | null } {
  const start = windowStart(days, now);
  const prevStart = new Date(start.getFullYear(), start.getMonth(), start.getDate() - days);
  const current = countInRange(items, getDate, start);
  const previous = countInRange(items, getDate, prevStart, start);
  // Kỳ trước bằng 0: phần trăm tăng trưởng không xác định (chia cho 0), trả null
  // để giao diện hiện "—" thay vì "+∞%" hay "+100%" sai lệch.
  const deltaPercent = previous === 0 ? null : Math.round(((current - previous) / previous) * 100);
  return { current, previous, deltaPercent };
}
