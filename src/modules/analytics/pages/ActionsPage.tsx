/**
 * F41 "Việc nên làm" — trả lời: 30 ngày tới nên làm gì trước?
 *
 * Đọc GET /seller/analytics/forecast/recommendations.
 *
 * Đây là trang đích của cả khu phân tích: 15 trang kia đưa dữ kiện, trang này xếp thứ
 * tự việc. Vì thế mỗi khuyến nghị phải nói rõ ba thứ: vì sao được gợi ý (mảng `why`),
 * đã kiểm định hồi cố chưa (`validated`), và đường sang trang chứng cứ để người bán tự
 * kiểm lại. Nếu `personalised` là false thì phải nói thẳng đây là gợi ý chung toàn sàn.
 */

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Ban, CheckCircle2, Compass, FlaskConical, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { InsightBlock } from '../components/InsightBlock';
import { InsightPage } from '../components/InsightPage';
import { SourceFooter } from '../components/SourceFooter';
import { Chip, InsightCard, Note, Skeleton, type Tone } from '../components/ui';
import { useInsight } from '../hooks/useInsight';
import { NA } from '../format';
import { productTypeLabel, tagLabel } from '../labels';
import { count } from '../../../shared/utils/format';
import type { Recommendations } from '../types';

type Recommendation = Recommendations['recommendations'][number];

/** Nhãn hành động: mã của service AI đọc thành câu người bán hiểu ngay. */
const ACTION_META: Record<string, { label: string; icon: LucideIcon; hint: string }> = {
  scale: { label: 'Đẩy mạnh', icon: TrendingUp, hint: 'Thứ đang bán được, làm thêm mẫu cùng loại.' },
  expand: { label: 'Mở rộng sang', icon: Compass, hint: 'Ngách kề với thứ bạn đang làm, cầu còn trống.' },
  explore: { label: 'Thử nghiệm', icon: FlaskConical, hint: 'Chưa có lịch sử để chắc chắn, nên làm thử lô nhỏ.' },
};

const CONFIDENCE_META: Record<string, { tone: Tone; text: string }> = {
  high: { tone: 'good', text: 'độ tin cậy cao' },
  medium: { tone: 'warn', text: 'độ tin cậy trung bình' },
  low: { tone: 'neutral', text: 'độ tin cậy thấp' },
};

const TARGET_KIND: Record<string, string> = {
  product_type: 'Loại phôi',
  tag: 'Tag',
  keyword: 'Từ khoá',
};

function targetName(target: Recommendation['target']): string {
  if (target.type === 'product_type') return target.name_vi ?? productTypeLabel(target.id);
  return tagLabel(target.name_vi ?? target.keyword ?? target.id, target.tag_id);
}

/**
 * Trang chứng cứ cho từng khuyến nghị. Một gợi ý không kèm đường kiểm lại thì người bán
 * chỉ còn cách tin hoặc bỏ qua.
 */
function evidenceLinks(rec: Recommendation): { to: string; label: string }[] {
  if (rec.target.type === 'product_type') {
    return [
      { to: '/seller/insights/categories', label: 'Doanh thu theo loại phôi' },
      { to: '/seller/insights/forecast', label: 'Dự báo doanh thu' },
    ];
  }
  return [
    { to: '/seller/insights/niches', label: 'Cung và cầu của ngách' },
    { to: '/seller/insights/forecast', label: 'Dự báo doanh thu' },
  ];
}

function EvidenceLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 no-underline transition-colors duration-150 hover:border-[#007700] hover:text-[#007700] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700] motion-reduce:transition-none"
    >
      {label}
      <ArrowRight size={14} aria-hidden />
    </Link>
  );
}

function WarnBlock({ children }: { children: ReactNode }) {
  return (
    <div role="note" className="flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-900">
      <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const action = ACTION_META[rec.action] ?? { label: rec.action, icon: Compass, hint: '' };
  const ActionIcon = action.icon;
  const confidence = CONFIDENCE_META[rec.confidence] ?? { tone: 'neutral' as Tone, text: `độ tin cậy ${rec.confidence}` };
  const kind = TARGET_KIND[rec.target.type] ?? 'Đối tượng';

  return (
    <article className="rounded-md border border-stone-200 bg-white p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF0E2] font-jakarta text-base font-extrabold text-[#005B00]">
          {rec.priority}
          <span className="sr-only">Ưu tiên số {rec.priority}</span>
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone="good" icon={<ActionIcon size={13} aria-hidden />}>{action.label}</Chip>
            <h3 className="m-0 font-jakarta text-base font-extrabold leading-tight text-stone-900">{targetName(rec.target)}</h3>
          </div>
          <p className="mb-0 mt-1.5 text-xs leading-relaxed text-stone-500">
            {kind}. {action.hint}
          </p>

          {rec.why.length > 0 ? (
            <ul className="m-0 mt-3 list-disc space-y-1 pl-5 text-[13.5px] leading-relaxed text-stone-700">
              {rec.why.map((reason, i) => (
                <li key={`${reason}-${i}`}>{reason}</li>
              ))}
            </ul>
          ) : (
            <div className="mt-3">
              <Note>Khuyến nghị này không kèm lý do nào, nên hãy cân nhắc thêm trước khi làm.</Note>
            </div>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="min-w-0">
              <span className="block text-[11.5px] font-semibold text-stone-500">Kết quả kỳ vọng</span>
              <span className="mt-0.5 block text-[13.5px] leading-relaxed text-stone-800">{rec.expected || NA}</span>
            </div>
            <div className="min-w-0">
              <span className="block text-[11.5px] font-semibold text-stone-500">Mức tin cậy của gợi ý</span>
              <span className="mt-1 block">
                <Chip tone={confidence.tone}>{confidence.text}</Chip>
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[11.5px] font-semibold text-stone-500">Kiểm lại chứng cứ:</span>
            {evidenceLinks(rec).map(link => (
              <EvidenceLink key={link.to} to={link.to} label={link.label} />
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

export function ActionsPage() {
  const { state, reload } = useInsight<Recommendations>('/forecast/recommendations');

  return (
    <InsightPage
      title="Việc nên làm"
      question="30 ngày tới nên làm gì trước? Danh sách dưới đây xếp theo thứ tự ưu tiên, kèm lý do và đường kiểm lại số liệu."
    >
      <InsightBlock
        state={state}
        onRetry={reload}
        skeleton={
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-md" />
            <Skeleton className="h-56 w-full rounded-md" />
            <Skeleton className="h-56 w-full rounded-md" />
          </div>
        }
      >
        {(data, meta) => {
          const platformOnly = data.personalised === false || data.scope === 'platform';
          const top = [...data.recommendations].sort((a, b) => a.priority - b.priority).slice(0, 5);
          const hidden = data.recommendations.length - top.length;

          return (
            <div className="space-y-4">
              {(platformOnly || data.validated === false) && (
                <InsightCard title="Đọc trước khi làm">
                  <div className="space-y-2.5">
                    {platformOnly && (
                      <WarnBlock>
                        <strong>Đây là gợi ý chung cho toàn sàn, không phải phân tích riêng cho shop bạn.</strong> Shop
                        chưa có đủ lịch sử bán để tính riêng, nên danh sách dưới đây dựa trên số liệu chung của sàn. Khi
                        shop bán được thêm một thời gian, phần này sẽ đổi sang gợi ý theo đúng số của bạn.
                      </WarnBlock>
                    )}
                    {data.validated === false && (
                      <WarnBlock>
                        <strong>Chưa chạy kiểm định hồi cố</strong>, nên hãy xem đây là thứ tự ưu tiên để thử, không
                        phải cam kết kết quả. {data.validation_note}
                      </WarnBlock>
                    )}
                  </div>
                </InsightCard>
              )}

              <InsightCard
                title={`Ưu tiên cho 30 ngày tới (${count(top.length)} việc)`}
                description={
                  data.my_listings_analysed
                    ? `Đã phân tích ${count(data.my_listings_analysed)} sản phẩm của shop để xếp thứ tự này.`
                    : 'Shop chưa có lịch sử bán nên đây là gợi ý chung của toàn sàn.'
                }
                action={
                  data.validated ? (
                    <Chip tone="good" icon={<CheckCircle2 size={13} aria-hidden />}>đã kiểm định</Chip>
                  ) : (
                    <Chip tone="warn" icon={<AlertTriangle size={13} aria-hidden />}>chưa kiểm định</Chip>
                  )
                }
                bodyClassName="space-y-3 p-5"
                footer={<SourceFooter meta={meta} limitation={data.validation_note} />}
              >
                {top.length === 0 ? (
                  <Note>
                    Chưa có việc nào đủ căn cứ để đề xuất. Thường là vì shop mới bán, chưa đủ lượt xem và đơn để so.
                    Cứ đăng thêm hàng và quay lại sau vài tuần.
                  </Note>
                ) : (
                  <>
                    {top.map(rec => (
                      <RecommendationCard key={`${rec.priority}-${rec.target.id}`} rec={rec} />
                    ))}
                    {hidden > 0 && (
                      <Note>
                        Còn {count(hidden)} khuyến nghị mức ưu tiên thấp hơn không hiện ở đây, để danh sách đủ ngắn mà
                        làm được.
                      </Note>
                    )}
                  </>
                )}
              </InsightCard>

              {(data.excluded_product_types?.length ?? 0) > 0 && (
                <InsightCard
                  title="Đã loại khỏi gợi ý"
                  description="Những loại phôi này có người xem nhưng chưa bán được cái nào, nên không đưa vào danh sách trên."
                  footer={<SourceFooter meta={meta} limitation={data.exclusion_reason} />}
                >
                  <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                    {(data.excluded_product_types ?? []).map(id => (
                      <li key={id}>
                        <Chip tone="neutral" icon={<Ban size={12} aria-hidden />}>{productTypeLabel(id)}</Chip>
                      </li>
                    ))}
                  </ul>
                  <p className="mb-0 mt-3 text-xs leading-relaxed text-stone-500">
                    Lý do loại: {data.exclusion_reason} Có lượt xem mà không có đơn thường là vấn đề ảnh, giá hoặc mô
                    tả, chứ không phải không có người cần.
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
