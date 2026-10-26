import { Tooltip } from 'antd';
import {
  Image as ImageIcon,
  FileText,
  Tag as TagIcon,
  Layers,
  Star,
  DollarSign,
  Info,
  HelpCircle,
} from 'lucide-react';
import { decimal, vnd } from '../../format';
import type { HealthFactor, HealthFactorKey, ListingHealth } from '../../healthTypes';

interface FactorMeta {
  title: string;
  icon: typeof ImageIcon;
  tooltip: string;
}

const FACTOR_META: Record<HealthFactorKey, FactorMeta> = {
  image: {
    title: 'Hình ảnh sản phẩm',
    icon: ImageIcon,
    tooltip: 'Khách mua online xem ảnh đầu tiên (khuyến nghị từ 3–5 ảnh vuông 1:1 rõ nét).',
  },
  description: {
    title: 'Mô tả chi tiết',
    icon: FileText,
    tooltip: 'Mô tả rõ ràng kích cỡ, chất liệu và chính sách đổi trả giúp khách yên tâm chốt đơn.',
  },
  tags: {
    title: 'Từ khoá tìm kiếm (Tags)',
    icon: TagIcon,
    tooltip: 'Gắn từ khoá tìm kiếm giúp khách dễ dàng tìm thấy sản phẩm khi gõ tìm trên sàn.',
  },
  material: {
    title: 'Thuộc tính & Chất liệu',
    icon: Layers,
    tooltip: 'Điền rõ chất liệu giúp sản phẩm xuất hiện khi khách dùng bộ lọc tìm kiếm trên sàn.',
  },
  review: {
    title: 'Đánh giá người mua',
    icon: Star,
    tooltip: 'Đánh giá 5 sao từ khách mua thật. Với sản phẩm mới đăng, điểm sẽ tự kích hoạt tối đa khi có đơn đầu tiên.',
  },
  price: {
    title: 'Giá so với thị trường',
    icon: DollarSign,
    tooltip: 'Mức giá bán cạnh tranh so với mặt bằng chung các sản phẩm tương tự trên sàn.',
  },
};

function formatFactorValue(row: HealthFactor): string {
  if (row.missing || row.value === null) return 'Chưa có';
  switch (row.key) {
    case 'image':
      return `${decimal(row.value, 0)} / ${row.target ?? 5} ảnh`;
    case 'description':
      return `${decimal(row.value, 0)} từ`;
    case 'tags':
      return `${decimal(row.value, 0)} từ khoá`;
    case 'material':
      return row.value > 0 ? 'Đã điền' : 'Chưa điền';
    case 'review':
      return row.value > 0 ? `${row.value}★` : 'Chờ đơn đầu';
    case 'price':
      return vnd(row.value);
    default:
      return String(row.value);
  }
}

export function FactorGrid({
  data,
  selectedFactor,
  onSelectFactor,
}: {
  data: ListingHealth;
  selectedFactor?: string;
  onSelectFactor?: (id: string) => void;
}) {
  const activeKey = selectedFactor === 'images' ? 'image' : selectedFactor === 'content' ? 'description' : selectedFactor === 'pricing' ? 'price' : (selectedFactor ?? 'image');

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            6 Tiêu chuẩn chất lượng
          </span>
          <Tooltip title="6 tiêu chuẩn cơ bản được sàn sử dụng để đánh giá độ hoàn thiện và chất lượng tin đăng.">
            <Info size={12} className="text-stone-300 hover:text-stone-600 cursor-help" />
          </Tooltip>
        </div>
        <span className="text-[11px] text-stone-400">Bấm từng mục để xem gợi ý</span>
      </div>

      <div className="mt-3 border border-stone-200/90 rounded-md overflow-hidden grid grid-cols-2 md:grid-cols-3 divide-x divide-y divide-stone-100">
        {data.breakdown.map(factor => {
          const meta = FACTOR_META[factor.key] ?? {
            title: factor.label,
            icon: HelpCircle,
            tooltip: 'Tiêu chuẩn chất lượng tin đăng.',
          };
          const Icon = meta.icon;
          const isSelected = activeKey === factor.key;
          const isPassed = factor.sub_score >= 100;
          const isReviewWaiting = factor.key === 'review' && (factor.value === null || factor.value === 0 || factor.points <= 0);
          const isFailed = !isReviewWaiting && (factor.missing || factor.points <= 0);

          const statusBadge = isPassed
            ? 'bg-[#EAF0E2] text-[#007700]'
            : isReviewWaiting
            ? 'bg-stone-100 text-stone-600'
            : isFailed
            ? 'bg-rose-50 text-[#BA1A1A]'
            : 'bg-amber-50 text-amber-800';

          const statusText = isPassed
            ? 'Đạt chuẩn'
            : isReviewWaiting
            ? 'Sản phẩm mới'
            : isFailed
            ? 'Chưa đạt'
            : 'Cần thêm';

          return (
            <button
              key={factor.key}
              type="button"
              onClick={() => onSelectFactor?.(factor.key)}
              className={`group flex flex-col justify-between p-3.5 text-left transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                isSelected
                  ? 'bg-stone-50 border-l-2 border-l-[#007700] shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)]'
                  : 'bg-white hover:bg-stone-50/70'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-stone-400 group-hover:text-stone-800 group-hover:scale-110 transition-all duration-200">
                      <Icon size={13} />
                    </span>
                    <span className="text-xs font-semibold text-stone-800 truncate">{meta.title}</span>
                  </div>
                  <Tooltip title={meta.tooltip} placement="top">
                    <Info size={11} className="text-stone-300 hover:text-stone-600 shrink-0 cursor-help transition-colors" />
                  </Tooltip>
                </div>

                <div className="mt-2.5 flex items-baseline justify-between gap-1">
                  <span className="font-jakarta text-sm font-bold text-[#111111] truncate group-hover:translate-x-0.5 transition-transform duration-150">
                    {formatFactorValue(factor)}
                  </span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 transition-transform duration-150 group-hover:scale-105 ${statusBadge}`}>
                    {statusText}
                  </span>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                <span>Điểm đạt được:</span>
                <span className="font-mono font-bold text-stone-700 transition-colors group-hover:text-stone-900">
                  {Math.round(factor.points)} / {factor.weight}đ
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
