import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Check, Star } from 'lucide-react';
import { PRODUCT_TYPE_LABELS, SearchFilters, UpdateQuery } from './searchFilters';

const QUICK_PRICES = [
  { label: 'Tất cả mức giá', min: undefined, max: undefined },
  { label: 'Dưới 200.000đ', min: undefined, max: 200000 },
  { label: '200.000đ - 500.000đ', min: 200000, max: 500000 },
  { label: '500.000đ - 1.000.000đ', min: 500000, max: 1000000 },
  { label: 'Trên 1.000.000đ', min: 1000000, max: undefined }
];
const PRODUCT_TYPES = [{ value: '', label: 'Tất cả' }, ...Object.entries(PRODUCT_TYPE_LABELS).map(([value, label]) => ({ value, label }))];
const RATINGS = [
  { val: 5, label: '5 sao (tuyệt đối)' },
  { val: 4, label: 'Từ 4 sao trở lên' },
  { val: 3, label: 'Từ 3 sao trở lên' }
];
const priceInput: React.CSSProperties = { width: '100%', padding: '6px 8px', borderRadius: 8, border: '1px solid #d6d3d1', fontSize: 12, outline: 'none' };

const Section: React.FC<{ title: string; first?: boolean; children: React.ReactNode }> = ({ title, first, children }) => (
  <div style={first ? { marginBottom: 22 } : { marginBottom: 22, paddingTop: 14, borderTop: '1px solid #f5f5f4' }}>
    <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#57534e', marginBottom: 10 }}>{title}</h3>
    {children}
  </div>
);

const OptionRow: React.FC<{ selected: boolean; small?: boolean; onClick: () => void; children: React.ReactNode }> = ({ selected, small, onClick, children }) => (
  <div
    onClick={onClick}
    className={selected ? undefined : 'hover:bg-[#f5f5f4]'}
    style={{
      padding: small ? '6px 10px' : '7px 10px',
      borderRadius: 8,
      fontSize: small ? 12 : 13,
      cursor: 'pointer',
      fontWeight: selected ? 700 : 500,
      backgroundColor: selected ? '#ecfdf5' : undefined,
      color: selected ? '#007700' : small ? '#57534e' : '#44403c',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      transition: 'all 0.15s ease'
    }}
  >
    <span>{children}</span>
    {selected && <Check size={small ? 13 : 14} color="#007700" />}
  </div>
);

interface SearchFilterSidebarProps {
  categories: Array<{ id: string; name: string; slug: string }>;
  filters: SearchFilters;
  hasActiveFilters: boolean;
  updateQuery: UpdateQuery;
  onResetFilters: () => void;
}

export const SearchFilterSidebar: React.FC<SearchFilterSidebarProps> = ({ categories, filters: f, hasActiveFilters, updateQuery, onResetFilters }) => {
  const [customMin, setCustomMin] = useState(f.minPrice);
  const [customMax, setCustomMax] = useState(f.maxPrice);

  useEffect(() => {
    setCustomMin(f.minPrice);
    setCustomMax(f.maxPrice);
  }, [f.minPrice, f.maxPrice]);

  const handleApplyCustomPrice = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuery({
      minPrice: customMin.trim() ? Number(customMin.replace(/\D/g, '')) : undefined,
      maxPrice: customMax.trim() ? Number(customMax.replace(/\D/g, '')) : undefined
    });
  };

  return (
    <aside style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #e7e5e4', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', position: 'sticky', top: 84 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid #f5f5f4' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 15, color: '#1c1917' }}>
          <SlidersHorizontal size={16} color="#007700" />
          <span>Bộ lọc tìm kiếm</span>
        </div>
        {hasActiveFilters && (
          <button type="button" onClick={onResetFilters} style={{ background: 'none', border: 'none', color: '#78716c', fontSize: 12, cursor: 'pointer' }} className="hover:text-red-600">
            Đặt lại
          </button>
        )}
      </div>

      <Section title="Danh mục" first>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <OptionRow selected={!f.category} onClick={() => updateQuery({ category: undefined })}>Tất cả danh mục</OptionRow>
          {categories.map((cat) => (
            <OptionRow
              key={cat.id}
              selected={f.category.toLowerCase() === cat.name.toLowerCase() || f.category === cat.slug}
              onClick={() => updateQuery({ category: cat.name })}
            >
              {cat.name}
            </OptionRow>
          ))}
        </div>
      </Section>

      <Section title="Loại hình sản phẩm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {PRODUCT_TYPES.map((pt) => {
            const isChecked = f.productType === pt.value;
            return (
              <label key={pt.value} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: isChecked ? '#1c1917' : '#57534e', fontWeight: isChecked ? 700 : 500, cursor: 'pointer' }}>
                <input type="radio" name="productType" checked={isChecked} onChange={() => updateQuery({ productType: pt.value || undefined })} style={{ accentColor: '#007700' }} />
                <span>{pt.label}</span>
              </label>
            );
          })}
        </div>
      </Section>

      <Section title="Khoảng giá">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
          {QUICK_PRICES.map((qp) => (
            <OptionRow
              key={qp.label}
              small
              selected={f.minPrice === String(qp.min ?? '') && f.maxPrice === String(qp.max ?? '')}
              onClick={() => updateQuery({ minPrice: qp.min, maxPrice: qp.max })}
            >
              {qp.label}
            </OptionRow>
          ))}
        </div>
        <form onSubmit={handleApplyCustomPrice} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="number" placeholder="Từ ₫" value={customMin} onChange={(e) => setCustomMin(e.target.value)} style={priceInput} />
            <span style={{ color: '#a8a29e' }}>-</span>
            <input type="number" placeholder="Đến ₫" value={customMax} onChange={(e) => setCustomMax(e.target.value)} style={priceInput} />
          </div>
          <button
            type="submit"
            className="bg-[#007700] hover:bg-[#005b00]"
            style={{ padding: '7px 12px', color: '#ffffff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'background-color 0.15s ease' }}
          >
            Áp dụng giá
          </button>
        </form>
      </Section>

      <Section title="Đánh giá">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {RATINGS.map((r) => {
            const isSelected = f.rating === String(r.val);
            return (
              <div
                key={r.val}
                onClick={() => updateQuery({ rating: isSelected ? undefined : r.val })}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: isSelected ? 700 : 500, backgroundColor: isSelected ? '#fffbeb' : 'transparent', color: isSelected ? '#b45309' : '#44403c' }}
              >
                <div style={{ display: 'flex', gap: 2 }}>
                  {[0, 1, 2, 3, 4].map((idx) => {
                    const c = idx < r.val ? '#f59e0b' : '#e7e5e4';
                    return <Star key={idx} size={12} style={{ fill: c, color: c }} />;
                  })}
                </div>
                <span>{r.label}</span>
              </div>
            );
          })}
        </div>
      </Section>

      <div style={{ paddingTop: 14, borderTop: '1px solid #f5f5f4' }}>
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#292524' }}>
          <span>Chỉ hiện còn hàng</span>
          <input
            type="checkbox"
            checked={f.inStockOnly}
            onChange={(e) => updateQuery({ inStockOnly: e.target.checked ? true : undefined })}
            style={{ width: 16, height: 16, accentColor: '#007700', cursor: 'pointer' }}
          />
        </label>
      </div>
    </aside>
  );
};
