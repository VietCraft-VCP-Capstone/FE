import React, { useState } from 'react';
import { Check, Layers, Loader2, X } from 'lucide-react';
import { catalogService } from '../../seller/services/catalogService';
import { CatalogOption } from '../types/product';

interface ProposeCategoryModalProps {
  categories: CatalogOption[];
  onClose: () => void;
  onCreated: (name: string) => void;
}

const FIELD = 'w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#007700] focus:border-[#007700]';

export function ProposeCategoryModal({ categories, onClose, onCreated }: ProposeCategoryModalProps) {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [desc, setDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setMsg(null);
    try {
      await catalogService.proposeCategory({
        name: name.trim(),
        parent_id: parentId || undefined,
        description: desc.trim() || undefined,
      });
      setMsg({ text: 'Đã tạo danh mục thành công và có thể dùng ngay!', ok: true });
      onCreated(name.trim());
      setTimeout(onClose, 1000);
    } catch (err: any) {
      setMsg({ text: err.response?.data?.error || err.message || 'Gửi đề xuất danh mục thất bại.', ok: false });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-stone-200 max-w-md w-full p-6 relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>
        <div className="flex items-center gap-2 mb-2 text-[#007700]">
          <Layers size={20} />
          <h3 className="text-base font-bold text-stone-900 font-jakarta">Đề xuất danh mục mới</h3>
        </div>
        <p className="text-xs text-stone-500 mb-5 leading-relaxed">
          Yêu cầu sẽ được gửi tới Ban quản trị VietCraft. Sau khi được duyệt, danh mục sẽ hiển thị trên toàn hệ thống và trong bộ lọc sản phẩm.
        </p>
        {msg && (
          <div className={`p-3 rounded-xl text-xs mb-4 ${msg.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
            {msg.text}
          </div>
        )}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Tên danh mục <span className="text-rose-500">*</span>
            </label>
            <input type="text" required placeholder="Ví dụ: Đồ gốm men lam, Nến thơm..." value={name} onChange={e => setName(e.target.value)} className={FIELD} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Danh mục cha (tuỳ chọn)</label>
            <select value={parentId} onChange={e => setParentId(e.target.value)} className={FIELD}>
              <option value="">-- Thuộc cấp cao nhất (Không có cha) --</option>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Mô tả / Lý do đề xuất (tuỳ chọn)</label>
            <textarea rows={3} placeholder="Nêu đặc điểm hoặc lý do nên mở thêm danh mục này..." value={desc} onChange={e => setDesc(e.target.value)} className={FIELD} />
          </div>
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer">
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#007700] hover:bg-[#005B00] text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50 transition-all font-jakarta cursor-pointer"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Gửi đề xuất
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
