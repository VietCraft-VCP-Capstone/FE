import { useEffect, useState } from 'react';
import {
  Boxes,
  Check,
  ExternalLink,
  Info,
  Package,
  Pencil,
  Plus,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react';
import type { PodBlankSuggestion, PotentialProfile, ReadyToShipIdea } from '../../types';
import { analyticsApi, seasonalSaveError, type SeasonalPlanRef } from '../../services/analyticsApi';

export interface AiShopIdea {
  id: string;
  title: string;
  concept: string;
  target_price_vnd: number;
  estimated_cost_vnd: number;
  expected_margin_pct: number;
  tags: string[];
  why_it_fits_shop: string;
  source_type?: 'llm_scoped' | 'draft_synthesized';
  draft_basis?: {
    shop_style: string;
    price_band: string;
    trend_signal: string;
    top_keywords: string[];
  };
}

export interface ShopDnaSummary {
  style_keywords?: string[];
  sample_titles?: string[];
  price_band?: { min: number; max: number; avg: number };
  product_count?: number;
}

export interface SavedIdeaDraftMap {
  [ideaId: string]: {
    title?: string;
    concept?: string;
    price_vnd?: number;
    tags?: string[];
    updated_at?: string;
  };
}

interface SeasonalPotentialTabProps {
  /** kỳ dịp (mã + năm) để lưu bản nháp đúng kỳ */
  planRef?: SeasonalPlanRef | null;
  readyIdeas: ReadyToShipIdea[];
  podBlanks: PodBlankSuggestion[];
  aiIdeas?: AiShopIdea[];
  shopDna?: ShopDnaSummary;
  savedIdeaDrafts?: SavedIdeaDraftMap;
  focusIdeaId?: string | null;
  onClearFocusIdea?: () => void;
  potentialProfiles?: PotentialProfile[];
  savedIdeas: Record<string, boolean>;
  onToggleSaveIdea: (ideaId: string) => void;
  onOpenProfileDrawer: (profile: PotentialProfile) => void;
  onApplyIdea?: () => void;
}

export function SeasonalPotentialTab({
  planRef,
  readyIdeas,
  podBlanks,
  aiIdeas = [],
  shopDna,
  savedIdeaDrafts = {},
  focusIdeaId,
  onClearFocusIdea,
  potentialProfiles = [],
  savedIdeas,
  onToggleSaveIdea,
  onOpenProfileDrawer,
  onApplyIdea,
}: SeasonalPotentialTabProps) {
  const [activeTab, setActiveTab] = useState<'ai' | 'ready' | 'pod'>(aiIdeas.length > 0 ? 'ai' : 'ready');
  const [sortOption, setSortOption] = useState<'profit' | 'newest'>('profit');
  const [localDrafts, setLocalDrafts] = useState<SavedIdeaDraftMap>(savedIdeaDrafts);
  const [editingIdea, setEditingIdea] = useState<{
    id: string;
    title: string;
    concept: string;
    price_vnd: number;
    tagsText: string;
    isPod?: boolean;
  } | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftNotice, setDraftNotice] = useState<string | null>(null);

  useEffect(() => {
    setLocalDrafts(prev => ({ ...savedIdeaDrafts, ...prev }));
  }, [savedIdeaDrafts]);

  useEffect(() => {
    if (!focusIdeaId) return;
    const aiMatch = aiIdeas.find(a => a.id === focusIdeaId);
    if (aiMatch) {
      const d = localDrafts[aiMatch.id];
      setActiveTab('ai');
      setEditingIdea({
        id: aiMatch.id,
        title: d?.title || aiMatch.title,
        concept: d?.concept || aiMatch.concept,
        price_vnd: d?.price_vnd || aiMatch.target_price_vnd,
        tagsText: (d?.tags || aiMatch.tags || []).join(', '),
      });
      onClearFocusIdea?.();
      return;
    }
    const readyMatch = readyIdeas.find((r, i) => `ready_${i}_${r.title}` === focusIdeaId);
    if (readyMatch) {
      const d = localDrafts[focusIdeaId];
      setActiveTab('ready');
      setEditingIdea({
        id: focusIdeaId,
        title: d?.title || readyMatch.title,
        concept: d?.concept || readyMatch.why_it_sells || '',
        price_vnd: d?.price_vnd || Number(String(readyMatch.suggested_price || '').replace(/[^\d]/g, '')) || 250000,
        tagsText: (d?.tags || [readyMatch.keyword || ''].filter(Boolean)).join(', '),
      });
      onClearFocusIdea?.();
      return;
    }
    if (focusIdeaId.startsWith('kw_')) {
      const kw = focusIdeaId.slice(3);
      const d = localDrafts[focusIdeaId];
      setEditingIdea({
        id: focusIdeaId,
        title: d?.title || `Sản phẩm đón dịp: ${kw}`,
        concept: d?.concept || `Triển khai sản phẩm mới tối ưu từ khóa "${kw}".`,
        price_vnd: d?.price_vnd || shopDna?.price_band?.avg || 250000,
        tagsText: (d?.tags || [kw]).join(', '),
      });
      onClearFocusIdea?.();
    }
  }, [focusIdeaId]);

  const handleSaveDraft = async () => {
    if (!editingIdea) return;
    setSavingDraft(true);
    const parsedTags = editingIdea.tagsText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    try {
      if (!planRef) throw new Error('missing_plan_ref');
      await analyticsApi.saveSeasonalIdeaDraft({
        ...planRef,
        idea_id: editingIdea.id,
        title: editingIdea.title,
        concept: editingIdea.concept,
        price_vnd: editingIdea.price_vnd,
        tags: parsedTags,
      });
      setLocalDrafts(prev => ({
        ...prev,
        [editingIdea.id]: {
          title: editingIdea.title,
          concept: editingIdea.concept,
          price_vnd: editingIdea.price_vnd,
          tags: parsedTags,
        },
      }));
      if (!savedIdeas[editingIdea.id]) {
        onToggleSaveIdea(editingIdea.id);
      }
      setDraftNotice(`Đã lưu bản chỉnh sửa ý tưởng «${editingIdea.title}».`);
      setTimeout(() => setDraftNotice(null), 3000);
    } catch (err) {
      setDraftNotice(seasonalSaveError(err, 'Không thể lưu bản sửa lúc này.'));
      setTimeout(() => setDraftNotice(null), 3500);
    } finally {
      setSavingDraft(false);
    }
  };

  const handleCreateProductFromIdea = async () => {
    if (!editingIdea) return;
    // Tự động khóa bản chụp ý tưởng vào MongoDB (`idea_drafts` + `saved_ideas`) trước khi chuyển trang tạo sản phẩm
    const parsedTags = editingIdea.tagsText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    try {
      if (!planRef) throw new Error('missing_plan_ref');
      await analyticsApi.saveSeasonalIdeaDraft({
        ...planRef,
        idea_id: editingIdea.id,
        title: editingIdea.title,
        concept: editingIdea.concept,
        price_vnd: editingIdea.price_vnd,
        tags: parsedTags,
      });
    } catch {
      // Không chặn seller tạo sản phẩm nếu lưu nháp lỗi mạng
    }

    if (editingIdea.isPod) {
      const qs = new URLSearchParams({
        title: editingIdea.title,
        source_idea_id: editingIdea.id,
      });
      window.location.assign(`/seller/products/new?${qs.toString()}`);
      return;
    }
    const qs = new URLSearchParams({
      new: '1',
      title: editingIdea.title,
      source_idea_id: editingIdea.id,
      ...(editingIdea.price_vnd > 0 ? { price: String(editingIdea.price_vnd) } : {}),
      ...(editingIdea.concept ? { description: editingIdea.concept } : {}),
      ...(editingIdea.tagsText ? { tags: editingIdea.tagsText } : {}),
    });
    window.location.assign(`/seller/products?${qs.toString()}`);
  };

  const rawIdeas = activeTab === 'ready' ? readyIdeas : podBlanks;
  const parsePct = (v: any) => {
    const m = String(v || '').match(/\d+/);
    return m ? Number(m[0]) : 0;
  };
  const displayIdeas =
    sortOption === 'profit'
      ? [...rawIdeas].sort((a: any, b: any) => {
          const pa = parsePct(a.expected_profit_margin || a.estimated_profit);
          const pb = parsePct(b.expected_profit_margin || b.estimated_profit);
          return pb - pa;
        })
      : rawIdeas;

  return (
    <div className="space-y-5 pt-2">
      {/* Thanh chọn mô hình nguồn hàng & Sắp xếp */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-stone-50/70 p-3.5 border border-stone-200/80">
        <div className="inline-flex flex-wrap rounded-full border border-stone-200 bg-white p-1 shadow-xs">
          {aiIdeas.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('ai')}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'ai'
                  ? 'bg-[#EAF0E2] text-[#007700] shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Wand2 size={13} />
              Ý tưởng cho shop ({aiIdeas.length})
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('ready')}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'ready'
                ? 'bg-amber-100/90 text-amber-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Package size={13} />
            Mẫu thị trường ({readyIdeas.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pod')}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'pod'
                ? 'bg-sky-100/90 text-sky-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles size={13} />
            Phôi in POD ({podBlanks.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-500 font-medium">Sắp xếp:</span>
          <select
            aria-label="Sắp xếp ý tưởng"
            value={sortOption}
            onChange={e => setSortOption(e.target.value as any)}
            className="cursor-pointer rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 outline-none hover:border-stone-300"
          >
            <option value="profit">Lãi cao nhất</option>
            <option value="newest">Mới nhất</option>
          </select>
        </div>
      </div>

      {draftNotice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-[#007700]">
          {draftNotice}
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {aiIdeas.map(ai => {
              const draft = localDrafts[ai.id];
              const displayTitle = draft?.title || ai.title;
              const displayConcept = draft?.concept || ai.concept;
              const displayPrice = draft?.price_vnd || ai.target_price_vnd;
              const displayTags = draft?.tags && draft.tags.length > 0 ? draft.tags : ai.tags;
              const isSaved = !!savedIdeas[ai.id];

              return (
                <div
                  key={ai.id}
                  className={`flex flex-col justify-between rounded-2xl border bg-white p-4 shadow-sm transition-all ${
                    isSaved ? 'border-[#007700] ring-2 ring-[#007700]/15' : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="flex flex-1 flex-col justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="text-sm font-bold text-stone-900 leading-snug m-0 flex-1">{displayTitle}</h5>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {draft?.title && (
                            <span className="rounded bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800">
                              Đã sửa
                            </span>
                          )}
                          {ai.why_it_fits_shop && (
                            <div className="group relative inline-flex">
                              <span
                                title={`Căn cứ: ${ai.why_it_fits_shop}`}
                                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-stone-500 hover:border-[#007700] hover:bg-emerald-50 hover:text-[#007700] cursor-help transition-colors"
                              >
                                <Info size={13} />
                              </span>
                              <div className="pointer-events-none invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity duration-150 absolute right-0 top-full mt-1.5 z-30 w-64 rounded-xl border border-stone-200 bg-white p-2.5 text-[11px] leading-relaxed text-stone-600 shadow-lg">
                                <strong className="text-stone-800">Căn cứ:</strong> {ai.why_it_fits_shop}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-stone-600 leading-relaxed m-0">{displayConcept}</p>
                    </div>

                    <div className="space-y-2.5 pt-1">
                      <div className="flex flex-wrap gap-1">
                        {displayTags.map(tg => (
                          <span key={tg} className="rounded bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-700">
                            #{tg}
                          </span>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-2 rounded-xl bg-stone-50 border border-stone-200/70 p-2.5 text-xs">
                        <div>
                          <span className="text-[11px] text-stone-500 block">Giá bán đề xuất</span>
                          <strong className="text-[#007700]">{displayPrice.toLocaleString('vi-VN')}đ</strong>
                        </div>
                        <div>
                          <span className="text-[11px] text-stone-500 block">Biên lãi dự kiến</span>
                          <strong className="text-stone-900">{ai.expected_margin_pct}%</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-stone-100 space-y-2">
                    <button
                      type="button"
                      onClick={() =>
                        setEditingIdea({
                          id: ai.id,
                          title: displayTitle,
                          concept: displayConcept,
                          price_vnd: displayPrice,
                          tagsText: displayTags.join(', '),
                        })
                      }
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 py-2 text-xs font-bold text-stone-800 hover:border-[#007700] hover:text-[#007700] hover:bg-white transition-colors"
                    >
                      <Pencil size={13} /> Chỉnh sửa &amp; Tạo sản phẩm
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!isSaved) {
                          // Tự động lưu bản chụp (snapshot) để ý tưởng đã chọn không bị mất/đè khi restart server
                          setLocalDrafts(prev => ({
                            ...prev,
                            [ai.id]: {
                              title: displayTitle,
                              concept: displayConcept,
                              price_vnd: displayPrice,
                              tags: displayTags,
                            },
                          }));
                          if (planRef) analyticsApi
                            .saveSeasonalIdeaDraft({
                              ...planRef,
                              idea_id: ai.id,
                              title: displayTitle,
                              concept: displayConcept,
                              price_vnd: displayPrice,
                              tags: displayTags,
                            })
                            .catch(() => {});
                        }
                        onToggleSaveIdea(ai.id);
                      }}
                      className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
                        isSaved
                          ? 'bg-[#007700] text-white shadow-xs'
                          : 'border border-[#007700] text-[#007700] hover:bg-[#EAF0E2]/40'
                      }`}
                    >
                      {isSaved ? (
                        <>
                          <Check size={14} /> Đã chọn vào sổ tay
                        </>
                      ) : (
                        <>
                          <Plus size={14} /> Chọn vào sổ tay
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lưới 4 thẻ gợi ý sản phẩm với hồ sơ 5 lớp */}
      {activeTab !== 'ai' && (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {displayIdeas.slice(0, 4).map((item: any, idx: number) => {
          const ideaId = `${activeTab}-${idx}-${item.title || item.name}`;
          const isSaved = Boolean(savedIdeas[ideaId]);
          const profitMargin =
            item.expected_profit_margin ||
            item.estimated_profit ||
            (item.suggested_price && item.base_cost
              ? `${Math.max(20, Math.round(((parseInt(String(item.suggested_price).replace(/\D/g, '')) - parseInt(String(item.base_cost).replace(/\D/g, ''))) / Math.max(1, parseInt(String(item.suggested_price).replace(/\D/g, '')))) * 100))}%`
              : 'ước tính theo ngành');
          const profile = potentialProfiles[idx % (potentialProfiles.length || 1)];

          return (
            <div
              key={idx}
              className="flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm transition hover:border-stone-300"
            >
              <div>
                {/* Header thẻ: Ảnh thật + Tên + Biên lãi */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {item.image_url && (
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
                        <img
                          src={item.image_url}
                          alt={item.title || item.name}
                          className="h-full w-full object-cover"
                          onError={e => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        {item.platform && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200">
                            <ShoppingBag size={10} />
                            {item.platform}
                          </span>
                        )}
                        {item.sold_count > 0 ? (
                          <span className="text-[11px] font-medium text-stone-500">
                            Đã bán {item.sold_count.toLocaleString('vi-VN')}
                          </span>
                        ) : item.num_favorers > 0 ? (
                          <span className="text-[11px] font-medium text-stone-500">
                            {Number(item.num_favorers).toLocaleString('vi-VN')} lượt thích
                          </span>
                        ) : null}
                      </div>
                      {item.product_url ? (
                        <a
                          href={item.product_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="m-0 text-sm font-bold text-stone-900 hover:text-[#007700] leading-snug inline-flex items-center gap-1"
                        >
                          <span className="line-clamp-2">{item.title || item.name}</span>
                          <ExternalLink size={12} className="shrink-0 text-stone-400" />
                        </a>
                      ) : (
                        <h4 className="m-0 text-sm font-bold text-stone-900 leading-snug">
                          {item.title || item.name}
                        </h4>
                      )}
                      {item.seller_name && (
                        <span className="block text-[11px] text-stone-400 mt-0.5">
                          Shop: {item.seller_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200/60">
                    Lãi {profitMargin}
                  </span>
                </div>

                {/* Progress bar lợi nhuận */}
                <div className="my-2.5 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-amber-400 via-lime-500 to-[#16a34a] w-3/4" />
                </div>

                {/* Chi tiết ý tưởng */}
                <div className="space-y-1.5 text-xs leading-relaxed text-stone-600">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-1.5">
                    <span className="text-stone-400">Khoảng giá thị trường</span>
                    <span className="font-bold text-stone-800">
                      {item.market_price_range || item.suggested_price || '160.000đ – 350.000đ'}
                    </span>
                  </div>

                  {item.why_it_sells && (
                    <p className="m-0 text-stone-600 pt-1">
                      <strong className="font-semibold text-stone-800">Lý do mua:</strong> {item.why_it_sells}
                    </p>
                  )}

                  {item.upsell_bundle_tip && (
                    <p className="m-0 text-stone-600">
                      <strong className="font-semibold text-stone-800">Gợi ý bán kèm:</strong>{' '}
                      <span className="font-semibold text-emerald-800">{item.upsell_bundle_tip}</span>
                    </p>
                  )}

                  {item.sourcing_tip && (
                    <div className="flex items-start gap-1.5 pt-1 text-[11px] text-stone-500">
                      <Boxes size={13} className="mt-0.5 shrink-0 text-stone-400" />
                      <span>{item.sourcing_tip}</span>
                    </div>
                  )}

                  {item.suggested_theme && (
                    <p className="m-0 text-stone-600">
                      <strong className="font-semibold text-stone-800">Chủ đề thiết kế:</strong> {item.suggested_theme}
                    </p>
                  )}

                  {item.design_hook && (
                    <p className="m-0 text-stone-600">
                      <strong className="font-semibold text-stone-800">Điểm nhấn:</strong> {item.design_hook}
                    </p>
                  )}
                </div>

                {/* Khối tóm tắt hồ sơ tiềm năng */}
                {profile && (
                  <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50/80 p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-stone-700">{profile.signal_label}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold ${
                          profile.verdict === 'dat'
                            ? 'bg-[#EAF0E2] text-[#005B00]'
                            : profile.verdict === 'chua_chac'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {profile.verdict_label}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-stone-500">
                      <span>Cần bán để hòa vốn thử nghiệm:</span>
                      <strong className="text-stone-800 font-bold">
                        {profile.break_even?.break_even_units > 0
                          ? `${profile.break_even.break_even_units} sản phẩm`
                          : 'N/A'}
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Nút xem hồ sơ 5 lớp */}
              <div className="mt-4 space-y-2">
                {profile && (
                  <button
                    type="button"
                    onClick={() => onOpenProfileDrawer(profile)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 py-2 text-xs font-bold text-stone-700 transition hover:border-[#007700] hover:text-[#007700] hover:bg-white"
                  >
                    <ShieldAlert size={14} className="text-amber-600" />
                    Xem hồ sơ 5 lớp & Tính hòa vốn động
                  </button>
                )}

                {/* Nút chỉnh sửa & tạo sản phẩm trực tiếp */}
                <button
                  type="button"
                  onClick={() => {
                    const d = localDrafts[ideaId];
                    const parsedPrice = Number(String(item.suggested_price || '').replace(/[^\d]/g, '')) || 250000;
                    setEditingIdea({
                      id: ideaId,
                      title: d?.title || item.title,
                      concept: d?.concept || item.why_it_sells || '',
                      price_vnd: d?.price_vnd || parsedPrice,
                      tagsText: (d?.tags || [item.keyword || ''].filter(Boolean)).join(', '),
                      isPod: activeTab === 'pod',
                    });
                  }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 py-2 text-xs font-bold text-stone-800 hover:border-[#007700] hover:text-[#007700] hover:bg-white transition-colors"
                >
                  <Pencil size={13} /> Chỉnh sửa &amp; Tạo sản phẩm
                </button>

                {/* Nút thêm vào kế hoạch & chuyển sang Áp dụng */}
                <button
                  type="button"
                  onClick={() => onToggleSaveIdea(ideaId)}
                  className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
                    isSaved
                      ? 'bg-[#007700] text-white shadow-xs'
                      : 'border border-[#007700] text-[#007700] hover:bg-[#EAF0E2]/40 active:scale-98'
                  }`}
                >
                  {isSaved ? (
                    <>
                      <Check size={14} /> Đã gom vào kế hoạch
                    </>
                  ) : (
                    <>
                      <Plus size={14} /> Gom vào kế hoạch
                    </>
                  )}
                </button>
                {isSaved && onApplyIdea && (
                  <button
                    type="button"
                    onClick={onApplyIdea}
                    className="flex w-full items-center justify-center gap-1 rounded-xl bg-stone-900 py-2 text-xs font-bold text-white hover:bg-stone-800 transition-colors"
                  >
                    Triển khai kế hoạch ngay →
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Modal Chỉnh sửa trực tiếp ý tưởng & Tạo sản phẩm thực */}
      {editingIdea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h4 className="m-0 text-sm font-bold text-stone-900 flex items-center gap-2">
                <Pencil size={15} className="text-[#007700]" />
                Chỉnh sửa ý tưởng &amp; Tạo sản phẩm
              </h4>
              <button
                type="button"
                onClick={() => setEditingIdea(null)}
                className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                aria-label="Đóng"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Tên sản phẩm</label>
                <input
                  type="text"
                  value={editingIdea.title}
                  onChange={e => setEditingIdea({ ...editingIdea, title: e.target.value })}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900 outline-none focus:border-[#007700]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Giá bán dự kiến (VNĐ)</label>
                  <input
                    type="number"
                    value={editingIdea.price_vnd}
                    onChange={e => setEditingIdea({ ...editingIdea, price_vnd: Number(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900 outline-none focus:border-[#007700]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Thẻ từ khóa (phân cách dấu phẩy)</label>
                  <input
                    type="text"
                    value={editingIdea.tagsText}
                    onChange={e => setEditingIdea({ ...editingIdea, tagsText: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900 outline-none focus:border-[#007700]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Concept / Mô tả triển khai</label>
                <textarea
                  rows={3}
                  value={editingIdea.concept}
                  onChange={e => setEditingIdea({ ...editingIdea, concept: e.target.value })}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900 outline-none focus:border-[#007700]"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                disabled={savingDraft}
                onClick={handleSaveDraft}
                className="rounded-xl border border-[#007700] bg-white px-4 py-2 text-xs font-bold text-[#007700] hover:bg-emerald-50 transition-colors"
              >
                {savingDraft ? 'Đang lưu...' : 'Lưu bản sửa vào sổ tay'}
              </button>
              <button
                type="button"
                onClick={handleCreateProductFromIdea}
                className="rounded-xl bg-[#007700] px-4 py-2 text-xs font-bold text-white hover:bg-[#005B00] transition-colors"
              >
                Tạo sản phẩm thực →
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
