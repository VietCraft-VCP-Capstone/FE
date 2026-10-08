import { useEffect, useState } from 'react';
import { Alert, Button, Descriptions, Drawer, Image, Input, Popconfirm, Tag } from 'antd';
import { CheckCircle2, ExternalLink, Printer, RotateCcw, XCircle } from 'lucide-react';

import { refundService, type RefundRequest } from '../../../order/services/refundService';
import { getApiErrorMessage } from '../../../../infrastructure/api/interceptors';
import {
  EXECUTION_LABEL,
  ORDER_STATUS_LABEL,
  REASON_LABEL,
  STATUS_COLOR,
  STATUS_LABEL,
  buyerOf,
  dateTimeText,
  deadlineOf,
  executionOf,
  isVideoUrl,
  orderOf,
  refundAmountText,
} from './refundMeta';

const SECTION = 'mb-2 text-[12.5px] font-semibold text-stone-500';

/**
 * Ngăn chi tiết một yêu cầu hoàn tiền, mở từ bảng. Người bán đọc đủ bằng chứng và quyết
 * định ngay tại đây; duyệt xong hệ thống tự chuyển tiền hoàn qua cổng thanh toán của đơn.
 */
export function SellerRefundRequestDrawer({
  item,
  open,
  onClose,
  onUpdated,
}: {
  item: RefundRequest | null;
  open: boolean;
  onClose: () => void;
  onUpdated: (message: string) => void;
}) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<'APPROVE' | 'REJECT' | 'RETRY' | null>(null);
  const [error, setError] = useState('');

  // Mỗi yêu cầu một ghi chú riêng: đổi yêu cầu thì xoá nháp và lỗi cũ.
  useEffect(() => { setNote(''); setError(''); }, [item?._id]);

  if (!item) return <Drawer open={false} onClose={onClose} />;

  const order = orderOf(item);
  const buyer = buyerOf(item);
  const pod = item.product_type === 'POD';
  const execution = executionOf(item);
  const { date: deadline, overdue } = deadlineOf(item);
  const canDecide = !pod && item.status === 'PENDING_SELLER';
  const images = (item.evidence || []).filter(url => !isVideoUrl(url));
  const videos = (item.evidence || []).filter(isVideoUrl);

  const decide = async (decision: 'APPROVE' | 'REJECT') => {
    if (!note.trim()) { setError('Nhập ghi chú để người mua hiểu quyết định của bạn.'); return; }
    setBusy(decision); setError('');
    try {
      await refundService.sellerDecision(item._id, decision, note.trim());
      onUpdated(decision === 'APPROVE' ? 'Đã duyệt yêu cầu, hệ thống đang hoàn tiền cho khách.' : 'Đã từ chối yêu cầu hoàn tiền.');
    } catch (cause) {
      setError(getApiErrorMessage(cause, 'Không cập nhật được yêu cầu. Vui lòng thử lại.'));
    } finally {
      setBusy(null);
    }
  };

  const retry = async () => {
    setBusy('RETRY'); setError('');
    try {
      await refundService.sellerRetryExecution(item._id);
      onUpdated('Đã chạy lại việc hoàn tiền.');
    } catch (cause) {
      setError(getApiErrorMessage(cause, 'Chưa chạy lại được việc hoàn tiền. Vui lòng thử lại.'));
    } finally {
      setBusy(null);
    }
  };

  const responses = [
    item.seller_response && { who: 'Bạn', ...item.seller_response },
    item.printer_response && { who: 'Xưởng in', ...item.printer_response },
    item.admin_decision && { who: 'Admin', decision: item.admin_decision.decision, note: item.admin_decision.note, responded_at: '' },
  ].filter(Boolean) as { who: string; decision: 'APPROVE' | 'REJECT'; note?: string; responded_at?: string }[];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="right"
      size={520}
      destroyOnHidden
      title={
        <div className="min-w-0">
          <div className="text-[15px] font-bold text-stone-900">Đơn #{order?.order_code || String(item.order_id).slice(-10)}</div>
          <div className="mt-0.5 text-[12.5px] font-normal text-stone-500">Yêu cầu hoàn tiền, gửi {dateTimeText(item.created_at)}</div>
        </div>
      }
      extra={
        <div className="flex flex-col items-end gap-1">
          <Tag color={STATUS_COLOR[item.status] || 'default'} className="m-0">{STATUS_LABEL[item.status] || item.status}</Tag>
          {execution && <Tag color={execution === 'PROCESSING' ? 'processing' : 'red'} className="m-0">{EXECUTION_LABEL[execution]}</Tag>}
        </div>
      }
      footer={canDecide ? (
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold text-stone-800">Ghi chú gửi khách <span className="font-normal text-stone-500">(bắt buộc)</span></span>
            <Input.TextArea
              value={note}
              onChange={event => { setNote(event.target.value); if (error) setError(''); }}
              maxLength={1000}
              autoSize={{ minRows: 2, maxRows: 4 }}
              placeholder="Giải thích ngắn gọn quyết định cho khách"
              status={error && !note.trim() ? 'error' : undefined}
            />
          </label>
          {error && <p role="alert" className="m-0 text-[13px] font-medium text-red-700">{error}</p>}
          <div className="flex items-center justify-end gap-2">
            <Popconfirm
              title="Từ chối yêu cầu này?"
              description="Khách có thể mở tranh chấp với quản trị viên."
              okText="Từ chối"
              cancelText="Quay lại"
              okButtonProps={{ danger: true }}
              disabled={!note.trim()}
              onConfirm={() => decide('REJECT')}
            >
              <Button danger icon={<XCircle size={15} />} loading={busy === 'REJECT'} disabled={busy !== null} onClick={() => { if (!note.trim()) void decide('REJECT'); }}>
                Từ chối
              </Button>
            </Popconfirm>
            <Popconfirm
              title="Duyệt và hoàn tiền?"
              description={item.refund_type === 'FULL'
                ? 'Hệ thống sẽ hoàn toàn bộ tiền đơn về tài khoản khách đã dùng để thanh toán.'
                : `Hệ thống sẽ hoàn ${refundAmountText(item)} về tài khoản khách đã dùng để thanh toán.`}
              okText="Duyệt và hoàn tiền"
              cancelText="Quay lại"
              disabled={!note.trim()}
              onConfirm={() => decide('APPROVE')}
            >
              <Button type="primary" icon={<CheckCircle2 size={15} />} loading={busy === 'APPROVE'} disabled={busy !== null} onClick={() => { if (!note.trim()) void decide('APPROVE'); }}>
                Duyệt và hoàn tiền
              </Button>
            </Popconfirm>
          </div>
        </div>
      ) : null}
    >
      <div className="space-y-6">
        {execution === 'FAILED' || execution === 'NOT_STARTED' ? (
          <Alert
            type="warning"
            showIcon
            title="Chưa chuyển được tiền hoàn cho khách"
            description={item.execution_error || 'Lần chuyển tiền gần nhất chưa chạy được.'}
            action={
              <Button size="small" icon={<RotateCcw size={13} />} loading={busy === 'RETRY'} onClick={() => void retry()}>
                Thử lại
              </Button>
            }
          />
        ) : execution === 'PROCESSING' ? (
          <Alert type="info" showIcon title="Đang chuyển tiền hoàn cho khách" description="Kết quả sẽ cập nhật khi cổng thanh toán xác nhận." />
        ) : item.status === 'REFUNDED' || item.execution_status === 'SUCCEEDED' ? (
          <Alert type="success" showIcon title="Đã hoàn tiền cho khách" />
        ) : null}
        {!canDecide && error && <p role="alert" className="m-0 text-[13px] font-medium text-red-700">{error}</p>}

        {pod && (
          <Alert
            type="info"
            showIcon
            icon={<Printer size={16} />}
            title="Yêu cầu POD do xưởng in xử lý"
            description="Bạn theo dõi trạng thái và phản hồi của xưởng in tại đây."
          />
        )}

        <section>
          <p className={SECTION}>Lý do của khách</p>
          <p className="m-0 text-[14px] font-semibold text-stone-900">{REASON_LABEL[item.reason_category] || item.reason_category}</p>
          <p className="mb-0 mt-1 whitespace-pre-wrap text-[13.5px] leading-relaxed text-stone-700">{item.description}</p>
        </section>

        <Descriptions
          size="small"
          column={1}
          colon={false}
          styles={{ label: { width: 140, color: '#78716c' }, content: { color: '#1c1917', fontWeight: 500 } }}
          items={[
            { key: 'buyer', label: 'Khách hàng', children: buyer ? `${buyer.full_name || buyer.name || 'Người mua'}${buyer.email ? ` (${buyer.email})` : ''}` : 'Người mua' },
            { key: 'type', label: 'Loại sản phẩm', children: pod ? 'Sản phẩm POD' : 'Sản phẩm thường' },
            { key: 'amount', label: 'Mức hoàn đề nghị', children: refundAmountText(item) },
            { key: 'order', label: 'Trạng thái đơn', children: ORDER_STATUS_LABEL[order?.order_status] || order?.order_status || 'Không rõ' },
            {
              key: 'deadline',
              label: 'Hạn phản hồi',
              children: <span className={overdue ? 'font-semibold text-red-700' : undefined}>{dateTimeText(deadline)}{overdue ? ', đã quá hạn' : ''}</span>,
            },
          ]}
        />

        <section>
          <p className={SECTION}>Bằng chứng ({item.evidence?.length || 0})</p>
          {images.length > 0 && (
            <Image.PreviewGroup>
              <div className="flex flex-wrap gap-2">
                {images.map((url, index) => (
                  <Image
                    key={url}
                    src={url}
                    alt={`Bằng chứng ${index + 1}`}
                    width={96}
                    height={96}
                    className="rounded-lg object-cover"
                    style={{ objectFit: 'cover', borderRadius: 8, border: '1px solid #e7e5e4' }}
                  />
                ))}
              </div>
            </Image.PreviewGroup>
          )}
          {videos.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {videos.map((url, index) => (
                <a key={url} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-[12.5px] font-semibold text-[#007700] hover:bg-stone-50">
                  Video {index + 1} <ExternalLink size={13} aria-hidden />
                </a>
              ))}
            </div>
          )}
          {!item.evidence?.length && <p className="m-0 text-[13px] text-stone-500">Khách chưa gửi bằng chứng.</p>}
        </section>

        {(responses.length > 0 || item.dispute) && (
          <section>
            <p className={SECTION}>Phản hồi</p>
            <ul className="m-0 list-none space-y-3 p-0">
              {responses.map(r => (
                <li key={r.who} className="text-[13.5px]">
                  <span className="font-semibold text-stone-900">{r.who}</span>{' '}
                  <span className={r.decision === 'REJECT' ? 'text-red-700' : 'text-[#007700]'}>{r.decision === 'REJECT' ? 'từ chối' : 'chấp thuận'}</span>
                  {r.responded_at && <span className="text-stone-500">, {dateTimeText(r.responded_at)}</span>}
                  {r.note && <p className="mb-0 mt-0.5 text-stone-700">{r.note}</p>}
                </li>
              ))}
              {item.dispute && (
                <li className="text-[13.5px]">
                  <span className="font-semibold text-stone-900">Tranh chấp</span>
                  <span className="text-stone-500">, {dateTimeText(item.dispute.opened_at)}</span>
                  <p className="mb-0 mt-0.5 text-stone-700">{item.dispute.reason}</p>
                </li>
              )}
            </ul>
          </section>
        )}
      </div>
    </Drawer>
  );
}

export default SellerRefundRequestDrawer;
