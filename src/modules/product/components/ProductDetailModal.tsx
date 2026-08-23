import { useState } from 'react';
import { ProductItem } from '../types/product';
import { ProductImage } from './ProductImage';
import {
  X,
  Pencil,
  Trash2,
  MapPin,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface ProductDetailModalProps {
  product: ProductItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (product: ProductItem) => void;
  onDelete: (product: ProductItem) => void;
}

export function ProductDetailModal({
  product,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: ProductDetailModalProps) {
  if (!isOpen || !product) return null;

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const images = product.images && product.images.length > 0 ? product.images : [product.thumbnail];
  const activeImage = images[activeImageIndex] || product.thumbnail;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  const chartData = product.inventoryTrends && product.inventoryTrends.length > 0
    ? product.inventoryTrends
    : [
        { date: 'T1', stock: (product.stock || 20) + 40 },
        { date: 'T3', stock: (product.stock || 20) + 30 },
        { date: 'T7', stock: (product.stock || 20) + 15 },
        { date: 'T10', stock: (product.stock || 20) + 5 },
        { date: 'Hiện tại', stock: product.stock || 20 }
      ];

  const getStatusBadge = (rawStatus?: string) => {
    const status = (rawStatus || 'ACTIVE').toUpperCase();
    switch (status) {
      case 'ACTIVE':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#EAF0E2] text-[#007700] border border-[#BECAB6]/50">Đang bán</span>;
      case 'INACTIVE':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-600 border border-stone-200">Tạm dừng</span>;
      case 'OUT_OF_STOCK':
      case 'OUTOFSTOCK':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-[#BA1A1A] border border-rose-200">Hết hàng</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#EAF0E2] text-[#007700]">Đang bán</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden my-auto">
        {/* Modal Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50/90">
          <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
            <span className="hover:text-stone-800 cursor-pointer">Sản phẩm</span>
            <ChevronRight size={13} />
            <span className="text-stone-800 font-bold truncate max-w-md">{product.title}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(product);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-stone-700 hover:text-blue-600 bg-stone-100 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer font-jakarta"
            >
              <Pencil size={13} /> Chỉnh sửa
            </button>
            <button
              onClick={() => {
                onClose();
                onDelete(product);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 bg-stone-100 rounded-lg transition-colors cursor-pointer font-jakarta"
            >
              <Trash2 size={13} /> Xóa
            </button>
            <span className="w-px h-5 bg-stone-200 mx-1" />
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-200 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Image Gallery */}
            <div className="lg:col-span-5 space-y-3">
              <ProductImage
                src={activeImage}
                alt={product.title}
                size="xl"
                className="shadow-sm"
              />

              {images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-14 h-14 min-w-[56px] max-w-[56px] min-h-[56px] max-h-[56px] rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all cursor-pointer ${
                        activeImageIndex === idx
                          ? 'border-[#007700] ring-2 ring-[#007700]/20'
                          : 'border-stone-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <ProductImage src={img} alt="Thumbnail" size="full" className="w-full h-full border-none rounded-none" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info & Metrics */}
            <div className="lg:col-span-7 space-y-5">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-stone-100 text-stone-700">
                    {product.category || 'Thủ công mỹ nghệ'}
                  </span>
                  {getStatusBadge(product.status)}
                  <span className="text-xs font-mono font-bold text-stone-600 ml-auto bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                    {product.sku || 'VC-PR-101'}
                  </span>
                </div>

                <h2 className="text-2xl font-extrabold text-stone-900 font-jakarta leading-snug">
                  {product.title}
                </h2>

                {product.location && (
                  <p className="flex items-center gap-1.5 text-xs text-stone-500 mt-1.5">
                    <MapPin size={13} className="text-[#007700]" />
                    <span>{product.location}</span>
                  </p>
                )}
              </div>

              {/* 3 Metric Cards */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-stone-50 border border-stone-200/80 rounded-2xl">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider font-jakarta">Giá bán</span>
                  <div className="text-lg font-extrabold text-[#007700] font-jakarta">
                    {formatCurrency(product.price)}
                  </div>
                </div>

                <div className="space-y-0.5 border-l border-stone-200 pl-3">
                  <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider font-jakarta">Tồn kho</span>
                  <div className="text-lg font-extrabold text-stone-900 font-jakarta">
                    {product.stock || 20} <span className="text-xs font-normal text-stone-500">chiếc</span>
                  </div>
                </div>

                <div className="space-y-0.5 border-l border-stone-200 pl-3">
                  <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider font-jakarta">Giá trị tồn</span>
                  <div className="text-lg font-extrabold text-stone-900 font-jakarta truncate" title={formatCurrency((product.price || 0) * (product.stock || 20))}>
                    {formatCurrency((product.price || 0) * (product.stock || 20))}
                  </div>
                </div>
              </div>

              {/* Colors */}
              {product.colors && product.colors.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block font-jakarta">
                    Màu sắc & Biến thể ({product.colors.length}):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((c, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 px-3 py-1 bg-stone-100 rounded-full text-xs font-medium text-stone-700"
                      >
                        <span className="w-3.5 h-3.5 rounded-full border border-stone-300 shadow-2xs" style={{ backgroundColor: c.hex }} />
                        <span>{c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block font-jakarta">
                  Mô tả sản phẩm
                </span>
                <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line bg-stone-50/50 p-4 rounded-xl border border-stone-100">
                  {product.description || 'Chưa có mô tả chi tiết cho sản phẩm này.'}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom: Inventory Trends Chart */}
          <div className="p-6 bg-stone-50/70 border border-stone-200 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#EAF0E2] text-[#007700] rounded-lg">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-stone-900 font-jakarta">Biến động tồn kho</h4>
                  <p className="text-xs text-stone-500">Biến động số lượng tồn kho theo từng mốc thời gian</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/60 px-2.5 py-1 rounded-full">
                Ổn định
              </span>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#007700" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#007700" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 'auto']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111827',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                    formatter={(value: any) => [`${value} chiếc`, 'Số lượng tồn']}
                    labelFormatter={(label) => `Mốc: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="stock"
                    stroke="#007700"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorStock)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
