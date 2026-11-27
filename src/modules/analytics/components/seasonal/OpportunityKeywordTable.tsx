import React, { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  HelpCircle,
  Info,
  Maximize2,
  Minimize2,
  Star,
  Tag,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import type { OpportunityKeywordItem } from '../../types';
import type { Evidence } from '../../types/evidence';
import { money } from '../../../../shared/utils/format';
import { analyticsApi, seasonalSaveError } from '../../services/analyticsApi';

interface Props {
  keywords: OpportunityKeywordItem[];
  occasionName: string;
  onOpenEvidence: (evidence: Evidence) => void;
  savedIdeas?: Record<string, boolean>;
  onToggleStar?: (tag: string) => void;
  className?: string;
}

interface ScoreTooltipState {
  kind: 'row' | 'header';
  kw?: OpportunityKeywordItem;
  top: number;
  left: number;
  placeBelow: boolean;
}

function getScoreExplanation(kw: OpportunityKeywordItem) {
  const hasScore = kw.keyword_score !== null && kw.keyword_score !== undefined;
  const soldReal = kw.sold_count_real ?? 0;
  const etsyFav = kw.etsy_favorers ?? 0;
  const effectiveDemand =
    kw.effective_demand ??
    kw.score_breakdown?.effective_demand ??
    Number((soldReal + etsyFav / 10).toFixed(1));
  const salesPerShop =
    kw.sales_per_shop ??
    kw.score_breakdown?.sales_per_shop ??
    (kw.competition > 0 && effectiveDemand > 0
      ? Number((effectiveDemand / kw.competition).toFixed(1))
      : null);

  const demandPts =
    kw.score_breakdown?.demand_pts ??
    (kw.score_breakdown?.demand != null
      ? Number((kw.score_breakdown.demand * 0.5).toFixed(1))
      : null);
  const headroomPts =
    kw.score_breakdown?.headroom_pts ??
    (kw.score_breakdown?.headroom != null
      ? Number((kw.score_breakdown.headroom * 0.5).toFixed(1))
      : null);

  let demandSource = '';
  if (soldReal > 0 && etsyFav > 0) {
    demandSource = `${soldReal.toLocaleString('vi-VN')} lượt bán + ${etsyFav.toLocaleString('vi-VN')} thích Etsy ÷ 10 = ${effectiveDemand.toLocaleString('vi-VN')} cầu`;
  } else if (soldReal > 0) {
    demandSource = `${soldReal.toLocaleString('vi-VN')} lượt bán thực tế đo được`;
  } else if (etsyFav > 0) {
    demandSource = `${etsyFav.toLocaleString('vi-VN')} lượt thích Etsy ÷ 10 = ${effectiveDemand.toLocaleString('vi-VN')} cầu`;
  } else if (effectiveDemand > 0) {
    demandSource = `Tổng cầu quy đổi: ${effectiveDemand.toLocaleString('vi-VN')}`;
  }

  let headroomSource = '';
  if (salesPerShop != null && kw.competition > 0) {
    headroomSource = `~${salesPerShop.toLocaleString('vi-VN')} cầu/shop (${kw.competition.toLocaleString('vi-VN')} gian hàng)`;
  } else if (kw.competition > 0) {
    headroomSource = `Đang có ${kw.competition.toLocaleString('vi-VN')} gian hàng cạnh tranh`;
  }

  let takeaway = '';
  if (!hasScore) {
    takeaway = 'Chưa có lượt bán (Tiki/VietCraft) hoặc lượt thích trên Etsy trong 30 ngày qua.';
  } else if (demandPts != null && headroomPts != null) {
    if (demandPts >= 35 && headroomPts >= 35) {
      takeaway = 'Sức mua lớn và mỗi gian hàng còn nhiều dư địa — rất đáng ưu tiên.';
    } else if (demandPts >= 35 && headroomPts < 35) {
      takeaway = 'Nhu cầu cao nhưng có nhiều gian hàng cạnh tranh nên điểm dư địa bị giảm.';
    } else if (demandPts < 35 && headroomPts >= 35) {
      takeaway = 'Ngách ít đối thủ, mỗi shop bán tốt dù tổng cầu thị trường chưa quá lớn.';
    } else if (demandPts >= 20 && headroomPts >= 20) {
      takeaway = 'Sức cầu và mức cạnh tranh ở mức khá, phù hợp để test sản phẩm.';
    } else {
      takeaway = 'Tổng sức cầu hiện còn nhỏ nên điểm cơ hội chưa cao.';
    }
  } else if (kw.keyword_score! >= 70) {
    takeaway = 'Nhu cầu tốt và dư địa mỗi shop cao.';
  } else if (kw.keyword_score! >= 45) {
    takeaway = 'Cơ hội ở mức trung bình, cần chọn góc sản phẩm khác biệt.';
  } else {
    takeaway = 'Sức cầu còn thấp hoặc cạnh tranh dày.';
  }

  return {
    hasScore,
    demandPts,
    headroomPts,
    demandSource,
    headroomSource,
    takeaway,
  };
}

export const OpportunityKeywordTable: React.FC<Props> = ({
  keywords = [],
  occasionName,
  onOpenEvidence,
  savedIdeas = {},
  onToggleStar,
  className = '',
}) => {
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [localStarred, setLocalStarred] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    keywords.forEach(k => {
      if (k.is_starred) map[k.id] = true;
    });
    return map;
  });
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const [attachingId, setAttachingId] = useState<string | null>(null);
  const [attachedTags, setAttachedTags] = useState<Record<string, boolean>>({});
  const [openProductsKwId, setOpenProductsKwId] = useState<string | null>(null);
  const [scoreTooltip, setScoreTooltip] = useState<ScoreTooltipState | null>(null);

  useEffect(() => {
    if (!scoreTooltip) return;
    const clear = () => setScoreTooltip(null);
    window.addEventListener('scroll', clear, true);
    window.addEventListener('resize', clear);
    return () => {
      window.removeEventListener('scroll', clear, true);
      window.removeEventListener('resize', clear);
    };
  }, [scoreTooltip]);

  const openScoreTooltip = (
    el: HTMLElement,
    kind: 'row' | 'header',
    kw?: OpportunityKeywordItem
  ) => {
    const rect = el.getBoundingClientRect();
    const tooltipWidth = 288;
    const placeBelow = rect.top < 210;
    const rawLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
    const clampedLeft = Math.max(12, Math.min(window.innerWidth - tooltipWidth - 12, rawLeft));
    setScoreTooltip({
      kind,
      kw,
      top: placeBelow ? rect.bottom + 8 : rect.top - 8,
      left: clampedLeft,
      placeBelow,
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSelectAll = () => {
    const allSelected = keywords.every(k => selectedIds[k.id]);
    const next: Record<string, boolean> = {};
    if (!allSelected) {
      keywords.forEach(k => {
        next[k.id] = true;
      });
    }
    setSelectedIds(next);
  };

  const toggleStar = (kw: OpportunityKeywordItem) => {
    if (onToggleStar) {
      onToggleStar(kw.tag);
    } else {
      setLocalStarred(prev => ({ ...prev, [kw.id]: !prev[kw.id] }));
    }
  };

  const copyTags = (tagsToCopy: string[]) => {
    const text = tagsToCopy.join(', ');
    navigator.clipboard?.writeText(text);
    setCopyNotice(`Đã sao chép ${tagsToCopy.length} thẻ tag!`);
    setTimeout(() => setCopyNotice(null), 2500);
  };

  const getTargetProducts = (kw: OpportunityKeywordItem): Array<{ id: string; title: string }> => {
    const covProds = (kw.shop_coverage as any)?.products;
    if (Array.isArray(covProds) && covProds.length > 0) return covProds;
    if (kw.matched_product?.id && kw.matched_product?.title) {
      return [{ id: kw.matched_product.id, title: kw.matched_product.title }];
    }
    return [];
  };

  const handleAttachTag = async (kw: OpportunityKeywordItem) => {
    const ids = kw.shop_coverage?.product_ids || [];
    if (ids.length === 0) {
      copyTags([kw.tag]);
      return;
    }
    const targetTitles = getTargetProducts(kw).map(p => p.title).filter(Boolean);
    const targetSummary = targetTitles.length > 0 ? `: ${targetTitles.slice(0, 2).join(', ')}${targetTitles.length > 2 ? ` (+${targetTitles.length - 2})` : ''}` : '';
    setAttachingId(kw.id);
    try {
      const res = await analyticsApi.attachSeasonalTag(kw.tag, ids);
      setAttachedTags(prev => ({ ...prev, [kw.id]: true }));
      setCopyNotice(
        res.modified_count > 0
          ? `Đã gắn thẻ «${kw.tag}» vào ${res.modified_count} sản phẩm${targetSummary}`
          : `Thẻ «${kw.tag}» đã có sẵn trên sản phẩm${targetSummary}`
      );
      setTimeout(() => setCopyNotice(null), 4000);
    } catch (err) {
      setCopyNotice(`${seasonalSaveError(err, `Không thể gắn thẻ «${kw.tag}» tự động.`)} Đã sao chép thẻ vào bộ nhớ tạm.`);
      navigator.clipboard?.writeText(kw.tag);
      setTimeout(() => setCopyNotice(null), 4000);
    } finally {
      setAttachingId(null);
    }
  };

  const selectedList = keywords.filter(k => selectedIds[k.id]);
  const displayKeywords = isExpanded ? keywords : keywords.slice(0, 7);

  return (
    <div
      className={`rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm transition-all ${
        isExpanded ? 'ring-2 ring-[#007700]/20 shadow-md' : ''
      } ${className}`}
    >
      {/* 1. Thanh tiêu đề & Công cụ điều khiển */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-[#007700]" />
            <h3 className="font-bold text-stone-900 text-sm sm:text-base">
              Từ khóa hot &amp; Thẻ Tag đón đầu dịp {occasionName}
            </h3>
          </div>
        </div>

        {/* Nút thao tác nhanh */}
        <div className="flex items-center gap-2 shrink-0">
          {selectedList.length > 0 && (
            <button
              type="button"
              onClick={() => copyTags(selectedList.map(k => k.tag))}
              className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-800 transition-colors shadow-xs"
            >
              <Copy size={13} />
              <span>Sao chép {selectedList.length} tag chọn</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => copyTags(keywords.slice(0, 13).map(k => k.tag))}
            title="Sao chép các thẻ tag gợi ý để dán vào sản phẩm"
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <Copy size={13} />
            <span>Sao chép tag</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Thu gọn' : 'Mở rộng toàn bộ'}
            className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
          >
            {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {/* Thông báo copy nhanh */}
      {copyNotice && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 border border-emerald-200 animate-fadeIn">
          <Check size={14} className="text-emerald-700" />
          <span>{copyNotice} Bạn có thể dán trực tiếp vào mục Thẻ tag / Từ khóa khi đăng sản phẩm.</span>
        </div>
      )}

      {/* 2. Bảng dữ liệu chuyên nghiệp (Data-Dense Table) */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left border-collapse select-none">
          <thead>
            <tr className="border-b border-stone-200 text-[11px] font-bold uppercase tracking-wider text-stone-500 bg-stone-50/70">
              <th className="py-2.5 px-3 w-8 text-center">
                <input
                  type="checkbox"
                  aria-label="Chọn tất cả từ khóa"
                  checked={keywords.length > 0 && keywords.every(k => selectedIds[k.id])}
                  onChange={toggleSelectAll}
                  className="rounded border-stone-300 text-[#007700] focus:ring-[#007700] cursor-pointer"
                />
              </th>
              <th className="py-2.5 px-3">Từ khóa / Thẻ Tag</th>
              <th className="py-2.5 px-3">Nhu cầu toàn ngành</th>
              <th className="py-2.5 px-3">Đối thủ toàn ngành</th>
              <th className="py-2.5 px-3 text-center">
                <span
                  tabIndex={0}
                  onMouseEnter={e => openScoreTooltip(e.currentTarget, 'header')}
                  onMouseLeave={() => setScoreTooltip(null)}
                  onFocus={e => openScoreTooltip(e.currentTarget, 'header')}
                  onBlur={() => setScoreTooltip(null)}
                  className="inline-flex items-center gap-1 cursor-help"
                >
                  <span>Điểm cơ hội</span>
                  <Info size={12} className="text-stone-400" />
                </span>
              </th>
              <th className="py-2.5 px-3 text-center">Trạng thái shop</th>
              <th className="py-2.5 px-3 w-40 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-xs">
            {displayKeywords.map(kw => {
              const isSelected = Boolean(selectedIds[kw.id]);
              const isStarred = onToggleStar ? Boolean(savedIdeas[`kw_${kw.tag}`]) : Boolean(localStarred[kw.id]);
              const isRowExpanded = expandedRowId === kw.id;

              // Chấm màu Volume
              const volDotColor =
                kw.volume_level === 'high'
                  ? 'bg-emerald-500 ring-emerald-100'
                  : kw.volume_level === 'medium'
                  ? 'bg-amber-500 ring-amber-100'
                  : 'bg-rose-400 ring-rose-100';

              // Chấm màu Competition (Ít cạnh tranh = Xanh lá, Cạnh tranh cao = Đỏ)
              const compDotColor =
                kw.competition_level === 'low'
                  ? 'bg-emerald-500 ring-emerald-100'
                  : kw.competition_level === 'medium'
                  ? 'bg-amber-500 ring-amber-100'
                  : 'bg-rose-500 ring-rose-100';

              // Điểm cơ hội Score badge (hỗ trợ null -> N/A khi chưa đủ dữ liệu)
              const hasScore = kw.keyword_score !== null && kw.keyword_score !== undefined;
              const scoreBadgeClass = !hasScore
                ? 'bg-stone-100 text-stone-400 font-semibold border border-stone-200/70'
                : kw.keyword_score! >= 70
                ? 'bg-emerald-100 text-emerald-800 font-extrabold'
                : kw.keyword_score! >= 45
                ? 'bg-amber-100 text-amber-800 font-bold'
                : 'bg-stone-100 text-stone-600 font-medium';

              return (
                <React.Fragment key={kw.id}>
                  <tr
                    className={`hover:bg-stone-50/80 transition-colors ${
                      isSelected ? 'bg-emerald-50/40' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        aria-label={`Chọn thẻ tag ${kw.tag}`}
                        checked={isSelected}
                        onChange={() => toggleSelect(kw.id)}
                        className="rounded border-stone-300 text-[#007700] focus:ring-[#007700] cursor-pointer"
                      />
                    </td>

                    {/* Tag Name */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setExpandedRowId(isRowExpanded ? null : kw.id)}
                          title="Nhấn để xem tỉ lệ POD, cá nhân hóa và phân bố sản phẩm theo sàn"
                          className="font-bold text-stone-900 hover:text-[#007700] text-left transition-colors flex items-center gap-1.5"
                        >
                          <span>{kw.tag}</span>
                          {isRowExpanded ? (
                            <ChevronUp size={13} className="text-stone-400" />
                          ) : (
                            <ChevronDown size={13} className="text-stone-400" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Volume / Nhu cầu đo được */}
                    <td className="py-3 px-3">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ring-4 ${volDotColor}`} />
                          {(kw.sold_count_real ?? 0) > 0 ? (
                            <>
                              <span className="font-bold text-stone-900">
                                {Number(kw.sold_count_real).toLocaleString('vi-VN')}
                              </span>
                              <span className="text-[11px] text-stone-400">lượt bán</span>
                            </>
                          ) : (kw.etsy_favorers ?? 0) > 0 ? (
                            <>
                              <span className="font-bold text-stone-900">
                                {Number(kw.etsy_favorers).toLocaleString('vi-VN')}
                              </span>
                              <span className="text-[11px] text-stone-400">lượt thích (Etsy)</span>
                            </>
                          ) : kw.trend_match === 'exact' && kw.trend_index != null ? (
                            <>
                              <span className="font-bold text-stone-900">
                                {kw.trend_index}/100
                              </span>
                              <span className="text-[11px] text-stone-400">chỉ số Trends</span>
                            </>
                          ) : (
                            <span className="text-[11px] text-stone-400">Chưa có dữ liệu</span>
                          )}
                        </div>
                        {(kw.sold_count_real ?? 0) > 0 && (kw.etsy_favorers ?? 0) > 0 && (
                          <span className="pl-4 text-[10px] font-medium text-stone-500">
                            +{Number(kw.etsy_favorers).toLocaleString('vi-VN')} lượt thích Etsy
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Competition */}
                    <td className="py-3 px-3">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ring-4 ${compDotColor}`} />
                          {kw.competition > 0 ? (
                            <>
                              <span className="font-medium text-stone-700">
                                {kw.competition.toLocaleString('vi-VN')}
                              </span>
                              <span className="text-[11px] text-stone-400">gian hàng</span>
                            </>
                          ) : (
                            <span className="text-[11px] text-stone-400">Chưa đo được</span>
                          )}
                        </div>
                        {kw.sales_per_shop != null && (
                          <span className="pl-4 text-[10px] font-medium text-stone-500">
                            ~{kw.sales_per_shop.toLocaleString('vi-VN')} {(kw.etsy_favorers ?? 0) > 0 && (kw.sold_count_real ?? 0) === 0 ? 'cầu/shop' : 'bán/shop'}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Score */}
                    <td className="py-3 px-3 text-center">
                      <span
                        tabIndex={0}
                        onMouseEnter={e => openScoreTooltip(e.currentTarget, 'row', kw)}
                        onMouseLeave={() => setScoreTooltip(null)}
                        onFocus={e => openScoreTooltip(e.currentTarget, 'row', kw)}
                        onBlur={() => setScoreTooltip(null)}
                        className={`inline-block rounded-md px-2.5 py-1 text-xs cursor-help transition-shadow hover:ring-2 hover:ring-stone-300/70 focus:outline-none focus:ring-2 focus:ring-[#007700]/40 ${scoreBadgeClass}`}
                      >
                        {hasScore ? kw.keyword_score : 'N/A'}
                      </span>
                    </td>

                    {/* Shop Match */}
                    <td className="py-3 px-3 text-center">
                      {kw.shop_coverage ? (
                        kw.shop_coverage.matching > 0 ? (() => {
                          const targetProds = getTargetProducts(kw);
                          const isProdsOpen = openProductsKwId === kw.id;
                          return (
                            <div className="relative inline-flex flex-col items-center">
                              <button
                                type="button"
                                onClick={() => setOpenProductsKwId(prev => (prev === kw.id ? null : kw.id))}
                                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 hover:bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
                              >
                                <Check size={11} />
                                <span>Đã có ({kw.shop_coverage.matching} mẫu)</span>
                                {targetProds.length > 0 && (
                                  isProdsOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />
                                )}
                              </button>
                              {isProdsOpen && targetProds.length > 0 && (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 z-30 w-64 rounded-xl border border-stone-200 bg-white p-2.5 text-left shadow-lg">
                                  <div className="flex items-center justify-between border-b border-stone-100 pb-1.5 mb-1.5">
                                    <span className="text-[11px] font-bold uppercase tracking-wide text-stone-500">
                                      Sản phẩm gắn thẻ ({targetProds.length})
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setOpenProductsKwId(null)}
                                      className="rounded p-0.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                                      aria-label="Đóng"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                  <ul className="space-y-1 max-h-40 overflow-y-auto">
                                    {targetProds.map((p) => (
                                      <li
                                        key={p.id}
                                        className="text-[11px] leading-snug text-stone-700 bg-stone-50 rounded-md px-2 py-1 border border-stone-100"
                                      >
                                        {p.title}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          );
                        })() : (
                          <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200">
                            Chưa kinh doanh
                          </span>
                        )
                      ) : kw.is_in_shop ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                          <Check size={11} /> Đã kinh doanh
                        </span>
                      ) : (
                        <span className="text-[11px] text-stone-400">Chưa khai thác</span>
                      )}
                      {kw.search_wow_pct != null && (
                        <div className="mt-0.5 text-[11px] font-medium text-stone-500">
                          Xu hướng 4 tuần: {kw.search_wow_pct > 0 ? '+' : ''}{kw.search_wow_pct}%
                        </div>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                        {kw.action && (() => {
                          const isDoneAttached = Boolean(attachedTags[kw.id] || (kw.shop_coverage as any)?.already_tagged);
                          return (
                          <button
                            type="button"
                            disabled={attachingId === kw.id}
                            onClick={() => {
                              if (kw.action?.type === 'create_listing') {
                                window.location.assign(`/seller/products?keyword=${encodeURIComponent(kw.tag)}`);
                              } else if (kw.action?.type === 'optimize_tags') {
                                handleAttachTag(kw);
                              } else {
                                copyTags([kw.tag]);
                              }
                            }}
                            title={
                              kw.action?.type === 'optimize_tags' && getTargetProducts(kw).length > 0
                                ? `Gắn thẻ «${kw.tag}» vào: ${getTargetProducts(kw).map(p => p.title).join(', ')}`
                                : kw.action.label
                            }
                            className={`inline-flex h-7 w-[104px] items-center justify-center whitespace-nowrap rounded-md px-2.5 text-[11px] font-bold transition-colors ${
                              kw.action.type === 'create_listing'
                                ? 'bg-[#007700] text-white hover:bg-[#005B00]'
                                : isDoneAttached
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                            }`}
                          >
                            {kw.action.type === 'create_listing'
                              ? 'Tạo sản phẩm'
                              : kw.action.type === 'optimize_tags'
                              ? attachingId === kw.id
                                ? 'Đang gắn...'
                                : isDoneAttached
                                ? 'Đã gắn'
                                : 'Gắn thẻ'
                              : 'Sao chép'}
                          </button>
                          );
                        })()}
                        <button
                          type="button"
                          onClick={() => toggleStar(kw)}
                          title={isStarred ? 'Bỏ lưu khỏi sổ tay' : 'Lưu vào sổ tay kế hoạch'}
                          className={`inline-flex h-7 w-7 items-center justify-center rounded transition-colors ${
                            isStarred ? 'text-amber-500' : 'text-stone-300 hover:text-amber-400'
                          }`}
                        >
                          <Star size={15} fill={isStarred ? 'currentColor' : 'none'} />
                        </button>

                        <button
                          type="button"
                          onClick={() => copyTags([kw.tag])}
                          title="Sao chép thẻ này"
                          className="inline-flex h-7 w-7 items-center justify-center rounded text-stone-400 hover:text-stone-700 transition-colors"
                        >
                          <Copy size={13} />
                        </button>

                        {kw.evidence ? (
                          <button
                            type="button"
                            onClick={() => onOpenEvidence(kw.evidence)}
                            title="Xem công thức & minh chứng"
                            className="inline-flex h-7 w-7 items-center justify-center rounded text-stone-400 hover:text-[#007700] transition-colors"
                          >
                            <HelpCircle size={13} />
                          </button>
                        ) : (
                          <span className="inline-block h-7 w-7" />
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Chi tiết mở rộng của dòng (Collapsible More Details) */}
                  {isRowExpanded && (() => {
                    const sb = kw.source_breakdown;
                    const totalListings = sb?.total_listings ?? 0;
                    const byPlatform = sb?.by_platform ?? [];
                    return (
                    <tr className="bg-stone-50/60 border-b border-stone-200">
                      <td colSpan={7} className="p-3.5 pl-12 text-xs text-stone-600 space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-stone-200/80">
                          <div>
                            <span className="text-[11px] uppercase font-bold text-stone-400 block">
                              Tỉ lệ phôi POD
                            </span>
                            {sb && totalListings > 0 ? (
                              <>
                                <span className="font-bold text-stone-800">
                                  {sb.pod_pct.toLocaleString('vi-VN')}%
                                </span>
                                <span className="block text-[10px] font-medium text-stone-500">
                                  {sb.pod_count > 0
                                    ? `${sb.pod_count}/${totalListings} sản phẩm là phôi POD`
                                    : `0/${totalListings} SP (Hàng có sẵn / Thủ công)`}
                                </span>
                              </>
                            ) : (
                              <span className="font-semibold text-stone-800">
                                {kw.listing_type === 'pod' ? 'Có phôi POD' : 'Hàng có sẵn / Thủ công'}
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="text-[11px] uppercase font-bold text-stone-400 block">
                              Tỉ lệ SP cá nhân hóa
                            </span>
                            {sb && totalListings > 0 ? (
                              <>
                                <span className="font-bold text-stone-800">
                                  {sb.customizable_pct.toLocaleString('vi-VN')}%
                                </span>
                                <span className="block text-[10px] font-medium text-stone-500">
                                  {sb.customizable_count > 0
                                    ? `${sb.customizable_count}/${totalListings} SP cho tùy chỉnh / in tên`
                                    : `0/${totalListings} SP không bật tùy chỉnh`}
                                </span>
                              </>
                            ) : (
                              <span className="font-semibold text-stone-800">
                                {kw.customizable ? 'Có SP hỗ trợ tùy chỉnh' : 'Không bật tùy chỉnh'}
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="text-[11px] uppercase font-bold text-stone-400 block">
                              Giá bán trung bình thị trường
                            </span>
                            <span className="font-bold text-[#007700]">
                              {kw.avg_price_vnd ? money(kw.avg_price_vnd) : 'Chưa đủ dữ liệu'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[11px] uppercase font-bold text-stone-400 block">
                              Dư địa / Shop
                            </span>
                            <span className="font-bold text-stone-800">
                              {kw.sales_per_shop != null
                                ? `~${kw.sales_per_shop.toLocaleString('vi-VN')} ${(kw.etsy_favorers ?? 0) > 0 && (kw.sold_count_real ?? 0) === 0 ? 'cầu/shop' : 'bán/shop'}`
                                : (kw.etsy_favorers ?? 0) > 0
                                ? `${Number(kw.etsy_favorers).toLocaleString('vi-VN')} thích Etsy`
                                : 'Chưa đủ dữ liệu'}
                            </span>
                          </div>
                        </div>

                        {(byPlatform.length > 0 || (kw.platforms && kw.platforms.length > 0)) && (
                          <div className="bg-white border border-stone-200/80 rounded-lg px-3 py-2 text-[11px] text-stone-700 flex flex-wrap items-center gap-2">
                            <span className="font-bold text-stone-500 uppercase text-[10px]">
                              SP theo sàn dùng từ khóa này{totalListings > 0 ? ` (${totalListings} SP)` : ''}:
                            </span>
                            {byPlatform.length > 0
                              ? byPlatform.map(item => {
                                  const isPodPlat = item.platform.toLowerCase() === 'printify';
                                  const isEtsy = item.platform.toLowerCase() === 'etsy';
                                  const isTiki = item.platform.toLowerCase() === 'tiki';
                                  const pillCls = isPodPlat
                                    ? 'bg-sky-50 text-sky-800 border-sky-200'
                                    : isEtsy
                                    ? 'bg-orange-50 text-orange-800 border-orange-200'
                                    : isTiki
                                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200';
                                  return (
                                    <span
                                      key={item.platform}
                                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${pillCls}`}
                                    >
                                      <span>{isPodPlat ? 'Printify (POD)' : item.platform}:</span>
                                      <strong>{item.count.toLocaleString('vi-VN')} SP</strong>
                                      <span className="opacity-75">({item.pct.toLocaleString('vi-VN')}%)</span>
                                    </span>
                                  );
                                })
                              : kw.platforms?.map(p => (
                                  <span
                                    key={p}
                                    className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-[11px] font-medium text-stone-700"
                                  >
                                    {p}
                                  </span>
                                ))}
                          </div>
                        )}

                        {kw.score_breakdown && (
                          <div className="bg-stone-100/80 border border-stone-200/80 rounded-lg px-3 py-2 text-[11px] text-stone-700 space-y-1">
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                              <span>
                                <strong>Sức cầu (50%):</strong>{' '}
                                {kw.score_breakdown.demand_pts != null ? `${kw.score_breakdown.demand_pts}/50đ` : 'N/A'}
                              </span>
                              <span>
                                <strong>Dư địa/Shop (50%):</strong>{' '}
                                {kw.score_breakdown.headroom_pts != null ? `${kw.score_breakdown.headroom_pts}/50đ` : 'N/A'}
                              </span>
                              {kw.score_breakdown.effective_demand != null && kw.score_breakdown.effective_demand > 0 && (
                                <span className="text-stone-500">
                                  (Tổng cầu quy đổi: {kw.score_breakdown.effective_demand.toLocaleString('vi-VN')})
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {getTargetProducts(kw).length > 0 && (
                          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-lg px-3 py-2 text-[11px] text-emerald-900">
                            <span className="font-bold">Sản phẩm sẽ được gắn thẻ ({getTargetProducts(kw).length}): </span>
                            <span>{getTargetProducts(kw).map(p => p.title).join(' · ')}</span>
                          </div>
                        )}

                        {kw.evidence && (
                          <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                            <span>
                              <strong>Căn cứ:</strong> {kw.evidence.definition}
                            </span>
                            <button
                              type="button"
                              onClick={() => onOpenEvidence(kw.evidence)}
                              className="font-bold text-[#007700] hover:underline flex items-center gap-1"
                            >
                              <span>Kiểm tra minh chứng chi tiết</span>
                              <ExternalLink size={11} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                    );
                  })()}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 3. Chân bảng điều khiển hiển thị */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 border-t border-stone-100 text-xs text-stone-500">
        <div>
          Hiển thị <strong>{displayKeywords.length}</strong> / {keywords.length} từ khóa cơ hội
          {selectedList.length > 0 && ` · Đang chọn ${selectedList.length} thẻ tag`}
        </div>

        {keywords.length > 7 && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-bold text-[#007700] hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>{isExpanded ? 'Thu gọn top 7 từ khóa' : `Xem thêm ${keywords.length - 7} từ khóa khác`}</span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      {/* Popover giải thích nhanh khi rê chuột vào Điểm cơ hội */}
      {scoreTooltip && (
        <div
          role="tooltip"
          style={{
            top: scoreTooltip.top,
            left: scoreTooltip.left,
            transform: scoreTooltip.placeBelow ? 'translateY(0)' : 'translateY(-100%)',
          }}
          className="fixed z-50 w-72 pointer-events-none rounded-xl border border-stone-200 bg-white p-3 text-left shadow-xl ring-1 ring-black/5"
        >
          {scoreTooltip.kind === 'header' ? (
            <div className="space-y-1.5 text-[11px] leading-relaxed text-stone-600">
              <div className="font-bold text-stone-900">
                Cách tính Điểm cơ hội (0–100)
              </div>
              <p>
                <strong className="text-stone-800">50% Sức cầu</strong> (tối đa 50đ): Lượt bán Tiki/VietCraft + Lượt thích Etsy ÷ 10.
              </p>
              <p>
                <strong className="text-stone-800">50% Dư địa / Shop</strong> (tối đa 50đ): Tổng cầu chia đều cho số gian hàng đang bán.
              </p>
              <p className="text-[10px] text-stone-400 pt-0.5">
                Rê chuột vào từng con số bên dưới để xem lý do chi tiết.
              </p>
            </div>
          ) : scoreTooltip.kw ? (() => {
            const kw = scoreTooltip.kw;
            const info = getScoreExplanation(kw);
            const statusBadge = !info.hasScore
              ? { label: 'Chưa đủ dữ liệu', cls: 'bg-stone-100 text-stone-500' }
              : kw.keyword_score! >= 70
              ? { label: 'Cơ hội cao', cls: 'bg-emerald-100 text-emerald-800' }
              : kw.keyword_score! >= 45
              ? { label: 'Mức khá', cls: 'bg-amber-100 text-amber-800' }
              : { label: 'Còn thấp', cls: 'bg-stone-100 text-stone-600' };

            return (
              <div className="space-y-2 text-[11px]">
                <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-1.5">
                  <span className="font-bold text-stone-900">
                    {info.hasScore ? `Điểm cơ hội: ${kw.keyword_score}/100` : 'Chưa có điểm (N/A)'}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusBadge.cls}`}>
                    {statusBadge.label}
                  </span>
                </div>

                {info.hasScore && (info.demandPts != null || info.headroomPts != null) && (
                  <div className="space-y-2">
                    {/* Sức cầu 50% */}
                    {info.demandPts != null && (
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between text-stone-700">
                          <span className="font-semibold">Sức cầu (50%)</span>
                          <span className="font-bold text-stone-900">{info.demandPts}/50đ</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${Math.min(100, Math.max(4, (info.demandPts / 50) * 100))}%` }}
                          />
                        </div>
                        {info.demandSource && (
                          <div className="text-[10px] text-stone-500">{info.demandSource}</div>
                        )}
                      </div>
                    )}

                    {/* Dư địa / Shop 50% */}
                    {info.headroomPts != null && (
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between text-stone-700">
                          <span className="font-semibold">Dư địa / Shop (50%)</span>
                          <span className="font-bold text-stone-900">{info.headroomPts}/50đ</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                          <div
                            className="h-full rounded-full bg-amber-500"
                            style={{ width: `${Math.min(100, Math.max(4, (info.headroomPts / 50) * 100))}%` }}
                          />
                        </div>
                        {info.headroomSource && (
                          <div className="text-[10px] text-stone-500">{info.headroomSource}</div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <p className="rounded-lg bg-stone-50 px-2 py-1.5 text-[11px] leading-snug text-stone-700 border border-stone-100">
                  {info.takeaway}
                </p>
              </div>
            );
          })() : null}
        </div>
      )}
    </div>
  );
};
