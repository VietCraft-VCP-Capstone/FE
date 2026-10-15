import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock3, Hourglass, PlugZap, RefreshCw, SearchX, Store } from 'lucide-react';
import type { InsightState } from '../hooks/useInsight';
import type { InsightMeta, InsightUnlock } from '../types';
import { Skeleton } from './ui';

/**
 * Vẽ đúng màn hình cho từng trạng thái của một khối số liệu.
 *
 * Mỗi trạng thái một thông điệp riêng, viết cho người bán đọc: "chưa đủ dữ liệu" không
 * phải lỗi, "hệ thống đang tính" không phải hỏng, và không trạng thái nào hiện số 0 giả.
 */

function Panel({ icon, title, body, action, compact }: {
  icon: React.ReactNode;
  title: string;
  body?: React.ReactNode;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'gap-2 px-4 py-6' : 'gap-3 px-6 py-12'}`}>
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-500" aria-hidden>
        {icon}
      </span>
      <div className="max-w-[46ch]">
        <p className="m-0 text-sm font-bold text-stone-800">{title}</p>
        {body && <div className="mt-1 text-xs leading-relaxed text-stone-500">{body}</div>}
      </div>
      {action}
    </div>
  );
}

/**
 * Thanh tiến độ "đang có bao nhiêu / cần bao nhiêu" (plan §9.2) — thay cho câu thông
 * báo chay khi một tính năng mở theo ngưỡng dữ liệu sàn thật (ví dụ "12/20 đơn").
 */
function UnlockProgress({ unlock }: { unlock: InsightUnlock }) {
  const pct = unlock.target > 0 ? Math.max(0, Math.min(100, Math.round((unlock.current / unlock.target) * 100))) : 0;
  return (
    <div className="mt-3 w-full max-w-[22rem]" role="progressbar" aria-valuenow={unlock.current} aria-valuemin={0} aria-valuemax={unlock.target}>
      <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-stone-500">
        <span className="truncate">{unlock.requirement}</span>
        <span className="shrink-0 tabular-nums">{unlock.current}/{unlock.target} {unlock.unit}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
        <div className="h-full rounded-full bg-[#007700] transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function RetryButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 transition-colors duration-150 hover:border-[#007700] hover:text-[#007700] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700] active:translate-y-px motion-reduce:transition-none"
    >
      <RefreshCw size={13} aria-hidden /> Thử lại
    </button>
  );
}

const UNAVAILABLE_TEXT: Record<string, string> = {
  ai_timeout: 'Dịch vụ phân tích phản hồi quá 5 giây nên yêu cầu đã dừng.',
  ai_unavailable: 'Chưa kết nối được tới dịch vụ phân tích.',
  ai_gateway_not_configured: 'Máy chủ chưa được cấu hình khoá kết nối tới dịch vụ phân tích.',
  ai_gateway_rejected: 'Dịch vụ phân tích từ chối khoá kết nối của máy chủ. Cần kiểm tra lại cấu hình.',
  ai_bad_response: 'Dịch vụ phân tích trả về dữ liệu không đọc được.',
  network: 'Mất kết nối mạng hoặc máy chủ không phản hồi.',
};

/** Chỉ phần trạng thái (không có khung thẻ). Trả null khi đã có dữ liệu. */
export function InsightStatusView<T>({ state, onRetry, compact, skeleton }: {
  state: InsightState<T>;
  onRetry?: () => void;
  compact?: boolean;
  skeleton?: React.ReactNode;
}) {
  switch (state.kind) {
    case 'loading':
      return (
        <div aria-busy="true" aria-live="polite" className="space-y-3">
          <span className="sr-only">Đang tải số liệu</span>
          {skeleton ?? (
            <>
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </>
          )}
        </div>
      );
    case 'insufficient':
      return (
        <Panel
          compact={compact}
          icon={<Hourglass size={18} />}
          title="Chưa đủ dữ liệu để tính"
          body={
            <>
              {state.reason}
              {state.meta?.unlock && <UnlockProgress unlock={state.meta.unlock} />}
            </>
          }
        />
      );
    case 'not_ready':
      return (
        <Panel
          compact={compact}
          icon={<Clock3 size={18} />}
          title="Hệ thống đang chuẩn bị số liệu"
          body={<>Bảng <code className="rounded bg-stone-100 px-1">{state.collection}</code> chưa được tính lần nào. Số liệu sẽ có sau lần chạy tính toán ban đêm kế tiếp.</>}
          action={onRetry && <RetryButton onClick={onRetry} />}
        />
      );
    case 'shop_required':
      return (
        <Panel
          compact={compact}
          icon={<Store size={18} />}
          title="Bạn chưa có gian hàng"
          body="Thiết lập gian hàng trước, phân tích sẽ tự gắn với gian hàng của bạn."
          action={
            <Link to="/seller/onboarding" className="rounded-xl bg-[#007700] px-3 py-1.5 text-xs font-semibold text-white no-underline transition-colors duration-150 hover:bg-[#005B00]">
              Thiết lập gian hàng
            </Link>
          }
        />
      );
    case 'unavailable':
      return (
        <Panel
          compact={compact}
          icon={<PlugZap size={18} />}
          title="Không lấy được số liệu lúc này"
          body={UNAVAILABLE_TEXT[state.code] ?? UNAVAILABLE_TEXT.ai_unavailable}
          action={onRetry && <RetryButton onClick={onRetry} />}
        />
      );
    case 'not_found':
      return <Panel compact={compact} icon={<SearchX size={18} />} title="Không tìm thấy mục này" body="Có thể sản phẩm đã bị xoá hoặc không thuộc gian hàng đang phân tích." />;
    case 'error':
      return (
        <Panel
          compact={compact}
          icon={<AlertTriangle size={18} />}
          title="Có lỗi khi đọc số liệu"
          body={state.message}
          action={onRetry && <RetryButton onClick={onRetry} />}
        />
      );
    default:
      return null;
  }
}

/**
 * Bọc một khối số liệu: có dữ liệu thì gọi children(data, meta), không thì vẽ trạng thái.
 * Trạng thái `partial` vẫn hiện số nhưng kèm một dòng cảnh báo lý do độ tin cậy thấp.
 */
export function InsightBlock<T>({ state, onRetry, compact, skeleton, children }: {
  state: InsightState<T>;
  onRetry?: () => void;
  compact?: boolean;
  skeleton?: React.ReactNode;
  children: (data: T, meta: InsightMeta) => React.ReactNode;
}) {
  if (state.kind !== 'ready') {
    return <InsightStatusView state={state} onRetry={onRetry} compact={compact} skeleton={skeleton} />;
  }
  return (
    <>
      {state.meta.status === 'partial' && (
        <div role="note" className="mb-4 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden />
          <div>
            <span><strong>Độ tin cậy thấp.</strong> {state.meta.reason}</span>
            {state.meta.unlock && <UnlockProgress unlock={state.meta.unlock} />}
          </div>
        </div>
      )}
      {children(state.data, state.meta)}
    </>
  );
}
