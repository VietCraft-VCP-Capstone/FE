/**
 * VietCraft · Định nghĩa kiểu dữ liệu cho Bằng chứng minh bạch & Kế hoạch Cao điểm
 * Tuân thủ tuyệt đối quy tắc: Con số không có bằng chứng thì không hiển thị.
 * Mỗi con số có đủ 3 thành phần: đơn vị, so với cái gì, trong khoảng thời gian nào.
 */

export type ConfidenceLevel = 'high' | 'fair' | 'preliminary' | 'insufficient';

export type MetricLabel = 'observed' | 'forecast' | 'suggestion' | 'hypothesis';

export type PrecedentGrade = 'A' | 'B' | 'C' | 'D';

/**
 * Ngăn "Con số này từ đâu ra?" gồm 11 mục cố định viết bằng câu hỏi để seller tự đọc.
 */
export interface Evidence {
  id: string;
  /** 1. Con số này là gì? Định nghĩa một câu ngắn gọn */
  definition: string;
  /** 2. Lấy từ đâu? Bảng hoặc nguồn dữ liệu nào */
  sources: string[];
  /** 2b. Cách trích xuất dữ liệu */
  howObtained: string;
  /** 3. Đã loại bỏ những gì? (Ví dụ: bỏ đơn hủy, bỏ những ngày hết hàng) */
  excluded?: string;
  /** 4. Trong khoảng thời gian nào [từ ngày, đến ngày] */
  period: [string, string];
  /** 4b. Cỡ mẫu (n): bao nhiêu đơn / bao nhiêu shop / bao nhiêu lượt tìm kiếm */
  n: number;
  /** 5. Tính như thế nào? Công thức bằng lời kèm ví dụ tính cụ thể */
  formula: string;
  /** 6. Dao động trong khoảng nào và tỷ lệ lần khoảng chứa số thật */
  interval?: {
    low: number;
    high: number;
    coverage: number; // Ví dụ: 0.8 (Trong 10 lần, khoảng chứa số thật khoảng 8 lần)
  };
  /** 7. Độ tin cậy: Cao / Khá / Sơ bộ / Chưa đủ dữ liệu */
  confidence: ConfidenceLevel;
  /** 7b. Lý do xếp độ tin cậy bằng một câu */
  confidenceReason: string;
  /** 8. So với gì? So với cùng dịp lần trước, so với tuần thường */
  comparison?: string;
  /** 9. Có thể sai vì sao? Danh sách các lý do rủi ro */
  mayBeWrongBecause: string[];
  /** 10. Cập nhật lần cuối khi nào */
  updatedAt: string;
  /** 10b. Bản mô hình hoặc thuật toán sử dụng */
  modelVersion?: string;
  /** 11. Xem dữ liệu gốc hoặc tải danh sách */
  rawDataUrl?: string;
}

/**
 * Một giá trị chỉ số kèm đơn vị, đối tượng so sánh và bản chụp bằng chứng.
 * Ràng buộc: Thiếu đơn vị hoặc đối tượng so sánh sẽ không hợp lệ.
 */
export interface Metric<T = number | string> {
  value: T;
  unit: string;
  comparedWith: string;
  label: MetricLabel;
  evidence: Evidence;
}

/**
 * Thẻ trường hợp tương tự (Precedent): Đã có ai làm việc này chưa và kết quả ra sao?
 */
export interface Precedent {
  id: string;
  action: string;
  where: string;
  when: string;
  result: string;
  method: string;
  grade: PrecedentGrade;
  similarity: string;
  sourceUrl: string;
  checkedAt: string;
  reviewer: string;
}

/**
 * 6 trục Đặc điểm mua sắm của dịp (Mục 9)
 */
export type OccasionTraitKey =
  | 'ordersGrowth'
  | 'higherSpending'
  | 'earlyOrder'
  | 'peakClustering'
  | 'comboPurchase'
  | 'voucherSensitivity';

export interface OccasionTraitItem {
  key: OccasionTraitKey;
  name: string;
  question: string;
  baselineValue: number | string;
  occasionValue: number | string;
  diffText: string;
  unit: string;
  /** Vị trí 0–100 trên trục: càng xa tâm thì dịp này càng cao hơn các dịp khác ở đặc điểm đó */
  percentileRank: number;
  confidence: ConfidenceLevel;
  evidence: Evidence;
}

/**
 * Kế hoạch 4 giai đoạn của 1 dịp
 */
export interface OccasionStage {
  name: 'Chuẩn bị hàng' | 'Tăng tốc' | 'Cao điểm' | 'Chốt đơn sớm';
  startDay: string;
  endDay: string;
  daysRemaining: number;
  description: string;
  basis: string;
}

/**
 * Dữ liệu nhóm sản phẩm nên cân nhắc (Ma trận 4 ô Mục 7.3)
 */
export interface OpportunityCluster {
  id: string;
  title: string;
  category: string;
  quadrant: 'good_opportunity' | 'high_competition' | 'niche_market' | 'avoid';
  quadrantLabel: 'Cơ hội tốt' | 'Cạnh tranh cao' | 'Thị trường ngách' | 'Nên tránh';
  orderCountRange: string;
  sellerCount: number;
  newSellersLast30Days: number;
  searchTrendPct: number;
  priceRange: string;
  platform?: string;
  productUrl?: string;
  sellerName?: string;
  soldCount?: number;
  representativeProducts: Array<{
    title: string;
    imageUrl: string;
    priceVnd: number;
    platform?: string;
    productUrl?: string;
    sellerName?: string;
    soldCount?: number;
    ratingAverage?: number;
  }>;
  sellers?: Array<{
    sellerName: string;
    platform?: string;
    listingCount: number;
    soldCount: number;
    minPriceVnd?: number | null;
    maxPriceVnd?: number | null;
    topProductTitle?: string;
    topProductUrl?: string;
    ratingAverage?: number;
  }>;
  clusteringMethod: string;
  evidence: Evidence;
}
