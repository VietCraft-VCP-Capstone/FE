import type { ReactNode } from 'react';
import { Database, ShieldCheck, Info } from 'lucide-react';
import { decimal } from '../../format';
import type { HealthFactorKey, ListingHealth } from '../../healthTypes';
import { PART, SOURCE } from './whyText';

function liftText(markets: ListingHealth['basis']['markets']): string | null {
  const lifts = Object.values(markets ?? {}).map(m => m?.lift).filter((x): x is number => Number.isFinite(x));
  if (lifts.length === 0) return null;
  const lo = decimal(Math.min(...lifts), 1);
  const hi = decimal(Math.max(...lifts), 1);
  return lo === hi ? `${lo} lần` : `${lo} đến ${hi} lần`;
}

function SectionCard({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-[#FBFBFA] p-3.5">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-stone-600">{icon}</span>
        <h4 className="m-0 font-jakarta text-xs font-bold text-[#111111]">{title}</h4>
      </div>
      <div className="text-xs leading-relaxed text-stone-600">{children}</div>
    </div>
  );
}

export function WhyScore({ data }: { data: ListingHealth }) {
  const { weights, markets, sources } = data.basis;
  const lift = liftText(markets);
  const parts = (Object.keys(weights) as HealthFactorKey[]).sort((a, b) => weights[b] - weights[a]);
  const top = parts.slice(0, 3).map(k => PART[k].label.toLowerCase());

  return (
    <div className="space-y-5 pt-1">
      <div>
        <p className="m-0 mb-3 text-xs font-semibold text-stone-700">
          Thang điểm 100 phân bổ theo mức độ ảnh hưởng đến quyết định mua của khách:
        </p>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {parts.map(k => (
            <div key={k} className="flex flex-col justify-between rounded-lg border border-stone-200 bg-white p-3 shadow-2xs">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-jakarta text-xs font-bold text-stone-900">{PART[k].label}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#EAF0E2] text-[#007700] border border-[#BECAB6] font-mono">
                    Tối đa {weights[k]}đ
                  </span>
                </div>
                <p className="m-0 text-xs leading-relaxed text-stone-600">{PART[k].why}</p>
              </div>
              {sources?.[k] && (
                <div className="mt-2.5 pt-2 border-t border-stone-100 text-[10px] text-stone-400">
                  {SOURCE[sources[k]!]}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <SectionCard title="1. Dữ liệu thực nghiệm" icon={<Database size={14} />}>
          <p className="m-0">
            Trọng số được học từ hành vi mua hàng thực tế trên sàn, đo lường sự khác biệt giữa các sản phẩm bán chạy và bán chậm.
          </p>
          {lift && (
            <p className="m-0 mt-2 font-semibold text-[#007700]">
              Thực tế: Sản phẩm điểm cao có tỉ lệ bán chạy gấp {lift} sản phẩm điểm thấp.
            </p>
          )}
        </SectionCard>

        <SectionCard title="2. Thứ tự ưu tiên" icon={<ShieldCheck size={14} />}>
          <p className="m-0">
            Thứ tự ưu tiên quan trọng nhất luôn là:{' '}
            <strong className="text-[#111111]">{top.join(' → ')}</strong>.
          </p>
          <p className="m-0 mt-2">
            Hãy tập trung hoàn thiện ảnh và mô tả sản phẩm trước khi xét đến các yếu tố khác.
          </p>
        </SectionCard>

        <SectionCard title="3. Mục đích sử dụng" icon={<Info size={14} />}>
          <p className="m-0">
            Điểm sức khoẻ là công cụ chẩn đoán giúp bạn tự phát hiện điểm còn thiếu để hoàn thiện tin đăng.
          </p>
          <p className="m-0 mt-2 text-stone-500">
            Sàn không tự động phạt hay hạ bậc tin đăng nếu điểm chưa cao.
          </p>
        </SectionCard>
      </div>

      <div className="rounded-lg border border-[#D5E6D4] bg-[#EDF3EC]/60 p-3.5 text-xs leading-relaxed text-[#254C28]">
        <span className="font-bold">Lưu ý về định giá đồ thủ công:</span>{' '}
        Tiêu chuẩn Giá (tối đa 40đ) chỉ đo lường xem mức giá có nằm trong khung chấp nhận được của phân khúc khách hàng hay không. Sàn không ép bạn phải bán rẻ để lấy điểm cao. Với sản phẩm thủ công tinh xảo độc bản, giá cao hoàn toàn xứng đáng nếu bạn làm nổi bật công sức chế tác và chất liệu quý trong phần mô tả.
      </div>
    </div>
  );
}
