import { useState } from 'react';
import { Button, Empty, Flex, InputNumber, Popconfirm, Select, Space, Table, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { CommissionRuleView } from '../types';

const { Text } = Typography;

export const PRODUCT_TYPE_LABEL: Record<string, string> = {
  READY_TO_SHIP: 'Hàng có sẵn',
  POD_TEMPLATE: 'In theo yêu cầu (POD)',
  CUSTOM_DESIGN_REQUEST: 'Đặt thiết kế riêng',
};

/** Dòng mặc định không phải một luật — nó là đáy của thang, luôn nằm cuối bảng. */
const DEFAULT_ROW_KEY = '__default__';
/** Dòng đang soạn khi thêm luật mới. */
const DRAFT_ROW_KEY = '__draft__';

const vi = (n: number) => n.toLocaleString('vi-VN');

interface Row {
  key: string;
  id: string | null;
  categoryId: string | null;
  categoryName: string | null;
  productType: string | null;
  percent: number;
  productCount: number;
}

interface Draft {
  id?: string;
  categoryId: string | null;
  productType: string | null;
  percent: number | null;
}

/**
 * Bảng luật hoa hồng. Luật cụ thể hơn nằm trên, đúng thứ tự hệ thống tra, để admin đọc từ
 * trên xuống là ra kết quả — không phải tự suy luận độ ưu tiên trong đầu.
 */
export function AdminCommissionRules({
  rules,
  categories,
  defaultPercent,
  defaultProductCount,
  onSave,
  onDelete,
}: {
  rules: CommissionRuleView[];
  categories: { id: string; name: string; productCount: number }[];
  defaultPercent: number;
  defaultProductCount: number;
  onSave: (rule: {
    id?: string;
    categoryId: string | null;
    productType: string | null;
    percent: number;
  }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const editingKey = draft ? draft.id ?? DRAFT_ROW_KEY : null;
  const valid =
    draft !== null &&
    draft.percent !== null &&
    draft.percent >= 0 &&
    draft.percent <= 50 &&
    // Luật không ràng buộc chiều nào chính là mức mặc định — không cho tạo trùng khái niệm.
    Boolean(draft.categoryId || draft.productType);

  const submit = async () => {
    if (!draft || !valid) return;
    setSaving(true);
    try {
      await onSave({
        id: draft.id,
        categoryId: draft.categoryId,
        productType: draft.productType,
        percent: draft.percent!,
      });
      setDraft(null);
    } catch {
      /* lỗi đã hiện ở banner phía trên; giữ nguyên dòng đang soạn để admin sửa lại */
    } finally {
      setSaving(false);
    }
  };

  const rows: Row[] = rules.map(r => ({
    key: r.id,
    id: r.id,
    categoryId: r.categoryId,
    categoryName: r.categoryName,
    productType: r.productType,
    percent: r.percent,
    productCount: r.productCount,
  }));

  if (draft && !draft.id) {
    rows.push({
      key: DRAFT_ROW_KEY,
      id: null,
      categoryId: draft.categoryId,
      categoryName: null,
      productType: draft.productType,
      percent: draft.percent ?? 0,
      productCount: 0,
    });
  }

  rows.push({
    key: DEFAULT_ROW_KEY,
    id: null,
    categoryId: null,
    categoryName: null,
    productType: null,
    percent: defaultPercent,
    productCount: defaultProductCount,
  });

  const isEditing = (row: Row) => editingKey !== null && (row.id ?? row.key) === editingKey;

  const columns: ColumnsType<Row> = [
    {
      title: 'Danh mục',
      dataIndex: 'categoryName',
      render: (_, row) =>
        isEditing(row) ? (
          <Select
            value={draft!.categoryId ?? undefined}
            onChange={v => setDraft({ ...draft!, categoryId: v ?? null })}
            placeholder="Mọi danh mục"
            allowClear
            showSearch
            filterOption={(input, option) => String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            style={{ width: '100%', minWidth: 180 }}
            options={categories.map(c => ({ value: c.id, label: `${c.name} (${c.productCount})` }))}
          />
        ) : row.categoryName ? (
          <Text strong>{row.categoryName}</Text>
        ) : (
          <Text type="secondary">Mọi danh mục</Text>
        ),
    },
    {
      title: 'Loại sản phẩm',
      dataIndex: 'productType',
      width: 240,
      render: (_, row) =>
        isEditing(row) ? (
          <Select
            value={draft!.productType ?? undefined}
            onChange={v => setDraft({ ...draft!, productType: v ?? null })}
            placeholder="Mọi loại"
            allowClear
            style={{ width: '100%' }}
            options={Object.entries(PRODUCT_TYPE_LABEL).map(([value, label]) => ({ value, label }))}
          />
        ) : row.productType ? (
          <Text strong>{PRODUCT_TYPE_LABEL[row.productType] || row.productType}</Text>
        ) : (
          <Text type="secondary">Mọi loại</Text>
        ),
    },
    {
      title: 'Mức',
      dataIndex: 'percent',
      align: 'right',
      width: 150,
      render: (_, row) =>
        isEditing(row) ? (
          <InputNumber
            value={draft!.percent}
            onChange={v => setDraft({ ...draft!, percent: v })}
            min={0}
            max={50}
            step={0.5}
            suffix="%"
            style={{ width: '100%' }}
            autoFocus
            aria-label="Phần trăm hoa hồng"
          />
        ) : (
          <Text
            strong
            style={{
              fontSize: 16,
              fontVariantNumeric: 'tabular-nums',
              color: row.key === DEFAULT_ROW_KEY ? '#16211a' : '#1a6b1a',
            }}
          >
            {row.percent}%
          </Text>
        ),
    },
    {
      title: 'Sản phẩm đang áp',
      dataIndex: 'productCount',
      align: 'right',
      width: 170,
      render: (value: number, row) =>
        row.key === DRAFT_ROW_KEY ? (
          <Text type="secondary">—</Text>
        ) : (
          <Text type="secondary" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {vi(value)}
          </Text>
        ),
    },
    {
      title: '',
      key: 'actions',
      align: 'right',
      width: 120,
      render: (_, row) => {
        if (isEditing(row)) {
          return (
            <Space size={4}>
              <Tooltip title={valid ? 'Lưu luật' : 'Chọn danh mục hoặc loại sản phẩm, nhập mức 0–50'}>
                <Button
                  type="primary"
                  size="small"
                  icon={<Check size={14} />}
                  disabled={!valid}
                  loading={saving}
                  onClick={submit}
                  aria-label="Lưu luật"
                />
              </Tooltip>
              <Button size="small" icon={<X size={14} />} onClick={() => setDraft(null)} aria-label="Huỷ" />
            </Space>
          );
        }
        if (row.key === DEFAULT_ROW_KEY) return <Tag>mặc định</Tag>;
        return (
          <Space size={4}>
            <Button
              size="small"
              icon={<Pencil size={14} />}
              disabled={Boolean(draft)}
              aria-label={`Sửa luật ${row.categoryName || 'mọi danh mục'}`}
              onClick={() =>
                setDraft({
                  id: row.id!,
                  categoryId: row.categoryId,
                  productType: row.productType,
                  percent: row.percent,
                })
              }
            />
            <Popconfirm
              title="Xoá luật này?"
              description={
                <span style={{ display: 'inline-block', maxWidth: 320, whiteSpace: 'normal' }}>
                  {vi(row.productCount)} sản phẩm đang áp mức {row.percent}% sẽ chuyển về luật kém cụ thể hơn, hoặc về
                  mức mặc định {defaultPercent}%. Giá đã niêm yết không đổi cho tới khi người bán lưu lại giá.
                </span>
              }
              okText="Xoá luật"
              cancelText="Huỷ"
              okButtonProps={{ danger: true }}
              onConfirm={() => onDelete(row.id!)}
            >
              <Button
                size="small"
                danger
                icon={<Trash2 size={14} />}
                disabled={Boolean(draft)}
                aria-label={`Xoá luật ${row.categoryName || 'mọi danh mục'}`}
              />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <Table<Row>
        columns={columns}
        dataSource={rows}
        pagination={false}
        size="middle"
        rowKey="key"
        // Dòng mặc định tô nhạt để đọc như đáy của thang, không phải một luật ngang hàng.
        rowClassName={row => (row.key === DEFAULT_ROW_KEY ? 'bg-admin-canvas/70' : '')}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={`Chưa có luật riêng — cả ${vi(defaultProductCount)} sản phẩm chịu chung mức ${defaultPercent}%.`}
            />
          ),
        }}
      />

      <Flex align="center" gap={12} wrap style={{ padding: '12px 16px', borderTop: '1px solid #e8ede8' }}>
        <Button
          icon={<Plus size={14} />}
          disabled={Boolean(draft)}
          onClick={() => setDraft({ categoryId: null, productType: null, percent: null })}
        >
          Thêm luật
        </Button>
        {rules.length === 0 && !draft && (
          <Text type="secondary" style={{ fontSize: 12.5 }}>
            Chưa có luật riêng — cả {vi(defaultProductCount)} sản phẩm đang chịu chung mức {defaultPercent}%.
          </Text>
        )}
        {draft && !valid && (
          <Text type="danger" style={{ fontSize: 12.5 }}>
            Chọn danh mục hoặc loại sản phẩm, và nhập mức trong khoảng 0–50.
          </Text>
        )}
      </Flex>
    </>
  );
}

export default AdminCommissionRules;
