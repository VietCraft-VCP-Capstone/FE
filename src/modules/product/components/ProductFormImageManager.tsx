import { useState, useRef, ChangeEvent } from 'react';
import { UploadCloud, Trash2, Check, FolderOpen, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { ProductImage } from './ProductImage';
import { uploadService } from '../../../shared/services/uploadService';

interface ProductFormImageManagerProps {
  images: string[];
  thumbnail: string;
  onChangeImages: (images: string[], thumbnail: string) => void;
}

export function ProductFormImageManager({
  images,
  thumbnail,
  onChangeImages,
}: ProductFormImageManagerProps) {
  const [newImageUrl, setNewImageUrl] = useState('');
  const [showAddUrl, setShowAddUrl] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    const updated = [...images, newImageUrl.trim()];
    const newThumb = thumbnail || newImageUrl.trim();
    onChangeImages(updated, newThumb);
    setNewImageUrl('');
    setShowAddUrl(false);
  };

  const handleDeviceUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const uploadRes = await uploadService.uploadMultiple(files, 'products');
      const uploadedUrls = uploadRes.images.map(img => img.url).filter(Boolean);

      const updated = [...images, ...uploadedUrls];
      const newThumb = thumbnail || updated[0] || '';
      onChangeImages(updated, newThumb);
    } catch (err: any) {
      console.error('Failed to upload images to Cloudinary:', err);
      setUploadError(err.response?.data?.error || err.message || 'Không thể tải ảnh lên Cloudinary.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    const newThumb = updated[0] || '';
    onChangeImages(updated, newThumb);
  };

  const handleSetCover = (url: string) => {
    onChangeImages(images, url);
  };

  return (
    <div className="space-y-3">
      {/* Hidden File Input for Device Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleDeviceUpload}
        className="hidden"
      />

      <div className="flex items-center justify-between flex-wrap gap-2">
        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
          Hình ảnh sản phẩm / Mockup <span className="text-rose-500">*</span>
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs font-semibold text-[#007700] hover:text-[#005B00] flex items-center gap-1.5 cursor-pointer font-jakarta bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 transition-all hover:bg-emerald-100/70"
          >
            <FolderOpen size={14} /> Chọn ảnh từ máy
          </button>
          <button
            type="button"
            onClick={() => setShowAddUrl(!showAddUrl)}
            className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1 cursor-pointer font-jakarta"
          >
            <LinkIcon size={13} /> Dán link URL
          </button>
        </div>
      </div>

      {showAddUrl && (
        <div className="flex items-center gap-2 p-3 bg-stone-50 border border-stone-200 rounded-xl animate-fade-in">
          <input
            type="url"
            placeholder="Dán link ảnh (VD: https://images.unsplash.com/...)"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            className="flex-1 px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#007700]"
          />
          <button
            type="button"
            onClick={handleAddImage}
            className="px-3.5 py-2 bg-[#007700] text-white text-xs font-bold rounded-lg hover:bg-[#005B00] cursor-pointer shadow-xs"
          >
            Thêm
          </button>
        </div>
      )}

      {uploadError && (
        <div className="flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 animate-fade-in">
          <AlertCircle size={14} className="shrink-0 text-rose-600" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Images Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {images.map((img, idx) => {
          const isCover = thumbnail === img;
          return (
            <div
              key={idx}
              className={`group relative aspect-square rounded-xl border-2 overflow-hidden bg-stone-100 transition-all ${
                isCover
                  ? 'border-[#007700] ring-2 ring-[#007700]/20 shadow-xs'
                  : 'border-stone-200 hover:border-stone-400'
              }`}
            >
              <ProductImage src={img} alt="Product preview" size="full" className="w-full h-full border-none rounded-none" />

              {isCover && (
                <span className="absolute top-1.5 left-1.5 bg-[#007700] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5 z-10 font-jakarta">
                  <Check size={10} /> Ảnh bìa
                </span>
              )}

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 z-20">
                {!isCover && (
                  <button
                    type="button"
                    onClick={() => handleSetCover(img)}
                    className="p-1.5 bg-white text-stone-900 rounded-lg text-[10px] font-bold hover:bg-stone-100 cursor-pointer shadow-xs"
                    title="Đặt làm ảnh bìa"
                  >
                    Bìa
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 cursor-pointer shadow-xs"
                  title="Xóa ảnh"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="aspect-square rounded-xl border-2 border-dashed border-stone-300 hover:border-[#007700] bg-stone-50/60 hover:bg-[#EAF0E2]/30 flex flex-col items-center justify-center text-stone-400 hover:text-[#007700] transition-colors cursor-pointer p-2 text-center group disabled:opacity-60 disabled:cursor-not-allowed"
          title="Bấm để chọn file ảnh từ máy tính hoặc điện thoại"
        >
          {isUploading ? (
            <>
              <div className="w-5 h-5 border-2 border-[#007700] border-t-transparent rounded-full animate-spin mb-1.5" />
              <span className="text-[10px] font-bold font-jakarta text-[#007700]">Đang tải...</span>
            </>
          ) : (
            <>
              <UploadCloud size={22} className="mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold font-jakarta">Tải từ máy</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
