import { Tooltip } from 'antd';
import type { IntelImage } from '../../intelTypes';
import { Chip, InsightCard, Note } from '../ui';
import { issueText } from './intelLabels';

const STYLE_LABEL: Record<string, string> = {
  white_bg: 'Nền trắng',
  lifestyle: 'Có người dùng',
  flatlay: 'Chụp từ trên xuống',
  closeup: 'Cận chất liệu',
};

const ISSUE_HINT: Record<string, string> = {
  low_resolution: 'Kích thước ảnh hiện tại hơi nhỏ. Khuyến nghị tải ảnh từ 800×800px trở lên để khách zoom rõ chi tiết.',
  blurry: 'Ảnh có dấu hiệu mờ, chưa nét. Nên chụp lại dưới đủ ánh sáng tự nhiên.',
  too_dark: 'Ảnh bị thiếu sáng. Nên chụp nơi có ánh sáng ban ngày tự nhiên.',
  too_bright: 'Ảnh bị loá sáng, mất chi tiết bề mặt sản phẩm.',
  busy_background: 'Phông nền có nhiều vật thể gây phân tâm. Nên chụp trên nền trơn hoặc góc tối giản.',
  text_overlay: 'Ảnh có chèn chữ hoặc số điện thoại. Sàn khuyến nghị dùng ảnh mộc không chèn chữ để tăng tính chuyên nghiệp.',
  bad_aspect: 'Khung ảnh nên là hình vuông (tỉ lệ 1:1) để hiển thị đẹp nhất trên ứng dụng.',
};

function ImageTile({ img, index }: { img: IntelImage; index: number }) {
  return (
    <li className="min-w-0">
      <img src={img.url} alt={`Ảnh sản phẩm số ${index + 1}`} loading="lazy" className="aspect-square w-full rounded-md border border-stone-200 bg-stone-50 object-cover" />
      <div className="mt-1.5 flex flex-wrap gap-1">
        {img.style && <Chip tone="info">{STYLE_LABEL[img.style] ?? img.style}</Chip>}
        {img.issues.map(i => (
          <Tooltip key={i.code} title={ISSUE_HINT[i.code] ?? issueText(i)}>
            <span className="cursor-help inline-block">
              <Chip tone="warn">{issueText(i)}</Chip>
            </span>
          </Tooltip>
        ))}
        {img.issues.length === 0 && <Chip tone="good">Không lỗi</Chip>}
      </div>
      {img.sim_title !== null && (
        <p className="m-0 mt-1 text-[11px] text-stone-500" title="Hình ảnh đã được AI nhận diện đúng với tên sản phẩm">
          ✓ Đúng mô tả sản phẩm
        </p>
      )}
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
