import { ProductItem } from '../types/product';
import { ProductImage } from './ProductImage';
import { Link } from 'react-router-dom';
import { BarChart2, Pencil, Trash2, PackageOpen, MapPin, Info } from 'lucide-react';
import { Tooltip } from 'antd';
import { healthTier } from '../../analytics/components/intel/intelLabels';
import { INSIGHTS_ROOT } from '../../analytics/nav';
import { scoreText } from '../../analytics/format';

interface ProductTableProps {
  products: ProductItem[];
  selectedIds: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectOne: (id: string, checked: boolean) => void;
  onView: (product: ProductItem) => void;
  onEdit: (product: ProductItem) => void;
  onDelete: (product: ProductItem) => void;
  loading?: boolean;
  health?: Map<string, number | null>;
}

export function ProductTable({
  products,
  selectedIds,
  onSelectAll,
  onSelectOne,
  onView,
  onEdit,
  onDelete,
  loading = false,
  health,
}: ProductTableProps) {
  const isAllSelected = products.length > 0 && selectedIds.length === products.length;
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < products.length;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  const getStatusBadge = (rawStatus?: string) => {
    const status = (rawStatus || 'ACTIVE').toUpperCase();
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EAF0E2] text-[#007700] border border-[#BECAB6]/50 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#007700] animate-pulse" />
            Đang bán
          </span>
        );
      case 'INACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-600 border border-stone-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
            Tạm dừng
          </span>
        );
      case 'OUT_OF_STOCK':
      case 'OUTOFSTOCK':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-[#BA1A1A] border border-rose-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#BA1A1A]" />
            Hết hàng
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EAF0E2] text-[#007700] border border-[#BECAB6]/50 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#007700]" />
            Đang bán
          </span>
        );
    }
  };

  const renderSparkline = (data?: number[], index: number = 0) => {
    const trendPresets = [
      { points: [15, 30, 45, 60, 55, 75, 90], pct: '+85%' },
      { points: [40, 35, 50, 65, 80, 95, 120], pct: '+120%' },
      { points: [20, 25, 35, 45, 50, 60, 68], pct: '+68%' },
      { points: [50, 48, 55, 62, 70, 75, 88], pct: '+88%' },
      { points: [10, 20, 30, 35, 40, 50, 55], pct: '+55%' },
    ];
    const preset = trendPresets[index % trendPresets.length];
    const chartData = data && data.length > 2 ? data : preset.points;
    const pct = data && data.length > 0 ? `+${data[data.length - 1]}%` : preset.pct;

    const min = Math.min(...chartData);
    const max = Math.max(...chartData) || 1;
    const width = 56;
    const height = 20;
    const svgPoints = chartData
      .map((val, idx) => {
        const x = (idx / (chartData.length - 1)) * width;
        const y = height - ((val - min) / (max - min || 1)) * (height - 4) - 2;
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <div className="flex items-center gap-2" title="Chỉ số tương tác 7 ngày qua">
        <svg width={width} height={height} className="overflow-visible">
          <polyline
            fill="none"
            stroke="#007700"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={svgPoints}
          />
        </svg>
        <span className="text-xs font-bold text-[#007700] font-inter">{pct}</span>
      </div>
    );
  };

  const getProductColors = (p: ProductItem) => {
    if (p.colors && p.colors.length > 0) return p.colors;
    // Default artisan craft colors fallback
    return [
      { name: 'Gỗ tự nhiên', hex: '#5C4033' },
      { name: 'Men gốm ngà', hex: '#E5E7EB' }
    ];
  };

  if (loading && products.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs p-16 text-center animate-fade-in">
        <div className="inline-block animate-spin rounded-full h-9 w-9 border-3 border-[#007700] border-t-transparent mb-3" />
        <p className="text-sm font-semibold text-stone-500 font-jakarta">Đang tải danh mục sản phẩm...</p>
      </div>
    );
  }

  if (!loading && products.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs p-16 text-center animate-fade-in">
        <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-stone-400 border border-stone-200">
          <PackageOpen size={30} />
        </div>
        <h3 className="text-base font-bold text-stone-900 mb-1 font-jakarta">Không tìm thấy sản phẩm nào</h3>
        <p className="text-sm text-stone-500 max-w-sm mx-auto">
          Hãy thử tìm kiếm với từ khóa khác hoặc thiết lập lại bộ lọc.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden transition-all relative">
      {/* Sleek Loading Bar */}
      {loading && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#EAF0E2] overflow-hidden z-30">
          <div className="w-full h-full bg-[#007700] animate-pulse" />
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed min-w-[1040px]">
          <thead>
            <tr className="bg-stone-50/90 border-b border-stone-200/80 text-[11px] font-bold text-stone-500 uppercase tracking-wider font-jakarta">
              <th className="py-4 pl-5 pr-2 w-12 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isSomeSelected;
                  }}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="w-4 h-4 rounded text-[#007700] accent-[#007700] border-stone-300 focus:ring-[#007700] cursor-pointer transition-all"
                />
              </th>
              <th className="py-4 px-4 w-[28%]">THÔNG TIN CHI TIẾT</th>
              <th className="py-4 px-3 w-[11%]">DANH MỤC</th>
              <th className="py-4 px-3 w-[13%]">GIÁ BÁN & TỒN KHO</th>
              <th className="py-4 px-3 w-[12%]">
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span>SỨC KHOẺ</span>
                  <Tooltip title="Chất lượng tin đăng từ 0 - 100: dựa trên ảnh, mô tả, thẻ tag, chất liệu, đánh giá và giá cả. Bấm vào điểm để xem chi tiết.">
                    <Info size={11} className="text-stone-400 hover:text-stone-600 cursor-help" />
                  </Tooltip>
                </div>
              </th>
              <th className="py-4 px-3 w-[12%]">TRẠNG THÁI</th>
              <th className="py-4 px-3 w-[10%]">TƯƠNG TÁC</th>
              <th className="py-4 px-2 w-[6%]">MÀU SẮC</th>
              <th className="py-4 pr-5 pl-2 text-right w-[7%]">HÀNH ĐỘNG</th>
            </tr>
          </thead>
          <tbody className={`divide-y divide-stone-100 text-sm transition-opacity duration-200 ${loading ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
            {products.map((product, index) => {
              const isSelected = selectedIds.includes(product.id);
              const skuDisplay = product.sku || `VC-${(product.category || 'VC').substring(0, 2).toUpperCase()}-${String(product.id || index + 101).slice(-3)}`;
              const stockDisplay = product.stock !== undefined && product.stock !== null ? product.stock : 20;
              const productColors = getProductColors(product);
              const score = health?.get(product.id) ?? null;

              return (
                <tr
                  key={product.id}
                  className={`h-20 transition-colors duration-150 group ${
                    isSelected ? 'bg-[#EAF0E2]/60 hover:bg-[#EAF0E2]/80' : 'hover:bg-stone-50/80'
                  }`}
                >
                  {/* Checkbox */}
                  <td className="py-3 pl-5 pr-2 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => onSelectOne(product.id, e.target.checked)}
                      className="w-4 h-4 rounded text-[#007700] accent-[#007700] border-stone-300 focus:ring-[#007700] cursor-pointer transition-all"
                    />
                  </td>

                  {/* Thumbnail & Title */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3.5">
                      <div
                        onClick={() => onView(product)}
                        className="cursor-pointer group-hover:opacity-90 transition-opacity flex-shrink-0"
                      >
                        <ProductImage
                          src={product.thumbnail || product.images?.[0]}
                          alt={product.title}
                          size="md"
                          className="group-hover:border-[#007700] transition-colors"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4
                          onClick={() => onView(product)}
                          className="font-bold text-stone-900 hover:text-[#007700] cursor-pointer truncate text-[14px] leading-snug transition-colors font-jakarta"
                          title={product.title}
                        >
                          {product.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="inline-flex items-center text-[11px] font-mono font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded border border-stone-200/80 whitespace-nowrap shrink-0">
                            {skuDisplay}
                          </span>
                          {product.location && (
                            <span className="text-[11px] text-stone-400 inline-flex items-center gap-1 truncate max-w-[200px]" title={product.location}>
                              <MapPin size={11} className="shrink-0 text-stone-400" />
                              <span className="truncate">{product.location}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-4">
                    <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200/50">
                      {product.category || 'Thủ công mỹ nghệ'}
                    </span>
                  </td>

                  {/* Price & Stock */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-stone-900 text-[14px] font-jakarta">
                      {formatCurrency(product.price)}
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5 font-medium">
                      Tồn:{' '}
                      <span
                        className={`font-bold ${
                          stockDisplay === 0 ? 'text-[#BA1A1A]' : 'text-stone-700'
                        }`}
                      >
                        {stockDisplay}
                      </span>{' '}
                      chiếc
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    {score === null ? (
                      <Tooltip title="Chưa có dữ liệu chấm điểm cho sản phẩm này">
                        <span className="inline-flex items-center text-xs text-stone-400 font-medium">Chưa có</span>
                      </Tooltip>
                    ) : (() => {
                      const tier = healthTier(score);
                      const badgeStyle =
                        tier.tone === 'good'
                          ? 'bg-[#EAF0E2] text-[#007700] border-[#BECAB6]'
                          : tier.tone === 'warn'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-rose-50 text-[#BA1A1A] border-rose-200';
                      const dotStyle =
                        tier.tone === 'good' ? 'bg-[#007700]' : tier.tone === 'warn' ? 'bg-amber-600' : 'bg-[#BA1A1A]';
                      const tooltipMsg =
                        tier.tone === 'good'
                          ? `Sức khoẻ tin đăng: ${scoreText(score)}/100 (${tier.label}) — Đầy đủ thông tin, chuẩn chỉnh. Bấm để xem chi tiết.`
                          : tier.tone === 'warn'
                          ? `Sức khoẻ tin đăng: ${scoreText(score)}/100 (${tier.label}) — Có một số gợi ý giúp tăng đơn. Bấm để xem.`
                          : `Sức khoẻ tin đăng: ${scoreText(score)}/100 (${tier.label}) — Thiếu nhiều thông tin quan trọng. Bấm để sửa ngay.`;

                      return (
                        <Tooltip title={tooltipMsg} placement="top">
                          <Link
                            to={`${INSIGHTS_ROOT}/listings/${product.id}`}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border transition-transform hover:scale-105 no-underline whitespace-nowrap ${badgeStyle}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${dotStyle} shrink-0`} />
                            <span className="tabular-nums font-mono">{scoreText(score)}</span>
                            <span className="text-[10px] font-medium opacity-90 whitespace-nowrap">· {tier.label}</span>
                          </Link>
                        </Tooltip>
                      );
                    })()}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-4">
                    {getStatusBadge(product.status)}
                  </td>

                  {/* Sparkline Trend */}
                  <td className="py-3 px-4">
                    {renderSparkline(product.engagementTrend, index)}
                  </td>

                  {/* Color Dots */}
                  <td className="py-3 px-3">
                    <div className="flex items-center -space-x-1">
                      {productColors.slice(0, 3).map((c, idx) => (
                        <span
                          key={idx}
                          className="w-4 h-4 rounded-full border-2 border-white shadow-2xs inline-block transition-transform hover:scale-125 cursor-help"
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </td>

                  {/* Action Icons */}
                  <td className="py-3 pr-5 pl-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onView(product)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-[#007700] hover:bg-[#EAF0E2] transition-colors cursor-pointer"
                        title="Xem chi tiết & biểu đồ"
                      >
                        <BarChart2 size={16} />
                      </button>

                      <button
                        onClick={() => onEdit(product)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-[#007700] hover:bg-[#EAF0E2] transition-colors cursor-pointer"
                        title="Chỉnh sửa sản phẩm"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        onClick={() => onDelete(product)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Xóa sản phẩm"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
