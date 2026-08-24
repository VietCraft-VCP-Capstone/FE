import { useState, useEffect, useCallback, useRef } from 'react';
import { ProductItem, ProductFormData, ProductFilterState } from '../types/product';
import { productsService } from '../services/productsService';
import { ProductFilterBar } from '../components/ProductFilterBar';
import { ProductTable } from '../components/ProductTable';
import { ProductFormModal } from '../components/ProductFormModal';
import { ProductDetailModal } from '../components/ProductDetailModal';
import { ProductDeleteModal } from '../components/ProductDeleteModal';
import { useToast } from '../../../shared/components/Toast';
import {
  Plus,
  Trash2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const INITIAL_FILTER: ProductFilterState = {
  search: '',
  status: 'ALL',
  category: '',
  sort: 'newest',
  page: 1,
  pageSize: 6
};

export function ProductListingPage() {
  const { showToast } = useToast();

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ProductFilterState>(INITIAL_FILTER);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<ProductItem | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<ProductItem | null>(null);

  const [actionLoading, setActionLoading] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cacheRef = useRef<Map<string, { items: ProductItem[]; total: number; totalPages: number }>>(new Map());

  const getFilterKey = (f: ProductFilterState) => {
    return `${f.search}_${f.status}_${f.category}_${f.sort}_${f.page}_${f.pageSize}`;
  };

  const fetchProducts = useCallback(async (currentFilter: ProductFilterState, isSilent: boolean = false) => {
    const key = getFilterKey(currentFilter);
    const cached = cacheRef.current.get(key);

    if (cached && !isSilent) {
      setProducts(cached.items);
      setTotalResults(cached.total);
      setTotalPages(Math.max(1, cached.totalPages));
      setLoading(false);
    } else if (!isSilent) {
      setLoading(true);
    }

    try {
      const data = await productsService.getAll(currentFilter);
      cacheRef.current.set(key, {
        items: data.items,
        total: data.total,
        totalPages: data.totalPages,
      });

      setProducts(data.items);
      setTotalResults(data.total);
      setTotalPages(Math.max(1, data.totalPages));

      // Background Pre-fetching next page if exists
      if (currentFilter.page < data.totalPages) {
        const nextFilter = { ...currentFilter, page: currentFilter.page + 1 };
        const nextKey = getFilterKey(nextFilter);
        if (!cacheRef.current.has(nextKey)) {
          productsService.getAll(nextFilter).then((nextData) => {
            cacheRef.current.set(nextKey, {
              items: nextData.items,
              total: nextData.total,
              totalPages: nextData.totalPages,
            });
          }).catch(() => {});
        }
      }
    } catch (err: any) {
      if (!isSilent) {
        showToast('Không thể tải danh sách sản phẩm: ' + err.message, 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchProducts(filter);
    }, 200);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [filter, fetchProducts]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(products.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((x) => x !== id));
    }
  };

  // Create or Update
  const handleFormSubmit = async (formData: ProductFormData) => {
    setActionLoading(true);
    try {
      cacheRef.current.clear();
      if (editingProduct) {
        await productsService.update(editingProduct.id, formData);
        showToast(`Đã cập nhật sản phẩm "${formData.title}" thành công!`, 'success');
      } else {
        await productsService.create(formData);
        showToast(`Đã thêm mới sản phẩm "${formData.title}" thành công!`, 'success');
      }
      setIsFormOpen(false);
      setEditingProduct(null);
      await fetchProducts(filter);
    } catch (err: any) {
      showToast('Lỗi khi lưu sản phẩm: ' + err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Single Product
  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    setActionLoading(true);
    try {
      cacheRef.current.clear();
      await productsService.delete(deletingProduct.id);
      showToast(`Đã xóa sản phẩm "${deletingProduct.title}" thành công.`, 'success');
      setIsDeleteOpen(false);
      setDeletingProduct(null);
      setSelectedIds((prev) => prev.filter((id) => id !== deletingProduct.id));
      await fetchProducts(filter);
    } catch (err: any) {
      showToast('Không thể xóa sản phẩm: ' + err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Batch Delete
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} sản phẩm đã chọn không?`)) {
      return;
    }
    setActionLoading(true);
    try {
      cacheRef.current.clear();
      await productsService.batchDelete(selectedIds);
      showToast(`Đã xóa thành công ${selectedIds.length} sản phẩm.`, 'success');
      setSelectedIds([]);
      await fetchProducts(filter);
    } catch (err: any) {
      showToast('Lỗi khi xóa hàng loạt: ' + err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Batch Status Update
  const handleBatchStatus = async (status: 'ACTIVE' | 'INACTIVE') => {
    if (selectedIds.length === 0) return;
    setActionLoading(true);
    try {
      cacheRef.current.clear();
      await productsService.updateStatus(selectedIds, status);
      const label = status === 'ACTIVE' ? 'Đang bán' : 'Tạm dừng';
      showToast(`Đã chuyển ${selectedIds.length} sản phẩm sang trạng thái ${label}.`, 'success');
      setSelectedIds([]);
      await fetchProducts(filter);
    } catch (err: any) {
      showToast('Lỗi cập nhật trạng thái: ' + err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p: ProductItem) => {
    setEditingProduct(p);
    setIsFormOpen(true);
  };

  const handleOpenDetail = (p: ProductItem) => {
    setViewingProduct(p);
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (p: ProductItem) => {
    setDeletingProduct(p);
    setIsDeleteOpen(true);
  };

  const currentPage = filter.page;

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight font-jakarta">
            Quản lý sản phẩm & Mẫu in
          </h1>
          <p className="text-sm text-stone-500 mt-1 font-normal">
            Quản lý danh mục phôi áo, hình in và phân loại sản phẩm trong gian hàng.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#007700] hover:bg-[#005B00] text-white text-sm font-bold rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer font-jakarta"
          >
            <Plus size={16} /> Thêm sản phẩm
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <ProductFilterBar
        filter={filter}
        onChange={setFilter}
        onReset={() => setFilter(INITIAL_FILTER)}
        totalResults={totalResults}
      />

      {/* Batch Actions Bar (Sleek, brand-aligned green theme) */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#EAF0E2] border border-[#BECAB6] rounded-2xl shadow-xs animate-fade-in">
          <div className="flex items-center gap-2.5 pl-2">
            <div className="w-7 h-7 rounded-full bg-[#007700] text-white flex items-center justify-center shadow-2xs">
              <CheckCircle2 size={16} />
            </div>
            <div className="flex items-center">
              <span className="text-sm font-bold text-[#005B00] font-jakarta">
                Đã chọn {selectedIds.length} sản phẩm
              </span>
              <button
                onClick={() => setSelectedIds([])}
                className="ml-3 text-xs font-semibold text-stone-500 hover:text-stone-800 underline underline-offset-2 cursor-pointer"
              >
                Bỏ chọn
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBatchStatus('ACTIVE')}
              className="px-3.5 py-2 bg-white hover:bg-emerald-50 text-[#007700] text-xs font-bold rounded-xl border border-emerald-300 shadow-2xs transition-all cursor-pointer font-jakarta"
            >
              Chuyển Đang bán
            </button>
            <button
              onClick={() => handleBatchStatus('INACTIVE')}
              className="px-3.5 py-2 bg-white hover:bg-stone-100 text-stone-700 text-xs font-semibold rounded-xl border border-stone-200 shadow-2xs transition-all cursor-pointer font-jakarta"
            >
              Chuyển Tạm dừng
            </button>
            <button
              onClick={handleBatchDelete}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-[#BA1A1A] text-xs font-bold rounded-xl border border-rose-200 shadow-2xs transition-all cursor-pointer font-jakarta"
            >
              <Trash2 size={14} /> Xóa đã chọn
            </button>
          </div>
        </div>
      )}

      {/* Main Product Table */}
      <ProductTable
        products={products}
        selectedIds={selectedIds}
        onSelectAll={handleSelectAll}
        onSelectOne={handleSelectOne}
        onView={handleOpenDetail}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
        loading={loading}
      />

      {/* Server-Side Pagination Footer */}
      {totalResults > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="text-xs text-stone-500 font-medium">
            Hiển thị{' '}
            <span className="font-bold text-stone-800">
              {(currentPage - 1) * filter.pageSize + 1}
            </span>{' '}
            -{' '}
            <span className="font-bold text-stone-800">
              {Math.min(currentPage * filter.pageSize, totalResults)}
            </span>{' '}
            trên <span className="font-bold text-stone-800">{totalResults}</span> sản phẩm
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilter((prev) => ({ ...prev, page: Math.max(1, currentPage - 1) }))}
              disabled={currentPage === 1 || loading}
              className="p-2 rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
              title="Trang trước"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setFilter((prev) => ({ ...prev, page: pageNum }))}
                disabled={loading}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer font-jakarta ${
                  currentPage === pageNum
                    ? 'bg-[#007700] text-white shadow-xs'
                    : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => setFilter((prev) => ({ ...prev, page: Math.min(totalPages, currentPage + 1) }))}
              disabled={currentPage === totalPages || loading}
              className="p-2 rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
              title="Trang sau"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        product={editingProduct}
        loading={actionLoading}
      />

      {/* View Details & Inventory Trends Modal */}
      <ProductDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        product={viewingProduct}
        onEdit={(p) => {
          setIsDetailOpen(false);
          handleOpenEdit(p);
        }}
        onDelete={(p) => {
          setIsDetailOpen(false);
          handleOpenDelete(p);
        }}
      />

      {/* Delete Confirmation Modal */}
      <ProductDeleteModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        product={deletingProduct}
        loading={actionLoading}
      />
    </div>
  );
}

export default ProductListingPage;
