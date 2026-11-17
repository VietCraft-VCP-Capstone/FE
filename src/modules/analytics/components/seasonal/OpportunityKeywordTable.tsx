import React, { useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  HelpCircle,
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
import { analyticsApi } from '../../services/analyticsApi';

interface Props {
  keywords: OpportunityKeywordItem[];
  occasionName: string;
  onOpenEvidence: (evidence: Evidence) => void;
  savedIdeas?: Record<string, boolean>;
  onToggleStar?: (tag: string) => void;
  className?: string;
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
    } catch {
      setCopyNotice(`Không thể gắn thẻ «${kw.tag}» tự động (kiểm tra backend đã restart chưa). Đã sao chép thẻ vào bộ nhớ tạm.`);
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
              Ma trận Từ khóa &amp; Thẻ Tag đón đầu dịp {occasionName}
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
              <th className="py-2.5 px-3 text-center">Điểm cơ hội</th>
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

              // Điểm cơ hội Score badge
              const scoreBadgeClass =
                kw.keyword_score >= 70
                  ? 'bg-emerald-100 text-emerald-800 font-extrabold'
                  : kw.keyword_score >= 45
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
                          className="font-bold text-stone-900 hover:text-[#007700] text-left transition-colors flex items-center gap-1.5"
                        >
                          <span>{kw.tag}</span>
                          {isRowExpanded ? (
                            <ChevronUp size={13} className="text-stone-400" />
                          ) : (
                            <ChevronDown size={13} className="text-stone-400" />
                          )}
                        </button>
                        {kw.listing_type === 'pod' && (
                          <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[9px] font-bold text-sky-700 border border-sky-200">
                            Phôi POD
                          </span>
                        )}
                        {kw.customizable && (
                          <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[9px] font-bold text-purple-700 border border-purple-200">
                            In tên riêng
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Volume / Nhu cầu đo được */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ring-4 ${volDotColor}`} />
                        {(kw as any).sold_count_real > 0 ? (
                          <>
                            <span className="font-bold text-stone-900">
                              {Number((kw as any).sold_count_real).toLocaleString('vi-VN')}
                            </span>
                            <span className="text-[10px] text-stone-400">lượt bán</span>
                          </>
                        ) : (kw as any).trend_index != null ? (
                          <>
                            <span className="font-bold text-stone-900">
                              {(kw as any).trend_index}/100
                            </span>
                            <span className="text-[10px] text-stone-400">chỉ số tìm kiếm</span>
                          </>
                        ) : (
                          <span className="text-[11px] text-stone-400">Chưa có dữ liệu</span>
                        )}
                      </div>
                    </td>

                    {/* Competition */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ring-4 ${compDotColor}`} />
                        {kw.competition > 0 ? (
                          <>
                            <span className="font-medium text-stone-700">
                              {kw.competition.toLocaleString('vi-VN')}
                            </span>
                            <span className="text-[10px] text-stone-400">gian hàng</span>
                          </>
                        ) : (
                          <span className="text-[11px] text-stone-400">Chưa đo được</span>
                        )}
                      </div>
                    </td>

                    {/* Score */}
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block rounded-md px-2.5 py-1 text-xs ${scoreBadgeClass}`}>
                        {kw.keyword_score}
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
                                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 hover:bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
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
                                    <span className="text-[10px] font-bold uppercase tracking-wide text-stone-500">
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
                          <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200">
                            Chưa kinh doanh
                          </span>
                        )
                      ) : kw.is_in_shop ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                          <Check size={11} /> Đã kinh doanh
                        </span>
                      ) : (
                        <span className="text-[11px] text-stone-400">Chưa khai thác</span>
                      )}
                      {kw.search_wow_pct != null && (
                        <div className="mt-0.5 text-[10px] font-medium text-stone-500">
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

                  {/* Chi tiết mở rộng của dòng (Collapsible More Details - Học hỏi Ảnh 1) */}
                  {isRowExpanded && (
                    <tr className="bg-stone-50/60 border-b border-stone-200">
                      <td colSpan={7} className="p-3.5 pl-12 text-xs text-stone-600 space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-stone-200/80">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-stone-400 block">
                              Mô hình phân phối
                            </span>
                            <span className="font-semibold text-stone-800">
                              {kw.listing_type === 'pod'
                                ? 'In phôi POD theo đơn (Vốn 0đ)'
                                : 'Hàng thủ công xưởng / Có sẵn'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-stone-400 block">
                              Cá nhân hóa theo tên
                            </span>
                            <span className="font-semibold text-stone-800">
                              {kw.customizable ? 'Có (Khách thích khắc tên)' : 'Không bắt buộc'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-stone-400 block">
                              Khoảng giá bán trung bình
                            </span>
                            <span className="font-bold text-[#007700]">
                              {kw.avg_price_vnd ? money(kw.avg_price_vnd) : '220.000đ – 350.000đ'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-stone-400 block">
                              Tỷ lệ chốt đơn kỳ vọng
                            </span>
                            <span className="font-bold text-stone-800">
                              {kw.conversion_rate_pct ? `${kw.conversion_rate_pct}%` : '4.2%'}
                            </span>
                          </div>
                        </div>

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
                  )}
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
    </div>
  );
};
