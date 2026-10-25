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
    title: 'Ảnh sản phẩm',
    icon: ImageIcon,
    tooltip: 'Khách mua hàng thủ công cần xem ảnh rõ nét từ nhiều góc độ (khuyến nghị từ 5 ảnh trở lên).',
  },
  description: {
    title: 'Mô tả chi tiết',
    icon: FileText,
    tooltip: 'Mô tả đầy đủ kích thước, công năng và câu chuyện chế tác giúp khách yên tâm chốt đơn.',
  },
  tags: {
    title: 'Thẻ từ khoá (tags)',
    icon: TagIcon,
    tooltip: 'Gắn thẻ từ khoá giúp khách hàng dễ dàng tìm thấy sản phẩm khi gõ tìm kiếm trên sàn.',
  },
  material: {
    title: 'Chất liệu chế tác',
    icon: Layers,
    tooltip: 'Hàng thủ công mỹ nghệ cần ghi rõ chất liệu (như gỗ tự nhiên, gốm Bát Tràng, lụa, sợi đay...).',
  },
  review: {
    title: 'Đánh giá người mua',
    icon: Star,
    tooltip: 'Đánh giá 5 sao từ khách mua thật. Với sản phẩm mới, sàn sẽ tự động kích hoạt điểm khi có đánh giá đầu tiên.',
  },
  price: {
    title: 'Giá so với thị trường',
    icon: DollarSign,
    tooltip: 'Mức giá bán hợp lý và cạnh tranh so với mặt bằng chung các sản phẩm tương tự trên sàn.',
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
      return `${decimal(row.value, 0)} thẻ tag`;
    case 'material':
      return row.value > 0 ? 'Đã ghi nhận' : 'Chưa có';
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

      <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2.5">
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
            ? 'bg-[#EAF0E2] text-[#007700] border-[#BECAB6]'
            : isReviewWaiting
            ? 'bg-stone-100 text-stone-600 border-stone-200'
            : isFailed
            ? 'bg-rose-50 text-[#BA1A1A] border-rose-200'
            : 'bg-amber-50 text-amber-800 border-amber-200';

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
              className={`group flex flex-col justify-between p-3 text-left rounded-lg border transition-all cursor-pointer ${
                isSelected
                  ? 'border-[#007700] ring-2 ring-[#007700]/20 bg-[#EAF0E2]/30 shadow-2xs'
                  : 'border-stone-200 bg-white hover:border-[#BECAB6] hover:bg-[#EAF0E2]/10'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-stone-500 group-hover:text-stone-800 transition-colors">
                      <Icon size={13} />
                    </span>
                    <span className="text-xs font-bold text-stone-800 truncate">{meta.title}</span>
                  </div>
                  <Tooltip title={meta.tooltip} placement="top">
                    <Info size={11} className="text-stone-300 hover:text-stone-600 shrink-0 cursor-help" />
                  </Tooltip>
                </div>

                <div className="mt-2 flex items-baseline justify-between gap-1">
                  <span className="font-jakarta text-sm font-bold text-[#111111] truncate">
                    {formatFactorValue(factor)}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${statusBadge}`}>
                    {statusText}
                  </span>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                <span>Điểm đạt được:</span>
                <span className="font-mono font-bold text-stone-700">
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
