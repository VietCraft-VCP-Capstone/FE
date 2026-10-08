import { Navigate, Route, Routes } from 'react-router-dom';
import { SellerLayout } from '../../seller/pages/SellerLayout';
import { DemoBanner } from '../components/DemoBanner';
import { INSIGHTS_NAV } from '../nav';
import { ActionsPage } from './ActionsPage';
import { AlertsPage } from './AlertsPage';
import { BenchmarkPage } from './BenchmarkPage';
import { CategoriesPage } from './CategoriesPage';
import { CompetitorsPage } from './CompetitorsPage';
import { ForecastPage } from './ForecastPage';
import { ListingDetailPage } from './ListingDetailPage';
import { ListingsPage } from './ListingsPage';
import { NichesPage } from './NichesPage';
import { OverviewPage } from './OverviewPage';
import { PricingPage } from './PricingPage';
import { RadarPage } from './RadarPage';
import { SeasonalPage } from './SeasonalPage';
import { TagGapPage } from './TagGapPage';
import { TrackingPage } from './TrackingPage';

/**
 * Khu "Phân tích & AI" của người bán — 16 tính năng F26–F41.
 *
 * Dùng lại SellerLayout (cùng thanh tiêu đề, cùng hộp thư, cùng thông báo) nhưng đổi
 * thanh bên sang nhóm phân tích. Nhờ vậy hai khu trông là một sản phẩm, và bộ chuyển
 * khu ở giữa thanh tiêu đề đưa người bán qua lại mà không mất ngữ cảnh.
 */
export function InsightsPortal({ user, onLogout }: { user: any; onLogout: () => void }) {
  return (
    <SellerLayout user={user} onLogout={onLogout} groups={INSIGHTS_NAV}>
      <DemoBanner />
      <Routes>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="actions" element={<ActionsPage />} />

        <Route path="overview" element={<OverviewPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="listings" element={<ListingsPage />} />
        <Route path="listings/:id" element={<ListingDetailPage />} />

        <Route path="competitors" element={<CompetitorsPage />} />
        <Route path="benchmark" element={<BenchmarkPage />} />
        <Route path="tag-gap" element={<TagGapPage />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="tracking" element={<TrackingPage />} />

        <Route path="forecast" element={<ForecastPage />} />
        <Route path="seasonal" element={<SeasonalPage />} />
        <Route path="niches" element={<NichesPage />} />
        <Route path="radar" element={<RadarPage />} />

        <Route path="*" element={<Navigate to="/seller/insights/overview" replace />} />
      </Routes>
    </SellerLayout>
  );
}
