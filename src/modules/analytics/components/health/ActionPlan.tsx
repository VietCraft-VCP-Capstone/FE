import type { ReactNode } from 'react';
import { CheckCircle2, RefreshCw, Target } from 'lucide-react';
import { editLink } from '../HealthParts';
import { plainText } from '../../format';
import type { HealthItem, ListingHealth } from '../../healthTypes';
import type { QualityIssue } from '../../qualityTypes';
import { ActionRow } from './ActionRow';
import { fieldName, MINIMAL_GUIDES } from './heroGuides';
import { ScoreBar, type BarStep } from './ScoreBar';
import { useAudit } from './useAudit';
import { blockersOf, CAP_FIELD, visibleTodos } from './visibleTodos';

const SCORED_ELSEWHERE = new Set([
  'IMAGES_MISSING', 'IMAGES_INSUFFICIENT', 'TAGS_MISSING', 'DESCRIPTION_MISSING', 'DESCRIPTION_EMPTY',
  'DESCRIPTION_TOO_SHORT', 'TITLE_MISSING', 'TITLE_EMPTY', 'TITLE_TOO_SHORT', 'PRICE_MISSING', 'MATERIAL_MISSING',
  'BAG_MATERIAL_MISSING',
]);

const STEP: Record<string, string> = {
  image: 'Thêm ảnh', description: 'Viết thêm mô tả', tags: 'Gắn thêm tag', material: 'Ghi chất liệu', review: 'Có đánh giá', price: 'Xem lại giá',
};

function cleanActionText(msg: string): string {
  if (msg.includes('chữ thừa copy')) return 'Tiêu đề chứa từ khóa rác copy từ sàn khác';
  if (msg.includes('Chất liệu không khớp')) return 'Chất liệu khai báo chưa khớp tên sản phẩm';
  return plainText(msg);
}

function cleanTodoText(msg: string): string {
  return msg
    .replace(/^Chọn thêm (\d+) tag[^\.]*\.?/i, 'Gắn thêm $1 thẻ từ khóa')
    .replace(/^Chưa có đánh giá nào[^\.]*\.?/i, 'Mời khách mua để lại đánh giá')
    .replace(/^Thêm (\d+) ảnh[^\.]*\.?/i, 'Bổ sung $1 ảnh sản phẩm')
    .replace(/^Mô tả quá ngắn[^\.]*\.?/i, 'Viết thêm mô tả chi tiết')
    .trim();
}

function suggestion(item: HealthItem) {
  if (typeof item.target !== 'string') return undefined;
  const label = item.field === 'title' ? 'Gợi ý chuẩn' : item.field === 'categories' ? 'Gợi ý danh mục' : null;
  return label ? <>{label}: <span className="font-semibold text-stone-800">{item.target}</span></> : undefined;
}

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <div className="space-y-2 pt-2">
      <div className="flex items-center justify-between text-xs pb-1">
        <span className="font-bold uppercase tracking-wider text-stone-500 text-[11px]">
          {title}
        </span>
        {note && (
          <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.2 rounded border border-rose-200/60">
            {note}
          </span>
        )}
      </div>
      <ul className="m-0 list-none space-y-2 p-0">{children}</ul>
    </div>
  );
}

function auditRow(issue: QualityIssue, productId: string) {
  const guide = MINIMAL_GUIDES[issue.code];
  const hint = [guide?.summary ?? issue.recommendation.message, ...(guide?.tips ?? [])].join(' · ');
  return (
    <ActionRow
      key={issue.id}
      text={`${guide?.title ?? issue.message} · ${fieldName(issue.field)}`}
      hint={hint}
      to={editLink(productId, issue.field)}
      cta="Sửa ngay"
    />
  );
}

export function ActionPlan({ data, productId }: { data: ListingHealth; productId: string }) {
  const audit = useAudit(productId);
  const now = data.score ?? 0;
  const base = data.cap?.raw ?? now;
  const todos = visibleTodos(data);
  const blockers = blockersOf(data);
  const urgent = data.warnings.filter(w => w.type === 'warning');
  const infos = data.warnings.filter(w => w.type === 'info');
  const issues = (audit.data?.issues || []).filter(i => i.status === 'open' && !SCORED_ELSEWHERE.has(i.code));

  let at = base;
  const steps: BarStep[] = todos.map((t, i) => {
    const from = at;
    at = Math.min(100, at + t.impact);
    return { key: t.code ?? t.message, label: String(i + 1), from, to: at, tip: `${STEP[t.code ?? ''] ?? plainText(t.message)}: +${Math.round(t.impact)} điểm` };
  });
  const potential = Math.min(100, Math.floor(at + 1e-6));
  const gated = blockers.length > 0 && potential > 79;
  if (data.cap) steps.unshift({ key: 'gate', label: '!', from: now, to: base, gate: true, tip: `Sửa lỗi gấp: +${Math.floor(base) - Math.floor(now)} điểm` });
  const hasUrgent = urgent.length > 0 || issues.some(i => i.severity === 'high');
  const hasSoft = infos.length > 0 || issues.some(i => i.severity !== 'high');
  const nothing = !hasUrgent && !hasSoft && todos.length === 0 && !audit.loading;
  const totalActionCount = urgent.length + issues.length + todos.length;

  return (
    <div className="space-y-4">
      {/* 1. Card Header */}
      <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-[#007700]" />
          <h2 className="m-0 text-base font-bold text-stone-900">Nhiệm vụ tối ưu</h2>
          <span className="rounded-full bg-stone-100 text-stone-700 px-2 py-0.5 text-xs font-bold border border-stone-200/60">
            {totalActionCount} việc cần làm
          </span>
        </div>

        <button
          type="button"
          disabled={audit.rechecking}
          onClick={audit.recheck}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-50 hover:border-stone-300 disabled:opacity-50 transition shadow-2xs"
        >
          <RefreshCw size={11} className={audit.rechecking ? 'animate-spin text-[#007700]' : ''} />
          <span>{audit.rechecking ? 'Đang soát...' : 'Soát lại'}</span>
        </button>
      </div>

      {/* 2. Progress Level-Up Track */}
      <ScoreBar now={now} steps={steps} potential={potential} />

      {nothing && (
        <div className="rounded-xl bg-emerald-50/80 border border-emerald-200/60 p-4 text-center">
          <CheckCircle2 size={22} className="mx-auto text-[#007700] mb-1" />
          <p className="m-0 text-xs font-bold text-emerald-900">Tin đăng đã đạt chuẩn tối ưu xuất sắc!</p>
          <p className="m-0 mt-0.5 text-[11px] text-emerald-700">Không còn việc cần xử lý. Tiếp tục theo dõi lượt xem và chuyển đổi.</p>
        </div>
      )}

      {/* 3. Urgent Fixes */}
      {hasUrgent && (
        <Section
          title="Ưu tiên sửa gấp"
          note={gated ? `Tạm khóa ở 79đ (${blockers.map(f => CAP_FIELD[f]).join(', ')})` : undefined}
        >
          {urgent.map(w => (
            <ActionRow
              key={w.message}
              text={cleanActionText(w.message)}
              sub={suggestion(w)}
              to={w.field ? editLink(productId, w.field) : null}
              cta="Sửa ngay"
            />
          ))}
          {issues.filter(i => i.severity === 'high').map(i => auditRow(i, productId))}
        </Section>
      )}

      {/* 4. Quick Point Boosters */}
      {todos.length > 0 && (
        <Section title="Cơ hội tăng điểm nhanh">
          {todos.map(t => (
            <ActionRow
              key={t.code ?? t.message}
              text={cleanTodoText(t.message)}
              gain={t.impact}
              to={t.code === 'review' ? '/seller/orders' : editLink(productId, t.field)}
              cta={t.code === 'review' ? 'Xem đơn' : 'Sửa'}
            />
          ))}
        </Section>
      )}

      {hasSoft && (
        <Section title="Gợi ý khác">
          {infos.map(w => (
            <ActionRow
              key={w.message}
              text={cleanActionText(w.message)}
              sub={suggestion(w)}
              to={w.field ? editLink(productId, w.field) : null}
              cta="Xem"
            />
          ))}
          {issues.filter(i => i.severity !== 'high').map(i => auditRow(i, productId))}
        </Section>
      )}
    </div>
  );
}
