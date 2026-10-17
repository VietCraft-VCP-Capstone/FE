/**
 * F39 "Ngách tiềm năng" — trả lời: ngách nào đang cầu cao mà cung còn thấp?
 *
 * Đọc GET /seller/analytics/forecast/niches?categoryId=.
 *
 * Hai thứ phải nói rõ ở trang này: gap_score ghép cầu THẬT (Google Trends) với cung đếm
 * trên dữ liệu mô phỏng, nên chỉ dùng để so tương đối giữa các ngách; và khi
 * banned_list_size bằng 0 thì bộ lọc từ khoá cấm chưa chặn được gì, người bán vẫn phải
 * tự kiểm bản quyền trước khi đăng.
 */

import { useState } from 'react';
import { Minus, ShieldAlert, ShieldCheck, TrendingDown, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { InsightBlock } from '../components/InsightBlock';
import { InsightPage } from '../components/InsightPage';
import { SourceFooter } from '../components/SourceFooter';
import { Chip, DataTable, InsightCard, KpiTile, Note, Skeleton, type Tone } from '../components/ui';
import { QuadrantScatter, Sparkline } from '../components/charts/MiniViz';
import { useInsight } from '../hooks/useInsight';
import { useSearchParams } from 'react-router-dom';
import { NA, decimal, delta, pct } from '../format';
import { count } from '../../../shared/utils/format';
import type { Niches } from '../types';

type Niche = Niches['niches'][number];

const TREND_META: Record<string, { label: string; icon: LucideIcon; tone: Tone }> = {
  rising: { label: 'đang tăng', icon: TrendingUp, tone: 'good' },
  up: { label: 'đang tăng', icon: TrendingUp, tone: 'good' },
  falling: { label: 'đang giảm', icon: TrendingDown, tone: 'bad' },
  down: { label: 'đang giảm', icon: TrendingDown, tone: 'bad' },
  flat: { label: 'đi ngang', icon: Minus, tone: 'neutral' },
};

const QUADRANT_META: Record<string, { label: string; tone: Tone }> = {
  opportunity: { label: 'Cơ hội', tone: 'good' },
  crowded: { label: 'Đông đúc', tone: 'warn' },
  niche_quiet: { label: 'Ngách nhỏ', tone: 'neutral' },
};

function TrendChip({ trend }: { trend: string }) {
  const meta = TREND_META[trend] ?? { label: trend, icon: Minus, tone: 'neutral' as Tone };
  const Icon = meta.icon;
  return (
    <Chip tone={meta.tone} icon={<Icon size={12} aria-hidden />}>{meta.label}</Chip>
  );
}

export function NichesPage() {
  const [params] = useSearchParams();
  const categoryId = params.get('categoryId') || undefined;
  const { state, reload } = useInsight<Niches>('/forecast/niches', { categoryId });
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <InsightPage
      title="Ngách tiềm năng"
      question="Ngách nào đang cầu cao mà cung còn thấp? Góc trên bên trái của biểu đồ là chỗ đáng vào trước."
    >
      <InsightBlock
        state={state}
        onRetry={reload}
        skeleton={
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-md" />
            <Skeleton className="h-96 w-full rounded-md" />
          </div>
        }
      >
        {(data, meta) => {
          const niches = data.niches;
          // Shop thật: phần CUNG có thể null (chưa đủ listing thật gắn tag để so — xem
          // meta.unlock). Không vẽ được một điểm mà trục hoành không có giá trị, nên bỏ
          // qua các ngách đó trên biểu đồ bốn góc; bảng bên dưới vẫn liệt kê đủ.
          const points = niches
            .filter((n): n is Niche & { supply_pct: number } => n.supply_pct !== null)
            .map(n => ({
              id: n.keyword,
              label: n.keyword,
              supply: n.supply_pct,
              demand: n.demand_pct,
              highlight: n.quadrant === 'opportunity',
            }));
          const supplyHiddenCount = niches.length - points.length;
          const opportunities = niches.filter(n => n.quadrant === 'opportunity').length;
          const active: Niche | undefined = niches.find(n => n.keyword === selected);
          const filterBlind = data.banned_list_size === 0;

          return (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiTile
                  label="Ngách đã quét"
                  value={count(data.total_niches)}
                  hint={`Đang hiện ${count(niches.length)} ngách có khoảng trống lớn nhất`}
                />
                <KpiTile
                  label="Ngách xếp vào Cơ hội"
                  value={count(opportunities)}
                  hint="cầu cao mà cung còn thấp trong nhóm đang hiện"
                />
                <KpiTile
                  label="Bị loại vì từ khoá cấm"
                  value={count(data.banned_filtered)}
                  hint={`Danh sách từ khoá cấm hiện có ${count(data.banned_list_size)} từ`}
                />
                <KpiTile
                  label="Khoảng trống lớn nhất"
                  value={niches[0] ? decimal(niches[0].gap_score, 1) : NA}
                  hint={niches[0] ? `ngách "${niches[0].keyword}"` : 'chưa có ngách nào'}
                />
              </div>

              {filterBlind ? (
                <InsightCard title="Bộ lọc từ khoá cấm chưa chặn được gì">
                  <div className="flex items-start gap-2">
                    <ShieldAlert size={16} className="mt-0.5 shrink-0 text-amber-700" aria-hidden />
                    <div className="min-w-0">
                      <Note tone="warn">
                        Danh sách từ khoá cấm đang rỗng, chưa có từ nào, nên con số "bị loại" bằng 0 không có nghĩa là
                        các ngách dưới đây đã được kiểm. Bản quyền nhân vật, thương hiệu và nội dung không phù hợp vẫn
                        phải do bạn tự kiểm trước khi đăng hàng.
                      </Note>
                    </div>
                  </div>
                </InsightCard>
              ) : (
                <InsightCard title="Bộ lọc từ khoá cấm">
                  <div className="flex items-start gap-2">
                    <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#005B00]" aria-hidden />
                    <Note>
                      Đã loại {count(data.banned_filtered)} ngách bằng danh sách {count(data.banned_list_size)} từ khoá
                      cấm. Bộ lọc này chỉ chặn theo từ khoá, bạn vẫn nên tự kiểm bản quyền của mẫu in.
                    </Note>
                  </div>
                </InsightCard>
              )}

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <InsightCard
                  title="Bốn góc cung và cầu"
                  description="Bấm một điểm để xem dòng tương ứng trong bảng, hoặc bấm từ khoá trong bảng để soi điểm."
                  footer={<SourceFooter meta={meta} limitation={data.limitation} />}
                >
                  {points.length === 0 ? (
                    <Note>
                      {supplyHiddenCount > 0
                        ? 'Chưa đủ listing thật gắn tag để vẽ phần cung — xem bảng bên dưới cho phần cầu.'
                        : 'Chưa có ngách nào để vẽ.'}
                    </Note>
                  ) : (
                    <>
                      {supplyHiddenCount > 0 && (
                        <Note tone="warn">
                          Ẩn {count(supplyHiddenCount)} ngách khỏi biểu đồ vì sàn thật chưa đủ listing gắn tag để tính
                          phần cung — vẫn liệt kê đủ trong bảng bên dưới.
                        </Note>
                      )}
                      <QuadrantScatter points={points} selectedId={selected} onSelect={id => setSelected(id)} />
                      <div className="mt-8 min-h-[52px] rounded-md bg-stone-50 px-3 py-2.5">
                        {active ? (
                          <p className="m-0 text-xs leading-relaxed text-stone-600">
                            <strong className="text-stone-800">{active.keyword}</strong>: cầu {pct(active.demand_pct)},
                            cung {pct(active.supply_pct)}, khoảng trống {decimal(active.gap_score, 1)}. Xếp loại{' '}
                            {(QUADRANT_META[active.quadrant]?.label ?? active.quadrant).toLowerCase()}, xu hướng{' '}
                            {(TREND_META[active.trend]?.label ?? active.trend)}.
                          </p>
                        ) : (
                          <p className="m-0 text-xs leading-relaxed text-stone-500">
                            Chưa chọn ngách nào. Mỗi điểm là một từ khoá: càng lên cao càng nhiều người tìm, càng sang
                            phải càng nhiều người đã bán.
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </InsightCard>

                <InsightCard title="Khoảng trống được tính thế nào" footer={<SourceFooter meta={meta} limitation={data.limitation} />}>
                  <ul className="m-0 list-none space-y-2.5 p-0 text-[13.5px] leading-relaxed text-stone-700">
                    <li>
                      <strong className="text-stone-800">Cầu:</strong> mức độ người ta tìm từ khoá đó, lấy từ Google
                      Trends Việt Nam. Đây là số thật.
                    </li>
                    <li>
                      <strong className="text-stone-800">Cung:</strong> số listing đang có cho từ khoá đó, đếm trên dữ
                      liệu mô phỏng của sàn.
                    </li>
                    <li>
                      <strong className="text-stone-800">Khoảng trống:</strong> cầu trừ cung. Số càng lớn thì càng nhiều
                      người tìm mà càng ít người bán.
                    </li>
                  </ul>
                  <div className="mt-3">
                    <Note tone="warn">
                      Vì phần cung đếm trên dữ liệu mô phỏng, hãy dùng khoảng trống để so tương đối giữa các ngách, đừng
                      đọc nó như số cạnh tranh thật của sàn.
                    </Note>
                  </div>
                  {data.limitation && (
                    <p className="mb-0 mt-3 text-xs leading-relaxed text-stone-500">{data.limitation}</p>
                  )}
                </InsightCard>
              </div>

              <InsightCard
                title={`Bảng ${count(niches.length)} ngách theo khoảng trống`}
                description="Xếp từ ngách còn nhiều chỗ nhất xuống dần."
                bodyClassName="px-4 py-3"
                footer={<SourceFooter meta={meta} limitation={data.limitation} />}
              >
                {niches.length === 0 ? (
                  <Note>Chưa có ngách nào đủ dữ liệu để xếp hạng.</Note>
                ) : (
                  <>
                    <DataTable
                      caption="Danh sách ngách theo mức chênh giữa cầu và cung"
                      head={
                        <>
                          <th scope="col">Hạng</th>
                          <th scope="col">Từ khoá</th>
                          <th scope="col" className="text-right">Cầu</th>
                          <th scope="col" className="text-right">Cung</th>
                          <th scope="col" className="text-right">Khoảng trống</th>
                          <th scope="col" className="text-right">Listing</th>
                          <th scope="col">Xu hướng</th>
                          <th scope="col" className="text-right">Biến động</th>
                          <th scope="col">7 kỳ gần nhất</th>
                          <th scope="col">Xếp loại</th>
                        </>
                      }
                    >
                      {niches.map(n => {
                        const quadrant = QUADRANT_META[n.quadrant] ?? { label: n.quadrant, tone: 'neutral' as Tone };
                        const isActive = selected === n.keyword;
                        return (
                          <tr key={n.keyword} className={isActive ? 'bg-[#EAF0E2]/50' : ''}>
                            <td className="tabular-nums text-stone-500">{n.rank}</td>
                            <td>
                              <button
                                type="button"
                                aria-pressed={isActive}
                                onClick={() => setSelected(isActive ? null : n.keyword)}
                                className="cursor-pointer rounded-lg border-none bg-transparent px-0 text-left text-[13px] font-semibold text-stone-800 underline decoration-stone-300 decoration-dotted underline-offset-2 transition-colors duration-150 hover:text-[#007700] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700] motion-reduce:transition-none"
                              >
                                {n.keyword}
                              </button>
                            </td>
                            <td className="text-right tabular-nums text-stone-700">{pct(n.demand_pct)}</td>
                            <td className="text-right tabular-nums text-stone-700">{pct(n.supply_pct)}</td>
                            <td className="text-right tabular-nums font-bold text-stone-900">{decimal(n.gap_score, 1)}</td>
                            <td className="text-right tabular-nums text-stone-700">
                              {n.supply_insufficient ? (
                                <span title="Sàn thật chưa đủ listing gắn tag này để đếm cung">{NA}</span>
                              ) : n.tag_id ? (
                                count(n.n_listings)
                              ) : (
                                <span title="Từ khoá chưa gắn với tag nào trên sàn nên chưa đếm được listing">{NA}</span>
                              )}
                            </td>
                            <td><TrendChip trend={n.trend} /></td>
                            <td className="text-right tabular-nums text-stone-700">{delta(n.growth_pct)}</td>
                            <td>
                              <Sparkline
                                values={n.sparkline_7d}
                                ariaLabel={`Nhu cầu 7 kỳ gần nhất của ${n.keyword}`}
                              />
                            </td>
                            <td><Chip tone={quadrant.tone}>{quadrant.label}</Chip></td>
                          </tr>
                        );
                      })}
                    </DataTable>
                    <p className="mb-0 mt-3 text-xs leading-relaxed text-stone-500">
                      Cột Listing để trống khi từ khoá chưa gắn với tag nào trên sàn: lúc đó chưa đếm được số hàng đang
                      bán, chứ không phải đếm ra không có cái nào.
                    </p>
                  </>
                )}
              </InsightCard>
            </div>
          );
        }}
      </InsightBlock>
    </InsightPage>
  );
}
