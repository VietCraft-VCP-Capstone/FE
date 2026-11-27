import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { catalogService } from '../../services/catalogService';

interface ProposeCategoryModalProps {
    open: boolean;
    categories: any[];
    onClose: () => void;
    onProposed?: () => void;
}

export function ProposeCategoryModal({ open, categories, onClose, onProposed }: ProposeCategoryModalProps) {
    const [catName, setCatName] = useState('');
    const [catParentId, setCatParentId] = useState('');
    const [catDesc, setCatDesc] = useState('');
    const [submittingCat, setSubmittingCat] = useState(false);
    const [catMessage, setCatMessage] = useState<{ text: string; ok: boolean } | null>(null);

    const handleProposeCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!catName.trim()) return;
        setSubmittingCat(true);
        setCatMessage(null);
        try {
            await catalogService.proposeCategory({
                name: catName.trim(),
                parent_id: catParentId || undefined,
                description: catDesc.trim() || undefined,
            });
            setCatMessage({ text: 'Đã gửi đề xuất thành công! Vui lòng chờ Ban quản trị duyệt.', ok: true });
            setCatName('');
            setCatDesc('');
            setCatParentId('');
            onProposed?.();
            setTimeout(() => {
                onClose();
                setCatMessage(null);
            }, 1800);
        } catch (err: any) {
            setCatMessage({ text: err.response?.data?.error || err.message || 'Không thể gửi đề xuất.', ok: false });
        } finally {
            setSubmittingCat(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                    <h3 className="text-base font-bold text-stone-900">Đề xuất danh mục mới</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-stone-400 hover:text-stone-600 p-1"
                    >
                        <X size={18} />
                    </button>
                </div>
                <form onSubmit={handleProposeCategory} className="mt-4 space-y-3.5">
                    {catMessage && (
                        <div className={`p-3 rounded-xl text-xs font-semibold ${catMessage.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                            {catMessage.text}
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">Tên danh mục đề xuất *</label>
                        <input
                            type="text"
                            required
                            value={catName}
                            onChange={e => setCatName(e.target.value)}
                            placeholder="VD: Đồ gốm thủ công, Tranh dệt thổ cẩm..."
                            className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs outline-none focus:border-[#007700]"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">Danh mục cha (Tùy chọn)</label>
                        <select
                            value={catParentId}
                            onChange={e => setCatParentId(e.target.value)}
                            className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs outline-none focus:border-[#007700] bg-white"
                        >
                            <option value="">— Không có (danh mục gốc) —</option>
                            {categories.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">Mô tả hoặc lý do đề xuất (Tùy chọn)</label>
                        <textarea
                            rows={2}
                            value={catDesc}
                            onChange={e => setCatDesc(e.target.value)}
                            placeholder="Nêu ngắn gọn sản phẩm dự kiến bán thuộc danh mục này..."
                            className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs outline-none focus:border-[#007700]"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3.5 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={submittingCat || !catName.trim()}
                            className="px-4 py-2 text-xs font-bold text-white bg-[#007700] hover:bg-[#005B00] rounded-xl flex items-center gap-1.5 disabled:opacity-50"
                        >
                            {submittingCat && <Loader2 size={13} className="animate-spin" />}
                            Gửi yêu cầu đề xuất
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
