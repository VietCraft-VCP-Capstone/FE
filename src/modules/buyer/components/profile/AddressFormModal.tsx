import React, { useState, useEffect } from 'react';
import { Address } from '../../../user/services/userService';

interface AddressFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingAddress: Address | null;
    onSaveAddress: (addressData: Partial<Address>) => Promise<void>;
}

export const AddressFormModal: React.FC<AddressFormModalProps> = ({
    isOpen,
    onClose,
    editingAddress,
    onSaveAddress
}) => {
    // Address Form State
    const [recipientName, setRecipientName] = useState('');
    const [phone, setPhone] = useState('');
    const [addressDetail, setAddressDetail] = useState('');
    const [isDefault, setIsDefault] = useState(false);

    // Province/District/Ward dropdown list
    const [provinces, setProvinces] = useState<any[]>([]);
    const [districts, setDistricts] = useState<any[]>([]);
    const [wards, setWards] = useState<any[]>([]);

    // Selected values
    const [selectedProvinceId, setSelectedProvinceId] = useState('79'); // Default HCMC
    const [selectedDistrictId, setSelectedDistrictId] = useState('760'); // Default Dist 1
    const [selectedWardCode, setSelectedWardCode] = useState('26734'); // Default Ward Ben Nghe

    // Helpers
    const loadWards = async (dId: string, targetWCode?: string) => {
        try {
            const res = await fetch(`https://provinces.open-api.vn/api/d/${dId}?depth=2`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            const mapped = (data.wards || []).map((w: any) => ({
                code: w.code.toString(),
                name: w.name
            }));
            setWards(mapped);
            const wCode = targetWCode || mapped[0]?.code || '';
            setSelectedWardCode(wCode);
        } catch (err) {
            console.error('Failed to load wards', err);
            setWards([]);
            setSelectedWardCode('');
        }
    };

    const loadDistricts = async (pId: string, targetDCode?: string, targetWCode?: string) => {
        try {
            const res = await fetch(`https://provinces.open-api.vn/api/p/${pId}?depth=2`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            const mapped = (data.districts || []).map((d: any) => ({
                id: d.code.toString(),
                name: d.name
            }));
            setDistricts(mapped);
            const dCode = targetDCode || mapped[0]?.id || '';
            setSelectedDistrictId(dCode);
            if (dCode) {
                await loadWards(dCode, targetWCode);
            }
        } catch (err) {
            console.error('Failed to load districts', err);
            setDistricts([]);
            setSelectedDistrictId('');
            setWards([]);
            setSelectedWardCode('');
        }
    };

    const handleProvinceChange = (provinceId: string) => {
        setSelectedProvinceId(provinceId);
        loadDistricts(provinceId);
    };

    const handleDistrictChange = (districtId: string) => {
        setSelectedDistrictId(districtId);
        loadWards(districtId);
    };

    // Load provinces list on open
    useEffect(() => {
        const fetchProvinces = async () => {
            try {
                const res = await fetch('https://provinces.open-api.vn/api/p/');
                if (!res.ok) throw new Error();
                const data = await res.json();
                const mapped = data.map((p: any) => ({
                    id: p.code.toString(),
                    name: p.name
                }));
                setProvinces(mapped);
            } catch (err) {
                console.error('Failed to fetch provinces', err);
            }
        };
        if (isOpen) {
            fetchProvinces();
        }
    }, [isOpen]);

    // Initialize editing address
    useEffect(() => {
        if (!isOpen) return;

        if (editingAddress) {
            setRecipientName(editingAddress.recipient_name);
            setPhone(editingAddress.phone);
            const streetPart = editingAddress.address_detail.split(',')[0].trim();
            setAddressDetail(streetPart);
            setIsDefault(editingAddress.is_default);
            setSelectedProvinceId(editingAddress.province_id || '79');
            setSelectedDistrictId(editingAddress.district_id || '760');
            setSelectedWardCode(editingAddress.ward_code || '26734');
            loadDistricts(editingAddress.province_id || '79', editingAddress.district_id || '760', editingAddress.ward_code || '26734');
        } else {
            setRecipientName('');
            setPhone('');
            setAddressDetail('');
            setIsDefault(false);
            setSelectedProvinceId('79');
            setSelectedDistrictId('760');
            setSelectedWardCode('26734');
            loadDistricts('79', '760', '26734');
        }
    }, [editingAddress, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Build full address text from names
        const selectedProvName = provinces.find(p => p.id === selectedProvinceId)?.name || '';
        const selectedDistName = districts.find(d => d.id === selectedDistrictId)?.name || '';
        const selectedWardName = wards.find(w => w.code === selectedWardCode)?.name || '';

        const cleanStreet = addressDetail.split(',')[0].trim();
        const fullAddressDetail = [
            cleanStreet,
            selectedWardName,
            selectedDistName,
            selectedProvName
        ].filter(Boolean).join(', ');

        const addrData: Partial<Address> = {
            recipient_name: recipientName,
            phone,
            address_detail: fullAddressDetail,
            province_id: selectedProvinceId,
            district_id: selectedDistrictId,
            ward_code: selectedWardCode,
            is_default: isDefault
        };

        await onSaveAddress(addrData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
                <h2 className="font-extrabold text-gray-900 text-lg">
                    {editingAddress ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Grid row 1: Recipient Name & Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-900 mb-1">Họ tên người nhận</label>
                            <input
                                type="text"
                                required
                                placeholder="Ví dụ: Nguyễn Văn A"
                                value={recipientName}
                                onChange={(e) => setRecipientName(e.target.value)}
                                className="w-full border border-gray-300 text-gray-900 font-semibold bg-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-900 mb-1">Số điện thoại</label>
                            <input
                                type="text"
                                required
                                placeholder="Ví dụ: 0901234567"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full border border-gray-300 text-gray-900 font-semibold bg-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                    </div>

                    {/* Grid row 2: Province & District */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-900 mb-1">Tỉnh / Thành phố</label>
                            <select
                                value={selectedProvinceId}
                                onChange={(e) => handleProvinceChange(e.target.value)}
                                className="w-full border border-gray-300 text-gray-900 font-semibold bg-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
                            >
                                {provinces.length === 0 && <option value="">Đang tải...</option>}
                                {provinces.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-900 mb-1">Quận / Huyện</label>
                            <select
                                value={selectedDistrictId}
                                onChange={(e) => handleDistrictChange(e.target.value)}
                                className="w-full border border-gray-300 text-gray-900 font-semibold bg-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
                            >
                                {districts.length === 0 && <option value="">Chọn Quận / Huyện</option>}
                                {districts.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Grid row 3: Ward */}
                    <div>
                        <label className="block text-xs font-bold text-gray-900 mb-1">Phường / Xã</label>
                        <select
                            value={selectedWardCode}
                            onChange={(e) => setSelectedWardCode(e.target.value)}
                            className="w-full border border-gray-300 text-gray-900 font-semibold bg-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
                        >
                            {wards.length === 0 && <option value="">Chọn Phường / Xã</option>}
                            {wards.map(w => (
                                <option key={w.code} value={w.code}>{w.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Grid row 4: Detailed Address */}
                    <div>
                        <label className="block text-xs font-bold text-gray-900 mb-1">Địa chỉ chi tiết (Số nhà, ngõ, tên đường...)</label>
                        <textarea
                            required
                            placeholder="Ví dụ: 123 Đường Lê Lợi"
                            value={addressDetail}
                            onChange={(e) => setAddressDetail(e.target.value)}
                            className="w-full border border-gray-300 text-gray-900 font-semibold bg-white rounded-lg p-2.5 text-sm h-16 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="defaultAddr"
                            checked={isDefault}
                            onChange={(e) => setIsDefault(e.target.checked)}
                            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer animate-none"
                        />
                        <label htmlFor="defaultAddr" className="text-xs font-bold text-gray-900 cursor-pointer">
                            Đặt làm địa chỉ mặc định
                        </label>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-250 hover:bg-gray-50 text-xs font-bold text-gray-600 rounded-lg"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg"
                        >
                            Lưu lại
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddressFormModal;
