import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Check, Clock3, Scale } from 'lucide-react';
import { returnRefundMessage } from '../return-workflow-policy';

const latestReason = (timeline: any[], status: string) =>
  timeline.slice().reverse().find(e => e.to_status === status && e.reason)?.reason || '';

const PendingBanner = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
    <Clock3 className="mt-0.5 shrink-0 text-amber-600" size={19} />
    <div>
      <p className="font-bold text-sm">{title}</p>
      <p className="mt-1 text-xs text-amber-900 leading-relaxed">{children}</p>
    </div>
  </section>
);

const SuccessBanner = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-emerald-950 shadow-xs">
    <Check className="mt-0.5 shrink-0 text-emerald-700 bg-emerald-100 rounded-full p-1" size={22} />
    <div className="space-y-1">
      <p className="font-bold text-sm text-emerald-900">{title}</p>
      <p className="text-xs text-emerald-800 leading-relaxed">{children}</p>
    </div>
  </section>
);

export function ReturnStatusBanners({ request, timeline }: { request: any; timeline: any[] }) {
  const navigate = useNavigate();
  const replacementCode = request.replacement_order_code || request.replacement_order_id;

  switch (request.status) {
    case 'REJECTED': {
      const rejectReason = latestReason(timeline, 'REJECTED');
      return (
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-rose-300 bg-rose-50 p-5 text-rose-950 shadow-xs">
          <div className="flex items-start gap-3.5">
            <AlertTriangle className="mt-0.5 shrink-0 text-rose-700 bg-rose-200/80 rounded-full p-1.5" size={26} />
            <div className="space-y-1">
              <p className="font-bold text-base text-rose-950">Yêu cầu đã bị xưởng in từ chối</p>
              <p className="text-xs text-rose-900 leading-relaxed">
                {rejectReason
                  ? <>Lý do từ chối: <strong className="font-semibold text-rose-950">"{rejectReason}"</strong></>
                  : 'Xưởng in đã thẩm định và xác nhận sản phẩm không đủ điều kiện đổi hàng/hoàn tiền theo chính sách.'}
              </p>
              <p className="text-xs text-rose-800">Nếu bạn thấy kết quả này chưa thỏa đáng, bạn có thể gửi yêu cầu khiếu nại để Quản trị viên phân xử lại.</p>
            </div>
          </div>
          <a href="#dispute-section" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-700 hover:bg-rose-800 px-5 text-xs font-bold text-white shadow-sm transition flex-shrink-0 cursor-pointer">
            <Scale size={15} />
            <span>Mở tranh chấp</span>
          </a>
        </section>
      );
    }
    case 'DISPUTED': {
      const disputeReason = latestReason(timeline, 'DISPUTED');
      return (
        <section className="rounded-2xl border border-amber-300 bg-amber-50/90 p-5 sm:p-6 text-amber-950 shadow-xs space-y-3">
          <div className="flex items-start gap-3.5">
            <Scale className="mt-0.5 shrink-0 text-amber-700 bg-amber-200/80 rounded-full p-1.5" size={26} />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-bold text-base text-amber-950">Yêu cầu đang được Quản trị viên phân xử tranh chấp</h2>
                <span className="rounded-full bg-amber-200/80 px-2.5 py-0.5 text-xs font-bold text-amber-900">Đang thụ lý</span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                Bạn đã gửi khiếu nại phản hồi lại quyết định từ chối của xưởng in. Đội ngũ Quản trị viên sàn VietCraft đang đối soát độc lập các bằng chứng (ảnh/video bạn gửi so với thông số in ấn) để đưa ra phán quyết công bằng nhất.
              </p>
            </div>
          </div>
          {disputeReason && (
            <div className="rounded-xl border border-amber-200/80 bg-white/80 p-3.5 text-xs text-slate-800">
              <span className="font-bold text-slate-900 block mb-1">Lý do tranh chấp bạn đã gửi:</span>
              <p className="italic text-slate-700 m-0">"{disputeReason}"</p>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs font-medium text-amber-900 pt-1">
            <Clock3 size={14} className="text-amber-700" />
            <span>Thời gian xử lý dự kiến: trong vòng 24 - 48 giờ làm việc.</span>
          </div>
        </section>
      );
    }
    case 'PRINTER_PROPOSED_FAULT_CHANGE':
      return (
        <PendingBanner title="Chờ Quản trị viên xem xét đề xuất từ xưởng in">
          Xưởng in đã phản hồi đề xuất điều chỉnh phân loại lỗi. Ban quản trị đang rà soát hồ sơ và sẽ chốt phương án xử lý cuối cùng sớm nhất.
        </PendingBanner>
      );
    case 'PENDING_PRINTER':
      return (
        <PendingBanner title="Yêu cầu đang chờ xưởng in thẩm định kỹ thuật">
          Đội ngũ kỹ thuật xưởng in đang kiểm tra đối soát ảnh/video minh chứng và thông số kỹ thuật in ấn để phê duyệt đơn in bù hoặc hoàn tiền cho bạn.
        </PendingBanner>
      );
    case 'CONVERTED_TO_REFUND':
      return <section className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950"><Clock3 className="mt-0.5 shrink-0" size={19} /><div><p className="font-bold">Tiến độ hoàn tiền</p><p className="mt-1 text-sm leading-6">{returnRefundMessage(request.linked_refund_status)}</p></div></section>;
    case 'REPLACEMENT_CREATED':
      return (
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-emerald-300 bg-emerald-50/80 p-5 text-emerald-950 shadow-xs">
          <div className="flex items-start gap-3.5">
            <Check className="mt-0.5 shrink-0 text-emerald-700 bg-emerald-200/80 rounded-full p-1.5" size={26} />
            <div className="space-y-1">
              <p className="font-bold text-base text-emerald-950">Đơn in bù 0đ đã được tạo thành công!</p>
              <p className="text-xs text-emerald-900 leading-relaxed">
                Yêu cầu đổi hàng đã được phê duyệt. Hệ thống đã tự động tạo đơn hàng in bù 0đ mã <strong className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-300 text-emerald-900">{replacementCode}</strong> và chuyển vào hàng đợi in ấn.
              </p>
            </div>
          </div>
          {replacementCode && (
            <button
              type="button"
              onClick={() => navigate(`/orders/${encodeURIComponent(replacementCode)}`)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 px-5 text-xs font-bold text-white shadow-sm transition flex-shrink-0 cursor-pointer"
            >
              <span>Theo dõi đơn in bù</span>
              <ArrowRight size={14} />
            </button>
          )}
        </section>
      );
    case 'APPROVED':
      return request.requested_resolution === 'EXCHANGE' ? (
        <SuccessBanner title="Yêu cầu đổi hàng (in bù) đã được phê duyệt thành công">
          Lỗi in ấn đã được xác nhận. Đơn in bù 0đ đã được chấp thuận sản xuất và đưa vào quy trình in lại để giao sản phẩm mới đến bạn.
        </SuccessBanner>
      ) : null;
    case 'COMPLETED':
      return (
        <SuccessBanner title="Yêu cầu đã được xử lý hoàn tất">
          {request.final_resolution === 'REFUND' || request.requested_resolution === 'REFUND'
            ? returnRefundMessage(request.linked_refund_status)
            : 'Đơn hàng in bù thay thế đã được giao thành công đến bạn.'}
        </SuccessBanner>
      );
    default:
      return null;
  }
}
