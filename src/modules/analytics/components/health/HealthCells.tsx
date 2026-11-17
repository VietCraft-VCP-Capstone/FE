import { Button, Tooltip } from 'antd';
import { Eye, PencilLine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { editLink } from '../HealthParts';

export const detailLink = (id: string) => `/seller/insights/listings/${id}`;

export function RowActions({ id, title, field }: { id: string; title: string; field?: string | null }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-end gap-2 shrink-0">
      <Tooltip title="Xem chi tiết điểm và việc cần làm">
        <Button
          size="small"
          className="!h-8 !w-8 !p-0 !border-stone-200 !text-stone-600 hover:!text-[#007700] hover:!border-[#BECAB6] hover:!bg-[#EAF0E2] !rounded-lg shrink-0 flex items-center justify-center cursor-pointer"
          aria-label={`Xem chi tiết ${title}`}
          icon={<Eye size={15} />}
          onClick={() => navigate(detailLink(id))}
        />
      </Tooltip>
      <Tooltip title={field ? 'Đi tới mục cần tối ưu của sản phẩm' : 'Mở trang chỉnh sửa sản phẩm'}>
        <Button
          type="primary"
          size="small"
          className="!h-8 !px-3 !text-xs !font-bold !bg-[#007700] hover:!bg-[#005B00] !text-white !border-0 !rounded-lg inline-flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
          aria-label={`Sửa ${title}`}
          icon={<PencilLine size={13} />}
          onClick={() => navigate(editLink(id, field))}
        >
          Sửa
        </Button>
      </Tooltip>
    </div>
  );
}
