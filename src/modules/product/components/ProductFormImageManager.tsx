import { useState, useRef, DragEvent } from 'react';
import { UploadCloud, Trash2, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { ProductImage } from './ProductImage';
import { uploadService } from '../../../shared/services/uploadService';
import { inputClass } from './form/formUi';

interface ProductFormImageManagerProps {
  images: string[];
  thumbnail: string;
  onChangeImages: (images: string[], thumbnail: string) => void;
}

const DROP_BASE =
  'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed text-center transition-colors ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#007700] disabled:cursor-not-allowed disabled:opacity-60';

export function ProductFormImageManager({ images, thumbnail, onChangeImages }: ProductFormImageManagerProps) {
  const [newImageUrl, setNewImageUrl] = useState('');
  const [showAddUrl, setShowAddUrl] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddImage = () => {
    const url = newImageUrl.trim();
    if (!url) return;
    onChangeImages([...images, url], thumbnail || url);
    setNewImageUrl('');
    setShowAddUrl(false);
  };

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const uploadRes = await uploadService.uploadMultiple(files, 'products');
      const updated = [...images, ...uploadRes.images.map((img) => img.url).filter(Boolean)];
      onChangeImages(updated, thumbnail || updated[0] || '');
    } catch (err: any) {
      console.error('Failed to upload images to Cloudinary:', err);
      setUploadError(err.response?.data?.error || err.message || 'Không tải được ảnh lên. Hãy thử lại.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    uploadFiles(Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/')));
  };

  const handleRemoveImage = (index: number) => {
    const removed = images[index];
    const updated = images.filter((_, i) => i !== index);
    onChangeImages(updated, thumbnail === removed ? updated[0] || '' : thumbnail || updated[0] || '');
  };

  const handleSetCover = (url: string) => onChangeImages([url, ...images.filter((img) => img !== url)], url);

  const dropTone = isDragging
    ? 'border-[#007700] bg-[#EAF0E2] text-[#005B00]'
    : 'border-stone-300 bg-stone-50 text-stone-600 hover:border-[#007700] hover:text-[#007700]';
  const pick = () => fileInputRef.current?.click();

  return (
    <div
      className="space-y-3"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => uploadFiles(Array.from(e.target.files || []))}
        className="hidden"
      />

      {images.length === 0 ? (
        <button type="button" disabled={isUploading} onClick={pick} className={`${DROP_BASE} ${dropTone} w-full gap-1 px-4 py-9`}>
          <span className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl border border-stone-200 bg-white text-[#007700]">
            {isUploading ? <Spinner /> : <UploadCloud size={24} aria-hidden />}
          </span>
          <span className="text-sm font-semibold text-stone-900">
            {isUploading ? 'Đang tải ảnh lên...' : 'Kéo ảnh vào đây hoặc bấm để chọn từ máy'}
          </span>
          <span className="text-xs text-stone-500">Có thể chọn nhiều ảnh cùng lúc.</span>
        </button>
      ) : (
        <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-4">
          {images.map((img, idx) => {
            const isCover = thumbnail ? thumbnail === img : idx === 0;
            return (
              <li key={idx} className={`overflow-hidden rounded-lg border bg-white ${isCover ? 'border-[#007700] ring-2 ring-[#007700]/15' : 'border-stone-200'}`}>
                <div className="aspect-square bg-stone-100">
                  <ProductImage src={img} alt={`Ảnh sản phẩm ${idx + 1}`} size="full" className="h-full w-full rounded-none border-none" />
                </div>
                <div className="flex h-9 items-center justify-between gap-1 border-t border-stone-200 pl-2.5 pr-1">
                  {isCover ? (
                    <span className="text-xs font-semibold text-[#007700]">Ảnh bìa</span>
                  ) : (
                    <button type="button" onClick={() => handleSetCover(img)} className="cursor-pointer text-xs font-medium text-stone-700 hover:text-[#007700] hover:underline">
                      Đặt làm bìa
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    title="Xóa ảnh"
                    aria-label={`Xóa ảnh ${idx + 1}`}
                    className="cursor-pointer rounded p-1.5 text-stone-500 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            );
          })}
          <li>
            <button type="button" disabled={isUploading} onClick={pick} className={`${DROP_BASE} ${dropTone} h-full min-h-32 w-full gap-1 p-2`}>
              {isUploading ? <Spinner /> : <UploadCloud size={22} aria-hidden />}
              <span className="text-xs font-semibold">{isUploading ? 'Đang tải...' : 'Thêm ảnh'}</span>
            </button>
          </li>
        </ul>
      )}

      {uploadError && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
          <AlertCircle size={14} className="shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {showAddUrl ? (
        <div className="flex items-center gap-2">
          <input
            type="url"
            placeholder="Dán link ảnh (VD: https://images.unsplash.com/...)"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              e.preventDefault();
              handleAddImage();
            }}
            className={inputClass(undefined, 'flex-1 min-w-0')}
          />
          <button
            type="button"
            onClick={handleAddImage}
            disabled={!newImageUrl.trim()}
            className="h-10 shrink-0 cursor-pointer rounded-lg bg-[#007700] px-4 text-[13px] font-semibold text-white hover:bg-[#005B00] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Thêm
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddUrl(true)}
          className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:underline"
        >
          <LinkIcon size={13} /> Dán link ảnh thay vì tải lên
        </button>
      )}
    </div>
  );
}

function Spinner() {
  return <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#007700] border-t-transparent" aria-hidden />;
}
