import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { analyticsApi } from '../../services/analyticsApi';
import type { HealthCheck, ListingHealth } from '../../healthTypes';
import { Chip } from '../ui';
import { HINT_CHIP, PILLAR_LABEL, PILLAR_ORDER, SEVERITY_CHIP, evidenceRows, imageRows } from './checkLabels';

const CARD = 'rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs sm:p-6';

const isShown = (c: HealthCheck) => c.mode !== 'shadow' && c.severity !== 'pass' && c.severity !== 'na';

function CheckRow({ c, productId, onDismiss }: { c: HealthCheck; productId: string; onDismiss: (id: string) => void }) {
  const chip = c.mode === 'hint' ? HINT_CHIP : SEVERITY_CHIP[c.severity];
  const rows = [...imageRows(c), ...evidenceRows(c.evidence)];
  const dismiss = () => {
    onDismiss(c.id);
    analyticsApi.recordHealthAction(productId, { recommendation_id: c.id, action: 'dismiss', kind: c.pillar }).catch(() => undefined);
  };
  return (
    <li className="flex items-start gap-3 rounded-xl border border-stone-100 p-3">
      <div className="min-w-0 flex-1">
        {chip && <Chip tone={chip.tone}>{chip.label}</Chip>}
        <p className="m-0 mt-1 text-sm leading-relaxed text-stone-800">{c.action}</p>
        {rows.length > 0 && (
          <p className="m-0 mt-1 flex flex-wrap gap-x-4 text-xs text-stone-600">
            {rows.map(r => <span key={r.label}>{r.label}: <b className="font-semibold text-stone-800">{r.value}</b></span>)}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
      >
        Không đúng
      </button>
    </li>
  );
}

export function ChecksCard({ data, productId }: { data: ListingHealth; productId: string }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const visible = (data.checks ?? []).filter(c => isShown(c) && !dismissed.has(c.id));
  if (visible.length === 0) return null;
  const onDismiss = (id: string) => setDismissed(prev => new Set(prev).add(id));
  return (
    <section className={CARD}>
      <h2 className="m-0 inline-flex items-center gap-2 text-base font-bold text-stone-900">
        <ShieldAlert size={18} className="text-[#007700]" aria-hidden />
        Kiểm tra sản phẩm
      </h2>
      <div className="mt-3 space-y-4">
        {PILLAR_ORDER.map(p => {
          const items = visible.filter(c => c.pillar === p);
          if (items.length === 0) return null;
          return (
            <div key={p}>
              <h3 className="m-0 text-sm font-semibold text-stone-700">{PILLAR_LABEL[p]}</h3>
              <ul className="m-0 mt-2 list-none space-y-2 p-0">
                {items.map(c => <CheckRow key={c.id} c={c} productId={productId} onDismiss={onDismiss} />)}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
