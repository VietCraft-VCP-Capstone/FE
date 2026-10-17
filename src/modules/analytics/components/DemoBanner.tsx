import { useState } from 'react';
import { FlaskConical, PlugZap, X } from 'lucide-react';
import { useInsightContext } from '../hooks/useInsightContext';

const DISMISS_KEY = 'vc-insights-demo-banner';

function readDismissed(): boolean {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Nhãn "shop mẫu" của khu phân tích.
 *
 * Khi BE chạy chế độ demo (AI_DEMO_SHOP_ID), mọi con số là của một shop MẪU trong dữ
 * liệu mô phỏng, không phải của gian hàng đang đăng nhập. Hợp đồng dữ liệu cấm gán
 * dữ liệu mồi cho shop thật, nên nói thẳng ở đầu khu. Ẩn được trong phiên, không ẩn vĩnh viễn.
 */
export function DemoBanner() {
  const { context } = useInsightContext();
  const [dismissed, setDismissed] = useState(readDismissed);

  if (context && !context.ai_reachable) {
    return (
      <div role="status" className="mx-auto mb-5 flex w-full max-w-7xl items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        <PlugZap size={18} className="mt-0.5 shrink-0" aria-hidden />
        <p className="m-0 leading-relaxed">
          <strong>Dịch vụ phân tích đang không phản hồi.</strong> Các trang trong khu này sẽ chưa có số liệu cho tới khi dịch vụ chạy lại.
        </p>
      </div>
    );
  }

  // Nếu seller đã có gian hàng thật (live_shop_id) thì không hiển thị banner shop mẫu
  if (!context?.demo || Boolean(context?.live_shop_id) || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* chế độ riêng tư: vẫn ẩn trong lần xem này */
    }
  };

  return (
    <div role="note" className="mx-auto mb-5 flex w-full max-w-7xl items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <FlaskConical size={18} className="mt-0.5 shrink-0" aria-hidden />
      <p className="m-0 flex-1 leading-relaxed">
        <strong>Đang xem gian hàng mẫu.</strong> Số liệu phân tích lấy từ shop mẫu{' '}
        <code className="rounded bg-amber-100 px-1 text-[12px]">{context.analysed_shop_id}</code> trong bộ dữ liệu mô phỏng,
        không phải của {context.shop_name ? <strong>{context.shop_name}</strong> : 'gian hàng của bạn'}. Gian hàng thật sẽ có số liệu riêng khi sàn đủ lịch sử giao dịch.
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Ẩn thông báo gian hàng mẫu trong phiên này"
        className="inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent text-amber-900 transition-colors duration-150 hover:bg-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-700"
      >
        <X size={15} aria-hidden />
      </button>
    </div>
  );
}
