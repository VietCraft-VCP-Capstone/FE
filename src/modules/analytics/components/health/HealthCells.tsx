import { Button, Tooltip } from 'antd';
import { Eye, PencilLine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { editLink } from '../HealthParts';

export const detailLink = (id: string) => `/seller/insights/listings/${id}`;

export function RowActions({ id, title, field }: { id: string; title: string; field?: string | null }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-end gap-1.5">
      <Tooltip title="Xem chi tiết">
        <Button aria-label={`Xem chi tiết ${title}`} icon={<Eye size={16} />} onClick={() => navigate(detailLink(id))} />
      </Tooltip>
      <Tooltip title={field ? 'Sửa ngay chỗ cần sửa' : 'Sửa sản phẩm'}>
        <Button type="primary" aria-label={`Sửa ${title}`} icon={<PencilLine size={16} />} onClick={() => navigate(editLink(id, field))} />
      </Tooltip>
    </div>
  );
}
