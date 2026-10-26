import type { HealthFactorKey } from '../../healthTypes';

export const PART: Record<HealthFactorKey, { label: string; why: string }> = {
  price: { label: 'Giá bán', why: 'Khách hay so sánh giá với các shop khác. Giá hợp lý và cạnh tranh giúp tăng nhanh tỷ lệ chốt đơn.' },
  image: { label: 'Hình ảnh', why: 'Khách mua online xem ảnh đầu tiên. Ảnh rõ đẹp từ nhiều góc chụp giúp khách tin tưởng bấm mua.' },
  description: { label: 'Mô tả', why: 'Mô tả giải đáp thắc mắc về kích cỡ (size), chất liệu, công năng và chính sách đổi trả hàng.' },
  tags: { label: 'Từ khoá', why: 'Từ khoá giúp sản phẩm xuất hiện khi khách gõ tìm kiếm trên sàn.' },
  material: { label: 'Chất liệu', why: 'Điền rõ chất liệu giúp sản phẩm xuất hiện khi khách dùng bộ lọc tìm kiếm và an tâm về chất lượng.' },
  review: { label: 'Đánh giá', why: 'Đánh giá từ khách đã mua giúp tạo dựng uy tín cho shop và thuyết phục khách mới chốt đơn.' },
};

export const SOURCE: Record<'learned' | 'policy' | 'floor', string> = {
  learned: 'Tính từ dữ liệu bán hàng thật',
  policy: 'Quy định của sàn',
  floor: 'Mức tối thiểu, chưa thấy giúp bán chạy hơn',
};
