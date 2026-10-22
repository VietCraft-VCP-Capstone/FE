import { decimal } from '../../format';
import type { IntelImage } from '../../intelTypes';
import { Chip, InsightCard, Note } from '../ui';
import { issueText } from './intelLabels';

const STYLE_LABEL: Record<string, string> = {
  white_bg: 'Nền trắng',
  lifestyle: 'Có người dùng',
  flatlay: 'Chụp từ trên xuống',
  closeup: 'Cận chất liệu',
};

function ImageTile({ img, index }: { img: IntelImage; index: number }) {
  return (
    <li className="min-w-0">
      <img src={img.url} alt={`Ảnh sản phẩm số ${index + 1}`} loading="lazy" className="aspect-square w-full rounded-md border border-stone-200 bg-stone-50 object-cover" />
      <div className="mt-1.5 flex flex-wrap gap-1">
        {img.style && <Chip tone="info">{STYLE_LABEL[img.style] ?? img.style}</Chip>}
        {img.issues.map(i => <Chip key={i.code} tone="warn">{issueText(i)}</Chip>)}
        {img.issues.length === 0 && <Chip tone="good">Không lỗi</Chip>}
      </div>
      {img.sim_title !== null && <p className="m-0 mt-1 text-[11px] text-stone-500">Khớp tiêu đề: {decimal(img.sim_title, 2)}</p>}
    </li>
  );
}

export function ImagePanel({ images, bare = false }: { images: IntelImage[]; bare?: boolean }) {
  return (
    <InsightCard bare={bare} title="Ảnh sản phẩm" info="Mỗi ảnh được kiểm tra độ nét, độ sáng, nền, chữ đè và độ khớp với tiêu đề.">
      {images.length === 0 ? (
        <Note>Không có ảnh nào được chấm. Ảnh phải tải được và nằm trên kho ảnh của sàn.</Note>
      ) : (
        <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img, i) => <ImageTile key={`${img.url}-${i}`} img={img} index={i} />)}
        </ul>
      )}
    </InsightCard>
  );
}
