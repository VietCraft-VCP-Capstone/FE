import React, { useState, useEffect } from 'react';
import { Star, X, Upload, CheckCircle2, AlertCircle, Loader2, Store, Trash2, Check } from 'lucide-react';
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
}

export interface OrderForReview {
    id: string;
    shopName?: string;
    shopLogo?: string;
    items: OrderItem[];
}

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: OrderForReview | null;
    onSuccess: (orderId: string, productId: string) => void;
}

const RATING_LABELS: Record<number, string> = {
    1: 'Rất không hài lòng',
    2: 'Chưa hài lòng',
    3: 'Bình thường',
    4: 'Hài lòng',
    5: 'Cực kỳ hài lòng & tuyệt vời!'
};

export const ReviewModal: React.FC<ReviewModalProps> = ({
    isOpen,
    onClose,
    order,
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

    // Chuẩn hóa danh sách items duy nhất để tránh lặp trùng
    const items = React.useMemo(() => {
        if (!order?.items) return [];
        return order.items;
    }, [order]);

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
        if (existingReview) return;

        if (!comment.trim()) {
            setErrorMessage('Vui lòng nhập nội dung đánh giá của bạn.');
            return;
        }

        setIsSubmitting(true);
        setErrorMessage(null);

        const prodId = selectedItem.productId || selectedItem._id || '';

        try {
            await reviewService.createReview({
                orderId: order.id,
                productId: prodId,
                rating,
                comment: comment.trim(),
                images
            });

            onSuccess(order.id, prodId);
            onClose();
        } catch (err: any) {
            setErrorMessage(getApiErrorMessage(err, 'Gửi đánh giá không thành công. Vui lòng thử lại.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentDisplayRating = hoveredRating || rating;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[200] flex items-center justify-center p-4 overflow-y-auto">
            {/* Modal Container: max-w-2xl w-full max-h-[85vh] overflow-y-auto rounded-2xl p-6 */}
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl space-y-5 flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#15803d]">
                            <Star size={22} className="fill-[#15803d]" />
                        </div>
                        <div>
                            <h2 className="font-extrabold text-gray-900 text-lg leading-tight">Đánh giá sản phẩm</h2>
                            <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mt-0.5">
                                <Store size={13} className="text-gray-400" />
                                <span className="font-semibold text-gray-700">{order.shopName || 'Gian hàng VietCraft'}</span>
                                <span>•</span>
                                <span>Mã đơn: #{order.id}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700 cursor-pointer"
                        title="Đóng modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                    <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2.5">
                        <AlertCircle size={16} className="text-red-500 shrink-0" />
                        <span>{errorMessage}</span>
                    </div>
                )}

                {/* PHÂN KHU 1: Chọn sản phẩm trong đơn (Dạng thẻ ngang nhỏ gọn, highlight border sản phẩm chọn) */}
                <div>
                    <label className="text-xs font-bold text-gray-800 uppercase tracking-wider block mb-2.5">
                        1. Sản phẩm đánh giá {items.length > 1 ? `(${items.length} sản phẩm)` : ''}
                    </label>
                    <div className={`grid gap-2.5 ${items.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                        {items.map((it, idx) => {
                            const isSelected = selectedItemIndex === idx;
                            const itemTitle = it.title || it.name || 'Sản phẩm thủ công';
                            const itemImage = it.image || it.thumbnail || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=150';
                            const itemPrice = Number(it.price || 0);
                            const variantText = `${it.color || ''} ${it.size || ''}`.trim();
                            const itemKey = it.productId || it._id || `${idx}-${itemTitle}`;

                            return (
                                <button
                                    key={itemKey}
                                    type="button"
                                    onClick={() => setSelectedItemIndex(idx)}
                                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                                        isSelected
                                            ? 'border-[#15803d] bg-emerald-50/40 ring-2 ring-[#15803d]/30 shadow-xs'
                                            : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/50'
                                    }`}
                                >
                                    <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-stone-100">
                                        <img
                                            src={itemImage}
                                            alt={itemTitle}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="text-xs font-bold text-gray-900 line-clamp-1">
                                            {itemTitle}
                                        </h4>
                                        {variantText && (
                                            <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                                                Phân loại: {variantText}
                                            </p>
                                        )}
                                        <span className="text-xs font-extrabold text-[#15803d] mt-1 block">
                                            {itemPrice.toLocaleString('vi-VN')}đ
                                        </span>
                                    </div>
                                    {isSelected && (
                                        <div className="w-6 h-6 rounded-full bg-[#15803d] text-white flex items-center justify-center shrink-0">
                                            <Check size={14} strokeWidth={3} />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Trạng thái đã đánh giá */}
                {checkingExisting ? (
                    <div className="py-8 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                        <Loader2 size={16} className="animate-spin text-[#15803d]" />
                        <span>Đang kiểm tra lịch sử đánh giá sản phẩm...</span>
                    </div>
                ) : existingReview ? (
                    <div className="p-5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                        <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                            <CheckCircle2 size={18} className="text-[#15803d]" />
                            <span>Bạn đã đánh giá sản phẩm này cho đơn hàng #{order.id}</span>
                        </div>
                        <div className="flex items-center gap-1.5 pt-1">
                            {[1, 2, 3, 4, 5].map(s => (
                                <Star
                                    key={s}
                                    size={20}
                                    className={s <= (existingReview.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
                                />
                            ))}
                            <span className="text-xs font-bold text-amber-700 ml-2">
                                {existingReview.rating}/5 sao ({RATING_LABELS[existingReview.rating || 5]})
                            </span>
                        </div>
                        <p className="text-xs text-gray-800 italic bg-white p-3.5 rounded-xl border border-emerald-100 leading-relaxed">
                            "{existingReview.comment || existingReview.text}"
                        </p>
                        {Array.isArray(existingReview.images) && existingReview.images.length > 0 && (
                            <div className="flex gap-2 pt-1 flex-wrap">
                                {existingReview.images.map((img: string, i: number) => (
                                    <img
                                        key={i}
                                        src={img}
                                        alt=""
                                        className="w-16 h-16 rounded-xl object-cover border border-emerald-200 shadow-xs"
                                    />
                                ))}
                            </div>
                        )}
                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full py-2.5 bg-white border border-emerald-300 hover:bg-emerald-50 text-[#15803d] font-bold text-xs rounded-xl transition-colors cursor-pointer"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Form đánh giá khi chưa đánh giá */
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* PHÂN KHU 2: Chọn số sao đánh giá (Star rating to, rõ ràng, căn giữa) */}
                        <div className="text-center py-4 px-3 bg-amber-50/40 rounded-2xl border border-amber-200/60">
                            <label className="text-xs font-bold text-gray-800 uppercase tracking-wider block mb-2">
                                2. Đánh giá chất lượng sản phẩm
                            </label>
                            <div className="flex justify-center items-center gap-3 my-2">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setRating(s)}
                                        onMouseEnter={() => setHoveredRating(s)}
                                        onMouseLeave={() => setHoveredRating(0)}
                                        className="p-1 transition-transform hover:scale-125 focus:outline-none cursor-pointer active:scale-95"
                                        title={`${s} sao - ${RATING_LABELS[s]}`}
                                    >
                                        <Star
                                            size={36}
                                            className={`transition-colors ${
                                                s <= currentDisplayRating
                                                    ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                                                    : 'text-gray-200 hover:text-gray-300'
                                            }`}
                                        />
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs font-bold text-amber-700 h-5 mt-1 transition-all">
                                {RATING_LABELS[currentDisplayRating] || ''}
                            </p>
                        </div>

                        {/* PHÂN KHU 3: Ô nhập nhận xét (Textarea padding thoáng, placeholder thân thiện, đếm ký tự 0/500) */}
                        <div>
                            <label className="text-xs font-bold text-gray-800 uppercase tracking-wider block mb-2">
                                3. Nhận xét chi tiết
                            </label>
                            <textarea
                                rows={4}
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                placeholder="Hãy chia sẻ cảm nhận của bạn về chất lượng sản phẩm, độ hoàn thiện thủ công, độ sắc nét và dịch vụ đóng gói..."
                                maxLength={500}
                                className="w-full border border-gray-200 rounded-xl p-3.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#15803d] focus:border-[#15803d] shadow-xs resize-none placeholder:text-gray-400 leading-relaxed"
                            />
                            <div className="flex justify-between text-[11px] text-gray-400 mt-1.5 px-0.5 font-medium">
                                <span>Tối thiểu 5 ký tự</span>
                                <span className={comment.length >= 480 ? 'text-amber-600 font-bold' : ''}>
                                    {comment.length}/500
                                </span>
                            </div>
                        </div>

                        {/* PHÂN KHU 4: Khung tải ảnh thực tế (Upload box gọn gàng, hiển thị preview ảnh thumbnail) */}
                        <div>
                            <label className="text-xs font-bold text-gray-800 uppercase tracking-wider block mb-2">
                                4. Hình ảnh thực tế (Tối đa 5 ảnh)
                            </label>
                            <div className="flex flex-wrap gap-3 items-center">
                                {images.map((img, i) => (
                                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 group shadow-xs">
                                        <img src={img} alt={`review-${i}`} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImage(i)}
                                            className="absolute top-1 right-1 w-6 h-6 bg-black/70 hover:bg-rose-600 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
                                            title="Xóa ảnh"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}

                                {images.length < 5 && (
                                    <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#15803d] flex flex-col items-center justify-center cursor-pointer text-gray-400 hover:text-[#15803d] transition-all bg-gray-50/60 hover:bg-emerald-50/20">
                                        {isUploading ? (
                                            <Loader2 size={18} className="animate-spin text-[#15803d]" />
                                        ) : (
                                            <>
                                                <Upload size={18} />
                                                <span className="text-[10px] font-bold mt-1">Thêm ảnh</span>
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

                        {/* Submit Actions */}
                        <div className="flex gap-3 pt-3 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 border border-gray-300 hover:bg-gray-100 text-xs font-bold text-gray-700 rounded-xl flex-1 transition-all cursor-pointer"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || isUploading || !comment.trim()}
                                className="px-5 py-2.5 bg-[#15803d] hover:bg-[#166534] disabled:opacity-50 text-white text-xs font-bold rounded-xl flex-[2] flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>Đang gửi đánh giá...</span>
                                    </>
                                ) : (
                                    <>
                                        <Star size={16} className="fill-white" />
                                        <span>Gửi đánh giá</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ReviewModal;
