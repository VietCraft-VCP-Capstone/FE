import { Tabs } from 'antd';
import { useSearchParams } from 'react-router-dom';
import { SellerAntd } from '../../seller/components/SellerAntd';
import { HealthView } from '../components/health/HealthView';
import { needsWork } from '../components/health/healthStats';
import { InsightPage } from '../components/InsightPage';
import { RankingView } from '../components/ranking/RankingView';
import type { ListingHealthList } from '../healthTypes';
import { useInsight, type InsightState } from '../hooks/useInsight';

function summary(state: InsightState<ListingHealthList>): string {
  if (state.kind !== 'ready' || state.data.items.length === 0) return 'Xem sản phẩm nào đăng chưa tốt và nên sửa gì để dễ bán hơn.';
  const items = state.data.items;
  const scored = items.filter(i => i.score !== null);
  const toFix = items.filter(needsWork).length;
  if (toFix === 0) return 'Mọi sản phẩm đều ổn, chưa cần sửa gì.';
  if (scored.length === 0) return `${toFix} sản phẩm còn việc nên làm.`;
  const weak = scored.filter(i => i.status !== 'good').length;
  return weak > 0
    ? `Có ${weak} sản phẩm chưa đạt mức Tốt. Bắt đầu từ sản phẩm điểm thấp nhất ở đầu bảng.`
    : `Mọi sản phẩm đã đạt mức Tốt, ${toFix} sản phẩm vẫn có thể tăng thêm điểm.`;
}

const ABOUT = (
  <>
    <strong>Sức khoẻ sản phẩm giúp bạn biết sản phẩm nào đăng chưa tốt và nên sửa gì trước.</strong>
    <ul className="m-0 mt-1.5 list-disc space-y-1 pl-4">
      <li>Chấm mỗi sản phẩm 0–100 theo ảnh, mô tả, tag, tồn kho và độ cập nhật; khi có đủ dữ liệu sẽ tính thêm đánh giá và tỉ lệ người xem mua.</li>
      <li>Chỉ ra việc cụ thể kèm số điểm tăng thêm. Bấm nút bút chì là tới đúng ô cần sửa, nút con mắt để xem chi tiết.</li>
      <li>Lọc theo lỗi hoặc theo từng phần (ảnh, tồn kho, đánh giá…) để sửa hàng loạt cùng một kiểu.</li>
      <li>Tab Bảng xếp hạng: sản phẩm nào bán chạy, được xem, được thích nhiều; hạng so với cả sàn và gợi ý để có thêm khách.</li>
    </ul>
    <p className="m-0 mt-1.5">
      Sản phẩm đủ ảnh, mô tả rõ, còn hàng giúp người mua tin tưởng và dễ chốt đơn hơn. Điểm chỉ để bạn tự cải thiện,
      không ảnh hưởng thứ hạng tìm kiếm.
    </p>
  </>
);

export function ListingsPage() {
  const [params, setParams] = useSearchParams();
  const view = params.get('view') === 'ranking' ? 'ranking' : 'health';
  const health = useInsight<ListingHealthList>('/listings/health');

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };
  const setTags = (next: string[]) => {
    const p = new URLSearchParams(params);
    p.delete('tag');
    next.forEach(t => p.append('tag', t));
    setParams(p, { replace: true });
  };

  return (
    <SellerAntd>
      <InsightPage
        title="Sức khoẻ sản phẩm"
        info={ABOUT}
        question={view === 'ranking' ? 'Xếp hạng giữa các sản phẩm trong shop bạn và gợi ý để có thêm khách. Cột Hạng toàn sàn chỉ cho biết vị trí so với sản phẩm cùng danh mục của mọi shop.' : summary(health.state)}
      >
        <Tabs
          activeKey={view}
          onChange={key => setParams(key === 'ranking' ? new URLSearchParams({ view: 'ranking' }) : new URLSearchParams(), { replace: true })}
          items={[{ key: 'health', label: 'Sức khoẻ & việc cần sửa' }, { key: 'ranking', label: 'Bảng xếp hạng' }]}
          className="!-mb-1"
        />
        {view === 'ranking' ? (
          <RankingView params={params} setParam={setParam} />
        ) : (
          <HealthView
            health={health}
            params={params}
            setParam={setParam}
            setTags={setTags}
            clearFilters={() => setParams(new URLSearchParams(), { replace: true })}
          />
        )}
      </InsightPage>
    </SellerAntd>
  );
}
