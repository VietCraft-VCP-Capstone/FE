import { ConfigProvider, DatePicker } from 'antd';
import viVN from 'antd/locale/vi_VN';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

dayjs.locale('vi');

export function DateField({ value, min, max, onChange }: {
  value: string;
  min: string;
  max: string;
  onChange: (iso: string) => void;
}) {
  return (
    <ConfigProvider locale={viVN}>
      <DatePicker
        size="small"
        format="DD/MM/YYYY"
        placeholder="Hôm nay"
        value={value ? dayjs(value) : null}
        disabledDate={d => d.isBefore(min, 'day') || d.isAfter(max, 'day')}
        onChange={d => onChange(d ? d.format('YYYY-MM-DD') : '')}
        className="!w-36"
      />
    </ConfigProvider>
  );
}
