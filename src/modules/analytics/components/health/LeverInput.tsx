import { useId } from 'react';
import { Minus, Plus } from 'lucide-react';
import { FOCUS } from './healthStats';

export function LeverInput({ label, unit, current, goal, value, step, max, onChange }: {
  label: string;
  unit: string;
  current: number | null;
  goal: number;
  value: number;
  step: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const id = useId();
  const disabled = current === null;
  const fmt = (n: number) => `${n.toLocaleString('vi-VN')}${unit === '%' ? '%' : ` ${unit}`}`;
  const btn = `inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-stone-300 bg-white text-stone-700 transition-colors duration-150 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`;
  const changed = !disabled && value !== current;

  return (
    <div className={disabled ? 'opacity-60' : ''}>
      <label htmlFor={id} className="block text-[13px] font-semibold text-stone-800">{label}</label>
      <span className="mb-1 block text-xs text-stone-500">
        {disabled ? 'Không áp cho sản phẩm này' : <>nên có {fmt(goal)}</>}
      </span>
      <div className="flex items-center gap-1.5">
        <button type="button" className={btn} disabled={disabled || value <= 0} onClick={() => onChange(value - step)} aria-label={`Giảm ${label.toLowerCase()}`}>
          <Minus size={14} aria-hidden />
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={0}
          max={max}
          value={value}
          disabled={disabled}
          onChange={e => onChange(Number(e.target.value))}
          className={`h-8 w-[72px] rounded-md border px-2 text-center text-sm tabular-nums text-stone-800 outline-none focus-visible:border-[#007700] focus-visible:ring-2 focus-visible:ring-[#007700]/20 disabled:bg-stone-50 ${changed ? 'border-[#007700] bg-[#F3F7EE]' : 'border-stone-300'}`}
        />
        <button type="button" className={btn} disabled={disabled || value >= max} onClick={() => onChange(value + step)} aria-label={`Tăng ${label.toLowerCase()}`}>
          <Plus size={14} aria-hidden />
        </button>
        <span className="whitespace-nowrap text-xs text-stone-500">{unit}</span>
      </div>
    </div>
  );
}
