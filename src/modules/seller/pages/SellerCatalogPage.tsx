import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Archive, Search, RefreshCw, ChevronDown, ChevronRight, PackageOpen,
    AlertTriangle, Tag as TagIcon, Layers, Boxes, PlusCircle, Plus, X, Loader2, Check
} from 'lucide-react';
import { catalogService, CatalogData, CatalogProduct } from '../services/catalogService';
import { ProductImage } from '../../product/components/ProductImage';
import { getApiErrorMessage } from '../../../infrastructure/api/interceptors';
import { useToast } from '../../../shared/components/Toast';
import { PRODUCT_CREATE_PATH } from '../featureFlags';

const money = (n: number) => `${(n || 0).toLocaleString('vi-VN')}đ`;
const norm = (s: string) => (s || '').trim().toLowerCase();
const EMPTY: CatalogData = { categories: [], tags: [], products: [], totalProducts: 0, truncated: false };

export function SellerCatalogPage() {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [data, setData] = useState<CatalogData>(EMPTY);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState<string | null>(null);

    // Modal state
    const [showCatModal, setShowCatModal] = useState(false);
    const [catName, setCatName] = useState('');
    const [catParentId, setCatParentId] = useState('');
    const [catDesc, setCatDesc] = useState('');
    const [submittingCat, setSubmittingCat] = useState(false);

    const [showTagModal, setShowTagModal] = useState(false);
    const [tagName, setTagName] = useState('');
    const [submittingTag, setSubmittingTag] = useState(false);

    const load = useCallback(async (silent = false) => {
        silent ? setRefreshing(true) : setLoading(true);
        try {
            setData(await catalogService.load());
        } catch (err) {
            showToast(getApiErrorMessage(err, 'Không tải được danh mục sản phẩm.'), 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [showToast]);

    useEffect(() => { load(); }, [load]);

    const handleProposeCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!catName.trim()) return;
        setSubmittingCat(true);
        try {
            await catalogService.proposeCategory({
                name: catName.trim(),
                parent_id: catParentId || undefined,
                description: catDesc.trim() || undefined,
            });
            showToast('Đã gửi yêu cầu thêm danh mục! Vui lòng chờ Ban quản trị duyệt.', 'success');
            setShowCatModal(false);
            setCatName('');
            setCatParentId('');
            setCatDesc('');
        } catch (err: any) {
            showToast(getApiErrorMessage(err, 'Gửi yêu cầu danh mục thất bại.'), 'error');
        } finally {
            setSubmittingCat(false);
        }
    };

    const handleProposeTag = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tagName.trim()) return;
        setSubmittingTag(true);
        try {
            await catalogService.proposeTag(tagName.trim());
            showToast('Đã gửi yêu cầu thêm thẻ! Vui lòng chờ Ban quản trị duyệt.', 'success');
            setShowTagModal(false);
            setTagName('');
        } catch (err: any) {
            showToast(getApiErrorMessage(err, 'Gửi yêu cầu thẻ thất bại.'), 'error');
        } finally {
            setSubmittingTag(false);
        }
    };

    const productsByCategory = useMemo(() => {
        const map = new Map<string, CatalogProduct[]>();
        for (const p of data.products) {
            const key = norm(p.category);
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(p);
        }
        return map;
    }, [data.products]);

    const rows = useMemo(() => {
        const q = norm(search);
        return data.categories
            .map(c => {
                const byName = productsByCategory.get(norm(c.name)) || [];
                const bySlug = c.slug ? (productsByCategory.get(norm(c.slug)) || []) : [];
                const seenIds = new Set<string>();
                const combined: CatalogProduct[] = [];
                for (const p of [...byName, ...bySlug]) {
                    if (!seenIds.has(p.id)) {
                        seenIds.add(p.id);
                        combined.push(p);
                    }
                }
                return { ...c, items: combined };
            })
            .filter(c => !q || norm(c.name).includes(q) || norm(c.slug || '').includes(q))
            .sort((a, b) => b.items.length - a.items.length || a.name.localeCompare(b.name, 'vi'));
    }, [data.categories, productsByCategory, search]);

    const orphans = useMemo(() => {
        const known = new Set(data.categories.flatMap(c => [norm(c.name), norm(c.slug || '')]).filter(Boolean));
        const map = new Map<string, CatalogProduct[]>();
        for (const p of data.products) {
            const key = norm(p.category);
            if (known.has(key)) continue;
            const label = p.category?.trim() || '(chưa đặt danh mục)';
            if (!map.has(label)) map.set(label, []);
            map.get(label)!.push(p);
        }
        return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
    }, [data.categories, data.products]);

    const tagUsage = useMemo(() => {
        const count = new Map<string, number>();
        for (const p of data.products) {
            for (const t of p.tags) count.set(norm(t), (count.get(norm(t)) || 0) + 1);
        }
        return count;
    }, [data.products]);

    const usedCount = rows.length ? data.categories.filter(c => (productsByCategory.get(norm(c.name)) || []).length > 0).length : 0;
    const orphanTotal = orphans.reduce((n, [, items]) => n + items.length, 0);
    const maxInCategory = Math.max(1, ...data.categories.map(c => (productsByCategory.get(norm(c.name)) || []).length));

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="h-9 w-72 bg-stone-200 rounded-lg animate-pulse" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                    {[0, 1, 2, 3].map(i => <div key={i} className="h-24 bg-stone-100 border border-stone-200 rounded-2xl animate-pulse" />)}
                </div>
                <div className="h-64 bg-stone-100 border border-stone-200 rounded-2xl animate-pulse mt-6" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight font-jakarta">
                        Danh mục & Thẻ sản phẩm
                    </h1>
                    <p className="text-sm text-stone-500 mt-1">
                        Xem cấu trúc danh mục và thẻ phân loại trên sàn. Bạn có thể gửi yêu cầu đề xuất thêm danh mục hoặc thẻ mới để Ban quản trị xét duyệt.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        onClick={() => setShowCatModal(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-stone-50 text-[#007700] border border-[#007700]/30 hover:border-[#007700] text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer font-jakarta"
                    >
                        <Plus size={14} /> Đề xuất danh mục
                    </button>
                    <button
                        onClick={() => setShowTagModal(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 hover:border-stone-400 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer font-jakarta"
                    >
                        <TagIcon size={14} /> Đề xuất thẻ
                    </button>
                    <button
                        onClick={() => load(true)}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-xl border border-stone-200 shadow-xs transition-all cursor-pointer disabled:opacity-50 font-jakarta"
                    >
                        <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Làm mới
                    </button>
                </div>
            </div>

            {/* Stat tiles */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatTile icon={<Layers size={16} />} label="Danh mục đang mở" value={data.categories.length} />
                <StatTile icon={<Boxes size={16} />} label="Danh mục bạn đã có hàng" value={usedCount} accent />
                <StatTile icon={<PackageOpen size={16} />} label="Danh mục còn trống" value={Math.max(0, data.categories.length - usedCount)} />
                <StatTile icon={<TagIcon size={16} />} label="Thẻ đã duyệt" value={data.tags.length} />
            </div>

            {data.truncated && (
                <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    <AlertTriangle size={15} className="shrink-0 mt-px" />
                    <span>
                        Bạn có <b>{data.totalProducts}</b> sản phẩm, trang này mới thống kê trên <b>{data.products.length}</b> sản phẩm gần nhất.
                        Các con số bên dưới là của phần đã tải.
                    </span>
                </div>
            )}

            {/* Orphan Categories Section */}
            {orphans.length > 0 && (
                <div className="bg-white rounded-2xl border border-rose-200 shadow-xs overflow-hidden">
                    <div className="flex items-start gap-2.5 px-5 py-4 bg-rose-50/70 border-b border-rose-100">
                        <AlertTriangle size={17} className="text-[#BA1A1A] shrink-0 mt-px" />
                        <div>
                            <h3 className="text-sm font-bold text-[#BA1A1A] font-jakarta">
                                {orphanTotal} sản phẩm nằm ngoài danh mục của sàn
                            </h3>
                            <p className="text-xs text-rose-700/80 mt-0.5">
                                Những sản phẩm này mang tên danh mục không có trong danh sách sàn quản lý, nên người mua duyệt theo danh mục sẽ không thấy chúng. Hãy sửa lại danh mục cho từng sản phẩm.
                            </p>
                        </div>
                    </div>
                    <div className="divide-y divide-stone-100">
                        {orphans.map(([label, items]) => (
                            <div key={label} className="flex items-center justify-between gap-3 px-5 py-3">
                                <div className="min-w-0">
                                    <span className="text-sm font-semibold text-stone-800 truncate block">{label}</span>
                                    <span className="text-xs text-stone-500">{items.map(p => p.title).slice(0, 3).join(', ')}{items.length > 3 ? `, +${items.length - 3} nữa` : ''}</span>
                                </div>
                                <span className="shrink-0 text-xs font-bold text-[#BA1A1A] bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
                                    {items.length} sản phẩm
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Categories Table Section */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-stone-200 bg-stone-50/60">
                    <h3 className="text-sm font-bold text-stone-900 font-jakarta flex items-center gap-2">
                        <Archive size={16} className="text-[#007700]" /> Danh mục sàn quản lý
                    </h3>
                    <div className="relative sm:w-72">
                        <Search className="absolute inset-y-0 left-3 my-auto text-stone-400" size={15} />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Tìm danh mục..."
                            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#007700] focus:border-[#007700]"
                        />
                    </div>
                </div>

                {rows.length === 0 ? (
                    <EmptyRow
                        text={search ? `Không có danh mục nào khớp "${search}".` : 'Sàn chưa mở danh mục nào.'}
                    />
                ) : (
                    <div className="divide-y divide-stone-100">
                        {rows.map(cat => {
                            const open = expanded === cat._id;
                            return (
                                <div key={cat._id}>
                                    <button
                                        onClick={() => setExpanded(open ? null : cat._id)}
                                        className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-stone-50/70 transition-colors cursor-pointer"
                                    >
                                        {open
                                            ? <ChevronDown size={15} className="text-stone-400 shrink-0" />
                                            : <ChevronRight size={15} className="text-stone-400 shrink-0" />}

                                        <div className="min-w-0 flex-1">
                                            <span className="text-sm font-bold text-stone-800 font-jakarta">{cat.name}</span>
                                            {cat.slug && <span className="ml-2 text-[11px] text-stone-400 font-mono">/{cat.slug}</span>}
                                        </div>

                                        <div className="hidden md:block w-32 h-1.5 bg-stone-100 rounded-full overflow-hidden shrink-0">
                                            <div
                                                className="h-full bg-[#007700] rounded-full transition-all"
                                                style={{ width: `${(cat.items.length / maxInCategory) * 100}%` }}
                                            />
                                        </div>

                                        <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border ${
                                            cat.items.length > 0
                                                ? 'text-[#007700] bg-[#EAF0E2] border-[#BECAB6]'
                                                : 'text-stone-400 bg-stone-50 border-stone-200'
                                        }`}>
                                            {cat.items.length} sản phẩm
                                        </span>
                                    </button>

                                    {open && (
                                        <div className="px-5 pb-4 bg-stone-50/40">
                                            {cat.items.length === 0 ? (
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 px-4 bg-white border border-dashed border-stone-300 rounded-xl">
                                                    <p className="text-xs text-stone-500">
                                                        Bạn chưa có sản phẩm nào trong danh mục này.
                                                    </p>
                                                    <button
                                                        onClick={() => navigate(PRODUCT_CREATE_PATH)}
                                                        className="flex items-center gap-1.5 self-start px-3 py-1.5 bg-[#007700] hover:bg-[#005B00] text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs font-jakarta"
                                                    >
                                                        <PlusCircle size={13} /> Tạo sản phẩm
                                                    </button>
                                                </div>
                                            ) : (
                                                <ul className="space-y-2">
                                                    {cat.items.map(p => (
                                                        <li key={p.id} className="flex items-center gap-3 p-2.5 bg-white border border-stone-200 rounded-xl">
                                                            <ProductImage src={p.thumbnail} alt={p.title} size="md" />
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-xs font-bold text-stone-800 truncate">{p.title}</p>
                                                                <p className="text-[11px] text-stone-500 mt-0.5">
                                                                    {money(p.price)} · tồn {p.stock}
                                                                </p>
                                                            </div>
                                                            <StatusChip status={p.status} />
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Approved Tags Section */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-200 bg-stone-50/60">
                    <h3 className="text-sm font-bold text-stone-900 font-jakarta flex items-center gap-2">
                        <TagIcon size={16} className="text-[#007700]" /> Thẻ sàn đã duyệt
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                        Thẻ tô đậm là thẻ hàng của bạn đang dùng. Thẻ mới bạn đề xuất sẽ chờ sàn duyệt trước khi hiện ở đây.
                    </p>
                </div>
                {data.tags.length === 0 ? (
                    <EmptyRow text="Sàn chưa duyệt thẻ nào." />
                ) : (
                    <div className="flex flex-wrap gap-2 p-5">
                        {data.tags.map(t => {
                            const used = tagUsage.get(norm(t.name)) || 0;
                            return (
                                <span
                                    key={t._id}
                                    title={used ? `${used} sản phẩm của bạn dùng thẻ này` : 'Bạn chưa dùng thẻ này'}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors ${
                                        used
                                            ? 'font-bold text-white border-transparent'
                                            : 'font-medium text-stone-500 bg-stone-50 border-stone-200'
                                    }`}
                                    style={used ? { backgroundColor: t.color || '#007700' } : undefined}
                                >
                                    {t.name}
                                    {used > 0 && <span className="bg-white/25 px-1.5 rounded-full text-[10px]">{used}</span>}
                                </span>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal đề xuất danh mục */}
            {showCatModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-xl border border-stone-200 max-w-md w-full p-6 relative">
                        <button
                            onClick={() => setShowCatModal(false)}
                            className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100 transition-colors"
                        >
                            <X size={18} />
                        </button>

                        <div className="flex items-center gap-2 mb-2 text-[#007700]">
                            <Layers size={20} />
                            <h3 className="text-base font-bold text-stone-900 font-jakarta">Đề xuất danh mục mới</h3>
                        </div>
                        <p className="text-xs text-stone-500 mb-5 leading-relaxed">
                            Yêu cầu sẽ được gửi tới Ban quản trị VietCraft. Sau khi được duyệt, danh mục sẽ hiển thị trên toàn hệ thống và trong bộ lọc sản phẩm.
                        </p>

                        <form onSubmit={handleProposeCategory} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">
                                    Tên danh mục <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ví dụ: Đồ gốm men lam, Nến thơm..."
                                    value={catName}
                                    onChange={e => setCatName(e.target.value)}
                                    className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#007700] focus:border-[#007700]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">
                                    Danh mục cha (tuỳ chọn)
                                </label>
                                <select
                                    value={catParentId}
                                    onChange={e => setCatParentId(e.target.value)}
                                    className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#007700] focus:border-[#007700]"
                                >
                                    <option value="">-- Thuộc cấp cao nhất (Không có cha) --</option>
                                    {data.categories.map(c => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">
                                    Mô tả / Lý do đề xuất (tuỳ chọn)
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Nêu đặc điểm hoặc lý do nên mở thêm danh mục này..."
                                    value={catDesc}
                                    onChange={e => setCatDesc(e.target.value)}
                                    className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#007700] focus:border-[#007700]"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCatModal(false)}
                                    className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingCat || !catName.trim()}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-[#007700] hover:bg-[#005B00] text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50 transition-all font-jakarta"
                                >
                                    {submittingCat ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Gửi đề xuất
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal đề xuất thẻ */}
            {showTagModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-xl border border-stone-200 max-w-sm w-full p-6 relative">
                        <button
                            onClick={() => setShowTagModal(false)}
                            className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100 transition-colors"
                        >
                            <X size={18} />
                        </button>

                        <div className="flex items-center gap-2 mb-2 text-[#007700]">
                            <TagIcon size={20} />
                            <h3 className="text-base font-bold text-stone-900 font-jakarta">Đề xuất thẻ phân loại mới</h3>
                        </div>
                        <p className="text-xs text-stone-500 mb-5 leading-relaxed">
                            Thẻ giúp khách hàng tìm kiếm nhanh sản phẩm của bạn. Thẻ mới sẽ vào danh sách chờ Ban quản trị duyệt.
                        </p>

                        <form onSubmit={handleProposeTag} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">
                                    Tên thẻ <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ví dụ: GomBatTrang, ThuanChay..."
                                    value={tagName}
                                    onChange={e => setTagName(e.target.value)}
                                    className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#007700] focus:border-[#007700]"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowTagModal(false)}
                                    className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingTag || !tagName.trim()}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-[#007700] hover:bg-[#005B00] text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50 transition-all font-jakarta"
                                >
                                    {submittingTag ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Gửi đề xuất
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatTile({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent?: boolean }) {
    return (
        <div className="p-4 bg-white border border-stone-200 rounded-2xl shadow-xs">
            <div className="flex items-center gap-1.5 text-stone-500">
                {icon}
                <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
            </div>
            <p className={`text-2xl font-extrabold font-jakarta mt-1.5 ${accent ? 'text-[#007700]' : 'text-stone-900'}`}>{value}</p>
        </div>
    );
}

function StatusChip({ status }: { status: string }) {
    const map: Record<string, { text: string; cls: string }> = {
        ACTIVE: { text: 'Đang bán', cls: 'text-[#007700] bg-[#EAF0E2] border-[#BECAB6]' },
        INACTIVE: { text: 'Tạm dừng', cls: 'text-stone-600 bg-stone-100 border-stone-200' },
        OUT_OF_STOCK: { text: 'Hết hàng', cls: 'text-[#BA1A1A] bg-rose-50 border-rose-200' },
    };
    const s = map[status] || map.ACTIVE;
    return <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full border ${s.cls}`}>{s.text}</span>;
}

function EmptyRow({ text }: { text: string }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-stone-400">
            <PackageOpen size={28} />
            <p className="text-xs font-medium">{text}</p>
        </div>
    );
}

export default SellerCatalogPage;
