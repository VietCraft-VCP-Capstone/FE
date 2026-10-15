import { useState } from 'react';
import { Alert, Button, Descriptions, Input, Popconfirm, Typography } from 'antd';
import { Banknote } from 'lucide-react';

import { refundService, type ManualRefundInfo, type RefundRequest } from '../../../order/services/refundService';
import { getApiErrorMessage } from '../../../../infrastructure/api/interceptors';
import { money } from './refundMeta';

/**
 * Người bán tự chuyển khoản hoàn cho khách khi cổng thanh toán không chi được, rồi xác
 * nhận bằng mã giao dịch ngân hàng. BE chỉ nhận xác nhận khi chắc cổng CHƯA chi, để khách
 * không nhận tiền hoàn hai lần.
 */
export function ManualRefundPanel({ item, onDone }: { item: RefundRequest; onDone: (message: string) => void }) {
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState<ManualRefundInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');

  const start = async () => {
    setOpen(true); setLoading(true); setError('');
    try { setInfo(await refundService.sellerManualInfo(item._id)); }
    catch (cause) { setError(getApiErrorMessage(cause, 'Không tải được thông tin chuyển khoản.')); }
    finally { setLoading(false); }
  };

  const settle = async () => {
    setSaving(true); setError('');
    try {
      await refundService.sellerManualSettle(item._id, reference.trim());
      onDone('Đã xác nhận hoàn tiền thủ công cho khách.');
    } catch (cause) {
      setError(getApiErrorMessage(cause, 'Chưa xác nhận được. Vui lòng thử lại.'));
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 p-4">
        <div className="min-w-0">
          <p className="m-0 text-[13.5px] font-semibold text-stone-900">Hoàn tiền thủ công</p>
          <p className="mb-0 mt-0.5 text-[12.5px] text-stone-500">Tự chuyển khoản cho khách rồi xác nhận bằng mã giao dịch.</p>
        </div>
        <Button icon={<Banknote size={15} />} onClick={() => void start()}>Hoàn thủ công</Button>
      </div>
    );
  }

  const dest = info?.destination;
  return (
    <section className="space-y-3 rounded-2xl border border-stone-200 p-4">
      <p className="m-0 text-[13.5px] font-semibold text-stone-900">Hoàn tiền thủ công</p>

      {loading && <div className="h-28 animate-pulse rounded-xl bg-stone-100 motion-reduce:animate-none" />}

      {info && (
        <>
          {dest ? (
            <Descriptions
              size="small"
              column={1}
              colon={false}
              styles={{ label: { width: 120, color: '#78716c' }, content: { color: '#1c1917', fontWeight: 500 } }}
              items={[
                { key: 'bank', label: 'Ngân hàng', children: dest.bankName ? `${dest.bankName} (BIN ${dest.bin})` : `BIN ${dest.bin}` },
                { key: 'acc', label: 'Số tài khoản', children: <Typography.Text copyable className="tabular-nums">{dest.accountNo}</Typography.Text> },
                ...(dest.accountName ? [{ key: 'name', label: 'Chủ tài khoản', children: dest.accountName }] : []),
                { key: 'amount', label: 'Số tiền', children: <Typography.Text copyable={{ text: String(info.amount) }} className="tabular-nums">{money(info.amount)}</Typography.Text> },
                { key: 'content', label: 'Nội dung', children: <Typography.Text copyable>{info.transferContent}</Typography.Text> },
              ]}
            />
          ) : (
            <Alert
              type="info"
              showIcon
              title="Chưa có tài khoản nhận của khách"
              description={`Cổng thanh toán không cung cấp tài khoản của khách. Nhắn khách để lấy số tài khoản, chuyển ${money(info.amount)} với nội dung "${info.transferContent}".`}
            />
          )}

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold text-stone-800">Mã giao dịch ngân hàng <span className="font-normal text-stone-500">(bắt buộc)</span></span>
            <Input
              value={reference}
              onChange={event => { setReference(event.target.value); if (error) setError(''); }}
              placeholder="Ví dụ FT26281177083040"
              maxLength={100}
            />
          </label>
        </>
      )}

      {error && <p role="alert" className="m-0 text-[13px] font-medium text-red-700">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button onClick={() => { setOpen(false); setError(''); }} disabled={saving}>Đóng</Button>
        <Popconfirm
          title="Xác nhận đã chuyển khoản?"
          description="Hệ thống kiểm tra với cổng thanh toán rồi ghi nhận đơn đã hoàn tiền. Không hoàn tác được."
          okText="Xác nhận"
          cancelText="Quay lại"
          disabled={!reference.trim() || !info}
          onConfirm={() => settle()}
        >
          <Button type="primary" loading={saving} disabled={!reference.trim() || !info}>Xác nhận đã hoàn</Button>
        </Popconfirm>
      </div>
    </section>
  );
}

export default ManualRefundPanel;
