const FIELD_NAMES: Record<string, string> = {
  title: 'Tên sản phẩm',
  description: 'Mô tả chi tiết',
  images: 'Hình ảnh',
  category_id: 'Ngành hàng',
  categories: 'Ngành hàng',
  price: 'Giá bán',
  tags: 'Từ khoá tìm kiếm',
  materials: 'Chất liệu & thuộc tính',
  variants: 'Phân loại hàng',
};

export interface MinimalGuide {
  title: string;
  summary: string;
  tips: string[];
}

export const MINIMAL_GUIDES: Record<string, MinimalGuide> = {
  SIZE_INFO_MISSING: {
    title: 'Chưa có hướng dẫn chọn size',
    summary: 'Bảng size rõ ràng giúp khách chọn đúng, ít phải đổi trả vì không vừa.',
    tips: [
      'Ghi bảng size S, M, L, XL kèm chiều cao và cân nặng tương ứng',
      'Hoặc tải 1 ảnh bảng quy đổi kích cỡ vào bộ sưu tập ảnh',
    ],
  },
  CARE_INSTRUCTIONS_MISSING: {
    title: 'Chưa có hướng dẫn bảo quản',
    summary: 'Giúp khách dùng bền đẹp và hài lòng hơn với sản phẩm.',
    tips: ['Ghi rõ cách giặt ủi: giặt máy hay giặt tay, nhiệt độ nước, cách phơi'],
  },
  LOW_IMAGE_RESOLUTION: {
    title: 'Ảnh sản phẩm bị mờ',
    summary: 'Nên dùng ảnh từ 500x500 px trở lên (tốt nhất là 1000x1000 px) để xem sắc nét.',
    tips: ['Tải trực tiếp ảnh gốc từ điện thoại/máy ảnh, tránh ảnh chụp lại màn hình'],
  },
  BLURRY_IMAGE: {
    title: 'Ảnh bị rung hoặc nhoè nét',
    summary: 'Ảnh sắc nét tạo uy tín và giúp khách thấy rõ chất liệu thật.',
    tips: ['Chụp đủ sáng ban ngày, cố định tay hoặc dùng chân máy'],
  },
  EXTREME_ASPECT_RATIO: {
    title: 'Tỉ lệ ảnh chưa chuẩn khung vuông',
    summary: 'Nên dùng ảnh vuông 1:1 để sản phẩm không bị méo hoặc cắt lệch trên điện thoại.',
    tips: ['Cắt ảnh về khung vuông 1:1 trước khi tải lên, đặt sản phẩm ở chính giữa'],
  },
  IMAGE_UNREADABLE: {
    title: 'Chưa tải được một ảnh khi kiểm tra',
    summary: 'Có thể do ảnh nặng hoặc mạng chậm. Mở trang sản phẩm xem ảnh có hiện không.',
    tips: ['Nếu ảnh không hiện, tải lại ảnh JPG/PNG từ 500x500px', 'Nếu ảnh vẫn hiện bình thường, bấm "Kiểm tra lại"'],
  },
  IMAGE_EXTERNAL: {
    title: 'Ảnh đang lấy từ trang khác',
    summary: 'Ảnh dẫn từ trang khác có thể bị gỡ hoặc bị chặn bất cứ lúc nào, sản phẩm sẽ mất ảnh.',
    tips: ['Tải ảnh gốc lên VietCraft ở trang sửa sản phẩm', 'Chỉ dùng ảnh do shop tự chụp hoặc có quyền sử dụng'],
  },
  MATERIAL_CONTRADICTION: {
    title: 'Thông tin chất liệu chưa đồng nhất',
    summary: 'Tên sản phẩm và mô tả đang ghi 2 chất liệu khác nhau, dễ làm khách hoang mang.',
    tips: ['Thống nhất duy nhất một loại chất liệu chính xác ở cả 2 mục'],
  },
};

export function fieldName(field: string): string {
  const image = /^images\[(\d+)\]$/.exec(field);
  return image ? `Ảnh thứ ${Number(image[1]) + 1}` : FIELD_NAMES[field] ?? field;
}
