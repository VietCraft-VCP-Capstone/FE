import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  DollarSign,
  HelpCircle,
  Pencil,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Lightbulb,
  MessageSquare,
} from 'lucide-react';
import { decimal, plainText, vnd } from '../../format';
import type { HealthItem, ListingHealth } from '../../healthTypes';
import { editLink } from '../HealthParts';
import { PriceRange } from './PriceRange';
import { WhyScore } from './WhyScore';
import { TODO_HINT } from './todoHints';
import { visibleTodos } from './visibleTodos';

type TabKey = 'todos' | 'passed' | 'pricing' | 'why';

function TodoItemRow({
  item,
  index,
  productId,
}: {
  item: HealthItem;
  index: number;
  productId: string;
}) {
  const [open, setOpen] = useState(index === 1);
  const hint = item.code ? TODO_HINT[item.code] : undefined;

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white transition-all duration-200 hover:border-stone-300 hover:shadow-2xs">
      {/* Header clickable row */}
      <div
        onClick={() => setOpen(!open)}
        className="flex cursor-pointer items-center justify-between gap-4 p-4 transition-colors hover:bg-stone-50/60"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-jakarta text-xs font-black text-[#007700]">
            {index}
          </span>
          <span className="truncate font-jakarta text-sm font-bold text-stone-900">
            {plainText(item.message)}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-jakarta text-xs font-extrabold text-[#007700] ring-1 ring-emerald-200/70">
            +{decimal(item.impact, 1)} điểm
          </span>
          <button type="button" className="text-stone-400 hover:text-stone-700">
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded body (DisputeFox layout: 2 columns details + Action button) */}
      {open && (
        <div className="border-t border-stone-100 bg-stone-50/40 p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2 space-y-3">
              {hint && (
                <div className="flex items-start gap-2.5 rounded-xl border border-stone-200/80 bg-white p-3.5 text-xs text-stone-600 leading-relaxed">
                  <Lightbulb size={15} className="mt-0.5 shrink-0 text-amber-500" />
                  <span>{hint}</span>
                </div>
              )}

              {item.code === 'review' && (
                <div className="flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50/70 p-3.5 text-xs text-sky-900 leading-relaxed">
                  <MessageSquare size={15} className="mt-0.5 shrink-0 text-sky-600" />
                  <span>
                    Gợi ý: Nhắn tin cảm ơn người mua sau khi đơn giao thành công, kèm lời mời đánh giá 5 sao.
                  </span>
                </div>
              )}

              <div className="rounded-xl border border-stone-200/80 bg-white p-3 text-xs">
                <span className="font-semibold text-stone-500">Mục tiêu khuyến nghị:</span>
                <p className="m-0 mt-0.5 font-medium text-stone-800">
                  {item.target ? String(item.target) : 'Hoàn thiện theo hướng dẫn chuẩn hoá listing của sàn'}
                </p>
              </div>
            </div>

            {/* Right Action column */}
            <div className="flex flex-col justify-between rounded-xl border border-stone-200/80 bg-white p-4 text-center">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                  Điểm cộng tối đa
                </span>
                <div className="mt-1 font-jakarta text-2xl font-black text-[#007700]">
                  +{decimal(item.impact, 1)} pts
                </div>
                <p className="m-0 mt-1 text-[11px] text-stone-500">
                  Cộng trực tiếp vào điểm tối ưu sau khi cập nhật
                </p>
              </div>

              {item.code !== 'review' && (
                <div className="mt-4">
                  <Link
                    to={editLink(productId, item.field)}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-stone-900 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-stone-800"
                  >
                    <Pencil size={12} className="text-emerald-400" />
                    <span>Sửa ngay</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function HealthDetailTabs({
  data,
  productId,
}: {
  data: ListingHealth;
  productId: string;
}) {
  const [tab, setTab] = useState<TabKey>('todos');
  const todos = visibleTodos(data);
  const urgent = data.warnings.filter(w => w.type === 'warning');
  const passed = data.breakdown.filter(row => row.sub_score >= 100);

  const priceRow = data.breakdown.find(r => r.key === 'price');
  const priceVal = priceRow?.value ?? null;
  const priceSug = priceRow?.suggestion;
  const priceRef = priceRow?.reference?.price ?? null;
  const over = priceVal !== null && priceRef ? Math.round((priceVal / priceRef - 1) * 100) : 0;

  return (
    <div className="rounded-3xl border border-stone-200/80 bg-white p-5 md:p-6 shadow-xs">
      {/* Modern Tab Bar matching DisputeFox inspiration */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-200/80 pb-4">
        {/* Tab 1: Todos */}
        <button
          type="button"
          onClick={() => setTab('todos')}
          className={`group flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all ${
            tab === 'todos'
              ? 'bg-rose-50 text-rose-800 ring-1 ring-rose-300'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[11px] font-black text-white">
            {urgent.length + todos.length}
          </span>
          <span>Việc cần làm</span>
        </button>

        {/* Tab 2: Passed */}
        <button
          type="button"
          onClick={() => setTab('passed')}
          className={`group flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all ${
            tab === 'passed'
              ? 'bg-emerald-50 text-[#007700] ring-1 ring-emerald-300'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#007700] text-[11px] font-black text-white">
            {passed.length}
          </span>
          <span>Đã đạt chuẩn</span>
        </button>

        {/* Tab 3: Pricing */}
        {priceRow && (
          <button
            type="button"
            onClick={() => setTab('pricing')}
            className={`group flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all ${
              tab === 'pricing'
                ? 'bg-amber-50 text-amber-800 ring-1 ring-amber-300'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <DollarSign size={14} className="text-amber-600" />
            <span>Định giá thị trường</span>
          </button>
        )}

        {/* Tab 4: Algorithm transparency */}
        <button
          type="button"
          onClick={() => setTab('why')}
          className={`group flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all ${
            tab === 'why'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <HelpCircle size={14} />
          <span>Giải thích điểm</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="mt-5">
        {/* Tab 1: Todos */}
        {tab === 'todos' && (
          <div className="space-y-3">
            {urgent.map(item => (
              <div
                key={item.message}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50/70 p-4"
              >
                <div className="flex items-center gap-2.5">
                  <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                  <span className="font-bold text-xs text-rose-900">{plainText(item.message)}</span>
                </div>
                {item.field && (
                  <Link
                    to={editLink(productId, item.field)}
                    className="rounded-full bg-rose-600 px-3.5 py-1 text-xs font-bold text-white hover:bg-rose-700 transition-colors"
                  >
                    Sửa ngay
                  </Link>
                )}
              </div>
            ))}

            {todos.length === 0 && urgent.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-200 p-8 text-center text-xs text-stone-500">
                Tuyệt vời! Không còn việc nào cần làm. Listing đã hoàn thiện các tiêu chuẩn khuyến nghị.
              </div>
            ) : (
              todos.map((item, i) => (
                <TodoItemRow
                  key={item.code ?? item.message}
                  item={item}
                  index={i + 1}
                  productId={productId}
                />
              ))
            )}
          </div>
        )}

        {/* Tab 2: Passed */}
        {tab === 'passed' && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {passed.map(row => (
              <div
                key={row.key}
                className="flex items-center justify-between rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-4 transition-colors hover:bg-emerald-50/60"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[#007700]">
                    <CheckCircle2 size={15} />
                  </div>
                  <div>
                    <span className="font-jakarta text-xs font-bold text-stone-900">{row.label}</span>
                    <span className="block text-[11px] text-stone-500">Đạt 100% điểm thành phần</span>
                  </div>
                </div>

                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-black text-[#007700]">
                  {row.weight}/{row.weight} pts
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Pricing */}
        {tab === 'pricing' && priceRow && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-200/80 bg-stone-50/60 p-5">
              <div>
                <span className="text-xs font-semibold text-stone-500">Giá bán hiện tại:</span>
                <div className="mt-1 font-jakarta text-3xl font-black text-stone-900">
                  {priceVal !== null ? vnd(priceVal) : 'Chưa có giá'}
                </div>
              </div>

              <div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    over > 0
                      ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-300'
                      : 'bg-emerald-100 text-[#007700] ring-1 ring-emerald-300'
                  }`}
                >
                  {over > 0 ? `Cao hơn mức giữa ${over}%` : 'Giá cạnh tranh tốt'}
                </span>
              </div>
            </div>

            {priceSug && (
              <div className="rounded-2xl border border-stone-200/80 bg-white p-5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500">Khoảng giá thị trường:</span>
                  <span className="font-bold text-stone-900 font-jakarta">
                    {vnd(priceSug.low)} – {vnd(priceSug.high)}
                  </span>
                </div>
                <PriceRange price={priceVal} low={priceSug.low} mid={priceRef} high={priceSug.high} />
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Algorithm explanation */}
        {tab === 'why' && <WhyScore data={data} />}
      </div>
    </div>
  );
}
