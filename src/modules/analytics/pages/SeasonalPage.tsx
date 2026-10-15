/**
 * F38 "Mùa vụ và lịch ra hàng" — trả lời: mùa cao điểm rơi vào lúc nào, và phải bắt đầu
 * làm hàng từ bao giờ?
 *
 * Đọc GET /seller/analytics/forecast/seasonal?keyword=&categoryId= (dữ liệu Google Trends
 * thật). Thứ người bán cần không phải ngày đỉnh mà là CỬA SỔ RA HÀNG: đã lùi sẵn 21 ngày
 * cho in và giao, nên bảng dưới đây lấy cửa sổ đó làm thông tin chính, đỉnh tìm kiếm chỉ
 * là số phụ. Bấm một mốc thì gọi lại endpoint theo từ khoá của mốc đó.
 */

import { useSearchParams } from 'react-router-dom';
import { CalendarDays, Check, Clock3 } from 'lucide-react';
import { InsightBlock } from '../components/InsightBlock';
import { InsightPage } from '../components/InsightPage';
import { SourceFooter } from '../components/SourceFooter';
import { Chip, InsightCard, KpiTile, Note, Skeleton, type Tone } from '../components/ui';
import { TrendChart } from '../../../shared/components/charts/TrendChart';
import { CHART_INK, SERIES } from '../../../shared/components/charts/chartTheme';
import { useInsight } from '../hooks/useInsight';
import { NA, decimal, fullDate } from '../format';
import { tagLabel } from '../labels';
import { count } from '../../../shared/utils/format';
import type { SeasonalEvent, SeasonalForecast } from '../types';

/** Số ngày từ hôm nay tới một mốc ISO. Âm là mốc đã qua. */
function daysFromToday(iso: string): number {
  const parts = iso.slice(0, 10).split('-').map(Number);
  if (parts.length !== 3 || parts.some(n => !Number.isFinite(n))) return NaN;
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((Date.UTC(parts[0], parts[1] - 1, parts[2]) - today) / 86400000);
}

function windowStatus(event: SeasonalEvent): { tone: Tone; text: string; order: number } {
  const toStart = daysFromToday(event.launch_window.start);
  const toEnd = daysFromToday(event.launch_window.end);
  if (!Number.isFinite(toStart) || !Number.isFinite(toEnd)) {
    return { tone: 'neutral', text: `Ngày bắt đầu: ${NA}`, order: 3 };
  }
  if (toEnd < 0) return { tone: 'neutral', text: `Cửa sổ đã đóng ${count(-toEnd)} ngày trước`, order: 2 };
  if (toStart <= 0) return { tone: 'good', text: `Đang trong cửa sổ, còn ${count(toEnd)} ngày để đăng`, order: 0 };
  return {
    tone: toStart <= 30 ? 'warn' : 'neutral',
    text: `Còn ${count(toStart)} ngày nữa mới tới ngày bắt đầu`,
    order: 1,
  };
}

const DECOMPOSITION_SERIES = [
  { key: 'trend', name: 'Xu hướng dài hạn', color: SERIES.green, meaning: 'mức nền của nhu cầu sau khi bỏ yếu tố mùa. Đường nhích lên nghĩa là nhu cầu chung đang tăng dần theo năm.' },
  { key: 'seasonal', name: 'Thành phần mùa vụ', color: SERIES.blue, meaning: 'phần lặp lại mỗi năm. Dương là tuần đó cao hơn mức nền, âm là thấp hơn mức nền.' },
  { key: 'residual', name: 'Phần dư', color: CHART_INK.axis, meaning: 'phần còn lại mà xu hướng và mùa vụ không giải thích được, thường là sự kiện bất ngờ trong tuần đó.' },
];

function EventItem({ event, active, onSelect }: { event: SeasonalEvent; active: boolean; onSelect: () => void }) {
  const status = windowStatus(event);
  const lw = event.launch_window;
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={active}
        className={`w-full cursor-pointer rounded-md border bg-white p-4 text-left transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700] motion-reduce:transition-none ${
          active ? 'border-[#007700] bg-[#EAF0E2]/40' : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
        }`}
      >
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-jakarta text-[15px] font-extrabold text-stone-900">{event.name}</span>
          {active && (
            <Chip tone="good" icon={<Check size={12} aria-hidden />}>đang xem phân rã</Chip>
          )}
        </span>

        <span className="mt-2.5 block rounded-md bg-stone-50 px-3 py-2.5">
          <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-stone-500">
            <CalendarDays size={13} aria-hidden /> Cửa sổ ra hàng
          </span>
          <span className="mt-0.5 block font-jakarta text-sm font-extrabold text-stone-900">
            Đăng hàng từ {fullDate(lw.start)} đến {fullDate(lw.end)}
          </span>
          <span className="mt-1.5 block">
            <Chip tone={status.tone} icon={<Clock3 size={12} aria-hidden />}>{status.text}</Chip>
          </span>
        </span>

        <span className="mt-2.5 grid grid-cols-1 gap-1.5 text-xs text-stone-600 sm:grid-cols-2">
          <span>
            Đỉnh tìm kiếm: tuần {count(event.peak_week_of_year)} trong năm, ngày {fullDate(lw.peak_date)}
          </span>
          <span>Biên độ mùa vụ: {decimal(event.amplitude, 0)}</span>
        </span>
        <span className="mt-1.5 block text-[11.5px] leading-relaxed text-stone-500">Cách tính cửa sổ: {lw.basis}</span>
      </button>
    </li>
  );
}

export function SeasonalPage() {
  const [params, setParams] = useSearchParams();
  const keywordParam = params.get('keyword') || undefined;
  const categoryId = params.get('categoryId') || undefined;
  const { state, reload } = useInsight<SeasonalForecast>('/forecast/seasonal', {
    keyword: keywordParam,
    categoryId,
  });

  const selectKeyword = (keyword: string) => {
    const next = new URLSearchParams(params);
    next.set('keyword', keyword);
    setParams(next);
  };

  return (
    <InsightPage
      title="Mùa vụ và lịch ra hàng"
      question="Mùa cao điểm của từ khoá rơi vào lúc nào, và phải bắt đầu làm hàng từ bao giờ để kịp?"
    >
      <InsightBlock
        state={state}
        onRetry={reload}
        skeleton={
          <div className="space-y-4">
            <Skeleton className="h-28 w-full rounded-md" />
            <Skeleton className="h-72 w-full rounded-md" />
            <Skeleton className="h-72 w-full rounded-md" />
          </div>
        }
      >
        {(data, meta) => {
          const active = keywordParam ?? data.keyword;
          const events = [...data.events].sort((a, b) => {
            const oa = windowStatus(a).order;
            const ob = windowStatus(b).order;
            if (oa !== ob) return oa - ob;
            return a.launch_window.start.localeCompare(b.launch_window.start);
          });

          const dec = data.decomposition;
          const len = Math.min(dec.trend.length, dec.seasonal.length, dec.residual.length);
          const rows = Array.from({ length: len }, (_, i) => ({
            label: `Tuần ${i + 1}`,
            trend: dec.trend[i],
            seasonal: dec.seasonal[i],
            residual: dec.residual[i],
          }));

          return (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiTile
                  label="Từ khoá đang phân tích"
                  value={data.keyword}
                  hint={
                    data.tag_ids.length > 0 ? (
                      <span className="flex flex-wrap gap-1.5">
                        {data.tag_ids.map(id => (
                          <Chip key={id} tone="neutral">{tagLabel(id, id)}</Chip>
                        ))}
                      </span>
                    ) : (
                      'Từ khoá này chưa gắn với tag nào trên sàn'
                    )
                  }
                />
                <KpiTile
                  label="Biên độ mùa vụ"
                  value={decimal(data.amplitude, 0)}
                  hint="chênh giữa tuần cao nhất và tuần thấp nhất trên chỉ số Trends, càng lớn thì mùa càng rõ"
                />
                <KpiTile label="Điểm dữ liệu đã dùng" value={count(data.n_points)} hint={dec.window} />
                <KpiTile
                  label="Số mốc mùa vụ"
                  value={count(data.events.length)}
                  hint="mỗi mốc là một từ khoá, bấm vào để xem phân rã của nó"
                />
              </div>

              <InsightCard
                title="Cửa sổ ra hàng theo từng mốc"
                description="Sắp xếp theo mốc gần nhất. Bấm một mốc để xem phân rã mùa vụ của từ khoá đó."
                footer={<SourceFooter meta={meta} limitation={data.limitation} method={data.method} />}
              >
                {events.length === 0 ? (
                  <Note>Chưa tìm được mốc mùa vụ nào cho từ khoá này. Nhu cầu có thể ổn định quanh năm.</Note>
                ) : (
                  <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 lg:grid-cols-2">
                    {events.map(event => (
                      <EventItem
                        key={`${event.name}-${event.launch_window.peak_week}`}
                        event={event}
                        active={event.name === active}
                        onSelect={() => selectKeyword(event.name)}
                      />
                    ))}
                  </ul>
                )}
              </InsightCard>

              <InsightCard
                title={`Phân rã nhu cầu của "${data.keyword}"`}
                description={`Ba thành phần của ${count(len)} tuần gần nhất, cùng một đơn vị là chỉ số Google Trends.`}
                footer={<SourceFooter meta={meta} limitation={data.limitation} method={data.method} />}
              >
                {rows.length === 0 ? (
                  <Note>Chưa có chuỗi phân rã cho từ khoá này.</Note>
                ) : (
                  <>
                    <TrendChart
                      data={rows}
                      series={DECOMPOSITION_SERIES.map(s => ({ key: s.key, name: s.name, color: s.color }))}
                      height={280}
                      formatValue={v => decimal(v, 0)}
                      ariaLabel={`Phân rã mùa vụ của từ khoá ${data.keyword} theo ${len} tuần gần nhất`}
                    />
                    <p className="mb-0 mt-2 text-xs text-stone-500">
                      Trục ngang là {count(len)} tuần gần nhất, tuần 1 là tuần xa nhất và tuần {count(len)} là tuần mới nhất.
                    </p>
                    <ul className="m-0 mt-3 list-none space-y-2 p-0">
                      {DECOMPOSITION_SERIES.map(s => (
                        <li key={s.key} className="flex items-start gap-2 text-xs leading-relaxed text-stone-600">
                          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: s.color }} aria-hidden />
                          <span>
                            <strong className="text-stone-800">{s.name}:</strong> {s.meaning}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mb-0 mt-3 text-xs leading-relaxed text-stone-500">
                      Chỉ số Google Trends là số tương đối 0 đến 100 trong cửa sổ đang xét, không phải số lượt tìm. Nó
                      đo NHU CẦU TÌM KIẾM, không đo doanh số, và đỉnh tìm kiếm thường đi trước đỉnh mua hàng.
                    </p>
                  </>
                )}
              </InsightCard>

              {data.flat_keywords.length > 0 && (
                <InsightCard
                  title="Từ khoá không có mùa rõ"
                  description="Nhu cầu của các từ khoá này ổn định quanh năm, nên không có cửa sổ ra hàng riêng."
                  footer={<SourceFooter meta={meta} limitation={data.limitation} method={data.method} />}
                >
                  <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                    {data.flat_keywords.map(kw => (
                      <li key={kw}>
                        <Chip tone="neutral">{kw}</Chip>
                      </li>
                    ))}
                  </ul>
                  <p className="mb-0 mt-3 text-xs leading-relaxed text-stone-500">
                    Với nhóm này bạn không phải chạy theo mùa: giữ hàng đều quanh năm là đủ.
                  </p>
                </InsightCard>
              )}
            </div>
          );
        }}
      </InsightBlock>
    </InsightPage>
  );
}
