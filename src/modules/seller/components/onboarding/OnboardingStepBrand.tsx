import { SellerBrandSettings } from '../../types/settings';
import { Store, UploadCloud, Camera, Trash2, Loader2 } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { uploadService } from '../../../../shared/services/uploadService';
import { useToast } from '../../../../shared/components/Toast';

interface OnboardingStepBrandProps {
  data: SellerBrandSettings;
  onChange: (data: SellerBrandSettings) => void;
}

export function OnboardingStepBrand({ data, onChange }: OnboardingStepBrandProps) {
  const { showToast } = useToast();
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleBannerFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('Kích thước ảnh bìa vượt quá 10MB. Vui lòng chọn ảnh nhỏ hơn.', 'error');
      return;
    }

    try {
      setUploadingBanner(true);
      const res = await uploadService.uploadImage(file, 'shops');
      onChange({ ...data, bannerUrl: res.url });
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Tải ảnh bìa lên thất bại.', 'error');
    } finally {
      setUploadingBanner(false);
      e.target.value = '';
    }
  };

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('Kích thước logo vượt quá 10MB. Vui lòng chọn ảnh nhỏ hơn.', 'error');
      return;
    }

    try {
      setUploadingLogo(true);
      const res = await uploadService.uploadImage(file, 'shops');
      onChange({ ...data, logoUrl: res.url });
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Tải logo lên thất bại.', 'error');
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={bannerInputRef}
        onChange={handleBannerFile}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={logoInputRef}
        onChange={handleLogoFile}
        accept="image/*"
        className="hidden"
      />

      <div className="text-center max-w-lg mx-auto mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#EAF0E2] text-[#007700] mb-3">
          <Store size={24} />
        </div>
        <h3 className="text-xl font-extrabold text-stone-900 font-jakarta">
          Bước 1: Nhận diện Thương hiệu & Gian hàng
        </h3>
        <p className="text-xs text-stone-500 mt-1">
          Tạo dấu ấn độc đáo cho gian hàng sáng tạo của bạn trên VietCraft Marketplace.
        </p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-xs space-y-6">
        {/* Banner and Logo Storefront Preview */}
        <div className="relative rounded-2xl overflow-visible bg-stone-50 pb-14 border border-stone-200/80">
          <div
            onClick={() => bannerInputRef.current?.click()}
            className="relative w-full h-44 sm:h-52 rounded-t-2xl overflow-hidden bg-gradient-to-br from-stone-100 via-stone-50 to-emerald-50/40 cursor-pointer group flex items-center justify-center select-none"
          >
            {uploadingBanner && (
              <div className="absolute inset-0 bg-black/50 z-10 flex flex-col items-center justify-center text-white backdrop-blur-xs">
                <Loader2 size={28} className="animate-spin mb-1" />
                <span className="text-[11px] font-bold font-jakarta">Đang tải ảnh bìa...</span>
              </div>
            )}
            {data.bannerUrl ? (
              <>
                <img
                  src={data.bannerUrl}
                  alt="Banner preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white">
                  <div className="px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-xl text-xs font-bold flex items-center gap-1.5 font-jakarta">
                    <Camera size={14} />
                    <span>Đổi ảnh bìa</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange({ ...data, bannerUrl: '' });
                  }}
                  className="absolute top-2.5 right-2.5 p-1.5 bg-black/60 hover:bg-rose-600 text-white rounded-lg backdrop-blur-sm transition-colors"
                  title="Xóa ảnh bìa"
                >
                  <Trash2 size={13} />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-4 space-y-1.5">
                <div className="w-10 h-10 rounded-xl bg-white shadow-2xs border border-stone-200 text-[#007700] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <UploadCloud size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-800 font-jakarta">Tải lên ảnh bìa gian hàng</p>
                  <p className="text-[11px] text-stone-400">Khuyến nghị 1200 x 300px (Tối đa 10MB)</p>
                </div>
              </div>
            )}
          </div>

          {/* Overlapping Logo Circle */}
          <div className="absolute -bottom-2 left-6 flex items-end gap-3.5">
            <div
              onClick={() => logoInputRef.current?.click()}
              className="relative group w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white bg-white shadow-md overflow-hidden flex items-center justify-center shrink-0 cursor-pointer hover:ring-2 hover:ring-[#007700] transition-all"
              title="Tải Logo"
            >
              {uploadingLogo && (
                <div className="absolute inset-0 bg-black/60 z-10 flex flex-col items-center justify-center text-white">
                  <Loader2 size={20} className="animate-spin" />
                </div>
              )}
              {data.logoUrl ? (
                <>
                  <img
                    src={data.logoUrl}
                    alt="Logo preview"
                    className="w-full h-full object-cover rounded-full"
                  />
                  <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                    <Camera size={16} />
                    <span className="text-[9px] font-bold mt-0.5 font-jakarta">Đổi logo</span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#EAF0E2] text-[#007700] hover:bg-emerald-100 transition-colors">
                  <Camera size={20} className="mb-0.5" />
                  <span className="text-[10px] font-extrabold font-jakarta">Tải logo</span>
                </div>
              )}
            </div>

            <div className="pb-1">
              <h4 className="text-sm font-extrabold text-stone-900 font-jakarta">
                {data.storeName || 'Tên gian hàng'}
              </h4>
              <p className="text-[11px] text-stone-400 font-mono">
                vietcraft.vn/shop/{data.slug || 'slug-cua-ban'}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
              Tên gian hàng / Thương hiệu sáng tạo <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={data.storeName}
              onChange={e => onChange({ ...data, storeName: e.target.value })}
              placeholder="VD: VietCraft Concept Store, Urban Creator Studio..."
              className="w-full px-4 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
              Đường dẫn gian hàng (Slug)
            </label>
            <div className="flex items-center rounded-xl border border-stone-200 bg-stone-50/80 overflow-hidden">
              <span className="px-3 py-2 text-[11px] text-stone-500 font-mono bg-stone-100 border-r border-stone-200 select-none">
                vietcraft.vn/shop/
              </span>
              <input
                type="text"
                value={data.slug}
                onChange={e => onChange({ ...data, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                className="flex-1 px-3 py-2 bg-transparent text-xs text-stone-900 font-mono focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
              Nhóm sản phẩm & Phong cách
            </label>
            <input
              type="text"
              value={data.mainCategory || ''}
              onChange={e => onChange({ ...data, mainCategory: e.target.value })}
              placeholder="VD: Thời trang Streetwear, Tranh Canvas, Quà tặng..."
              className="w-full px-4 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
              Hotline liên hệ <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              value={data.hotline}
              onChange={e => onChange({ ...data, hotline: e.target.value })}
              placeholder="0988 123 456"
              className="w-full px-4 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
              Email nhận thông báo <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              value={data.email}
              onChange={e => onChange({ ...data, email: e.target.value })}
              placeholder="shop@vietcraft.vn"
              className="w-full px-4 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700]"
              required
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
              Địa chỉ cửa hàng / Điểm gửi hàng
            </label>
            <input
              type="text"
              value={data.workshopAddress}
              onChange={e => onChange({ ...data, workshopAddress: e.target.value })}
              placeholder="VD: Số 18 Đường Tân Trào, P. Tân Phú, Quận 7, TP.HCM"
              className="w-full px-4 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnboardingStepBrand;
