import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Archive, Search, RefreshCw, ChevronDown, ChevronRight, PackageOpen,
    AlertTriangle, Tag as TagIcon, Layers, Boxes, PlusCircle, Plus, X, Loader2, Check,
    Clock, CheckCircle2, XCircle, Ban, FileText
} from 'lucide-react';
import { catalogService, CatalogData, CatalogProduct, ProposalItem } from '../services/catalogService';
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
    const [proposals, setProposals] = useState<ProposalItem[]>([]);
    const [activeTab, setActiveTab] = useState<'catalog' | 'proposals'>('catalog');
    const [proposalTypeFilter, setProposalTypeFilter] = useState<'all' | 'category' | 'tag'>('all');
    const [proposalStatusFilter, setProposalStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [proposalSearch, setProposalSearch] = useState('');

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
            const [catData, myProposals] = await Promise.all([
                catalogService.load(),
                catalogService.getMyProposals(),
            ]);
            setData(catData);
            setProposals(myProposals);
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
            showToast('Đã tạo danh mục thành công và có thể dùng ngay! Ban quản trị sẽ rà soát nội dung.', 'success');
            setShowCatModal(false);
            setCatName('');
            setCatParentId('');
            setCatDesc('');
            setActiveTab('proposals');
            load(true);
        } catch (err: any) {
            showToast(getApiErrorMessage(err, 'Tạo danh mục thất bại.'), 'error');
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
            showToast('Đã tạo thẻ thành công và có thể dùng ngay! Ban quản trị sẽ rà soát nội dung.', 'success');
            setShowTagModal(false);
            setTagName('');
            setActiveTab('proposals');
            load(true);
        } catch (err: any) {
            showToast(getApiErrorMessage(err, 'Tạo thẻ thất bại.'), 'error');
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

    const pendingCount = useMemo(() => proposals.filter(p => p.review_status === 'pending').length, [proposals]);
    const approvedCount = useMemo(() => proposals.filter(p => p.review_status === 'approved').length, [proposals]);
    const rejectedCount = useMemo(() => proposals.filter(p => p.review_status === 'rejected' || p.review_status === 'banned').length, [proposals]);
    const catProposalsCount = useMemo(() => proposals.filter(p => p.type === 'category').length, [proposals]);
    const tagProposalsCount = useMemo(() => proposals.filter(p => p.type === 'tag').length, [proposals]);

    const filteredProposals = useMemo(() => {
        return proposals.filter(p => {
            if (proposalTypeFilter !== 'all' && p.type !== proposalTypeFilter) return false;
            if (proposalStatusFilter === 'pending' && p.review_status !== 'pending') return false;
            if (proposalStatusFilter === 'approved' && p.review_status !== 'approved') return false;
            if (proposalStatusFilter === 'rejected' && p.review_status !== 'rejected' && p.review_status !== 'banned') return false;
            if (proposalSearch.trim()) {
                const q = norm(proposalSearch);
                const matchesName = norm(p.name).includes(q);
                const matchesDesc = norm(p.description || '').includes(q);
                const matchesReason = norm(p.reject_reason || '').includes(q);
                if (!matchesName && !matchesDesc && !matchesReason) return false;
            }
            return true;
        });
    }, [proposals, proposalTypeFilter, proposalStatusFilter, proposalSearch]);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="h-9 w-72 bg-stone-200 rounded-lg animate-pulse" />
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
                    {[0, 1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-stone-100 border border-stone-200 rounded-2xl animate-pulse" />)}
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
                        Xem cấu trúc danh mục và thẻ phân loại trên sàn, hoặc theo dõi tiến độ xét duyệt các nội dung bạn đã đề xuất.
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                <StatTile icon={<Layers size={16} />} label="Danh mục đang mở" value={data.categories.length} />
                <StatTile icon={<Boxes size={16} />} label="Danh mục bạn có hàng" value={usedCount} accent />
                <StatTile icon={<PackageOpen size={16} />} label="Danh mục còn trống" value={Math.max(0, data.categories.length - usedCount)} />
                <StatTile icon={<TagIcon size={16} />} label="Thẻ đã duyệt" value={data.tags.length} />
                <StatTile
                    icon={<Clock size={16} className={pendingCount > 0 ? 'text-amber-600' : ''} />}
                    label="Đề xuất của bạn"
                    value={proposals.length}
                    hint={pendingCount > 0 ? `${pendingCount} chờ duyệt` : undefined}
                    accent={activeTab === 'proposals'}
                    onClick={() => setActiveTab('proposals')}
                />
            </div>

            {/* Tab navigation */}
            <div className="flex items-center gap-2 border-b border-stone-200 pb-px">
                <button
                    type="button"
                    onClick={() => setActiveTab('catalog')}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer font-jakarta ${
                        activeTab === 'catalog'
                            ? 'border-[#007700] text-[#007700]'
                            : 'border-transparent text-stone-500 hover:text-stone-800'
                    }`}
                >
                    <Layers size={16} />
                    <span>Cấu trúc danh mục & thẻ</span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('proposals')}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer font-jakarta ${
                        activeTab === 'proposals'
                            ? 'border-[#007700] text-[#007700]'
                            : 'border-transparent text-stone-500 hover:text-stone-800'
                    }`}
                >
                    <Clock size={16} />
                    <span>Đề xuất của tôi</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        pendingCount > 0
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-stone-100 text-stone-600'
                    }`}>
                        {proposals.length}
                    </span>
                    {pendingCount > 0 && (
                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" title={`${pendingCount} đề xuất đang chờ duyệt`} />
                    )}
                </button>
            </div>

            {activeTab === 'catalog' ? (
                <>
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
                </>
            ) : (
                /* Tab Đề xuất của tôi */
                <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
                    {/* Header & Filter toolbar */}
                    <div className="p-5 border-b border-stone-200 bg-stone-50/50 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h3 className="text-sm font-bold text-stone-900 font-jakarta flex items-center gap-2">
                                    <Clock size={16} className="text-[#007700]" /> Danh sách nội dung bạn đã đề xuất
                                </h3>
                                <p className="text-xs text-stone-500 mt-0.5">
                                    Theo dõi trạng thái xét duyệt của các Danh mục và Thẻ phân loại bạn đã gửi cho Ban quản trị sàn.
                                </p>
                            </div>
                            <div className="relative sm:w-64">
                                <Search className="absolute inset-y-0 left-3 my-auto text-stone-400" size={14} />
                                <input
                                    type="text"
                                    value={proposalSearch}
                                    onChange={e => setProposalSearch(e.target.value)}
                                    placeholder="Tìm theo tên đề xuất..."
                                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#007700] focus:border-[#007700]"
                                />
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-200/80">
                            {/* Filter Type */}
                            <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setProposalTypeFilter('all')}
                                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                        proposalTypeFilter === 'all'
                                            ? 'bg-white text-stone-900 shadow-xs font-bold'
                                            : 'text-stone-500 hover:text-stone-800'
                                    }`}
                                >
                                    Tất cả ({proposals.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setProposalTypeFilter('category')}
                                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                                        proposalTypeFilter === 'category'
                                            ? 'bg-white text-stone-900 shadow-xs font-bold'
                                            : 'text-stone-500 hover:text-stone-800'
                                    }`}
                                >
                                    <Layers size={13} className="text-[#007700]" /> Danh mục ({catProposalsCount})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setProposalTypeFilter('tag')}
                                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                                        proposalTypeFilter === 'tag'
                                            ? 'bg-white text-stone-900 shadow-xs font-bold'
                                            : 'text-stone-500 hover:text-stone-800'
                                    }`}
                                >
                                    <TagIcon size={13} className="text-indigo-600" /> Thẻ ({tagProposalsCount})
                                </button>
                            </div>

                            {/* Filter Status */}
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setProposalStatusFilter('all')}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                                        proposalStatusFilter === 'all'
                                            ? 'bg-stone-800 text-white border-stone-800'
                                            : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                                    }`}
                                >
                                    Tất cả trạng thái
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setProposalStatusFilter('pending')}
                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                                        proposalStatusFilter === 'pending'
                                            ? 'bg-amber-600 text-white border-amber-600'
                                            : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
                                    }`}
                                >
                                    <Clock size={12} /> Chờ duyệt ({pendingCount})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setProposalStatusFilter('approved')}
                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                                        proposalStatusFilter === 'approved'
                                            ? 'bg-emerald-700 text-white border-emerald-700'
                                            : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                                    }`}
                                >
                                    <CheckCircle2 size={12} /> Đã duyệt ({approvedCount})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setProposalStatusFilter('rejected')}
                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                                        proposalStatusFilter === 'rejected'
                                            ? 'bg-rose-700 text-white border-rose-700'
                                            : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
                                    }`}
                                >
                                    <XCircle size={12} /> Từ chối ({rejectedCount})
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Proposals List */}
                    {filteredProposals.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center">
                            <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                                <FileText size={24} />
                            </div>
                            <p className="text-sm font-bold text-stone-800 font-jakarta">
                                {proposalSearch || proposalTypeFilter !== 'all' || proposalStatusFilter !== 'all'
                                    ? 'Không tìm thấy đề xuất nào phù hợp'
                                    : 'Bạn chưa gửi đề xuất danh mục hoặc thẻ nào'}
                            </p>
                            <p className="text-xs text-stone-500 max-w-md">
                                {proposalSearch || proposalTypeFilter !== 'all' || proposalStatusFilter !== 'all'
                                    ? 'Thử thay đổi bộ lọc tìm kiếm hoặc từ khóa tra cứu.'
                                    : 'Khi sản phẩm của bạn thuộc ngành hàng mới hoặc cần thẻ phân loại riêng, hãy gửi đề xuất để Ban quản trị xét duyệt.'}
                            </p>
                            {proposals.length === 0 && (
                                <div className="flex items-center gap-2 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowCatModal(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#007700] hover:bg-[#005B00] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer font-jakarta"
                                    >
                                        <Plus size={14} /> Đề xuất danh mục
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowTagModal(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer font-jakarta"
                                    >
                                        <TagIcon size={14} /> Đề xuất thẻ
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="divide-y divide-stone-100">
                            {filteredProposals.map(item => {
                                const isCat = item.type === 'category';
                                const isPending = item.review_status === 'pending';
                                const isApproved = item.review_status === 'approved';
                                const isRejected = item.review_status === 'rejected';
                                const isBanned = item.review_status === 'banned';

                                return (
                                    <div key={item._id} className="p-5 hover:bg-stone-50/60 transition-colors">
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {isCat ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                            <Layers size={11} className="text-emerald-700" /> Danh mục
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                                                            <TagIcon size={11} className="text-indigo-700" /> Thẻ
                                                        </span>
                                                    )}

                                                    <h4 className="text-sm font-bold text-stone-900 font-jakarta">
                                                        {item.name}
                                                    </h4>

                                                    {item.slug && (
                                                        <span className="text-[11px] text-stone-400 font-mono">
                                                            /{item.slug}
                                                        </span>
                                                    )}
                                                </div>

                                                {item.description && (
                                                    <p className="text-xs text-stone-600 mt-1.5 line-clamp-2">
                                                        {item.description}
                                                    </p>
                                                )}

                                                {/* Rejection / Banned Reason Alert */}
                                                {(isRejected || isBanned) && (
                                                    <div className="mt-2.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
                                                        <AlertTriangle size={14} className="text-rose-600 shrink-0 mt-0.5" />
                                                        <div>
                                                            <span className="font-bold">Lý do từ chối: </span>
                                                            <span>{item.reject_reason || 'Nội dung chưa phù hợp với quy chuẩn của sàn.'}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-3 mt-2 text-[11.5px] text-stone-400">
                                                    <span>
                                                        Gửi lúc: {item.created_at ? new Date(item.created_at).toLocaleString('vi-VN', {
                                                            hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
                                                        }) : '—'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            <div className="shrink-0 flex items-center gap-2">
                                                {isPending && (
                                                    <div className="text-right">
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                                                            <Clock size={13} className="text-amber-600 animate-pulse" /> Đang chờ duyệt
                                                        </span>
                                                        <p className="text-[10.5px] text-amber-700/80 mt-1">
                                                            Đang rà soát, có thể gắn thử
                                                        </p>
                                                    </div>
                                                )}

                                                {isApproved && (
                                                    <div className="text-right">
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                                                            <CheckCircle2 size={13} className="text-emerald-600" /> Đã phê duyệt
                                                        </span>
                                                        <p className="text-[10.5px] text-emerald-700/80 mt-1">
                                                            Áp dụng chính thức trên sàn
                                                        </p>
                                                    </div>
                                                )}

                                                {isRejected && (
                                                    <div className="text-right">
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs">
                                                            <XCircle size={13} className="text-rose-600" /> Bị từ chối
                                                        </span>
                                                    </div>
                                                )}

                                                {isBanned && (
                                                    <div className="text-right">
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-900 border border-red-300 shadow-2xs">
                                                            <Ban size={13} className="text-red-700" /> Bị cấm
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

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

function StatTile({
    icon,
    label,
    value,
    accent,
    hint,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
    accent?: boolean;
    hint?: string;
    onClick?: () => void;
}) {
    return (
        <div
            onClick={onClick}
            className={`p-4 bg-white border border-stone-200 rounded-2xl shadow-xs transition-all ${
                onClick ? 'cursor-pointer hover:border-[#007700] hover:shadow-sm' : ''
            }`}
        >
            <div className="flex items-center gap-1.5 text-stone-500">
                {icon}
                <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1.5">
                <p className={`text-2xl font-extrabold font-jakarta ${accent ? 'text-[#007700]' : 'text-stone-900'}`}>{value}</p>
                {hint && (
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        {hint}
                    </span>
                )}
            </div>
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
