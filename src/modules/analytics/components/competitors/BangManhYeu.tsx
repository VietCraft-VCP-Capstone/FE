/**
 * Biểu đồ hai bên "Bạn | Đối thủ": mỗi tiêu chí một hàng, thanh của bạn chạy sang trái, thanh trung bình đối thủ
 * chạy sang phải, số thật ghi ở đầu thanh. Chia hai phần Điểm mạnh / Điểm cần cải thiện, cộng phần ngang nhóm và giá.
 * Mỗi hàng một thang riêng (hai thanh so với nhau) vì các tiêu chí khác đơn vị.
 * Dùng chung cho phần Mạnh yếu (so 5 shop) và Ai đang bán chạy (so top 20).
 */

import { Link } from 'react-router-dom';
import { Minus, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';
import { SERIES } from '../../../../shared/components/charts/chartTheme';
import { Chip, Note } from '../ui';

export interface TieuChi {
  key: string;
  ten: string;
  mine: number | null;
  group: number | null;
  /** Giá trị tốt nhất phía đối thủ và tên shop có giá trị đó. */
  best: { v: number; shop: string | null } | null;
  /** Chiều tốt hơn; null = giá, chỉ nói đắt hay rẻ. */
  better: 'more' | 'less' | null;
  /** Lệch nhỏ hơn mức này (đơn vị thật) thì coi là ngang nhóm. */
  tol: number;
  fmt: (v: number) => string;
  fmtDiff: (v: number) => string;
  viec?: { label: string; to: string };
}

interface Muc {
  t: TieuChi;
  mine: number;
  group: number;
  chenh: string;
  tone: 'good' | 'warn' | 'neutral' | 'info';
  muc: number;
}

const MAU = { ban: SERIES.green, doiThu: SERIES.blue };

/** Cùng luật với soVoiDanDau: lệch ≥ tol là hơn, ≤ −tol là kém, còn lại ngang nhóm. */
export function chiaManhYeu(ds: TieuChi[]) {
  const manh: Muc[] = [];
  const yeu: Muc[] = [];
  const deBiet: Muc[] = [];
  const chuaCo: string[] = [];
  for (const t of ds) {
    if (t.mine === null || t.group === null) {
      chuaCo.push(t.ten.toLowerCase());
      continue;
    }
    const { mine, group } = t;
    if (t.better === null) {
      const lech = mine - group;
      deBiet.push({ t, mine, group, muc: 0, tone: 'info', chenh: Math.abs(lech) < t.tol ? 'Ngang nhóm' : `${lech > 0 ? 'Đắt' : 'Rẻ'} hơn ${t.fmtDiff(Math.abs(lech))}` });
      continue;
    }
    const d = t.better === 'more' ? mine - group : group - mine;
    if (Math.abs(d) < t.tol) {
      deBiet.push({ t, mine, group, muc: 0, tone: 'neutral', chenh: 'Ngang nhóm' });
      continue;
    }
    const chenh = t.better === 'less'
      ? `${d > 0 ? 'Nhanh' : 'Chậm'} hơn ${t.fmtDiff(Math.abs(d))}`
      : `${d > 0 ? 'Hơn' : 'Kém'} ${t.fmtDiff(Math.abs(d))}`;
    (d > 0 ? manh : yeu).push({ t, mine, group, chenh, tone: d > 0 ? 'good' : 'warn', muc: d / Math.max(Math.abs(group), 1e-9) });
  }
  manh.sort((a, b) => b.muc - a.muc);
  yeu.sort((a, b) => a.muc - b.muc);
  const ngang = deBiet.filter(m => m.t.better !== null).length;
  return { manh, yeu, deBiet, chuaCo, soDuoc: manh.length + yeu.length + ngang };
}

// Thanh dài nhất chiếm 75% nửa của nó, chừa chỗ cho số; hai bên cùng hệ số nên tỉ lệ giữ đúng.
const pct = (v: number, max: number) => `${v > 0 ? Math.max(2, (v / max) * 75) : 0}%`;

/** Một hàng: [số + thanh của bạn ←] [tên tiêu chí] [→ thanh + số của đối thủ]. Màn hẹp thì tên lên trên. */
function Hang({ m, coViec }: { m: Muc; coViec: boolean }) {
  const { t } = m;
  const max = Math.max(m.mine, m.group, 1e-9);
  return (
    <li className="grid grid-cols-2 items-center gap-x-0 gap-y-1.5 py-3 md:grid-cols-[minmax(0,1fr)_13rem_minmax(0,1fr)]">
      <div className="flex items-center justify-end gap-2 pr-2 md:pr-3">
        <span className="whitespace-nowrap text-[13px] font-bold tabular-nums text-stone-900">{t.fmt(m.mine)}</span>
        <span className="h-4 rounded-l-md" style={{ width: pct(m.mine, max), background: MAU.ban }} aria-hidden />
      </div>
      <div className="order-first col-span-2 text-center md:order-none md:col-span-1 md:px-2">
        <div className="text-[13px] font-semibold leading-snug text-stone-800">{t.ten}</div>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5">
          <Chip tone={m.tone}>{m.chenh}</Chip>
        </div>
        {(t.better === 'less' || (coViec && t.viec)) && (
          <div className="mt-1 text-[11px] leading-snug text-stone-500">
            {t.better === 'less' && 'Ngắn hơn là tốt hơn'}
            {coViec && t.viec && (
              <Link to={t.viec.to} className="ml-1 font-semibold text-[#007700] no-underline hover:text-[#005B00]">{t.viec.label} →</Link>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 pl-2 md:pl-3">
        <span className="h-4 rounded-r-md" style={{ width: pct(m.group, max), background: MAU.doiThu }} aria-hidden />
        <span className="whitespace-nowrap text-[13px] tabular-nums text-stone-700">{t.fmt(m.group)}</span>
      </div>
      {t.best && (
        <div className="col-span-2 text-center text-[11px] text-stone-500 md:col-span-3">
          Tốt nhất phía đối thủ: <span className="font-semibold text-stone-700">{t.fmt(t.best.v)}</span>{t.best.shop ? ` · ${t.best.shop}` : ''}
        </div>
      )}
    </li>
  );
}

function BieuDo({ ten, icon: Icon, tone, ds, rong, coViec = false }: {
  ten: string;
  icon: LucideIcon;
  tone: 'good' | 'warn' | 'neutral';
  ds: Muc[];
  rong: string;
  coViec?: boolean;
}) {
  const mauIcon = tone === 'good' ? 'text-[#007700]' : tone === 'warn' ? 'text-amber-700' : 'text-stone-500';
  return (
    <section aria-label={ten} className="min-w-0">
      <div className="mb-1 flex items-center gap-2">
        <Icon size={16} className={mauIcon} aria-hidden />
        <h3 className="m-0 text-[13px] font-bold text-stone-900">{ten}</h3>
        <Chip tone={tone}>{ds.length} tiêu chí</Chip>
      </div>
      {ds.length === 0 ? (
        <p className="m-0 py-3 text-xs text-stone-500">{rong}</p>
      ) : (
        <ul className="m-0 list-none divide-y divide-stone-100 p-0">
          {ds.map(m => <Hang key={m.t.key} m={m} coViec={coViec} />)}
        </ul>
      )}
    </section>
  );
}

export function BangManhYeu({ ds, tenNhom }: {
  ds: TieuChi[];
  /** Tên phía đối thủ, vd "Trung bình 5 shop dẫn đầu". */
  tenNhom: string;
}) {
  const { manh, yeu, deBiet, chuaCo, soDuoc } = chiaManhYeu(ds);
  const coGia = deBiet.some(m => m.t.better === null);
  return (
    <div className="space-y-5">
      {/* Đầu cột: bên trái là bạn, bên phải là đối thủ. */}
      <div className="grid grid-cols-2 rounded-md bg-stone-50 py-2 text-xs font-bold md:grid-cols-[minmax(0,1fr)_13rem_minmax(0,1fr)]">
        <span className="flex items-center justify-end gap-1.5 pr-3 text-stone-800">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: MAU.ban }} aria-hidden />Bạn
        </span>
        <span className="hidden text-center font-semibold text-stone-500 md:block">Tiêu chí</span>
        <span className="flex items-center gap-1.5 pl-3 text-stone-800">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: MAU.doiThu }} aria-hidden />{tenNhom}
        </span>
      </div>

      {/* Không tiêu chí nào so được thì không khen "không kém tiêu chí nào". */}
      {soDuoc === 0 ? (
        <Note tone="warn">Chưa đủ số liệu của bạn và đối thủ để chia điểm mạnh, điểm yếu.</Note>
      ) : (
        <>
          <BieuDo ten="Điểm mạnh của bạn" icon={TrendingUp} tone="good" ds={manh} rong="Chưa có tiêu chí nào bạn hơn hẳn đối thủ." />
          <BieuDo ten="Điểm cần cải thiện" icon={TrendingDown} tone="warn" ds={yeu} rong="Không có tiêu chí nào bạn kém hẳn đối thủ." coViec />
        </>
      )}
      {deBiet.length > 0 && (
        <BieuDo ten="Ngang nhóm và chỉ để biết" icon={Minus} tone="neutral" ds={deBiet} rong="" />
      )}
      <div className="space-y-1.5">
        {coGia && <Note>Giá cao hay thấp không tự nó là tốt hay xấu, nên giá chỉ ghi đắt hơn hay rẻ hơn.</Note>}
        {chuaCo.length > 0 && <Note tone="warn">Chưa so được vì thiếu số: {chuaCo.join(', ')}.</Note>}
      </div>
    </div>
  );
}
