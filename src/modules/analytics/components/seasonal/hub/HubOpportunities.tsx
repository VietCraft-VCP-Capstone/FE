import React, { useState } from 'react';
import { Compass, ShoppingBag, TrendingUp, Users } from 'lucide-react';
import type { Evidence, OpportunityCluster } from '../../../types/evidence';
import { EvidenceTrigger } from '../../evidence/EvidenceTrigger';
import { OpportunityProductDetailModal } from './OpportunityProductDetailModal';

interface Props {
  clusters: OpportunityCluster[];
  onOpenEvidence: (evidence: Evidence) => void;
  className?: string;
}

export const HubOpportunities: React.FC<Props> = ({
  clusters,
  onOpenEvidence,
  className = '',
}) => {
  const [selectedQuadrant, setSelectedQuadrant] = useState<string>('all');
  const [selectedCluster, setSelectedCluster] = useState<OpportunityCluster | null>(null);

  const filtered = selectedQuadrant === 'all'
    ? clusters
    : clusters.filter(c => c.quadrant === selectedQuadrant);

  return (
    <div className={`rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-5 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-[#007700]">
              <Compass size={16} />
            </span>
            <h3 className="font-bold text-stone-900 text-sm">
              Sản phẩm tiềm năng theo phân khúc
            </h3>
          </div>
        </div>

        {/* Bộ lọc 4 ô */}
        <div className="flex flex-wrap gap-1 text-xs">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'good_opportunity', label: 'Cơ hội tốt' },
            { id: 'high_competition', label: 'Cạnh tranh cao' },
            { id: 'niche_market', label: 'Thị trường ngách' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedQuadrant(tab.id)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                selectedQuadrant === tab.id
                  ? 'bg-stone-900 text-white font-semibold'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Danh sách các nhóm */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filtered.map(cluster => {
          const isGood = cluster.quadrant === 'good_opportunity';
          const isNiche = cluster.quadrant === 'niche_market';

          return (
            <div
              key={cluster.id}
              className={`rounded-xl border p-4 space-y-3 transition-shadow hover:shadow-md ${
                isGood
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : isNiche
                  ? 'border-sky-200 bg-sky-50/20'
                  : 'border-stone-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        isGood
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : isNiche
                          ? 'bg-sky-50 text-sky-800 border-sky-200'
                          : 'bg-stone-100 text-stone-700 border-stone-200'
                      }`}
                    >
                      {cluster.quadrantLabel}
                    </span>
                    {cluster.platform && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        <ShoppingBag size={10} />
                        {cluster.platform}
                      </span>
                    )}
                  </div>
                  <h4
                    onClick={() => setSelectedCluster(cluster)}
                    className="font-bold text-stone-900 text-sm mt-1.5 line-clamp-1 cursor-pointer hover:text-[#007700] transition-colors"
                    title="Bấm để xem chi tiết sản phẩm"
                  >
                    {cluster.title}
                  </h4>
                  <span className="text-[11px] text-stone-400">
                    {cluster.category}
                    {cluster.sellerName ? ` · ${cluster.sellerName}` : ''}
                  </span>
                </div>
                <EvidenceTrigger evidence={cluster.evidence} onOpen={onOpenEvidence} />
              </div>

              {/* Số liệu thống kê */}
              <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-stone-100">
                <div>
                  <span className="text-stone-400 block text-[11px]">Số shop đang bán:</span>
                  <strong className="text-stone-800 flex items-center gap-1">
                    <Users size={12} className="text-stone-400" />
                    {cluster.sellerCount} shop
                  </strong>
                  <span className="text-[10px] text-stone-400 block">
                    {cluster.soldCount && cluster.soldCount > 0
                      ? `Đã bán: ${cluster.soldCount.toLocaleString('vi-VN')} sp`
                      : `(+${cluster.newSellersLast30Days} shop mới trong 30 ngày)`}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[11px]">Khoảng giá phổ biến:</span>
                  <strong className="text-stone-800">{cluster.priceRange}</strong>
                  <span className="text-[10px] text-emerald-700 flex items-center gap-0.5 mt-0.5">
                    <TrendingUp size={10} />
                    Tìm kiếm: +{cluster.searchTrendPct}%
                  </span>
                </div>
              </div>

              {/* Sản phẩm đại diện (Clickable để xem chi tiết sản phẩm) */}
              {cluster.representativeProducts.length > 0 && (
                <div
                  onClick={() => setSelectedCluster(cluster)}
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-stone-50/80 hover:bg-stone-100 border border-stone-200/80 hover:border-emerald-300 cursor-pointer transition-all group"
                  title="Bấm để xem chi tiết sản phẩm"
                >
                  <div className="h-11 w-11 rounded-lg bg-stone-100 overflow-hidden border border-stone-200 shrink-0">
                    {cluster.representativeProducts[0].imageUrl ? (
                      <img
                        src={cluster.representativeProducts[0].imageUrl}
                        alt={cluster.representativeProducts[0].title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                        onError={e => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1 text-xs">
                    <span className="font-semibold text-stone-800 group-hover:text-[#007700] block truncate transition-colors">
                      {cluster.representativeProducts[0].title}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-emerald-800 font-bold">
                        {cluster.representativeProducts[0].priceVnd.toLocaleString('vi-VN')} đ
                      </span>
                      {cluster.representativeProducts[0].soldCount ? (
                        <span className="text-[10px] text-stone-400">
                          · Đã bán {cluster.representativeProducts[0].soldCount.toLocaleString('vi-VN')}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-stone-500 group-hover:text-[#007700] shrink-0 transition-colors">
                    Chi tiết &rarr;
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal xem chi tiết sản phẩm khi người dùng click vào card */}
      <OpportunityProductDetailModal
        cluster={selectedCluster}
        isOpen={!!selectedCluster}
        onClose={() => setSelectedCluster(null)}
      />
    </div>
  );
};
