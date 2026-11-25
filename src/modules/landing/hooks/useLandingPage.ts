import { useState, FormEvent, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsService, absImg, FeaturedCategory } from '../../product/services/productsService';
import { newsletterService } from '../services/newsletterService';
import api from '../../../infrastructure/api/interceptors';
import { useToast } from '../../../shared/components/Toast';

export interface LandingProduct {
    id: string;
    title: string;
    price: number;
    rating: number;
    reviews: number;
    soldCount: number;
    isBestseller: boolean;
    image: string | null;
}

export interface LandingShop {
    id: string;
    name: string;
    description: string;
    rating: number;
    reviews: number;
    listingCount: number;
    avatar: string | null;
    banner: string | null;
}

/** Trạng thái tải của từng khối trên trang: mỗi khối lỗi riêng, không kéo cả trang sập. */
export type SectionStatus = 'loading' | 'ready' | 'error';

const TRENDING_LIMIT = 8;
const CATEGORY_LIMIT = 6;

const firstImage = (p: any): string | null => {
    const img = (Array.isArray(p?.images) && p.images.find((u: any) => typeof u === 'string' && u)) || p?.thumbnail;
    return typeof img === 'string' && img ? img : null;
};

const toLandingProduct = (p: any): LandingProduct => {
    const soldCount = Number(p.soldCount ?? p.sales_count) || 0;
    return {
        id: String(p.id || p._id || ''),
        title: p.title || '',
        price: Number(p.price) || 0,
        rating: Number(p.rating) || 0,
        reviews: Number(p.ratingCount) || 0,
        soldCount,
        isBestseller: Boolean(p.is_bestseller) || soldCount > 10,
        image: firstImage(p),
    };
};

const toLandingShop = (s: any): LandingShop => ({
    id: String(s._id || s.id || ''),
    name: s.shop_name || '',
    description: (typeof s.description === 'string' && s.description.trim()) || '',
    rating: Number(s.average_rating) || 0,
    reviews: Number(s.rating_count) || 0,
    listingCount: Number(s.listing_count) || 0,
    avatar: absImg(s.logo) || null,
    banner: absImg(s.banner) || null,
});

export function useLandingPage() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [emailSubscription, setEmailSubscription] = useState('');
    const [subscribing, setSubscribing] = useState(false);

    const [products, setProducts] = useState<LandingProduct[]>([]);
    const [productsStatus, setProductsStatus] = useState<SectionStatus>('loading');
    const [shops, setShops] = useState<LandingShop[]>([]);
    const [shopsStatus, setShopsStatus] = useState<SectionStatus>('loading');
    const [categories, setCategories] = useState<FeaturedCategory[]>([]);
    const [categoriesStatus, setCategoriesStatus] = useState<SectionStatus>('loading');
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let alive = true;
        setProductsStatus('loading');
        setShopsStatus('loading');
        setCategoriesStatus('loading');

        // "Đang thịnh hành" = sản phẩm bán chạy thật (xếp theo số đã bán), không phải danh sách mặc định.
        // Gọi thẳng API để phân biệt "lỗi mạng" với "chưa có sản phẩm" (service search nuốt lỗi).
        api.get('/products/search', { params: { sort: 'best_seller', limit: TRENDING_LIMIT, page: 1 } })
            .then((res) => {
                if (!alive) return;
                const items = Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data) ? res.data : [];
                setProducts(items.map((p: any) => toLandingProduct({ ...p, images: (p.images || []).map(absImg), thumbnail: absImg(p.thumbnail) })).filter((p: LandingProduct) => p.id));
                setProductsStatus('ready');
            })
            .catch((err) => {
                console.error('Landing: không tải được sản phẩm thịnh hành', err);
                if (alive) setProductsStatus('error');
            });

        api.get('/products/featured-shops')
            .then((res) => {
                if (!alive) return;
                setShops((Array.isArray(res.data) ? res.data : []).map(toLandingShop).filter((s: LandingShop) => s.id));
                setShopsStatus('ready');
            })
            .catch((err) => {
                console.error('Landing: không tải được shop nổi bật', err);
                if (alive) setShopsStatus('error');
            });

        productsService.getFeaturedCategories(CATEGORY_LIMIT)
            .then((data) => {
                if (!alive) return;
                setCategories(data.filter((c) => c.product_count > 0));
                setCategoriesStatus('ready');
            })
            .catch((err) => {
                console.error('Landing: không tải được danh mục nổi bật', err);
                if (alive) setCategoriesStatus('error');
            });

        return () => { alive = false; };
    }, [reloadKey]);

    const retry = useCallback(() => setReloadKey((k) => k + 1), []);

    const handleSubscribe = async (e: FormEvent) => {
        e.preventDefault();
        const email = emailSubscription.trim();
        if (!email || subscribing) return;
        setSubscribing(true);
        try {
            const result = await newsletterService.subscribe(email);
            showToast(
                result.alreadySubscribed
                    ? `Email ${email} đã có trong danh sách nhận tin.`
                    : `Đã đăng ký nhận tin với email ${email}.`,
                'success',
            );
            setEmailSubscription('');
        } catch (err: any) {
            const msg = err?.response?.data?.error || err?.response?.data?.message || 'Không thể đăng ký lúc này, vui lòng thử lại sau.';
            showToast(msg, 'error');
        } finally {
            setSubscribing(false);
        }
    };

    const handleNavigateToLogin = () => navigate('/login');
    const handleNavigateToSignup = () => navigate('/signup');
    const handleNavigateToHome = () => navigate('/');
    const handleNavigateToDashboard = () => navigate('/');

    const handleViewProduct = (id: string) => {
        if (id) navigate(`/product/${id}`);
    };
    const handleViewShop = (shopId: string) => {
        if (shopId) navigate(`/shop/${shopId}`);
    };
    // Trang tìm kiếm là trang duyệt hàng công khai đầy đủ (lọc, sắp xếp, phân trang).
    const handleExploreProducts = () => navigate('/search');
    const handleViewTrending = () => navigate('/search?sort=best_seller');
    const handleViewCategory = (category: Pick<FeaturedCategory, 'name'>) =>
        navigate(`/search?category=${encodeURIComponent(category.name)}`);

    return {
        searchQuery, setSearchQuery,
        emailSubscription, setEmailSubscription, subscribing,
        handleSubscribe,
        handleNavigateToLogin, handleNavigateToSignup,
        handleNavigateToHome, handleNavigateToDashboard,
        handleViewProduct, handleViewShop, handleExploreProducts, handleViewTrending, handleViewCategory,
        products, productsStatus,
        shops, shopsStatus,
        categories, categoriesStatus,
        retry,
    };
}
