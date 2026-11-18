import { useState } from 'react';
import { Checkbox, Input, Modal, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Note } from '../ui';
import { HealthTheme } from '../health/HealthTheme';
import { count, money } from '../../../../shared/utils/format';
import { NA } from '../../format';
import { filterProducts } from './productFilter';
import { ProductTitle, ShareCell, type Product } from './productCells';

const refundOf = (p: Product) => p.refund_vnd ?? 0;

function columns(total: number, rank: Map<Product, number>, hasRefund: boolean): ColumnsType<Product> {
  const all: ColumnsType<Product> = [
    { title: 'Sản phẩm', key: 'title', ellipsis: { showTitle: false }, render: (_, p) => <ProductTitle p={p} rank={rank.get(p) ?? 0} /> },
    { title: 'Đã bán', key: 'units', align: 'right', width: 100, sorter: (a, b) => a.units - b.units, render: (_, p) => <span className="tabular-nums">{count(p.units)}</span> },
    {
      title: 'Hoàn tiền', key: 'refund', align: 'right', width: 130, sorter: (a, b) => refundOf(a) - refundOf(b),
      render: (_, p) => refundOf(p) > 0 ? <span className="tabular-nums text-stone-700">{money(refundOf(p))}</span> : <span className="text-stone-400">{NA}</span>,
    },
    {
      title: 'Thực nhận', key: 'net', align: 'right', width: 140, sorter: (a, b) => a.net_vnd - b.net_vnd,
      render: (_, p) => <span className={`font-semibold tabular-nums ${p.net_vnd < 0 ? 'text-red-600' : 'text-stone-900'}`}>{money(p.net_vnd)}</span>,
    },
    { title: 'Tỷ trọng', key: 'share', width: 150, render: (_, p) => <ShareCell net={p.net_vnd} total={total} /> },
  ];
  return hasRefund ? all : all.filter(c => c.key !== 'refund');
}

export function MoneyProductsModal({ open, onClose, products, total, period }: {
  open: boolean;
  onClose: () => void;
  products: Product[];
  total: number;
  period: string;
}) {
  const [query, setQuery] = useState('');
  const [negativeOnly, setNegativeOnly] = useState(false);
  const [refundOnly, setRefundOnly] = useState(false);
  const hasNegative = products.some(p => p.net_vnd < 0);
  const hasRefund = products.some(p => refundOf(p) > 0);
  const rows = filterProducts(products, query, negativeOnly && hasNegative, refundOnly && hasRefund);
  const rank = new Map(products.map((p, i) => [p, i + 1]));
  const clear = () => { setQuery(''); setNegativeOnly(false); setRefundOnly(false); };

  return (
    <HealthTheme>
      <Modal title={`Tất cả sản phẩm theo thực nhận, ${period}`} open={open} onCancel={onClose} footer={null} width={hasRefund ? 900 : 800} destroyOnHidden afterClose={clear}>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <Input allowClear placeholder="Tìm theo tên sản phẩm" value={query} onChange={e => setQuery(e.target.value)} className="!max-w-[18rem]" />
          {hasNegative && (
            <Checkbox checked={negativeOnly} onChange={e => setNegativeOnly(e.target.checked)}>Chỉ xem sản phẩm bị âm</Checkbox>
          )}
          {hasRefund && (
            <Checkbox checked={refundOnly} onChange={e => setRefundOnly(e.target.checked)}>Chỉ xem sản phẩm có hoàn tiền</Checkbox>
          )}
        </div>
        <Table<Product>
          size="small"
          rowKey={p => `${p.product_id}-${rank.get(p)}`}
          columns={columns(total, rank, hasRefund)}
          dataSource={rows}
          scroll={{ x: hasRefund ? 760 : 640 }}
          pagination={{ pageSize: 20, showSizeChanger: false, hideOnSinglePage: true }}
          locale={{ emptyText: 'Không tìm thấy sản phẩm nào.' }}
        />
        {rows.length < products.length && <Note>Đang hiện {rows.length}/{products.length} sản phẩm.</Note>}
        {hasRefund && <Note>Hoàn từng món ghi đúng món đó; hoàn cả đơn thì chia theo giá từng món.</Note>}
      </Modal>
    </HealthTheme>
  );
}
