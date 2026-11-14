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
  keHoach: 'Gom điều đáng chú ý nhất ở trang này và ở hai tab So sánh giá, Gợi ý từ khoá, rồi xếp theo mức ưu tiên: khẩn cấp (sản phẩm mới cạnh tranh cao, mẫu gần như trùng hàng của bạn), quan trọng (giá lệch, đối thủ tăng đột biến), khuyến nghị, duy trì. Mỗi việc lập theo luật từ chính các con số trên trang (bấm "Vì sao?" để xem), nên cùng số liệu luôn ra cùng kế hoạch.',
  viThe: 'Đây là thống kê, không phải AI. Mỗi chấm là một shop trong danh mục: trục ngang là giá trung vị các sản phẩm của shop, trục dọc là số đã bán trong 90 ngày (chỉ đơn đã giao, không tính chủ shop tự mua). Hai đường nét đứt là trung vị của danh mục, chia bốn vùng. Shop được gợi ý tham khảo là shop cùng phân khúc giá với bạn (giá trung vị lệch dưới 10%) mà bán gấp từ 2 lần.',
  soSanh: 'Đối thủ trực tiếp là shop bán cùng loại hàng với bạn và có giá gần bạn: mức độ tương đồng = tổng theo từng loại hàng của bạn (tỉ trọng loại đó × giá trung vị thấp hơn chia giá trung vị cao hơn), từ 0 tới 100. "Dẫn đầu doanh số" là các shop bán nhiều nhất. "Mẫu gần giống" do AI so tên, từ khoá, chất liệu và mô tả (đã kiểm trên 17.000 tin thật của Shopee). Xu hướng so thị phần 4 tuần gần nhất với 4 tuần trước bằng kiểm định hai tỉ lệ (tin cậy 95%), nên không nhầm tăng trưởng chung của sàn với tăng trưởng của shop. Kiểu xem Radar theo SRS 3.9.2.',
  vungGia: 'Đây là thống kê, không phải AI. Vùng giá bán chạy là khoảng giá chứa 50% lượng hàng đã bán ra trong 90 ngày (phân vị 25–75% có trọng số theo số bán), nên mẫu bán nhiều có tiếng nói lớn hơn mẫu không ai mua; dưới 3 sản phẩm có đơn thì không kết luận. Chất liệu lấy từ thông tin người bán ghi khi đăng sản phẩm (ở sản phẩm hoặc biến thể), quy về tên chuẩn theo từ điển chất liệu, vd "bông", "100% cotton" đều là cotton; cách gõ chưa có trong từ điển để riêng, không gộp bừa.',
  banChay:'Đây là thống kê, không phải AI: đếm số đã bán trong 90 ngày (chỉ đơn đã giao), bằng nhau thì xếp theo số đánh giá. Đã kiểm trên 95.000 đơn thật của Olist: cách đếm này đoán đúng 41% top 20 của quý sau, tốt hơn các cách ước lượng phức tạp hơn.',
  hangMoi: 'Mức cạnh tranh = sản phẩm mới giống hàng của bạn bao nhiêu × shop đó mạnh cỡ nào × rẻ hơn bạn bao nhiêu. Phần độ giống đã kiểm trên Shopee. Phần sức mạnh và mức rẻ hơn là quy tắc: thử trên Olist chưa thấy liên quan rõ tới việc bán giảm, nên chỉ dùng để xếp thứ tự xem trước.',
  tangToc: 'So số bán tuần gần nhất với 7 tuần trước bằng trung vị và độ lệch tuyệt đối trung vị (MAD), nên một tuần bất thường cũ không làm lệch. Ngưỡng chọn trên số bán thật của người bán Olist: chỉ báo nhầm 1,2% số tuần, và 55% cảnh báo là shop thật sự bán cao tiếp 4 tuần sau.',
};
