import { useState, useEffect } from 'react';
import {
  Tag,
  Ruler,
  Shirt,
  Footprints,
  Scale,
  Plus,
  X,
  Check,
  Sparkles,
  Info
} from 'lucide-react';

export { ApparelSizeManager } from './ApparelSizeManager';
export { ShoeSizeManager } from './ShoeSizeManager';
export { GeneralSizeManager } from './GeneralSizeManager';

export type SizeTabType = 'general' | 'dimensions' | 'apparel' | 'shoes' | 'volume_weight';

export interface ProductFormSizeManagerProps {
  sizes: string[];
  onChangeSizes: (sizes: string[]) => void;
  categoryName?: string;
  productTitle?: string;
  initialTab?: SizeTabType;
}

// 1. Cỡ chung
const GENERAL_PRESETS = [
  'Tiêu chuẩn',
  'Nhỏ (S)',
  'Vừa (M)',
  'Lớn (L)',
  'Cỡ đại (XL)',
  'Freesize',
  'Mini',
  'Cỡ vừa'
];

// 2. Kích thước (cm / mm)
const DIMENSION_WALLART_PRESETS = [
  '20x30 cm',
  '30x40 cm',
  '40x60 cm',
  '50x70 cm',
  '60x90 cm',
  '80x120 cm'
];

const DIMENSION_CRAFT_PRESETS = [
  'Đường kính 15cm',
  'Đường kính 20cm',
  'Đường kính 30cm',
  'Cao 15cm',
  'Cao 20cm',
  'Cao 30cm',
  '15x15 cm',
  '20x20 cm'
];

// 3. Thời trang / May mặc
const APPAREL_PRESETS = [
  'XS',
  'S',
  'M',
  'L',
  'XL',
  '2XL',
  '3XL',
  '4XL',
  'Freesize'
];

// 4. Giày dép / Guốc mộc
const SHOE_PRESETS = [
  '35',
  '36',
  '37',
  '38',
  '39',
  '40',
  '41',
  '42',
  '43',
  '44',
  '45',
  '46'
];

// 5. Dung tích & Khối lượng
const VOLUME_PRESETS = [
  '10ml',
  '30ml',
  '50ml',
  '100ml',
  '200ml',
  '250ml',
  '500ml',
  '1 Lít'
];

const WEIGHT_PRESETS = [
  '50g',
  '100g',
  '200g',
  '250g',
  '500g',
  '1kg',
  '2kg'
];

function detectInitialTab(categoryName = '', productTitle = ''): SizeTabType {
  const text = `${categoryName} ${productTitle}`.toLowerCase();

  // Giày dép
  const shoeKeywords = ['giày', 'giay', 'dép', 'dep', 'guốc', 'guoc', 'sneaker', 'sandal', 'boot', 'boots', 'loafer', 'footwear'];
  if (shoeKeywords.some((k) => text.includes(k))) return 'shoes';

  // Thời trang / May mặc
  const apparelKeywords = ['áo', 'ao', 'quần', 'quan', 'hoodie', 't-shirt', 'tshirt', 'váy', 'vay', 'đầm', 'dam', 'khoác', 'jacket', 'jean', 'may mặc', 'thời trang', 'apparel', 'fashion'];
  if (apparelKeywords.some((k) => text.includes(k))) return 'apparel';

  // Dung tích & Khối lượng (tinh dầu, nến, mật ong, trà, cà phê, xà bông...)
  const volWeightKeywords = ['tinh dầu', 'tinh dau', 'nến', 'nen', 'nước hoa', 'mật ong', 'mat ong', 'trà', 'tra', 'cà phê', 'cafe', 'coffee', 'xà bông', 'xa phong', 'dầu gội', 'kem', 'bột', 'hạt', 'mứt'];
  if (volWeightKeywords.some((k) => text.includes(k))) return 'volume_weight';

  // Kích thước (tranh, canvas, decor, gốm sứ, bình lọ, bàn ghế, thảm...)
  const dimKeywords = ['tranh', 'canvas', 'poster', 'thảm', 'tham', 'decor', 'gối', 'goi', 'gốm', 'gom', 'sứ', 'su', 'bình', 'binh', 'lọ', 'lo', 'bàn', 'ban', 'ghế', 'ghe', 'tủ', 'khung'];
  if (dimKeywords.some((k) => text.includes(k))) return 'dimensions';

  return 'general';
}

interface TabDef {
  id: SizeTabType;
  label: string;
  badge: string;
  icon: typeof Tag;
  accentColor: string;
  badgeBg: string;
  activeBorder: string;
  activeBg: string;
}

const TABS: TabDef[] = [
  {
    id: 'general',
    label: 'Cỡ chung',
    badge: 'S, M, L, Tiêu chuẩn',
    icon: Tag,
    accentColor: 'text-amber-700',
    badgeBg: 'bg-amber-100 text-amber-800',
    activeBorder: 'border-amber-500',
    activeBg: 'bg-amber-50/60'
  },
  {
    id: 'dimensions',
    label: 'Kích thước (cm)',
    badge: 'Tranh, Decor, Gốm sứ',
    icon: Ruler,
    accentColor: 'text-orange-700',
    badgeBg: 'bg-orange-100 text-orange-800',
    activeBorder: 'border-orange-500',
    activeBg: 'bg-orange-50/60'
  },
  {
    id: 'apparel',
    label: 'Thời trang / May mặc',
    badge: 'XS, S, M, L, XL...',
    icon: Shirt,
    accentColor: 'text-emerald-700',
    badgeBg: 'bg-emerald-100 text-emerald-800',
    activeBorder: 'border-emerald-500',
    activeBg: 'bg-emerald-50/60'
  },
  {
    id: 'shoes',
    label: 'Giày dép / Guốc mộc',
    badge: 'Cỡ số 35 - 46',
    icon: Footprints,
    accentColor: 'text-sky-700',
    badgeBg: 'bg-sky-100 text-sky-800',
    activeBorder: 'border-sky-500',
    activeBg: 'bg-sky-50/60'
  },
  {
    id: 'volume_weight',
    label: 'Dung tích & Khối lượng',
    badge: 'ml, L, g, kg',
    icon: Scale,
    accentColor: 'text-purple-700',
    badgeBg: 'bg-purple-100 text-purple-800',
    activeBorder: 'border-purple-500',
    activeBg: 'bg-purple-50/60'
  }
];

export function ProductFormSizeManager({
  sizes,
  onChangeSizes,
  categoryName = '',
  productTitle = '',
  initialTab
}: ProductFormSizeManagerProps) {
  const [activeTab, setActiveTab] = useState<SizeTabType>(() => {
    return initialTab || detectInitialTab(categoryName, productTitle);
  });
  const [hasManuallySwitched, setHasManuallySwitched] = useState(false);
  const [newCustomInput, setNewCustomInput] = useState('');
  const [showAddCustom, setShowAddCustom] = useState(false);

  // Cập nhật tab tự động khi đổi danh mục (nếu người dùng chưa tự bấm tab)
  useEffect(() => {
    if (!hasManuallySwitched) {
      setActiveTab(detectInitialTab(categoryName, productTitle));
    }
  }, [categoryName, productTitle, hasManuallySwitched]);

  const toggleSize = (size: string) => {
    const trimmed = size.trim();
    if (!trimmed) return;
    if (sizes.includes(trimmed)) {
      onChangeSizes(sizes.filter((s) => s !== trimmed));
    } else {
      onChangeSizes([...sizes, trimmed]);
    }
  };

  const addMultipleSizes = (items: string[]) => {
    const combined = Array.from(new Set([...sizes, ...items]));
    onChangeSizes(combined);
  };

  const handleAddCustom = () => {
    const trimmed = newCustomInput.trim();
    if (!trimmed) return;
    if (!sizes.includes(trimmed)) {
      onChangeSizes([...sizes, trimmed]);
    }
    setNewCustomInput('');
    setShowAddCustom(false);
  };

  const handleClearAll = () => {
    onChangeSizes([]);
  };

  const currentTabDef = TABS.find((t) => t.id === activeTab) || TABS[0];
  const IconComponent = currentTabDef.icon;

  return (
    <div className="space-y-3 pt-3 border-t border-stone-100 bg-stone-50/60 -mx-2 px-3 py-3 rounded-2xl border border-stone-200 shadow-xs">
      {/* Header & Count */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-stone-200/70 text-stone-700">
            <IconComponent size={16} className={currentTabDef.accentColor} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-stone-800 uppercase tracking-wider font-jakarta">
                Quy Cách / Kích Thước Sản Phẩm
              </label>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#007700] text-white">
                {sizes.length} đã chọn
              </span>
            </div>
            <p className="text-[11px] text-stone-500 font-normal">
              Chọn nhóm quy chuẩn phù hợp bên dưới để người mua dễ dàng lựa chọn khi đặt hàng.
            </p>
          </div>
        </div>

        {/* Action Buttons Right */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          {sizes.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="px-2.5 py-1 rounded-lg text-stone-500 hover:text-red-600 hover:bg-red-50 text-xs font-medium cursor-pointer transition-colors"
            >
              Xoá tất cả
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowAddCustom(!showAddCustom)}
            className="px-2.5 py-1 rounded-lg bg-white border border-stone-300 text-stone-700 hover:border-[#007700] hover:text-[#007700] font-semibold text-xs flex items-center gap-1 cursor-pointer transition-all shadow-2xs font-jakarta"
          >
            <Plus size={13} /> Nhập quy cách khác
          </button>
        </div>
      </div>

      {/* 5-Tab Switcher Bar */}
      <div className="bg-white p-1 rounded-xl border border-stone-200/80 shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1">
          {TABS.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setHasManuallySwitched(true);
                }}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all cursor-pointer font-jakarta ${
                  isActive
                    ? 'bg-[#007700] text-white shadow-xs font-bold'
                    : 'bg-stone-50/70 text-stone-600 hover:bg-stone-100/80 hover:text-stone-900 font-medium'
                }`}
              >
                <TabIcon
                  size={15}
                  className={isActive ? 'text-white shrink-0' : `${tab.accentColor} shrink-0`}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] truncate leading-tight">{tab.label}</div>
                  <div
                    className={`text-[10px] truncate ${
                      isActive ? 'text-white/80' : 'text-stone-400'
                    }`}
                  >
                    {tab.badge}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Specific Content */}
      <div className={`p-3 rounded-xl border ${currentTabDef.activeBorder} ${currentTabDef.activeBg} space-y-3 transition-all`}>
        {/* Quick select helpers */}
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
          <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1 font-jakarta">
            <Sparkles size={13} className={currentTabDef.accentColor} />
            Chọn nhanh theo gợi ý có sẵn:
          </span>

          <div className="flex items-center gap-1.5 flex-wrap">
            {activeTab === 'general' && (
              <>
                <button
                  type="button"
                  onClick={() => addMultipleSizes(['Nhỏ (S)', 'Vừa (M)', 'Lớn (L)'])}
                  className="px-2 py-1 rounded-md bg-white border border-stone-200 hover:border-amber-400 text-stone-700 font-semibold text-[11px] cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <Check size={12} className="text-amber-600" /> Thêm Nhỏ, Vừa, Lớn
                </button>
                <button
                  type="button"
                  onClick={() => addMultipleSizes(['Tiêu chuẩn'])}
                  className="px-2 py-1 rounded-md bg-white border border-stone-200 hover:border-amber-400 text-stone-700 font-semibold text-[11px] cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <Check size={12} className="text-amber-600" /> 1 Cỡ tiêu chuẩn
                </button>
                <button
                  type="button"
                  onClick={() => addMultipleSizes(['Freesize'])}
                  className="px-2 py-1 rounded-md bg-white border border-stone-200 hover:border-amber-400 text-stone-700 font-semibold text-[11px] cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <Check size={12} className="text-amber-600" /> Freesize
                </button>
              </>
            )}

            {activeTab === 'dimensions' && (
              <>
                <button
                  type="button"
                  onClick={() => addMultipleSizes(['30x40 cm', '40x60 cm', '50x70 cm'])}
                  className="px-2 py-1 rounded-md bg-white border border-stone-200 hover:border-orange-400 text-stone-700 font-semibold text-[11px] cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <Check size={12} className="text-orange-600" /> Bộ tranh phổ biến (30x40, 40x60, 50x70)
                </button>
                <button
                  type="button"
                  onClick={() => addMultipleSizes(['Cao 20cm', 'Cao 30cm'])}
                  className="px-2 py-1 rounded-md bg-white border border-stone-200 hover:border-orange-400 text-stone-700 font-semibold text-[11px] cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <Check size={12} className="text-orange-600" /> Bình/Tượng (Cao 20, 30cm)
                </button>
              </>
            )}

            {activeTab === 'apparel' && (
              <>
                <button
                  type="button"
                  onClick={() => addMultipleSizes(['S', 'M', 'L', 'XL'])}
                  className="px-2 py-1 rounded-md bg-white border border-stone-200 hover:border-emerald-400 text-stone-700 font-semibold text-[11px] cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <Check size={12} className="text-emerald-600" /> Bộ cơ bản: S, M, L, XL
                </button>
                <button
                  type="button"
                  onClick={() => addMultipleSizes(['XS', 'S', 'M', 'L', 'XL', '2XL'])}
                  className="px-2 py-1 rounded-md bg-white border border-stone-200 hover:border-emerald-400 text-stone-700 font-semibold text-[11px] cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <Check size={12} className="text-emerald-600" /> Đầy đủ: XS đến 2XL
                </button>
              </>
            )}

            {activeTab === 'shoes' && (
              <>
                <button
                  type="button"
                  onClick={() => addMultipleSizes(['36', '37', '38', '39'])}
                  className="px-2 py-1 rounded-md bg-white border border-stone-200 hover:border-sky-400 text-stone-700 font-semibold text-[11px] cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <Check size={12} className="text-sky-600" /> Cỡ Nữ (36 - 39)
                </button>
                <button
                  type="button"
                  onClick={() => addMultipleSizes(['39', '40', '41', '42', '43'])}
                  className="px-2 py-1 rounded-md bg-white border border-stone-200 hover:border-sky-400 text-stone-700 font-semibold text-[11px] cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <Check size={12} className="text-sky-600" /> Cỡ Nam (39 - 43)
                </button>
              </>
            )}

            {activeTab === 'volume_weight' && (
              <>
                <button
                  type="button"
                  onClick={() => addMultipleSizes(['50ml', '100ml', '250ml'])}
                  className="px-2 py-1 rounded-md bg-white border border-stone-200 hover:border-purple-400 text-stone-700 font-semibold text-[11px] cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <Check size={12} className="text-purple-600" /> Mẫu chai lọ: 50, 100, 250ml
                </button>
                <button
                  type="button"
                  onClick={() => addMultipleSizes(['250g', '500g', '1kg'])}
                  className="px-2 py-1 rounded-md bg-white border border-stone-200 hover:border-purple-400 text-stone-700 font-semibold text-[11px] cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <Check size={12} className="text-purple-600" /> Mẫu cân nặng: 250g, 500g, 1kg
                </button>
              </>
            )}
          </div>
        </div>

        {/* Preset Chips */}
        {activeTab === 'general' && (
          <div className="flex flex-wrap gap-1.5">
            {GENERAL_PRESETS.map((sz) => {
              const isSelected = sizes.includes(sz);
              return (
                <button
                  key={sz}
                  type="button"
                  onClick={() => toggleSize(sz)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-jakarta transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs scale-102 ring-2 ring-amber-300'
                      : 'bg-white text-stone-700 border-stone-200 hover:border-amber-400 hover:bg-amber-50/50'
                  }`}
                >
                  {sz}
                </button>
              );
            })}
          </div>
        )}

        {activeTab === 'dimensions' && (
          <div className="space-y-2">
            <div>
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                Kích thước tranh, decor (Dài x Rộng):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {DIMENSION_WALLART_PRESETS.map((sz) => {
                  const isSelected = sizes.includes(sz);
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => toggleSize(sz)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold font-jakarta transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-orange-600 text-white border-orange-600 shadow-xs scale-102 ring-2 ring-orange-300'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-orange-400 hover:bg-orange-50/50'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                Gốm sứ, bình hoa, tượng thủ công (Đường kính / Chiều cao):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {DIMENSION_CRAFT_PRESETS.map((sz) => {
                  const isSelected = sizes.includes(sz);
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => toggleSize(sz)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold font-jakarta transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-orange-600 text-white border-orange-600 shadow-xs scale-102 ring-2 ring-orange-300'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-orange-400 hover:bg-orange-50/50'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'apparel' && (
          <div className="flex flex-wrap gap-1.5">
            {APPAREL_PRESETS.map((sz) => {
              const isSelected = sizes.includes(sz);
              return (
                <button
                  key={sz}
                  type="button"
                  onClick={() => toggleSize(sz)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-jakarta transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs scale-102 ring-2 ring-emerald-300'
                      : 'bg-white text-stone-700 border-stone-200 hover:border-emerald-400 hover:bg-emerald-50/50'
                  }`}
                >
                  {sz}
                </button>
              );
            })}
          </div>
        )}

        {activeTab === 'shoes' && (
          <div className="flex flex-wrap gap-1.5">
            {SHOE_PRESETS.map((sz) => {
              const isSelected = sizes.includes(sz);
              return (
                <button
                  key={sz}
                  type="button"
                  onClick={() => toggleSize(sz)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-jakarta transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-sky-600 text-white border-sky-600 shadow-xs scale-102 ring-2 ring-sky-300'
                      : 'bg-white text-stone-700 border-stone-200 hover:border-sky-400 hover:bg-sky-50/50'
                  }`}
                >
                  {sz}
                </button>
              );
            })}
          </div>
        )}

        {activeTab === 'volume_weight' && (
          <div className="space-y-2">
            <div>
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                Dung tích / Thể tích (Tinh dầu, nước hoa, siro, mật ong):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {VOLUME_PRESETS.map((sz) => {
                  const isSelected = sizes.includes(sz);
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => toggleSize(sz)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold font-jakarta transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs scale-102 ring-2 ring-purple-300'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-purple-400 hover:bg-purple-50/50'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                Khối lượng / Trọng lượng (Trà thảo mộc, bột, xà bông, nông sản khô):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {WEIGHT_PRESETS.map((sz) => {
                  const isSelected = sizes.includes(sz);
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => toggleSize(sz)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold font-jakarta transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs scale-102 ring-2 ring-purple-300'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-purple-400 hover:bg-purple-50/50'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Custom Spec Form */}
      {showAddCustom && (
        <div className="flex items-center gap-2 p-3 bg-white border border-[#007700]/30 rounded-xl animate-fade-in shadow-xs">
          <input
            type="text"
            placeholder="Nhập kích thước/quy cách riêng (VD: 30x40cm, Hộp 500g, Bình 750ml, Đường kính 25cm...)"
            value={newCustomInput}
            onChange={(e) => setNewCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustom();
              }
            }}
            className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#007700] focus:bg-white"
          />
          <button
            type="button"
            onClick={handleAddCustom}
            className="px-4 py-2 bg-[#007700] text-white text-xs font-bold rounded-lg hover:bg-[#006600] cursor-pointer shadow-xs font-jakarta"
          >
            Thêm vào danh sách
          </button>
        </div>
      )}

      {/* Active Selected Size Chips */}
      {sizes.length > 0 ? (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider font-jakarta">
              Danh sách quy cách người mua sẽ chọn ({sizes.length}):
            </span>
            <span className="text-[10px] text-stone-400 font-normal">
              Click vào dấu (✕) để bỏ chọn từng mục
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sizes.map((sz) => (
              <span
                key={sz}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#007700]/40 text-stone-800 rounded-lg text-xs font-bold shadow-2xs font-jakarta group hover:border-red-400 transition-colors"
              >
                <span>{sz}</span>
                <button
                  type="button"
                  onClick={() => toggleSize(sz)}
                  className="text-stone-400 group-hover:text-red-500 hover:bg-stone-100 rounded-full p-0.5 cursor-pointer transition-colors"
                  title={`Xoá ${sz}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2 p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900">
          <Info size={15} className="text-amber-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Mẹo:</strong> Bạn có thể chọn nhiều quy cách cùng lúc bằng cách click vào các nút mẫu trên. Nếu sản phẩm chỉ có duy nhất 1 kích thước, bạn có thể để trống phần này.
          </p>
        </div>
      )}
    </div>
  );
}
