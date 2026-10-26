/**
 * Lời giải thích (nút ⓘ) và nhãn độ tin cậy cho từng phần của trang Phân tích đối thủ.
 * Số đo lấy từ phép kiểm chứng trên dữ liệu thật của Shopee và Olist (22–23/10/2026); đổi số thì sửa ở đây.
 */

import { ShieldCheck } from 'lucide-react';
import { Chip } from '../ui';

/** "Đã kiểm chứng": đã đo trên dữ liệu thật của sàn khác. "Tham khảo": quy tắc hoặc chỉ đạt một phần. */
export function NhanTinCay({ loai }: { loai: 'kiem' | 'tham' }) {
  return loai === 'kiem'
    ? <Chip tone="good" icon={<ShieldCheck size={12} aria-hidden />}>Đã kiểm chứng</Chip>
    : <Chip tone="neutral">Tham khảo</Chip>;
}

export const GIAI_THICH = {
  keHoach: 'Gom điều đáng chú ý nhất ở trang này và ở hai tab So sánh giá, Gợi ý từ khoá, rồi xếp theo mức gấp: hàng đe doạ, giá lệch, đối thủ tăng tốc, từ khoá, cách bán, theo dõi. Nếu bật mô hình ngôn ngữ, mọi con số trong câu đều được đối chiếu với số liệu gốc, nên không thể bịa số.',
  doiThuTrucTiep: 'AI so tên, từ khoá và mô tả của từng sản phẩm (TF-IDF và độ tương đồng cosine), chỉ trong cùng loại hàng và khác shop. Đã kiểm trên 17.000 tin thật của Shopee: từ 15% giống, máy bắt được 79% hàng cùng sản phẩm; từ 35% giống, 73% đúng là cùng một sản phẩm.',
  banChay: 'Đây là thống kê, không phải AI: đếm số đã bán trong 90 ngày (chỉ đơn đã giao), bằng nhau thì xếp theo số đánh giá. Đã kiểm trên 95.000 đơn thật của Olist: cách đếm này đoán đúng 41% top 20 của quý sau, tốt hơn các cách ước lượng phức tạp hơn.',
  hangMoi: 'Mức đe doạ = sản phẩm mới giống hàng của bạn bao nhiêu × shop đó mạnh cỡ nào × rẻ hơn bạn bao nhiêu. Phần độ giống đã kiểm trên Shopee. Phần sức mạnh và mức rẻ hơn là quy tắc: thử trên Olist chưa thấy liên quan rõ tới việc bán giảm, nên chỉ dùng để xếp thứ tự xem trước.',
  tangToc: 'So số bán tuần gần nhất với 7 tuần trước (z-score dùng trung vị, nên một tuần bất thường cũ không làm lệch). Ngưỡng chọn trên số bán thật của người bán Olist: chỉ báo nhầm 1,2% số tuần, và 55% cảnh báo là shop thật sự bán cao tiếp 4 tuần sau.',
  nhom: 'AI (KMeans) xếp các shop cùng danh mục thành nhóm có cách bán giống nhau, dựa trên giá, đánh giá, thời gian trả lời, số mẫu và doanh thu. Kiểm trên người bán Olist: các nhóm tách rõ nhưng chỉ ổn định ở mức vừa, nên dùng để biết ai bán giống ai, không dùng để đoán doanh thu.',
  soSanh: 'Đây là thống kê: so số thật của bạn với trung bình 5 shop dẫn đầu cùng danh mục, theo đúng bản đăng ký. Chênh lệch nhỏ được tính là ngang nhóm.',
};
