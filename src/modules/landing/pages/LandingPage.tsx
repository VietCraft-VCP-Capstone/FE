import { useNavigate } from 'react-router-dom';
import { useLandingPage } from '../hooks/useLandingPage';
import { LandingHeader } from '../components/LandingHeader';
import { LandingHero } from '../components/LandingHero';
import { LandingCategories } from '../components/LandingCategories';
import { LandingTrending } from '../components/LandingTrending';
import { LandingCollections } from '../components/LandingCollections';
import { LandingShops } from '../components/LandingShops';
import { LandingFooter } from '../components/LandingFooter';

interface LandingPageProps {
  user: any;
  onLogout: () => void;
}

export function LandingPage({ user, onLogout }: LandingPageProps) {
  const {
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
  } = useLandingPage();
  const navigate = useNavigate();

  const heroImages = products
    .filter((p) => p.image)
    .slice(0, 3)
    .map((p) => ({ src: p.image as string, alt: p.title }));

  return (
    <div className="bg-white min-h-screen font-sans text-stone-800 selection:bg-emerald-100 selection:text-[#007700]">
      <LandingHeader
        user={user}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onLogin={handleNavigateToLogin}
        onLogout={onLogout}
        onSignup={handleNavigateToSignup}
        onHome={handleNavigateToHome}
        onDashboard={handleNavigateToDashboard}
      />
      {/* Khách vãng lai duyệt hàng thoải mái; tường đăng nhập chỉ còn ở bước thanh toán. */}
      <main>
        <LandingHero onExplore={handleExploreProducts} images={heroImages} />
        <LandingCategories
          categories={categories}
          status={categoriesStatus}
          onSelect={handleViewCategory}
          onViewAll={handleExploreProducts}
          onRetry={retry}
        />
        <LandingTrending
          products={products}
          status={productsStatus}
          onSelectProduct={handleViewProduct}
          onViewAll={handleViewTrending}
          onRetry={retry}
        />
        <LandingCollections
          categories={categories}
          status={categoriesStatus}
          onSelect={handleViewCategory}
          onStartCreating={() => navigate('/seller/register')}
        />
        <LandingShops
          shops={shops}
          status={shopsStatus}
          onSelectShop={(shop) => handleViewShop(shop.id)}
          onRetry={retry}
        />
      </main>
      <LandingFooter
        emailSubscription={emailSubscription}
        setEmailSubscription={setEmailSubscription}
        onSubscribe={handleSubscribe}
        subscribing={subscribing}
      />
    </div>
  );
}

export default LandingPage;
