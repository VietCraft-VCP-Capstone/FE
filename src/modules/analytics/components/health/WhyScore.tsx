import type { ReactNode } from 'react';
import { Tooltip } from 'antd';
import { Database, Info, Lock, Scale } from 'lucide-react';
import { SERIES } from '../../../../shared/components/charts/chartTheme';
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

function Note({ icon, children, tip }: { icon: ReactNode; children: ReactNode; tip?: string }) {
  const body = <span className={tip ? 'cursor-help border-b border-dotted border-stone-300' : ''}>{children}</span>;
  return (
    <li className="flex items-start gap-2 text-xs text-stone-700">
      <span className="mt-px shrink-0 text-stone-400">{icon}</span>
      {tip ? <Tooltip title={tip}>{body}</Tooltip> : body}
    </li>
  );
}

export function WhyScore({ data }: { data: ListingHealth }) {
  const { weights, markets, sources } = data.basis;
  const lift = liftText(markets);
  const parts = (Object.keys(weights) as HealthFactorKey[]).sort((a, b) => weights[b] - weights[a]);
  const max = Math.max(...parts.map(k => weights[k]));

  return (
    <div className="space-y-5 pt-1">
      <div>
        <p className="m-0 mb-2 text-xs text-stone-500">100 điểm chia cho 6 tiêu chí · rê chuột để xem lý do</p>
        <ul className="m-0 list-none space-y-1.5 p-0">
          {parts.map(k => (
            <Tooltip key={k} title={[PART[k].why, sources?.[k] && SOURCE[sources[k]!]].filter(Boolean).join(' · ')} placement="right">
              <li className="grid cursor-help grid-cols-[5.5rem_1fr_2.5rem] items-center gap-3 text-xs">
                <span className="text-stone-700">{PART[k].label}</span>
                <span className="block h-2.5 rounded-[4px] bg-stone-100">
                  <span className="block h-2.5 rounded-[4px]" style={{ width: `${(weights[k] / max) * 100}%`, background: SERIES.green }} />
                </span>
                <span className="text-right font-semibold tabular-nums text-stone-800">{weights[k]}đ</span>
              </li>
            </Tooltip>
          ))}
        </ul>
      </div>

      <ul className="m-0 list-none space-y-2 border-t border-stone-100 p-0 pt-4">
        <Note
          icon={<Database size={13} />}
          tip={lift ? `Trên dữ liệu đối soát thực nghiệm, nhóm tin đăng tối ưu đầy đủ tiêu chuẩn có tỷ lệ tiếp cận và chuyển đổi đơn hàng gấp ${lift} so với nhóm chưa tối ưu.` : undefined}
        >
          Trọng số được học từ dữ liệu thương mại điện tử thực tế, kiểm định trên Tiki & Shopee, và đang được tinh chỉnh liên tục theo ngành hàng thủ công VietCraft.
        </Note>
        <Note icon={<Scale size={13} />} tip="Chưa đủ hàng như vậy để so thì giá chưa tính: điểm tính trên các tiêu chí còn lại rồi quy về thang 100.">
          Giá chỉ tính khi so được với hàng cùng loại, cùng chất liệu của shop khác.
        </Note>
        <Note icon={<Lock size={13} />} tip="Tên có chữ thừa hoặc số điện thoại, chất liệu khai không khớp, bị từ chối kiểm duyệt.">
          Còn lỗi cần sửa gấp thì điểm tạm dừng ở 79.
        </Note>
        <Note icon={<Info size={13} />}>Điểm chỉ để tự kiểm tra. Sàn không phạt hay hạ bậc tin đăng vì điểm thấp.</Note>
      </ul>
    </div>
  );
}
