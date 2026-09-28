/**
 * F36 — Theo dõi đối thủ. Trả lời: "Shop tôi đang theo dõi có ra hàng mới không?"
 *
 * Đọc GET /seller/analytics/competitor-tracking, ghi qua POST và DELETE cùng đường dẫn.
 * Đây là tính năng DUY NHẤT trong khu phân tích có ghi dữ liệu.
 *
 * Cột thời gian phát hiện KHÔNG phải lúc đối thủ đăng hàng, mà là lúc hệ thống chạy soát.
 * Dữ liệu hiện có không lưu mốc đăng listing đáng tin, nên nói rõ ngay cạnh bảng.
 */

import { useState } from 'react';
import { ArrowRight, Plus, Trash2, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';
import { count } from '../../../shared/utils/format';
import { timeAgo } from '../../../shared/utils/format';
import { InsightBlock } from '../components/InsightBlock';
import { InsightPage } from '../components/InsightPage';
import { SourceFooter } from '../components/SourceFooter';
import { Chip, DataTable, InsightCard, Note } from '../components/ui';
import { useInsight, invalidateInsights } from '../hooks/useInsight';
import { analyticsApi, analyticsErrorMessage } from '../services/analyticsApi';
import { tagLabel } from '../labels';
import type { CompetitorTracking } from '../types';

export function TrackingPage() {
  const { state, reload } = useInsight<CompetitorTracking>('/competitor-tracking');
  const [shopId, setShopId] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'good' | 'bad'; text: string } | null>(null);
  const [removing, setRemoving] = useState<{ id: string; name: string | null } | null>(null);

  const refresh = () => {
    invalidateInsights('/competitor-tracking');
    reload();
  };

  const add = async (event: React.FormEvent) => {
    event.preventDefault();
    const target = shopId.trim();
    if (!target) return;
    setBusy(true);
    setMessage(null);
    try {
      await analyticsApi.trackCompetitor(target);
      setShopId('');
      setMessage({ tone: 'good', text: `Đã thêm ${target} vào danh sách theo dõi.` });
      refresh();
    } catch (err) {
      setMessage({ tone: 'bad', text: analyticsErrorMessage(err, 'Không thêm được shop này.') });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!removing) return;
    setBusy(true);
    try {
      await analyticsApi.untrackCompetitor(removing.id);
      setMessage({ tone: 'good', text: `Đã bỏ theo dõi ${removing.name || removing.id}.` });
      refresh();
    } catch (err) {
      setMessage({ tone: 'bad', text: analyticsErrorMessage(err, 'Không bỏ theo dõi được.') });
    } finally {
      setBusy(false);
      setRemoving(null);
    }
  };

  return (
    <InsightPage title="Theo dõi đối thủ" question="Shop tôi đang theo dõi có ra hàng mới trong ngách của tôi không?">
      <InsightBlock state={state} onRetry={reload}>
        {(data, meta) => {
          const full = data.slots_used >= data.slots_limit;
          return (
            <div className="space-y-5">
              <InsightCard
                title={`Đang theo dõi ${count(data.slots_used)} trên ${count(data.slots_limit)} shop`}
                description="Nhập mã shop để thêm vào danh sách. Mã có dạng shp_00042."
              >
                <form onSubmit={add} className="flex flex-wrap items-end gap-2">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="ma-shop" className="text-xs font-semibold text-stone-600">Mã shop cần theo dõi</label>
                    <input
                      id="ma-shop"
                      value={shopId}
                      onChange={e => setShopId(e.target.value)}
                      placeholder="shp_00042"
                      disabled={full || busy}
                      className="h-9 w-48 rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-800 outline-none transition-colors duration-150 hover:border-stone-300 focus-visible:border-[#007700] focus-visible:ring-2 focus-visible:ring-[#007700]/20 disabled:bg-stone-50 disabled:text-stone-400 motion-reduce:transition-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={full || busy || !shopId.trim()}
                    className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl bg-[#007700] px-4 text-[13px] font-semibold text-white transition-colors duration-150 hover:bg-[#005B00] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700] active:translate-y-px disabled:cursor-not-allowed disabled:bg-stone-300 motion-reduce:transition-none"
                  >
                    <Plus size={15} aria-hidden />
                    {busy ? 'Đang xử lý' : 'Thêm vào danh sách'}
                  </button>
                </form>

                {full && (
                  <div className="mt-3">
                    <Note tone="warn">
                      Đã dùng hết {count(data.slots_limit)} chỗ. Bỏ theo dõi một shop trước khi thêm shop mới.
                    </Note>
                  </div>
                )}

                {message && (
                  <p aria-live="polite" className={`mb-0 mt-3 text-[13px] font-medium ${message.tone === 'good' ? 'text-[#005B00]' : 'text-red-700'}`}>
                    {message.text}
                  </p>
                )}
              </InsightCard>

              <InsightCard
                title="Shop đang theo dõi"
                bodyClassName="px-5 py-4"
                footer={<SourceFooter meta={meta} limitation={data.limitation} />}
              >
                {data.tracked.length === 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-500" aria-hidden>
                        <UserPlus size={18} />
                      </span>
                      <div>
                        <p className="m-0 text-sm font-bold text-stone-800">Chưa theo dõi shop nào</p>
                        <p className="mb-0 mt-1 text-xs leading-relaxed text-stone-500">
                          Mở trang đối thủ cùng danh mục để xem ai đang bán tốt trong ngách của bạn, rồi lấy mã shop ở đó về
                          thêm vào đây.
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/seller/insights/competitors"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-stone-700 no-underline transition-colors duration-150 hover:border-[#007700] hover:text-[#007700] motion-reduce:transition-none"
                    >
                      Xem đối thủ cùng danh mục
                      <ArrowRight size={15} aria-hidden />
                    </Link>
                  </div>
                ) : (
                  <DataTable
                    caption="Danh sách shop đang theo dõi"
                    head={
                      <>
                        <th scope="col">Shop</th>
                        <th scope="col">Mã</th>
                        <th scope="col">Thêm lúc</th>
                        <th scope="col" className="text-right">Số listing</th>
                        <th scope="col" className="text-right"><span className="sr-only">Bỏ theo dõi</span></th>
                      </>
                    }
                  >
                    {data.tracked.map(shop => (
                      <tr key={shop.shop_id}>
                        <td className="font-semibold text-stone-800">{shop.shop_name || 'Chưa có tên'}</td>
                        <td className="font-mono text-xs text-stone-500">{shop.shop_id}</td>
                        <td className="text-stone-600">{timeAgo(shop.added_at)}</td>
                        <td className="text-right tabular-nums text-stone-700">{count(shop.listings_total)}</td>
                        <td className="text-right">
                          <button
                            type="button"
                            onClick={() => setRemoving({ id: shop.shop_id, name: shop.shop_name })}
                            aria-label={`Bỏ theo dõi ${shop.shop_name || shop.shop_id}`}
                            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent text-stone-400 transition-colors duration-150 hover:bg-red-50 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500 motion-reduce:transition-none"
                          >
                            <Trash2 size={15} aria-hidden />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </DataTable>
                )}
              </InsightCard>

              <InsightCard
                title={data.alerts_total > 0 ? `${count(data.alerts_total)} sản phẩm mới trong ngách của bạn` : 'Sản phẩm mới trong ngách của bạn'}
                description="Chỉ báo những sản phẩm có tag trùng với ngách bạn đang bán."
                bodyClassName="px-5 py-4"
                footer={<SourceFooter meta={meta} limitation={data.limitation} />}
              >
                {data.alerts.length === 0 ? (
                  <Note>
                    {data.tracked.length === 0
                      ? 'Thêm shop vào danh sách theo dõi thì phần này sẽ báo khi họ ra hàng mới trùng ngách với bạn.'
                      : 'Chưa phát hiện sản phẩm mới nào trùng ngách của bạn từ các shop đang theo dõi.'}
                  </Note>
                ) : (
                  <DataTable
                    caption="Sản phẩm mới của shop đang theo dõi, trùng ngách với shop bạn"
                    head={
                      <>
                        <th scope="col">Sản phẩm</th>
                        <th scope="col">Shop</th>
                        <th scope="col">Tag trùng</th>
                        <th scope="col">Hệ thống soát lúc</th>
                      </>
                    }
                  >
                    {data.alerts.map(alert => (
                      <tr key={`${alert.shop_id}-${alert.listing_id}`}>
                        <td className="font-semibold text-stone-800">{alert.title || alert.listing_id}</td>
                        <td className="text-stone-600">{alert.shop_name || alert.shop_id}</td>
                        <td>
                          <div className="flex flex-wrap gap-1">
                            {alert.matched_tags.slice(0, 3).map(tag => (
                              <Chip key={tag} tone="info">{tagLabel(tag, tag)}</Chip>
                            ))}
                            {alert.matched_tags.length > 3 && (
                              <span className="text-xs text-stone-500">và {alert.matched_tags.length - 3} tag nữa</span>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap text-stone-500">{timeAgo(alert.detected_at)}</td>
                      </tr>
                    ))}
                  </DataTable>
                )}

                {data.limitation && (
                  <div className="mt-4">
                    <Note tone="warn">
                      Cột "hệ thống soát lúc" là thời điểm hệ thống chạy soát, KHÔNG phải lúc đối thủ đăng sản phẩm. Dữ liệu
                      hiện có chưa lưu mốc đăng listing đáng tin, nên đừng đọc cột này như thời điểm ra hàng.
                    </Note>
                  </div>
                )}
              </InsightCard>

              {data.my_niche_tags.length > 0 && (
                <InsightCard title="Ngách của bạn" description="Tập tag mà hệ thống dùng để lọc cảnh báo bên trên.">
                  <div className="flex flex-wrap gap-1.5">
                    {data.my_niche_tags.slice(0, 40).map(tag => (
                      <Chip key={tag} tone="neutral">{tagLabel(tag, tag)}</Chip>
                    ))}
                    {data.my_niche_tags.length > 40 && (
                      <span className="self-center text-xs text-stone-500">và {data.my_niche_tags.length - 40} tag nữa</span>
                    )}
                  </div>
                </InsightCard>
              )}
            </div>
          );
        }}
      </InsightBlock>

      <ConfirmModal
        isOpen={removing !== null}
        title="Bỏ theo dõi shop này?"
        message={`Cảnh báo tương lai về ${removing?.name || removing?.id || 'shop này'} sẽ dừng. Cảnh báo cũ vẫn được giữ lại.`}
        confirmLabel="Bỏ theo dõi"
        cancelLabel="Giữ lại"
        isLoading={busy}
        onConfirm={remove}
        onCancel={() => setRemoving(null)}
      />
    </InsightPage>
  );
}
