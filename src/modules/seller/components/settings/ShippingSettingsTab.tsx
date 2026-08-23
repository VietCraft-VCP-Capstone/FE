import React, { useState, useEffect } from 'react';
import { SellerShippingSettings, ShippingCarrierItem } from '../../types/settings';
import {
  Truck,
  MapPin,
  Phone,
  User,
  Check,
  Percent,
  Info
} from 'lucide-react';

interface ShippingSettingsTabProps {
  initialData: SellerShippingSettings;
  onSave: (data: SellerShippingSettings) => void;
  loading?: boolean;
}

const DEFAULT_CARRIERS: ShippingCarrierItem[] = [
  {
    id: 'ghn',
    name: 'Giao Hàng Nhanh (GHN)',
    enabled: true,
    estimatedTime: '1 - 2 ngày'
  },
  {
    id: 'ghtk',
    name: 'Giao Hàng Tiết Kiệm (GHTK)',
    enabled: true,
    estimatedTime: '2 - 3 ngày'
  }
];

const VIETNAM_PROVINCES = [
  'Thành phố Hà Nội',
  'Thành phố Hồ Chí Minh',
  'Thành phố Đà Nẵng',
  'Thành phố Hải Phòng',
  'Thành phố Cần Thơ',
  'Tỉnh Quảng Nam',
  'Tỉnh Hải Dương',
  'Tỉnh Thừa Thiên Huế',
  'Tỉnh Thanh Hóa',
  'Tỉnh Bắc Ninh',
  'Tỉnh Ninh Bình',
  'Tỉnh Lâm Đồng'
];

export function ShippingSettingsTab({ initialData, onSave, loading = false }: ShippingSettingsTabProps) {
  const [formData, setFormData] = useState<SellerShippingSettings>(() => {
    const carriers = (initialData?.carriers && initialData.carriers.length > 0)
      ? initialData.carriers
      : DEFAULT_CARRIERS;
    return {
      ...initialData,
      carriers
    };
  });

  useEffect(() => {
    if (initialData) {
      const carriers = (initialData.carriers && initialData.carriers.length > 0)
        ? initialData.carriers
        : DEFAULT_CARRIERS;
      setFormData({
        ...initialData,
        carriers
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleToggleCarrier = (carrierId: string) => {
    setFormData(prev => ({
      ...prev,
      carriers: (prev.carriers || DEFAULT_CARRIERS).map(c =>
        c.id === carrierId ? { ...c, enabled: !c.enabled } : c
      )
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in font-sans">
      {/* Section 1: Pick-up Warehouse Address */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-6">
        <div>
          <h2 className="text-lg font-extrabold text-stone-900 font-jakarta flex items-center gap-2">
            <MapPin size={18} className="text-[#007700]" />
            <span>Địa chỉ lấy hàng & Kho xuất hàng</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Đơn vị vận chuyển sẽ đến địa chỉ này để nhận hàng và gửi đi cho người mua.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Sender Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
              Tên người gửi / Phụ trách kho <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={formData.senderName}
                onChange={e => setFormData({ ...formData, senderName: e.target.value })}
                placeholder="Nhập họ và tên người gửi"
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700]"
                required
              />
            </div>
          </div>

          {/* Sender Phone */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
              Số điện thoại người gửi <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="tel"
                value={formData.senderPhone}
                onChange={e => setFormData({ ...formData, senderPhone: e.target.value })}
                placeholder="Nhập số điện thoại liên hệ kho"
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700]"
                required
              />
            </div>
          </div>

          {/* Province */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
              Tỉnh / Thành phố <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.province}
              onChange={e => setFormData({ ...formData, province: e.target.value })}
              className="w-full px-4 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700] cursor-pointer"
              required
            >
              <option value="">Chọn Tỉnh / Thành phố</option>
              {VIETNAM_PROVINCES.map(prov => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>
          </div>

          {/* District */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
              Quận / Huyện <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.district}
              onChange={e => setFormData({ ...formData, district: e.target.value })}
              placeholder="VD: Huyện Gia Lâm, Quận Hoàn Kiếm..."
              className="w-full px-4 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700]"
              required
            />
          </div>

          {/* Ward */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
              Phường / Xã <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.ward}
              onChange={e => setFormData({ ...formData, ward: e.target.value })}
              placeholder="VD: Xã Bát Tràng, Phường Hàng Gai..."
              className="w-full px-4 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700]"
              required
            />
          </div>

          {/* Specific Address */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
              Địa chỉ chi tiết (Số nhà, tên ngõ/đường) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.specificAddress}
              onChange={e => setFormData({ ...formData, specificAddress: e.target.value })}
              placeholder="VD: Số 88 Đường Giang Cao, Thôn 2..."
              className="w-full px-4 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700]"
              required
            />
          </div>
        </div>
      </div>

      {/* Section 2: Shipping Carriers Integration */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-5">
        <div>
          <h2 className="text-lg font-extrabold text-stone-900 font-jakarta flex items-center gap-2">
            <Truck size={18} className="text-[#007700]" />
            <span>Đối tác vận chuyển liên kết</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Kích hoạt các hãng vận chuyển bạn muốn người mua lựa chọn khi thanh toán đơn hàng.
          </p>
        </div>

        <div className="space-y-3">
          {formData.carriers.map(carrier => (
            <div
              key={carrier.id}
              onClick={() => handleToggleCarrier(carrier.id)}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                carrier.enabled
                  ? 'border-emerald-300 bg-emerald-50/40 shadow-2xs'
                  : 'border-stone-200 bg-stone-50/60 opacity-70 hover:opacity-100'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                  carrier.enabled ? 'bg-[#007700] text-white shadow-2xs' : 'bg-stone-200 text-stone-500'
                }`}>
                  <Truck size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-stone-900 font-jakarta">{carrier.name}</h4>
                  <p className="text-xs text-stone-500">Thời gian dự kiến: {carrier.estimatedTime || '1 - 3 ngày'}</p>
                </div>
              </div>

              {/* Custom Toggle Switch */}
              <div className={`w-12 h-6 rounded-full transition-colors flex items-center p-0.5 ${
                carrier.enabled ? 'bg-[#007700] justify-end' : 'bg-stone-300 justify-start'
              }`}>
                <span className="w-5 h-5 rounded-full bg-white shadow-sm" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Shipping Fee Configuration */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-5">
        <div>
          <h2 className="text-lg font-extrabold text-stone-900 font-jakarta flex items-center gap-2">
            <Percent size={18} className="text-[#007700]" />
            <span>Cấu hình phí vận chuyển</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Thiết lập chính sách phí ship hiển thị cho khách hàng khi đặt sản phẩm.
          </p>
        </div>

        {/* Flat Rate Toggle */}
        <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl flex items-start justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-stone-900 font-jakarta">
              Sử dụng phí vận chuyển đồng giá (Flat Rate)
            </h4>
            <p className="text-xs text-stone-500 mt-0.5">
              Áp dụng một mức phí duy nhất cho tất cả các đơn hàng bất kể khoảng cách địa lý.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, useFlatRate: !formData.useFlatRate })}
            className={`w-12 h-6 rounded-full transition-colors flex items-center p-0.5 flex-shrink-0 cursor-pointer ${
              formData.useFlatRate ? 'bg-[#007700] justify-end' : 'bg-stone-300 justify-start'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white shadow-sm" />
          </button>
        </div>

        {/* Flat Rate Input Box */}
        {formData.useFlatRate ? (
          <div className="space-y-1.5 animate-fade-in">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
              Phí vận chuyển đồng giá toàn quốc (VNĐ)
            </label>
            <div className="relative max-w-xs">
              <input
                type="number"
                min="0"
                step="1000"
                value={formData.flatRateFee}
                onChange={e => setFormData({ ...formData, flatRateFee: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm font-bold text-stone-900 font-jakarta focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700]"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">₫</span>
            </div>
            <p className="text-[11px] text-stone-500 flex items-center gap-1 mt-1">
              <Info size={12} className="text-[#007700]" />
              Người mua sẽ thanh toán cố định {new Intl.NumberFormat('vi-VN').format(formData.flatRateFee)} ₫ cho mỗi đơn hàng.
            </p>
          </div>
        ) : (
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-start gap-2 animate-fade-in">
            <Info size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <span>Khi tắt phí đồng giá, hệ thống sẽ tự động tính phí ship theo khối lượng sản phẩm và bảng giá thực tế từ API GHN / GHTK.</span>
          </div>
        )}

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
            <span>LƯU CẤU HÌNH VẬN CHUYỂN</span>
          </button>
        </div>
      </div>
    </form>
  );
}
