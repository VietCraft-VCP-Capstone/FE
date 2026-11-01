/**
 * VietCraft · Từ điển từ ngữ chuẩn cho giao diện Kế hoạch Cao điểm
 * Quy tắc: Viết cho người bán hàng, không viết cho người làm thống kê.
 * Không dùng thuật ngữ kỹ thuật khó hiểu hoặc số điểm mơ hồ không rõ căn cứ.
 */

export const BANNED_TERMS = [
  'Mùa vụ',
  'Radar',
  'Lịch ra hàng',
  'Đại dương xanh',
  'Đại dương đỏ',
  'Đóng cổng',
  'Xả hàng',
  'Đang chết',
  'Bom hàng',
  'AI phân tích',
  'Sức cầu',
  'Biên lợi nhuận',
  'Cửa sổ chuẩn bị',
  'Tỉ lệ cạnh tranh',
  'p90',
  'WAPE',
  'Mô hình mốc',
  'Backtest',
  'Khoảng tin cậy',
  'Bootstrap',
  'Tuần cơ sở',
  'Ngày bắt đầu tăng bền',
  'Độ nhọn đỉnh',
  'Dấu vân tay hành vi',
  'Vùng đệm',
  'Cờ quà tặng',
  'Nhóm đối chứng',
  'Thiên lệch chọn',
  'Tiền lệ',
  'Embedding',
] as const;

export const GLOSSARY = {
  featureTitle: 'Kế hoạch Cao điểm',
  featureSubtitle: 'Dự đoán số đơn và gợi ý sản phẩm cho từng dịp mua sắm.',

  // Thay thế thuật ngữ
  occasion: 'Dịp mua sắm cao điểm',
  occasionShort: 'Dịp cao điểm',
  traitChart: 'Biểu đồ đặc điểm dịp',
  launchSchedule: 'Lịch nhập hàng và đăng bán',
  cutoffDate: 'Hạn chốt đơn',
  liquidationNeeded: 'Thanh lý tồn kho / Cần cải thiện',
  cancelledOrFailedOrder: 'Đơn hủy / giao không thành công',
  algorithmRule: 'Quy tắc / Thống kê / Dự báo',
  orderCount: 'Số đơn',
  profitMarginPercent: 'Lãi trên mỗi sản phẩm (%)',
  prepDaysLeft: 'Số ngày còn lại để chuẩn bị',
  competingShopCount: 'Số shop đang bán sản phẩm tương tự',
  demandSignal: 'Tín hiệu nhu cầu (kèm số thật)',
  precedentSimilarCase: 'Trường hợp tương tự',
  productCluster: 'Nhóm sản phẩm giống nhau (gom theo ảnh và tiêu đề)',
  staleDataNotice: (dateStr: string) => `Số liệu cập nhật lần cuối ngày ${dateStr}`,

  // Thống kê & Phân vị seller đọc là hiểu
  p90Explained: (days: number) => `Thường tối đa ${days} ngày (9 trong 10 đơn nhanh hơn mức này)`,
  medianExplained: 'Mức phổ biến: một nửa khách đặt sớm hơn, một nửa muộn hơn',
  quartilesExplained: 'Một phần tư / Một nửa / Ba phần tư số khách',
  wapeExplained: 'Dự báo lệch bao nhiêu % so với thực tế',
  baselineModelExplained: 'Cách so sánh đơn giản: lấy số của cùng dịp năm trước',
  backtestExplained: 'Thử lại trên các dịp đã qua',
  coverage80Explained: 'Trong 10 lần, khoảng dự báo chứa số thật khoảng 8 lần',
  fluctuationRange: 'Khoảng dao động',
  baselineWeek: 'Tuần thường để so sánh (8 tuần ngay trước dịp, không có sự kiện)',
  sustainedGrowthStart: 'Ngày đơn bắt đầu tăng và giữ mức cao ít nhất 3 ngày liền',
  peakConcentration: 'Mức đơn dồn vào vài ngày',
  occasionFingerprint: 'Đặc điểm mua sắm của dịp',
  bufferDays: 'Ngày dự phòng',
  giftFlag: 'Đánh dấu đơn là quà tặng',
  controlGroup: 'Nhóm so sánh (shop hoặc sản phẩm tương tự không làm theo)',
  selectionBias: 'Shop chọn làm theo có thể vốn đã khác shop không làm',
  kAnonymityNotice: 'Số liệu chung chỉ hiện khi có ít nhất 10 shop',

  // 6 trục biểu đồ đặc điểm mua sắm của dịp (Mục 9)
  axes: {
    ordersGrowth: {
      name: 'Đơn tăng mạnh',
      question: 'Số đơn mỗi ngày tăng bao nhiêu so với ngày thường?',
      unit: '%',
    },
    higherSpending: {
      name: 'Chi nhiều hơn',
      question: 'Mỗi đơn có giá trị cao hơn ngày thường bao nhiêu?',
      unit: '%',
    },
    earlyOrder: {
      name: 'Đặt sớm',
      question: 'Khách thường đặt trước ngày dịp bao nhiêu ngày?',
      unit: 'ngày',
    },
    peakClustering: {
      name: 'Mua dồn vào vài ngày',
      question: 'Bao nhiêu phần đơn rơi vào 3 ngày đông nhất?',
      unit: '%',
    },
    giftPurpose: {
      name: 'Mua để tặng',
      question: 'Bao nhiêu phần đơn là mua làm quà?',
      unit: '%',
    },
    customizationNeeded: {
      name: 'Cần làm riêng',
      question: 'Bao nhiêu phần đơn cần cá nhân hóa (khắc tên, in hình riêng)?',
      unit: '%',
    },
  },

  // 4 nhãn phân loại dữ liệu (Mục 3)
  labels: {
    observed: { text: 'Quan sát', desc: 'Số liệu thực tế trong quá khứ' },
    forecast: { text: 'Dự báo', desc: 'Ước tính từ dữ liệu lịch sử' },
    suggestion: { text: 'Gợi ý', desc: 'Đề xuất hành động có cơ sở' },
    hypothesis: { text: 'Giả thuyết', desc: 'Mới thấy đi cùng nhau, chưa chứng minh nhân quả' },
  },

  // Mức độ tin cậy
  confidence: {
    high: { text: 'Cao', desc: 'Có từ 2 kỳ lịch sử, dự báo tốt hơn cách so sánh đơn giản' },
    fair: { text: 'Khá', desc: 'Có 1 kỳ lịch sử hoặc lệch nhẹ so với thực tế' },
    preliminary: { text: 'Sơ bộ', desc: 'Ước tính từ mức chung của ngành hàng' },
    insufficient: { text: 'Chưa đủ dữ liệu', desc: 'Cần thêm số đơn hoàn tất để tính' },
  },

  // Đánh giá trường hợp tương tự
  precedentGrades: {
    A: { title: 'Thử nghiệm có kiểm soát', badge: 'Bậc A · Thử nghiệm có kiểm soát' },
    B: { title: 'So sánh có nhóm đối chiếu', badge: 'Bậc B · So sánh có nhóm đối chiếu' },
    C: { title: 'Chỉ so trước và sau', badge: 'Bậc C · Chỉ so trước và sau' },
    D: { title: 'Ví dụ lẻ', badge: 'Bậc D · Ví dụ lẻ (Bằng chứng yếu)' },
  },
} as const;

/**
 * Kiểm tra chuỗi văn bản xem có chứa từ cấm không
 */
export function checkBannedTerms(text: string): string[] {
  const found: string[] = [];
  const lower = text.toLowerCase();
  for (const term of BANNED_TERMS) {
    if (lower.includes(term.toLowerCase())) {
      found.push(term);
    }
  }
  return found;
}
