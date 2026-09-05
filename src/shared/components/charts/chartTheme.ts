/**
 * Bảng màu và quy cách nét vẽ dùng chung cho MỌI biểu đồ trong ứng dụng.
 *
 * ĐỪNG đổi mã màu theo cảm tính. Bộ ba dưới đây đã được kiểm bằng công cụ đo
 * khoảng cách màu (OKLab ΔE) trên nền trắng, theo thứ tự xanh → lam → đỏ:
 *   - dải sáng, độ bão hoà, tương phản nền: đạt
 *   - phân biệt được với mù màu (protan/deutan/tritan) giữa các phần KỀ NHAU: đạt
 * Riêng cặp xanh lá ↔ đỏ đứng cạnh nhau thì người mù màu đỏ-lục KHÔNG phân biệt
 * được, nên trong biểu đồ chồng phần luôn xếp lam ở giữa, và mọi phần đều có
 * nhãn chữ + số đi kèm — màu không bao giờ là kênh thông tin duy nhất.
 */

export const SERIES = {
  /** Vị trí 1 — xanh thương hiệu. Trạng thái "khoẻ mạnh / đang chạy". */
  green: '#1a6b1a',
  /** Vị trí 2 — lam. Trạng thái trung tính: nháp, tạm ngừng. */
  blue: '#2a78d6',
  /** Vị trí 3 — đỏ. Trạng thái cần xử lý: bị gỡ, hết hàng. */
  red: '#d03b3b',
} as const;

/** Phần khung của biểu đồ: chìm hẳn xuống, chỉ dữ liệu được phép nổi. */
export const CHART_INK = {
  surface: '#ffffff',
  /** Lưới kẻ mảnh 1px, LIỀN NÉT (nét đứt đọc thành "ngưỡng"/"dự báo"). */
  grid: '#eceeec',
  /** Chữ trục và nhãn. */
  axis: '#6b7280',
} as const;

/** Bề dày nét — cố định để các biểu đồ không mỗi cái một kiểu. */
export const CHART_MARKS = {
  lineWidth: 2,
  /** Vùng tô dưới đường: chỉ là một lớp phủ nhạt, không phải khối màu đặc. */
  areaOpacity: 0.1,
  /** Bán kính điểm nhấn khi rê chuột (>= 8px đường kính). */
  activeDotRadius: 4,
  /** Viền màu nền quanh điểm để nó không lẫn vào đường. */
  activeDotRing: 2,
  /** Trần bề rộng cột. Cột béo lấp kín ô đọc rất ồn; phần thừa để trống. */
  maxBarWidth: 24,
} as const;
