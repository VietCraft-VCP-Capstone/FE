import { ProductFormData } from '../../types/product';
import { commissionAmount, withCommission } from '../../../../shared/utils/commission';
import { money } from '../../../../shared/utils/format';
import { Field, inputClass, LABEL } from './formUi';

interface ProductFormPricingProps {
  formData: ProductFormData;
  errors: Record<string, string>;
  commissionPercent: number | null;
  onPatch: (patch: Partial<ProductFormData>) => void;
}

const STATUSES: { value: ProductFormData['status']; label: string }[] = [
  { value: 'ACTIVE', label: 'Đang bán' },
  { value: 'INACTIVE', label: 'Tạm dừng' },
  { value: 'OUT_OF_STOCK', label: 'Hết hàng' },
];

function PriceBreakdown({ price, percent }: { price: number; percent: number | null }) {
  if (percent === null) {
    return <p className="m-0 text-xs text-stone-500">Chưa tải được % hoa hồng sàn nên chưa tính được giá niêm yết.</p>;
  }
  const row = 'flex items-baseline justify-between gap-4';
  return (
    <dl className="m-0 space-y-2 text-sm tabular-nums">
      <div className={row}>
        <dt className="text-stone-600">Bạn nhận</dt>
        <dd className="m-0 font-medium text-stone-900">{money(price)}</dd>
      </div>
      <div className={row}>
        <dt className="text-stone-600">Hoa hồng sàn {percent}%</dt>
        <dd className="m-0 font-medium text-stone-900">+{money(commissionAmount(price, percent))}</dd>
      </div>
      <div className={`${row} border-t border-stone-300 pt-2`}>
        <dt className="font-semibold text-stone-900">Người mua trả</dt>
        <dd className="m-0 text-base font-bold text-[#007700]">{money(withCommission(price, percent))}</dd>
      </div>
    </dl>
  );
}

export function ProductFormPricing({ formData, errors, commissionPercent, onPatch }: ProductFormPricingProps) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <div className="space-y-4">
        <Field label="Giá bán (VNĐ)" required error={errors.price} hint="Nhập số tiền bạn muốn nhận về cho mỗi sản phẩm." focusTarget="price">
          <input
            type="number"
            min="0"
            step="any"
            inputMode="numeric"
            placeholder="VD: 150000"
            value={formData.price || ''}
            onChange={(e) => onPatch({ price: Number(e.target.value) })}
            className={inputClass(errors.price, 'font-semibold tabular-nums')}
          />
        </Field>
        <Field label="Số lượng tồn kho" required error={errors.stock} focusTarget="stock">
          <input
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="VD: 50"
            value={formData.stock !== undefined ? formData.stock : ''}
            onChange={(e) => onPatch({ stock: Number(e.target.value) })}
            className={inputClass(errors.stock, 'tabular-nums')}
          />
        </Field>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-stone-200 bg-stone-50 p-4" aria-live="polite">
          <PriceBreakdown price={formData.price || 0} percent={commissionPercent} />
        </div>
        <div className="space-y-1.5">
          <span id="pf-status-label" className={LABEL}>Trạng thái</span>
          <div role="radiogroup" aria-labelledby="pf-status-label" className="grid grid-cols-3 gap-1 rounded-lg bg-stone-100 p-1">
            {STATUSES.map((s) => {
              const active = formData.status === s.value;
              return (
                <button
                  key={s.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onPatch({ status: s.value })}
                  className={`h-8 cursor-pointer rounded-md text-[13px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#007700] ${
                    active ? 'bg-white font-semibold text-stone-900 shadow-sm' : 'font-medium text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
