import React, { useState, useEffect } from 'react';
import { Search, X, ArrowUpDown, Filter, RotateCcw } from 'lucide-react';
import { ProductFilterState, ProductStatus, ProductSortOption, CatalogOption } from '../types/product';
import { productsService } from '../services/productsService';

interface ProductFilterBarProps {
  filter: ProductFilterState;
  onChange: (newFilter: ProductFilterState) => void;
  onReset: () => void;
  totalResults: number;
}

export function ProductFilterBar({ filter, onChange, onReset, totalResults }: ProductFilterBarProps) {
  // Lọc phải dùng đúng danh mục admin đang quản lý. Danh sách cứng trước đây không
  // trùng mục nào trong DB nên chọn xong luôn ra 0 kết quả.
  const [categories, setCategories] = useState<CatalogOption[]>([]);

  useEffect(() => {
    let alive = true;
    productsService.getCategories()
      .then((data) => { if (alive) setCategories(Array.isArray(data) ? data : []); })
      .catch(() => { /* lọc theo danh mục hỏng không được làm gãy cả thanh công cụ */ });
    return () => { alive = false; };
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filter, search: e.target.value, page: 1 });
  };

  const handleClearSearch = () => {
    onChange({ ...filter, search: '', page: 1 });
  };

  const handleStatusChange = (status: ProductStatus | 'ALL') => {
    onChange({ ...filter, status, page: 1 });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filter, category: e.target.value, page: 1 });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filter, sort: e.target.value as ProductSortOption, page: 1 });
  };

  const statusPills: { label: string; value: ProductStatus | 'ALL' }[] = [
    { label: 'Tất cả', value: 'ALL' },
    { label: 'Đang bán', value: 'ACTIVE' },
    { label: 'Tạm dừng', value: 'INACTIVE' },
    { label: 'Hết hàng', value: 'OUT_OF_STOCK' },
  ];

  const hasActiveFilters = filter.search || filter.status !== 'ALL' || filter.category;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-4 sm:p-5 space-y-4">
      {/* Top Controls: Search + Category + Sort */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="flex-1 max-w-xl relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={filter.search}
            onChange={handleSearchChange}
            placeholder="Tìm kiếm sản phẩm theo tên, SKU, xưởng sản xuất..."
            className="w-full pl-10 pr-9 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700] transition-all font-sans"
          />
          {filter.search && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 rounded-full hover:bg-stone-200 transition-colors cursor-pointer"
              title="Xóa tìm kiếm"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category */}
          <div className="flex items-center gap-2 bg-stone-50/80 border border-stone-200 rounded-xl px-3.5 py-2 text-sm text-stone-700">
            <Filter size={14} className="text-stone-400 flex-shrink-0" />
            <select
              value={filter.category}
              onChange={handleCategoryChange}
              className="bg-transparent text-sm text-stone-700 font-medium focus:outline-none cursor-pointer pr-1"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 bg-stone-50/80 border border-stone-200 rounded-xl px-3.5 py-2 text-sm text-stone-700">
            <ArrowUpDown size={14} className="text-stone-400 flex-shrink-0" />
            <span className="text-stone-400 text-xs hidden sm:inline">Sắp xếp:</span>
            <select
              value={filter.sort}
              onChange={handleSortChange}
              className="bg-transparent text-sm text-stone-700 font-medium focus:outline-none cursor-pointer pr-1"
            >
              <option value="newest">Mới nhất</option>
              <option value="price_asc">Giá: Thấp → Cao</option>
              <option value="price_desc">Giá: Cao → Thấp</option>
              <option value="stock_desc">Tồn kho nhiều nhất</option>
              <option value="stock_asc">Tồn kho sắp hết</option>
              <option value="rank_asc">Độ ưu tiên</option>
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 hover:text-stone-900 rounded-xl transition-colors cursor-pointer"
              title="Đặt lại bộ lọc"
            >
              <RotateCcw size={13} />
              <span>Đặt lại</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Status Filter Pills Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mr-1.5 font-jakarta">
            TRẠNG THÁI:
          </span>
          {statusPills.map((pill) => {
            const isActive = filter.status === pill.value;
            return (
              <button
                key={pill.value}
                onClick={() => handleStatusChange(pill.value)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-150 cursor-pointer font-jakarta ${
                  isActive
                    ? 'bg-[#007700] text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200/80 hover:text-stone-900'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        <div className="text-xs text-stone-500 font-medium">
          Tìm thấy <span className="font-bold text-stone-800 font-jakarta">{totalResults}</span> sản phẩm
        </div>
      </div>
    </div>
  );
}
