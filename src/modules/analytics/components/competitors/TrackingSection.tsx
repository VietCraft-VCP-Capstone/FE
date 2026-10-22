/**
 * F36 — phần Theo dõi đối thủ của trang Phân tích đối thủ; cùng danh sách follow với khu Vận hành /seller/competitors.
 *
 * Hai chế độ, nhận ra bằng `meta.source.mode`:
 *   live       gian hàng thật. Danh sách là follow của sàn (dùng chung nút "Theo dõi" trên trang
 *              gian hàng); ngày ra hàng là ngày đăng thật.
 *   seed_demo  shop mẫu. Nhập mã `shp_*`; cột thời gian là lúc hệ thống soát, không phải lúc đăng.
 */

import { useMemo, useState } from 'react';
import { Plus, Trash2, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ConfirmModal } from '../../../../shared/components/ConfirmModal';
import { count, timeAgo } from '../../../../shared/utils/format';
import { InsightBlock } from '../InsightBlock';
import { SourceFooter } from '../SourceFooter';
import { ACTION_CLASS, Chip, DataTable, InsightCard, Note, type Tone } from '../ui';
import { fullDate } from '../../format';
import { invalidateInsights, type InsightState } from '../../hooks/useInsight';
import { analyticsApi, analyticsErrorMessage } from '../../services/analyticsApi';
import { categoryLabel, tagLabel } from '../../labels';
import type { CompetitorTracking, Competitors, Threat } from '../../types';

export const MUC_DE_DOA: Record<Threat['level'], { label: string; tone: Tone }> = {
  high: { label: 'Đe doạ cao', tone: 'bad' },
  medium: { label: 'Đe doạ vừa', tone: 'warn' },
  low: { label: 'Đe doạ thấp', tone: 'neutral' },
};

export const thuongDau = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** Lý do AI chấm đe doạ, nói bằng lời. */
export function lyDoDeDoa(t: Threat): string {
  if (!t.matched_title) return 'Bạn chưa bán loại hàng này';
  const phan = [t.near_identical
    ? `Gần như cùng sản phẩm với "${t.matched_title}" của bạn (giống ${Math.round(t.similarity * 100)}%)`
    : `Giống ${Math.round(t.similarity * 100)}% "${t.matched_title}" của bạn`];
  if (t.price_gap_pct !== null && t.price_gap_pct > 0) phan.push(`rẻ hơn ${t.price_gap_pct}%`);
  return phan.join(', ');
}

const FIELD_CLASS =
  'h-9 rounded-md border border-stone-200 bg-white px-3 text-sm text-stone-800 outline-none transition-colors duration-150 hover:border-stone-300 focus-visible:border-[#007700] focus-visible:ring-2 focus-visible:ring-[#007700]/20 disabled:bg-stone-50 disabled:text-stone-400 motion-reduce:transition-none';

const LINK_CLASS = 'font-semibold text-[#007700] no-underline hover:text-[#005B00]';

export function TrackingSection({ state, reload, rivals }: {
  state: InsightState<CompetitorTracking>;
  reload: () => void;
  /** Bảng bán chạy đang mở trên trang: gian hàng thật chọn shop để theo dõi từ đây thay vì gõ mã. */
  rivals: Competitors | null;
}) {
  const live = state.kind === 'ready' && state.meta.source.mode === 'live';
  const [shopId, setShopId] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'good' | 'bad'; text: string } | null>(null);
  const [removing, setRemoving] = useState<{ id: string; name: string | null } | null>(null);

  const rivalOptions = useMemo(() => {
    if (!live || !rivals || state.kind !== 'ready') return [];
    const tracked = new Set(state.data.tracked.map(t => t.shop_id));
    const shops = new Map<string, string>();
    for (const row of rivals.competitors) {
      if (row.shop_id && !tracked.has(row.shop_id) && !shops.has(row.shop_id)) shops.set(row.shop_id, row.shop_name);
    }
    return [...shops].map(([value, label]) => ({ value, label }));
  }, [live, rivals, state]);

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
    <>
      <InsightBlock state={state} onRetry={reload}>
        {(data, meta) => {
          const full = data.slots_used >= data.slots_limit;
          const tagName = (tag: string) => tagLabel(data.tag_names?.[tag] ?? null, tag);
          const moiTheoShop = data.alerts.reduce<Record<string, number>>((m, a) => ({ ...m, [a.shop_id]: (m[a.shop_id] ?? 0) + 1 }), {});

          return (
            <div className="space-y-5">
              {(data.surging?.length ?? 0) > 0 && (
                <InsightCard
                  title="Đối thủ đang tăng tốc"
                  description="Shop bạn theo dõi có tuần vừa rồi bán vượt hẳn các tuần trước (AI so với nhịp bán 7 tuần trước đó)."
                  bodyClassName="px-4 py-3"
                >
                  <ul className="m-0 list-none space-y-2 p-0">
                    {data.surging!.map(s => (
                      <li key={s.shop_id} className="flex flex-wrap items-center gap-2 text-[13px]">
                        <Chip tone="warn">Tăng tốc</Chip>
                        <Link to={`/seller/competitors/${s.shop_id}`} className="font-semibold text-stone-800 no-underline hover:text-[#007700]">{s.shop_name || s.shop_id}</Link>
                        <span className="text-stone-600">
                          tuần vừa rồi bán {count(s.last_week)} sản phẩm, thường chỉ khoảng {count(Math.round(s.baseline))}/tuần{s.ratio ? ` (gấp ${s.ratio} lần)` : ''}.
                        </span>
                      </li>
                    ))}
                  </ul>
                </InsightCard>
              )}

              <InsightCard
                title="Hàng mới của đối thủ"
                description={
                  live
                    ? `Sản phẩm các shop bạn theo dõi đăng trong 7 ngày gần nhất, cùng từ khoá hoặc danh mục với shop bạn. AI xếp mức đe doạ cao lên đầu.${data.alerts_computed_at ? ` Cập nhật ${timeAgo(data.alerts_computed_at)}.` : ''}`
                    : 'Sản phẩm có từ khoá trùng với nhóm hàng bạn đang bán.'
                }
                bodyClassName="px-4 py-3"
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
                        {live && <th scope="col">Mức đe doạ</th>}
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
                        {live && (
                          <td>
                            {alert.threat && <Chip tone={MUC_DE_DOA[alert.threat.level].tone}>{MUC_DE_DOA[alert.threat.level].label} · {count(alert.threat.score)}</Chip>}
                          </td>
                        )}
                        <td>
                          {alert.threat && <span className="mb-1 block text-xs text-stone-700">{lyDoDeDoa(alert.threat)}</span>}
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
                            ) : alert.matched_type || alert.matched_category ? (
                              <>
                                <span className="text-xs text-stone-500">cùng loại hàng</span>
                                <Chip tone="info">
                                  {alert.matched_type
                                    ? categoryLabel(alert.matched_type, alert.type_name ?? null)
                                    : categoryLabel(alert.matched_category!, alert.category_name ?? null)}
                                </Chip>
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
                bodyClassName="px-4 py-3"
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
                      Hoặc đổi danh mục ở phần <a href="#ban-chay" className={LINK_CLASS}>Ai đang bán chạy</a> để chọn shop khác.
                    </span>
                  )}
                </form>
                {full && <p className="mb-3 mt-0 text-xs text-stone-500">Đã đủ chỗ. Bỏ bớt một shop để thêm shop mới.</p>}
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
    </>
  );
}
