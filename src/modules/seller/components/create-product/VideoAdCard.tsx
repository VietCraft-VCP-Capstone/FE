import { useEffect, useRef, useState } from 'react';
import { Loader2, Film, Sparkles, AlertTriangle, Download } from 'lucide-react';
import { productsService, VideoAdQuota } from '../../../product/services/productsService';

interface Props {
    /** Ảnh mockup dùng làm khung hình gốc (thường là ảnh bìa). */
    imageUrl: string;
    title?: string;
}

const POLL_MS = 5000;

/**
 * Tạo video quảng cáo ~4s từ ảnh mockup. Mỗi lượt tạo là một khoản chi phí thật,
 * nên KHÔNG tự chạy: phải bấm nút + xác nhận, và có hiển thị số lượt còn lại.
 */
export function VideoAdCard({ imageUrl, title }: Props) {
    const [quota, setQuota] = useState<VideoAdQuota | null>(null);
    const [confirming, setConfirming] = useState(false);
    const [busy, setBusy] = useState(false);
    const [jobId, setJobId] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState('');
    const [err, setErr] = useState('');
    const alive = useRef(true);

    useEffect(() => {
        alive.current = true;
        productsService.getVideoAdQuota().then(q => alive.current && setQuota(q)).catch(() => {});
        return () => { alive.current = false; };
    }, []);

    // Đổi ảnh bìa → video cũ không còn khớp.
    useEffect(() => {
        setVideoUrl(''); setErr(''); setConfirming(false);
    }, [imageUrl]);

    // Polling trạng thái (không tốn tiền) — dừng khi xong/lỗi/unmount.
    useEffect(() => {
        if (!jobId) return;
        let timer: ReturnType<typeof setTimeout>;
        const tick = async () => {
            try {
                const r = await productsService.getVideoAdStatus(jobId);
                if (!alive.current) return;
                if (r.status === 'done' && r.videoUrl) {
                    setVideoUrl(r.videoUrl); setBusy(false); setJobId(null);
                    productsService.getVideoAdQuota().then(q => alive.current && setQuota(q)).catch(() => {});
                    return;
                }
                if (r.status === 'failed') {
                    setErr(r.error || 'Tạo video thất bại.'); setBusy(false); setJobId(null);
                    return;
                }
            } catch (e: any) {
                if (!alive.current) return;
                if (e.response?.status === 404) {
                    setErr('Tác vụ video không còn tồn tại, vui lòng thử lại.'); setBusy(false); setJobId(null);
                    return;
                }
            }
            timer = setTimeout(tick, POLL_MS);
        };
        timer = setTimeout(tick, POLL_MS);
        return () => clearTimeout(timer);
    }, [jobId]);

    const start = async () => {
        if (busy) return;
        setConfirming(false); setErr(''); setVideoUrl(''); setBusy(true);
        try {
            const r = await productsService.createVideoAd(imageUrl, title);
            if (r.quota) setQuota(r.quota);
            if (r.status === 'done' && r.videoUrl) { setVideoUrl(r.videoUrl); setBusy(false); }
            else if (r.status === 'failed') { setErr(r.error || 'Tạo video thất bại.'); setBusy(false); }
            else setJobId(r.jobId);
        } catch (e: any) {
            setErr(e.response?.data?.error || 'Không tạo được video quảng cáo.');
            setBusy(false);
        }
    };

    const disabled = !quota?.enabled || (quota?.remaining ?? 0) <= 0 || !imageUrl;

    return (
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm" id="video-ad-card">
            <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-[260px] shrink-0">
                    <div className="aspect-[9/16] max-h-[360px] mx-auto rounded-xl overflow-hidden bg-gradient-to-br from-[#f0f7f0] to-stone-100 border border-stone-200 flex items-center justify-center relative">
                        {videoUrl ? (
                            <video src={videoUrl} controls autoPlay loop muted playsInline className="w-full h-full object-contain bg-black" />
                        ) : busy ? (
                            <div className="flex flex-col items-center gap-3 text-stone-500 px-4 text-center">
                                <Loader2 size={32} className="animate-spin text-[#1a6b1a]" />
                                <span className="text-xs font-semibold">Đang dựng video...</span>
                                <span className="text-[11px] text-stone-400">Thường mất 1–3 phút, bạn có thể làm việc khác ở trang này.</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-stone-400">
                                <Film size={36} />
                                <span className="text-xs font-semibold">Chưa có video</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-bold text-stone-900">3. Video quảng cáo AI</h3>
                            <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-[#edf5ed] text-[#1a6b1a]">
                                ~{quota?.durationSec ?? 4} giây
                            </span>
                        </div>
                        <p className="text-xs text-stone-500">
                            AI dựng video ngắn từ ảnh mockup đang chọn làm ảnh bìa để dùng quảng cáo sản phẩm.
                            Mỗi lượt tạo có tính phí, vì vậy hệ thống chỉ tạo khi bạn bấm nút.
                        </p>
                        {quota && (
                            <p className="text-xs font-semibold text-stone-600 mt-2">
                                Lượt tạo còn lại hôm nay: <b className="text-[#1a6b1a]">{quota.remaining}</b>/{quota.limit}
                            </p>
                        )}
                    </div>

                    {err && (
                        <div className="px-3 py-2 rounded-lg text-xs font-medium bg-red-50 border border-red-200 text-red-700 flex items-start gap-2">
                            <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {err}
                        </div>
                    )}
                    {quota && !quota.enabled && (
                        <div className="px-3 py-2 rounded-lg text-xs font-medium bg-amber-50 border border-amber-200 text-amber-800">
                            Tính năng tạo video AI hiện chưa được bật.
                        </div>
                    )}

                    {confirming ? (
                        <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 flex flex-col gap-2">
                            <span className="text-xs text-amber-900 font-medium">
                                Thao tác này sẽ dùng 1 lượt tạo video có tính phí. Tiếp tục?
                            </span>
                            <div className="flex gap-2">
                                <button id="video-ad-confirm" type="button" onClick={start}
                                    className="px-4 py-2 rounded-lg text-xs font-bold bg-[#1a6b1a] text-white hover:bg-[#155615]">
                                    Đồng ý tạo video
                                </button>
                                <button type="button" onClick={() => setConfirming(false)}
                                    className="px-4 py-2 rounded-lg text-xs font-bold bg-white border border-stone-300 text-stone-700 hover:bg-stone-50">
                                    Hủy
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {!videoUrl && (
                                <button id="video-ad-create" type="button" disabled={disabled || busy}
                                    onClick={() => setConfirming(true)}
                                    className="px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-[#1a6b1a] text-white hover:bg-[#155615] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                    <Sparkles size={14} /> Tạo video quảng cáo
                                </button>
                            )}
                            {videoUrl && (
                                <a href={videoUrl} download target="_blank" rel="noreferrer"
                                    className="px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-white border border-stone-300 text-stone-700 hover:bg-stone-50">
                                    <Download size={14} /> Tải video
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default VideoAdCard;
