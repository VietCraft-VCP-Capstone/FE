import type { ReactNode } from 'react';
import { Tooltip } from 'antd';
import { Info } from 'lucide-react';

export const NET_TIP = 'Tiền shop nhận sau khi trừ phí sàn, voucher và hoàn tiền.';
export const POD_TIP = 'Hàng in sau khi khách đặt. Lãi = thực nhận trừ giá phôi.';

/** Thuật ngữ kèm ⓘ: rê chuột hoặc Tab tới để xem giải thích. */
export function Term({ tip, children }: { tip: string; children: ReactNode }) {
  return (
    <Tooltip title={tip}>
      <span tabIndex={0} className="inline-flex items-center gap-1 outline-none focus-visible:underline">
        {children}
        <Info size={12} className="shrink-0 text-stone-400" aria-label={tip} />
      </span>
    </Tooltip>
  );
}
