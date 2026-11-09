import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ExternalLink,
  ShoppingBag,
  Users,
  TrendingUp,
  Star,
  Store,
  HelpCircle,
  PackageCheck,
} from 'lucide-react';
import type { OpportunityCluster } from '../../../types/evidence';

interface Props {
  cluster: OpportunityCluster | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OpportunityProductDetailModal: React.FC<Props> = ({
  cluster,
  isOpen,
  onClose,
}) => {
  const [activeProductIdx, setActiveProductIdx] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  if (!isOpen || !cluster) return null;

  const products = cluster.representativeProducts.length > 0
    ? cluster.representativeProducts
    : [
        {
          title: cluster.title,
          imageUrl: '',
          priceVnd: parseInt(cluster.priceRange.replace(/\D/g, '').slice(0, 6), 10) || 120000,
          platform: cluster.platform,
          productUrl: cluster.productUrl,
          sellerName: cluster.sellerName,
          soldCount: cluster.soldCount,
        },
      ];

  const currentProduct = products[activeProductIdx] || products[0];
  const platformName = currentProduct.platform || cluster.platform || 'Tiki';
  const productUrl = currentProduct.productUrl || cluster.productUrl;
  const sellerName = currentProduct.sellerName || cluster.sellerName;
  const soldCount = currentProduct.soldCount ?? cluster.soldCount ?? 0;
  const priceVnd = currentProduct.priceVnd;

  const isGood = cluster.quadrant === 'good_opportunity';
  const isNiche = cluster.quadrant === 'niche_market';

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 border-b border-stone-100 bg-stone-50/70 sticky top-0 z-10">
          <div className="space-y-1 pr-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${
                  isGood
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : isNiche
                    ? 'bg-sky-50 text-sky-800 border-sky-200'
                    : 'bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                {cluster.quadrantLabel}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                <ShoppingBag size={12} />
                {platformName} · Đang bán
              </span>
            </div>
            <h3 className="font-bold text-stone-900 text-base leading-snug pt-1">
              Chi tiết sản phẩm tham khảo
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Main Product Info: Image & Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5">
            {/* Ảnh sản phẩm */}
            <div className="sm:col-span-5 flex flex-col items-center">
              <div className="w-full aspect-square rounded-xl bg-stone-100 overflow-hidden border border-stone-200 flex items-center justify-center shadow-inner">
                {currentProduct.imageUrl ? (
                  <img
                    src={currentProduct.imageUrl}
                    alt={currentProduct.title}
                    className="h-full w-full object-cover"
                    onError={e => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <ShoppingBag size={48} className="text-stone-300" />
                )}
              </div>

              {/* Nếu có nhiều sản phẩm đại diện, cho phép bấm chọn */}
              {products.length > 1 && (
                <div className="flex gap-1.5 mt-2.5 overflow-x-auto max-w-full pb-1">
                  {products.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveProductIdx(idx)}
                      className={`h-11 w-11 rounded-lg border overflow-hidden shrink-0 transition-all ${
                        activeProductIdx === idx
                          ? 'border-[#007700] ring-2 ring-[#007700]/30'
                          : 'border-stone-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={p.imageUrl} alt={p.title} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Thông tin sản phẩm */}
            <div className="sm:col-span-7 space-y-3.5 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-xs font-medium text-stone-500 block">
                  {cluster.category}
                </span>
                <h4 className="font-bold text-stone-900 text-sm sm:text-base leading-snug">
                  {currentProduct.title}
                </h4>

                {sellerName && (
                  <div className="flex items-center gap-1.5 text-xs text-stone-600">
                    <Store size={13} className="text-stone-400" />
                    <span>Gian hàng: <strong className="text-stone-800">{sellerName}</strong></span>
                  </div>
                )}
              </div>

              {/* Giá và lượt bán */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 space-y-2">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-[11px] text-stone-400 block">Giá bán hiện tại:</span>
                    <span className="text-xl font-extrabold text-emerald-800">
                      {priceVnd ? `${priceVnd.toLocaleString('vi-VN')} đ` : cluster.priceRange}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-stone-400 block">Khoảng giá phân khúc:</span>
                    <span className="text-xs font-semibold text-stone-700">
                      {cluster.priceRange}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-stone-200/60 text-xs">
                  <span className="text-stone-600">
                    Đã bán: <strong className="text-stone-900 font-bold">{soldCount.toLocaleString('vi-VN')}</strong> sản phẩm
                  </span>
                  {currentProduct.ratingAverage ? (
                    <span className="flex items-center gap-1 font-semibold text-amber-700">
                      <Star size={12} className="fill-amber-400 text-amber-500" />
                      {currentProduct.ratingAverage} / 5
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Thống kê thị trường */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-white border border-stone-200 space-y-0.5">
                  <span className="text-stone-400 block text-[11px]">Số shop cùng bán:</span>
                  <strong className="text-stone-900 flex items-center gap-1">
                    <Users size={12} className="text-stone-400" />
                    {cluster.sellerCount} shop
                  </strong>
                  <span className="text-[10px] text-stone-400 block">
                    (+{cluster.newSellersLast30Days} shop mới/30 ngày)
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-stone-200 space-y-0.5">
                  <span className="text-stone-400 block text-[11px]">Sức cầu tìm kiếm:</span>
                  <strong className="text-emerald-700 flex items-center gap-1">
                    <TrendingUp size={12} />
                    +{cluster.searchTrendPct}%
                  </strong>
                  <span className="text-[10px] text-stone-400 block">
                    {cluster.orderCountRange}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Nhận định về sản phẩm & Cơ hội bán */}
          <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-200/60 space-y-2">
            <h5 className="font-bold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <PackageCheck size={14} className="text-[#007700]" />
              Nhận định cơ hội thị trường
            </h5>
            <p className="text-xs text-stone-700 leading-relaxed">
              {cluster.evidence?.definition || 'Sản phẩm có lượng tìm kiếm và lượt mua tăng mạnh trong dịp cao điểm. Phù hợp để làm quà tặng hoặc sản phẩm chủ lực.'}
            </p>
            {cluster.evidence?.confidenceReason && (
              <p className="text-[11px] text-stone-500 pt-1 border-t border-emerald-100">
                <strong>Gợi ý nguồn hàng:</strong> {cluster.evidence.confidenceReason}
              </p>
            )}
          </div>

          {/* Danh sách shop đang bán (dữ liệu thật gộp từ các listing trong nhóm) */}
          <div className="space-y-2">
            <h5 className="font-bold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Store size={14} className="text-stone-500" />
              Các shop đang bán ({cluster.sellers?.length ?? 0})
            </h5>
            {cluster.sellers && cluster.sellers.length > 0 ? (
              <ul className="m-0 p-0 list-none divide-y divide-stone-100 rounded-xl border border-stone-200/80">
                {cluster.sellers.map((s, i) => {
                  const priceText =
                    s.minPriceVnd && s.maxPriceVnd
                      ? s.minPriceVnd === s.maxPriceVnd
                        ? `${s.minPriceVnd.toLocaleString('vi-VN')} đ`
                        : `${s.minPriceVnd.toLocaleString('vi-VN')} – ${s.maxPriceVnd.toLocaleString('vi-VN')} đ`
                      : '';
                  return (
                    <li key={`${s.sellerName}-${i}`} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                      <div className="min-w-0">
                        <span className="font-semibold text-stone-800 block truncate">{s.sellerName}</span>
                        <span className="text-[11px] text-stone-500">
                          {s.listingCount} listing · Đã bán {s.soldCount.toLocaleString('vi-VN')}
                          {priceText ? ` · ${priceText}` : ''}
                        </span>
                      </div>
                      {s.topProductUrl ? (
                        <a
                          href={s.topProductUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 shrink-0 text-[11px] font-semibold text-[#007700] hover:underline"
                        >
                          Xem <ExternalLink size={11} />
                        </a>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="m-0 text-[11px] text-stone-500">
                Nguồn dữ liệu chưa cung cấp tên từng shop cho nhóm này nên chưa liệt kê được.
              </p>
            )}
            <p className="m-0 text-[11px] text-stone-400">
              Danh sách gộp từ các listing đã thu thập được trong nhóm; có thể chưa đủ toàn bộ shop trên sàn.
            </p>
          </div>

          {/* Nguồn thu thập dữ liệu */}
          <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
            <HelpCircle size={12} />
            <span>Nguồn dữ liệu: {cluster.clusteringMethod}</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-stone-100 bg-stone-50 sticky bottom-0 z-10">
          <div>
            {productUrl ? (
              <a
                href={productUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#007700] hover:bg-[#005B00] transition-colors shadow-2xs"
              >
                <span>Xem trên {platformName}</span>
                <ExternalLink size={12} />
              </a>
            ) : (
              <span className="text-xs text-stone-400 italic">Listing thu thập từ sàn TMĐT</span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-stone-700 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
