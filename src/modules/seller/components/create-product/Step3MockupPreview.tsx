import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Star, RotateCcw, AlertTriangle, Check, ShieldCheck, ChevronDown, Info } from 'lucide-react';
import { productsService, type MockupColorPreview, type MockupLevel } from '../../../product/services/productsService';
import { VideoAdCard } from './VideoAdCard';
import { LEVEL_META, formatVnd, worstLevel, type ColorGroup, type VariantMap } from './podShared';

interface Step3Props {
    blank: any;
    colorGroups: ColorGroup[];
    /** Khoá nội dung thiết kế hiện tại; khác khoá của ảnh đã có thì render lại. */
    signature: string;
    placements: () => any[];
    previews: { sig: string; byColor: MockupColorPreview[] } | null;
    setPreviews: (p: { sig: string; byColor: MockupColorPreview[] } | null) => void;
    selectedVariants: VariantMap;
    setSelectedVariants: React.Dispatch<React.SetStateAction<VariantMap>>;
    selectedImages: string[];
    setSelectedImages: React.Dispatch<React.SetStateAction<string[]>>;
    coverImage: string;
    setCoverImage: React.Dispatch<React.SetStateAction<string>>;
}

function LevelBadge({ level, compact }: { level: MockupLevel; compact?: boolean }) {
    const m = LEVEL_META[level];
    return (
        <span title={m.hint} className={`inline-flex items-center gap-1 rounded-md border font-bold ${compact ? 'px-1.5 py-px text-[10px]' : 'px-2 py-0.5 text-[11px]'} ${m.cls}`}>
            {(level === 'photo' || level === 'verified') ? <ShieldCheck size={compact ? 10 : 12} /> : <AlertTriangle size={compact ? 10 : 12} />}
            {m.label}
        </span>
    );
}

export function Step3MockupPreview({
    blank, colorGroups, signature, placements, previews, setPreviews,
    selectedVariants, setSelectedVariants, selectedImages, setSelectedImages, coverImage, setCoverImage,
}: Step3Props) {
    const areas = (blank?.print_areas || []) as any[];
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');
    const [elapsed, setElapsed] = useState(0);
    const [activeColor, setActiveColor] = useState(colorGroups[0]?.color || '');
    const [activeIdx, setActiveIdx] = useState(0);
    const [showVideo, setShowVideo] = useState(false);
    const reqId = useRef(0);

    const isOn = (g: ColorGroup) => !g.skus.length || g.skus.some(s => selectedVariants[s]?.on);
    const previewOf = (color: string) => previews?.byColor.find(p => p.color === color);

    const render = () => {
        const id = ++reqId.current;
        setLoading(true); setErr(''); setElapsed(0);
        productsService.previewMockup(blank._id, placements(), {
            colors: colorGroups.map(g => ({ color: g.color, color_hex: g.hex })),
        }).then(res => {
            if (id !== reqId.current) return;
            setPreviews({ sig: signature, byColor: res.byColor });
            // Chọn sẵn ảnh của các màu đang bật; ảnh bìa là ảnh đầu của màu đầu tiên đang bật
            const onColors = colorGroups.filter(isOn).map(g => g.color);
            const imgs = res.byColor.filter(p => onColors.includes(p.color)).flatMap(p => p.images);
            setSelectedImages(imgs);
            setCoverImage(cur => (cur && imgs.includes(cur) ? cur : imgs[0] || ''));
        }).catch((e: any) => {
            if (id !== reqId.current) return;
            const d = e.response?.data;
            setErr(d?.errors?.join('; ') || d?.error || 'Không tạo được ảnh mockup. Thử lại sau ít phút.');
        }).finally(() => { if (id === reqId.current) setLoading(false); });
    };

    useEffect(() => {
        if (previews?.sig !== signature) render();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [signature]);

    useEffect(() => {
        if (!loading) return;
        const t = window.setInterval(() => setElapsed(s => s + 1), 1000);
        return () => window.clearInterval(t);
    }, [loading]);

    // ---------- chọn màu / ảnh ----------
    const setColorOn = (g: ColorGroup, on: boolean) => {
        setSelectedVariants(prev => {
            const next = { ...prev };
            g.skus.forEach(s => { if (next[s]) next[s] = { ...next[s], on }; });
            return next;
        });
        const imgs = previewOf(g.color)?.images || [];
        if (on) {
            setSelectedImages(prev => Array.from(new Set([...prev, ...imgs])));
            if (!coverImage && imgs[0]) setCoverImage(imgs[0]);
        } else {
            const rest = selectedImages.filter(u => !imgs.includes(u));
            setSelectedImages(rest);
            if (imgs.includes(coverImage)) setCoverImage(rest[0] || '');
        }
    };
    const setAllOn = (on: boolean) => {
        setSelectedVariants(prev => {
            const next = { ...prev };
            colorGroups.forEach(g => g.skus.forEach(s => { if (next[s]) next[s] = { ...next[s], on }; }));
            return next;
        });
        const all = on ? (previews?.byColor || []).flatMap(p => p.images) : [];
        setSelectedImages(all);
        setCoverImage(on ? (coverImage && all.includes(coverImage) ? coverImage : all[0] || '') : '');
    };
    const toggleImage = (url: string) => {
        if (selectedImages.includes(url)) {
            const rest = selectedImages.filter(u => u !== url);
            setSelectedImages(rest);
            if (coverImage === url) setCoverImage(rest[0] || '');
        } else {
            setSelectedImages(prev => [...prev, url]);
            if (!coverImage) setCoverImage(url);
        }
    };
    const makeCover = (url: string) => {
        setCoverImage(url);
        if (!selectedImages.includes(url)) setSelectedImages(prev => [url, ...prev]);
    };

    // ---------- số liệu tóm tắt ----------
    const summary = useMemo(() => {
        const count: Record<MockupLevel, number> = { photo: 0, verified: 0, auto: 0, estimated: 0 };
        for (const g of colorGroups) {
            const w = worstLevel(previewOf(g.color));
            if (w) count[w]++;
        }
        return count;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [previews, colorGroups]);
    const needsReview = summary.auto + summary.estimated;

    const active = previewOf(activeColor);
    const activeGroup = colorGroups.find(g => g.color === activeColor);
    const activeItem = active?.items[Math.min(activeIdx, (active?.items.length || 1) - 1)];
    const heroUrl = activeItem?.url;
    const areaLabel = (key: string) => areas.find(a => a.key === key)?.label || key;
    const onCount = colorGroups.filter(isOn).length;

    if (loading && !previews) {
        return (
            <div className="rounded-2xl border border-stone-200 bg-white p-8">
                <div className="flex flex-col items-center text-center gap-2 mb-6">
                    <Loader2 size={30} className="animate-spin text-admin-brand" />
                    <div className="text-sm font-semibold text-stone-800">Đang tạo mockup cho {colorGroups.length} màu… {elapsed > 0 && <span className="text-stone-500 font-normal">({elapsed}s)</span>}</div>
                    <div className="text-xs text-stone-500 max-w-md">
                        {elapsed < 8 ? 'Ghép thiết kế lên từng màu phôi.' : 'Lần đầu dùng phôi này, AI cần tách phôi khỏi nền (khoảng 10–30 giây). Những lần sau sẽ nhanh hơn.'}
                    </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {colorGroups.slice(0, 8).map(g => (
                        <div key={g.color} className="rounded-xl border border-stone-200 p-2 animate-pulse">
                            <div className="aspect-square rounded-lg bg-stone-100 mb-2" />
                            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: g.hex || '#e5e7eb' }} /><span className="text-[11px] text-stone-500">{g.color}</span></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (err && !previews) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
                <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <div className="text-sm font-semibold text-red-700 mb-1">Chưa tạo được ảnh mockup</div>
                <div className="text-xs text-red-600 mb-4">{err}</div>
                <button type="button" onClick={render} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-red-200 text-sm font-semibold text-red-700 hover:bg-red-100"><RotateCcw size={14} /> Thử lại</button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Tóm tắt chất lượng ảnh */}
            {previews && (
                <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 rounded-xl border text-xs ${needsReview ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>
                    {needsReview ? <AlertTriangle size={16} className="shrink-0" /> : <ShieldCheck size={16} className="shrink-0" />}
                    <span className="flex-1 min-w-[220px] leading-relaxed">
                        {needsReview
                            ? <><b>{needsReview} màu</b> dùng ảnh đổi màu tự động mà xưởng chưa xác nhận. Xem kỹ từng màu: nếu màu bị lem ra nền, hãy tắt màu đó hoặc báo xưởng bổ sung ảnh.</>
                            : <>Tất cả ảnh đều là ảnh thật hoặc dùng vùng phôi xưởng đã xác nhận.</>}
                    </span>
                    <span className="flex flex-wrap gap-1.5">
                        {(Object.keys(summary) as MockupLevel[]).filter(l => summary[l] > 0).map(l => (
                            <span key={l} className="inline-flex items-center gap-1"><LevelBadge level={l} compact /> ×{summary[l]}</span>
                        ))}
                    </span>
                    <button type="button" onClick={render} disabled={loading} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/70 border border-current/20 font-semibold hover:bg-white disabled:opacity-60">
                        {loading ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />} Tạo lại
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-4 items-start">
                {/* Ảnh lớn của màu đang xem */}
                <section className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
                    <div className="relative bg-[#f6f7f6] flex items-center justify-center p-4 sm:p-6">
                        <div className="relative w-full max-w-[520px] aspect-square">
                            {heroUrl
                                ? <img src={heroUrl} alt={`${blank.title} màu ${activeColor}`} className="w-full h-full object-contain rounded-xl" />
                                : <div className="w-full h-full grid place-items-center text-sm text-stone-400">Không có ảnh cho màu này</div>}
                            {loading && <div className="absolute inset-0 bg-white/60 grid place-items-center rounded-xl"><Loader2 size={26} className="animate-spin text-admin-brand" /></div>}
                            {heroUrl && coverImage === heroUrl && (
                                <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-admin-brand text-white text-[11px] font-bold shadow"><Star size={12} fill="currentColor" /> Ảnh bìa</span>
                            )}
                            {activeItem && <span className="absolute top-3 right-3"><LevelBadge level={activeItem.level} /></span>}
                        </div>
                    </div>
                    <div className="p-4 flex flex-col gap-3 border-t border-stone-200">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full border border-black/15" style={{ backgroundColor: active?.color_hex || activeGroup?.hex || '#e5e7eb' }} />
                                <span className="text-sm font-bold text-stone-900">{activeColor}</span>
                                {activeGroup && !isOn(activeGroup) && <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">Đang tắt</span>}
                            </div>
                            {heroUrl && (
                                <div className="flex items-center gap-1.5">
                                    <button type="button" onClick={() => toggleImage(heroUrl)}
                                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${selectedImages.includes(heroUrl) ? 'border-admin-brand bg-admin-brand-050 text-admin-brand' : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50'}`}>
                                        <Check size={13} /> {selectedImages.includes(heroUrl) ? 'Đã đưa vào sản phẩm' : 'Đưa vào sản phẩm'}
                                    </button>
                                    <button type="button" onClick={() => makeCover(heroUrl)} disabled={coverImage === heroUrl}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50">
                                        <Star size={13} /> Đặt làm ảnh bìa
                                    </button>
                                </div>
                            )}
                        </div>
                        {active && active.items.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Mặt in">
                                {active.items.map((it, i) => (
                                    <button key={it.url} type="button" role="tab" aria-selected={i === activeIdx} onClick={() => setActiveIdx(i)}
                                        className={`relative shrink-0 w-16 rounded-lg border p-0.5 bg-white ${i === activeIdx ? 'border-admin-brand ring-2 ring-admin-brand/25' : 'border-stone-200'}`}>
                                        <img src={it.url} alt="" className="w-full aspect-square object-contain" />
                                        <span className="block text-[9.5px] text-stone-600 truncate">{areaLabel(it.area_key)}</span>
                                        {selectedImages.includes(it.url) && <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-admin-brand text-white grid place-items-center"><Check size={9} /></span>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Danh sách màu */}
                <aside className="rounded-2xl border border-stone-200 bg-white">
                    <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-stone-200">
                        <div>
                            <h3 className="text-sm font-bold text-stone-900">Màu mở bán</h3>
                            <p className="text-[11px] text-stone-500">{onCount}/{colorGroups.length} màu · {selectedImages.length} ảnh đã chọn</p>
                        </div>
                        <div className="flex gap-1">
                            <button type="button" onClick={() => setAllOn(true)} className="px-2 py-1 rounded-md text-[11px] font-semibold text-admin-brand hover:bg-admin-brand-050">Bật hết</button>
                            <button type="button" onClick={() => setAllOn(false)} className="px-2 py-1 rounded-md text-[11px] font-semibold text-stone-600 hover:bg-stone-100">Tắt hết</button>
                        </div>
                    </div>
                    <ul className="divide-y divide-stone-100 max-h-[560px] overflow-y-auto">
                        {colorGroups.map(g => {
                            const p = previewOf(g.color);
                            const on = isOn(g);
                            const w = worstLevel(p);
                            const thumb = p?.images[0];
                            const viewing = g.color === activeColor;
                            return (
                                <li key={g.color} className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${viewing ? 'bg-admin-brand-050/60' : 'hover:bg-stone-50'}`}>
                                    <button type="button" onClick={() => { setActiveColor(g.color); setActiveIdx(0); }} className="flex items-center gap-3 flex-1 min-w-0 text-left" aria-label={`Xem màu ${g.color}`}>
                                        <span className={`relative w-14 h-14 shrink-0 rounded-lg border bg-[#f6f7f6] overflow-hidden ${viewing ? 'border-admin-brand' : 'border-stone-200'} ${on ? '' : 'opacity-50'}`}>
                                            {thumb ? <img src={thumb} alt="" className="w-full h-full object-contain" /> : <span className="absolute inset-0 grid place-items-center text-[10px] text-stone-400">—</span>}
                                            {thumb && thumb === coverImage && <span className="absolute bottom-0.5 left-0.5 w-4 h-4 rounded-full bg-admin-brand text-white grid place-items-center"><Star size={9} fill="currentColor" /></span>}
                                        </span>
                                        <span className="min-w-0">
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-3 h-3 rounded-full border border-black/15 shrink-0" style={{ backgroundColor: p?.color_hex || g.hex || '#e5e7eb' }} />
                                                <span className={`text-[13px] font-semibold truncate ${on ? 'text-stone-900' : 'text-stone-500'}`}>{g.color}</span>
                                            </span>
                                            <span className="block text-[11px] text-stone-500 truncate">{g.sizes.length ? g.sizes.join(' · ') : 'Một kích cỡ'} · phôi {formatVnd(g.minCost)}</span>
                                            {w && <span className="block mt-0.5"><LevelBadge level={w} compact /></span>}
                                        </span>
                                    </button>
                                    <label className="relative inline-flex items-center cursor-pointer shrink-0" title={on ? 'Đang bán màu này' : 'Không bán màu này'}>
                                        <input type="checkbox" className="sr-only peer" checked={on} onChange={e => setColorOn(g, e.target.checked)} aria-label={`Bán màu ${g.color}`} />
                                        <span className="w-9 h-5 rounded-full bg-stone-300 peer-checked:bg-admin-brand transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-admin-brand/40" />
                                        <span className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
                                    </label>
                                </li>
                            );
                        })}
                    </ul>
                    <div className="flex items-start gap-1.5 px-4 py-3 border-t border-stone-200 text-[11px] text-stone-500 leading-relaxed">
                        <Info size={13} className="shrink-0 mt-px" />
                        Khách chọn màu nào sẽ thấy ảnh của màu đó. Ảnh bìa hiện ở trang tìm kiếm và danh sách sản phẩm.
                    </div>
                </aside>
            </div>

            {/* Video quảng cáo (tuỳ chọn, tốn phí) */}
            {(coverImage || heroUrl) && (
                <section className="rounded-2xl border border-stone-200 bg-white">
                    <button type="button" onClick={() => setShowVideo(v => !v)} aria-expanded={showVideo}
                        className="w-full flex items-center justify-between px-4 py-3 text-left">
                        <span>
                            <span className="text-sm font-bold text-stone-900">Video quảng cáo bằng AI</span>
                            <span className="block text-[11px] text-stone-500">Tuỳ chọn. Tạo video ngắn từ ảnh bìa để đăng mạng xã hội.</span>
                        </span>
                        <ChevronDown size={18} className={`text-stone-500 transition-transform ${showVideo ? 'rotate-180' : ''}`} />
                    </button>
                    {showVideo && <div className="px-4 pb-4"><VideoAdCard imageUrl={coverImage || heroUrl!} title={blank.title} /></div>}
                </section>
            )}
        </div>
    );
}

export default Step3MockupPreview;
