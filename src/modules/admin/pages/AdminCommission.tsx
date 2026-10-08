import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Flex,
  Form,
  InputNumber,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminService } from '../services/adminService';
import type { CommissionChange, CommissionOverview, CommissionRuleView } from '../types';
import { AdminAntd } from '../components/AdminAntd';
import { AdminCommissionRules, PRODUCT_TYPE_LABEL } from './AdminCommissionRules';
import { count, dateTime, money } from '../../../shared/utils/format';
import { pickCommissionRule, withCommission } from '../../../shared/utils/commission';

const { Title, Text, Paragraph } = Typography;

/** Hoa hồng tỉ lệ thuận với tiền người bán nhận, nên quy đổi được ở mọi mức mà không gọi API. */
const feeOn = (netTotal: number, percent: number) => Math.round((netTotal * percent) / 100);

/**
 * Các mức để admin so sánh khi chưa biết nên đặt bao nhiêu. Luôn chèn thêm mức đang áp dụng
 * và mức đang gõ, để hai mức đó nằm đúng vị trí trong thang chứ không tách thành bảng riêng.
 */
const LADDER_BASE = [1, 3, 5, 8, 10, 15];

function buildLadder(current: number, typed: number | null): number[] {
  const set = new Set<number>([...LADDER_BASE, current]);
  if (typed !== null) set.add(typed);
  return [...set].sort((a, b) => a - b);
}

const ACTION_LABEL: Record<CommissionChange['action'], string> = {
  'default': 'Đổi mức mặc định',
  'rule-add': 'Thêm luật',
  'rule-edit': 'Sửa luật',
  'rule-delete': 'Xoá luật',
};

/** Số tiền và phần trăm phải thẳng cột khi so sánh theo chiều dọc. */
const NUM: React.CSSProperties = { fontVariantNumeric: 'tabular-nums' };

/** Ghép mô tả một lần đổi thành câu đọc được, thay vì phơi id danh mục ra mặt. */
function describeChange(h: CommissionChange, categoryNameById: Map<string, string>) {
  const label = ACTION_LABEL[h.action] || h.action;
  if (h.action === 'default') return <Text strong>{label}</Text>;
  const scope = [
    h.categoryId ? categoryNameById.get(h.categoryId) || 'danh mục đã xoá' : 'mọi danh mục',
    h.productType ? PRODUCT_TYPE_LABEL[h.productType] || h.productType : 'mọi loại',
  ].join(' · ');
  return (
    <Space size={6} wrap>
      <Text strong>{label}</Text>
      <Text type="secondary">{scope}</Text>
    </Space>
  );
}

/**
 * Ô thử tra: admin chọn một phạm vi và thấy ngay mức nào sẽ áp, kèm LÝ DO.
 * Bảng luật cho biết có những luật gì; ô này trả lời "vậy sản phẩm của tôi chịu mức nào".
 */
function RuleTester({
  rules,
  categories,
  defaultPercent,
}: {
  rules: CommissionRuleView[];
  categories: { id: string; name: string; productCount: number }[];
  defaultPercent: number;
}) {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [productType, setProductType] = useState<string>('READY_TO_SHIP');
  const hit = pickCommissionRule(rules, categoryId, productType);
  const percent = hit?.percent ?? defaultPercent;

  return (
    <>
      <Text strong style={{ fontSize: 14 }}>
        Sản phẩm này chịu mức nào?
      </Text>

      <Form layout="vertical" size="middle" style={{ marginTop: 12 }}>
        <Form.Item label="Danh mục" style={{ marginBottom: 12 }}>
          <Select
            value={categoryId ?? undefined}
            onChange={v => setCategoryId(v ?? null)}
            placeholder="Chưa gắn danh mục"
            allowClear
            showSearch
            options={categories.map(c => ({ value: c.id, label: c.name }))}
          />
        </Form.Item>
        <Form.Item label="Loại sản phẩm" style={{ marginBottom: 0 }}>
          <Select
            value={productType}
            onChange={setProductType}
            options={Object.entries(PRODUCT_TYPE_LABEL).map(([value, label]) => ({ value, label }))}
          />
        </Form.Item>
      </Form>

      <Divider style={{ margin: '16px 0 12px' }} />

      <Flex align="baseline" gap={10}>
        <Statistic
          value={percent}
          suffix="%"
          styles={{ content: { color: '#1a6b1a', fontWeight: 800, letterSpacing: '-0.03em', ...NUM } }}
        />
        <Text type="secondary" style={{ fontSize: 12.5, lineHeight: 1.45 }}>
          {hit ? (
            <>
              theo luật{' '}
              <Text strong style={{ fontSize: 12.5 }}>
                {hit.categoryName || 'mọi danh mục'} ·{' '}
                {hit.productType ? PRODUCT_TYPE_LABEL[hit.productType] : 'mọi loại'}
              </Text>
            </>
          ) : (
            'không luật nào khớp, dùng mức mặc định'
          )}
        </Text>
      </Flex>

      <Text type="secondary" style={{ fontSize: 12.5 }}>
        Người bán nhập 100.000đ → niêm yết{' '}
        <Text strong style={{ fontSize: 12.5, ...NUM }}>
          {money(withCommission(100000, percent))}
        </Text>
      </Text>
    </>
  );
}

export function AdminCommission() {
  const [data, setData] = useState<CommissionOverview | null>(null);
  const [input, setInput] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  const load = (first = false) => {
    if (first) setLoading(true);
    return adminService
      .getCommission()
      .then(d => {
        setData(d);
        setInput(d.percent);
      })
      .catch(() => setError('Không tải được cấu hình hoa hồng. Tải lại trang để thử lại.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(true);
  }, []);

  const saved = data?.percent ?? null;
  const valid = input !== null && Number.isFinite(input) && input >= 0 && input <= 50;
  const changed = valid && input !== saved;

  const submit = async () => {
    if (!changed) return;
    setSaving(true);
    setError('');
    setDone('');
    try {
      const percent = await adminService.updateCommission(input!);
      await load();
      setDone(`Đã đổi mức mặc định sang ${percent}%.`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Lưu thất bại. Thử lại sau.');
    } finally {
      setSaving(false);
    }
  };

  const im = data?.impact;
  const feeNow = im ? feeOn(im.netTotal, saved ?? 0) : 0;
  const avgNet = im && im.paidOrderCount > 0 ? Math.round(im.netTotal / im.paidOrderCount) : 0;
  const ladder = buildLadder(saved ?? 0, changed ? input : null);
  const categoryNameById = new Map((data?.categories || []).map(c => [c.id, c.name]));

  const ladderColumns: ColumnsType<{ key: number; percent: number }> = [
    {
      title: 'Mức',
      dataIndex: 'percent',
      width: 190,
      render: (p: number) => {
        const isCurrent = p === saved;
        const isTyped = changed && p === input;
        return (
          <Space size={8}>
            <Text strong={isCurrent || isTyped} style={NUM}>
              {p}%
            </Text>
            {isCurrent && <Tag>đang áp dụng</Tag>}
            {isTyped && <Tag color="green">đang nhập</Tag>}
          </Space>
        );
      },
    },
    {
      title: `Sàn thu / ${im?.periodDays ?? 30} ngày`,
      key: 'fee',
      align: 'right',
      width: 170,
      render: (_, r) => {
        const emphasised = r.percent === saved || (changed && r.percent === input);
        return (
          <Text strong={emphasised} style={NUM}>
            {money(feeOn(im?.netTotal ?? 0, r.percent))}
          </Text>
        );
      },
    },
    {
      title: 'So với hiện tại',
      key: 'diff',
      align: 'right',
      width: 180,
      render: (_, r) => {
        const diff = feeOn(im?.netTotal ?? 0, r.percent) - feeNow;
        if (diff === 0) return <Text type="secondary">—</Text>;
        return (
          <Text strong style={{ color: diff > 0 ? '#145c14' : '#b91c1c', ...NUM }}>
            <Space size={4}>
              {diff > 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {diff > 0 ? '+' : ''}
              {money(diff)}
            </Space>
          </Text>
        );
      },
    },
    {
      title: 'Một đơn trung bình: người mua trả',
      key: 'gross',
      align: 'right',
      render: (_, r) => (
        <Text type="secondary" style={NUM}>
          {money(withCommission(avgNet, r.percent))}
        </Text>
      ),
    },
  ];

  const historyColumns: ColumnsType<CommissionChange & { key: string }> = [
    {
      title: 'Thời điểm',
      dataIndex: 'changedAt',
      width: 200,
      render: (v: string | null) => <Text type="secondary">{dateTime(v)}</Text>,
    },
    {
      title: 'Người đổi',
      dataIndex: 'changedByEmail',
      width: 270,
      render: (v: string | null) => <Text type="secondary">{v || '—'}</Text>,
    },
    {
      title: 'Việc đã làm',
      key: 'action',
      render: (_, h) => describeChange(h, categoryNameById),
    },
    {
      title: 'Mức',
      key: 'percent',
      align: 'right',
      width: 150,
      render: (_, h) => (
        <Space size={6} style={NUM}>
          <Text type="secondary">{h.previous === null ? '—' : `${h.previous}%`}</Text>
          <ArrowRight size={12} color="#64748b" />
          <Text strong delete={h.action === 'rule-delete'}>
            {h.percent}%
          </Text>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <AdminAntd>
        <Flex align="center" justify="center" style={{ padding: '96px 0' }}>
          <Spin size="large" />
        </Flex>
      </AdminAntd>
    );
  }

  return (
    <AdminAntd>
      <header style={{ marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.025em' }}>
          Cấu hình lợi nhuận
        </Title>
        <Paragraph type="secondary" style={{ margin: '6px 0 0', maxWidth: '68ch', fontSize: 13.5 }}>
          Người bán nhập giá họ muốn nhận; sàn cộng hoa hồng lên thành giá niêm yết người mua trả. Mức thu khác nhau
          theo danh mục và loại sản phẩm.
        </Paragraph>
        {im && (
          <Space separator={<Text type="secondary">·</Text>} wrap style={{ marginTop: 10 }}>
            <Text type="secondary" style={{ fontSize: 12.5 }}>
              <Text strong style={NUM}>
                {count(im.activeProducts)}
              </Text>{' '}
              sản phẩm đang bán
            </Text>
            <Text type="secondary" style={{ fontSize: 12.5 }}>
              <Text strong style={NUM}>
                {count(im.activeShops)}
              </Text>{' '}
              gian hàng
            </Text>
            <Text type="secondary" style={{ fontSize: 12.5 }}>
              <Text strong style={NUM}>
                {count(im.paidOrderCount)}/{count(im.orderCount)}
              </Text>{' '}
              đơn đã thanh toán · {im.periodDays} ngày
            </Text>
            <Text type="secondary" style={{ fontSize: 12.5 }}>
              <Text strong style={NUM}>
                {money(im.feeTotal)}
              </Text>{' '}
              hoa hồng đã ghi nhận
            </Text>
          </Space>
        )}
      </header>

      {error && (
        <Alert
          type="error"
          showIcon
          closable={{ onClose: () => setError('') }}
          title={error}
          style={{ marginBottom: 16 }}
        />
      )}
      {done && (
        <Alert
          type="success"
          showIcon
          closable={{ onClose: () => setDone('') }}
          title={done}
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[20, 20]} align="top">
        <Col xs={24} xl={17}>
          <Card title="Luật hoa hồng" styles={{ body: { padding: 0 } }} style={{ marginBottom: 20 }}>
            <Paragraph type="secondary" style={{ margin: 0, padding: '14px 16px 0', fontSize: 12.5 }}>
              Luật cụ thể hơn thắng — đọc từ trên xuống, dừng ở dòng đầu tiên khớp. Dòng cuối là mức áp khi mọi luật
              trên đều trượt.
            </Paragraph>
            <AdminCommissionRules
              rules={data!.rules}
              categories={data!.categories}
              defaultPercent={saved ?? 0}
              defaultProductCount={data!.defaultProductCount}
              onSave={async rule => {
                setError('');
                try {
                  await adminService.saveCommissionRule(rule);
                  await load();
                  setDone('Đã lưu luật hoa hồng.');
                } catch (err: any) {
                  setError(err.response?.data?.error || 'Lưu luật thất bại.');
                  throw err;
                }
              }}
              onDelete={async id => {
                setError('');
                try {
                  await adminService.deleteCommissionRule(id);
                  await load();
                  setDone('Đã xoá luật.');
                } catch (err: any) {
                  setError(err.response?.data?.error || 'Xoá luật thất bại.');
                }
              }}
            />
          </Card>

          {/* Hai khối tham chiếu gộp vào tab: bớt sprawl dọc, bớt mảng trống dưới trang. */}
          <Card styles={{ body: { paddingTop: 4 } }}>
            <Tabs
              defaultActiveKey="ladder"
              items={[
                {
                  key: 'ladder',
                  label: 'Thang mức mặc định',
                  children:
                    im && im.paidOrderCount > 0 ? (
                      <>
                        <Paragraph type="secondary" style={{ fontSize: 12.5, maxWidth: '84ch' }}>
                          Chiếu từng mức lên {count(im.paidOrderCount)} đơn đã thanh toán của {im.periodDays} ngày qua
                          (tiền người bán nhận {money(im.netTotal)}). Giả định lượng đơn không đổi — nâng hoa hồng làm
                          giá niêm yết tăng theo, nên lượng mua thực tế có thể giảm.
                        </Paragraph>
                        <Table
                          columns={ladderColumns}
                          dataSource={ladder.map(p => ({ key: p, percent: p }))}
                          pagination={false}
                          size="middle"
                        />
                        <Paragraph type="secondary" style={{ fontSize: 12.5, margin: '14px 0 0', maxWidth: '84ch' }}>
                          Đổi mức chỉ áp cho sản phẩm được tạo hoặc sửa giá từ lúc này và đơn phát sinh sau đó. Sản
                          phẩm đang bán giữ nguyên giá niêm yết cho tới khi người bán lưu lại giá.{' '}
                          <Link to="/admin/revenue">Xem thu nhập thực tế</Link>
                        </Paragraph>
                      </>
                    ) : (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={`Chưa có đơn nào được thanh toán trong ${im?.periodDays ?? 30} ngày qua nên chưa chiếu được số tiền.`}
                      />
                    ),
                },
                {
                  key: 'history',
                  label: `Lịch sử thay đổi${data!.history.length ? ` (${data!.history.length})` : ''}`,
                  children:
                    data!.history.length > 0 ? (
                      <Table
                        columns={historyColumns}
                        dataSource={data!.history.map((h, i) => ({ ...h, key: `${h.changedAt ?? ''}-${i}` }))}
                        pagination={false}
                        size="middle"
                      />
                    ) : (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={`Chưa có thay đổi nào. Sàn đang chạy ở mức mặc định ${saved}%; mỗi lần đổi sẽ được ghi lại ở đây kèm người thực hiện.`}
                      />
                    ),
                },
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} xl={7}>
          {/* Cột phải bám theo bảng khi cuộn: vừa sửa luật vừa thử lại ngay. */}
          <div style={{ position: 'sticky', top: 20 }}>
            <Card style={{ background: '#f8fafb' }}>
              <RuleTester rules={data!.rules} categories={data!.categories} defaultPercent={saved ?? 0} />

              <Divider style={{ margin: '18px 0 14px' }} />

              <Text strong style={{ fontSize: 14 }}>
                Mức mặc định
              </Text>
              {data?.updatedAt && (
                <Paragraph type="secondary" style={{ margin: '4px 0 10px', fontSize: 12.5 }}>
                  Đổi lần cuối {dateTime(data.updatedAt)}.
                </Paragraph>
              )}
              <Space.Compact style={{ width: '100%', marginTop: data?.updatedAt ? 0 : 10 }}>
                <InputNumber
                  value={input}
                  onChange={setInput}
                  min={0}
                  max={50}
                  step={0.5}
                  suffix="%"
                  style={{ width: '100%', fontWeight: 700 }}
                  aria-label="Phần trăm hoa hồng mặc định"
                  onPressEnter={submit}
                />
                <Button type="primary" onClick={submit} disabled={!changed} loading={saving}>
                  Lưu
                </Button>
              </Space.Compact>
              <Paragraph type="secondary" style={{ margin: '8px 0 0', fontSize: 12 }}>
                {!valid && input !== null ? (
                  <Text type="danger" style={{ fontSize: 12 }}>
                    Giá trị phải là số trong khoảng 0–50.
                  </Text>
                ) : (
                  <>
                    Áp cho{' '}
                    <Text strong style={{ fontSize: 12 }}>
                      {count(data!.defaultProductCount)} sản phẩm
                    </Text>{' '}
                    không khớp luật nào.
                  </>
                )}
              </Paragraph>
            </Card>
          </div>
        </Col>
      </Row>
    </AdminAntd>
  );
}

export default AdminCommission;
