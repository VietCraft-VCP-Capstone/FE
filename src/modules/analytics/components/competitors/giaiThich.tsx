/**
 * Lời giải thích (nút ⓘ) và nhãn độ tin cậy cho từng phần của trang Phân tích đối thủ.
 * Số đo lấy từ phép kiểm chứng trên dữ liệu thật của Shopee và Olist (22–23/10/2026); đổi số thì sửa ở đây.
 */

import { ShieldCheck } from 'lucide-react';
import { Chip } from '../ui';

/** "Đã kiểm chứng": cách tính đã đo trên dữ liệu thật của sàn khác. "Ước tính": quy tắc hoặc chỉ đạt một phần. */
export function NhanTinCay({ loai }: { loai: 'kiem' | 'tham' }) {
  return loai === 'kiem'
    ? <Chip tone="good" icon={<ShieldCheck size={12} aria-hidden />}>Đã kiểm chứng</Chip>
    : <Chip tone="neutral">Ước tính</Chip>;
}

export const GIAI_THICH = {
  keHoach: 'Kế hoạch được sinh bằng hệ luật tất định, không dùng mô hình ngôn ngữ: mỗi luật đối chiếu một chỉ số (số liệu trên trang này, giá tham chiếu và từ khoá gợi ý của từng sản phẩm) với ngưỡng cố định, nên cùng dữ liệu đầu vào luôn cho cùng kết quả. Việc được phân thành bốn mức ưu tiên: khẩn cấp (sản phẩm mới có mức cạnh tranh cao, mẫu có độ tương đồng nội dung từ 35%), quan trọng (giá ngoài khoảng tham chiếu, đối thủ tăng trưởng đột biến), khuyến nghị và duy trì. Mục "Vì sao?" nêu số liệu làm căn cứ.',
  doiThu: 'Tập so sánh gồm tối đa 4 shop trong danh mục đang xem: mặc định ưu tiên shop bạn theo dõi, sau đó là shop có chỉ số tương đồng cao nhất; đổi bằng nút "Đổi shop". Tương đồng = 100 × Σ (tỉ trọng loại hàng × trung vị giá thấp hơn / trung vị giá cao hơn), lấy trên các loại hàng hai shop cùng bán. Ô chỉ được tô màu khi chênh lệch vượt ngưỡng: lượng bán gấp từ 1,5 lần và hơn từ 5 sản phẩm; thời gian trả lời lệch từ 30% và từ 5 phút; nhiều hơn từ 2 sản phẩm mới. "Trả lời khách" là trung vị thời gian từ tin nhắn đầu tiên của khách tới tin trả lời đầu tiên của chủ shop trong 90 ngày, kèm tỉ lệ lượt hỏi được trả lời; cần tối thiểu 5 lượt hỏi, lượt hỏi chưa quá 24 giờ chưa tính là bỏ lỡ. Xu hướng dùng kiểm định z cho hai tỉ lệ (mức ý nghĩa 5%) trên thị phần 4 tuần gần nhất so với 4 tuần liền trước. Kiểu xem Radar theo SRS mục 3.9.2: 5 shop doanh thu cao nhất, chuẩn hoá min–max về thang 0–100.',
  vungGia: 'Thống kê mô tả, không dùng mô hình học máy; mỗi điểm là một sản phẩm. "Giá bán chạy" là khoảng từ phân vị thứ 25 đến thứ 75 của giá, lấy trọng số theo lượng bán 90 ngày; khoảng này chứa ít nhất 50% lượng bán. Cỡ mẫu tối thiểu là 3 sản phẩm có đơn; dưới mức đó hệ thống không kết luận. Đường nét đứt là trung vị có trọng số. Chất liệu được chuẩn hoá từ thông tin người bán khai báo theo từ điển chất liệu (ví dụ "bông" và "100% cotton" cùng quy về cotton).',
  banChay: 'Thống kê mô tả, không dùng mô hình học máy: sản phẩm được xếp theo lượng bán 90 ngày (chỉ tính đơn đã giao thành công); khi bằng nhau thì xếp theo số lượt đánh giá. Top 20 không gồm sản phẩm của bạn; dòng "Bạn" là sản phẩm bán chạy nhất của bạn, kèm thứ hạng khi xếp chung toàn danh mục. Phương pháp đã kiểm chứng trên 95.000 đơn hàng thực của bộ dữ liệu Olist: Precision@20 = 0,41 và NDCG@20 = 0,54 khi dự đoán top 20 của 90 ngày kế tiếp, cao hơn mô hình Gamma-Poisson Bayes.',
  theoDoi: 'Danh sách shop đang theo dõi (tối đa 10, SRS mục 3.9.5). "Sản phẩm mới" là số sản phẩm shop đăng trong 8 tuần gần nhất; "Cạnh tranh cao" là số sản phẩm trong số đó thuộc ngách của bạn và có mức cạnh tranh từ 50/100. Đường nhỏ biểu diễn lượng bán theo tuần trong 8 tuần, mọi dòng dùng chung một thang; điểm cuối là tuần gần nhất. Nhãn "Tăng đột biến" dùng điểm z bền vững: lượng bán tuần gần nhất so với trung vị 7 tuần liền trước, chuẩn hoá theo 1,4826 × MAD; cảnh báo khi z ≥ 3,5 và vượt trung vị ít nhất 3 sản phẩm; "gấp X lần" là tỉ số giữa hai giá trị này. Kiểm chứng trên dữ liệu Olist năm 2018: tỉ lệ cảnh báo sai 1,2% số tuần. Chọn tên shop để xem hồ sơ, sản phẩm và chương trình khuyến mãi.',
  hangMoi: 'Biểu đồ: mỗi điểm là một sản phẩm mới, trục hoành là ngày đăng, trục tung là mức cạnh tranh; con số cạnh điểm là điểm cạnh tranh, khớp với danh sách bên dưới. Chỉ đánh giá sản phẩm thuộc ngách của bạn, tức trùng ít nhất một từ khoá hoặc cùng loại hàng với sản phẩm bạn đang bán. Mức cạnh tranh (0–100) là tích của ba thành phần: độ tương đồng nội dung (cosine trên biểu diễn TF-IDF), sức mạnh của shop (lượng bán so với shop dẫn đầu) và mức chênh giá khi đối thủ rẻ hơn; từ 50 là cao, từ 25 là vừa. Độ tương đồng đã kiểm chứng trên bộ dữ liệu Shopee Product Matching (F1 = 0,707 tại ngưỡng 0,35); hai thành phần còn lại là quy tắc kinh nghiệm, nên chỉ số này là ước tính để xếp thứ tự ưu tiên, không phải dự báo thiệt hại.',
};
