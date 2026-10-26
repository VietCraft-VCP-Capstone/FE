import { useState, useEffect, useMemo, type MouseEvent } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { productsService } from '../../product/services/productsService';
import { favoritesService } from '../../product/services/favoritesService';
import { promotionService } from '../../promotion/services/promotionService';
import { buildDeals } from '../components/deals/buildDeals';
import { isLoggedIn } from '../../../infrastructure/api/interceptors';
import { ProductItem } from '../../product/types/product';
import { SeoMeta } from '../../../shared/components/SeoMeta';
import { useToast } from '../../../shared/components/Toast';
import { SearchHeaderBanner } from '../components/search/SearchHeaderBanner';
import { SearchFilterSidebar } from '../components/search/SearchFilterSidebar';
import { SearchActiveFilterTags } from '../components/search/SearchActiveFilterTags';
import { SearchProductCard } from '../components/search/SearchProductCard';
import { SearchPagination } from '../components/search/SearchPagination';
import { SearchEmptyState } from '../components/search/SearchEmptyState';
import { rememberSearch } from '../components/search/recentSearchStorage';
import { SearchFilters, UpdateQuery } from '../components/search/searchFilters';
import { FALLBACK_KEYWORDS } from '../components/SearchPopover';
import '../../../shared/components/layouts.css';

const SORT_OPTIONS = [
  { key: 'relevance', label: 'Phù hợp nhất' },
  { key: 'newest', label: 'Mới nhất' },
  { key: 'best_seller', label: 'Bán chạy' },
  { key: 'price_asc', label: 'Giá tăng dần' },
  { key: 'price_desc', label: 'Giá giảm dần' },
  { key: 'rating_desc', label: 'Đánh giá cao' }
];

const PRIMARY_CATEGORIES = [
  { id: 'cat-gom', name: 'Gốm sứ & Mỹ nghệ', slug: 'gom-su-my-nghe' },
  { id: 'cat-do-go', name: 'Đồ gỗ mỹ nghệ', slug: 'do-go-my-nghe' },
  { id: 'cat-tui', name: 'Túi Tote & Canvas', slug: 'tui-tote-canvas' },
  { id: 'cat-qua-tang', name: 'Phụ kiện & Quà tặng', slug: 'phu-kien-qua-tang' },
  { id: 'cat-may-tre', name: 'Mây tre đan & Cói', slug: 'may-tre-dan' },
  { id: 'cat-vai', name: 'Thời trang & Vải lụa thêu', slug: 'thoi-trang-vai-lua' },
  { id: 'cat-trang-tri', name: 'Trang trí nhà cửa', slug: 'trang-tri' }
];

export function BuyerSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const qParam = searchParams.get('q') || '';
  const sortParam = searchParams.get('sort') || 'relevance';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const filters: SearchFilters = {
    category: searchParams.get('category') || '',
    productType: searchParams.get('productType') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    rating: searchParams.get('rating') || '',
    inStockOnly: searchParams.get('inStockOnly') === 'true'
  };
  const { category, productType, minPrice, maxPrice, rating, inStockOnly } = filters;

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchLogId, setSearchLogId] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState(PRIMARY_CATEGORIES);
  const [favoritedProductIds, setFavoritedProductIds] = useState<string[]>([]);
  const [popularKeywords, setPopularKeywords] = useState(FALLBACK_KEYWORDS.slice(0, 6));
  const [coupons, setCoupons] = useState<any[]>([]);
  const { showToast } = useToast();
  const dealMap = useMemo(() => new Map(buildDeals(coupons, products, Infinity).map(d => [d.id, d])), [coupons, products]);

  useEffect(() => {
    promotionService.getAll().then((list: any) => setCoupons(Array.isArray(list) ? list : [])).catch(() => { });
    productsService.getTrendingKeywords(6).then((kws) => { if (kws.length) setPopularKeywords(kws); });
    if (isLoggedIn()) favoritesService.getFavoriteIds().then(setFavoritedProductIds);
    productsService.getCategories().then((data: any) => {
      const merged = [...PRIMARY_CATEGORIES];
      for (const c of Array.isArray(data) ? data : []) {
        const name = c.name?.trim();
        if (name && !merged.some(m => m.name.toLowerCase() === name.toLowerCase())) merged.push({ id: c._id || c.id, name, slug: c.slug || '' });
      }
      setCategories(merged);
    }).catch(() => { });
  }, []);

  const updateQuery: UpdateQuery = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (val === undefined || val === null || val === '') {
        next.delete(key);
      } else {
        next.set(key, String(val));
      }
    });
    if (!('page' in updates)) next.delete('page');
    setSearchParams(next);
  };

  useEffect(() => {
    if (qParam) rememberSearch(qParam);
  }, [qParam]);

  useEffect(() => {
    setIsLoading(true);
    productsService.search({
      q: qParam || undefined,
      category: category || undefined,
      productType: productType || undefined,
      sort: sortParam,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      rating: rating ? Number(rating) : undefined,
      inStockOnly: inStockOnly || undefined,
      page: pageParam,
      limit: 16
    }).then((res) => {
      setProducts(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages || 1);
      setSearchLogId(res.searchLogId);
      setIsLoading(false);
    });
  }, [qParam, category, productType, sortParam, minPrice, maxPrice, rating, inStockOnly, pageParam]);

  const handleToggleFavorite = async (productId: string, title: string, e: MouseEvent) => {
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
      showToast(
        isFav ? `Đã thêm "${title}" vào mục yêu thích` : `Đã bỏ "${title}" khỏi mục yêu thích`,
        isFav ? 'success' : 'info'
      );
    } catch {
      showToast('Không thể cập nhật danh sách yêu thích', 'error');
    }
  };

  const handleResetFilters = () => {
    setSearchParams(qParam ? { q: qParam } : {});
  };

  const hasActiveFilters = Boolean(category || productType || minPrice || maxPrice || rating || inStockOnly || sortParam !== 'relevance');

  const seoTitle = qParam && category ? `"${qParam}" trong ${category} · VietCraft`
    : qParam ? `Tìm kiếm: "${qParam}" · VietCraft`
    : category ? `Sản phẩm ${category} · VietCraft`
    : 'Tìm kiếm sản phẩm thủ công · VietCraft';
  const seoDescription = qParam
    ? `Tìm thấy ${total} sản phẩm thủ công mỹ nghệ tinh xảo phù hợp với từ khóa "${qParam}" tại VietCraft. Giao hàng toàn quốc, kiểm định nghệ nhân.`
    : 'Khám phá hàng ngàn sản phẩm thủ công, quà tặng nghệ thuật và phôi in POD độc đáo từ các nghệ nhân Việt Nam.';

  return (
    <div className="mx-auto max-w-[1240px] px-4 pb-16 pt-6">
      <SeoMeta title={seoTitle} description={seoDescription} noindex={true} />

      <nav className="mb-5 flex items-center gap-2 text-[13px] text-[#78716c]">
        <Link to="/" className="font-medium text-[#57534e] no-underline hover:text-[#007700]">Trang chủ</Link>
        <ChevronRight size={14} color="#a8a29e" />
        <span className="font-semibold text-[#1c1917]">Tìm kiếm</span>
        {category && (
          <>
            <ChevronRight size={14} color="#a8a29e" />
            <span className="font-semibold text-[#007700]">{category}</span>
          </>
        )}
      </nav>

      <SearchHeaderBanner
        query={qParam}
        category={category}
        total={total}
        popularKeywords={popularKeywords}
        onSelectKeyword={(kw) => updateQuery({ q: kw })}
      />

      {hasActiveFilters && (
        <SearchActiveFilterTags filters={filters} updateQuery={updateQuery} onResetFilters={handleResetFilters} />
      )}

      <div className="grid grid-cols-[260px_1fr] items-start gap-7">
        <SearchFilterSidebar
          categories={categories}
          filters={filters}
          hasActiveFilters={hasActiveFilters}
          updateQuery={updateQuery}
          onResetFilters={handleResetFilters}
        />

        <section>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#e7e5e4] bg-white px-5 py-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[13px] font-bold text-[#78716c]">Sắp xếp theo:</span>
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => updateQuery({ sort: opt.key })}
                  className={`cursor-pointer rounded-[20px] border px-3.5 py-1.5 text-[12px] font-bold transition-all duration-150 ${sortParam === opt.key ? 'border-[#007700] bg-[#007700] text-white' : 'border-[#e7e5e4] bg-white text-[#44403c]'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="text-[13px] text-[#78716c]">
              Trang <strong className="text-[#1c1917]">{pageParam}</strong> / {totalPages || 1}
            </div>
          </div>

          {isLoading ? (
            <div className="buyer-grid-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-[320px] animate-pulse overflow-hidden rounded-xl border border-[#f0edf0] bg-white">
                  <div className="h-[200px] w-full bg-[#f5f5f4]" />
                  <div className="flex flex-col gap-2 p-3">
                    <div className="h-3.5 w-[70%] rounded bg-[#e7e5e4]" />
                    <div className="h-3 w-[40%] rounded bg-[#f0edf0]" />
                    <div className="mt-2 h-[18px] w-1/2 rounded bg-[#e7e5e4]" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <SearchEmptyState
              query={qParam}
              hasActiveFilters={hasActiveFilters}
              popularKeywords={popularKeywords}
              onSelectKeyword={(kw) => updateQuery({ q: kw, category: undefined, minPrice: undefined, maxPrice: undefined })}
              onResetFilters={handleResetFilters}
            />
          ) : (
            <>
              <div className="buyer-grid-4">
                {products.map((p, idx) => (
                  <SearchProductCard
                    key={p.id}
                    product={p}
                    deal={dealMap.get(p.id)}
                    isFavorited={favoritedProductIds.includes(p.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onClick={() => {
                      if (searchLogId) productsService.trackSearchClick(searchLogId, p.id, idx);
                      navigate(`/product/${p.id}`);
                    }}
                  />
                ))}
              </div>

              <SearchPagination
                currentPage={pageParam}
                totalPages={totalPages}
                onPageChange={(page) => updateQuery({ page })}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
