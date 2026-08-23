import { SellerShippingSettings } from '../../types/settings';
import { Truck, Check } from 'lucide-react';

interface OnboardingStepShippingProps {
  data: SellerShippingSettings;
  onChange: (data: SellerShippingSettings) => void;
}

export function OnboardingStepShipping({ data, onChange }: OnboardingStepShippingProps) {
  const handleToggleCarrier = (id: string) => {
    onChange({
      ...data,
      carriers: data.carriers.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c)
    });
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="text-center max-w-lg mx-auto mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#EAF0E2] text-[#007700] mb-3">
          <Truck size={24} />
        </div>
        <h3 className="text-xl font-extrabold text-stone-900 font-jakarta">
          Bước 2: Địa chỉ Lấy hàng & Đơn vị Vận chuyển
        </h3>
        <p className="text-xs text-stone-500 mt-1">
          Cấu hình kho gửi hàng để shipper đến lấy hàng và giao tận tay khách mua.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
              Tên người liên hệ kho <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={data.senderName}
              onChange={e => onChange({ ...data, senderName: e.target.value })}
              placeholder="VD: Nghệ nhân Nguyễn Văn Bát"
              className="w-full px-4 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
              Số điện thoại người gửi <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              value={data.senderPhone}
              onChange={e => onChange({ ...data, senderPhone: e.target.value })}
              placeholder="0988 123 456"
              className="w-full px-4 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
              Tỉnh / Thành phố <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={data.province}
              onChange={e => onChange({ ...data, province: e.target.value })}
              placeholder="Thành phố Hà Nội"
              className="w-full px-4 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
              Quận / Huyện <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={data.district}
              onChange={e => onChange({ ...data, district: e.target.value })}
              placeholder="Huyện Gia Lâm"
              className="w-full px-4 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700]"
              required
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
              Địa chỉ chi tiết (Xã/Phường, số nhà) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={data.specificAddress}
              onChange={e => onChange({ ...data, specificAddress: e.target.value })}
              placeholder="Số 88 Đường Giang Cao, Xã Bát Tràng"
              className="w-full px-4 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700]"
              required
            />
          </div>
        </div>

        {/* Carrier selection */}
        <div className="pt-3 border-t border-stone-100 space-y-2.5">
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
            Chọn đơn vị vận chuyển tích hợp
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.carriers.map(c => (
              <div
                key={c.id}
                onClick={() => handleToggleCarrier(c.id)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  c.enabled ? 'border-emerald-300 bg-emerald-50/40' : 'border-stone-200 bg-stone-50/50'
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-stone-900 font-jakarta">{c.name}</p>
                  <p className="text-[11px] text-stone-500">{c.estimatedTime || '1-3 ngày'}</p>
                </div>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                  c.enabled ? 'bg-[#007700] border-[#007700] text-white' : 'border-stone-300 bg-white'
                }`}>
                  {c.enabled && <Check size={13} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
