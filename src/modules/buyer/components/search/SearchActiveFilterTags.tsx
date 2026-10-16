import React from 'react';
import { Filter, X, RotateCcw } from 'lucide-react';

interface SearchActiveFilterTagsProps {
  categoryParam: string;
  productTypeParam: string;
  minPriceParam: string;
  maxPriceParam: string;
  ratingParam: string;
  inStockOnlyParam: boolean;
  updateQuery: (updates: Record<string, string | number | boolean | undefined | null>) => void;
  onResetFilters: () => void;
}

export const SearchActiveFilterTags: React.FC<SearchActiveFilterTagsProps> = ({
  categoryParam,
  productTypeParam,
  minPriceParam,
  maxPriceParam,
  ratingParam,
  inStockOnlyParam,
  updateQuery,
  onResetFilters
}) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 20,
      padding: '12px 18px',
      backgroundColor: '#fcfbf9',
      border: '1px solid #ebd0eb',
      borderRadius: 12
    }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#57534e', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Filter size={13} color="#007700" /> Bộ lọc đang áp dụng:
      </span>

      {categoryParam && (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '3px 10px',
          borderRadius: 16,
          backgroundColor: '#ecfdf5',
          border: '1px solid #a7f3d0',
          color: '#007700',
          fontSize: 12,
          fontWeight: 600
        }}>
          Danh mục: {categoryParam}
          <X size={12} style={{ cursor: 'pointer' }} onClick={() => updateQuery({ category: undefined })} />
        </span>
      )}

      {productTypeParam && (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '3px 10px',
          borderRadius: 16,
          backgroundColor: '#f5f3ff',
          border: '1px solid #ddd6fe',
          color: '#6d28d9',
          fontSize: 12,
          fontWeight: 600
        }}>
          Loại: {productTypeParam === 'READY_TO_SHIP' ? 'Thủ công có sẵn' : 'In theo yêu cầu (POD)'}
          <X size={12} style={{ cursor: 'pointer' }} onClick={() => updateQuery({ productType: undefined })} />
        </span>
      )}

      {(minPriceParam || maxPriceParam) && (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '3px 10px',
          borderRadius: 16,
          backgroundColor: '#fef3c7',
          border: '1px solid #fde68a',
          color: '#b45309',
          fontSize: 12,
          fontWeight: 600
        }}>
          Giá: {minPriceParam ? Number(minPriceParam).toLocaleString('vi-VN') + 'đ' : '0đ'} - {maxPriceParam ? Number(maxPriceParam).toLocaleString('vi-VN') + 'đ' : 'Vô cực'}
          <X size={12} style={{ cursor: 'pointer' }} onClick={() => updateQuery({ minPrice: undefined, maxPrice: undefined })} />
        </span>
      )}

      {ratingParam && (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '3px 10px',
          borderRadius: 16,
          backgroundColor: '#fffbeb',
          border: '1px solid #fef3c7',
          color: '#d97706',
          fontSize: 12,
          fontWeight: 600
        }}>
          Từ {ratingParam} sao
          <X size={12} style={{ cursor: 'pointer' }} onClick={() => updateQuery({ rating: undefined })} />
        </span>
      )}

      {inStockOnlyParam && (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '3px 10px',
          borderRadius: 16,
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          color: '#15803d',
          fontSize: 12,
          fontWeight: 600
        }}>
          Còn hàng
          <X size={12} style={{ cursor: 'pointer' }} onClick={() => updateQuery({ inStockOnly: undefined })} />
        </span>
      )}

      <button
        type="button"
        onClick={onResetFilters}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '3px 10px',
          borderRadius: 16,
          backgroundColor: '#ffffff',
          border: '1px solid #e7e5e4',
          color: '#dc2626',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          marginLeft: 'auto'
        }}
      >
        <RotateCcw size={13} /> Xóa tất cả bộ lọc
      </button>
    </div>
  );
};
