import { useState, useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Modal, Tabs, Tooltip } from 'antd';
import {
  ArrowLeft,
  Calendar,
  Sparkles,
  Layers,
  TrendingUp,
  Users,
  Package,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Info,
  Eye,
} from 'lucide-react';
import { InsightBlock } from '../components/InsightBlock';
import { InsightPage } from '../components/InsightPage';
import { HealthTheme } from '../components/health/HealthTheme';
import { HealthGauge } from '../components/health/HealthGauge';
import { FactorGrid } from '../components/health/FactorGrid';
import { FactorBreakdownCard } from '../components/health/FactorBreakdownCard';
import { PriceAdvice } from '../components/health/PriceAdvice';
import { WhyScore } from '../components/health/WhyScore';
import { PartTabs } from '../components/intel/PartTabs';
import { SeasonPanel } from '../components/intel/SeasonPanel';
import { ListingTraffic } from '../components/ListingTraffic';
import { SourceFooter } from '../components/SourceFooter';
import { visibleTodos } from '../components/health/visibleTodos';
import { editLink } from '../components/HealthParts';
import { useInsight } from '../hooks/useInsight';
import { INSIGHTS_ROOT } from '../nav';
import { plainText } from '../format';
import type { ListingHealth } from '../healthTypes';
import type { ListingIntel } from '../intelTypes';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const QUESTION = 'Chấm điểm chất lượng tin đăng và gợi ý những việc cần làm để tăng đơn hàng.';
const MAX_DAYS = 730;
const shiftDays = (days: number) =>
  new Date(Date.now() + days * 86_400_000).toLocaleDateString('sv-SE', {
    timeZone: 'Asia/Ho_Chi_Minh',
  });

function PriorityActions({
  data,
  productId,
}: {
  data: ListingHealth;
  productId: string;
}) {
  const todos = visibleTodos(data);
  const urgent = data.warnings.filter(w => w.type === 'warning');
  const actionable = todos.filter(t => t.field !== null && t.code !== 'review');
  const reviewTodo = todos.find(t => t.code === 'review');
  const totalImpact = Math.round(todos.reduce((sum, item) => sum + item.impact, 0));

  return (
    <div className="flex h-full flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Việc nên làm theo thứ tự ưu tiên
            </span>
            <Tooltip title="Các gợi ý được sắp xếp theo mức điểm tăng nhiều nhất khi bạn sửa.">
              <Info size={11} className="text-stone-300 hover:text-stone-600 cursor-help" />
            </Tooltip>
          </div>
          {totalImpact > 0 && (
            <Tooltip title="Tổng số điểm bạn có thể nhận thêm sau khi hoàn thành tất cả các mục này">
              <span className="cursor-help rounded bg-[#EAF0E2] px-2 py-0.5 font-mono text-[11px] font-bold text-[#007700] border border-[#BECAB6]">
                +{totalImpact} điểm tiềm năng
              </span>
            </Tooltip>
          )}
        </div>

        {/* Urgent warnings */}
        {urgent.length > 0 && (
          <div className="mt-3 space-y-2">
            {urgent.map(item => (
              <div
                key={item.message}
                className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-rose-200 bg-rose-50 text-xs text-[#BA1A1A]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <AlertCircle size={14} className="shrink-0 text-[#BA1A1A]" />
                  <span className="font-semibold truncate">{plainText(item.message)}</span>
                </div>
                {item.field && (
                  <Link
                    to={editLink(productId, item.field)}
                    className="shrink-0 px-2 py-0.5 rounded bg-white text-[11px] font-bold text-[#BA1A1A] border border-rose-200 hover:bg-rose-50 no-underline"
                  >
                    Sửa ngay
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Action items */}
        {actionable.length === 0 ? (
          <div className="py-6 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#EAF0E2] text-[#007700] mb-2">
              <CheckCircle2 size={20} />
            </div>
            <p className="text-xs font-bold text-stone-800 m-0">Tuyệt vời! Tin đăng đã đạt chuẩn tối ưu</p>
            <p className="text-[11px] text-stone-500 m-0 mt-1 max-w-xs mx-auto">
              Không còn việc nào cần sửa gấp. Hãy duy trì cập nhật giá và tồn kho định kỳ.
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-2.5">
            {actionable.slice(0, 3).map((item, idx) => {
              const label = item.code === 'tags'
                ? item.message.replace('tag', 'thẻ từ khoá (tag)')
                : plainText(item.message);

              return (
                <div
                  key={item.code ?? item.message}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-stone-200 bg-white hover:border-[#BECAB6] transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-stone-100 font-mono text-[10px] font-bold text-stone-600">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-stone-800 truncate block">
                        {label}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Tooltip title="Số điểm bạn sẽ nhận thêm ngay sau khi hoàn thành mục này">
                      <span className="cursor-help font-mono text-[11px] font-bold text-[#007700] bg-[#EAF0E2] px-1.5 py-0.5 rounded border border-[#BECAB6]">
                        +{Math.round(item.impact)}đ
                      </span>
                    </Tooltip>

                    <Link
                      to={editLink(productId, item.field)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-[#007700] text-white hover:bg-[#005B00] transition-colors no-underline shadow-2xs"
                    >
                      <Pencil size={11} />
                      <span>Sửa ngay</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Gentle Tip for Review / New Products */}
        {reviewTodo && (
          <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-stone-200/90 bg-[#FBFBFA] p-2.5 text-xs text-stone-600">
            <Sparkles size={14} className="shrink-0 mt-0.5 text-[#007700]" />
            <div className="min-w-0">
              <span className="font-semibold text-stone-800">Mẹo cho sản phẩm mới:</span>{' '}
              <span className="text-stone-600 leading-relaxed">
                Khi có đơn hàng đầu tiên, hãy đính kèm thiệp cảm ơn viết tay để mời khách để lại đánh giá 5★ nhé (giúp cộng thêm tới +{Math.round(reviewTodo.impact)} điểm).
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
        <span>💡 Sau khi cập nhật thông tin và lưu sản phẩm, điểm số sẽ tự động cập nhật lại ngay.</span>
      </div>
    </div>
  );
}

export function ListingDetailPage() {
  const { id = '' } = useParams();
  return <ListingDetail key={id} id={id} />;
}

function ListingDetail({ id }: { id: string }) {
  const [params, setParams] = useSearchParams();
  const date = ISO_DATE.test(params.get('date') ?? '') ? (params.get('date') as string) : '';
  const health = useInsight<ListingHealth>(id ? `/listings/${id}/health` : null);
  const intel = useInsight<ListingIntel>(id ? `/listings/${id}/intel` : null, { date });
  const [selectedFactor, setSelectedFactor] = useState<string>('image');
  const [showWhyModal, setShowWhyModal] = useState<boolean>(false);
  const [intelTab, setIntelTab] = useState<string>('parts');

  const last = useRef<{ title: string; thumbnail: string | null } | null>(null);
  if (health.state.kind === 'ready') {
    last.current = { title: health.state.data.title, thumbnail: health.state.data.thumbnail };
  }
  const ready = last.current;
  const productTitle = ready?.title || 'Sản phẩm';

  const setDate = (value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set('date', value);
    else next.delete('date');
    setParams(next, { replace: true });
  };

  const datePicker = (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-1.5">
      <div className="flex items-center gap-1.5 text-xs text-stone-600">
        <Calendar size={13} className="text-stone-400" />
        <span>Xem từ ngày:</span>
      </div>
      <input
        id="health-date"
        type="date"
        value={date}
        min={shiftDays(-MAX_DAYS)}
        max={shiftDays(MAX_DAYS)}
        onChange={e => setDate(e.target.value)}
        className="h-7 rounded border border-stone-200 bg-stone-50/50 px-2 text-xs font-medium text-stone-800 outline-none transition-colors focus:border-[#111111]"
      />
      {date && (
        <button
          type="button"
          onClick={() => setDate('')}
          className="rounded border border-stone-200 bg-white px-2 py-0.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
        >
          Hôm nay
        </button>
      )}
    </div>
  );

  const actions = (
    <div className="flex items-center gap-2">
      <Link
        to={`${INSIGHTS_ROOT}/listings`}
        className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-50"
      >
        <ArrowLeft size={13} />
        <span>Tất cả sản phẩm</span>
      </Link>
    </div>
  );

  return (
    <HealthTheme>
      <InsightPage
        title="Chất lượng tin đăng"
        question={QUESTION}
        actions={actions}
        breadcrumb={[{ label: 'Sức khoẻ sản phẩm', to: `${INSIGHTS_ROOT}/listings` }, { label: productTitle }]}
        header={
          <header className="mb-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-stone-200/80 pb-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative h-14 w-14 shrink-0 rounded-xl border border-stone-200/80 bg-stone-100 overflow-hidden shadow-2xs">
                  {ready?.thumbnail ? (
                    <img
                      src={ready.thumbnail}
                      alt={productTitle}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-stone-50 text-stone-400">
                      <Package size={22} strokeWidth={1.5} />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className="font-mono text-[11px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded cursor-help"
                      title="Mã định danh tin đăng trên hệ thống VietCraft"
                    >
                      Mã tin: #{id ? id.slice(-8).toUpperCase() : 'N/A'}
                    </span>
                    <span className="text-stone-300">·</span>
                    <span className="text-[11px] font-medium text-stone-500">Tin đăng gian hàng</span>
                    <span className="text-stone-300">·</span>
                    <span className="text-[11px] font-medium text-stone-400">Đánh giá 6 tiêu chuẩn</span>
                  </div>

                  <h1 className="m-0 mt-1 truncate font-sans text-xl md:text-2xl font-bold tracking-tight text-[#111111]">
                    {productTitle}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to={`${INSIGHTS_ROOT}/listings`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-50"
                >
                  <ArrowLeft size={13} />
                  <span>Tất cả sản phẩm</span>
                </Link>

                <a
                  href={`/products/${id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-50 hover:text-[#111111] no-underline"
                  title="Mở trang sản phẩm hiển thị với người mua trong tab mới"
                >
                  <Eye size={13} className="text-stone-400" />
                  <span>Xem trên sàn</span>
                </a>
              </div>
            </div>
          </header>
        }
      >
        <InsightBlock state={health.state} onRetry={health.reload}>
          {(data, meta) => {
            const todos = visibleTodos(data);
            const totalImpact = Math.round(todos.reduce((sum, item) => sum + item.impact, 0));
            const currentScore = Math.floor(data.score ?? 0);
            const potential = todos.length ? Math.min(100, currentScore + totalImpact) : null;

            return (
              <div className="space-y-6 pt-1">
                {/* 1. Top Bento: Health Score Gauge + Priority Action Items */}
                <div className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-2xs">
                  <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-stone-100">
                    {/* Left: Overall Health Score Gauge (5 cols) */}
                    <div className="lg:col-span-5 p-5 md:p-6">
                      <HealthGauge
                        score={data.score}
                        potential={potential}
                        productId={id}
                        onExplainClick={() => setShowWhyModal(true)}
                      />
                    </div>

                    {/* Right: Priority Action List (7 cols) */}
                    <div className="lg:col-span-7 p-5 md:p-6">
                      <PriorityActions data={data} productId={id} />
                    </div>
                  </div>
                </div>

                {/* 2. Core 6 Performance Standards Grid + Selected Factor Advice */}
                <div className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-2xs">
                  <div className="p-5 md:p-6">
                    <FactorGrid
                      data={data}
                      selectedFactor={selectedFactor}
                      onSelectFactor={setSelectedFactor}
                    />
                  </div>

                  {/* Contextual guidance tray for selected factor */}
                  <div className="border-t border-stone-100 bg-[#FBFBFA] p-5 md:p-6">
                    <FactorBreakdownCard
                      data={data}
                      selectedFactor={selectedFactor}
                    />
                  </div>
                </div>

                {/* 3. Market Price Guidance (if available) */}
                <PriceAdvice data={data} />

                {/* 4. Deep-dive Intelligence Tabs */}
                <div className="rounded-xl border border-stone-200 bg-white p-5 md:p-6 shadow-2xs">
                  <div className="border-b border-stone-100 pb-3 mb-5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                      Phân tích kỹ thuật (AI)
                    </span>
                    <h3 className="m-0 mt-0.5 font-jakarta text-base font-bold text-[#111111]">
                      Dữ liệu máy học &amp; Xu hướng thị trường
                    </h3>
                    <p className="m-0 mt-1 text-xs text-stone-500">
                      Phân tích chi tiết từng góc chụp ảnh, chất liệu và hiệu quả chuyển đổi giúp bạn tối ưu nâng cao.
                    </p>
                  </div>

                  <Tabs
                    activeKey={intelTab}
                    onChange={setIntelTab}
                    items={[
                      {
                        key: 'parts',
                        label: (
                          <span className="flex items-center gap-1.5 font-semibold text-xs">
                            <Layers size={13} />
                            <span>Chẩn đoán từng phần</span>
                          </span>
                        ),
                        children: (
                          <InsightBlock state={intel.state} onRetry={intel.reload}>
                            {intelData => <PartTabs data={intelData} productId={id} bare />}
                          </InsightBlock>
                        ),
                      },
                      {
                        key: 'season',
                        label: (
                          <span className="flex items-center gap-1.5 font-semibold text-xs">
                            <TrendingUp size={13} />
                            <span>Mùa vụ &amp; Xu hướng</span>
                          </span>
                        ),
                        children: (
                          <InsightBlock state={intel.state} onRetry={intel.reload}>
                            {intelData => (
                              <div className="space-y-4 pt-2">
                                <SeasonPanel points={intelData.score_timeline}>{datePicker}</SeasonPanel>
                              </div>
                            )}
                          </InsightBlock>
                        ),
                      },
                      {
                        key: 'traffic',
                        label: (
                          <span className="flex items-center gap-1.5 font-semibold text-xs">
                            <Users size={13} />
                            <span>Lưu lượng &amp; Chuyển đổi</span>
                          </span>
                        ),
                        children: id ? <ListingTraffic id={id} conversionDetail={null} /> : null,
                      },
                    ]}
                  />
                </div>

                <SourceFooter meta={meta} />

                {/* Plain-Language Scoring Modal */}
                <Modal
                  open={showWhyModal}
                  onCancel={() => setShowWhyModal(false)}
                  footer={null}
                  title={
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-[#007700]" />
                      <span className="font-jakarta font-bold text-stone-900">
                        Cách tính điểm sức khoẻ tin đăng
                      </span>
                    </div>
                  }
                  width={720}
                >
                  <WhyScore data={data} />
                </Modal>
              </div>
            );
          }}
        </InsightBlock>
      </InsightPage>
    </HealthTheme>
  );
}
