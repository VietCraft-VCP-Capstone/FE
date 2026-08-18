import { BuyerDashboard } from './BuyerDashboard';

interface BuyerLayoutProps {
  user: any;
  onLogout: () => void;
}

export function BuyerLayout({ user, onLogout }: BuyerLayoutProps) {
  return <BuyerDashboard user={user} onLogout={onLogout} />;
}
