import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Check, Star } from 'lucide-react';

const QUICK_PRICES = [
  { label: 'Tất cả mức giá', min: undefined, max: undefined },
  { label: 'Dưới 200.000đ', min: undefined, max: 200000 },
  { label: '200.000đ - 500.000đ', min: 200000, max: 500000 },
  { label: '500.000đ - 1.000.000đ', min: 500000, max: 1000000 },
  { label: 'Trên 1.000.000đ', min: 1000000, max: undefined }
];

interface SearchFilterSidebarProps {
  categories: Array<{ id: string; name: string; slug: string }>;
  categoryParam: string;
  productTypeParam: string;
  minPriceParam: string;
  maxPriceParam: string;
  ratingParam: string;
  inStockOnlyParam: boolean;
  hasActiveFilters: boolean;
  updateQuery: (updates: Record<string, string | number | boolean | undefined | null>) => void;
  onResetFilters: () => void;
}

export const SearchFilterSidebar: React.FC<SearchFilterSidebarProps> = ({
  categories,
  categoryParam,
  productTypeParam,
  minPriceParam,
  maxPriceParam,
  ratingParam,
  inStockOnlyParam,
  hasActiveFilters,
  updateQuery,
  onResetFilters
}) => {
  const [customMin, setCustomMin] = useState(minPriceParam);
  const [customMax, setCustomMax] = useState(maxPriceParam);

  useEffect(() => {
    setCustomMin(minPriceParam);
    setCustomMax(maxPriceParam);
  }, [minPriceParam, maxPriceParam]);

  const handleApplyCustomPrice = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuery({
      minPrice: customMin.trim() ? Number(customMin.replace(/\D/g, '')) : undefined,
      maxPrice: customMax.trim() ? Number(customMax.replace(/\D/g, '')) : undefined
    });
  };

  return (
    <aside style={{
      backgroundColor: '#ffffff',
      borderRadius: 16,
      border: '1px solid #e7e5e4',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      position: 'sticky',
      top: 84
    }}>
      {/* Title & Reset */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 18,
        paddingBottom: 12,
        borderBottom: '1px solid #f5f5f4'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 15, color: '#1c1917' }}>
          <SlidersHorizontal size={16} color="#007700" />
          <span>Bộ lọc tìm kiếm</span>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            style={{ background: 'none', border: 'none', color: '#78716c', fontSize: 12, cursor: 'pointer' }}
            className="hover:text-red-600"
          >
            Đặt lại
          </button>
        )}
      </div>

      {/* Section 1: Categories */}
      <div style={{ marginBottom: 22 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#57534e', marginBottom: 10 }}>
          Danh mục
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div
            onClick={() => updateQuery({ category: undefined })}
            style={{
              padding: '7px 10px',
              borderRadius: 8,
              fontSize: 13,
              cursor: 'pointer',
              fontWeight: !categoryParam ? 700 : 500,
              backgroundColor: !categoryParam ? '#ecfdf5' : 'transparent',
              color: !categoryParam ? '#007700' : '#44403c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease'
            }}
          >
            <span>Tất cả danh mục</span>
            {!categoryParam && <Check size={14} color="#007700" />}
          </div>
          {categories.map((cat) => {
            const isSelected = categoryParam.toLowerCase() === cat.name.toLowerCase() || categoryParam === cat.slug;
            return (
              <div
                key={cat.id}
                onClick={() => updateQuery({ category: cat.name })}
                style={{
                  padding: '7px 10px',
                  borderRadius: 8,
                  fontSize: 13,
                  cursor: 'pointer',
                  fontWeight: isSelected ? 700 : 500,
                  backgroundColor: isSelected ? '#ecfdf5' : 'transparent',
                  color: isSelected ? '#007700' : '#44403c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = '#f5f5f4';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span>{cat.name}</span>
                {isSelected && <Check size={14} color="#007700" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Product Type */}
      <div style={{ marginBottom: 22, paddingTop: 14, borderTop: '1px solid #f5f5f4' }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#57534e', marginBottom: 10 }}>
          Loại hình sản phẩm
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { value: '', label: 'Tất cả' },
            { value: 'READY_TO_SHIP', label: 'Thủ công có sẵn' },
            { value: 'POD_TEMPLATE', label: 'In theo yêu cầu (POD)' }
          ].map((pt) => {
            const isChecked = (productTypeParam || '') === pt.value;
            return (
              <label
                key={pt.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  color: isChecked ? '#1c1917' : '#57534e',
                  fontWeight: isChecked ? 700 : 500,
                  cursor: 'pointer'
                }}
              >
                <input
                  type="radio"
                  name="productType"
                  checked={isChecked}
                  onChange={() => updateQuery({ productType: pt.value || undefined })}
                  style={{ accentColor: '#007700' }}
                />
                <span>{pt.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Section 3: Price Range */}
      <div style={{ marginBottom: 22, paddingTop: 14, borderTop: '1px solid #f5f5f4' }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#57534e', marginBottom: 10 }}>
          Khoảng giá
        </h3>

        {/* Quick price chips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
          {QUICK_PRICES.map((qp, idx) => {
            const isSelected =
              String(minPriceParam || '') === String(qp.min || '') &&
              String(maxPriceParam || '') === String(qp.max || '');
            return (
              <div
                key={idx}
                onClick={() => updateQuery({ minPrice: qp.min, maxPrice: qp.max })}
                style={{
                  padding: '6px 10px',
                  borderRadius: 8,
                  fontSize: 12,
                  cursor: 'pointer',
                  fontWeight: isSelected ? 700 : 500,
                  backgroundColor: isSelected ? '#ecfdf5' : 'transparent',
                  color: isSelected ? '#007700' : '#57534e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>{qp.label}</span>
                {isSelected && <Check size={13} color="#007700" />}
              </div>
            );
          })}
        </div>

        {/* Custom inputs */}
        <form onSubmit={handleApplyCustomPrice} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="number"
              placeholder="Từ ₫"
              value={customMin}
              onChange={(e) => setCustomMin(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: 8,
                border: '1px solid #d6d3d1',
                fontSize: 12,
                outline: 'none'
              }}
            />
            <span style={{ color: '#a8a29e' }}>-</span>
            <input
              type="number"
              placeholder="Đến ₫"
              value={customMax}
              onChange={(e) => setCustomMax(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: 8,
                border: '1px solid #d6d3d1',
                fontSize: 12,
                outline: 'none'
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: '7px 12px',
              backgroundColor: '#007700',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#005b00'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#007700'; }}
          >
            Áp dụng giá
          </button>
        </form>
      </div>

      {/* Section 4: Rating */}
      <div style={{ marginBottom: 22, paddingTop: 14, borderTop: '1px solid #f5f5f4' }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#57534e', marginBottom: 10 }}>
          Đánh giá
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { val: 5, label: '5 sao (tuyệt đối)' },
            { val: 4, label: 'Từ 4 sao trở lên' },
            { val: 3, label: 'Từ 3 sao trở lên' }
          ].map((r) => {
            const isSelected = ratingParam === String(r.val);
            return (
              <div
                key={r.val}
                onClick={() => updateQuery({ rating: isSelected ? undefined : r.val })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '5px 8px',
                  borderRadius: 8,
                  fontSize: 12,
                  cursor: 'pointer',
                  fontWeight: isSelected ? 700 : 500,
                  backgroundColor: isSelected ? '#fffbeb' : 'transparent',
                  color: isSelected ? '#b45309' : '#44403c'
                }}
              >
                <div style={{ display: 'flex', gap: 2 }}>
                  {[...Array(5)].map((_, idx) => (
                    <Star
                      key={idx}
                      size={12}
                      style={{
                        fill: idx < r.val ? '#f59e0b' : '#e7e5e4',
                        color: idx < r.val ? '#f59e0b' : '#e7e5e4'
                      }}
                    />
                  ))}
                </div>
                <span>{r.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 5: In Stock Switch */}
      <div style={{ paddingTop: 14, borderTop: '1px solid #f5f5f4' }}>
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#292524' }}>
          <span>Chỉ hiện còn hàng</span>
          <input
            type="checkbox"
            checked={inStockOnlyParam}
            onChange={(e) => updateQuery({ inStockOnly: e.target.checked ? true : undefined })}
            style={{ width: 16, height: 16, accentColor: '#007700', cursor: 'pointer' }}
          />
        </label>
      </div>
    </aside>
  );
};
