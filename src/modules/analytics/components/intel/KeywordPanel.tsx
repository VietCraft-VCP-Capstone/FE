import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { decimal } from '../../format';
import type { IntelKeyword, IntelMaterial } from '../../intelTypes';
import { Chip, DataTable, InsightCard, Note } from '../ui';
import { DIRECTION_LABEL, DIRECTION_TONE } from './intelLabels';

const ICON = { up: ArrowUpRight, flat: Minus, down: ArrowDownRight };

function Trend({ value }: { value: IntelKeyword['trend'] }) {
  if (!value) return <span className="text-stone-400">—</span>;
  const Icon = ICON[value];
  return <Chip tone={DIRECTION_TONE[value]} icon={<Icon size={12} aria-hidden />}>{DIRECTION_LABEL[value]}</Chip>;
}

function Lift({ value }: { value: number | null }) {
  if (value === null) return <span className="text-stone-400">—</span>;
  if (value < 0) return <span className="text-xs text-amber-800">ít gặp ở nhóm bán chạy</span>;
  return <span className="tabular-nums">{decimal(value, 2)}</span>;
}

function MaterialLine({ material }: { material: IntelMaterial }) {
  const found = material.declared.length ? material.declared : material.detected;
  if (found.length > 0) return <Note>Chất liệu: <strong>{found.join(', ')}</strong>{material.declared.length === 0 ? ' (nhận ra từ tiêu đề, bạn chưa khai ở ô chất liệu)' : ''}.</Note>;
  if (material.required || material.missing) return <Note tone="warn">Chưa nêu chất liệu. Nhóm sản phẩm này nên ghi rõ chất liệu trong ô chất liệu và tiêu đề.</Note>;
  return <Note>Chưa khai chất liệu, nhóm sản phẩm này không bắt buộc.</Note>;
}

export function KeywordPanel({ keywords, material }: { keywords: IntelKeyword[]; material: IntelMaterial }) {
  return (
    <InsightCard title="Từ khoá" info="Độ lift cho biết từ khoá đi cùng listing bán chạy của nhóm mạnh đến đâu. Số càng cao càng nên có trong tiêu đề. Từ khoá ít gặp ở nhóm bán chạy không giúp tăng điểm.">
      <div className="space-y-3">
        <MaterialLine material={material} />
        {keywords.length === 0 ? (
          <Note>Chưa tìm thấy từ khoá nổi bật trong tiêu đề.</Note>
        ) : (
          <DataTable
            caption="Từ khoá và độ lift"
            minWidth="min-w-[400px]"
            head={<><th scope="col">Từ khoá</th><th scope="col" className="text-right">Độ lift</th><th scope="col">Xu hướng</th></>}
          >
            {keywords.map(k => (
              <tr key={k.term}>
                <td className="font-medium text-stone-800">
                  {k.term}
                  {!k.in_title && <span className="mt-0.5 block text-[11px] font-normal text-amber-800">Chưa có trong tiêu đề</span>}
                </td>
                <td className="text-right"><Lift value={k.lift} /></td>
                <td><Trend value={k.trend} /></td>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
    </InsightCard>
  );
}
