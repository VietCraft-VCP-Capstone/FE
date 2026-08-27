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
    emailSubscription, setEmailSubscription,
    handleSubscribe,
    handleNavigateToLogin, handleNavigateToSignup,
    handleNavigateToHome, handleNavigateToDashboard,
    handleViewProduct, handleViewShop, handleExploreProducts, handleViewCollections,
    products, shops,
  } = useLandingPage();

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
      {/* Khách vãng lai duyệt hàng thoải mái: các nút dưới đây dẫn tới nội dung thật,
          KHÔNG còn gắn handleNavigateToLogin. Tường đăng nhập chỉ còn ở bước thanh toán. */}
      <LandingHero onExplore={handleExploreProducts} />
      <LandingCategories />
      <LandingTrending
        products={products}
        onSelectProduct={handleViewProduct}
        onViewAll={handleExploreProducts}
      />
      <LandingCollections onAction={handleViewCollections} />
      <LandingShops shops={shops} onSelectShop={(shop) => handleViewShop(shop.id || '')} />
      <LandingFooter
        emailSubscription={emailSubscription}
        setEmailSubscription={setEmailSubscription}
        onSubscribe={handleSubscribe}
      />
    </div>
  );
}

export default LandingPage;
