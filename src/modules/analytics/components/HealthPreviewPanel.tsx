import { useCountTo } from '../../../shared/hooks/useMotion';
/** F29 · Tính thử điểm: AI chấm lại với số dự định, không lưu gì. */

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Pencil, RotateCcw, Wand2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HEALTH_STATUS_LABEL, decimal } from '../format';
import { useInsightContext } from '../hooks/useInsightContext';
import { analyticsApi } from '../services/analyticsApi';
import type { HealthInputs, HealthPreview, PreviewInputs, PreviewLever } from '../healthTypes';
import type { HealthStatus, HealthTodo } from '../types';
import { editLink, healthTone } from './HealthParts';
import { FOCUS } from './health/healthStats';
import { LeverInput } from './health/LeverInput';
import { Chip, InfoTip, Note } from './ui';

/** Mốc khớp constants.py; có việc cần làm thì dùng mốc của việc đó. */
const LEVERS: { key: PreviewLever; field: string; label: string; unit: string; step: number; max: number; goal: number }[] = [
  { key: 'n_images', field: 'images', label: 'Số ảnh', unit: 'ảnh', step: 1, max: 50, goal: 5 },
  { key: 'description_length', field: 'description', label: 'Độ dài mô tả', unit: 'ký tự', step: 50, max: 20000, goal: 150 },
  { key: 'n_tags', field: 'tags', label: 'Số tag đã duyệt', unit: 'tag', step: 1, max: 50, goal: 3 },
  { key: 'in_stock_ratio_pct', field: 'stock_quantity', label: 'Phân loại còn hàng', unit: '%', step: 10, max: 100, goal: 100 },
];

const DEBOUNCE_MS = 400;

type PreviewState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ready'; data: HealthPreview }
  | { kind: 'message'; text: string };

function currentOf(inputs: HealthInputs): Record<PreviewLever, number | null> {
  return {
    n_images: inputs.n_images,
    description_length: inputs.description_length,
    n_tags: inputs.n_approved_tags,
    in_stock_ratio_pct: inputs.in_stock_ratio_pct,
  };
}

function errorText(err: any): string {
  const status: number | undefined = err?.response?.status;
  if (status === 400) return 'Giá trị chưa hợp lệ, kiểm tra lại các ô.';
  if (!status || status >= 502) return 'Dịch vụ phân tích không phản hồi, chưa tính thử được.';
  return 'Chưa tính thử được, vui lòng thử lại.';
}

export function HealthPreviewPanel({ productId, inputs, todos, score, status }: {
  productId: string;
  inputs: HealthInputs;
  todos: HealthTodo[];
  score: number | null;
  status: HealthStatus | null;
}) {
  const { context } = useInsightContext();
  const aiDown = context !== null && !context.ai_reachable;
  const current = useMemo(() => currentOf(inputs), [inputs]);
  const goals = useMemo(() => Object.fromEntries(LEVERS.map(l => {
    const todo = todos.find(t => t.field === l.field && typeof t.target === 'number');
    return [l.key, Math.max(l.goal, (todo?.target as number | undefined) ?? 0)];
  })) as Record<PreviewLever, number>, [todos]);

  const initial = () => Object.fromEntries(LEVERS.map(l => [l.key, current[l.key] ?? 0])) as Record<PreviewLever, number>;
  const [values, setValues] = useState(initial);
  const [dirty, setDirty] = useState<PreviewLever[]>([]);
  const [result, setResult] = useState<PreviewState>({ kind: 'idle' });

  // Chỉ gửi ô đã đổi, ô còn lại AI dùng giá trị thật.
  const payloadKey = JSON.stringify(Object.fromEntries(dirty.map(k => [k, values[k]])));

  useEffect(() => {
    const body = JSON.parse(payloadKey) as PreviewInputs;
    if (aiDown || Object.keys(body).length === 0) {
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
            setResult({ kind: 'message', text: res.meta?.reason || 'Chưa đủ dữ liệu để tính thử.' });
            return;
          }
          setResult({ kind: 'ready', data: res.data });
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

  const applies = (key: PreviewLever) => current[key] !== null;
  const setLever = (key: PreviewLever, raw: number, max: number) => {
    const value = Math.min(max, Math.max(0, Number.isFinite(raw) ? Math.round(raw) : 0));
    setValues(prev => ({ ...prev, [key]: value }));
    setDirty(prev => (prev.includes(key) ? prev : [...prev, key]));
  };
  const fillGoals = () => {
    const keys = LEVERS.filter(l => applies(l.key) && (current[l.key] ?? 0) < goals[l.key]).map(l => l.key);
    setValues(prev => ({ ...prev, ...Object.fromEntries(keys.map(k => [k, goals[k]])) }));
    setDirty(keys);
  };
  const reset = () => {
    setDirty([]);
    setValues(initial());
  };

  return (
    <section className="rounded-md border border-stone-200 bg-white">
      <header className="border-b border-stone-100 px-4 py-3">
        <h2 className="m-0 flex items-center gap-1.5 text-sm font-bold text-stone-900">
          Tính thử điểm
          <InfoTip
            text="Nhập con số bạn định sửa (số ảnh, độ dài mô tả, số tag, phân loại còn hàng) để xem điểm mới trước khi sửa thật. Chỉ để tính, không thay đổi sản phẩm."
            label="Tính thử điểm là gì?"
          />
        </h2>
        <p className="m-0 mt-0.5 text-xs text-stone-500">Đổi số dự định để xem điểm mới, không lưu vào sản phẩm.</p>
      </header>

      {aiDown ? (
        <div className="p-4"><Note tone="warn">Dịch vụ phân tích đang không phản hồi nên chưa tính thử được. Điểm hiện tại vẫn đúng.</Note></div>
      ) : (
        <div className="space-y-3 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {LEVERS.map(lever => (
              <LeverInput
                key={lever.key}
                label={lever.label}
                unit={lever.unit}
                current={current[lever.key]}
                goal={goals[lever.key]}
                value={values[lever.key]}
                step={lever.step}
                max={lever.max}
                onChange={v => setLever(lever.key, v, lever.max)}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <button type="button" onClick={fillGoals} className={`inline-flex cursor-pointer items-center gap-1 rounded border-none bg-transparent p-0 text-xs font-semibold text-[#007700] hover:underline ${FOCUS}`}>
              <Wand2 size={13} aria-hidden /> Điền đúng mốc nên có
            </button>
            {dirty.length > 0 && (
              <button type="button" onClick={reset} className={`inline-flex cursor-pointer items-center gap-1 rounded border-none bg-transparent p-0 text-xs font-semibold text-stone-600 hover:text-stone-900 ${FOCUS}`}>
                <RotateCcw size={13} aria-hidden /> Về giá trị hiện tại
              </button>
            )}
          </div>
          <div aria-live="polite">
            <PreviewResult state={result} score={score} status={status} />
          </div>
          <Link
            to={editLink(productId)}
            className={`inline-flex h-9 items-center gap-1.5 rounded-md bg-[#007700] px-3.5 text-sm font-semibold text-white no-underline transition-colors duration-150 hover:bg-[#005B00] motion-reduce:transition-none ${FOCUS}`}
          >
            <Pencil size={15} aria-hidden /> Sửa sản phẩm
          </Link>
        </div>
      )}
    </section>
  );
}

function ScoreBox({ label, score, status, strong }: { label: string; score: number | null; status: HealthStatus | null; strong?: boolean }) {
  const numberRef = useCountTo<HTMLSpanElement>(score, n => decimal(n, 1));
  return (
    <div className="min-w-0">
      <span className="block text-xs text-stone-500">{label}</span>
      <span ref={numberRef} className={`font-jakarta font-extrabold tabular-nums leading-tight text-stone-900 ${strong ? 'text-3xl' : 'text-2xl text-stone-600'}`}>{decimal(score, 1)}</span>
      {status && <Chip tone={healthTone(status)} className="ml-2 align-middle">{HEALTH_STATUS_LABEL[status] ?? status}</Chip>}
    </div>
  );
}

function PreviewResult({ state, score, status }: { state: PreviewState; score: number | null; status: HealthStatus | null }) {
  const preview = state.kind === 'ready' ? state.data : null;
  const delta = preview?.delta_vs_current ?? null;
  return (
    <div className="rounded-md border border-stone-200 bg-stone-50 px-3.5 py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <ScoreBox label="Điểm hiện tại" score={score} status={status} />
        <ArrowRight size={18} className="shrink-0 text-stone-400" aria-hidden />
        {preview ? (
          <>
            <ScoreBox label="Điểm dự kiến" score={preview.score} status={preview.status} strong />
            {delta !== null && (
              <span className={`text-lg font-bold tabular-nums ${delta > 0 ? 'text-[#005B00]' : delta < 0 ? 'text-red-700' : 'text-stone-600'}`}>
                ({delta > 0 ? '+' : ''}{decimal(delta, 1)})
              </span>
            )}
          </>
        ) : (
          <span className="text-[13px] text-stone-600">
            {state.kind === 'loading' ? 'Đang tính…' : state.kind === 'message' ? state.text : 'Đổi một ô ở trên để xem điểm dự kiến.'}
          </span>
        )}
      </div>
      {preview && preview.status && status && preview.status !== status && (
        <p className="m-0 mt-2 text-xs font-semibold text-stone-700">
          Mức điểm đổi từ “{HEALTH_STATUS_LABEL[status]}” sang “{HEALTH_STATUS_LABEL[preview.status]}”.
        </p>
      )}
    </div>
  );
}
