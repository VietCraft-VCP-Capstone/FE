import React from 'react';
import { Filter, X, RotateCcw } from 'lucide-react';
import { PRODUCT_TYPE_LABELS, SearchFilters, UpdateQuery } from './searchFilters';

interface SearchActiveFilterTagsProps {
  filters: SearchFilters;
  updateQuery: UpdateQuery;
  onResetFilters: () => void;
}

const vnd = (v: string) => Number(v).toLocaleString('vi-VN') + 'đ';

const Chip: React.FC<{ colors: [string, string, string]; onRemove: () => void; children: React.ReactNode }> = ({ colors: [bg, border, color], onRemove, children }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 16, backgroundColor: bg, border: `1px solid ${border}`, color, fontSize: 12, fontWeight: 600 }}>
    {children}
    <X size={12} style={{ cursor: 'pointer' }} onClick={onRemove} />
  </span>
);

export const SearchActiveFilterTags: React.FC<SearchActiveFilterTagsProps> = ({ filters: f, updateQuery, onResetFilters }) => (
  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 20, padding: '12px 18px', backgroundColor: '#fcfbf9', border: '1px solid #ebd0eb', borderRadius: 12 }}>
    <span style={{ fontSize: 12, fontWeight: 700, color: '#57534e', display: 'flex', alignItems: 'center', gap: 6 }}>
      <Filter size={13} color="#007700" /> Bộ lọc đang áp dụng:
    </span>
    {f.category && (
      <Chip colors={['#ecfdf5', '#a7f3d0', '#007700']} onRemove={() => updateQuery({ category: undefined })}>Danh mục: {f.category}</Chip>
    )}
    {f.productType && (
      <Chip colors={['#f5f3ff', '#ddd6fe', '#6d28d9']} onRemove={() => updateQuery({ productType: undefined })}>
        Loại: {PRODUCT_TYPE_LABELS[f.productType] || f.productType}
      </Chip>
    )}
    {(f.minPrice || f.maxPrice) && (
      <Chip colors={['#fef3c7', '#fde68a', '#b45309']} onRemove={() => updateQuery({ minPrice: undefined, maxPrice: undefined })}>
        Giá: {f.minPrice ? vnd(f.minPrice) : '0đ'} - {f.maxPrice ? vnd(f.maxPrice) : 'Vô cực'}
      </Chip>
    )}
    {f.rating && (
      <Chip colors={['#fffbeb', '#fef3c7', '#d97706']} onRemove={() => updateQuery({ rating: undefined })}>Từ {f.rating} sao</Chip>
    )}
    {f.inStockOnly && (
      <Chip colors={['#f0fdf4', '#bbf7d0', '#15803d']} onRemove={() => updateQuery({ inStockOnly: undefined })}>Còn hàng</Chip>
    )}
    <button
      type="button"
      onClick={onResetFilters}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 16, backgroundColor: '#ffffff', border: '1px solid #e7e5e4', color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginLeft: 'auto' }}
    >
      <RotateCcw size={13} /> Xóa tất cả bộ lọc
    </button>
  </div>
);
