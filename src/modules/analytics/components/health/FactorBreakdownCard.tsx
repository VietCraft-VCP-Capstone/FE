import { Pencil, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { HealthFactorKey, ListingHealth } from '../../healthTypes';
import { editLink } from '../HealthParts';

const FACTOR_DETAILS: Record<
  HealthFactorKey,
  {
    title: string;
    field: string;
    guide: string[];
    actionLabel: string;
  }
> = {
  image: {
    title: 'Hình ảnh sản phẩm',
    field: 'images',
    actionLabel: 'Thêm ảnh ngay',
    guide: [
      'Đăng từ 3–5 ảnh vuông (tỷ lệ 1:1) chụp rõ nét với ánh sáng đủ, phông nền đơn giản làm nổi bật sản phẩm.',
      'Chụp đầy đủ các góc: mặt trước, mặt sau, góc nghiêng và ảnh chụp cận cảnh chất liệu vải/tem mác.',
      'Nên có ít nhất 1 ảnh bảng quy đổi kích cỡ (size chart) để người mua tự chọn size mà không cần nhắn hỏi shop.',
    ],
  },
  description: {
    title: 'Mô tả chi tiết',
    field: 'description',
    actionLabel: 'Sửa mô tả ngay',
    guide: [
      'Ghi bảng thông số kích cỡ rõ ràng: chiều dài, vòng ngực, cân nặng phù hợp để khách chọn size nhanh.',
      'Ghi rõ chất liệu vải/nguyên liệu (ví dụ: Cotton 100% co giãn 4 chiều, thoáng mát, bền màu).',
      'Nêu rõ cam kết bán hàng và chính sách đổi trả trong 7 ngày để khách lạ an tâm bấm mua.',
    ],
  },
  tags: {
    title: 'Từ khoá tìm kiếm (Tags)',
    field: 'tags',
    actionLabel: 'Thêm từ khoá',
    guide: [
      'Từ khoá (tag) là những từ khách hay gõ tìm kiếm trên sàn (nên gắn từ 3–5 từ khoá liên quan nhất).',
      'Gợi ý từ khoá: tên loại sản phẩm, kiểu dáng, phong cách (ví dụ: #ao_thun, #ao_phong_nam, #form_rong).',
      'Dùng từ ngắn gọn, chính xác (1–3 từ mỗi thẻ). Tránh gõ lại nguyên cả tên sản phẩm dài vào ô từ khoá.',
    ],
  },
  material: {
    title: 'Thông tin chất liệu & thuộc tính',
    field: 'materials',
    actionLabel: 'Điền chất liệu',
    guide: [
      'Điền đúng tên chất liệu chính vào ô Chất liệu để sản phẩm xuất hiện khi người mua lọc theo chất liệu.',
      'Nếu sản phẩm có pha chất liệu, hãy ghi rõ (ví dụ: 95% Cotton, 5% Spandex co giãn).',
      'Nhắc lại chất liệu ở Tiêu đề và Mô tả để khách tìm kiếm theo chất liệu dễ thấy shop bạn.',
    ],
  },
  review: {
    title: 'Đánh giá người mua',
    field: 'reviews',
    actionLabel: 'Xem đơn hàng',
    guide: [
      'Sản phẩm mới đăng chưa có đánh giá sẽ tự động được tính điểm tối đa ngay khi nhận được đánh giá 5★ đầu tiên.',
      'Mẹo nhỏ: Đính kèm một card nhỏ hướng dẫn đổi trả kèm lời cảm ơn để khách hài lòng và đánh giá 5★.',
      'Sản phẩm có từ 3 đánh giá kèm hình ảnh thực tế sẽ tăng gấp đôi tỷ lệ khách lạ bấm đặt hàng.',
    ],
  },
  price: {
    title: 'Giá so với thị trường',
    field: 'price',
    actionLabel: 'Điều chỉnh giá',
    guide: [
      'Mức giá bán cạnh tranh so với mặt bằng chung các sản phẩm tương tự đang bán trên sàn.',
      'Nếu giá của shop cao hơn mặt bằng, hãy tạo Voucher giảm giá hoặc quà tặng kèm để kích thích khách chốt đơn.',
      'Nếu giá của bạn đã rất tốt, hãy tập trung làm đẹp ảnh bìa và tiêu đề để thu hút lượt click vào xem.',
    ],
  },
};

function normalizeFactorKey(key?: string): HealthFactorKey {
  if (!key) return 'image';
  if (key === 'images') return 'image';
  if (key === 'content') return 'description';
  if (key === 'pricing') return 'price';
  if (key === 'production') return 'material';
  if (key === 'returns') return 'review';
  if (['image', 'description', 'tags', 'material', 'review', 'price'].includes(key)) {
    return key as HealthFactorKey;
  }
  return 'image';
}

export function FactorBreakdownCard({
  data,
  selectedFactor = 'image',
}: {
  data: ListingHealth;
  selectedFactor?: string;
}) {
  const factorKey = normalizeFactorKey(selectedFactor);
  const factor = data.breakdown.find(f => f.key === factorKey);
  const details = FACTOR_DETAILS[factorKey];

  if (!factor) return null;

  return (
    <div key={factorKey} className="space-y-3 animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/80 pb-2">
        <div className="flex items-center gap-2">
          <Lightbulb size={14} className="text-[#956400] transition-transform duration-300 hover:rotate-12 cursor-pointer" />
          <span className="text-xs font-bold text-[#111111]">
            Gợi ý tối ưu: {details.title}
          </span>
          <span className="text-[11px] text-stone-400">
            ({Math.round(factor.points)} / {factor.weight} điểm)
          </span>
        </div>

        {factorKey === 'review' ? (
          <Link
            to="/seller/orders"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-stone-100 text-stone-700 hover:bg-stone-200 active:scale-95 transition-all duration-150 no-underline"
          >
            <span>Xem đơn hàng</span>
          </Link>
        ) : (
          <Link
            to={editLink(data.product_id, details.field)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-[#111111] text-white hover:bg-stone-800 active:scale-95 shadow-xs transition-all duration-150 no-underline"
          >
            <Pencil size={11} />
            <span>{details.actionLabel}</span>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {details.guide.map((tip, idx) => (
          <div
            key={idx}
            className="group flex items-start gap-2.5 text-xs leading-relaxed text-stone-600 p-2.5 -m-2 rounded-md hover:bg-white/80 hover:shadow-xs transition-all duration-200"
          >
            <span className="font-mono text-[10px] font-bold text-stone-400 mt-0.5 group-hover:text-stone-900 group-hover:scale-110 transition-all duration-150">
              0{idx + 1}
            </span>
            <span>{tip}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
