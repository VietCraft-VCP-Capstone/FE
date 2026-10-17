/**
 * F36 — Đối thủ đang theo dõi, bản phân tích chuyên sâu (khu Vận hành /seller/competitors là bản
 * thẻ shop, có nút sang đây; cùng một danh sách follow). Thứ tự theo việc người bán mới cần: tin
 * mới nhất (hàng mới của đối thủ) -> danh sách shop -> thêm shop -> bước tiếp theo.
 *
 * Hai chế độ, nhận ra bằng `meta.source.mode`:
 *   live       gian hàng thật. Danh sách là follow của sàn (dùng chung nút "Theo dõi" trên trang
 *              gian hàng); ngày ra hàng là ngày đăng thật.
 *   seed_demo  shop mẫu. Nhập mã `shp_*`; cột thời gian là lúc hệ thống soát, không phải lúc đăng.
 */

import { useMemo, useState } from 'react';
import { ArrowRight, Crosshair, Plus, Tags, Target, Trash2, UserPlus, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';
import { count, timeAgo } from '../../../shared/utils/format';
import { InsightBlock } from '../components/InsightBlock';
import { InsightPage } from '../components/InsightPage';
import { SourceFooter } from '../components/SourceFooter';
import { MiniStat } from '../components/charts/MiniViz';
import { ACTION_CLASS, Chip, DataTable, InsightCard, Note, Takeaway } from '../components/ui';
import { fullDate } from '../format';
import { useInsight, invalidateInsights } from '../hooks/useInsight';
import { analyticsApi, analyticsErrorMessage } from '../services/analyticsApi';
import { categoryLabel, tagLabel } from '../labels';
import type { CompetitorTracking, Competitors } from '../types';

const ROOT = '/seller/insights';

const FIELD_CLASS =
  'h-9 rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-800 outline-none transition-colors duration-150 hover:border-stone-300 focus-visible:border-[#007700] focus-visible:ring-2 focus-visible:ring-[#007700]/20 disabled:bg-stone-50 disabled:text-stone-400 motion-reduce:transition-none';

const LINK_CLASS = 'font-semibold text-[#007700] no-underline hover:text-[#005B00]';

const BUOC_TIEP: { to: string; icon: LucideIcon; title: string; say: string }[] = [
  { to: `${ROOT}/competitors`, icon: Users, title: 'Ai đang bán chạy', say: 'Tìm thêm shop bán chạy cùng danh mục để theo dõi.' },
  { to: `${ROOT}/benchmark`, icon: Crosshair, title: 'Tôi mạnh, yếu ở đâu', say: 'So shop bạn với 5 shop dẫn đầu theo từng tiêu chí.' },
  { to: `${ROOT}/pricing`, icon: Target, title: 'Giá tôi đắt hay rẻ', say: 'Xem giá từng sản phẩm so với thị trường.' },
  { to: `${ROOT}/tag-gap`, icon: Tags, title: 'Từ khoá nên thêm', say: 'Từ khoá shop bán chạy dùng mà bạn chưa có.' },
];

export function TrackingPage() {
  const { state, reload } = useInsight<CompetitorTracking>('/competitor-tracking');
  const live = state.kind === 'ready' && state.meta.source.mode === 'live';
  // Gian hàng thật chọn shop từ nhóm bán chạy cùng danh mục chính (F32) thay vì gõ mã.
  const rivals = useInsight<Competitors>(live ? '/competitors' : null);
  const [shopId, setShopId] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'good' | 'bad'; text: string } | null>(null);
  const [removing, setRemoving] = useState<{ id: string; name: string | null } | null>(null);

  const rivalOptions = useMemo(() => {
    if (rivals.state.kind !== 'ready' || state.kind !== 'ready') return [];
    const tracked = new Set(state.data.tracked.map(t => t.shop_id));
    const shops = new Map<string, string>();
    for (const row of rivals.state.data.competitors) {
      if (row.shop_id && !tracked.has(row.shop_id) && !shops.has(row.shop_id)) shops.set(row.shop_id, row.shop_name);
    }
    return [...shops].map(([value, label]) => ({ value, label }));
  }, [rivals.state, state]);

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
      const name = rivalOptions.find(o => o.value === target)?.label ?? target;
      setShopId('');
      setMessage({ tone: 'good', text: `Đã theo dõi ${name}.` });
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
    <InsightPage title="Đối thủ đang theo dõi" question="Đối thủ của tôi vừa ra hàng gì, và tôi nên xem gì tiếp?">
      <InsightBlock state={state} onRetry={reload}>
        {(data, meta) => {
          const full = data.slots_used >= data.slots_limit;
          const tagName = (tag: string) => tagLabel(data.tag_names?.[tag] ?? null, tag);
          const moiTheoShop = data.alerts.reduce<Record<string, number>>((m, a) => ({ ...m, [a.shop_id]: (m[a.shop_id] ?? 0) + 1 }), {});
          const latest = data.alerts[0];

          return (
            <div className="space-y-5">
              <Takeaway
                action={
                  data.tracked.length === 0 ? (
                    <Link to={`${ROOT}/competitors`} className={ACTION_CLASS}>Tìm shop bán chạy <ArrowRight size={15} aria-hidden /></Link>
                  ) : latest && live ? (
                    <Link to={`/seller/competitors/${latest.shop_id}`} className={ACTION_CLASS}>Xem shop {latest.shop_name}</Link>
                  ) : (
                    <Link to={`${ROOT}/benchmark`} className={ACTION_CLASS}>Xem tôi mạnh, yếu ở đâu</Link>
                  )
                }
              >
                {data.tracked.length === 0 ? (
                  <>Bạn chưa theo dõi đối thủ nào. Hãy theo dõi vài shop bán chạy để được báo khi họ ra hàng mới cùng nhóm hàng với bạn.</>
                ) : latest ? (
                  <>
                    {live ? 'Trong 7 ngày qua' : 'Gần đây'}, đối thủ ra <strong>{count(data.alerts_total)} sản phẩm mới</strong> cùng nhóm hàng
                    với bạn. Mới nhất: <strong>{latest.title || latest.listing_id}</strong> của {latest.shop_name || latest.shop_id}.
                  </>
                ) : (
                  <>{count(data.tracked.length)} shop bạn theo dõi chưa ra hàng mới cùng nhóm hàng với bạn trong 7 ngày qua.</>
                )}
              </Takeaway>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <InsightCard bodyClassName="px-5 py-4">
                  <MiniStat label="Đang theo dõi" value={`${count(data.slots_used)} / ${count(data.slots_limit)} shop`} hint={full ? 'Đã đủ chỗ. Bỏ bớt một shop để thêm shop mới.' : undefined} />
                </InsightCard>
                <InsightCard bodyClassName="px-5 py-4">
                  <MiniStat label="Hàng mới của đối thủ" value={`${count(data.alerts_total)} sản phẩm`} hint="Cùng nhóm hàng với bạn" />
                </InsightCard>
                {live && (
                  <InsightCard bodyClassName="px-5 py-4">
                    <MiniStat label="Shop bán chạy bạn chưa theo dõi" value={`${count(rivalOptions.length)} shop`} hint="Trong danh mục chính của bạn" />
                  </InsightCard>
                )}
              </div>

              <InsightCard
                title="Hàng mới của đối thủ"
                description={
                  live
                    ? `Sản phẩm các shop bạn theo dõi đăng trong 7 ngày gần nhất, cùng từ khoá hoặc danh mục với shop bạn.${data.alerts_computed_at ? ` Cập nhật ${timeAgo(data.alerts_computed_at)}.` : ''}`
                    : 'Sản phẩm có từ khoá trùng với nhóm hàng bạn đang bán.'
                }
                bodyClassName="px-5 py-4"
                footer={<SourceFooter meta={meta} limitation={data.limitation} />}
              >
                {data.alerts.length === 0 ? (
                  <Note>
                    {data.tracked.length === 0
                      ? 'Theo dõi một shop thì phần này sẽ báo khi họ ra hàng mới cùng nhóm hàng với bạn.'
                      : 'Chưa có sản phẩm mới nào cùng nhóm hàng với bạn từ các shop đang theo dõi.'}
                  </Note>
                ) : (
                  <DataTable
                    caption="Sản phẩm mới của shop đang theo dõi, cùng nhóm hàng với shop bạn"
                    head={
                      <>
                        <th scope="col">Sản phẩm</th>
                        <th scope="col">Shop</th>
                        <th scope="col">Vì sao báo cho bạn</th>
                        <th scope="col">{live ? 'Ngày đăng' : 'Hệ thống soát lúc'}</th>
                      </>
                    }
                  >
                    {data.alerts.map(alert => (
                      <tr key={`${alert.shop_id}-${alert.listing_id}`}>
                        <td className="font-semibold text-stone-800">{alert.title || alert.listing_id}</td>
                        <td className="text-stone-600">
                          {live ? (
                            <Link to={`/seller/competitors/${alert.shop_id}`} className="text-stone-700 no-underline hover:text-[#007700]">
                              {alert.shop_name || alert.shop_id}
                            </Link>
                          ) : (
                            alert.shop_name || alert.shop_id
                          )}
                        </td>
                        <td>
                          <div className="flex flex-wrap items-center gap-1">
                            {alert.matched_tags.length > 0 ? (
                              <>
                                <span className="text-xs text-stone-500">cùng từ khoá</span>
                                {alert.matched_tags.slice(0, 3).map(tag => (
                                  <Chip key={tag} tone="info">{tagName(tag)}</Chip>
                                ))}
                                {alert.matched_tags.length > 3 && (
                                  <span className="text-xs text-stone-500">và {alert.matched_tags.length - 3} từ khoá nữa</span>
                                )}
                              </>
                            ) : alert.matched_category ? (
                              <>
                                <span className="text-xs text-stone-500">cùng danh mục</span>
                                <Chip tone="info">{categoryLabel(alert.matched_category, alert.category_name)}</Chip>
                              </>
                            ) : null}
                          </div>
                        </td>
                        <td className="whitespace-nowrap text-stone-500">
                          {live ? `${fullDate(alert.listed_at)} · ${timeAgo(alert.listed_at)}` : timeAgo(alert.detected_at)}
                        </td>
                      </tr>
                    ))}
                  </DataTable>
                )}

                {!live && data.limitation && (
                  <div className="mt-4">
                    <Note tone="warn">
                      Cột "hệ thống soát lúc" là lúc hệ thống chạy soát, không phải lúc đối thủ đăng sản phẩm.
                    </Note>
                  </div>
                )}
                {data.my_niche_tags.length > 0 && (
                  <details className="mt-4 text-xs text-stone-500">
                    <summary className="cursor-pointer font-semibold text-stone-600">Hệ thống dựa vào từ khoá nào của shop bạn?</summary>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {data.my_niche_tags.slice(0, 40).map(tag => (
                        <Chip key={tag} tone="neutral">{tagName(tag)}</Chip>
                      ))}
                    </div>
                  </details>
                )}
              </InsightCard>

              <InsightCard
                title={`Shop đang theo dõi (${count(data.slots_used)}/${count(data.slots_limit)})`}
                description={live ? 'Bấm tên shop để xem hồ sơ, sản phẩm và khuyến mãi của họ.' : 'Nhập mã shop để thêm vào danh sách. Mã có dạng shp_00042.'}
                bodyClassName="px-5 py-4"
              >
                <form onSubmit={add} className="mb-4 flex flex-wrap items-end gap-2">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="ma-shop" className="text-xs font-semibold text-stone-600">
                      {live ? 'Thêm shop bán chạy cùng danh mục' : 'Mã shop cần theo dõi'}
                    </label>
                    {live ? (
                      <select
                        id="ma-shop"
                        value={shopId}
                        onChange={e => setShopId(e.target.value)}
                        disabled={full || busy || rivalOptions.length === 0}
                        className={`${FIELD_CLASS} w-64 cursor-pointer`}
                      >
                        <option value="">{rivalOptions.length > 0 ? 'Chọn một shop' : 'Bạn đã theo dõi hết shop bán chạy'}</option>
                        {rivalOptions.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id="ma-shop"
                        value={shopId}
                        onChange={e => setShopId(e.target.value)}
                        placeholder="shp_00042"
                        disabled={full || busy}
                        className={`${FIELD_CLASS} w-48`}
                      />
                    )}
                  </div>
                  <button type="submit" disabled={full || busy || !shopId.trim()} className={`${ACTION_CLASS} h-9`}>
                    <Plus size={15} aria-hidden />
                    {busy ? 'Đang xử lý' : 'Theo dõi'}
                  </button>
                  {live && (
                    <span className="self-center text-xs text-stone-500">
                      Hoặc mở <Link to={`${ROOT}/competitors`} className={LINK_CLASS}>Ai đang bán chạy</Link> để chọn ở danh mục khác.
                    </span>
                  )}
                </form>
                {message && (
                  <p aria-live="polite" className={`mb-3 mt-0 text-[13px] font-medium ${message.tone === 'good' ? 'text-[#005B00]' : 'text-red-700'}`}>
                    {message.text}
                  </p>
                )}

                {data.tracked.length === 0 ? (
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-500" aria-hidden>
                      <UserPlus size={18} />
                    </span>
                    <p className="m-0 text-xs leading-relaxed text-stone-500">
                      Chưa theo dõi shop nào. Chọn một shop ở ô bên trên, hoặc bấm "Theo dõi" trên trang gian hàng của họ.
                    </p>
                  </div>
                ) : (
                  <DataTable
                    caption="Danh sách shop đang theo dõi"
                    head={
                      <>
                        <th scope="col">Shop</th>
                        {!live && <th scope="col">Mã</th>}
                        {!live && <th scope="col">Thêm lúc</th>}
                        <th scope="col" className="text-right">Sản phẩm đang bán</th>
                        <th scope="col" className="text-right">Hàng mới cùng nhóm</th>
                        <th scope="col" className="text-right"><span className="sr-only">Bỏ theo dõi</span></th>
                      </>
                    }
                  >
                    {data.tracked.map(shop => (
                      <tr key={shop.shop_id}>
                        <td className="font-semibold text-stone-800">
                          {live ? (
                            <Link to={`/seller/competitors/${shop.shop_id}`} className="text-stone-800 no-underline hover:text-[#007700]">
                              {shop.shop_name || 'Chưa có tên'}
                            </Link>
                          ) : (
                            shop.shop_name || 'Chưa có tên'
                          )}
                        </td>
                        {!live && <td className="font-mono text-xs text-stone-500">{shop.shop_id}</td>}
                        {!live && <td className="text-stone-600">{timeAgo(shop.added_at)}</td>}
                        <td className="text-right tabular-nums text-stone-700">{count(shop.listings_total)}</td>
                        <td className="text-right tabular-nums text-stone-700">
                          {moiTheoShop[shop.shop_id] ? <Chip tone="info">{count(moiTheoShop[shop.shop_id])} mới</Chip> : <span className="text-stone-400">0</span>}
                        </td>
                        <td className="text-right">
                          <button
                            type="button"
                            onClick={() => setRemoving({ id: shop.shop_id, name: shop.shop_name })}
                            aria-label={`Bỏ theo dõi ${shop.shop_name || shop.shop_id}`}
                            title="Bỏ theo dõi"
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

              <section aria-labelledby="buoc-tiep" className="space-y-3">
                <h2 id="buoc-tiep" className="m-0 text-sm font-bold text-stone-900">Bước tiếp theo</h2>
                <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 lg:grid-cols-4">
                  {BUOC_TIEP.map(b => (
                    <li key={b.to}>
                      <Link
                        to={b.to}
                        className="flex h-full flex-col gap-1.5 rounded-2xl border border-stone-200 bg-white p-4 no-underline shadow-sm transition-colors duration-150 hover:border-[#007700] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700] motion-reduce:transition-none"
                      >
                        <span className="inline-flex items-center gap-2 text-[13px] font-bold text-stone-900">
                          <b.icon size={16} className="text-[#007700]" aria-hidden /> {b.title}
                        </span>
                        <span className="text-xs leading-relaxed text-stone-500">{b.say}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          );
        }}
      </InsightBlock>

      <ConfirmModal
        isOpen={removing !== null}
        title="Bỏ theo dõi shop này?"
        message={
          live
            ? `Bạn sẽ không còn thấy hàng mới của ${removing?.name || 'shop này'} ở đây nữa, và shop này cũng rời khỏi mục Đối thủ đang theo dõi ở khu Vận hành. Có thể theo dõi lại bất cứ lúc nào.`
            : `Cảnh báo tương lai về ${removing?.name || removing?.id || 'shop này'} sẽ dừng. Cảnh báo cũ vẫn được giữ lại.`
        }
        confirmLabel="Bỏ theo dõi"
        cancelLabel="Giữ lại"
        isLoading={busy}
        onConfirm={remove}
        onCancel={() => setRemoving(null)}
      />
    </InsightPage>
  );
}
