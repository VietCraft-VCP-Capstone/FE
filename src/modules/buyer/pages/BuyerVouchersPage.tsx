import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ticket, Search, Copy, Check, Sparkles, Flame, Truck,
  Percent, Coins, RefreshCw, ShoppingBag, Store, ArrowLeft
} from 'lucide-react';
import { promotionService, CouponDTO } from '../../promotion/services/promotionService';
import { useToast } from '../../../shared/components/Toast';

export function BuyerVouchersPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [coupons, setCoupons] = useState<CouponDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'PLATFORM' | 'SHOP' | 'FLASH_SALE' | 'FREESHIP' | 'SAVED'>('ALL');
  const [savedVouchers, setSavedVouchers] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Load saved vouchers from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('vietcraft_saved_vouchers');
      if (stored) {
        setSavedVouchers(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load saved vouchers', e);
    }
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const data = await promotionService.getAll();
      setCoupons(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Lỗi khi tải kho voucher:', err);
      showToast('Không thể tải danh sách khuyến mãi, vui lòng thử lại sau.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const toggleSaveVoucher = (code: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let updated: string[];
    if (savedVouchers.includes(code)) {
      updated = savedVouchers.filter(c => c !== code);
      showToast(`Đã hủy lưu mã ${code}`, 'info');
    } else {
      updated = [...savedVouchers, code];
      navigator.clipboard?.writeText(code);
      showToast(`Đã lưu và sao chép mã ${code} vào kho voucher!`, 'success');
    }
    setSavedVouchers(updated);
    localStorage.setItem('vietcraft_saved_vouchers', JSON.stringify(updated));
  };

  const handleCopyCode = (code: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    showToast(`Đã sao chép mã ${code}!`, 'success');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formattedCoupons = useMemo(() => {
    return coupons.map(c => {
      const val = typeof c.discount_value === 'object' && (c.discount_value as any)?.$numberDecimal
        ? parseFloat((c.discount_value as any).$numberDecimal)
        : parseFloat((c.discount_value as any) || 0);

      const minVal = typeof c.min_order_value === 'object' && (c.min_order_value as any)?.$numberDecimal
        ? parseFloat((c.min_order_value as any).$numberDecimal)
        : parseFloat((c.min_order_value as any) || 0);

      const maxVal = typeof c.max_discount_amount === 'object' && (c.max_discount_amount as any)?.$numberDecimal
        ? parseFloat((c.max_discount_amount as any).$numberDecimal)
        : parseFloat((c.max_discount_amount as any) || 0);

      let displayValue = '';
      if (c.discount_type === 'PERCENTAGE') {
        displayValue = `Giảm ${val}%${maxVal > 0 ? ` (Tối đa ${(maxVal / 1000).toLocaleString('vi-VN')}K)` : ''}`;
      } else if (c.discount_type === 'FREE_SHIPPING') {
        displayValue = val > 0 ? `Freeship ${(val / 1000).toLocaleString('vi-VN')}K` : 'Freeship 100%';
      } else if (c.discount_type === 'FLASH_SALE') {
        displayValue = val <= 100 ? `Flash Sale ${val}%` : `Flash Sale ${(val / 1000).toLocaleString('vi-VN')}K`;
      } else {
        displayValue = val >= 1000000 ? `Giảm ${(val / 1000000).toLocaleString('vi-VN')} triệu` : `Giảm ${(val / 1000).toLocaleString('vi-VN')}K`;
      }

      let conditionLabel = 'Mọi đơn hàng';
      if (minVal > 0) {
        conditionLabel = minVal >= 1000000 ? `Đơn tối thiểu ${minVal / 1000000} triệu` : `Đơn tối thiểu ${(minVal / 1000)}K`;
      }

      return {
        ...c,
        val,
        minVal,
        maxVal,
        displayValue,
        conditionLabel,
        isPlatform: c.is_platform ?? !c.shop_id,
        shopName: c.shop_name || (c.shop_id ? 'Gian hàng' : 'VietCraft'),
        productsCount: c.applicable_product_ids?.length || 0
      };
    });
  }, [coupons]);

  const filteredCoupons = useMemo(() => {
    return formattedCoupons.filter(c => {
      // Filter by search
      const term = search.trim().toLowerCase();
      if (term) {
        const matchCode = c.code.toLowerCase().includes(term);
        const matchTitle = (c.title || '').toLowerCase().includes(term);
        const matchShop = (c.shopName || '').toLowerCase().includes(term);
        if (!matchCode && !matchTitle && !matchShop) return false;
      }

      // Filter by Tab
      switch (activeTab) {
        case 'PLATFORM':
          return c.isPlatform;
        case 'SHOP':
          return !c.isPlatform;
        case 'FLASH_SALE':
          return c.discount_type === 'FLASH_SALE';
        case 'FREESHIP':
          return c.discount_type === 'FREE_SHIPPING';
        case 'SAVED':
          return savedVouchers.includes(c.code);
        default:
          return true;
      }
    });
  }, [formattedCoupons, search, activeTab, savedVouchers]);

  return (
    <div className="min-h-screen bg-stone-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Breadcrumb & Top Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-900 transition"
          >
            <ArrowLeft size={16} /> Quay lại
          </button>
          <div className="text-xs text-stone-400 font-medium">
            <span className="hover:underline cursor-pointer" onClick={() => navigate('/')}>Trang chủ</span>
            <span className="mx-1.5">/</span>
            <span className="text-stone-700 font-bold">Kho Voucher</span>
          </div>
        </div>

        {/* Hero Banner Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-100 text-xs font-bold mb-3">
              <Sparkles size={14} className="text-amber-300" />
              Ưu đãi & Khuyến mãi độc quyền
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
              <Ticket className="text-emerald-300" size={32} />
              Kho Voucher VietCraft & Gian Hàng
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm mt-2 font-medium leading-relaxed">
              Thu thập mã giảm giá toàn sàn, trợ giá vận chuyển freeship và voucher giảm sốc từ các làng nghề truyền thống. Lưu mã ngay để tự động áp dụng khi thanh toán!
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/80 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {[
              { key: 'ALL', label: `Tất cả (${formattedCoupons.length})` },
              { key: 'PLATFORM', label: `Voucher Sàn (${formattedCoupons.filter(c => c.isPlatform).length})` },
              { key: 'SHOP', label: `Voucher Shop (${formattedCoupons.filter(c => !c.isPlatform).length})` },
              { key: 'FLASH_SALE', label: `Flash Sale (${formattedCoupons.filter(c => c.discount_type === 'FLASH_SALE').length})` },
              { key: 'FREESHIP', label: `Freeship (${formattedCoupons.filter(c => c.discount_type === 'FREE_SHIPPING').length})` },
              { key: 'SAVED', label: `Đã lưu (${savedVouchers.length})` },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  activeTab === tab.key
                    ? 'bg-[#008000] text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Tìm theo mã hoặc tên shop..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
          </div>
        </div>

        {/* Voucher List */}
        {loading ? (
          <div className="py-24 text-center text-stone-400 text-sm flex flex-col items-center justify-center gap-3">
            <RefreshCw size={28} className="animate-spin text-emerald-600" />
            <span>Đang tải kho mã giảm giá...</span>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-stone-200 shadow-sm max-w-lg mx-auto">
            <Ticket size={48} className="mx-auto text-stone-300 mb-3" />
            <h3 className="text-base font-bold text-stone-800">Không tìm thấy voucher phù hợp</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
              {activeTab === 'SAVED'
                ? 'Bạn chưa lưu voucher nào. Hãy khám phá và lưu các mã ưu đãi để áp dụng khi mua hàng!'
                : 'Thử tìm kiếm với từ khóa khác hoặc chuyển sang danh mục voucher khác.'}
            </p>
            {activeTab !== 'ALL' && (
              <button
                onClick={() => { setActiveTab('ALL'); setSearch(''); }}
                className="mt-4 px-4 py-2 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl hover:bg-emerald-100 transition"
              >
                Xem tất cả voucher
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCoupons.map((coupon) => {
              const isSaved = savedVouchers.includes(coupon.code);

              return (
                <div
                  key={coupon.id || coupon.code}
                  className={`bg-white rounded-2xl border transition-all hover:shadow-md flex flex-col justify-between overflow-hidden relative ${
                    isSaved
                      ? 'border-emerald-300 ring-1 ring-emerald-400/20'
                      : 'border-stone-200'
                  }`}
                >
                  <div className="p-5 flex gap-4">
                    {/* Left Icon / Badge */}
                    <div className={`w-14 h-14 rounded-2xl flex-shrink-0 flex flex-col items-center justify-center text-center p-1.5 ${
                      coupon.discount_type === 'FLASH_SALE'
                        ? 'bg-amber-50 text-amber-600 border border-amber-200'
                        : coupon.discount_type === 'FREE_SHIPPING'
                        ? 'bg-sky-50 text-sky-600 border border-sky-200'
                        : coupon.isPlatform
                        ? 'bg-emerald-50 text-[#008000] border border-emerald-200'
                        : 'bg-stone-50 text-stone-700 border border-stone-200'
                    }`}>
                      {coupon.discount_type === 'FLASH_SALE' ? (
                        <>
                          <Flame size={20} className="fill-amber-500 text-amber-500 animate-pulse" />
                          <span className="text-[9px] font-black uppercase mt-0.5">Flash</span>
                        </>
                      ) : coupon.discount_type === 'FREE_SHIPPING' ? (
                        <>
                          <Truck size={20} />
                          <span className="text-[9px] font-black uppercase mt-0.5">Ship</span>
                        </>
                      ) : coupon.discount_type === 'PERCENTAGE' ? (
                        <>
                          <Percent size={20} />
                          <span className="text-[9px] font-black uppercase mt-0.5">Giảm %</span>
                        </>
                      ) : (
                        <>
                          <Coins size={20} />
                          <span className="text-[9px] font-black uppercase mt-0.5">Tiền</span>
                        </>
                      )}
                    </div>

                    {/* Middle Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center flex-wrap gap-2">
                        {/* Mã Code Box */}
                        <div className="inline-flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200/80 px-2.5 py-0.5 rounded-lg border border-stone-200 transition">
                          <span className="font-mono font-black text-xs text-stone-900 tracking-wide">
                            {coupon.code}
                          </span>
                          <button
                            onClick={(e) => handleCopyCode(coupon.code, e)}
                            className="text-stone-400 hover:text-stone-700"
                            title="Sao chép mã"
                          >
                            {copiedCode === coupon.code ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                          </button>
                        </div>

                        {/* Nguồn phát hành */}
                        {coupon.isPlatform ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                            Toàn Sàn VietCraft
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200/60 flex items-center gap-1 truncate max-w-[150px]">
                            <Store size={10} /> {coupon.shopName}
                          </span>
                        )}
                      </div>

                      {/* Tiêu đề & Mức giảm */}
                      <h3 className="text-sm font-black text-stone-900 pt-0.5 line-clamp-1" title={coupon.title}>
                        {coupon.title}
                      </h3>
                      <p className="text-xs font-bold text-[#008000]">
                        {coupon.displayValue}
                      </p>

                      {/* Điều kiện & Scope */}
                      <div className="text-[11px] text-stone-500 space-y-0.5 pt-1">
                        <p>{coupon.conditionLabel}</p>
                        {coupon.applicable_scope === 'SPECIFIC_PRODUCTS' ? (
                          <p className="text-amber-700 font-semibold flex items-center gap-1">
                            • Áp dụng cho {coupon.productsCount} sản phẩm chỉ định
                          </p>
                        ) : (
                          <p className="text-stone-400">
                            • {coupon.isPlatform ? 'Áp dụng cho mọi gian hàng' : 'Áp dụng cho toàn bộ sản phẩm của shop'}
                          </p>
                        )}
                        {coupon.end_date && (
                          <p className="text-stone-400 text-[10px]">
                            HSD: {new Date(coupon.end_date).toLocaleDateString('vi-VN')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="px-5 py-3 bg-stone-50/80 border-t border-stone-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        if (coupon.shop_id) {
                          navigate(`/shop/${coupon.shop_id}`);
                        } else {
                          navigate('/');
                        }
                      }}
                      className="text-xs font-bold text-stone-600 hover:text-[#008000] inline-flex items-center gap-1 transition"
                    >
                      <ShoppingBag size={14} />
                      {coupon.shop_id ? 'Xem sản phẩm của Shop' : 'Khám phá sản phẩm'}
                    </button>

                    <button
                      onClick={(e) => toggleSaveVoucher(coupon.code, e)}
                      className={`px-5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
                        isSaved
                          ? 'bg-[#008000] text-white hover:bg-emerald-700'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {isSaved ? '✓ Đã lưu' : 'Lưu mã'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default BuyerVouchersPage;
