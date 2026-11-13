import { Button, Tooltip } from 'antd';
import { Eye, PencilLine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { editLink } from '../HealthParts';

export const detailLink = (id: string) => `/seller/insights/listings/${id}`;

export function RowActions({ id, title, field }: { id: string; title: string; field?: string | null }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-end gap-1.5">
      <Tooltip title="Xem phân tích tối ưu & độ sẵn sàng chuyển đổi">
        <Button
          size="small"
          className="!h-7 !w-7 !p-0 !border-stone-200 !text-stone-600 hover:!text-[#007700] hover:!border-[#BECAB6] hover:!bg-[#EAF0E2] !rounded-md"
          aria-label={`Xem chi tiết ${title}`}
          icon={<Eye size={14} />}
          onClick={() => navigate(detailLink(id))}
        />
      </Tooltip>
      <Tooltip title={field ? 'Đi tới mục cần tối ưu của sản phẩm' : 'Mở trang chỉnh sửa sản phẩm'}>
        <Button
          type="primary"
          size="small"
          className="!h-7 !px-2.5 !text-xs !font-bold !bg-[#007700] hover:!bg-[#005B00] !text-white !border-0 !rounded-md inline-flex items-center gap-1 shadow-2xs"
          aria-label={`Sửa ${title}`}
          icon={<PencilLine size={12} />}
          onClick={() => navigate(editLink(id, field))}
        >
          Sửa
        </Button>
      </Tooltip>
    </div>
  );
}
