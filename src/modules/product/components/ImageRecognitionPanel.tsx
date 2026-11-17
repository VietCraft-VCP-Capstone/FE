import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { analyticsApi, type ImageRecognitionResult } from '../../analytics/services/analyticsApi';
import { getApiErrorMessage } from '../../../infrastructure/api/client';
import type { CatalogOption, ProductColorVariant } from '../types/product';

/** Màu mặc định của form "Thêm sản phẩm" — còn y nguyên nghĩa là seller chưa chỉnh, AI được thay. */
const DEFAULT_COLOR_NAMES = ['đen', 'trắng'];
const isDefaultColors = (cs: ProductColorVariant[]) =>
  cs.length === 0 || (cs.length === DEFAULT_COLOR_NAMES.length && cs.every((c, i) => c.name.trim().toLowerCase() === DEFAULT_COLOR_NAMES[i]));
const toVariants = (cs: { name: string; hex: string }[]): ProductColorVariant[] =>
  cs.map(c => ({ name: c.name, hex: c.hex || '#9CA3AF' }));

const API_ORIGIN = (import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8080/api' : '/api'))
  .replace(/\/api\/?$/, '');

/** Ảnh (URL Cloudinary hoặc /uploads của BE) → JPEG base64 thu nhỏ ~1024px để gửi AI (ảnh gốc có thể vài MB). */
async function imageUrlToDataUrl(url: string, maxSide = 1024): Promise<string> {
  const abs = url.startsWith('http') || url.startsWith('data:') ? url : `${API_ORIGIN}${url}`;
  const blob = await (await fetch(abs)).blob();
  const bmp = await createImageBitmap(blob);
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.85);
}

interface Props {
  imageUrls: string[];              // ảnh bìa trước, tối đa 6 ảnh được gửi đi
  colors: ProductColorVariant[];
  title: string;
  categoryId: string;
  categories: CatalogOption[];
  materials: string[];
  onApply: (patch: { title?: string; categoryId?: string; category?: string; materials?: string[]; colors?: ProductColorVariant[] }) => void;
}

/**
 * Nhận diện sản phẩm từ ảnh: seller tải ảnh đầu tiên mà chưa nhập tên → AI tự đọc ảnh và điền tên
 * (và danh mục nếu chưa chọn). Chất liệu/màu chỉ gợi ý để seller bấm thêm — AI nhìn ảnh không chắc bằng seller.
 */
export function ImageRecognitionPanel({ imageUrls, colors, title, categoryId, categories, materials, onApply }: Props) {
  const imageUrl = imageUrls[0] || '';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImageRecognitionResult | null>(null);
  const [autoFilled, setAutoFilled] = useState<string[]>([]);
  // Bộ ảnh đã nhận diện (tối đa 6 ảnh đầu). Trước đây chỉ theo ảnh bìa: tải ảnh 1 rồi mới thêm ảnh 2-4
  // thì AI chỉ thấy 1 ảnh → chỉ ra 1 màu.
  const imagesKey = imageUrls.slice(0, 6).join('|');
  const triedFor = useRef<string>('');
  const runId = useRef(0);
  // Giá trị AI đã tự điền lần trước: ô còn y nguyên giá trị đó thì AI được cập nhật, seller sửa rồi thì thôi
  const lastAuto = useRef<{ title?: string; categoryId?: string; colors?: string }>({});
  const colorKey = (cs: { name: string }[]) => cs.map(c => c.name.trim().toLowerCase()).join('|');
  const replaceable = () => ({
    title: !title.trim() || title === lastAuto.current.title,
    category: !categoryId || categoryId === lastAuto.current.categoryId,
    colors: isDefaultColors(colors) || colorKey(colors) === lastAuto.current.colors,
  });

  const findCategory = (name?: string | null) =>
    name ? categories.find(c => c.name.trim().toLowerCase() === name.trim().toLowerCase()) : undefined;

  const recognize = async () => {
    if (!imageUrl) return;
    triedFor.current = imagesKey;
    const myRun = ++runId.current;
    setLoading(true);
    setError(null);
    try {
      // Gửi tất cả ảnh (tối đa 6): cùng sản phẩm ở các màu khác nhau → AI đọc đủ các màu
      const dataUrls = await Promise.all(imageUrls.slice(0, 6).map(u => imageUrlToDataUrl(u)));
      const r = await analyticsApi.recognizeProductImage(dataUrls);
      if (myRun !== runId.current) return;   // ảnh đã đổi trong lúc chờ → bỏ kết quả cũ
      setResult(r);
      if (r.is_product) {
        // Chỉ điền ô còn trống / mặc định / do chính AI điền lần trước — không ghi đè thứ seller đã nhập
        const can = replaceable();
        const patch: Parameters<Props['onApply']>[0] = {};
        const filled: string[] = [];
        if (can.title && r.product_name) {
          patch.title = r.product_name; lastAuto.current.title = r.product_name; filled.push('tên sản phẩm');
        }
        const cat = findCategory(r.category);
        if (can.category && cat) {
          patch.categoryId = cat._id; patch.category = cat.name; lastAuto.current.categoryId = cat._id; filled.push('danh mục');
        }
        if (can.colors && r.colors.length) {
          patch.colors = toVariants(r.colors); lastAuto.current.colors = colorKey(r.colors); filled.push(`${r.colors.length} màu`);
        }
        if (filled.length) onApply(patch);
        setAutoFilled(filled);
      }
    } catch (err: any) {
      // AI trả { error: mã, message: câu cho người dùng } — hiện câu, không hiện mã
      const fallback = 'Chưa nhận diện được ảnh, vui lòng thử lại.';
      setError(err?.response?.data?.message || (err?.response?.status >= 500 ? fallback : getApiErrorMessage(err, fallback)));
    } finally {
      setLoading(false);
    }
  };

  // Tự chạy lại mỗi khi bộ ảnh đổi (đợi 1,5s sau ảnh cuối để thêm nhiều ảnh liên tiếp chỉ tốn 1 lượt gọi AI),
  // miễn còn ô AI được điền (trống / mặc định / do AI điền trước đó)
  useEffect(() => {
    if (!imageUrl || triedFor.current === imagesKey) return;
    const can = replaceable();
    if (!can.title && !can.category && !can.colors) return;
    const t = setTimeout(() => recognize(), 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagesKey]);

  if (!imageUrl) return null;
  const cat = findCategory(result?.category);
  const newMaterials = (result?.materials || []).filter(m => !materials.some(x => x.toLowerCase() === m.toLowerCase()));

  return (
    <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 text-xs space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-emerald-900">
          Nhận diện sản phẩm từ ảnh
        </span>
        <button
          type="button"
          disabled={loading}
          onClick={() => recognize()}
          className="text-[11px] font-bold text-emerald-700 hover:underline disabled:opacity-50 cursor-pointer"
        >
          {result ? 'Nhận diện lại' : 'Nhận diện'}
        </button>
      </div>

      {loading && <p className="flex items-center gap-1.5 text-stone-600"><Loader2 size={13} className="animate-spin" /> Đang xem ảnh...</p>}
      {error && <p className="text-rose-700">{error}</p>}

      {result && !loading && (result.is_product ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-stone-800"><strong className="text-stone-950">{result.product_name}</strong></p>
            {result.product_name !== title && (
              <button type="button" onClick={() => onApply({ title: result.product_name })}
                className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-bold text-[11px] cursor-pointer">Dùng làm tên</button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {cat && cat._id !== categoryId && (
              <button type="button" onClick={() => onApply({ categoryId: cat._id, category: cat.name })}
                className="px-2 py-0.5 rounded-md border border-emerald-300 bg-white text-[11px] cursor-pointer">+ Danh mục: <strong>{cat.name}</strong></button>
            )}
            {newMaterials.length > 0 && (
              <button type="button" onClick={() => onApply({ materials: [...materials, ...newMaterials].slice(0, 5) })}
                className="px-2 py-0.5 rounded-md border border-emerald-300 bg-white text-[11px] cursor-pointer">+ Chất liệu: <strong>{newMaterials.join(', ')}</strong></button>
            )}
            {result.colors.length > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-stone-100 text-[11px] inline-flex items-center gap-1.5 flex-wrap">
                Màu:
                {result.colors.map(c => (
                  <span key={c.name} className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full border border-stone-300" style={{ background: c.hex || '#9CA3AF' }} />{c.name}
                  </span>
                ))}
              </span>
            )}
            {result.colors.length > 0 && colors.map(c => c.name).join('|') !== result.colors.map(c => c.name).join('|') && (
              <button type="button" onClick={() => onApply({ colors: toVariants(result.colors) })}
                className="px-2 py-0.5 rounded-md border border-emerald-300 bg-white text-[11px] cursor-pointer">Dùng {result.colors.length} màu từ ảnh</button>
            )}
          </div>
          {autoFilled.length > 0 && <p className="text-emerald-800">Đã tự điền {autoFilled.join(', ')} từ ảnh — bạn có thể sửa lại.</p>}
          {result.confidence === 'low' && <p className="text-amber-700">AI chưa chắc chắn, hãy kiểm tra lại tên trước khi đăng.</p>}
        </div>
      ) : (
        <p className="text-amber-800">Ảnh này có vẻ không phải ảnh sản phẩm — hãy dùng ảnh chụp rõ sản phẩm làm ảnh bìa.</p>
      ))}
    </div>
  );
}
