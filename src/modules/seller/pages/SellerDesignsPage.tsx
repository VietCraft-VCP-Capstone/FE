import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { productsService } from '../../product/services/productsService';
import {
  Upload, Trash2, Loader2, Plus, Sparkles, AlertCircle, FileImage, ZoomIn, X
} from 'lucide-react';

import { useToast } from '../../../shared/components/Toast';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';

const API_ORIGIN = 'http://localhost:8080';
const abs = (u: string) => (u?.startsWith('http') ? u : `${API_ORIGIN}${u}`);

export function SellerDesignsPage() {
  const { showToast } = useToast();
  const [designs, setDesigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewDesign, setPreviewDesign] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [designToDelete, setDesignToDelete] = useState<{ id: string; name: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadDesigns = async () => {
    try {
      setLoading(true);
      const data = await productsService.getMyDesigns();
      setDesigns(data);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Không tải được danh sách thiết kế', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDesigns();
  }, []);

  const handleUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const newDesign = await productsService.uploadDesign(file, file.name);
      setDesigns(prev => [newDesign, ...prev]);
      showToast(`Đã tải lên thiết kế "${file.name}" thành công!`, 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Tải ảnh thiết kế thất bại', 'error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = (id: string, name: string) => {
    setDesignToDelete({ id, name });
  };

  const handleConfirmDelete = async () => {
    if (!designToDelete) return;
    const { id, name } = designToDelete;
    setDeletingId(id);
    try {
      await productsService.deleteDesign(id);
      setDesigns(prev => prev.filter(d => d._id !== id));
      showToast(`Đã xoá thiết kế "${name}"`, 'success');
      if (previewDesign?._id === id) setPreviewDesign(null);
      setDesignToDelete(null);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Xoá hình thiết kế thất bại', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight font-jakarta">
            Kho ảnh thiết kế & Artwork
          </h1>
          <p className="text-sm text-stone-500 mt-1 font-normal">
            Quản lý tài nguyên hình in PNG, SVG gốc để thiết kế lên các phôi sản phẩm POD.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            ref={fileRef}
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) void handleUpload(file);
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#007700] hover:bg-[#005B00] text-white text-sm font-bold rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer font-jakarta disabled:opacity-60"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {uploading ? 'Đang tải...' : 'Tải thiết kế lên'}
          </button>
          <Link
            to="/seller/products/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-sm font-bold rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer font-jakarta no-underline"
          >
            <Sparkles size={16} /> Thiết kế Canvas POD
          </Link>
        </div>
      </div>

      {/* Info Card */}
      <div className="flex items-center gap-3 p-4 bg-[#EAF0E2] border border-[#BECAB6] rounded-2xl text-xs text-[#005B00]">
        <AlertCircle size={18} className="shrink-0" />
        <span>
          Khuyên dùng định dạng <b>PNG trong suốt (Transparent Background)</b> độ phân giải cao (từ 1000px trở lên) để sản phẩm in ra sắc nét nhất trên Canvas 2D/3D.
        </span>
      </div>

      {/* Main Grid Content */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(n => (
            <div key={n} className="h-56 bg-stone-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : designs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white border border-stone-200 rounded-2xl text-center space-y-4 shadow-2xs">
          <div className="w-16 h-16 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center">
            <FileImage size={32} />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900 font-jakarta">Chưa có ảnh thiết kế nào</h3>
            <p className="text-xs text-stone-500 max-w-sm mt-1">
              Hãy tải hình in đầu tiên lên để bắt đầu phối thiết kế lên các mẫu phôi áo thun, ly cốc và quà tặng craft.
            </p>
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-[#007700] hover:bg-[#005B00] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer font-jakarta"
          >
            <Plus size={15} /> Tải ảnh ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {designs.map((design: any) => (
            <div
              key={design._id}
              className="group relative bg-white border border-stone-200 rounded-2xl overflow-hidden hover:border-[#007700] hover:shadow-md transition-all flex flex-col"
            >
              {/* Image Preview Container */}
              <div className="relative aspect-square bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:12px_12px] bg-stone-50 flex items-center justify-center p-3 overflow-hidden">
                <img
                  src={abs(design.file_url)}
                  alt={design.name}
                  className="max-h-full max-w-full object-contain drop-shadow-xs transition-transform duration-200 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[1px]">
                  <button
                    type="button"
                    onClick={() => setPreviewDesign(design)}
                    className="p-2 rounded-xl bg-white/90 text-stone-800 hover:bg-white hover:text-black transition-colors cursor-pointer"
                    title="Xem chi tiết"
                  >
                    <ZoomIn size={16} />
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === design._id}
                    onClick={() => handleDelete(design._id, design.name)}
                    className="p-2 rounded-xl bg-rose-500/90 text-white hover:bg-rose-600 transition-colors cursor-pointer"
                    title="Xoá"
                  >
                    {deletingId === design._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                </div>
              </div>

              {/* Info Footer */}
              <div className="p-3 border-t border-stone-100 bg-white flex-1 flex flex-col justify-between">
                <div className="truncate text-xs font-bold text-stone-800 font-jakarta" title={design.name}>
                  {design.name}
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px] text-stone-400">
                  <span>{design.width_px && design.height_px ? `${design.width_px}×${design.height_px}px` : 'PNG'}</span>
                  <span className="uppercase text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                    {design.storage || 'Local'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {previewDesign && (
        <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl relative animate-fade-in">
            <button
              type="button"
              onClick={() => setPreviewDesign(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-stone-100 text-stone-500 cursor-pointer"
            >
              <X size={20} />
            </button>
            <h3 className="text-base font-bold text-stone-900 font-jakarta pr-8 truncate">
              {previewDesign.name}
            </h3>
            <div className="bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] bg-stone-50 border border-stone-200 rounded-xl p-6 flex items-center justify-center max-h-[380px] overflow-hidden">
              <img
                src={abs(previewDesign.file_url)}
                alt={previewDesign.name}
                className="max-h-[340px] max-w-full object-contain"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-stone-500">
              <div>
                Kích thước: <b>{previewDesign.width_px} × {previewDesign.height_px} px</b>
              </div>
              <Link
                to="/seller/products/new"
                className="flex items-center gap-1.5 text-[#007700] hover:underline font-bold font-jakarta"
              >
                <Sparkles size={14} /> Đưa vào Canvas ngay
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận xóa thiết kế */}
      <ConfirmModal
        isOpen={!!designToDelete}
        variant="danger"
        title="Xác nhận xóa thiết kế"
        message={`Bạn có chắc muốn xoá hình thiết kế "${designToDelete?.name}"?\n\nThao tác này không thể hoàn tác.`}
        confirmLabel="Xóa thiết kế"
        cancelLabel="Hủy"
        isLoading={!!deletingId}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDesignToDelete(null)}
      />
    </div>
  );
}

export default SellerDesignsPage;
