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
      <LandingHero onExplore={handleNavigateToLogin} />
      <LandingCategories />
      <LandingTrending products={products} onAction={handleNavigateToLogin} />
      <LandingCollections onAction={handleNavigateToLogin} />
      <LandingShops shops={shops} onAction={handleNavigateToLogin} />
      <LandingFooter
        emailSubscription={emailSubscription}
        setEmailSubscription={setEmailSubscription}
        onSubscribe={handleSubscribe}
      />
    </div>
  );
}

export default LandingPage;
