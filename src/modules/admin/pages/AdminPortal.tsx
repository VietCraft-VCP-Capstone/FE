import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import { AdminDashboard } from './AdminDashboard';
import { AdminModeration } from './AdminModeration';
import { AdminCategories } from './AdminCategories';
import { AdminTags } from './AdminTags';
import { AdminSellers } from './AdminSellers';
import { AdminFinanceSimulationPage } from './AdminFinanceSimulationPage';
import { Search, Edit, Lock, Unlock } from 'lucide-react';
import { authService } from '../../auth/services/authService';
import { getApiErrorMessage } from '../../../infrastructure/api/interceptors';

function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const toggleLock = (userId: string) => {
    authService.toggleUserLock(userId)
      .then((updatedUser) => { setUsers(users.map(u => u._id === userId ? { ...u, is_locked: updatedUser.is_locked } : u)); })
      .catch((err) => { setError(getApiErrorMessage(err, 'Không thể đổi trạng thái khoá tài khoản.')); });
  };

  useEffect(() => {
    authService.getUsers()
      .then((data) => { setUsers(Array.isArray(data) ? data : []); setError(null); setLoading(false); })
      .catch((err) => { setError(getApiErrorMessage(err, 'Không tải được danh sách người dùng.')); setLoading(false); });
  }, []);

  const totalCount = users.length;
  const buyerCount = users.filter((u) => u.role === 'BUYER').length;
  const sellerCount = users.filter((u) => u.role === 'SELLER').length;

  const filteredUsers = users.filter((u) => {
    const name = u.full_name || '';
    const email = u.email || '';
    const id = u._id || '';
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) ||
      email.toLowerCase().includes(search.toLowerCase()) ||
      id.toLowerCase().includes(search.toLowerCase());
    if (filter === 'Buyer') return matchesSearch && u.role === 'BUYER';
    if (filter === 'Seller') return matchesSearch && u.role === 'SELLER';
    return matchesSearch;
  });

  return (
    <div className="rounded-xl border border-admin-line bg-admin-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      {/* Users Header & Stats */}
      <h2 className="mt-0 mb-1 text-[20px] font-bold text-[#330033]">Quản lý Người dùng</h2>
      <p className="mt-0 mb-5 text-[13px] text-[#666]">Quản lý thông tin, phân quyền và trạng thái hoạt động của tài khoản trên hệ thống.</p>
      {error && (
        <div className="p-3 mb-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
      )}
      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <div className="rounded-lg border border-admin-line bg-admin-canvas p-4">
          <span className="mb-1.5 block text-[11px] font-bold tracking-[0.5px] text-[#777]">TỔNG NGƯỜI DÙNG</span>
          <div className="flex items-baseline justify-between"><span className="text-[24px] font-extrabold text-stone-900">{totalCount}</span><span className="rounded bg-[#e8f5e8] px-1.5 py-0.5 text-[12px] font-semibold text-admin-brand">↗ Hoạt động</span></div>
        </div>
        <div className="rounded-lg border border-admin-line bg-admin-canvas p-4">
          <span className="mb-1.5 block text-[11px] font-bold tracking-[0.5px] text-[#777]">NGƯỜI MUA (BUYER)</span>
          <div className="flex items-baseline justify-between"><span className="text-[24px] font-extrabold text-stone-900">{buyerCount}</span><span className="rounded bg-[#e8f5e8] px-1.5 py-0.5 text-[12px] font-semibold text-admin-brand">↗ Hoạt động</span></div>
        </div>
        <div className="rounded-lg border border-admin-line bg-admin-canvas p-4">
          <span className="mb-1.5 block text-[11px] font-bold tracking-[0.5px] text-[#777]">NGƯỜI BÁN (SELLER)</span>
          <div className="flex items-baseline justify-between"><span className="text-[24px] font-extrabold text-stone-900">{sellerCount}</span><span className="rounded bg-[#e8f5e8] px-1.5 py-0.5 text-[12px] font-semibold text-admin-brand">↗ Hoạt động</span></div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="relative flex max-w-[320px] flex-1 items-center">
          <Search size={14} className="absolute left-3 text-[#999]" />
          <input type="text" placeholder="Tìm theo tên, email, ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-[20px] border border-[#ddd] bg-white py-2 pl-[34px] pr-3 text-[13px] text-stone-900 outline-none transition-[border] duration-150 placeholder:text-[#888888] focus:border-admin-brand" />
        </div>
        <div>
          <button className={`ml-1.5 cursor-pointer rounded-[20px] border px-4 py-1.5 text-[13px] font-semibold transition-all duration-150 ${filter === 'All' ? 'border-admin-brand bg-admin-brand text-white' : 'border-[#ddd] bg-transparent text-[#555]'}`} onClick={() => setFilter('All')}>Tất cả</button>
          <button className={`ml-1.5 cursor-pointer rounded-[20px] border px-4 py-1.5 text-[13px] font-semibold transition-all duration-150 ${filter === 'Buyer' ? 'border-admin-brand bg-admin-brand text-white' : 'border-[#ddd] bg-transparent text-[#555]'}`} onClick={() => setFilter('Buyer')}>Người mua</button>
          <button className={`ml-1.5 cursor-pointer rounded-[20px] border px-4 py-1.5 text-[13px] font-semibold transition-all duration-150 ${filter === 'Seller' ? 'border-admin-brand bg-admin-brand text-white' : 'border-[#ddd] bg-transparent text-[#555]'}`} onClick={() => setFilter('Seller')}>Người bán</button>
        </div>
      </div>

      {/* Users Table */}
      <div className="mb-4 overflow-hidden rounded-lg border border-admin-line">
        {loading ? (
          <div className="p-8 text-center text-stone-500">Đang tải danh sách người dùng...</div>
        ) : (
          <table className="w-full border-collapse text-left text-[13px] [&_td]:border-b [&_td]:border-[#f1f4f7] [&_td]:p-4 [&_tbody_tr:hover]:bg-[#fafbfc] [&_th]:border-b [&_th]:border-[#eef1f4] [&_th]:bg-transparent [&_th]:px-4 [&_th]:py-3 [&_th]:text-[12px] [&_th]:font-semibold [&_th]:tracking-[0.03em] [&_th]:text-slate-400">
            <thead>
              <tr>
                <th>NGƯỜI DÙNG</th><th>EMAIL</th><th>VAI TRÒ</th><th>TRẠNG THÁI</th><th>HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const displayName = u.full_name || 'Người dùng';
                const roleLabel = u.role === 'SELLER' ? 'Người bán' : u.role === 'ADMIN' ? 'Quản trị' : 'Người mua';
                const isLocked = !!u.is_locked;
                return (
                  <tr key={u._id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e8f5e8] text-[12px] font-bold text-admin-brand">{displayName[0]?.toUpperCase() || 'U'}</span>
                        <span className="font-semibold text-stone-900">{displayName}</span>
                      </div>
                    </td>
                    <td className="text-stone-600">{u.email}</td>
                    <td><span className={`rounded-xl px-2 py-[3px] text-[11px] font-semibold ${u.role === 'SELLER' ? 'bg-blue-50 text-blue-700' : 'bg-stone-100 text-stone-600'}`}>{roleLabel}</span></td>
                    <td><span className={`relative pl-3.5 font-semibold before:absolute before:left-0 before:top-1/2 before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full before:content-[''] ${isLocked ? 'before:bg-orange-500' : 'before:bg-green-500'}`}>{isLocked ? 'Bị khoá' : 'Hoạt động'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button className="mr-3 p-1.5 rounded text-[13px] font-semibold text-admin-brand transition-all hover:bg-emerald-50 hover:underline" style={{ border: 'none', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Sửa"><Edit size={14} /></button>
                        <button onClick={() => toggleLock(u._id)} className="mr-3 p-1.5 rounded text-[13px] font-semibold text-admin-brand transition-all hover:bg-stone-50 hover:underline" style={{ border: 'none', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title={isLocked ? 'Mở khoá' : 'Khoá'}>
                          {isLocked ? <Lock size={14} style={{ color: '#dc2626' }} /> : <Unlock size={14} style={{ color: '#007700' }} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between text-[12px] text-[#666]">
        <span>Hiển thị 1 - {filteredUsers.length} của {users.length} người dùng</span>
        <div className="flex gap-1">
          <button className="flex h-9 min-w-[36px] cursor-pointer items-center justify-center rounded-[9px] border-none px-2 text-[14px] font-semibold text-admin-muted transition-colors duration-150 hover:bg-stone-100">&lt;</button>
          <button className="flex h-9 min-w-[36px] cursor-pointer items-center justify-center rounded-[9px] border-none bg-[#f1f5f4] px-2 text-[14px] font-semibold text-stone-900 transition-colors duration-150">1</button>
          <button className="flex h-9 min-w-[36px] cursor-pointer items-center justify-center rounded-[9px] border-none px-2 text-[14px] font-semibold text-admin-muted transition-colors duration-150 hover:bg-stone-100">2</button>
          <button className="flex h-9 min-w-[36px] cursor-pointer items-center justify-center rounded-[9px] border-none px-2 text-[14px] font-semibold text-admin-muted transition-colors duration-150 hover:bg-stone-100">3</button>
          <button className="flex h-9 min-w-[36px] cursor-default select-none items-center justify-center rounded-[9px] border-none px-2 text-[14px] font-semibold text-admin-muted transition-colors duration-150 hover:bg-[#f1f5f4]">...</button>
          <button className="flex h-9 min-w-[36px] cursor-pointer items-center justify-center rounded-[9px] border-none px-2 text-[14px] font-semibold text-admin-muted transition-colors duration-150 hover:bg-stone-100">24</button>
          <button className="flex h-9 min-w-[36px] cursor-pointer items-center justify-center rounded-[9px] border-none px-2 text-[14px] font-semibold text-admin-muted transition-colors duration-150 hover:bg-stone-100">&gt;</button>
        </div>
      </div>
    </div>
  );
}

import { AdminPromotionsPage } from './AdminPromotionsPage';

/* ------------------------------------------------------------- Admin Disputes Page */
function AdminDisputes() {
  return <div><h2 className="m-0 text-[24px] font-extrabold tracking-[-0.02em] text-admin-ink">Tranh chấp</h2><p className="mt-1.5 mb-0 text-[13.5px] leading-normal text-admin-muted">Xử lý và giải quyết các tranh chấp giữa người mua và người bán.</p></div>;
}

interface AdminPortalProps {
  user: any;
  onLogout: () => void;
}

/* ------------------------------------------------------------- Admin Router Portal */
export function AdminPortal({ user, onLogout }: AdminPortalProps) {
  return (
    <AdminLayout user={user} onLogout={onLogout}>
      <Routes>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="finance" element={<AdminFinanceSimulationPage />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="moderation" element={<AdminModeration />} />
        <Route path="sellers" element={<AdminSellers />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="tags" element={<AdminTags />} />
        <Route path="disputes" element={<AdminDisputes />} />
        <Route path="marketing" element={<AdminPromotionsPage />} />
        <Route path="promotions" element={<AdminPromotionsPage />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </AdminLayout>
  );
}

