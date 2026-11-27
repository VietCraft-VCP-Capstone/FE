import { Trophy, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useInsight } from '../../hooks/useInsight';
import type { ListingRanking, RankMetric } from '../../rankingTypes';
import { InsightBlock } from '../InsightBlock';
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
      {data => {
        const items = data.items.filter(i => !category || i.category === category);
        const rows = ranked(items, metric).map((item, i) => ({ ...item, rank: i + 1 }));
        return (
          <div className="space-y-4 animate-cascade">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-stone-100">
              <div>
                <div className="flex items-center gap-2">
                  <Trophy size={16} className="text-[#007700]" />
                  <h2 className="text-sm font-bold text-stone-900 m-0">Xếp hạng sản phẩm trong gian hàng</h2>
                </div>
                <p className="text-xs text-stone-500 m-0 mt-0.5">
                  Đánh giá các mặt hàng chủ lực trong shop bạn và đối chiếu thứ hạng với toàn bộ sản phẩm cùng ngành trên toàn sàn.
                </p>
              </div>
              <Link
                to="/seller/insights/competitors"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#007700] hover:underline shrink-0"
              >
                So sánh đối đầu từng đối thủ <ArrowRight size={12} />
              </Link>
            </div>

            <RankingHighlights items={items} active={metric} onPick={setMetric} />
            <RankingTable data={data} rows={rows} metric={metric} category={category} onCategory={c => setParam('cat', c)} />
          </div>
        );
      }}
    </InsightBlock>
  );
}
