import React, { useState, useRef } from 'react';
import { SellerBrandSettings } from '../../types/settings';
import {
  UploadCloud,
  Store,
  Phone,
  Mail,
  MapPin,
  Globe,
  Sparkles,
  Check,
  Camera,
  Trash2,
  Loader2
} from 'lucide-react';
import { uploadService } from '../../../../shared/services/uploadService';

interface GeneralSettingsTabProps {
  initialData: SellerBrandSettings;
  onSave: (data: SellerBrandSettings) => void;
  loading?: boolean;
}

export function GeneralSettingsTab({ initialData, onSave, loading = false }: GeneralSettingsTabProps) {
  const [formData, setFormData] = useState<SellerBrandSettings>(initialData);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  // Banner file upload handler
  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Kích thước ảnh bìa vượt quá 10MB. Vui lòng chọn ảnh nhỏ hơn.');
      return;
    }

    try {
      setUploadingBanner(true);
      const res = await uploadService.uploadImage(file, 'shops');
      setFormData(prev => ({ ...prev, bannerUrl: res.url }));
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Tải ảnh bìa lên thất bại.');
    } finally {
      setUploadingBanner(false);
      e.target.value = '';
    }
  };

  // Logo file upload handler
  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Kích thước logo vượt quá 10MB. Vui lòng chọn ảnh nhỏ hơn.');
      return;
    }

    try {
      setUploadingLogo(true);
      const res = await uploadService.uploadImage(file, 'shops');
      setFormData(prev => ({ ...prev, logoUrl: res.url }));
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Tải logo lên thất bại.');
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in font-sans">
      {/* Hidden Native File Inputs */}
      <input
        type="file"
        ref={bannerFileInputRef}
        onChange={handleBannerFileChange}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={logoFileInputRef}
        onChange={handleLogoFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* 1. BRAND IDENTITY & MEDIA HERO CARD */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-stone-100">
          <h2 className="text-lg font-extrabold text-stone-900 font-jakarta flex items-center gap-2">
            <Sparkles size={18} className="text-[#007700]" />
            <span>Nhận diện thương hiệu & Hình ảnh gian hàng</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Ảnh bìa và logo đại diện xuất hiện trực tiếp trên trang gian hàng của bạn và danh sách sản phẩm.
          </p>
        </div>

        {/* Hero Visual Preview Container */}
        <div className="p-6">
          <div className="relative rounded-2xl overflow-visible bg-stone-50 pb-16 border border-stone-200/80">
            {/* Banner Section */}
            <div
              onClick={() => bannerFileInputRef.current?.click()}
              className="relative w-full h-48 sm:h-64 rounded-t-2xl overflow-hidden bg-gradient-to-br from-stone-100 via-stone-50 to-emerald-50/40 cursor-pointer group select-none flex items-center justify-center transition-all"
            >
              {uploadingBanner && (
                <div className="absolute inset-0 bg-black/50 z-10 flex flex-col items-center justify-center text-white backdrop-blur-xs">
                  <Loader2 size={32} className="animate-spin mb-2" />
                  <span className="text-xs font-bold font-jakarta">Đang tải ảnh bìa lên Cloudinary...</span>
                </div>
              )}
              {formData.bannerUrl ? (
                <>
                  <img
                    src={formData.bannerUrl}
                    alt="Ảnh bìa gian hàng"
                    className="w-full h-full object-cover"
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white">
                    <div className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-xl text-xs font-bold flex items-center gap-2 font-jakarta">
                      <Camera size={15} />
                      <span>Nhấp để thay đổi ảnh bìa</span>
                    </div>
                  </div>

                  {/* Remove Banner Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormData(prev => ({ ...prev, bannerUrl: '' }));
                    }}
                    className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-rose-600 text-white rounded-xl backdrop-blur-md transition-colors shadow-sm cursor-pointer"
                    title="Xóa ảnh bìa"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-6 space-y-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-stone-200 text-[#007700] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <UploadCloud size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-stone-800 font-jakarta">
                      Nhấp để tải lên ảnh bìa gian hàng
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5 font-normal">
                      Khuyến nghị tỷ lệ 4:1 (1200 x 300px) • PNG, JPG, WebP tối đa 10MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Overlapping Logo & Storefront Info Strip */}
            <div className="absolute -bottom-2 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 pointer-events-none">
              {/* Circular Overlapping Logo Avatar */}
              <div className="flex items-end gap-4 pointer-events-auto">
                <div
                  onClick={() => logoFileInputRef.current?.click()}
                  className="relative group w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden flex items-center justify-center shrink-0 cursor-pointer hover:ring-4 hover:ring-[#007700]/20 transition-all"
                  title="Nhấp để tải Logo gian hàng"
                >
                  {uploadingLogo && (
                    <div className="absolute inset-0 bg-black/60 z-10 flex flex-col items-center justify-center text-white">
                      <Loader2 size={24} className="animate-spin" />
                    </div>
                  )}
                  {formData.logoUrl ? (
                    <>
                      <img
                        src={formData.logoUrl}
                        alt="Logo gian hàng"
                        className="w-full h-full object-cover rounded-full"
                      />
                      <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                        <Camera size={20} />
                        <span className="text-[10px] font-bold mt-1 font-jakarta">Đổi logo</span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#EAF0E2] text-[#007700] hover:bg-emerald-100 transition-colors">
                      <Camera size={24} className="mb-0.5" />
                      <span className="text-[11px] font-extrabold font-jakarta">Tải logo</span>
                    </div>
                  )}
                </div>

                {/* Live Brand Identity Preview */}
                <div className="pb-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-extrabold text-stone-900 font-jakarta">
                      {formData.storeName || 'Tên gian hàng sáng tạo'}
                    </h3>
                    <span className="px-2 py-0.5 bg-[#007700]/10 text-[#007700] rounded-md text-[10px] font-bold font-jakarta">
                      Gian hàng VietCraft
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 font-mono mt-0.5">
                    vietcraft.vn/shop/{formData.slug || 'gian-hang-cua-ban'}
                  </p>
                </div>
              </div>

              {/* Logo removal action if logo exists */}
              {formData.logoUrl && (
                <div className="pointer-events-auto pb-1">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, logoUrl: '' }))}
                    className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 bg-white/90 hover:bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-2xs transition-colors cursor-pointer font-jakarta"
                  >
                    <Trash2 size={13} />
                    <span>Gỡ logo</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. BASIC STORE INFORMATION */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xs p-6 space-y-6">
        <div>
          <h2 className="text-lg font-extrabold text-stone-900 font-jakarta flex items-center gap-2">
            <Store size={18} className="text-[#007700]" />
            <span>Thông tin hồ sơ gian hàng</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Cung cấp thông tin chi tiết giúp khách hàng dễ dàng tìm kiếm và tin tưởng đặt hàng.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Store Name */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
              Tên gian hàng / Thương hiệu sáng tạo <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.storeName}
              onChange={e => setFormData({ ...formData, storeName: e.target.value })}
              placeholder="VD: VietCraft Concept Store, Urban Creator Studio..."
              className="w-full px-4 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700] font-jakarta font-bold"
              required
            />
          </div>

          {/* Custom URL Slug */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
              Đường dẫn gian hàng tùy chỉnh (URL Slug)
            </label>
            <div className="flex items-center rounded-xl border border-stone-200 bg-stone-50/80 overflow-hidden focus-within:ring-2 focus-within:ring-[#007700]/20 focus-within:border-[#007700]">
              <span className="px-3.5 py-2.5 text-xs text-stone-500 font-mono bg-stone-100 border-r border-stone-200 select-none flex items-center gap-1">
                <Globe size={13} className="text-stone-400" />
                vietcraft.vn/shop/
              </span>
              <input
                type="text"
                value={formData.slug}
                onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                placeholder="gian-hang-cua-ban"
                className="flex-1 px-3 py-2.5 bg-transparent text-sm text-stone-900 font-mono focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-stone-400">Khách hàng có thể truy cập thẳng gian hàng bằng đường link này.</p>
          </div>

          {/* Headline / Slogan */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
              Khẩu hiệu / Giới thiệu ngắn
            </label>
            <input
              type="text"
              value={formData.headline || ''}
              onChange={e => setFormData({ ...formData, headline: e.target.value })}
              placeholder="VD: Không gian thiết kế sáng tạo & các sản phẩm độc bản theo phong cách hiện đại..."
              className="w-full px-4 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700]"
            />
          </div>

          {/* Hotline */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
              Số điện thoại CSKH <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="tel"
                value={formData.hotline}
                onChange={e => setFormData({ ...formData, hotline: e.target.value })}
                placeholder="0988 123 456"
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700]"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
              Email nhận thông báo đơn hàng <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="shop@vietcraft.vn"
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700]"
                required
              />
            </div>
          </div>

          {/* Main Product Category */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
              Phong cách thiết kế & Nhóm sản phẩm chủ lực
            </label>
            <input
              type="text"
              value={formData.mainCategory || ''}
              onChange={e => setFormData({ ...formData, mainCategory: e.target.value })}
              placeholder="VD: Thời trang Streetwear, Tranh Canvas nghệ thuật, Quà tặng thiết kế theo yêu cầu..."
              className="w-full px-4 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700]"
            />
          </div>

          {/* Store / Warehouse Pickup Address */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
              Địa chỉ cửa hàng / Điểm gửi hàng
            </label>
            <div className="relative">
              <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={formData.workshopAddress}
                onChange={e => setFormData({ ...formData, workshopAddress: e.target.value })}
                placeholder="VD: Tòa nhà VietCraft, Số 18 Đường Tân Trào, P. Tân Phú, Quận 7, TP.HCM"
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700]"
              />
            </div>
          </div>

          {/* Story & Description */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
              Mô tả gian hàng & Giới thiệu phong cách sáng tạo
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Chia sẻ câu chuyện thương hiệu, định hướng thiết kế và giá trị sản phẩm mà gian hàng muốn mang đến cho khách hàng..."
              className="w-full p-4 bg-stone-50/80 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700] resize-y leading-relaxed"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-[#007700] hover:bg-[#005B00] text-white text-xs font-extrabold tracking-wider uppercase rounded-xl shadow-sm shadow-[#007700]/25 transition-all cursor-pointer flex items-center gap-2 font-jakarta disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check size={15} />
            )}
            <span>LƯU THAY ĐỔI</span>
          </button>
        </div>
      </div>
    </form>
  );
}

export default GeneralSettingsTab;
