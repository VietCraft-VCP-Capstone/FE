import { CheckCircle2, Clock3, Scale, XCircle } from 'lucide-react';
import { labels, NODE_CLASS, statusTone, translateTimelineReason } from './returnDisplay';

const nodeIcon = (status?: string) => {
  if (status === 'DISPUTED') return Scale;
  const tone = statusTone(status);
  return tone === 'rose' ? XCircle : tone === 'emerald' ? CheckCircle2 : Clock3;
};

export function ReturnTimeline({ timeline }: { timeline: any[] }) {
  return (
    <section className="flex flex-col h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4 min-h-[58px]">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800">
          <Clock3 size={19} />
        </span>
        <div>
          <h2 className="font-bold text-slate-950">Diễn biến</h2>
          <p className="text-xs text-slate-500">Lịch sử cập nhật yêu cầu</p>
        </div>
      </div>

      <div className="flex-1 mt-5">
        {timeline.length ? (
          <ol className="relative space-y-0">
            {timeline.map((event, index) => {
              const NodeIcon = nodeIcon(event.to_status);
              return (
                <li key={event.event_id || index} className="relative flex gap-3.5 pb-6 last:pb-0">
                  <div className="relative flex flex-col items-center">
                    <span className={`relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-bold transition ${NODE_CLASS[statusTone(event.to_status)]}`}>
                      <NodeIcon size={14} />
                    </span>
                    {index < timeline.length - 1 && <span className="absolute top-7 bottom-0 w-0.5 bg-slate-200" />}
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <p className="text-sm font-bold text-slate-900">{labels[event.to_status] || event.to_status || 'Cập nhật'}</p>
                      {event.created_at && <span className="text-xs text-slate-400">{new Date(event.created_at).toLocaleString('vi-VN')}</span>}
                    </div>
                    {event.reason && (
                      <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs leading-relaxed text-slate-700">
                        {translateTimelineReason(event.reason)}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="flex h-full min-h-[140px] items-center justify-center text-sm text-slate-400">Chưa có cập nhật mới.</div>
        )}
      </div>
    </section>
  );
}
