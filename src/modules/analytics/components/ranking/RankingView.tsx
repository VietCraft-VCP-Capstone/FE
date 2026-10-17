import { useInsight } from '../../hooks/useInsight';
import type { ListingRanking, RankMetric } from '../../rankingTypes';
import { InsightBlock } from '../InsightBlock';
import { SourceFooter } from '../SourceFooter';
import { RankingHighlights } from './RankingHighlights';
import { RankingTable } from './RankingTable';
import { metricOf, ranked } from './rankingMetrics';

export function RankingView({ params, setParam }: { params: URLSearchParams; setParam: (key: string, value: string) => void }) {
  const metric = metricOf(params.get('metric') || '').key;
  const category = params.get('cat') || '';
  const ranking = useInsight<ListingRanking>('/listings/ranking');
  const setMetric = (m: RankMetric) => setParam('metric', m === 'units' ? '' : m);

  return (
    <InsightBlock state={ranking.state} onRetry={ranking.reload}>
      {(data, meta) => {
        const items = data.items.filter(i => !category || i.category === category);
        const rows = ranked(items, metric).map((item, i) => ({ ...item, rank: i + 1 }));
        return (
          <div className="space-y-3">
            <RankingHighlights items={items} active={metric} onPick={setMetric} />
            <RankingTable data={data} rows={rows} metric={metric} category={category} onMetric={setMetric} onCategory={c => setParam('cat', c)} />
            <SourceFooter meta={meta} />
          </div>
        );
      }}
    </InsightBlock>
  );
}
