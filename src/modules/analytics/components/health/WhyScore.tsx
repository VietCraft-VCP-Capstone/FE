import type { ReactNode } from 'react';
import { Collapse, Tag } from 'antd';
import { HelpCircle, Database, ShieldCheck, Info } from 'lucide-react';
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
    <div className="rounded-xl border border-stone-100 bg-stone-50/70 p-4 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[#007700]">{icon}</span>
        <h4 className="m-0 font-jakarta text-xs font-bold text-stone-900">{title}</h4>
      </div>
      <div className="text-xs leading-relaxed text-stone-600">{children}</div>
    </div>
  );
}

function Body({ data }: { data: ListingHealth }) {
  const { weights, markets, sources } = data.basis;
  const lift = liftText(markets);
  const parts = (Object.keys(weights) as HealthFactorKey[]).sort((a, b) => weights[b] - weights[a]);
  const top = parts.slice(0, 3).map(k => PART[k].label.toLowerCase());
  const learned = parts.filter(k => sources?.[k] === 'learned');
  const fixed = parts.filter(k => sources?.[k] && sources[k] !== 'learned');
  const pool = learned.reduce((sum, k) => sum + weights[k], 0);

  return (
    <div className="space-y-6 pt-2">
      {/* 6 parts breakdown cards */}
      <div>
        <p className="m-0 mb-3 text-xs font-semibold text-stone-700">
          1. Thang điểm 100 được phân bổ theo mức độ ảnh hưởng đến quyết định mua hàng:
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {parts.map(k => (
            <div key={k} className="flex flex-col justify-between rounded-xl border border-stone-150 bg-white p-3.5 shadow-2xs">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-jakarta text-xs font-bold text-stone-900">{PART[k].label}</span>
                  <Tag color="green" className="!m-0 text-[11px] font-bold">
                    Tối đa {weights[k]} điểm
                  </Tag>
                </div>
                <p className="m-0 text-xs leading-relaxed text-stone-600">{PART[k].why}</p>
              </div>
              {sources?.[k] && (
                <div className="mt-2.5 pt-2 border-t border-stone-100 text-[11px] text-stone-400">
                  {SOURCE[sources[k]!]}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 3 informative cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <SectionCard title="2. Cơ sở dữ liệu thực nghiệm" icon={<Database size={15} />}>
          {fixed.length > 0 && <p className="m-0 mb-1">{fixed.map(k => `${PART[k].label} (${weights[k]}đ)`).join(', ')} là tiêu chuẩn kỹ thuật sàn.</p>}
          {learned.length > 0 && (
            <p className="m-0">
              {pool} điểm còn lại chia theo mô hình phân tích hơn <strong>33.000 sản phẩm đã bán thật</strong>, đo lường sự chênh lệch giữa sản phẩm bán chạy và bán chậm.
            </p>
          )}
          {lift && <p className="m-0 mt-2 font-semibold text-[#007700]">Kiểm chứng: Sản phẩm điểm cao có tỷ lệ bán chạy gấp {lift} sản phẩm điểm thấp.</p>}
        </SectionCard>

        <SectionCard title="3. Thứ tự ưu tiên tối ưu" icon={<ShieldCheck size={15} />}>
          <p className="m-0">
            Trọng số có thể biến thiên nhẹ theo nhóm ngành hàng, nhưng thứ tự ưu tiên cốt lõi luôn là:{' '}
            <strong className="text-stone-900">{top.join(' → ')}</strong>.
          </p>
          <p className="m-0 mt-2">
            Hãy tập trung hoàn thiện ảnh và nội dung mô tả trước khi xét đến các yếu tố khác.
          </p>
        </SectionCard>

        <SectionCard title="4. Mục đích sử dụng điểm" icon={<Info size={15} />}>
          <p className="m-0">
            Điểm sức khoẻ là công cụ chẩn đoán giúp bạn phát hiện điểm yếu để hoàn thiện tin đăng.
          </p>
          <p className="m-0 mt-2 text-stone-500">
            Điểm cao không cam kết chắc chắn 100% ra đơn và không ảnh hưởng trực tiếp đến thuật toán tìm kiếm của sàn.
          </p>
        </SectionCard>
      </div>
    </div>
  );
}

export function WhyScore({ data }: { data: ListingHealth }) {
  return (
    <div className="rounded-2xl border border-stone-200/80 bg-white p-2 shadow-xs transition-shadow hover:shadow-sm">
      <Collapse
        ghost
        expandIconPlacement="end"
        items={[
          {
            key: 'why',
            label: (
              <div className="flex items-center gap-3 py-1">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-700">
                  <HelpCircle size={16} />
                </div>
                <div>
                  <h3 className="m-0 font-jakarta text-sm font-bold text-stone-900">
                    Vì sao điểm được tính như vậy? (Giải thích phương pháp)
                  </h3>
                  <p className="m-0 mt-0.5 text-xs text-stone-500 font-normal">
                    Minh bạch cơ sở dữ liệu huấn luyện và trọng số của 6 tiêu chí chấm điểm
                  </p>
                </div>
              </div>
            ),
            children: <Body data={data} />,
          },
        ]}
      />
    </div>
  );
}
