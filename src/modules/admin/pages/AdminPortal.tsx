import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import { AdminModeration } from './AdminModeration';
import { AdminCategories } from './AdminCategories';
import { AdminTags } from './AdminTags';
import { Search, Edit, Lock, Unlock } from 'lucide-react';
import { authService } from '../../auth/services/authService';

function AdminDashboard() {
  return (
    <div className="admin-page-placeholder">
      <h2>Tổng quan</h2>
      <p>Dữ liệu tổng quan hệ thống.</p>
    </div>
  );
}

function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const toggleLock = (userId: string) => {
    authService.toggleUserLock(userId)
      .then((updatedUser) => { setUsers(users.map(u => u._id === userId ? { ...u, is_locked: updatedUser.is_locked } : u)); })
      .catch((err) => { console.error('Failed to toggle lock status:', err); });
  };

  useEffect(() => {
    authService.getUsers()
      .then((data) => { setUsers(data); setLoading(false); })
      .catch((err) => { console.error('Failed to load users:', err); setLoading(false); });
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
    <div className="admin-users-panel">
      <h2 className="admin-role-title">Quản lý Người dùng</h2>
      <p className="admin-role-subtitle">Quản lý thông tin, phân quyền và trạng thái hoạt động của tài khoản trên hệ thống.</p>
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <span className="stat-label">TỔNG NGƯỜI DÙNG</span>
          <div className="stat-value-row"><span className="stat-number">{totalCount}</span><span className="stat-trending trend-up">↗ Hoạt động</span></div>
        </div>
        <div className="admin-stat-card">
          <span className="stat-label">NGƯỜI MUA (BUYER)</span>
          <div className="stat-value-row"><span className="stat-number">{buyerCount}</span><span className="stat-trending trend-up">↗ Hoạt động</span></div>
        </div>
        <div className="admin-stat-card">
          <span className="stat-label">NGƯỜI BÁN (SELLER)</span>
          <div className="stat-value-row"><span className="stat-number">{sellerCount}</span><span className="stat-trending trend-up">↗ Hoạt động</span></div>
        </div>
      </div>
      <div className="admin-table-filters">
        <div className="search-filter-wrap">
          <Search size={14} className="search-icon" />
          <input type="text" placeholder="Tìm theo tên, email, ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="filter-pills-row">
          <button className={filter === 'All' ? 'active' : ''} onClick={() => setFilter('All')}>Tất cả</button>
          <button className={filter === 'Buyer' ? 'active' : ''} onClick={() => setFilter('Buyer')}>Người mua</button>
          <button className={filter === 'Seller' ? 'active' : ''} onClick={() => setFilter('Seller')}>Người bán</button>
        </div>
      </div>
      <div className="admin-table-container">
        {loading ? (
          <div className="p-8 text-center text-stone-500">Đang tải danh sách người dùng...</div>
        ) : (
          <table className="admin-data-table">
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
                      <div className="user-info-cell">
                        <span className="avatar-bubble">{displayName[0]?.toUpperCase() || 'U'}</span>
                        <span className="user-name">{displayName}</span>
                      </div>
                    </td>
                    <td className="text-stone-600">{u.email}</td>
                    <td><span className={`role-badge ${u.role === 'SELLER' ? 'badge-seller' : 'badge-buyer'}`}>{roleLabel}</span></td>
                    <td><span className={`status-badge-dot ${isLocked ? 'status-suspended' : 'status-active'}`}>{isLocked ? 'Bị khoá' : 'Hoạt động'}</span></td>
                    <td>
                      <div className="action-links" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button className="text-[#007700] hover:bg-emerald-50 p-1.5 rounded transition-all" style={{ border: 'none', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Sửa"><Edit size={14} /></button>
                        <button onClick={() => toggleLock(u._id)} className="p-1.5 rounded transition-all hover:bg-stone-50" style={{ border: 'none', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title={isLocked ? 'Mở khoá' : 'Khoá'}>
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
      <div className="admin-pagination-row">
        <span>Hiển thị 1 - {filteredUsers.length} của {users.length} người dùng</span>
        <div className="pager-buttons">
          <button className="pager-item hover:bg-stone-100">&lt;</button>
          <button className="pager-item active">1</button>
          <button className="pager-item hover:bg-stone-100">2</button>
          <button className="pager-item hover:bg-stone-100">3</button>
          <button className="pager-item select-none cursor-default">...</button>
          <button className="pager-item hover:bg-stone-100">24</button>
          <button className="pager-item hover:bg-stone-100">&gt;</button>
        </div>
      </div>
    </div>
  );
}

function AdminDisputes() {
  return <div><h2 className="admin-page-title">Tranh chấp</h2><p className="admin-page-desc">Xử lý và giải quyết các tranh chấp giữa người mua và người bán.</p></div>;
}
function AdminMarketing() {
  return <div><h2 className="admin-page-title">Marketing</h2><p className="admin-page-desc">Quản lý các chiến dịch khuyến mãi và tiếp thị.</p></div>;
}

interface AdminPortalProps {
  user: any;
  onLogout: () => void;
}

export function AdminPortal({ user, onLogout }: AdminPortalProps) {
  return (
    <AdminLayout user={user} onLogout={onLogout}>
      <Routes>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="moderation" element={<AdminModeration />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="tags" element={<AdminTags />} />
        <Route path="disputes" element={<AdminDisputes />} />
        <Route path="marketing" element={<AdminMarketing />} />
        <Route path="*" element={<Navigate to="users" replace />} />
      </Routes>
    </AdminLayout>
  );
}
