import { useState } from 'react';
import { CalendarClock, CheckCircle2, AlertTriangle, ArrowUpRight, Target, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ApplyPlaybook } from '../../types';
import type { SavedIdeaSummaryItem } from './SeasonalHeader';
import type { AiShopIdea } from './SeasonalPotentialTab';

interface Props {
  playbooks?: ApplyPlaybook[];
  savedIdeas?: Record<string, boolean>;
  savedIdeaItems?: SavedIdeaSummaryItem[];
  aiIdeas?: AiShopIdea[];
  matchingProductsCount?: number;
  inStockMatchingCount?: number;
  actualOrdersCount?: number;
  onEditSavedIdea?: (ideaId: string) => void;
  checkedMilestones?: Record<number, boolean>;
  onToggleMilestone?: (idx: number, nextVal: boolean) => void;
  occasionName: string;
}

export function ApplyPlaybookCard({
  playbooks = [],
  savedIdeas = {},
  savedIdeaItems = [],
  aiIdeas = [],
  matchingProductsCount = 0,
  inStockMatchingCount = 0,
  actualOrdersCount = 0,
  onEditSavedIdea,
  checkedMilestones,
  onToggleMilestone,
  occasionName,
}: Props) {
  const [localCheckedSteps, setLocalCheckedSteps] = useState<Record<string, boolean>>({});

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

  // Tự động xác nhận hoàn thành từng bước dựa trên dữ liệu thực tế trong hệ thống
  const getAutoStepStatus = (task: string): { autoDone: boolean; note?: string } => {
    const t = task.toLowerCase();
    if (t.includes('listing') || t.includes('tag') || t.includes('đăng')) {
      if (matchingProductsCount > 0) {
        return { autoDone: true, note: `Hệ thống tự ghi nhận: đã có ${matchingProductsCount} sản phẩm khớp` };
      }
    }
    if (t.includes('chốt sản xuất') || t.includes('nhập hàng') || t.includes('tồn')) {
      if (inStockMatchingCount > 0) {
        return { autoDone: true, note: `Hệ thống tự ghi nhận: ${inStockMatchingCount} sản phẩm còn tồn kho` };
      }
    }
    if (t.includes('thử nhỏ') || t.includes('đơn đầu') || t.includes('nhân rộng')) {
      if (actualOrdersCount > 0) {
        return { autoDone: true, note: `Hệ thống tự ghi nhận: đã có ${actualOrdersCount} đơn trong dịp` };
      }
    }
    return { autoDone: false };
  };

  const isStepDone = (idx: number, task: string) => {
    const { autoDone } = getAutoStepStatus(task);
    if (autoDone) return true;
    return checkedMilestones ? Boolean(checkedMilestones[idx]) : Boolean(localCheckedSteps[`${activeIdx}_${task}`]);
  };

  const toggleStep = (idx: number, task: string) => {
    if (getAutoStepStatus(task).autoDone) return;
    if (onToggleMilestone) {
      onToggleMilestone(idx, !checkedMilestones?.[idx]);
      return;
    }
    const k = `${activeIdx}_${task}`;
    setLocalCheckedSteps(prev => ({ ...prev, [k]: !prev[k] }));
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

      {/* Danh sách ý tưởng từ Tab Ý tưởng (ưu tiên ý tưởng đã chọn, không hiện sản phẩm Tiki rời rạc) */}
      {displayPlanIdeas.length > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5 space-y-2">
          <div className="text-xs font-bold text-[#007700]">
            {savedIdeaItems.length > 0
              ? `Ý tưởng bạn đã chọn từ bước Ý tưởng (${savedIdeaItems.length}):`
              : `Ý tưởng đề xuất cho shop từ bước Ý tưởng (${displayPlanIdeas.length}):`}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {displayPlanIdeas.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200/80 bg-white px-3 py-2 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-stone-900 truncate" title={item.title}>
                    {item.title}
                  </div>
                  {item.subtitle && (
                    <div className="text-[10px] text-stone-500 truncate">{item.subtitle}</div>
                  )}
                </div>
                {onEditSavedIdea && (
                  <button
                    type="button"
                    onClick={() => onEditSavedIdea(item.id)}
                    className="shrink-0 inline-flex items-center gap-1 rounded-md border border-[#007700] bg-emerald-50/60 px-2 py-1 text-[10px] font-bold text-[#007700] hover:bg-[#007700] hover:text-white transition-colors"
                    title="Chỉnh sửa & Tạo sản phẩm thực"
                  >
                    <Pencil size={10} /> Tạo SP
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tóm tắt tính khả thi & kỳ vọng định lượng P10-P50-P90 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className={`rounded-xl border p-3 text-xs ${pb.feasible ? 'border-emerald-200 bg-emerald-50/40' : 'border-amber-200 bg-amber-50/50'}`}>
          <div className="text-[11px] text-stone-500">Tính khả thi tiến độ</div>
          <div className="mt-1 flex items-center gap-1.5 font-bold text-stone-900">
            {pb.feasible ? <CheckCircle2 size={14} className="text-emerald-700" /> : <AlertTriangle size={14} className="text-amber-600" />}
            <span>{pb.feasible ? `Kịp hạn (còn ${pb.days_left_to_cut_off} ngày)` : `Gấp rút (còn ${pb.days_left_to_cut_off} ngày)`}</span>
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3 text-xs">
          <div className="text-[11px] text-stone-500">Kỳ vọng đơn 30 ngày (P10 – P90)</div>
          <div className="mt-1 font-bold text-stone-900">
            {pb.expected_orders_next_30d
              ? `${pb.expected_orders_next_30d.p10} – ${pb.expected_orders_next_30d.p90} đơn (TB ${pb.expected_orders_next_30d.p50})`
              : 'Chưa đủ đơn nền 8 tuần'}
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3 text-xs">
          <div className="text-[11px] text-stone-500">Độ phủ trên gian hàng</div>
          <div className="mt-1 font-bold text-stone-900">
            {pb.shop_coverage
              ? pb.shop_coverage.matching > 0
                ? `Đã có ${pb.shop_coverage.matching} sản phẩm khớp`
                : 'Chưa có sản phẩm khớp — cần tạo mới'
              : pb.signal_label || 'Theo dõi'}
          </div>
        </div>
      </div>

      {/* Bảng các bước hành động lùi từ cut-off */}
      <div className="overflow-x-auto rounded-xl border border-stone-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-stone-50 border-b border-stone-200 text-[11px] font-semibold text-stone-600">
            <tr>
              <th className="py-2.5 px-3 w-8">Xong</th>
              <th className="py-2.5 px-3">Mốc ngày</th>
              <th className="py-2.5 px-3">Việc cần làm</th>
              <th className="py-2.5 px-3">KPI đạt</th>
              <th className="py-2.5 px-3">Căn cứ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {pb.steps.map((st, idx) => {
              const autoInfo = getAutoStepStatus(st.task);
              const done = isStepDone(idx, st.task);
              return (
                <tr key={idx} className={done ? 'bg-emerald-50/30 text-stone-500' : 'hover:bg-stone-50/60'}>
                  <td className="py-2.5 px-3">
                    <input
                      type="checkbox"
                      aria-label={st.task}
                      checked={done}
                      disabled={autoInfo.autoDone}
                      onChange={() => toggleStep(idx, st.task)}
                      title={autoInfo.note || 'Đánh dấu hoàn thành'}
                      className="h-4 w-4 rounded border-stone-300 text-[#007700] focus:ring-[#007700] cursor-pointer"
                    />
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px]">
                    <span className={st.overdue ? 'text-amber-700 font-bold' : 'text-stone-700 font-semibold'}>
                      {st.date}
                    </span>
                  </td>
                  <td className={`py-2.5 px-3 font-semibold ${done ? 'line-through text-stone-400' : 'text-stone-900'}`}>
                    <div>{st.task}</div>
                    {autoInfo.autoDone && autoInfo.note && (
                      <div className="no-underline inline-block mt-0.5 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-[#007700]">
                        {autoInfo.note}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800 border border-emerald-200/70">
                      <Target size={11} />
                      {st.kpi}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-stone-600">{st.why}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

