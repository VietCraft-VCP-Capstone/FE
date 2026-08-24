import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsService } from '../../product/services/productsService';

export function useLandingPage() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [emailSubscription, setEmailSubscription] = useState('');
    const [products, setProducts] = useState<any[]>([]);
    const [shops, setShops] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        async function fetchData() {
            try {
                setLoading(true);
                const [prodData, shopData] = await Promise.all([
                    productsService.getAll(),
                    productsService.getFeaturedShops()
                ]);

                if (isMounted) {
                    const mappedShops = shopData.map((s: any) => ({
                        name: s.shop_name,
                        location: s.description || 'Bespoke Artisan',
                        rating: s.average_rating || 5.0,
                        reviews: s.listing_count * 12 || 120,
                        avatar: s.logo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
                        banner: s.banner || 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&q=80&w=600',
                    }));

                    const productList = Array.isArray(prodData) ? prodData : (prodData?.items || []);
                    const mappedProducts = productList.map((p: any) => ({
                        id: p.id,
                        title: p.title,
                        price: p.price,
                        rating: 5,
                        reviews: 128,
                        isBestseller: true,
                        image: p.images?.[0] || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=600',
                    }));

                    setProducts(mappedProducts);
                    setShops(mappedShops);
                }
            } catch (err: any) {
                console.error('Failed to fetch landing assets from backend Mongo:', err);
                if (isMounted) {
                    setError(err.message || 'Failed to load assets');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        fetchData();
        return () => { isMounted = false; };
    }, []);

    const handleSubscribe = (e: FormEvent) => {
        e.preventDefault();
        if (emailSubscription) {
            alert(`Cảm ơn bạn đã đăng ký với email: ${emailSubscription}`);
            setEmailSubscription('');
        }
    };

    const handleNavigateToLogin = () => navigate('/login');
    const handleNavigateToSignup = () => navigate('/signup');
    const handleNavigateToHome = () => navigate('/');
    const handleNavigateToDashboard = () => { navigate('/products'); };

    return {
        searchQuery, setSearchQuery,
        emailSubscription, setEmailSubscription,
        handleSubscribe,
        handleNavigateToLogin, handleNavigateToSignup,
        handleNavigateToHome, handleNavigateToDashboard,
        products, shops, loading, error
    };
}
