import type { HealthFactorKey } from '../../healthTypes';

export const PART: Record<HealthFactorKey, { label: string; why: string }> = {
  price: { label: 'Giá bán', why: 'Khách hay so giá giữa các shop. Giá chỉ được so với sản phẩm cùng loại, cùng chất liệu; chưa đủ sản phẩm để so thì giá chưa được tính vào điểm.' },
  image: { label: 'Hình ảnh', why: 'Khách mua online xem ảnh đầu tiên. Ảnh rõ đẹp từ nhiều góc chụp giúp khách tin tưởng bấm mua.' },
  description: { label: 'Mô tả', why: 'Mô tả giải đáp thắc mắc về kích cỡ (size), chất liệu, công năng và chính sách đổi trả hàng.' },
  tags: { label: 'Từ khoá', why: 'Từ khoá giúp sản phẩm xuất hiện khi khách gõ tìm kiếm trên sàn.' },
  material: { label: 'Chất liệu', why: 'Điền rõ chất liệu giúp sản phẩm xuất hiện khi khách dùng bộ lọc tìm kiếm và an tâm về chất lượng.' },
  review: { label: 'Đánh giá', why: 'Đánh giá từ khách đã mua giúp tạo dựng uy tín cho shop và thuyết phục khách mới chốt đơn.' },
};

export const SOURCE: Record<'learned' | 'policy' | 'floor', string> = {
  learned: 'Học từ dữ liệu sàn khác (Olist), chưa kiểm trên VietCraft',
  policy: 'Quy định của sàn',
  floor: 'Mức tối thiểu, chưa thấy giúp bán chạy hơn',
};
