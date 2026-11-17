import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, ChevronRight, Clock, HelpCircle } from 'lucide-react';
import { editLink } from '../HealthParts';
import { vnd } from '../../format';
import type { HealthFactor, HealthItem, ListingHealth } from '../../healthTypes';
import { cleanTodoText, partTodo } from './visibleTodos';
import { PART } from './whyText';

function metricText(r: HealthFactor): string {
  const v = r.value ?? 0;
  if (r.scored === false) return 'Chưa đủ sản phẩm cùng loại để so';
  if (r.key === 'price') return r.value ? vnd(r.value) : 'Chưa có giá';
  if (r.key === 'image') return `${v}/${r.target} ảnh`;
  if (r.key === 'description') return `${v}/${r.target} từ`;
  if (r.key === 'tags') return `${v}/${r.target} từ khoá`;
  if (r.key === 'material') return v ? 'Đã ghi' : 'Chưa ghi';
  return v ? `${r.n_good ?? 0}/${v} đánh giá tốt` : 'Chưa có đánh giá';
}

const nameOf = (r: HealthFactor) => PART[r.key]?.label ?? r.label;

function TodoRow({ r, todo, productId }: { r: HealthFactor; todo: HealthItem; productId: string }) {
  const review = todo.code === 'review';
  return (
    <li>
      <Link
        to={review ? '/seller/orders' : editLink(productId, todo.field)}
        className="group flex items-center gap-3 rounded-lg px-2 py-2.5 no-underline transition hover:bg-stone-50"
      >
        <span className="w-12 shrink-0 text-base font-extrabold tabular-nums text-[#007700]">+{Math.round(todo.impact)}đ</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-stone-900">{cleanTodoText(todo.message)}</span>
          <span className="block text-xs tabular-nums text-stone-500">{nameOf(r)}: {metricText(r).toLowerCase()}</span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-0.5 text-sm font-semibold text-[#007700]">
          {review ? 'Xem đơn hàng' : 'Sửa'}
          <ChevronRight size={14} aria-hidden />
        </span>
      </Link>
    </li>
  );
}

function StatusRow({ r }: { r: HealthFactor }) {
  const off = r.scored === false;
  const done = !off && (r.sub_score ?? 0) >= 100;
  const Icon = off ? Clock : done ? CheckCircle2 : AlertCircle;
  const tone = off ? 'text-stone-400' : done ? 'text-[#007700]' : 'text-amber-600';
  return (
    <li className="flex items-center gap-2.5 py-2">
      <Icon size={16} className={`shrink-0 ${tone}`} aria-hidden />
      <span className="w-20 shrink-0 text-sm font-semibold text-stone-900">{nameOf(r)}</span>
      <span className="min-w-0 flex-1 truncate text-xs tabular-nums text-stone-500">{metricText(r)}</span>
      <span className="shrink-0 text-sm tabular-nums text-stone-500">
        {off ? 'Chưa tính' : <><b className="font-bold text-stone-900">{Math.round(r.points)}</b>/{r.weight}</>}
      </span>
    </li>
  );
}

const rank = (t: HealthItem) => (t.code === 'review' ? 0 : t.impact);

export function CriteriaTable({ data, productId, onExplain }: { data: ListingHealth; productId: string; onExplain: () => void }) {
  const rows = data.breakdown.map(r => ({ r, todo: partTodo(data, r.key) }));
  const todo = rows.filter((x): x is { r: HealthFactor; todo: HealthItem } => Boolean(x.todo)).sort((a, b) => rank(b.todo) - rank(a.todo));
  const rest = rows.filter(x => !x.todo).sort((a, b) => b.r.weight - a.r.weight);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <h2 className="m-0 text-base font-bold text-stone-900">Việc cần làm</h2>
        {todo.length === 0 ? (
          <p className="m-0 mt-2 text-sm text-stone-500">Không còn việc nào tăng thêm điểm.</p>
        ) : (
          <ul className="-mx-2 m-0 mt-1 list-none p-0">
            {todo.map(x => <TodoRow key={x.r.key} r={x.r} todo={x.todo} productId={productId} />)}
          </ul>
        )}
      </div>

      <div className="lg:col-span-2 lg:border-l lg:border-stone-100 lg:pl-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="m-0 text-base font-bold text-stone-900">Phần không cần sửa</h2>
          <button
            type="button"
            onClick={onExplain}
            className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-stone-500 transition-colors hover:text-[#007700]"
          >
            <HelpCircle size={13} aria-hidden />
            <span>Cách tính điểm</span>
          </button>
        </div>
        {rest.length === 0 ? (
          <p className="m-0 mt-2 text-sm text-stone-500">Phần nào cũng còn việc để làm.</p>
        ) : (
          <ul className="m-0 mt-1 list-none divide-y divide-stone-100 p-0">
            {rest.map(x => <StatusRow key={x.r.key} r={x.r} />)}
          </ul>
        )}
      </div>
    </div>
  );
}
