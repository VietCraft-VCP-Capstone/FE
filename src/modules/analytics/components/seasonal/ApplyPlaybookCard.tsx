import { useState } from 'react';
import { CalendarClock, CheckCircle2, AlertTriangle, ArrowUpRight, HelpCircle, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ApplyPlaybook, PlaybookStep, SeasonalIdeaOutcome } from '../../types';
import { autoStepStatus, playbookStepKey, playbookStepSlot } from './playbookSteps';
import type { SavedIdeaSummaryItem } from './SeasonalHeader';
import type { AiShopIdea } from './SeasonalPotentialTab';

interface Props {
  playbooks?: ApplyPlaybook[];
  savedIdeas?: Record<string, boolean>;
  savedIdeaItems?: SavedIdeaSummaryItem[];
  aiIdeas?: AiShopIdea[];
  allShopProducts?: any[];
  /** Thành quả từng ý tưởng do BE đo (sản phẩm có source_idea_id + đơn hợp lệ trong kỳ dịp) */
  outcomes?: SeasonalIdeaOutcome[];
  /** Gắn/bỏ gắn sản phẩm có sẵn vào ý tưởng; null khi không được lưu (gian hàng mẫu) */
  onLinkProduct?: ((ideaId: string, productId: string, linked: boolean) => Promise<void>) | null;
  onEditSavedIdea?: (ideaId: string) => void;
  checkedMilestones?: Record<string | number, boolean>;
  onToggleMilestone?: (idx: number, nextVal: boolean, ideaId?: string) => void;
  occasionName: string;
}

export function ApplyPlaybookCard({
  playbooks = [],
  savedIdeas = {},
  savedIdeaItems = [],
  aiIdeas = [],
  allShopProducts = [],
  outcomes = [],
  onLinkProduct = null,
  onEditSavedIdea,
  checkedMilestones,
  onToggleMilestone,
  occasionName,
}: Props) {
  const [localCheckedSteps, setLocalCheckedSteps] = useState<Record<string, boolean>>({});
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [linkProductId, setLinkProductId] = useState('');
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  if (!playbooks || playbooks.length === 0) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 text-xs text-stone-600">
        Chưa có kế hoạch hành động cho dịp {occasionName}. Hãy chọn ý tưởng ở bước Ý tưởng trước.
      </div>
    );
  }

  const activeIdx = 0;
  const pb = playbooks[activeIdx];
  const savedKeys = Object.keys(savedIdeas).filter(k => savedIdeas[k]);

  // Nguồn ý tưởng hiển thị: ưu tiên ý tưởng seller đã chọn, nếu chưa chọn thì lấy đúng 3 ý tưởng AI của shop từ Tab Ý tưởng (không lấy sp Tiki)
  const displayPlanIdeas: SavedIdeaSummaryItem[] =
    savedIdeaItems.length > 0
      ? savedIdeaItems
      : aiIdeas.map(a => ({ id: a.id, title: a.title, subtitle: 'Gợi ý AI cho shop (chưa chọn)' }));

  const activeIdea = displayPlanIdeas.find(i => i.id === selectedIdeaId) || displayPlanIdeas[0] || null;
  const isUsingSavedIdea = savedIdeaItems.length > 0 && activeIdea !== null;

  // Tiến độ của ý tưởng đang chọn: chỉ dựa vào sản phẩm gắn đúng ý tưởng và đơn hợp lệ trong kỳ dịp (BE đo)
  const activeOutcome = isUsingSavedIdea ? outcomes.find(o => o.idea_id === activeIdea.id) || null : null;
  const activeMatchingCount = activeOutcome ? activeOutcome.products.length : 0;
  const activeOrdersCount = activeOutcome ? activeOutcome.orders : 0;
  const linkedIds = new Set((activeOutcome?.products || []).map(p => p.id));
  const linkableProducts = allShopProducts.filter((p: any) => p?._id && !linkedIds.has(String(p._id)));

  const doLink = async (productId: string, linked: boolean) => {
    if (!onLinkProduct || !activeIdea) return;
    setLinkBusy(true);
    setLinkError(null);
    try {
      await onLinkProduct(activeIdea.id, productId, linked);
      setLinkProductId('');
    } catch {
      setLinkError(linked ? 'Không gắn được sản phẩm, vui lòng thử lại.' : 'Không bỏ gắn được sản phẩm, vui lòng thử lại.');
    } finally {
      setLinkBusy(false);
    }
  };

  // Bước tự ghi nhận từ dữ liệu thật (xem playbookSteps.ts); tick tay lưu theo vị trí cố định của bước, không theo dòng
  const getAutoStepStatus = (step: PlaybookStep) => autoStepStatus(step, activeMatchingCount, activeOrdersCount);

  const isStepDone = (step: PlaybookStep, slot: number) => {
    if (getAutoStepStatus(step).autoDone) return true;
    if (!activeIdea?.id) return false;
    const localVal = localCheckedSteps[`${activeIdea.id}_${slot}`];
    if (localVal !== undefined) return localVal;
    return Boolean(checkedMilestones?.[`${activeIdea.id}_${slot}`]);
  };

  const toggleStep = (step: PlaybookStep, slot: number) => {
    if (getAutoStepStatus(step).autoDone || !activeIdea?.id) return;
    const nextVal = !isStepDone(step, slot);
    if (onToggleMilestone) {
      onToggleMilestone(slot, nextVal, activeIdea.id);
    } else {
      setLocalCheckedSteps(prev => ({ ...prev, [`${activeIdea.id}_${slot}`]: nextVal }));
    }
  };

  return (
    <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <CalendarClock size={16} className="text-[#007700]" />
            <h4 className="m-0 text-sm sm:text-base font-bold text-stone-900">
              Kế hoạch triển khai lùi từ hạn chốt đơn
            </h4>
          </div>
          <p className="mt-0.5 mb-0 text-xs text-stone-500">
            Chuyển ý tưởng thành mốc ngày cụ thể, KPI kiểm chứng và điểm dừng lỗ cho {occasionName}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {savedKeys.length > 0 && (
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
              Đã gom {savedKeys.length} ý tưởng
            </span>
          )}
          <Link
            to="/seller/products"
            className="inline-flex items-center gap-1 rounded-xl bg-[#007700] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#005B00] transition-colors"
          >
            Mở quản lý sản phẩm
            <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>

      {/* Danh sách ý tưởng từ Tab Ý tưởng — bấm chọn ý tưởng để xem bảng tiến độ tương ứng */}
      {displayPlanIdeas.length > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5 space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs font-bold text-[#007700]">
            <span>
              {savedIdeaItems.length > 0
                ? `Chọn ý tưởng để xem tiến độ áp dụng (${savedIdeaItems.length}):`
                : `Ý tưởng đề xuất cho shop (${displayPlanIdeas.length}):`}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {displayPlanIdeas.map(item => {
              const isSelectedIdea = activeIdea?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedIdeaId(item.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedIdeaId(item.id);
                    }
                  }}
                  className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs cursor-pointer transition-all ${
                    isSelectedIdea
                      ? 'border-[#007700] bg-white ring-1 ring-[#007700]/40 shadow-2xs'
                      : 'border-emerald-200/80 bg-white/80 hover:border-emerald-400'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-semibold truncate ${isSelectedIdea ? 'text-[#007700]' : 'text-stone-900'}`} title={item.title}>
                        {item.title}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 truncate mt-0.5">
                      {isSelectedIdea ? 'Đang xem tiến độ bên dưới' : (item.subtitle || 'Bấm để xem tiến độ')}
                    </div>
                  </div>
                  {onEditSavedIdea && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        onEditSavedIdea(item.id);
                      }}
                      className="shrink-0 inline-flex items-center gap-1 rounded-md border border-[#007700] bg-emerald-50/60 px-2 py-1 text-[11px] font-bold text-[#007700] hover:bg-[#007700] hover:text-white transition-colors cursor-pointer"
                      title="Chỉnh sửa & Tạo sản phẩm thực"
                    >
                      <Pencil size={10} /> Tạo SP
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sản phẩm áp dụng ý tưởng: tạo mới (Tạo SP) hoặc gắn sản phẩm có sẵn của shop */}
      {isUsingSavedIdea && activeIdea && (
        <div className="rounded-xl border border-stone-200 p-3.5 space-y-2 text-xs">
          <div className="font-bold text-stone-900">Sản phẩm áp dụng «{activeIdea.title}»</div>
          {activeOutcome && activeOutcome.products.length > 0 ? (
            <ul className="m-0 list-none space-y-1 p-0">
              {activeOutcome.products.map(p => (
                <li key={p.id} className="flex items-center justify-between gap-2 rounded-lg bg-stone-50 px-2.5 py-1.5">
                  <span className="truncate text-stone-800" title={p.title}>{p.title || 'Sản phẩm'}</span>
                  {onLinkProduct && (
                    <button
                      type="button"
                      disabled={linkBusy}
                      onClick={() => doLink(p.id, false)}
                      className="shrink-0 rounded-md border border-stone-200 px-2 py-0.5 text-[11px] font-semibold text-stone-600 hover:bg-white disabled:opacity-50"
                    >
                      Bỏ gắn
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-stone-500">Chưa có sản phẩm nào áp dụng ý tưởng này.</p>
          )}
          {onLinkProduct && linkableProducts.length > 0 && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="sr-only" htmlFor="seasonal-link-product">Chọn sản phẩm có sẵn</label>
              <select
                id="seasonal-link-product"
                value={linkProductId}
                onChange={e => setLinkProductId(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs"
              >
                <option value="">Chọn sản phẩm có sẵn của shop…</option>
                {linkableProducts.map((p: any) => (
                  <option key={String(p._id)} value={String(p._id)}>
                    {p.title || p.name}
                    {p.source_idea_id ? ' (đang gắn ý tưởng khác)' : ''}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!linkProductId || linkBusy}
                onClick={() => doLink(linkProductId, true)}
                className="rounded-lg bg-[#007700] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#005B00] disabled:opacity-50"
              >
                Gắn vào ý tưởng
              </button>
            </div>
          )}
          {linkError && <p className="m-0 text-rose-700">{linkError}</p>}
          {activeOutcome && activeOutcome.products.length > 0 && (
            <p className="m-0 text-stone-500">
              Trong kỳ dịp: {activeOutcome.orders} đơn · {activeOutcome.units} sản phẩm bán ra ·{' '}
              {activeOutcome.revenue.toLocaleString('vi-VN')}đ (chỉ tính đơn hợp lệ của các sản phẩm trên).
            </p>
          )}
        </div>
      )}

      {/* 1 dòng trạng thái gọn: Tiến độ triển khai cho ý tưởng đang chọn */}
      <div className="flex flex-wrap items-center gap-2.5 text-xs text-stone-600">
        <span className="inline-flex items-center gap-1.5 font-semibold text-stone-900">
          {savedIdeaItems.length === 0 ? (
            <>
              <AlertTriangle size={14} className="text-amber-600 shrink-0" />
              <span>Chưa chọn ý tưởng nào — hãy chọn ý tưởng ở tab Ý tưởng để theo dõi tiến độ</span>
            </>
          ) : activeMatchingCount > 0 ? (
            <>
              <CheckCircle2 size={14} className="text-[#007700] shrink-0" />
              <span>
                Đã tạo {activeMatchingCount} sản phẩm cho ý tưởng «{activeIdea?.title}»
              </span>
            </>
          ) : (
            <>
              <AlertTriangle size={14} className="text-amber-600 shrink-0" />
              <span>
                Chưa tạo sản phẩm cho «{activeIdea?.title}» — bấm «Tạo SP» ở trên để bắt đầu
              </span>
            </>
          )}
        </span>
        <span className="text-stone-300">·</span>
        <span className={pb.feasible ? 'font-medium text-[#007700]' : 'font-semibold text-amber-700'}>
          {pb.feasible ? `Kịp hạn (còn ${pb.days_left_to_cut_off} ngày)` : `Gấp rút (còn ${pb.days_left_to_cut_off} ngày)`}
        </span>
      </div>

      {/* Bảng các bước hành động lùi từ cut-off (tối giản, icon cho căn cứ) */}
      <div className="overflow-x-auto rounded-xl border border-stone-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-stone-50 border-b border-stone-200 text-[11px] font-semibold text-stone-500">
            <tr>
              <th className="py-2 px-3 w-8">Xong</th>
              <th className="py-2 px-3">Ngày</th>
              <th className="py-2 px-3">Việc cần làm</th>
              <th className="py-2 px-3">Mục tiêu đạt</th>
              <th className="py-2 px-3 w-8 text-center" aria-label="Căn cứ" />
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {pb.steps.map((st, idx) => {
              const slot = playbookStepSlot(st, idx);
              const autoInfo = getAutoStepStatus(st);
              const done = isStepDone(st, slot);
              const displayTask =
                activeIdea && playbookStepKey(st) === 'listing'
                  ? `Đăng listing & gắn tag cho «${activeIdea.title}»`
                  : st.task;
              const shortDate = /^\d{4}-\d{2}-\d{2}$/.test(st.date)
                ? `${st.date.slice(8, 10)}/${st.date.slice(5, 7)}`
                : st.date;
              return (
                <tr key={slot} className={done ? 'bg-stone-50/50 text-stone-400' : 'bg-amber-50/40 text-stone-900'}>
                  <td className="py-2.5 px-3">
                    <input
                      type="checkbox"
                      aria-label={displayTask}
                      checked={done}
                      disabled={autoInfo.autoDone}
                      onChange={() => toggleStep(st, slot)}
                      title={autoInfo.autoDone && autoInfo.note ? `Tự động ghi nhận: ${autoInfo.note}` : 'Đánh dấu hoàn thành'}
                      className="h-4 w-4 rounded border-stone-300 text-[#007700] focus:ring-[#007700] cursor-pointer"
                    />
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px]">
                    <span className={done ? 'text-stone-400' : st.overdue ? 'text-amber-700 font-bold' : 'text-stone-800 font-semibold'}>
                      {shortDate}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={done ? 'line-through text-stone-400 font-medium' : 'font-semibold text-stone-900'}>
                        {displayTask}
                      </span>
                      {autoInfo.note && (
                        <span className={`text-[11px] font-medium ${autoInfo.autoDone ? 'text-[#007700]' : 'text-amber-700'}`}>
                          · {autoInfo.note}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`text-[11px] font-medium ${done ? 'text-stone-400' : 'text-[#007700] font-semibold'}`}>
                      {st.kpi}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {st.why && (
                      <span title={st.why} className="inline-flex text-stone-400 hover:text-[#007700] cursor-help">
                        <HelpCircle size={14} />
                      </span>
                    )}
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

