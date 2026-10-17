import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ChevronRight, Check } from 'lucide-react';
import { productsService } from '../../product/services/productsService';
import { favoritesService } from '../../product/services/favoritesService';
import { isLoggedIn } from '../../../infrastructure/api/interceptors';
import { ProductItem } from '../../product/types/product';
import { SeoMeta } from '../../../shared/components/SeoMeta';
import { SearchHeaderBanner } from '../components/search/SearchHeaderBanner';
import { SearchFilterSidebar } from '../components/search/SearchFilterSidebar';
import { SearchActiveFilterTags } from '../components/search/SearchActiveFilterTags';
import { SearchProductCard } from '../components/search/SearchProductCard';
import { SearchPagination } from '../components/search/SearchPagination';
import { SearchEmptyState } from '../components/search/SearchEmptyState';
import { addRecentSearch } from '../components/search/recentSearchStorage';
import '../../../shared/components/layouts.css';

const SORT_OPTIONS = [
  { key: 'relevance', label: 'Phù hợp nhất' },
  { key: 'newest', label: 'Mới nhất' },
  { key: 'best_seller', label: 'Bán chạy' },
  { key: 'price_asc', label: 'Giá tăng dần' },
  { key: 'price_desc', label: 'Giá giảm dần' },
  { key: 'rating_desc', label: 'Đánh giá cao' }
];


export function BuyerSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL query state
  const qParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';
  const productTypeParam = searchParams.get('productType') || '';
  const sortParam = searchParams.get('sort') || 'relevance';
  const minPriceParam = searchParams.get('minPrice') || '';
  const maxPriceParam = searchParams.get('maxPrice') || '';
  const ratingParam = searchParams.get('rating') || '';
  const inStockOnlyParam = searchParams.get('inStockOnly') === 'true';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  // Local states
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchLogId, setSearchLogId] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [favoritedProductIds, setFavoritedProductIds] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [popularKeywords, setPopularKeywords] = useState<string[]>([
    'Quà Tặng',
    'Áo Đồng Phục',
    'Áo Thun',
    'Quà Sinh Nhật',
    'Móc Khóa',
    'Túi Tote'
  ]);

  useEffect(() => {
    productsService.getTrendingKeywords(6)
      .then((kws) => {
        if (kws && kws.length > 0) setPopularKeywords(kws);
      })
      .catch(() => {});
  }, []);

  const triggerToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch Category meta
  useEffect(() => {
    const primaryCats = [
      { id: 'cat-gom', name: 'Gốm sứ & Mỹ nghệ', slug: 'gom-su-my-nghe' },
      { id: 'cat-do-go', name: 'Đồ gỗ mỹ nghệ', slug: 'do-go-my-nghe' },
      { id: 'cat-tui', name: 'Túi Tote & Canvas', slug: 'tui-tote-canvas' },
      { id: 'cat-qua-tang', name: 'Phụ kiện & Quà tặng', slug: 'phu-kien-qua-tang' },
      { id: 'cat-may-tre', name: 'Mây tre đan & Cói', slug: 'may-tre-dan' },
      { id: 'cat-vai', name: 'Thời trang & Vải lụa thêu', slug: 'thoi-trang-vai-lua' },
      { id: 'cat-trang-tri', name: 'Trang trí nhà cửa', slug: 'trang-tri' }
    ];

    productsService.getCategories()
      .then((data: any) => {
        const merged = [...primaryCats];
        if (Array.isArray(data)) {
          data.forEach((c: any) => {
            const name = c.name?.trim();
            if (name && !merged.some(m => m.name.toLowerCase() === name.toLowerCase())) {
              merged.push({
                id: c._id || c.id,
                name: name,
                slug: c.slug || ''
              });
            }
          });
        }
        setCategories(merged);
      })
      .catch(() => {
        setCategories(primaryCats);
      });
  }, []);

  // Fetch favorite product IDs
  useEffect(() => {
    if (isLoggedIn()) {
      favoritesService.getFavoriteIds()
        .then(ids => setFavoritedProductIds(ids))
        .catch(() => { });
    }
  }, []);

  // Update query params helper
  const updateQuery = useCallback((updates: Record<string, string | number | boolean | undefined | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (val === undefined || val === null || val === '') {
        next.delete(key);
      } else {
        next.set(key, String(val));
      }
    });
    // Reset to page 1 whenever any filter besides page changes
    if (!('page' in updates)) {
      next.delete('page');
    }
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (qParam) addRecentSearch(qParam);
  }, [qParam]);

  // Main search API caller
  useEffect(() => {
    setIsLoading(true);

    const params: any = {
      q: qParam || undefined,
      category: categoryParam || undefined,
      productType: productTypeParam || undefined,
      sort: sortParam,
      minPrice: minPriceParam ? Number(minPriceParam) : undefined,
      maxPrice: maxPriceParam ? Number(maxPriceParam) : undefined,
      rating: ratingParam ? Number(ratingParam) : undefined,
      inStockOnly: inStockOnlyParam ? true : undefined,
      page: pageParam,
      limit: 16
    };

    productsService.search(params)
      .then((res) => {
        setProducts(res.items as ProductItem[]);
        setTotal(res.total);
        setTotalPages(res.totalPages || 1);
        setSearchLogId(res.searchLogId);
      })
      .catch((err) => {
        console.error('Search error:', err);
        setProducts([]);
        setTotal(0);
        setTotalPages(1);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [qParam, categoryParam, productTypeParam, sortParam, minPriceParam, maxPriceParam, ratingParam, inStockOnlyParam, pageParam]);

  // Wishlist toggle
  const handleToggleFavorite = async (productId: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }
    try {
      const res = await favoritesService.toggleFavorite(productId);
      const isFav = res.isFavorite;
      setFavoritedProductIds(prev =>
        isFav ? [...prev, productId] : prev.filter(id => id !== productId)
      );
      triggerToast(
        isFav ? `Đã thêm "${title}" vào mục yêu thích` : `Đã bỏ "${title}" khỏi mục yêu thích`,
        isFav ? 'success' : 'info'
      );
    } catch {
      triggerToast('Không thể cập nhật danh sách yêu thích', 'info');
    }
  };

  const handleResetFilters = () => {
    setSearchParams(qParam ? { q: qParam } : {});
  };

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return Boolean(
      categoryParam ||
      productTypeParam ||
      minPriceParam ||
      maxPriceParam ||
      ratingParam ||
      inStockOnlyParam ||
      (sortParam && sortParam !== 'relevance')
    );
  }, [categoryParam, productTypeParam, minPriceParam, maxPriceParam, ratingParam, inStockOnlyParam, sortParam]);

  // SEO Info calculation
  const seoTitle = useMemo(() => {
    if (qParam && categoryParam) return `"${qParam}" trong ${categoryParam} · VietCraft`;
    if (qParam) return `Tìm kiếm: "${qParam}" · VietCraft`;
    if (categoryParam) return `Sản phẩm ${categoryParam} · VietCraft`;
    return 'Tìm kiếm sản phẩm thủ công · VietCraft';
  }, [qParam, categoryParam]);

  const seoDescription = useMemo(() => {
    if (qParam) {
      return `Tìm thấy ${total} sản phẩm thủ công mỹ nghệ tinh xảo phù hợp với từ khóa "${qParam}" tại VietCraft. Giao hàng toàn quốc, kiểm định nghệ nhân.`;
    }
    return 'Khám phá hàng ngàn sản phẩm thủ công, quà tặng nghệ thuật và phôi in POD độc đáo từ các nghệ nhân Việt Nam.';
  }, [qParam, total]);

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', padding: '24px 16px 64px' }}>
      <SeoMeta title={seoTitle} description={seoDescription} noindex={true} />

      {/* Breadcrumbs */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#78716c', marginBottom: 20 }}>
        <Link to="/" style={{ color: '#57534e', textDecoration: 'none', fontWeight: 500 }} className="hover:text-[#007700]">
          Trang chủ
        </Link>
        <ChevronRight size={14} color="#a8a29e" />
        <span style={{ color: '#1c1917', fontWeight: 600 }}>Tìm kiếm</span>
        {categoryParam && (
          <>
            <ChevronRight size={14} color="#a8a29e" />
            <span style={{ color: '#007700', fontWeight: 600 }}>{categoryParam}</span>
          </>
        )}
      </nav>

      {/* Search Header Banner */}
      <SearchHeaderBanner
        query={qParam}
        category={categoryParam}
        total={total}
        popularKeywords={popularKeywords}
        onSelectKeyword={(kw) => updateQuery({ q: kw })}
      />

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <SearchActiveFilterTags
          categoryParam={categoryParam}
          productTypeParam={productTypeParam}
          minPriceParam={minPriceParam}
          maxPriceParam={maxPriceParam}
          ratingParam={ratingParam}
          inStockOnlyParam={inStockOnlyParam}
          updateQuery={updateQuery}
          onResetFilters={handleResetFilters}
        />
      )}

      {/* Main Grid: Sidebar + Products */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 28, alignItems: 'start' }}>
        {/* Left Sidebar Filters */}
        <SearchFilterSidebar
          categories={categories}
          categoryParam={categoryParam}
          productTypeParam={productTypeParam}
          minPriceParam={minPriceParam}
          maxPriceParam={maxPriceParam}
          ratingParam={ratingParam}
          inStockOnlyParam={inStockOnlyParam}
          hasActiveFilters={hasActiveFilters}
          updateQuery={updateQuery}
          onResetFilters={handleResetFilters}
        />

        {/* Right Column: Search Results */}
        <section>
          {/* Sorting Toolbar */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 14,
            border: '1px solid #e7e5e4',
            padding: '12px 20px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#78716c' }}>Sắp xếp theo:</span>
              {SORT_OPTIONS.map((opt) => {
                const isActive = sortParam === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => updateQuery({ sort: opt.key })}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 20,
                      border: isActive ? '1px solid #007700' : '1px solid #e7e5e4',
                      backgroundColor: isActive ? '#007700' : '#ffffff',
                      color: isActive ? '#ffffff' : '#44403c',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <div style={{ fontSize: 13, color: '#78716c' }}>
              Trang <strong style={{ color: '#1c1917' }}>{pageParam}</strong> / {totalPages || 1}
            </div>
          </div>

          {/* Product Grid / State Handling */}
          {isLoading ? (
            /* Skeleton Loading Grid */
            <div className="buyer-grid-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #f0edf0',
                    borderRadius: 12,
                    overflow: 'hidden',
                    height: 320,
                    animation: 'pulse 1.5s infinite ease-in-out'
                  }}
                >
                  <div style={{ width: '100%', height: 200, backgroundColor: '#f5f5f4' }} />
                  <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ width: '70%', height: 14, backgroundColor: '#e7e5e4', borderRadius: 4 }} />
                    <div style={{ width: '40%', height: 12, backgroundColor: '#f0edf0', borderRadius: 4 }} />
                    <div style={{ width: '50%', height: 18, backgroundColor: '#e7e5e4', borderRadius: 4, marginTop: 8 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            /* Empty State */
            <SearchEmptyState
              query={qParam}
              hasActiveFilters={hasActiveFilters}
              popularKeywords={popularKeywords}
              onSelectKeyword={(kw) => updateQuery({ q: kw, category: undefined, minPrice: undefined, maxPrice: undefined })}
              onResetFilters={handleResetFilters}
            />
          ) : (
            /* Results Grid */
            <>
              <div className="buyer-grid-4">
                {products.map((p, idx) => (
                  <SearchProductCard
                    key={p.id}
                    product={p}
                    isFavorited={favoritedProductIds.includes(p.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onClick={() => {
                      if (searchLogId) productsService.trackSearchClick(searchLogId, p.id, idx);
                      navigate(`/product/${p.id}`);
                    }}
                  />
                ))}
              </div>

              {/* Pagination Bar */}
              <SearchPagination
                currentPage={pageParam}
                totalPages={totalPages}
                onPageChange={(page) => updateQuery({ page })}
              />
            </>
          )}
        </section>
      </div>

      {/* Floating Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          backgroundColor: toast.type === 'success' ? '#007700' : '#1c1917',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          fontSize: 13,
          fontWeight: 600,
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <Check size={16} />
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default BuyerSearchPage;
