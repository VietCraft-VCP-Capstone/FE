import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { SellerLayout } from './SellerLayout';
import { Search, Plus, Trash2, Edit, BarChart3, ChevronDown, X } from 'lucide-react';
import { productsService } from '../../product/services/productsService';
import { CreateProductPage } from './CreateProductPage';

// Map tên màu tiếng Việt/EN → mã hex để render chấm màu.
const COLOR_MAP: Record<string, string> = {
  'Trắng': '#f5f5f4', 'Đen': '#1c1917', 'Xám': '#9ca3af', 'Nâu': '#5c4033',
  'Đỏ': '#b91c1c', 'Vàng': '#d97706', 'Xanh': '#1a6b1a', 'Hồng': '#ec4899',
  white: '#f5f5f4', black: '#1c1917', gray: '#9ca3af', brown: '#5c4033',
};

function SellerDashboard() {
  return (
    <div className="seller-dashboard-panel animate-fade-in">
      <h2 className="seller-role-title">Dashboard</h2>
      <p className="seller-role-subtitle">Thống kê doanh thu, đơn hàng và hiệu suất cửa hàng.</p>
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <span className="stat-label">DOANH THU THÁNG</span>
          <div className="stat-value-row"><span className="stat-number">45,200,000đ</span><span className="stat-trending trend-up">↗ +18.4%</span></div>
        </div>
        <div className="admin-stat-card">
          <span className="stat-label">ĐƠN HÀNG MỚI</span>
          <div className="stat-value-row"><span className="stat-number">86</span><span className="stat-trending trend-up">↗ +10.2%</span></div>
        </div>
        <div className="admin-stat-card">
          <span className="stat-label">SẢN PHẨM KHẢ DỤNG</span>
          <div className="stat-value-row"><span className="stat-number">12</span><span className="stat-trending">Hoạt động tốt</span></div>
        </div>
      </div>
    </div>
  );
}

function SellerProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detail, setDetail] = useState<any>(null);   // sản phẩm đang xem drawer chi tiết

  const loadProducts = () => {
    setLoading(true);
    productsService.getAll()
      .then((data) => { setProducts(data); setLoading(false); })
      .catch((err) => { console.error('Failed to load products:', err); setLoading(false); });
  };

  useEffect(() => { loadProducts(); }, []);

  const openCreate = () => navigate('/seller/products/new');
  const openEdit = (p: any) => navigate(`/seller/products/new?edit=${p.id}`);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedIds(e.target.checked ? products.map(p => p.id) : []);
  };
  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds(checked ? [...selectedIds, id] : selectedIds.filter(x => x !== id));
  };
  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xoá sản phẩm này?')) {
      productsService.delete(id)
        .then(() => { loadProducts(); })
        .catch(err => { alert('Không thể xoá sản phẩm: ' + (err.response?.data?.error || err.message)); });
    }
  };

  return (
    <div className="seller-products-panel animate-fade-in">
      <h2 className="seller-products-title">Products</h2>
      <div className="seller-products-toolbar">
        <button className="seller-btn-add" onClick={openCreate}><Plus size={18} /> Thêm sản phẩm</button>
        <div className="seller-search-box">
          <Search size={16} className="seller-search-icon" />
          {search && (
            <span className="seller-search-chip">{search}<button onClick={() => setSearch('')}>×</button></span>
          )}
          <input type="text" placeholder={search ? '' : 'Tìm kiếm sản phẩm...'} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="seller-sort-btn">Sắp xếp theo <ChevronDown size={16} /></button>
      </div>
      <div className="seller-table-container">
        {loading ? (
          <div className="p-8 text-center text-stone-500">Đang tải danh sách sản phẩm...</div>
        ) : (
          <table className="seller-data-table">
            <thead>
              <tr>
                <th style={{ width: 44 }}>
                  <input type="checkbox" checked={products.length > 0 && selectedIds.length === products.length} onChange={handleSelectAll} className="seller-checkbox" />
                </th>
                <th>THÔNG TIN CHI TIẾT</th><th>DANH MỤC</th><th>MÀU</th><th>TRẠNG THÁI</th><th style={{ width: 150 }}>TƯƠNG TÁC</th>
              </tr>
            </thead>
            <tbody>
              {products.filter(p => p.title?.toLowerCase().includes(search.toLowerCase())).map((p) => {
                const st = p.status === 'PUBLISHED' ? 'active' : p.status === 'UNPUBLISHED' ? 'disable' : 'draft';
                const stLabel = st === 'active' ? 'Active' : st === 'disable' ? 'Disable' : 'Draft';
                const colors = (p.variations || []).map((v: any) => v.color).filter(Boolean).slice(0, 4);
                return (
                <tr key={p.id} className={`${selectedIds.includes(p.id) ? 'row-selected' : ''} ${detail?.id === p.id ? 'row-active' : ''}`}>
                  <td><input type="checkbox" checked={selectedIds.includes(p.id)} onChange={(e) => handleSelectOne(p.id, e.target.checked)} className="seller-checkbox" /></td>
                  <td>
                    <div className="product-media-cell">
                      <div className="product-thumb">
                        {p.images && p.images[0] ? (
                          <img src={p.images[0]} alt={p.title} />
                        ) : p.title?.charAt(0)}
                      </div>
                      <div className="product-desc-group">
                        <span className="product-name-title">{p.title}</span>
                        <span className="product-desc-sub">{p.description || 'WoodyFurniture Offer new prod...'}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="cat-pills-row">
                      <span className="cat-pill">{p.category || 'Furnitures'}</span>
                      {p.tags?.[0] && <span className="cat-pill">{p.tags[0]}</span>}
                    </div>
                  </td>
                  <td>
                    <div className="colors-cell-row">
                      {(colors.length ? colors : ['#5c4033', '#8b5a2b', '#c8a165']).map((c: string, i: number) => (
                        <span key={i} className="color-dot-circle" style={{ backgroundColor: COLOR_MAP[c] || c }} />
                      ))}
                    </div>
                  </td>
                  <td><span className={`seller-status-badge ${st}`}>{stLabel}</span></td>
                  <td>
                    <div className="seller-actions-row">
                      <button className="seller-icon-action act-analytics" title="Xem chi tiết" onClick={() => setDetail(p)}><BarChart3 size={16} /></button>
                      <button className="seller-icon-action act-edit" title="Sửa thông tin" onClick={() => openEdit(p)}><Edit size={16} /></button>
                      <button onClick={() => handleDelete(p.id)} className="seller-icon-action act-delete" title="Xoá"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        )}
      </div>
      <div className="seller-pagination-row">
        <span>Hiển thị <b>1-{products.length}</b> trong <b>{products.length}</b> sản phẩm</span>
        <div className="pager-buttons">
          <button className="pager-item pager-arrow">&lt;</button>
          <button className="pager-item active">1</button>
          <button className="pager-item">2</button>
          <button className="pager-item">3</button>
          <span className="pager-dots">…</span>
          <button className="pager-item">16</button>
          <button className="pager-item pager-arrow">&gt;</button>
        </div>
      </div>
      {detail && <ProductDetailDrawer product={detail} onClose={() => setDetail(null)} onEdit={() => openEdit(detail)} />}
    </div>
  );
}

// Drawer chi tiết sản phẩm — trượt ra bên phải khi click hàng.
function ProductDetailDrawer({ product, onClose, onEdit }: { product: any; onClose: () => void; onEdit: () => void }) {
  const images: string[] = (product.images && product.images.length ? product.images : []).slice(0, 5);
  const [active, setActive] = useState(0);
  const price = product.variations?.[0]?.retail_price ?? product.price ?? 0;
  const stock = (product.variations || []).reduce((s: number, v: any) => s + (Number(v.stock) || 0), 0) || product.stock || 0;
  const stockValue = price * stock;

  // biểu đồ inventory (dữ liệu mẫu ổn định theo id sản phẩm)
  const seed = (product.id || '').split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0);
  const pts = Array.from({ length: 9 }, (_, i) => 20 + ((Math.sin(seed + i * 1.3) + 1) * 32) + i * 4);
  const W = 340, H = 130, max = Math.max(...pts) * 1.1;
  const coords = pts.map((v, i) => [ (i / (pts.length - 1)) * W, H - (v / max) * H ]);
  const line = coords.map((c, i) => `${i ? 'L' : 'M'}${c[0].toFixed(1)},${c[1].toFixed(1)}`).join(' ');
  const area = `${line} L${W},${H} L0,${H} Z`;
  const fmt = (n: number) => n.toLocaleString('vi-VN') + 'đ';

  return (
    <>
      <div className="seller-drawer-overlay" onClick={onClose} />
      <aside className="seller-drawer">
        <button className="seller-drawer-close" onClick={onClose}><X size={20} /></button>
        <div className="seller-drawer-body">
          <div className="seller-drawer-hero">
            {images[active] ? <img src={images[active]} alt={product.title} /> : <div className="seller-drawer-hero-ph">{product.title?.charAt(0)}</div>}
          </div>
          {images.length > 1 && (
            <div className="seller-drawer-thumbs">
              {images.map((src, i) => (
                <button key={i} className={`seller-drawer-thumb ${active === i ? 'active' : ''}`} onClick={() => setActive(i)}>
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          )}
          <div className="seller-drawer-section">
            <h3 className="seller-drawer-h">Mô tả</h3>
            <p className="seller-drawer-desc">{product.description || 'Chưa có mô tả cho sản phẩm này.'}</p>
          </div>
          <div className="seller-drawer-section">
            <h3 className="seller-drawer-h">Biến động tồn kho</h3>
            <div className="seller-drawer-chart-wrap">
              <div className="seller-drawer-chart-y">
                <span>100</span><span>75</span><span>50</span><span>25</span><span>0</span>
              </div>
              <div className="seller-drawer-chart-plot">
                <svg viewBox={`0 0 ${W} ${H}`} className="seller-drawer-chart" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="invFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1a6b1a" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#1a6b1a" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[0, 0.25, 0.5, 0.75, 1].map(g => (
                    <line key={g} x1={0} y1={g * H} x2={W} y2={g * H} stroke="#eef1f4" strokeWidth={1} />
                  ))}
                  <path d={area} fill="url(#invFill)" />
                  <path d={line} fill="none" stroke="#1a6b1a" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
                </svg>
                <div className="seller-drawer-chart-x"><span>Th1</span><span>Th3</span><span>Th6</span><span>Th9</span><span>Th12</span></div>
              </div>
            </div>
          </div>
          <div className="seller-drawer-stats">
            <div className="seller-drawer-stat"><span>Giá bán</span><b>{fmt(price)}</b></div>
            <div className="seller-drawer-stat"><span>Tồn kho</span><b>{stock}</b></div>
            <div className="seller-drawer-stat"><span>Giá trị kho</span><b>{fmt(stockValue)}</b></div>
          </div>
          <button className="seller-drawer-edit" onClick={onEdit}><Edit size={16} /> Chỉnh sửa sản phẩm</button>
        </div>
      </aside>
    </>
  );
}

interface SellerPortalProps { user: any; onLogout: () => void; }
export function SellerPortal({ user, onLogout }: SellerPortalProps) {
  const Stub = ({ t, d }: { t: string; d: string }) => (
    <div className="animate-fade-in"><h2 className="seller-products-title">{t}</h2><p className="seller-role-subtitle">{d}</p></div>
  );
  return (
    <SellerLayout user={user} onLogout={onLogout}>
      <Routes>
        <Route path="dashboard" element={<SellerDashboard />} />
        <Route path="products/new" element={<CreateProductPage />} />
        <Route path="products" element={<SellerProducts />} />
        <Route path="catalog" element={<Stub t="Danh mục sản phẩm" d="Quản lý danh mục hàng hoá." />} />
        <Route path="storefront" element={<Stub t="Thông tin cửa hàng" d="Cấu hình gian hàng độc bản của bạn." />} />
        <Route path="orders" element={<Stub t="Đơn hàng" d="Danh sách đơn hàng cần xử lý đóng gói và vận chuyển." />} />
        <Route path="shipping" element={<Stub t="Vận chuyển" d="Quản lý phương thức và trạng thái giao hàng." />} />
        <Route path="promotions" element={<Stub t="Khuyến mãi" d="Tạo và quản lý chương trình khuyến mãi." />} />
        <Route path="revenue" element={<Stub t="Doanh thu cửa hàng" d="Theo dõi doanh thu và dòng tiền." />} />
        <Route path="product-status" element={<Stub t="Trạng thái sản phẩm" d="Tình trạng duyệt và hiển thị sản phẩm." />} />
        <Route path="forecast" element={<Stub t="Dự báo nhu cầu" d="Dự báo nhu cầu thị trường từ AI." />} />
        <Route path="golden-hour" element={<Stub t="Danh mục & giờ vàng" d="Khung giờ vàng để đẩy sản phẩm." />} />
        <Route path="price-optimize" element={<Stub t="Tối ưu giá bán" d="Gợi ý giá bán tối ưu theo thị trường." />} />
        <Route path="market-share" element={<Stub t="Thị phần & đối thủ" d="Phân tích thị phần và đối thủ cạnh tranh." />} />
        <Route path="*" element={<Navigate to="products" replace />} />
      </Routes>
    </SellerLayout>
  );
}
