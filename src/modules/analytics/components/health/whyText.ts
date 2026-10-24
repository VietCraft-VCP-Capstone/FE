import type { HealthFactorKey } from '../../healthTypes';

export const PART: Record<HealthFactorKey, { label: string; why: string }> = {
  price: { label: 'Giá', why: 'Khách thường so giá trước khi mua. Giá cao hơn nhiều so với sản phẩm tương tự mà không giải thích lý do thì khách dễ bỏ qua.' },
  image: { label: 'Ảnh', why: 'Khách không cầm được sản phẩm, nên ảnh là thứ họ xem đầu tiên và tin nhất.' },
  description: { label: 'Mô tả', why: 'Mô tả trả lời những câu khách hay hỏi: kích thước, chất liệu, cách dùng, cách bảo quản.' },
  tags: { label: 'Tag', why: 'Tag giúp sản phẩm hiện ra khi khách tìm kiếm hoặc lọc theo chủ đề.' },
  material: { label: 'Chất liệu', why: 'Với đồ thủ công, khách luôn muốn biết sản phẩm làm từ gì.' },
  review: { label: 'Đánh giá', why: 'Đánh giá giúp khách mới tin hơn, nhưng dữ liệu chưa cho thấy nó làm sản phẩm bán chạy hơn rõ rệt, nên chỉ giữ ít điểm.' },
};

export const SOURCE: Record<'learned' | 'policy' | 'floor', string> = {
  learned: 'Tính từ dữ liệu bán hàng thật',
  policy: 'Quy định của sàn',
  floor: 'Mức tối thiểu, chưa thấy giúp bán chạy hơn',
};
