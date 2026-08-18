import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ShoppingBag, CreditCard, MessageSquare, LogOut, BarChart3 } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: any;
  onLogout: () => void;
}

export function Layout({ children, user, onLogout }: LayoutProps) {
  const navigate = useNavigate();
  const handleLogoutClick = () => { onLogout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-slate-950 font-sans text-slate-100 overflow-hidden">
      <aside className="w-64 glass-panel border-r border-slate-800 flex flex-col justify-between py-6">
        <div>
          <div className="px-6 mb-8 flex items-center space-x-2">
            <Sparkles className="h-8 w-8 text-amber-500 animate-pulse" />
            <span className="text-xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">VietCraft</span>
          </div>
          {user && (
            <div className="px-6 mb-6">
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                <p className="text-sm font-semibold text-amber-500">{user.name}</p>
                <span className="text-xs text-slate-400 capitalize">{user.role} Portal</span>
              </div>
            </div>
          )}
          <nav className="space-y-1 px-4">
            <Link to="/products" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-amber-500/10 hover:text-amber-500 transition-colors">
              <ShoppingBag className="h-5 w-5" /><span>Sản Phẩm</span>
            </Link>
            <Link to="/orders" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-amber-500/10 hover:text-amber-500 transition-colors">
              <CreditCard className="h-5 w-5" /><span>Đơn Hàng</span>
            </Link>
            <Link to="/chat" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-amber-500/10 hover:text-amber-500 transition-colors">
              <MessageSquare className="h-5 w-5" /><span>Trò Chuyện</span>
            </Link>
            <Link to="/analytics" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-amber-500/10 hover:text-amber-500 transition-colors">
              <BarChart3 className="h-5 w-5" /><span>AI Analytics</span>
            </Link>
          </nav>
        </div>
        <div className="px-4">
          <button onClick={handleLogoutClick} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 transition-colors">
            <LogOut className="h-5 w-5" /><span>Đăng xuất</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        <header className="h-16 border-b border-slate-800 glass-panel flex items-center justify-between px-8 bg-slate-900/50">
          <h1 className="text-lg font-semibold text-slate-200">VietCraft</h1>
        </header>
        <div className="flex-1 p-8 bg-slate-950">{children}</div>
      </main>
    </div>
  );
}
