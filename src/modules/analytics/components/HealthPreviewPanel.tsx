/**
 * F29 · "Xem điểm nếu sửa" (plan §4.3): seller chỉnh thử 4 chỉ số, AI chấm lại bằng
 * đúng engine và trả điểm dự kiến. Không lưu gì.
 */

import { useEffect, useMemo, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { HEALTH_STATUS_LABEL, decimal } from '../format';
import { useInsightContext } from '../hooks/useInsightContext';
import { analyticsApi } from '../services/analyticsApi';
import type { HealthPreview, PreviewInputs, PreviewLever } from '../healthTypes';
import type { HealthTodo } from '../types';
import { healthTone } from './HealthParts';
import { Chip, Note } from './ui';

const LEVERS: { key: PreviewLever; field: string; label: string; unit: string; step: number; max: number; fallback: number }[] = [
  { key: 'n_images', field: 'images', label: 'Số ảnh', unit: 'ảnh', step: 1, max: 50, fallback: 5 },
  { key: 'description_length', field: 'description', label: 'Độ dài mô tả', unit: 'ký tự', step: 50, max: 20000, fallback: 150 },
  { key: 'n_tags', field: 'tags', label: 'Số tag', unit: 'tag', step: 1, max: 50, fallback: 3 },
  { key: 'in_stock_ratio_pct', field: 'stock_quantity', label: 'Phân loại còn hàng', unit: '%', step: 10, max: 100, fallback: 100 },
];

const DEBOUNCE_MS = 400;

type PreviewState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ready'; data: HealthPreview }
  | { kind: 'message'; text: string };

function initialValues(todos: HealthTodo[], inventoryPct: number | null | undefined): Record<PreviewLever, number> {
  const out = {} as Record<PreviewLever, number>;
  for (const lever of LEVERS) {
    const todo = todos.find(t => t.field === lever.field && typeof t.current_value === 'number');
    // Không có todo nghĩa là chỉ số đã đạt mốc; trục tồn kho chính là % còn hàng.
    const fromAxis = lever.key === 'in_stock_ratio_pct' ? inventoryPct ?? null : null;
    out[lever.key] = (todo?.current_value as number | undefined) ?? fromAxis ?? lever.fallback;
  }
  return out;
}

function errorText(err: any): string {
  const status: number | undefined = err?.response?.status;
  if (status === 400) return 'Giá trị chưa hợp lệ, kiểm tra lại các ô.';
  if (!status || status >= 502) return 'Dịch vụ phân tích không phản hồi, chưa chấm thử được.';
  return 'Chưa chấm thử được, vui lòng thử lại.';
}

export function HealthPreviewPanel({ productId, todos, inventoryPct }: {
  productId: string;
  todos: HealthTodo[];
  inventoryPct: number | null | undefined;
}) {
  const { context } = useInsightContext();
  const aiDown = context !== null && !context.ai_reachable;
  const inventoryApplies = inventoryPct !== null && inventoryPct !== undefined;

  const [values, setValues] = useState(() => initialValues(todos, inventoryPct));
  const [dirty, setDirty] = useState<PreviewLever[]>([]);
  const [result, setResult] = useState<PreviewState>({ kind: 'idle' });

  // Chỉ gửi lever đã chỉnh để phần còn lại dùng giá trị thật phía AI.
  const payload = useMemo(() => {
    const body: PreviewInputs = {};
    for (const key of dirty) body[key] = values[key];
    return body;
  }, [dirty, values]);
  const payloadKey = JSON.stringify(payload);

  useEffect(() => {
    const body = JSON.parse(payloadKey) as PreviewInputs;
    const touched = Object.keys(body) as PreviewLever[];
    if (aiDown || touched.length === 0) {
      setResult({ kind: 'idle' });
      return;
    }
    const controller = new AbortController();
    setResult({ kind: 'loading' });
    const timer = window.setTimeout(() => {
      analyticsApi
        .healthPreview(productId, body, controller.signal)
        .then(res => {
          if (!res.data || res.meta?.status === 'insufficient_data') {
            setResult({ kind: 'message', text: res.meta?.reason || 'Chưa đủ dữ liệu để chấm thử.' });
            return;
          }
          const preview = res.data;
          setResult({ kind: 'ready', data: preview });
          // Ô chưa chỉnh lấy theo giá trị thật AI vừa đọc; không đổi payload nên không gọi lại.
          setValues(prev => {
            const next = { ...prev };
            for (const lever of LEVERS) {
              const real = preview.current_inputs?.[lever.key];
              if (!touched.includes(lever.key) && typeof real === 'number') next[lever.key] = real;
            }
            return next;
          });
        })
        .catch(err => {
          if (controller.signal.aborted || err?.code === 'ERR_CANCELED') return;
          setResult({ kind: 'message', text: errorText(err) });
        });
    }, DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [productId, payloadKey, aiDown]);

  const setLever = (key: PreviewLever, raw: number, max: number) => {
    const value = Math.min(max, Math.max(0, Number.isFinite(raw) ? Math.round(raw) : 0));
    setValues(prev => ({ ...prev, [key]: value }));
    setDirty(prev => (prev.includes(key) ? prev : [...prev, key]));
  };

  const reset = () => {
    setDirty([]);
    setValues(initialValues(todos, inventoryPct));
  };

  return (
    <div className="rounded-xl border border-stone-200 p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="m-0 text-[13px] font-bold text-stone-800">Xem điểm nếu sửa</p>
        {dirty.length > 0 && !aiDown && (
          <button type="button" onClick={reset} className="cursor-pointer border-none bg-transparent p-0 text-xs font-semibold text-stone-500 hover:text-stone-800">
            Đặt lại
          </button>
        )}
      </div>

      {aiDown ? (
        <Note tone="warn">Dịch vụ phân tích đang không phản hồi nên chưa chấm thử được. Điểm hiện tại phía trên vẫn đúng.</Note>
      ) : (
        <>
          <p className="m-0 mb-3 text-xs text-stone-500">Chỉnh thử các chỉ số dưới đây để xem điểm thay đổi ra sao. Không lưu gì vào sản phẩm.</p>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {LEVERS.map(lever => {
              const disabled = lever.key === 'in_stock_ratio_pct' && !inventoryApplies;
              return (
                <LeverInput
                  key={lever.key}
                  label={lever.label}
                  unit={lever.unit}
                  value={values[lever.key]}
                  step={lever.step}
                  max={lever.max}
                  disabled={disabled}
                  hint={disabled ? 'Chỉ áp cho hàng có sẵn' : undefined}
                  onChange={v => setLever(lever.key, v, lever.max)}
                />
              );
            })}
          </div>
          <div className="mt-3 min-h-[24px]" aria-live="polite">
            <PreviewResult state={result} />
          </div>
        </>
      )}
    </div>
  );
}

function PreviewResult({ state }: { state: PreviewState }) {
  if (state.kind === 'idle') return <Note>Đổi một ô để xem điểm dự kiến.</Note>;
  if (state.kind === 'loading') return <Note>Đang chấm thử…</Note>;
  if (state.kind === 'message') return <Note tone="warn">{state.text}</Note>;

  const { score, status, delta_vs_current: delta } = state.data;
  const sign = delta !== null && delta > 0 ? '+' : '';
  return (
    <div className="flex flex-wrap items-center gap-2 text-[13px] text-stone-800">
      <span>
        Điểm dự kiến: <strong className="tabular-nums">{decimal(score, 1)}</strong>
        {delta !== null && <span className="tabular-nums text-stone-500"> ({sign}{decimal(delta, 1)})</span>}
      </span>
      {status && <Chip tone={healthTone(status)}>{HEALTH_STATUS_LABEL[status] ?? status}</Chip>}
    </div>
  );
}

function LeverInput({ label, unit, value, step, max, disabled, hint, onChange }: {
  label: string;
  unit: string;
  value: number;
  step: number;
  max: number;
  disabled?: boolean;
  hint?: string;
  onChange: (value: number) => void;
}) {
  const btn =
    'inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 transition-colors duration-150 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40';
  return (
    <div className={disabled ? 'opacity-60' : ''}>
      <span className="mb-1 block text-xs font-semibold text-stone-600">{label}</span>
      <div className="flex items-center gap-1.5">
        <button type="button" className={btn} disabled={disabled || value <= 0} onClick={() => onChange(value - step)} aria-label={`Giảm ${label.toLowerCase()}`}>
          <Minus size={14} aria-hidden />
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={max}
          value={value}
          disabled={disabled}
          aria-label={`${label} (${unit})`}
          onChange={e => onChange(Number(e.target.value))}
          className="h-8 w-20 rounded-lg border border-stone-200 px-2 text-center text-sm tabular-nums text-stone-800 outline-none focus-visible:border-[#007700] focus-visible:ring-2 focus-visible:ring-[#007700]/20 disabled:bg-stone-50"
        />
        <button type="button" className={btn} disabled={disabled || value >= max} onClick={() => onChange(value + step)} aria-label={`Tăng ${label.toLowerCase()}`}>
          <Plus size={14} aria-hidden />
        </button>
        <span className="text-xs text-stone-500">{hint ?? unit}</span>
      </div>
    </div>
  );
}
