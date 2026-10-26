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
    title: 'Ảnh sản phẩm',
    field: 'images',
    actionLabel: 'Thêm ảnh ngay',
    guide: [
      'Chụp ít nhất 5 ảnh với ánh sáng tự nhiên, phông nền đơn giản làm nổi bật sản phẩm.',
      'Chụp đầy đủ các góc: góc nhìn toàn cảnh, góc nghiêng 45 độ, và góc đặt trong không gian sống.',
      'Chụp cận cảnh đường kim mũi chỉ, hoa văn gốm sứ hoặc thớ gỗ để khách cảm nhận sự tỉ mỉ.',
    ],
  },
  description: {
    title: 'Mô tả chi tiết',
    field: 'description',
    actionLabel: 'Sửa mô tả ngay',
    guide: [
      'Nêu rõ kích thước thực tế (dài, rộng, cao, cân nặng) để khách dễ hình dung kích cỡ.',
      'Kể ngắn gọn câu chuyện làng nghề, cảm hứng tạo tác hoặc ý nghĩa văn hoá của sản phẩm.',
      'Ghi rõ hướng dẫn bảo quản (ví dụ: tránh ẩm ướt, lau bằng khăn mềm, cách giặt đồ thêu tay).',
    ],
  },
  tags: {
    title: 'Thẻ từ khoá (tags)',
    field: 'tags',
    actionLabel: 'Thêm thẻ từ khoá',
    guide: [
      'Thẻ từ khoá (tag) là những từ khách hay gõ tìm kiếm trên sàn (nên gắn từ 3–5 thẻ liên quan).',
      'Gợi ý gắn thẻ chất liệu & công dụng: #thủ_công, #len_cừu, #áo_ấm, #đồ_mùa_đông, #quà_tặng.',
      'Dùng từ ngắn gọn, chính xác (1-3 từ mỗi thẻ). Tránh gõ lại nguyên cả tên sản phẩm vào ô tag.',
    ],
  },
  material: {
    title: 'Chất liệu chế tác',
    field: 'materials',
    actionLabel: 'Cập nhật chất liệu',
    guide: [
      'Điền chính xác tên chất liệu vào ô Chất liệu trong trang sửa sản phẩm.',
      'Nếu sản phẩm kết hợp nhiều chất liệu, hãy liệt kê đầy đủ (ví dụ: khung gỗ sồi kết hợp mây đan mắt cáo).',
      'Nhắc lại chất liệu trong tiêu đề hoặc đoạn đầu mô tả để khách tìm kiếm bằng chất liệu dễ thấy.',
    ],
  },
  review: {
    title: 'Đánh giá người mua',
    field: 'reviews',
    actionLabel: 'Xem đơn hàng',
    guide: [
      'Sản phẩm mới chưa có đánh giá sẽ tự động được kích hoạt điểm ngay khi nhận được đánh giá 5★ đầu tiên.',
      'Mẹo nhỏ: Đính kèm một bức thiệp cảm ơn viết tay mộc mạc trong kiện hàng để tạo thiện cảm và mời khách đánh giá.',
      'Đánh giá thực tế từ khách đã mua là yếu tố thuyết phục nhất để những người xem sau bấm chốt đơn.',
    ],
  },
  price: {
    title: 'Giá so với thị trường',
    field: 'price',
    actionLabel: 'Điều chỉnh giá',
    guide: [
      'Mức giá hợp lý so với các sản phẩm cùng nhóm hàng thủ công trên sàn.',
      'Nếu sản phẩm thủ công có giá cao hơn mặt bằng, hãy làm nổi bật giá trị độc bản và công sức nghệ nhân.',
      'Khách hàng sẵn sàng chi trả mức giá xứng đáng nếu họ cảm nhận được sự tâm huyết và chất lượng.',
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
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/80 pb-2">
        <div className="flex items-center gap-2">
          <Lightbulb size={14} className="text-[#956400]" />
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
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors no-underline"
          >
            <span>Xem đơn hàng</span>
          </Link>
        ) : (
          <Link
            to={editLink(data.product_id, details.field)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-[#111111] text-white hover:bg-stone-800 transition-colors no-underline"
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
            className="flex items-start gap-2.5 text-xs leading-relaxed text-stone-600"
          >
            <span className="font-mono text-[10px] font-bold text-stone-400 mt-0.5">
              0{idx + 1}
            </span>
            <span>{tip}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
