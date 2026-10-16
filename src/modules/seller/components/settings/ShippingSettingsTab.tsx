import React, { useState, useEffect } from 'react';
import { SellerShippingSettings, ShippingCarrierItem, ZoneShippingRates, ShippingPricingType } from '../../types/settings';
import { AddressSelector, VietnamAddressValue } from '../../../../shared/components/AddressSelector';
import {
  Truck,
  MapPin,
  Phone,
  User,
  Check,
  Percent,
  Info,
  Globe,
  Compass,
  Sparkles,
  Building2,
  Navigation,
  ShieldCheck
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



const DEFAULT_ZONE_RATES: ZoneShippingRates = {
  intraProvince: 22000,
  intraRegion: 30000,
  interRegion: 38000
};

function getProvinceRegionName(provinceName: string): { region: string; sampleNeighbors: string; sampleDistant: string } {
  if (!provinceName) {
    return { region: 'Miền Bắc', sampleNeighbors: 'Hải Phòng, Bắc Ninh', sampleDistant: 'TP. Hồ Chí Minh, Đà Nẵng' };
  }
  const name = provinceName.toLowerCase();
  const north = ['hà nội', 'hải phòng', 'quảng ninh', 'bắc ninh', 'hà nam', 'hải dương', 'hưng yên', 'nam định', 'ninh bình', 'thái bình', 'vĩnh phúc', 'hà giang', 'cao bằng', 'bắc kạn', 'lạng sơn', 'tuyên quang', 'thái nguyên', 'phú thọ', 'bắc giang', 'lào cai', 'yên bái', 'điện biên', 'lai châu', 'sơn la', 'hòa bình'];
  const central = ['thanh hóa', 'nghệ an', 'hà tĩnh', 'quảng bình', 'quảng trị', 'thừa thiên huế', 'huế', 'đà nẵng', 'quảng nam', 'quảng ngãi', 'bình định', 'phú yên', 'khánh hòa', 'ninh thuận', 'bình thuận', 'kon tum', 'gia lai', 'đắk lắk', 'đắk nông', 'lâm đồng'];

  if (north.some(p => name.includes(p))) {
    return { region: 'Miền Bắc', sampleNeighbors: 'Hải Phòng, Bắc Ninh, Hải Dương', sampleDistant: 'Đà Nẵng, TP. Hồ Chí Minh' };
  }
  if (central.some(p => name.includes(p))) {
    return { region: 'Miền Trung & Tây Nguyên', sampleNeighbors: 'Quảng Nam, Thừa Thiên Huế', sampleDistant: 'Hà Nội, TP. Hồ Chí Minh' };
  }
  return { region: 'Miền Nam', sampleNeighbors: 'Bình Dương, Đồng Nai, Cần Thơ', sampleDistant: 'Hà Nội, Đà Nẵng' };
}

export function ShippingSettingsTab({ initialData, onSave, loading = false }: ShippingSettingsTabProps) {
  const [formData, setFormData] = useState<SellerShippingSettings>(() => {
    const carriers = (initialData?.carriers && initialData.carriers.length > 0)
      ? initialData.carriers
      : DEFAULT_CARRIERS;
    const pricingType: ShippingPricingType = initialData?.pricingType || (initialData?.useFlatRate ? 'FLAT_RATE' : 'ZONE_BASED');
    return {
      ...initialData,
      carriers,
      pricingType,
      useFlatRate: pricingType === 'FLAT_RATE',
      flatRateFee: Number(initialData?.flatRateFee ?? 0),
      zoneRates: initialData?.zoneRates || DEFAULT_ZONE_RATES
    };
  });

  const handleAddressChange = (addr: VietnamAddressValue) => {
    setFormData(prev => ({
      ...prev,
      province: addr.province,
      district: addr.district,
      ward: addr.ward,
      specificAddress: addr.specificAddress
    }));
  };


  useEffect(() => {
    if (initialData) {
      const carriers = (initialData.carriers && initialData.carriers.length > 0)
        ? initialData.carriers
        : DEFAULT_CARRIERS;
      const pricingType: ShippingPricingType = initialData.pricingType || (initialData.useFlatRate ? 'FLAT_RATE' : 'ZONE_BASED');
      setFormData({
        ...initialData,
        carriers,
        pricingType,
        useFlatRate: pricingType === 'FLAT_RATE',
        flatRateFee: Number(initialData.flatRateFee ?? 0),
        zoneRates: initialData.zoneRates || DEFAULT_ZONE_RATES
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

  const handleSetPricingType = (type: ShippingPricingType) => {
    setFormData(prev => ({
      ...prev,
      pricingType: type,
      useFlatRate: type === 'FLAT_RATE'
    }));
  };

  const handleZoneRateChange = (field: keyof ZoneShippingRates, value: number) => {
    setFormData(prev => ({
      ...prev,
      zoneRates: {
        ...(prev.zoneRates || DEFAULT_ZONE_RATES),
        [field]: Math.max(0, isNaN(value) ? 0 : value)
      }
    }));
  };

  const currentZoneRates = formData.zoneRates || DEFAULT_ZONE_RATES;
  const isZoneMode = formData.pricingType === 'ZONE_BASED';
  const regionInfo = getProvinceRegionName(formData.province);

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
        </div>

        {/* Reusable Vietnam Address Selector (Open-API.vn & OpenStreetMap Nominatim) */}
        <AddressSelector
          value={{
            province: formData.province,
            district: formData.district,
            ward: formData.ward,
            specificAddress: formData.specificAddress,
          }}
          onChange={handleAddressChange}
          showQuickSearch={true}
          showSpecificAddress={true}
          required={true}
        />
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
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-6">
        <div>
          <h2 className="text-lg font-extrabold text-stone-900 font-jakarta flex items-center gap-2">
            <Percent size={18} className="text-[#007700]" />
            <span>Cấu hình phí vận chuyển</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Lựa chọn phương thức tính cước hiển thị cho khách hàng: Đồng giá toàn quốc hoặc Tính theo vùng địa lý.
          </p>
        </div>

        {/* Mode Selector (2 Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Flat Rate */}
          <div
            onClick={() => handleSetPricingType('FLAT_RATE')}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between gap-3 ${
              !isZoneMode
                ? 'border-[#007700] bg-emerald-50/30 shadow-xs'
                : 'border-stone-200 bg-stone-50/50 hover:border-stone-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base transition-colors ${
                  !isZoneMode ? 'bg-[#007700] text-white shadow-xs' : 'bg-stone-200 text-stone-600'
                }`}>
                  <Globe size={20} />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-stone-900 font-jakarta">
                    Phí đồng giá toàn quốc
                  </h4>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full inline-block mt-0.5">
                    Flat Rate
                  </span>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                !isZoneMode ? 'border-[#007700] bg-[#007700] text-white' : 'border-stone-300 bg-white'
              }`}>
                {!isZoneMode && <Check size={12} strokeWidth={3} />}
              </div>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Áp dụng một mức phí duy nhất cho toàn bộ đơn hàng trên mọi miền tổ quốc, bất kể xa hay gần.
            </p>
          </div>

          {/* Card 2: Zone-based */}
          <div
            onClick={() => handleSetPricingType('ZONE_BASED')}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between gap-3 ${
              isZoneMode
                ? 'border-[#007700] bg-emerald-50/30 shadow-xs'
                : 'border-stone-200 bg-stone-50/50 hover:border-stone-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base transition-colors ${
                  isZoneMode ? 'bg-[#007700] text-white shadow-xs' : 'bg-stone-200 text-stone-600'
                }`}>
                  <Compass size={20} />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-stone-900 font-jakarta">
                    Phí theo vùng địa lý
                  </h4>
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full inline-block mt-0.5">
                    Zone-based
                  </span>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                isZoneMode ? 'border-[#007700] bg-[#007700] text-white' : 'border-stone-300 bg-white'
              }`}>
                {isZoneMode && <Check size={12} strokeWidth={3} />}
              </div>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Phân loại 3 mức phí ship riêng biệt theo khoảng cách: Nội tỉnh, Nội vùng (Cùng miền), và Liên vùng.
            </p>
          </div>
        </div>

        {/* View 1: Flat Rate Form */}
        {!isZoneMode && (
          <div className="space-y-4 pt-2 border-t border-stone-100 animate-fade-in">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
                Mức phí vận chuyển đồng giá toàn quốc (VNĐ)
              </label>
              <div className="relative max-w-sm">
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.flatRateFee}
                  onChange={e => setFormData({ ...formData, flatRateFee: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-base font-extrabold text-stone-900 font-jakarta focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700]"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400">₫</span>
              </div>
            </div>

            {/* Quick suggested chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-stone-500 font-medium flex items-center gap-1">
                <Sparkles size={13} className="text-[#007700]" />
                Gợi ý nhanh:
              </span>
              {[
                { label: 'Miễn phí (Freeship 0₫)', value: 0 },
                { label: '25.000 ₫', value: 25000 },
                { label: '30.000 ₫', value: 30000 },
                { label: '35.000 ₫', value: 35000 },
              ].map(chip => (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, flatRateFee: chip.value })}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer font-medium ${
                    formData.flatRateFee === chip.value
                      ? 'bg-[#007700] text-white border-[#007700] shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
              <Info size={16} className="text-[#007700] flex-shrink-0 mt-0.5" />
              <span>
                Người mua sẽ thanh toán cố định <b>{new Intl.NumberFormat('vi-VN').format(formData.flatRateFee)} ₫</b> cho mỗi đơn hàng (áp dụng toàn quốc).
              </span>
            </div>
          </div>
        )}

        {/* View 2: Zone-based Form with Regional Price Suggestions */}
        {isZoneMode && (
          <div className="space-y-5 pt-2 border-t border-stone-100 animate-fade-in">
            {/* Warehouse origin notification */}
            <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Navigation size={16} className="text-[#007700]" />
                <span className="text-stone-700">
                  Địa điểm kho gửi hàng: <b className="text-stone-900">{formData.province || 'Chưa chọn tỉnh/thành'}</b>
                  {formData.province && (
                    <span className="ml-1.5 px-2 py-0.5 rounded-md bg-[#007700]/10 text-[#007700] font-bold">
                      {regionInfo.region}
                    </span>
                  )}
                </span>
              </div>
              <span className="text-stone-400 text-[11px]">
                Giá cước được đối soát theo bảng giá chuẩn GHN / GHTK
              </span>
            </div>

            {/* 3 Zone Rate Input Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Zone 1: Intra-Province */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 flex flex-col justify-between gap-3 shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 font-jakarta flex items-center gap-1.5">
                      <Building2 size={15} />
                      1. Nội tỉnh / Nội thành
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/60 text-emerald-800">
                      Gần nhất
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 min-h-[32px]">
                    Người mua cùng trong <b>{formData.province || 'tỉnh/thành của kho'}</b>.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-emerald-100">
                  <div className="text-[11px] text-stone-500 flex items-center justify-between">
                    <span>Gợi ý đối tác:</span>
                    <span className="font-bold text-emerald-700">16.500₫ – 22.000₫</span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={currentZoneRates.intraProvince}
                      onChange={e => handleZoneRateChange('intraProvince', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-sm font-extrabold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">₫</span>
                  </div>

                  {/* Quick suggestion buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    {[16500, 20000, 22000, 0].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleZoneRateChange('intraProvince', val)}
                        className={`text-[10.5px] px-2 py-0.5 rounded-md border font-medium transition-all cursor-pointer ${
                          currentZoneRates.intraProvince === val
                            ? 'bg-[#007700] text-white border-[#007700]'
                            : 'bg-white hover:bg-emerald-50 text-stone-700 border-stone-200'
                        }`}
                      >
                        {val === 0 ? 'Freeship' : `${(val / 1000).toLocaleString('vi-VN')}k`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Zone 2: Intra-Region */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 flex flex-col justify-between gap-3 shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-blue-800 font-jakarta flex items-center gap-1.5">
                      <MapPin size={15} />
                      2. Nội vùng (Cùng miền)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-200/60 text-blue-800">
                      {regionInfo.region}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 min-h-[32px]">
                    Các tỉnh lân cận cùng miền (VD: {regionInfo.sampleNeighbors}).
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-blue-100">
                  <div className="text-[11px] text-stone-500 flex items-center justify-between">
                    <span>Gợi ý đối tác:</span>
                    <span className="font-bold text-blue-700">26.000₫ – 32.000₫</span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={currentZoneRates.intraRegion}
                      onChange={e => handleZoneRateChange('intraRegion', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl text-sm font-extrabold text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">₫</span>
                  </div>

                  {/* Quick suggestion buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    {[26000, 28000, 30000, 32000].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleZoneRateChange('intraRegion', val)}
                        className={`text-[10.5px] px-2 py-0.5 rounded-md border font-medium transition-all cursor-pointer ${
                          currentZoneRates.intraRegion === val
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white hover:bg-blue-50 text-stone-700 border-stone-200'
                        }`}
                      >
                        {`${(val / 1000).toLocaleString('vi-VN')}k`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Zone 3: Inter-Region */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 flex flex-col justify-between gap-3 shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800 font-jakarta flex items-center gap-1.5">
                      <Globe size={15} />
                      3. Liên vùng (Khác miền)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/60 text-amber-800">
                      Liên miền
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 min-h-[32px]">
                    Giao giữa các miền khác nhau (VD: {regionInfo.sampleDistant}).
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-amber-100">
                  <div className="text-[11px] text-stone-500 flex items-center justify-between">
                    <span>Gợi ý đối tác:</span>
                    <span className="font-bold text-amber-700">35.000₫ – 45.000₫</span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={currentZoneRates.interRegion}
                      onChange={e => handleZoneRateChange('interRegion', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-sm font-extrabold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">₫</span>
                  </div>

                  {/* Quick suggestion buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    {[35000, 38000, 40000, 45000].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleZoneRateChange('interRegion', val)}
                        className={`text-[10.5px] px-2 py-0.5 rounded-md border font-medium transition-all cursor-pointer ${
                          currentZoneRates.interRegion === val
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-white hover:bg-amber-50 text-stone-700 border-stone-200'
                        }`}
                      >
                        {`${(val / 1000).toLocaleString('vi-VN')}k`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Live Simulation / Preview Bar */}
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700 font-jakarta flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-[#007700]" />
                  Mô phỏng hiển thị phí ship khi khách đặt hàng:
                </span>
                <span className="text-[11px] text-stone-500">Tự động áp dụng theo địa chỉ người mua</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-stone-200 flex items-center justify-between">
                  <span className="text-stone-600">Khách cùng {formData.province || 'tỉnh'}:</span>
                  <b className="text-emerald-700 font-jakarta">
                    {new Intl.NumberFormat('vi-VN').format(currentZoneRates.intraProvince)} ₫
                  </b>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-stone-200 flex items-center justify-between">
                  <span className="text-stone-600">Khách cùng {regionInfo.region}:</span>
                  <b className="text-blue-700 font-jakarta">
                    {new Intl.NumberFormat('vi-VN').format(currentZoneRates.intraRegion)} ₫
                  </b>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-stone-200 flex items-center justify-between">
                  <span className="text-stone-600">Khách khác miền:</span>
                  <b className="text-amber-700 font-jakarta">
                    {new Intl.NumberFormat('vi-VN').format(currentZoneRates.interRegion)} ₫
                  </b>
                </div>
              </div>
            </div>
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
