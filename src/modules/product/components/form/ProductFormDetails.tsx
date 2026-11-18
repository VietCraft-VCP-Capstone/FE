import { ProductFormData } from '../../types/product';
import { MaterialInput } from '../MaterialInput';
import { Field, inputClass, LABEL } from './formUi';

interface ProductFormDetailsProps {
  formData: ProductFormData;
  onPatch: (patch: Partial<ProductFormData>) => void;
}

export function ProductFormDetails({ formData, onPatch }: ProductFormDetailsProps) {
  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
      <div className="md:col-span-2" data-focus-target="materials">
        <MaterialInput value={formData.materials || []} onChange={(materials) => onPatch({ materials })} labelClass={LABEL} inputClass={inputClass()} />
      </div>

      <Field label="Xuất xứ / Xưởng sản xuất">
        <input
          type="text"
          placeholder="VD: Xưởng may TP.HCM, Làng gốm Bát Tràng..."
          value={formData.location}
          onChange={(e) => onPatch({ location: e.target.value })}
          className={inputClass()}
        />
      </Field>

      <Field label="Mã SKU" hint="Để trống thì hệ thống tự tạo mã.">
        <input
          type="text"
          placeholder="VD: BLANK-TSHIRT-BLK-M"
          value={formData.sku}
          onChange={(e) => onPatch({ sku: e.target.value })}
          className={inputClass(undefined, 'font-mono')}
        />
      </Field>
    </div>
  );
}
