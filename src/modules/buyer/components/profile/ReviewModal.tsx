import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Star, X, Upload, CheckCircle2, AlertCircle, Loader2, Store, Check, Award } from 'lucide-react';
import { reviewService } from '../../../product/services/reviewService';
import { getApiErrorMessage } from '../../../../infrastructure/api/interceptors';

export interface OrderItem {
    productId: string;
    variantId?: string;
    quantity?: number;
    price: number;
    title?: string;
    name?: string;
    color?: string;
    size?: string;
    image?: string;
    thumbnail?: string;
    _id?: string;
    is_reviewed?: boolean;
}

export interface OrderForReview {
    id: string;
    shopName?: string;
    shopLogo?: string;
    items: OrderItem[];
    is_reviewed?: boolean;
}

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: OrderForReview | null;
    initialProductId?: string;
    onSuccess: (orderId: string, productId: string) => void;
}

const RATING_LABELS: Record<number, string> = {
    1: '1★: Rất tệ',
    2: '2★: Không hài lòng',
    3: '3★: Bình thường',
    4: '4★: Hài lòng',
    5: '5★: Cực kỳ ưng ý & tuyệt vời!'
};

const FALLBACK_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=150';

export const ReviewModal: React.FC<ReviewModalProps> = ({
    isOpen,
    onClose,
    order,
    initialProductId,
    onSuccess
}) => {
    const [selectedItemIndex, setSelectedItemIndex] = useState<number>(0);
    const [rating, setRating] = useState<number>(5);
    const [hoveredRating, setHoveredRating] = useState<number>(0);
    const [comment, setComment] = useState<string>('');
    const [images, setImages] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [checkingExisting, setCheckingExisting] = useState<boolean>(false);
    const [existingReview, setExistingReview] = useState<any | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Khóa cuộn trang nền khi modal đang mở
    useEffect(() => {
        if (!isOpen) return;
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [isOpen]);

    // Chuẩn hóa danh sách items
    const items = useMemo(() => {
        if (!order?.items) return [];
        return order.items;
    }, [order]);

    // Tự động chọn sản phẩm mục tiêu hoặc sản phẩm đầu tiên chưa đánh giá khi mở modal
    useEffect(() => {
        if (isOpen && order?.items && order.items.length > 0) {
            if (initialProductId) {
                const targetIdx = order.items.findIndex(it => (it.productId || it._id) === initialProductId);
                if (targetIdx >= 0) {
                    setSelectedItemIndex(targetIdx);
                    return;
                }
            }
            const firstUnreviewed = order.items.findIndex(it => !it.is_reviewed);
            if (firstUnreviewed >= 0) {
                setSelectedItemIndex(firstUnreviewed);
            } else {
                setSelectedItemIndex(0);
            }
        }
    }, [isOpen, order, initialProductId]);

    const selectedItem = items.length > 0 ? items[selectedItemIndex] || items[0] : null;

    // Reset form khi mở modal hoặc thay đổi sản phẩm được chọn
    useEffect(() => {
        if (!isOpen || !order || !selectedItem) {
            setRating(5);
            setHoveredRating(0);
            setComment('');
            setImages([]);
            setErrorMessage(null);
            setExistingReview(null);
            return;
        }

        let isCancelled = false;
        setCheckingExisting(true);
        setErrorMessage(null);

        const prodId = selectedItem.productId || selectedItem._id || '';

        reviewService.getOrderProductReview(order.id, prodId)
            .then(res => {
                if (isCancelled) return;
                if (res?.hasReviewed && res.review) {
                    setExistingReview(res.review);
                    setRating(res.review.rating || 5);
                    setComment(res.review.comment || res.review.text || '');
                    setImages(res.review.images || []);
                } else {
                    setExistingReview(null);
                    setRating(5);
                    setComment('');
                    setImages([]);
                }
            })
            .catch(() => {
                if (!isCancelled) {
                    setExistingReview(null);
                }
            })
            .finally(() => {
                if (!isCancelled) {
                    setCheckingExisting(false);
                }
            });

        return () => {
            isCancelled = true;
        };
    }, [isOpen, order, selectedItemIndex, selectedItem]);

    if (!isOpen || !order || !selectedItem) return null;

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (images.length >= 5) {
            setErrorMessage('Bạn chỉ có thể đính kèm tối đa 5 hình ảnh.');
            return;
        }

        setIsUploading(true);
        setErrorMessage(null);
        try {
            const uploadedUrl = await reviewService.uploadReviewImage(file);
            setImages(prev => [...prev, uploadedUrl]);
        } catch (err) {
            try {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (typeof reader.result === 'string') {
                        setImages(prev => [...prev, reader.result as string]);
                    }
                };
                reader.readAsDataURL(file);
            } catch {
                setErrorMessage(getApiErrorMessage(err, 'Không thể tải ảnh lên, vui lòng thử lại.'));
            }
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const handleRemoveImage = (idxToRemove: number) => {
        setImages(prev => prev.filter((_, i) => i !== idxToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!comment.trim()) {
            setErrorMessage('Vui lòng nhập nội dung đánh giá của bạn.');
            return;
        }

        setIsSubmitting(true);
        setErrorMessage(null);

        const prodId = selectedItem.productId || selectedItem._id || '';

        try {
            if (existingReview?.id) {
                await reviewService.updateReview(existingReview.id, {
                    orderId: order.id,
                    productId: prodId,
                    rating,
                    comment: comment.trim(),
                    images
                });
            } else {
                await reviewService.createReview({
                    orderId: order.id,
                    productId: prodId,
                    rating,
                    comment: comment.trim(),
                    images
                });
            }

            onSuccess(order.id, prodId);
            onClose();
        } catch (err: any) {
            setErrorMessage(getApiErrorMessage(err, 'Lưu đánh giá không thành công. Vui lòng thử lại.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentDisplayRating = hoveredRating || rating;

    const modalContent = (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm overflow-hidden animate-fadeIn"
            style={{ zIndex: 9999 }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            {/* 1. Container chính: max-w-2xl w-full max-h-[88vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col */}
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[88vh] shadow-2xl overflow-hidden flex flex-col relative my-auto animate-in fade-in zoom-in-95 duration-200">
                {/* 1.1 Header cố định (Sticky Header) */}
                <div className="border-b border-gray-100 px-6 py-4 bg-white flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
                            <Award size={22} className="stroke-[2.2]" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900 text-base sm:text-lg leading-tight">
                                Đánh giá sản phẩm
                            </h2>
                            <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mt-0.5">
                                <Store size={12} className="text-gray-400" />
                                <span className="font-semibold text-gray-700 truncate max-w-[160px] sm:max-w-[240px]">
                                    {order.shopName || 'Gian hàng VietCraft'}
                                </span>
                                <span>•</span>
                                <span className="font-mono text-gray-500">#{order.id}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700 cursor-pointer"
                        title="Đóng modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form bao bọc Body cuộn và Footer cố định */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                    {/* 1.2 Body cuộn độc lập (overflow-y-auto px-6 py-5 space-y-6 flex-1 min-h-0 custom-scrollbar) */}
                    <div className="overflow-y-auto px-6 py-5 space-y-6 flex-1 min-h-0 custom-scrollbar overscroll-contain">
                        {/* Error Alert Banner */}
                        {errorMessage && (
                            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-semibold flex items-center gap-2.5 shadow-xs">
                                <AlertCircle size={16} className="text-rose-500 shrink-0" />
                                <span className="flex-1">{errorMessage}</span>
                            </div>
                        )}

                        {/* 2. Danh sách chọn sản phẩm (Horizontal Scroll / Compact Chips) */}
                        <div>
                            <div className="flex items-center justify-between mb-2.5">
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Sản phẩm trong đơn {items.length > 1 ? `(${items.length})` : ''}
                                </label>
                                {items.length > 1 && (
                                    <span className="text-[11px] text-gray-400 font-medium">
                                        Chọn sản phẩm cần đánh giá
                                    </span>
                                )}
                            </div>

                            {items.length > 1 ? (
                                <div className="flex gap-3 overflow-x-auto pb-2 pt-0.5 no-scrollbar scroll-smooth">
                                    {items.map((it, idx) => {
                                        const isSelected = selectedItemIndex === idx;
                                        const itemTitle = it.title || it.name || 'Sản phẩm thủ công';
                                        const itemImage = it.image || it.thumbnail || '';
                                        const itemPrice = Number(it.price || 0);
                                        const variantText = `${it.color || ''} ${it.size || ''}`.trim();
                                        const itemKey = it.productId || it._id || `${idx}-${itemTitle}`;

                                        return (
                                            <button
                                                key={itemKey}
                                                type="button"
                                                onClick={() => setSelectedItemIndex(idx)}
                                                className={`w-[270px] p-3 rounded-2xl border text-left transition-all flex items-center gap-3 shrink-0 relative cursor-pointer ${
                                                    isSelected
                                                        ? 'border-2 border-emerald-600 bg-emerald-50/60 shadow-xs ring-2 ring-emerald-600/20'
                                                        : 'border border-gray-200 hover:border-gray-300 bg-white shadow-2xs'
                                                }`}
                                            >
                                                <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-150 shrink-0 bg-stone-50 flex items-center justify-center">
                                                    {itemImage ? (
                                                        <img
                                                            src={itemImage}
                                                            alt=""
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE;
                                                            }}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <Store size={22} className="text-stone-400" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1 pr-6">
                                                    <h4 className="text-sm font-semibold text-gray-800 line-clamp-1 leading-snug" title={itemTitle}>
                                                        {itemTitle}
                                                    </h4>
                                                    {variantText && (
                                                        <p className="text-xs text-gray-500 truncate mt-0.5">
                                                            Phân loại: {variantText}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center justify-between mt-1 gap-1">
                                                        <span className="text-xs font-semibold text-emerald-600">
                                                            {itemPrice.toLocaleString('vi-VN')}đ
                                                        </span>
                                                        {it.is_reviewed && (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                                                                <CheckCircle2 size={10} /> Đã đánh giá
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                                                        <Check size={12} strokeWidth={3} />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                /* Trường hợp đơn 1 sản phẩm: Thẻ mỏng gọn gàng */
                                <div className="p-3.5 rounded-2xl border-2 border-emerald-600 bg-emerald-50/60 shadow-xs flex items-center gap-3.5 relative">
                                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-150 shrink-0 bg-stone-50 flex items-center justify-center">
                                        {selectedItem.image || selectedItem.thumbnail ? (
                                            <img
                                                src={selectedItem.image || selectedItem.thumbnail}
                                                alt=""
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE;
                                                }}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Store size={22} className="text-stone-400" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1 pr-6">
                                        <h4 className="text-sm font-semibold text-gray-800 line-clamp-1 leading-snug">
                                            {selectedItem.title || selectedItem.name || 'Sản phẩm thủ công'}
                                        </h4>
                                        {Boolean(`${selectedItem.color || ''} ${selectedItem.size || ''}`.trim()) && (
                                            <p className="text-xs text-gray-500 truncate mt-0.5">
                                                Phân loại: {`${selectedItem.color || ''} ${selectedItem.size || ''}`.trim()}
                                            </p>
                                        )}
                                        <div className="flex items-center justify-between mt-1 gap-2">
                                            <span className="text-xs font-semibold text-emerald-600">
                                                {Number(selectedItem.price || 0).toLocaleString('vi-VN')}đ
                                            </span>
                                            {selectedItem.is_reviewed && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                                                    <CheckCircle2 size={10} /> Đã đánh giá
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                                        <Check size={12} strokeWidth={3} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Trạng thái kiểm tra hoặc Form đánh giá / chỉnh sửa */}
                        {checkingExisting ? (
                            <div className="py-10 text-center text-xs text-gray-400 flex items-center justify-center gap-2.5">
                                <Loader2 size={18} className="animate-spin text-emerald-600" />
                                <span>Đang kiểm tra lịch sử đánh giá sản phẩm...</span>
                            </div>
                        ) : (
                            <>
                                {existingReview && (
                                    <div className="p-3.5 bg-amber-50/90 border border-amber-200/80 rounded-2xl text-xs text-amber-900 font-semibold flex items-center gap-2 shadow-xs">
                                        <CheckCircle2 size={16} className="text-amber-600 shrink-0" />
                                        <span>Bạn đang xem/chỉnh sửa đánh giá đã gửi cho sản phẩm này. Bạn có thể thay đổi số sao, nhận xét, ảnh và nhấn <strong>Lưu thay đổi</strong>.</span>
                                    </div>
                                )}

                                {/* 3. Khu vực Đánh giá sao (Interactive Star Rating) */}
                                <div className="bg-amber-50/40 border border-amber-100/80 rounded-2xl py-5 px-4 text-center shadow-xs">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-2">
                                        Chất lượng sản phẩm
                                    </label>
                                    <div className="flex justify-center items-center gap-3 my-2">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setRating(s)}
                                                onMouseEnter={() => setHoveredRating(s)}
                                                onMouseLeave={() => setHoveredRating(0)}
                                                className="p-1 transition-transform hover:scale-110 active:scale-95 cursor-pointer focus:outline-none"
                                                title={`${s} sao - ${RATING_LABELS[s]}`}
                                            >
                                                <Star
                                                    size={36}
                                                    className={`transition-colors ${
                                                        s <= currentDisplayRating
                                                            ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                                                            : 'text-gray-200 hover:text-gray-300'
                                                    }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-sm font-medium text-amber-700 mt-2 transition-all">
                                        {RATING_LABELS[currentDisplayRating] || ''}
                                    </p>
                                </div>

                                {/* 4.1 Khung Nhận xét */}
                                <div>
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-2">
                                        Nhận xét chi tiết
                                    </label>
                                    <div className="border border-gray-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 rounded-2xl p-4 bg-gray-50/50 transition-all shadow-xs">
                                        <textarea
                                            rows={3}
                                            value={comment}
                                            onChange={e => setComment(e.target.value)}
                                            placeholder="Hãy chia sẻ cảm nhận của bạn về chất lượng sản phẩm, độ hoàn thiện thủ công, độ sắc nét và dịch vụ đóng gói..."
                                            maxLength={500}
                                            className="bg-transparent resize-none w-full text-sm text-gray-800 placeholder-gray-400 outline-none min-h-[90px] leading-relaxed"
                                        />
                                        <div className="flex justify-between items-center text-xs text-gray-400 font-mono mt-2 pt-2 border-t border-gray-100">
                                            <span className="font-sans text-[11px]">Tối thiểu 5 ký tự</span>
                                            <span className={comment.length >= 480 ? 'text-amber-600 font-bold' : ''}>
                                                {comment.length}/500 ký tự
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* 4.2 Upload hình ảnh thực tế (Tối đa 5 ảnh) */}
                                <div>
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-2">
                                        Hình ảnh thực tế (Tối đa 5 ảnh)
                                    </label>
                                    <div className="flex flex-wrap gap-3 items-center">
                                        {images.map((img, i) => (
                                            <div
                                                key={i}
                                                className="w-20 h-20 rounded-2xl overflow-hidden border border-gray-200 relative group shadow-xs shrink-0"
                                            >
                                                <img src={img} alt="" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveImage(i)}
                                                    className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/60 hover:bg-rose-600 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                                                    title="Xóa ảnh"
                                                >
                                                    <X size={12} strokeWidth={2.5} />
                                                </button>
                                            </div>
                                        ))}

                                        {images.length < 5 && (
                                            <label className="w-20 h-20 border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:text-emerald-600 transition-colors cursor-pointer bg-gray-50 shrink-0">
                                                {isUploading ? (
                                                    <Loader2 size={18} className="animate-spin text-emerald-600" />
                                                ) : (
                                                    <>
                                                        <Upload size={18} />
                                                        <span className="text-[10px] font-semibold mt-1">Thêm ảnh</span>
                                                    </>
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/png,image/jpeg,image/webp"
                                                    onChange={handleImageUpload}
                                                    disabled={isUploading}
                                                    className="hidden"
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* 1.3 Footer cố định (Sticky Footer) */}
                    <div className="border-t border-gray-100 px-6 py-4 bg-gray-50/90 backdrop-blur-sm flex justify-end gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 text-sm font-semibold transition-colors cursor-pointer"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || isUploading || !comment.trim()}
                            className="px-6 py-2.5 rounded-xl bg-[#15803d] hover:bg-[#166534] disabled:opacity-50 text-white text-sm font-bold transition-all shadow-sm hover:shadow-md flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed active:scale-[0.98]"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>{existingReview ? 'Đang lưu thay đổi...' : 'Đang gửi đánh giá...'}</span>
                                </>
                            ) : (
                                <>
                                    <Star size={16} className="fill-white text-white" />
                                    <span>{existingReview ? 'Lưu thay đổi' : 'Gửi đánh giá'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

export default ReviewModal;
