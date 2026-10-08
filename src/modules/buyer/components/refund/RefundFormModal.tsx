import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, ImagePlus, Loader2, RotateCcw, Video, X } from 'lucide-react';
import { getApiErrorMessage } from '../../../../infrastructure/api/interceptors';
import { refundService, type RefundRequest } from '../../../order/services/refundService';

const reasons = [
  ['DAMAGED', 'Sản phẩm bị hư hỏng'],
  ['WRONG_DESCRIPTION', 'Không đúng mô tả'],
  ['PRINT_DEFECT', 'Lỗi in ấn'],
  ['MISSING_ITEM', 'Thiếu sản phẩm'],
  ['OTHER', 'Lý do khác'],
] as const;

interface RefundFormModalProps {
  isOpen: boolean;
  orderId: string;
  orderCode?: string;
  onClose: () => void;
  onSuccess: (request: RefundRequest) => void;
}

export function RefundFormModal({
  isOpen,
  orderId,
  orderCode,
  onClose,
  onSuccess,
}: RefundFormModalProps) {
  const [reason, setReason] = useState('');
  const [partial, setPartial] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState<Array<{ url: string; kind: 'image' | 'video'; name: string }>>([]);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Lock body scroll and listen for Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy && !uploadingEvidence) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, busy, uploadingEvidence, onClose]);

  if (!isOpen) return null;

  const uploadEvidenceFiles = async (files: FileList | null, kind: 'image' | 'video') => {
    const selected = Array.from(files || []);
    if (!selected.length) return;
    const currentCount = evidence.filter(item => item.kind === kind).length;
    const limit = kind === 'image' ? 3 : 1;
    if (currentCount + selected.length > limit) {
      setError(kind === 'image' ? 'Bạn chỉ có thể đính kèm tối đa 3 ảnh.' : 'Bạn chỉ có thể đính kèm tối đa 1 video.');
      return;
    }
    setError('');
    setUploadingEvidence(true);
    try {
      const uploaded: Array<{ url: string; kind: 'image' | 'video'; name: string }> = [];
      for (const file of selected) {
        const validType = kind === 'image'
          ? ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
          : ['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type);
        const maxBytes = kind === 'image' ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
        if (!validType) throw new Error(kind === 'image' ? 'Ảnh chỉ nhận JPG, PNG hoặc WebP.' : 'Video chỉ nhận MP4, WebM hoặc MOV.');
        if (file.size > maxBytes) throw new Error(kind === 'image' ? 'Ảnh tối đa 10MB mỗi tệp.' : 'Video tối đa 50MB.');
        const url = await refundService.uploadEvidence(file);
        uploaded.push({ url, kind, name: file.name });
      }
      setEvidence(prev => [...prev, ...uploaded]);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : getApiErrorMessage(uploadError, 'Tải minh chứng thất bại.'));
    } finally {
      setUploadingEvidence(false);
    }
  };

  const removeEvidence = (url: string) => {
    setEvidence(prev => prev.filter(item => item.url !== url));
  };

  const countImages = evidence.filter(item => item.kind === 'image').length;
  const hasVideo = evidence.some(item => item.kind === 'video');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!reason) {
      setError('Vui lòng chọn lý do yêu cầu hoàn tiền.');
      return;
    }
    if (!description.trim() || description.trim().length < 5) {
      setError('Vui lòng mô tả lý do hoàn tiền (tối thiểu 5 ký tự).');
      return;
    }
    if (evidence.length === 0) {
      setError('Vui lòng đính kèm ít nhất 1 ảnh hoặc video minh chứng.');
      return;
    }
    if (uploadingEvidence) {
      setError('Vui lòng đợi quá trình tải minh chứng hoàn tất.');
      return;
    }
    if (partial && (!amount || Number(amount) <= 0)) {
      setError('Vui lòng nhập số tiền đề nghị hoàn hợp lệ.');
      return;
    }

    setBusy(true);
    try {
      const result = await refundService.create(orderId, {
        reason_category: reason,
        description: description.trim(),
        evidence: evidence.map(item => item.url),
        refund_type: partial ? 'PARTIAL' : 'FULL',
        refund_amount: partial ? Number(amount) : undefined,
      });
      onSuccess(result);
    } catch (e) {
      setError(getApiErrorMessage(e, 'Không thể gửi yêu cầu hoàn tiền. Vui lòng thử lại.'));
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm transition-opacity"
      onMouseDown={e => {
        if (e.target === e.currentTarget && !busy && !uploadingEvidence) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="refund-modal-title"
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <RotateCcw size={20} className="font-bold" />
            </span>
            <div>
              <h2 id="refund-modal-title" className="text-base font-extrabold text-slate-900">
                Tạo yêu cầu hoàn tiền đơn hàng
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Mã đơn: <span className="font-mono font-semibold text-slate-700">{orderCode || orderId}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy || uploadingEvidence}
            aria-label="Đóng"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="refund-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Information banner */}
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-4">
            <p className="text-sm font-bold text-amber-950">Chính sách hỗ trợ hoàn tiền</p>
            <p className="mt-1 text-xs leading-5 text-amber-900">
              Yêu cầu hoàn tiền theo đơn hàng sẽ được gửi trực tiếp đến bên bán / xưởng in xem xét. Vui lòng cung cấp lý do chính xác kèm hình ảnh hoặc video minh chứng rõ ràng.
            </p>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <label htmlFor="refund-reason" className="block text-sm font-bold text-slate-800">
              Lý do yêu cầu <span className="text-rose-600">*</span>
            </label>
            <select
              id="refund-reason"
              required
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full min-h-11 rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-800 transition focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            >
              <option value="" disabled>Chọn lý do hoàn tiền</option>
              {reasons.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Refund Type Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-800">
              Hình thức hoàn tiền <span className="text-rose-600">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPartial(false)}
                className={`flex flex-col text-left p-3.5 rounded-xl border-2 transition ${
                  !partial
                    ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <span className="text-sm font-bold flex items-center gap-2">
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${!partial ? 'border-emerald-600 bg-emerald-600' : 'border-slate-400'}`}>
                    {!partial && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                  Hoàn toàn bộ
                </span>
                <span className="text-xs text-slate-500 mt-1 pl-6">
                  Hoàn trả 100% giá trị của toàn bộ đơn hàng
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPartial(true)}
                className={`flex flex-col text-left p-3.5 rounded-xl border-2 transition ${
                  partial
                    ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <span className="text-sm font-bold flex items-center gap-2">
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${partial ? 'border-emerald-600 bg-emerald-600' : 'border-slate-400'}`}>
                    {partial && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                  Hoàn một phần
                </span>
                <span className="text-xs text-slate-500 mt-1 pl-6">
                  Đề xuất số tiền cụ thể muốn được bồi hoàn
                </span>
              </button>
            </div>
          </div>

          {/* Partial amount input */}
          {partial && (
            <div className="space-y-1.5 animate-in fade-in duration-150">
              <label htmlFor="refund-amount" className="block text-sm font-bold text-slate-800">
                Số tiền đề xuất bồi hoàn (₫) <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <input
                  id="refund-amount"
                  required
                  type="number"
                  min="1000"
                  step="1000"
                  placeholder="Ví dụ: 100000"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full min-h-11 rounded-xl border border-slate-300 px-3.5 pr-10 text-sm font-medium focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₫</span>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="refund-description" className="block text-sm font-bold text-slate-800">
                Mô tả chi tiết lý do <span className="text-rose-600">*</span>
              </label>
              <span className="text-xs font-medium text-slate-500">
                {description.length}/3000 ký tự
              </span>
            </div>
            <textarea
              id="refund-description"
              required
              minLength={5}
              maxLength={3000}
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Vui lòng mô tả cụ thể vấn đề hư hỏng, thiếu hàng, lỗi in ấn hoặc tình trạng đơn hàng gặp phải..."
              className="w-full rounded-xl border border-slate-300 p-3.5 text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
            <span className="block text-xs text-slate-400">Tối thiểu 5 ký tự để người bán/xưởng in có đủ thông tin xem xét.</span>
          </div>

          {/* Evidence Upload */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-bold text-slate-800">
                Ảnh / video minh chứng <span className="text-rose-600">*</span>
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Bắt buộc ít nhất 1 tệp minh chứng · Tối đa 3 ảnh (JPG, PNG, WebP ≤ 10MB) và 1 video (MP4, WebM, MOV ≤ 50MB).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <label
                className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border px-3.5 text-xs font-bold transition ${
                  countImages >= 3 || uploadingEvidence
                    ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-emerald-500 hover:bg-emerald-50/50'
                }`}
              >
                <ImagePlus size={16} className={countImages >= 3 ? 'text-slate-400' : 'text-emerald-700'} />
                Thêm ảnh ({countImages}/3)
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  disabled={countImages >= 3 || uploadingEvidence}
                  className="sr-only"
                  onChange={e => {
                    void uploadEvidenceFiles(e.target.files, 'image');
                    e.target.value = '';
                  }}
                />
              </label>

              <label
                className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border px-3.5 text-xs font-bold transition ${
                  hasVideo || uploadingEvidence
                    ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-emerald-500 hover:bg-emerald-50/50'
                }`}
              >
                <Video size={16} className={hasVideo ? 'text-slate-400' : 'text-indigo-700'} />
                Thêm video ({hasVideo ? 1 : 0}/1)
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  disabled={hasVideo || uploadingEvidence}
                  className="sr-only"
                  onChange={e => {
                    void uploadEvidenceFiles(e.target.files, 'video');
                    e.target.value = '';
                  }}
                />
              </label>

              {uploadingEvidence && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <Loader2 size={14} className="animate-spin" />
                  Đang tải minh chứng lên...
                </span>
              )}
            </div>

            {/* Evidence previews */}
            {evidence.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {evidence.map(item => (
                  <div
                    key={item.url}
                    className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-2.5"
                  >
                    {item.kind === 'image' ? (
                      <img
                        src={item.url}
                        alt="Ảnh minh chứng"
                        className="h-14 w-14 rounded-lg border border-slate-200 object-cover shrink-0"
                      />
                    ) : (
                      <video
                        src={item.url}
                        preload="metadata"
                        className="h-14 w-20 rounded-lg bg-black object-cover shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-800">{item.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase mt-0.5">{item.kind}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEvidence(item.url)}
                      disabled={busy}
                      aria-label={`Gỡ ${item.name}`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error alert */}
          {error && (
            <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-600" />
              <span className="leading-5">{error}</span>
            </div>
          )}
        </form>

        {/* Sticky Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
          <p className="text-xs text-slate-500">
            <span className="text-rose-600 font-bold">*</span> Thông tin bắt buộc
          </p>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={busy || uploadingEvidence}
              className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Huỷ bỏ
            </button>
            <button
              type="submit"
              form="refund-form"
              disabled={busy || uploadingEvidence}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              {busy ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Đang gửi yêu cầu...
                </>
              ) : uploadingEvidence ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Đang tải minh chứng...
                </>
              ) : (
                'Gửi yêu cầu hoàn tiền'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
