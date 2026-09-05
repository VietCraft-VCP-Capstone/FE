import React, { useState } from 'react';
import { SellerNotificationSettings } from '../../types/settings';
import {
  Bell,
  Mail,
  Smartphone,
  ShoppingBag,
  Package,
  TrendingUp,
  Check
} from 'lucide-react';

interface NotificationSettingsTabProps {
  initialData: SellerNotificationSettings;
  onSave: (data: SellerNotificationSettings) => void;
  loading?: boolean;
}

export function NotificationSettingsTab({
  initialData,
  onSave,
  loading = false,
}: NotificationSettingsTabProps) {
  const [formData, setFormData] = useState<SellerNotificationSettings>(initialData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleToggle = (
    group: 'orders' | 'inventory' | 'analytics',
    key: string,
    channel: 'email' | 'app'
  ) => {
    setFormData(prev => ({
      ...prev,
      [group]: {
        ...prev[group],
        [key]: {
          ...(prev[group] as any)[key],
          [channel]: !(prev[group] as any)[key][channel]
        }
      }
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in font-sans">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        {/* Card Header */}
        <div className="p-6 border-b border-stone-100">
          <h2 className="text-lg font-extrabold text-stone-900 font-jakarta flex items-center gap-2">
            <Bell size={18} className="text-[#007700]" />
            <span>Tùy chọn nhận thông báo</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Chọn kênh thông báo bạn muốn nhận cho các sự kiện quan trọng trong gian hàng.
          </p>
        </div>

        {/* Matrix Header Row */}
        <div className="flex items-center justify-between px-6 py-3 bg-stone-50/90 border-b border-stone-200/80 text-[11px] font-bold text-stone-500 uppercase tracking-wider font-jakarta">
          <span>LOẠI THÔNG BÁO</span>
          <div className="flex items-center gap-12 sm:gap-16 pr-4">
            <span className="flex items-center gap-1.5 w-16 justify-center">
              <Mail size={13} className="text-stone-400" /> EMAIL
            </span>
            <span className="flex items-center gap-1.5 w-16 justify-center">
              <Smartphone size={13} className="text-stone-400" /> ỨNG DỤNG
            </span>
          </div>
        </div>

        <div className="p-6 space-y-8 divide-y divide-stone-100">
          {/* Section 1: Orders */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-stone-900 font-jakarta flex items-center gap-2">
              <ShoppingBag size={16} className="text-[#007700]" />
              <span>Đơn hàng & Giao dịch</span>
            </h3>

            <div className="space-y-3.5">
              {/* Item: New Order */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-stone-800">Có đơn hàng mới</h4>
                  <p className="text-[11px] text-stone-500">Khi khách hàng đặt mua và thanh toán đơn hàng thành công</p>
                </div>
                <div className="flex items-center gap-12 sm:gap-16 pr-4">
                  <div className="w-16 flex justify-center">
                    <input
                      type="checkbox"
                      checked={formData.orders.newOrder.email}
                      onChange={() => handleToggle('orders', 'newOrder', 'email')}
                      className="w-4 h-4 rounded text-[#007700] accent-[#007700] border-stone-300 focus:ring-[#007700] cursor-pointer"
                    />
                  </div>
                  <div className="w-16 flex justify-center">
                    <input
                      type="checkbox"
                      checked={formData.orders.newOrder.app}
                      onChange={() => handleToggle('orders', 'newOrder', 'app')}
                      className="w-4 h-4 rounded text-[#007700] accent-[#007700] border-stone-300 focus:ring-[#007700] cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Item: Return & Refund */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-stone-800">Yêu cầu đổi / trả hàng</h4>
                  <p className="text-[11px] text-stone-500">Khi khách hàng gửi khiếu nại hoặc yêu cầu hoàn tiền</p>
                </div>
                <div className="flex items-center gap-12 sm:gap-16 pr-4">
                  <div className="w-16 flex justify-center">
                    <input
                      type="checkbox"
                      checked={formData.orders.returnRefund.email}
                      onChange={() => handleToggle('orders', 'returnRefund', 'email')}
                      className="w-4 h-4 rounded text-[#007700] accent-[#007700] border-stone-300 focus:ring-[#007700] cursor-pointer"
                    />
                  </div>
                  <div className="w-16 flex justify-center">
                    <input
                      type="checkbox"
                      checked={formData.orders.returnRefund.app}
                      onChange={() => handleToggle('orders', 'returnRefund', 'app')}
                      className="w-4 h-4 rounded text-[#007700] accent-[#007700] border-stone-300 focus:ring-[#007700] cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Item: Cancelled */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-stone-800">Đơn hàng bị hủy</h4>
                  <p className="text-[11px] text-stone-500">Khi người mua hoặc hệ thống tự động hủy đơn</p>
                </div>
                <div className="flex items-center gap-12 sm:gap-16 pr-4">
                  <div className="w-16 flex justify-center">
                    <input
                      type="checkbox"
                      checked={formData.orders.cancelled.email}
                      onChange={() => handleToggle('orders', 'cancelled', 'email')}
                      className="w-4 h-4 rounded text-[#007700] accent-[#007700] border-stone-300 focus:ring-[#007700] cursor-pointer"
                    />
                  </div>
                  <div className="w-16 flex justify-center">
                    <input
                      type="checkbox"
                      checked={formData.orders.cancelled.app}
                      onChange={() => handleToggle('orders', 'cancelled', 'app')}
                      className="w-4 h-4 rounded text-[#007700] accent-[#007700] border-stone-300 focus:ring-[#007700] cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Inventory & Products */}
          <div className="space-y-4 pt-6">
            <h3 className="text-sm font-extrabold text-stone-900 font-jakarta flex items-center gap-2">
              <Package size={16} className="text-[#007700]" />
              <span>Kho hàng & Sản phẩm</span>
            </h3>

            <div className="space-y-3.5">
              {/* Low Stock Warning */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-stone-800">Cảnh báo tồn kho thấp</h4>
                  <p className="text-[11px] text-stone-500">Khi số lượng tồn của sản phẩm xuống dưới mức cảnh báo (dưới 5 sản phẩm)</p>
                </div>
                <div className="flex items-center gap-12 sm:gap-16 pr-4">
                  <div className="w-16 flex justify-center">
                    <input
                      type="checkbox"
                      checked={formData.inventory.lowStock.email}
                      onChange={() => handleToggle('inventory', 'lowStock', 'email')}
                      className="w-4 h-4 rounded text-[#007700] accent-[#007700] border-stone-300 focus:ring-[#007700] cursor-pointer"
                    />
                  </div>
                  <div className="w-16 flex justify-center">
                    <input
                      type="checkbox"
                      checked={formData.inventory.lowStock.app}
                      onChange={() => handleToggle('inventory', 'lowStock', 'app')}
                      className="w-4 h-4 rounded text-[#007700] accent-[#007700] border-stone-300 focus:ring-[#007700] cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Listing Approval */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-stone-800">Kiểm duyệt sản phẩm</h4>
                  <p className="text-[11px] text-stone-500">Khi sản phẩm đăng ký mới được phê duyệt hoặc yêu cầu bổ sung thông tin</p>
                </div>
                <div className="flex items-center gap-12 sm:gap-16 pr-4">
                  <div className="w-16 flex justify-center">
                    <input
                      type="checkbox"
                      checked={formData.inventory.listingApproval.email}
                      onChange={() => handleToggle('inventory', 'listingApproval', 'email')}
                      className="w-4 h-4 rounded text-[#007700] accent-[#007700] border-stone-300 focus:ring-[#007700] cursor-pointer"
                    />
                  </div>
                  <div className="w-16 flex justify-center">
                    <input
                      type="checkbox"
                      checked={formData.inventory.listingApproval.app}
                      onChange={() => handleToggle('inventory', 'listingApproval', 'app')}
                      className="w-4 h-4 rounded text-[#007700] accent-[#007700] border-stone-300 focus:ring-[#007700] cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Analytics & Promotions */}
          <div className="space-y-4 pt-6">
            <h3 className="text-sm font-extrabold text-stone-900 font-jakarta flex items-center gap-2">
              <TrendingUp size={16} className="text-[#007700]" />
              <span>Báo cáo & Chương trình khuyến mãi</span>
            </h3>

            <div className="space-y-3.5">
              {/* Weekly Performance Report */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-stone-800">Báo cáo hiệu suất định kỳ</h4>
                  <p className="text-[11px] text-stone-500">Bản tin tổng hợp doanh thu, lượng khách ghé thăm và top sản phẩm bán chạy mỗi tuần</p>
                </div>
                <div className="flex items-center gap-12 sm:gap-16 pr-4">
                  <div className="w-16 flex justify-center">
                    <input
                      type="checkbox"
                      checked={formData.analytics.weeklyReport.email}
                      onChange={() => handleToggle('analytics', 'weeklyReport', 'email')}
                      className="w-4 h-4 rounded text-[#007700] accent-[#007700] border-stone-300 focus:ring-[#007700] cursor-pointer"
                    />
                  </div>
                  <div className="w-16 flex justify-center">
                    <input
                      type="checkbox"
                      checked={formData.analytics.weeklyReport.app}
                      onChange={() => handleToggle('analytics', 'weeklyReport', 'app')}
                      className="w-4 h-4 rounded text-[#007700] accent-[#007700] border-stone-300 focus:ring-[#007700] cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Promotions */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-stone-800">Chương trình khuyến mãi từ VietCraft</h4>
                  <p className="text-[11px] text-stone-500">Mời tham gia các chiến dịch lễ hội làng nghề, Flash Sale và hỗ trợ voucher từ sàn</p>
                </div>
                <div className="flex items-center gap-12 sm:gap-16 pr-4">
                  <div className="w-16 flex justify-center">
                    <input
                      type="checkbox"
                      checked={formData.analytics.promotions.email}
                      onChange={() => handleToggle('analytics', 'promotions', 'email')}
                      className="w-4 h-4 rounded text-[#007700] accent-[#007700] border-stone-300 focus:ring-[#007700] cursor-pointer"
                    />
                  </div>
                  <div className="w-16 flex justify-center">
                    <input
                      type="checkbox"
                      checked={formData.analytics.promotions.app}
                      onChange={() => handleToggle('analytics', 'promotions', 'app')}
                      className="w-4 h-4 rounded text-[#007700] accent-[#007700] border-stone-300 focus:ring-[#007700] cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-stone-100 bg-stone-50/50">
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
            <span>LƯU CẤU HÌNH THÔNG BÁO</span>
          </button>
        </div>
      </div>
    </form>
  );
}
