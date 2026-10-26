import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { count, money } from '../../../shared/utils/format';
import { decimal, delta, fullDate } from '../format';
import type { AlertMetric, AnomalyAlert } from '../types';
import { Chip, DataTable, type Tone } from './ui';

/** Mức độ nặng nhẹ: luôn kèm chữ, màu chỉ là kênh phụ. */
const SEVERITY: Record<string, { label: string; tone: Tone }> = {
  high: { label: 'Nặng', tone: 'bad' },
  medium: { label: 'Vừa', tone: 'warn' },
  low: { label: 'Nhẹ', tone: 'neutral' },
};

const METRIC_LABEL: Record<AlertMetric, string> = { revenue: 'Doanh thu', views: 'Lượt xem' };

/** Bản gốc trả mã tiếng Anh; "ok" không cần chip. */
const LOW_HISTORY_HINT = 'Chuỗi còn ngắn nên mức "bình thường" chưa được xác định chắc chắn.';

function Contributors({ items }: { items: AnomalyAlert['top_listings'] }) {
  if (items.length === 0) return <span className="text-stone-400">—</span>;
  return (
    <ul className="m-0 list-none space-y-0.5 p-0 text-xs text-stone-600">
      {items.slice(0, 3).map(l => (
        <li key={l.listing_id} className="max-w-[220px] truncate" title={l.title}>
          {l.title} <span className="tabular-nums text-stone-500">({delta(l.change_pct, 0)})</span>
        </li>
      ))}
    </ul>
  );
}

function AlertRow({ alert: a }: { alert: AnomalyAlert }) {
  const sev = SEVERITY[a.severity] ?? { label: a.severity, tone: 'neutral' as Tone };
  const fmt = a.metric === 'revenue' ? money : count;
  const dropped = a.direction === 'drop';
  return (
    <tr>
      <td className="whitespace-nowrap font-semibold text-stone-800">{fullDate(a.date)}</td>
      <td className="whitespace-nowrap text-stone-700">{METRIC_LABEL[a.metric]}</td>
      <td>
        <span className={`inline-flex items-center gap-1 text-[13px] font-semibold ${dropped ? 'text-red-700' : 'text-[#005B00]'}`}>
          {dropped ? <ArrowDownRight size={15} aria-hidden /> : <ArrowUpRight size={15} aria-hidden />}
          {dropped ? 'Tụt xuống' : 'Vọt lên'}
        </span>
        <span className="ml-1.5 text-xs tabular-nums text-stone-500">{delta(a.change_pct, 1)}</span>
      </td>
      <td className="whitespace-nowrap text-right font-semibold tabular-nums text-stone-900">{fmt(a.actual)}</td>
      <td className="whitespace-nowrap text-right tabular-nums text-stone-600">{fmt(a.expected)}</td>
      <td className="text-right tabular-nums text-stone-700">
        {decimal(Math.abs(a.z))}
        <span className="ml-1 text-xs text-stone-400">lần</span>
      </td>
      <td>
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip tone={sev.tone}>{sev.label}</Chip>
          {a.rule === 'zero_run' && <Chip tone="bad">Nhiều ngày 0</Chip>}
          {a.calendar_sensitive && <Chip tone="warn">Trùng dịp lễ</Chip>}
          {a.confidence === 'low_history' && (
            <Chip tone="warn"><span title={LOW_HISTORY_HINT}>Lịch sử ngắn</span></Chip>
          )}
        </div>
      </td>
      <td><Contributors items={a.top_listings} /></td>
    </tr>
  );
}

export function AlertsTable({ alerts }: { alerts: AnomalyAlert[] }) {
  return (
    <DataTable
      caption="Những ngày doanh thu hoặc lượt xem lệch khỏi mức thường"
      head={
        <>
          <th scope="col">Ngày</th>
          <th scope="col">Chỉ số</th>
          <th scope="col">Chiều lệch</th>
          <th scope="col" className="text-right">Thực tế</th>
          <th scope="col" className="text-right">Mức thường</th>
          <th scope="col" className="text-right">|z|</th>
          <th scope="col">Mức độ</th>
          <th scope="col">Sản phẩm đóng góp</th>
        </>
      }
    >
      {alerts.map(alert => <AlertRow key={alert.id} alert={alert} />)}
    </DataTable>
  );
}
