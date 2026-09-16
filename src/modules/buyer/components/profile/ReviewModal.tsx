import React, { useState, useEffect } from 'react';
import { Star, X, Upload, CheckCircle2, AlertCircle, Loader2, Store, Trash2 } from 'lucide-react';
import { reviewService } from '../../../product/services/reviewService';
import { getApiErrorMessage } from '../../../../infrastructure/api/interceptors';

export interface OrderItem {
    productId: string;
    variantId: string;
    quantity: number;
    price: number;
    title?: string;
    color?: string;
    size?: string;
    image?: string;
}

export interface OrderForReview {
    id: string;
    shopName: string;
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

    const selectedItem = order?.items && order.items.length > 0 ? order.items[selectedItemIndex] : null;

    // Reset form when modal opens or selected item changes
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

        // Check if current product has already been reviewed
        let isCancelled = false;
        setCheckingExisting(true);
        setErrorMessage(null);

        reviewService.getOrderProductReview(order.id, selectedItem.productId)
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
    }, [isOpen, order, selectedItemIndex]);

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
            // Nếu upload trực tiếp chưa cấu hình Cloudinary hoặc lỗi, fallback dùng Data URL tạm thời
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

        try {
            await reviewService.createReview({
                orderId: order.id,
                productId: selectedItem.productId,
                rating,
                comment: comment.trim(),
                images
            });

            onSuccess(order.id, selectedItem.productId);
            onClose();
        } catch (err: any) {
            setErrorMessage(getApiErrorMessage(err, 'Gửi đánh giá không thành công. Vui lòng thử lại.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentDisplayRating = hoveredRating || rating;

    return (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <Star size={18} className="fill-emerald-500 text-emerald-500" />
                        </div>
                        <div>
                            <h2 className="font-extrabold text-gray-900 text-base leading-tight">Đánh giá sản phẩm</h2>
                            <p className="text-[11px] text-gray-500 font-medium flex items-center gap-1.5 mt-0.5">
                                <Store size={12} className="text-gray-400" />
                                <span>{order.shopName}</span>
                                <span>•</span>
                                <span>Đơn hàng: #{order.id}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                    {/* Error Banner */}
                    {errorMessage && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
                            <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {/* Product Selector (If order has multiple items) */}
                    {order.items.length > 1 && (
                        <div>
                            <label className="text-xs font-bold text-gray-700 block mb-2">
                                Sản phẩm trong đơn hàng ({order.items.length} sản phẩm):
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {order.items.map((it, idx) => {
                                    const isSelected = selectedItemIndex === idx;
                                    return (
                                        <button
                                            key={it.productId || idx}
                                            type="button"
                                            onClick={() => setSelectedItemIndex(idx)}
                                            className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-left transition-all ${
                                                isSelected
                                                    ? 'border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500 shadow-sm'
                                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                            }`}
                                        >
                                            <img
                                                src={it.image || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=100'}
                                                alt={it.title}
                                                className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-gray-100"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <h5 className="text-xs font-bold text-gray-900 truncate">{it.title}</h5>
                                                <p className="text-[11px] text-gray-500 font-semibold">
                                                    {it.price.toLocaleString('vi-VN')}đ
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Selected Product Banner */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50/70 border border-gray-100 rounded-xl">
                        <img
                            src={selectedItem.image || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=150'}
                            alt={selectedItem.title}
                            className="w-14 h-14 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                            <h4 className="font-extrabold text-gray-900 text-xs leading-snug line-clamp-1">{selectedItem.title}</h4>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                                Phân loại: {`${selectedItem.color || ''} ${selectedItem.size || ''}`.trim() || 'Mặc định'}
                            </p>
                            <span className="text-xs font-black text-emerald-600">
                                {selectedItem.price.toLocaleString('vi-VN')}đ
                            </span>
                        </div>
                    </div>

                    {/* Existing Review Notice */}
                    {checkingExisting ? (
                        <div className="py-8 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                            <Loader2 size={16} className="animate-spin text-emerald-600" />
                            <span>Đang kiểm tra lịch sử đánh giá...</span>
                        </div>
                    ) : existingReview ? (
                        <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
                            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                                <CheckCircle2 size={16} className="text-emerald-600" />
                                <span>Bạn đã đánh giá sản phẩm này cho đơn hàng này</span>
                            </div>
                            <div className="flex items-center gap-1.5 pt-1">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <Star
                                        key={s}
                                        size={18}
                                        className={s <= (existingReview.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
                                    />
                                ))}
                                <span className="text-xs font-extrabold text-amber-600 ml-2">
                                    {existingReview.rating}/5 sao
                                </span>
                            </div>
                            <p className="text-xs text-gray-700 italic bg-white p-2.5 rounded-lg border border-emerald-100">
                                "{existingReview.comment || existingReview.text}"
                            </p>
                        </div>
                    ) : (
                        /* Review Form */
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Rating Stars Selection */}
                            <div className="text-center py-2 bg-amber-50/30 rounded-xl border border-amber-100/60">
                                <span className="text-xs font-bold text-gray-700 block mb-1.5">
                                    Chất lượng sản phẩm
                                </span>
                                <div className="flex justify-center items-center gap-2">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setRating(s)}
                                            onMouseEnter={() => setHoveredRating(s)}
                                            onMouseLeave={() => setHoveredRating(0)}
                                            className="p-1 transition-transform hover:scale-125 focus:outline-none"
                                        >
                                            <Star
                                                size={32}
                                                className={`transition-colors ${
                                                    s <= currentDisplayRating
                                                        ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                                                        : 'text-gray-200 hover:text-gray-300'
                                                }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs font-bold text-amber-600 mt-1 h-4">
                                    {RATING_LABELS[currentDisplayRating] || ''}
                                </p>
                            </div>

                            {/* Comment Input */}
                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">
                                    Nhận xét của bạn:
                                </label>
                                <textarea
                                    rows={4}
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                    placeholder="Hãy chia sẻ cảm nhận của bạn về chất lượng sản phẩm, độ hoàn thiện thủ công, độ sắc nét và dịch vụ đóng gói..."
                                    maxLength={500}
                                    className="w-full border border-gray-200 rounded-xl p-3 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                                />
                                <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                                    <span>Tối thiểu 5 ký tự</span>
                                    <span>{comment.length}/500</span>
                                </div>
                            </div>

                            {/* Photos Feedback Upload */}
                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1.5">
                                    Hình ảnh thực tế (Tối đa 5 ảnh):
                                </label>
                                <div className="flex flex-wrap gap-2 items-center">
                                    {images.map((img, i) => (
                                        <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 group">
                                            <img src={img} alt={`review-${i}`} className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(i)}
                                                className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={10} />
                                            </button>
                                        </div>
                                    ))}

                                    {images.length < 5 && (
                                        <label className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 hover:border-emerald-500 flex flex-col items-center justify-center cursor-pointer text-gray-400 hover:text-emerald-600 transition-colors bg-gray-50/50 hover:bg-emerald-50/20">
                                            {isUploading ? (
                                                <Loader2 size={16} className="animate-spin text-emerald-600" />
                                            ) : (
                                                <>
                                                    <Upload size={16} />
                                                    <span className="text-[9px] font-bold mt-1">Thêm ảnh</span>
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
                            <div className="flex gap-2 pt-2 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2.5 border border-gray-250 hover:bg-gray-50 text-xs font-bold text-gray-600 rounded-xl flex-1 transition-all"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || isUploading || !comment.trim()}
                                    className="px-4 py-2.5 bg-[#008000] hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex-[2] flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-[0.98]"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            <span>Đang gửi đánh giá...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Star size={14} className="fill-white" />
                                            <span>Gửi đánh giá</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReviewModal;
