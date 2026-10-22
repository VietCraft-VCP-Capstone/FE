import { decimal } from '../../format';
import type { HealthFactor, ListingHealth } from '../../healthTypes';
import { healthTier, TIER_COLOR } from '../intel/intelLabels';
import { ScoreRing } from '../intel/ScoreRing';

const SOURCE_LABEL: Record<'category' | 'group' | 'tiki', string> = {
  category: 'cùng danh mục',
  group: 'cùng nhóm',
  tiki: 'giá Tiki cùng nhóm',
};

function FactorRow({ row }: { row: HealthFactor }) {
  const source = row.reference?.source;
  return (
    <tr className={row.missing ? 'text-stone-400' : 'text-stone-800'}>
      <th scope="row" className="py-2 pr-3 text-left font-medium">
        {row.label}
        {source && <span className="block text-xs font-normal text-stone-500">so với {SOURCE_LABEL[source]}</span>}
        {row.missing && <span className="block text-xs font-normal">thiếu dữ liệu, tính 0 điểm</span>}
      </th>
      <td className="py-2 text-right tabular-nums">{row.weight}%</td>
      <td className="py-2 text-right tabular-nums">{row.key === 'review' ? `${decimal(row.value, 0)} đánh giá` : `${decimal(row.value, 2)} / ${decimal(row.target, 2)}`}</td>
      <td className="py-2 text-right tabular-nums">{decimal(row.peer_median, 2)}</td>
      <td className="py-2 text-right font-semibold tabular-nums">{decimal(row.sub_score, 0)}</td>
      <td className="py-2 text-right font-semibold tabular-nums text-[#005B00]">+{decimal(row.points, 1)}</td>
    </tr>
  );
}

export function HealthScoreCard({ data }: { data: ListingHealth }) {
  const tier = healthTier(data.score);
  return (
    <section className="min-w-0 rounded-xl border border-stone-200 bg-white px-4 py-5 sm:px-6">
      <div className="flex flex-wrap items-center gap-5">
        <ScoreRing score={data.score} size={104} />
        <div>
          <p className="m-0 text-xs font-semibold text-stone-500">Điểm sức khoẻ</p>
          <p className="m-0 mt-0.5 text-lg font-bold" style={{ color: TIER_COLOR[tier.tone] }}>{tier.label}</p>
        </div>
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-[13px]">
          <thead>
            <tr className="text-xs text-stone-500">
              <th scope="col" className="pb-2 text-left font-medium">Yếu tố</th>
              <th scope="col" className="pb-2 text-right font-medium">Trọng số</th>
              <th scope="col" className="pb-2 text-right font-medium">Giá trị / mốc</th>
              <th scope="col" className="pb-2 text-right font-medium">Trung vị danh mục</th>
              <th scope="col" className="pb-2 text-right font-medium">Điểm con</th>
              <th scope="col" className="pb-2 text-right font-medium">+điểm</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {data.breakdown.map(row => <FactorRow key={row.key} row={row} />)}
          </tbody>
        </table>
      </div>
      <p className="m-0 mt-3 text-xs text-stone-500">Trọng số học từ Olist, kiểm chứng trên Tiki (AUC {decimal(data.basis.tiki_test_auc, 3)})</p>
    </section>
  );
}
