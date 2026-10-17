/**
 * F34 — Từ khoá nên thêm. Đọc GET /seller/analytics/tag-gap (tham số categoryId).
 *
 * Người bán mới cần biết "nên thêm từ khoá nào", không cần "lift" hay "tag đủ mạnh". Khi
 * chưa có tín hiệu thì nói bình tĩnh là chưa cần thêm, thay vì đặt khung cảnh báo lên đầu
 * trang. Bảng tag thiếu chỉ hiện khi có, và mờ đi khi chưa đủ chắc chắn.
 */

import { Check, Plus } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { count } from '../../../shared/utils/format';
import { InsightBlock } from '../components/InsightBlock';
import { InsightPage } from '../components/InsightPage';
import { SourceFooter } from '../components/SourceFooter';
import { ACTION_CLASS, Chip, DataTable, InsightCard, Note, SelectField, Takeaway } from '../components/ui';
import { decimal, pct } from '../format';
import { useInsight } from '../hooks/useInsight';
import { categoryLabel, tagLabel } from '../labels';
import type { TagGap } from '../types';

export function TagGapPage() {
  const [params, setParams] = useSearchParams();
  const categoryId = params.get('categoryId') || undefined;
  const { state, reload } = useInsight<TagGap>('/tag-gap', { categoryId });

  const setCategory = (value: string) => {
    const next = new URLSearchParams(params);
    next.set('categoryId', value);
    setParams(next, { replace: true });
  };

  return (
    <InsightPage title="Từ khoá nên thêm" question="Shop bán chạy cùng danh mục hay gắn từ khoá (tag) nào mà tôi chưa có?">
      <InsightBlock state={state} onRetry={reload}>
        {(data, meta) => {
          const trusted = data.signal.has_signal;
          const rows = [...data.missing_tags].sort((a, b) => b.lift - a.lift);
          const name = (id: string, fallback?: string) => tagLabel(data.tag_names?.[id] ?? fallback ?? null, id);
          const catName = categoryLabel(data.category_id, data.category_names?.[data.category_id]);
          const goi = rows[0];

          return (
            <div className="space-y-5">
              <Takeaway
                action={
                  trusted && goi
                    ? <Link to="/seller/products" className={ACTION_CLASS}>Thêm từ khoá cho sản phẩm</Link>
                    : <Link to="/seller/insights/benchmark" className={ACTION_CLASS}>Xem tôi mạnh, yếu ở đâu</Link>
                }
              >
                {trusted && goi ? (
                  <>
                    Nên cân nhắc thêm từ khoá <strong>{name(goi.tag_id, goi.name)}</strong>: {count(goi.used_by_competitors)} trên{' '}
                    {count(data.competitors_scanned)} sản phẩm bán chạy nhất trong {catName} đang dùng, nhiều gấp{' '}
                    {decimal(goi.lift)} lần cả danh mục.
                  </>
                ) : rows.length === 0 ? (
                  <>Từ khoá của bạn đã giống nhóm bán chạy trong <strong>{catName}</strong>. Chưa cần thêm từ khoá mới.</>
                ) : (
                  <>
                    Chưa đủ chắc chắn để khuyên thêm từ khoá nào trong <strong>{catName}</strong>. Các từ khoá bên dưới chỉ để
                    tham khảo.
                  </>
                )}
              </Takeaway>

              <InsightCard
                title="Từ khoá shop bán chạy hay dùng"
                description={`Lấy từ ${count(data.competitors_scanned)} sản phẩm bán chạy nhất của shop khác. Dấu ✓ là bạn đã có, dấu + là bạn chưa có.`}
                bodyClassName="px-5 py-4"
                action={
                  <SelectField
                    label="Danh mục"
                    value={data.category_id}
                    onChange={setCategory}
                    options={data.available_categories.map(id => ({ value: id, label: categoryLabel(id, data.category_names?.[id]) }))}
                  />
                }
                footer={<SourceFooter meta={meta} method={data.signal.note} limitation={data.note} />}
              >
                {(data.leader_tags ?? []).length === 0 ? (
                  <Note>Các sản phẩm bán chạy trong danh mục này chưa gắn từ khoá nào.</Note>
                ) : (
                  <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                    {(data.leader_tags ?? []).map(t => (
                      <li key={t.tag_id}>
                        <Chip
                          tone={t.mine ? 'good' : 'neutral'}
                          icon={t.mine ? <Check size={12} aria-hidden /> : <Plus size={12} aria-hidden />}
                        >
                          <span>{name(t.tag_id)}</span>
                          <span className="font-normal opacity-75">· {count(t.used_by)}/{count(data.competitors_scanned)}</span>
                          <span className="sr-only">{t.mine ? ', bạn đã có' : ', bạn chưa có'}</span>
                        </Chip>
                      </li>
                    ))}
                  </ul>
                )}
              </InsightCard>

              {rows.length > 0 && (
                <InsightCard
                  title={trusted ? 'Từ khoá nên cân nhắc thêm' : 'Từ khoá tham khảo (chưa đủ chắc chắn)'}
                  description="Từ khoá nhóm bán chạy dùng nhiều hơn hẳn phần còn lại của danh mục, mà shop bạn chưa có."
                  bodyClassName="px-5 py-4"
                >
                  <DataTable
                    caption={`Từ khoá của nhóm bán chạy trong ${catName} mà shop chưa dùng`}
                    head={
                      <>
                        <th scope="col">Từ khoá</th>
                        <th scope="col" className="text-right">Số sản phẩm bán chạy dùng</th>
                        <th scope="col" className="text-right">Nhóm bán chạy</th>
                        <th scope="col" className="text-right">Cả danh mục</th>
                        <th scope="col" className="text-right">Nhiều gấp</th>
                        <th scope="col" className="text-right">Lượt xem có thể tăng</th>
                      </>
                    }
                  >
                    {rows.map(tag => {
                      // Dữ liệu từng trả khoảng ngược (thấp > cao): sắp lại cho khỏi in khoảng vô nghĩa.
                      const low = Math.min(tag.estimated_traffic_gain.low_pct, tag.estimated_traffic_gain.high_pct);
                      const high = Math.max(tag.estimated_traffic_gain.low_pct, tag.estimated_traffic_gain.high_pct);
                      return (
                        <tr key={tag.tag_id} className={trusted ? undefined : 'text-stone-400'}>
                          <td className="font-semibold">{name(tag.tag_id, tag.name)}</td>
                          <td className="text-right tabular-nums">{count(tag.used_by_competitors)}</td>
                          <td className="text-right tabular-nums">{pct(tag.competitor_share_pct, 0)}</td>
                          <td className="text-right tabular-nums">{pct(tag.category_share_pct, 0)}</td>
                          <td className="text-right tabular-nums font-semibold">{decimal(tag.lift)} lần</td>
                          <td className="whitespace-nowrap text-right tabular-nums">{pct(low, 0)} đến {pct(high, 0)}</td>
                        </tr>
                      );
                    })}
                  </DataTable>
                  <div className="mt-4">
                    <Note>Đây chỉ là gợi ý: thêm từ khoá không đảm bảo bán thêm. "Lượt xem có thể tăng" là khoảng ước tính.</Note>
                  </div>
                </InsightCard>
              )}

              {data.my_tags.length > 0 && (
                <InsightCard title="Từ khoá shop bạn đang dùng" description="Trong danh mục đang xem.">
                  <div className="flex flex-wrap gap-1.5">
                    {data.my_tags.map(tag => (
                      <Chip key={tag} tone="neutral">{name(tag)}</Chip>
                    ))}
                  </div>
                </InsightCard>
              )}
            </div>
          );
        }}
      </InsightBlock>
    </InsightPage>
  );
}
