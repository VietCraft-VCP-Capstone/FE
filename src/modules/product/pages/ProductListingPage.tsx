import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ProductItem, ProductFormData, ProductFilterState } from '../types/product';
import { productsService } from '../services/productsService';
import { getApiErrorMessage } from '../../../infrastructure/api/interceptors';
import { ProductFilterBar } from '../components/ProductFilterBar';
import { ProductTable } from '../components/ProductTable';
import { ProductFormModal } from '../components/ProductFormModal';
import { ProductDetailModal } from '../components/ProductDetailModal';
import { ProductDeleteModal } from '../components/ProductDeleteModal';
import { ProductBatchActionsBar } from '../components/ProductBatchActionsBar';
import { ProductPagination } from '../components/ProductPagination';
import { useProductFormDeepLink } from '../hooks/useProductFormDeepLink';
import { useToast } from '../../../shared/components/Toast';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';
import { analyticsApi } from '../../analytics/services/analyticsApi';
import { Plus, Sparkles } from 'lucide-react';


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
  const [health, setHealth] = useState<Map<string, number | null>>(new Map());

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [focusField, setFocusField] = useState<string | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<ProductItem | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<ProductItem | null>(null);
  const [isBatchDeleteOpen, setIsBatchDeleteOpen] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  const openForm = useCallback((product: ProductItem | null, field: string | null = null) => {
    setEditingProduct(product);
    setFocusField(field);
    setIsFormOpen(true);
  }, []);
  useProductFormDeepLink(openForm, showToast);

  const debounceTimerRef = useRef<any>(null);
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
      const data = await productsService.getMine(currentFilter);
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
          productsService.getMine(nextFilter).then((nextData) => {
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
        showToast(getApiErrorMessage(err, 'Không thể tải danh sách sản phẩm.'), 'error');
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

  useEffect(() => {
    analyticsApi
      .listingsHealth()
      .then(res => setHealth(new Map((res.data?.items ?? []).map(i => [i.product_id, i.score] as const))))
      .catch(() => setHealth(new Map()));
  }, []);

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
      showToast('Lỗi khi lưu sản phẩm: ' + getApiErrorMessage(err, err.message), 'error');
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
      showToast('Không thể xóa sản phẩm: ' + getApiErrorMessage(err, err.message), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Batch Delete
  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    setIsBatchDeleteOpen(true);
  };

  const handleConfirmBatchDelete = async () => {
    setActionLoading(true);
    try {
      cacheRef.current.clear();
      await productsService.batchDelete(selectedIds);
      showToast(`Đã xóa thành công ${selectedIds.length} sản phẩm.`, 'success');
      setSelectedIds([]);
      setIsBatchDeleteOpen(false);
      await fetchProducts(filter);
    } catch (err: any) {
      showToast('Lỗi khi xóa hàng loạt: ' + getApiErrorMessage(err, err.message), 'error');
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
      showToast('Lỗi cập nhật trạng thái: ' + getApiErrorMessage(err, err.message), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenCreate = () => openForm(null);

  const handleOpenEdit = (p: ProductItem) => openForm(p);

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
          <Link
            to="/seller/products/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-sm font-bold rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer font-jakarta no-underline"
          >
            <Sparkles size={16} /> Tạo sản phẩm POD (Design)
          </Link>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#007700] hover:bg-[#005B00] text-white text-sm font-bold rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer font-jakarta"
          >
            <Plus size={16} /> Thêm sản phẩm thường
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
      <ProductBatchActionsBar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onSetStatus={handleBatchStatus}
        onDelete={handleBatchDelete}
      />

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
        health={health}
      />

      {/* Server-Side Pagination Footer */}
      <ProductPagination
        currentPage={currentPage}
        pageSize={filter.pageSize}
        totalPages={totalPages}
        totalResults={totalResults}
        loading={loading}
        onPageChange={(page) => setFilter((prev) => ({ ...prev, page }))}
      />

      {/* Create / Edit Modal */}
      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        product={editingProduct}
        loading={actionLoading}
        focusField={focusField}
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

      {/* Batch Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isBatchDeleteOpen}
        variant="danger"
        title="Xác nhận xóa hàng loạt"
        message={`Bạn có chắc chắn muốn xóa ${selectedIds.length} sản phẩm đã chọn không?\n\nThao tác này sẽ xóa các sản phẩm khỏi danh sách gian hàng.`}
        confirmLabel={`Xóa ${selectedIds.length} sản phẩm`}
        cancelLabel="Hủy bỏ"
        isLoading={actionLoading}
        onConfirm={handleConfirmBatchDelete}
        onCancel={() => setIsBatchDeleteOpen(false)}
      />
    </div>
  );
}

export default ProductListingPage;
