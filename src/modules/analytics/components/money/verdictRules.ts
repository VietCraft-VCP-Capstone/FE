import { money } from '../../../../shared/utils/format';
import type { AdviceKey, MoneyReport } from '../../moneyTypes';
import { sharePct } from './moneyParts';
import { POD_TIP } from './Term';

export type VerdictTone = 'good' | 'warn' | 'bad' | 'neutral';
export interface Verdict { topic: string; tone: VerdictTone; title: string; detail: string; hint?: string }

const times = (r: number) => r.toLocaleString('vi-VN', { maximumFractionDigits: 1 });

function costVerdict({ flow }: MoneyReport): Verdict {
  const paid = flow.buyer_paid_vnd;
  if (paid <= 0) return { topic: 'Chi phí', tone: 'neutral', title: 'Chưa có đơn trong khoảng này', detail: 'Chọn khoảng thời gian dài hơn để xem.' };
  const lost = paid - flow.net_vnd;
  const pct = (lost / paid) * 100;
  // shortcut: ngưỡng 10% / 20% đặt cố định, đổi khi có số trung bình của sàn
  const tone: VerdictTone = pct <= 10 ? 'good' : pct <= 20 ? 'warn' : 'bad';
  const head = tone === 'good' ? 'Chi phí thấp' : tone === 'warn' ? 'Chi phí cần chú ý' : 'Chi phí cao';
  const items: [string, number][] = [['phí sàn', flow.platform_fee_vnd], ['voucher của shop', flow.shop_voucher_vnd], ['hoàn tiền', flow.refund_vnd]];
  const [name, value] = items.reduce((a, b) => (b[1] > a[1] ? b : a));
  return {
    topic: 'Chi phí',
    tone,
    title: `${head}: mất ${sharePct(lost, paid)} tiền hàng`,
    detail: value > 0 ? `Khoản lớn nhất là ${name}, chiếm ${sharePct(value, lost)} số tiền bị trừ.` : 'Không có khoản nào bị trừ.',
  };
}

function voucherVerdict({ vouchers, voucher_compare: c }: MoneyReport): Verdict {
  const topic = 'Voucher';
  if (!c) {
    return vouchers.length === 0
      ? { topic, tone: 'neutral', title: 'Chưa có đơn dùng voucher', detail: 'Chưa thể đánh giá hiệu quả voucher.' }
      : { topic, tone: 'neutral', title: 'Chưa đủ đơn để đánh giá', detail: 'Cần tối thiểu 10 đơn có và 10 đơn không có voucher.' };
  }
  const ratio = c.without_avg_vnd > 0 ? c.with_avg_vnd / c.without_avg_vnd : Infinity;
  if (ratio >= 1.1) {
    const head = Number.isFinite(ratio) ? `gấp ${times(ratio)} lần` : 'cao hơn';
    return { topic, tone: 'good', title: `Hiệu quả: đơn có voucher thực nhận ${head}`, detail: 'Nên tiếp tục chạy voucher.' };
  }
  if (ratio <= 0.9) return { topic, tone: 'bad', title: 'Chưa hiệu quả: đơn có voucher thực nhận ít hơn', detail: 'Nên giảm mức giảm giá hoặc tạm dừng voucher.' };
  return { topic, tone: 'neutral', title: 'Voucher chưa tạo khác biệt', detail: 'Thử đổi điều kiện đơn tối thiểu để voucher kéo đơn lớn hơn.' };
}

function productVerdict({ by_product, flow }: MoneyReport): Verdict {
  const topic = 'Sản phẩm chủ lực';
  const top = by_product[0];
  if (!top || flow.net_vnd <= 0) return { topic, tone: 'neutral', title: 'Chưa có sản phẩm bán được', detail: 'Chưa có dữ liệu trong khoảng này.' };
  const heavy = top.net_vnd / flow.net_vnd >= 0.5;
  return {
    topic,
    tone: heavy ? 'warn' : 'good',
    title: top.title || 'Sản phẩm không tên',
    detail: heavy
      ? 'Chiếm hơn nửa thực nhận: nên đẩy thêm sản phẩm khác để bớt phụ thuộc.'
      : 'Thực nhận chia khá đều, shop không phụ thuộc vào một sản phẩm.',
  };
}

function podVerdict({ pod }: MoneyReport): Verdict | null {
  if (!pod) return null;
  const topic = 'Hàng POD';
  const hint = POD_TIP;
  const detail = `Đã trừ giá phôi ${money(pod.blank_cost_vnd)}.`;
  if (pod.profit_vnd <= 0) return { topic, hint, tone: 'bad', title: `Đang lỗ ${money(-pod.profit_vnd)}`, detail };
  const margin = pod.net_vnd > 0 ? (pod.profit_vnd / pod.net_vnd) * 100 : 0;
  // shortcut: ngưỡng lãi 20% đặt cố định, đổi khi có số trung bình của sàn
  const tone: VerdictTone = margin >= 20 ? 'good' : 'warn';
  return { topic, hint, tone, title: `${tone === 'good' ? 'Có lãi' : 'Lãi mỏng'}: ${money(pod.profit_vnd)} (${sharePct(pod.profit_vnd, pod.net_vnd)})`, detail };
}

export type KeyedVerdict = Verdict & { key: AdviceKey };

export const moneyVerdicts = (d: MoneyReport): KeyedVerdict[] => {
  const all: [AdviceKey, Verdict | null][] = [['cost', costVerdict(d)], ['voucher', voucherVerdict(d)], ['product', productVerdict(d)], ['pod', podVerdict(d)]];
  return all.flatMap(([key, v]) => (v ? [{ ...v, key }] : []));
};

