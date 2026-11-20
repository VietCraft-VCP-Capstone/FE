import { useState } from 'react';
import { CalendarClock, CheckCircle2, AlertTriangle, ArrowUpRight, HelpCircle, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ApplyPlaybook } from '../../types';
import type { SavedIdeaSummaryItem } from './SeasonalHeader';
import type { AiShopIdea } from './SeasonalPotentialTab';

interface Props {
  playbooks?: ApplyPlaybook[];
  savedIdeas?: Record<string, boolean>;
  savedIdeaItems?: SavedIdeaSummaryItem[];
  aiIdeas?: AiShopIdea[];
  allShopProducts?: any[];
  matchingProductsCount?: number;
  inStockMatchingCount?: number;
  actualOrdersCount?: number;
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
  allShopProducts,
  matchingProductsCount = 0,
  inStockMatchingCount = 0,
  actualOrdersCount = 0,
  onEditSavedIdea,
  checkedMilestones,
  onToggleMilestone,
  occasionName,
}: Props) {
  const [localCheckedSteps, setLocalCheckedSteps] = useState<Record<string, boolean>>({});
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);

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

  // Tính tiến độ riêng cho ý tưởng đang chọn (khớp chính xác theo source_idea_id hoặc trùng >= 65% tên ý tưởng)
  const stopWords = new Set(['cho', 'dịp', 'mùa', 'tặng', 'quà', 'set', 'bộ', 'mẫu', 'sản', 'phẩm', 'và', 'của', 'theo', 'phong', 'cách', 'phiên', 'bản', 'siêu', 'sale']);
  const activeIdeaProducts = (() => {
    if (!isUsingSavedIdea || !allShopProducts) return null;
    const ideaTitleLower = (activeIdea.title || '').toLowerCase().trim();
    const tokens = ideaTitleLower
      .split(/[^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+/i)
      .filter((w: string) => w.length >= 3 && !stopWords.has(w));
    return allShopProducts.filter((p: any) => {
      if (p.source_idea_id && p.source_idea_id === activeIdea.id) return true;
      const pName = String(p.name || p.title || '').toLowerCase().trim();
      if (ideaTitleLower && (pName === ideaTitleLower || pName.includes(ideaTitleLower))) return true;
      if (tokens.length < 3) return false;
      const hits = tokens.filter((tk: string) => pName.includes(tk)).length;
      return hits >= Math.max(4, Math.ceil(tokens.length * 0.65));
    });
  })();

  const activeMatchingCount = activeIdeaProducts ? activeIdeaProducts.length : (isUsingSavedIdea ? matchingProductsCount : 0);
  const activeInStockCount = activeIdeaProducts
    ? activeIdeaProducts.filter((p: any) => (p.stock ?? 1) > 0).length
    : (isUsingSavedIdea ? inStockMatchingCount : 0);
  const activeOrdersCount = activeIdeaProducts
    ? activeIdeaProducts.reduce((sum: number, p: any) => sum + Number(p.sold_count ?? p.orders_count ?? 0), 0)
    : (isUsingSavedIdea ? actualOrdersCount : 0);

  // Tự động xác nhận hoàn thành từng bước dựa trên dữ liệu thực tế của ý tưởng đang chọn
  // Lưu ý: KHÔNG tự đánh dấu xong Bước "Chốt sản xuất / nhập hàng" chỉ vì SP mới đăng có stock > 0
  // (vì mọi SP mới tạo đều có tồn kho ban đầu; bước chốt nhập hàng cần seller tự xác nhận sau khi qua bước thử nhỏ).
  const getAutoStepStatus = (task: string): { autoDone: boolean; note?: string } => {
    const t = task.toLowerCase();
    if (t.includes('listing') || t.includes('tag') || t.includes('đăng')) {
      if (activeMatchingCount > 0) {
        return { autoDone: true, note: `Đã có ${activeMatchingCount} SP khớp` };
      }
    }
    if (t.includes('thử nhỏ') || t.includes('đơn đầu')) {
      if (activeOrdersCount > 0) {
        return { autoDone: true, note: `Đã có ${activeOrdersCount} đơn` };
      }
    }
    if (t.includes('chốt sản xuất') || t.includes('nhập hàng') || t.includes('tồn')) {
      if (activeInStockCount > 0) {
        return { autoDone: false, note: `Hiện có ${activeInStockCount} SP đang sẵn tồn` };
      }
    }
    return { autoDone: false };
  };

  const stepKey = (idx: number, task: string) => `${activeIdea?.id || activeIdx}_${idx}_${task}`;

  const isStepDone = (idx: number, task: string) => {
    const { autoDone } = getAutoStepStatus(task);
    if (autoDone) return true;
    const localVal = localCheckedSteps[stepKey(idx, task)];
    if (localVal !== undefined) return localVal;
    const ideaKey = activeIdea?.id ? `${activeIdea.id}_${idx}` : undefined;
    if (ideaKey && checkedMilestones && checkedMilestones[ideaKey] !== undefined) {
      return Boolean(checkedMilestones[ideaKey]);
    }
    return checkedMilestones ? Boolean(checkedMilestones[idx]) : false;
  };

  const toggleStep = (idx: number, task: string) => {
    if (getAutoStepStatus(task).autoDone) return;
    const nextVal = !isStepDone(idx, task);
    const k = stepKey(idx, task);
    setLocalCheckedSteps(prev => ({ ...prev, [k]: nextVal }));
    if (onToggleMilestone) {
      onToggleMilestone(idx, nextVal, activeIdea?.id);
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
              const autoInfo = getAutoStepStatus(st.task);
              const done = isStepDone(idx, st.task);
              const displayTask =
                activeIdea && (st.task.toLowerCase().includes('listing') || st.task.toLowerCase().includes('gắn tag'))
                  ? `Đăng listing & gắn tag cho «${activeIdea.title}»`
                  : st.task;
              const shortDate = /^\d{4}-\d{2}-\d{2}$/.test(st.date)
                ? `${st.date.slice(8, 10)}/${st.date.slice(5, 7)}`
                : st.date;
              return (
                <tr key={idx} className={done ? 'bg-stone-50/50 text-stone-400' : 'bg-amber-50/40 text-stone-900'}>
                  <td className="py-2.5 px-3">
                    <input
                      type="checkbox"
                      aria-label={displayTask}
                      checked={done}
                      disabled={autoInfo.autoDone}
                      onChange={() => toggleStep(idx, st.task)}
                      title={autoInfo.note ? `Tự động ghi nhận: ${autoInfo.note}` : 'Đánh dấu hoàn thành'}
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
                      {autoInfo.autoDone && autoInfo.note && (
                        <span className="text-[11px] font-medium text-[#007700]">
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

