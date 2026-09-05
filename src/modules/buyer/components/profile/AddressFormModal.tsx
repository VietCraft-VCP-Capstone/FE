import React, { useState, useEffect, useRef } from 'react';
import { Address } from '../../../user/services/userService';
import { Search, MapPin, Loader2, X, ChevronDown, ChevronUp } from 'lucide-react';

interface Option {
    value: string;
    label: string;
}

interface CustomSelectProps {
    label: string;
    value: string;
    options: Option[];
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
    label,
    value,
    options,
    onChange,
    placeholder = 'Chọn...',
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);
    const displayText = selectedOption ? selectedOption.label : placeholder;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className="relative w-full">
            <label className="block text-xs font-bold text-gray-900 mb-1">{label}</label>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between border border-gray-300 text-gray-900 font-semibold bg-white rounded-lg p-2.5 text-sm text-left focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer ${
                    disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''
                }`}
            >
                <span className="truncate">{displayText}</span>
                <span className="text-gray-400 pointer-events-none transition-transform flex items-center">
                    {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </span>
            </button>

            {isOpen && options.length > 0 && (
                <ul className="absolute z-50 w-full min-w-full bg-white border border-gray-250 rounded-lg shadow-xl max-h-56 overflow-y-auto mt-1 divide-y divide-gray-100">
                    {options.map((opt) => (
                        <li key={opt.value}>
                            <button
                                type="button"
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors ${
                                    opt.value === value
                                        ? 'bg-emerald-50 text-emerald-800 font-bold'
                                        : 'text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                {opt.label}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

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
    const [recipientName, setRecipientName] = useState('');
    const [phone, setPhone] = useState('');
    const [addressDetail, setAddressDetail] = useState('');
    const [isDefault, setIsDefault] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDisplayName, setSelectedDisplayName] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (!searchQuery || searchQuery.trim().length < 3 || searchQuery === selectedDisplayName) {
            setSuggestions([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setSearchLoading(true);
            try {
                const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&addressdetails=1&limit=5&countrycodes=vn`;
                const response = await fetch(url, {
                    headers: {
                        'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8'
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setSuggestions(data);
                }
            } catch (err) {
                console.error('Error fetching address suggestions:', err);
            } finally {
                setSearchLoading(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, selectedDisplayName]);

    const handleSuggestionSelect = async (suggestion: any) => {
        setSelectedDisplayName(suggestion.display_name);
        setSearchQuery(suggestion.display_name);
        setShowSuggestions(false);

        const osmAddr = suggestion.address;
        if (!osmAddr) return;

        const clean = (s: string) => {
            if (!s) return '';
            return s
                .toLowerCase()
                .replace(/^(thành phố|tỉnh|quận|huyện|phường|xã|thị xã|thị trấn|đường)\s+/gi, '')
                .trim();
        };

        const stateName = osmAddr.state || osmAddr.city || osmAddr.province || '';
        if (!stateName) return;

        const targetStateClean = clean(stateName);
        const matchedProvince = provinces.find(
            p => clean(p.name) === targetStateClean ||
                 clean(p.name).includes(targetStateClean) ||
                 targetStateClean.includes(clean(p.name))
        );

        if (!matchedProvince) return;
        const pId = matchedProvince.id;
        setSelectedProvinceId(pId);

        try {
            const resP = await fetch(`https://provinces.open-api.vn/api/p/${pId}?depth=2`);
            if (!resP.ok) throw new Error();
            const dataP = await resP.json();
            const mappedDistricts = (dataP.districts || []).map((d: any) => ({
                id: d.code.toString(),
                name: d.name
            }));
            setDistricts(mappedDistricts);

            const districtName = osmAddr.city_district || osmAddr.district || osmAddr.county || osmAddr.suburb || osmAddr.town || '';
            const targetDistClean = clean(districtName);
            let matchedDistrict = mappedDistricts.find(
                (d: any) => clean(d.name) === targetDistClean ||
                            clean(d.name).includes(targetDistClean) ||
                            targetDistClean.includes(clean(d.name))
            );

            const dId = matchedDistrict?.id || mappedDistricts[0]?.id || '';
            setSelectedDistrictId(dId);

            if (dId) {
                const resD = await fetch(`https://provinces.open-api.vn/api/d/${dId}?depth=2`);
                if (!resD.ok) throw new Error();
                const dataD = await resD.json();
                const mappedWards = (dataD.wards || []).map((w: any) => ({
                    code: w.code.toString(),
                    name: w.name
                }));
                setWards(mappedWards);

                const wardName = osmAddr.ward || osmAddr.suburb || osmAddr.quarter || osmAddr.village || osmAddr.commune || '';
                const targetWardClean = clean(wardName);
                let matchedWard = mappedWards.find(
                    (w: any) => clean(w.name) === targetWardClean ||
                                clean(w.name).includes(targetWardClean) ||
                                targetWardClean.includes(clean(w.name))
                );

                const wCode = matchedWard?.code || mappedWards[0]?.code || '';
                setSelectedWardCode(wCode);
            }

            const road = osmAddr.road || '';
            const houseNo = osmAddr.house_number || '';
            let detail = [houseNo, road].filter(Boolean).join(' ');

            if (!detail) {
                const amenity = osmAddr.amenity || osmAddr.shop || osmAddr.office || osmAddr.tourism || osmAddr.building || '';
                if (amenity) {
                    detail = amenity;
                }
            }
            setAddressDetail(detail);

        } catch (err) {
            console.error('Error auto-filling from suggestions', err);
        }
    };

    const [provinces, setProvinces] = useState<any[]>([]);
    const [districts, setDistricts] = useState<any[]>([]);
    const [wards, setWards] = useState<any[]>([]);

    const [selectedProvinceId, setSelectedProvinceId] = useState('79');
    const [selectedDistrictId, setSelectedDistrictId] = useState('760');
    const [selectedWardCode, setSelectedWardCode] = useState('26734');

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

    useEffect(() => {
        if (!isOpen) return;

        setSearchQuery('');
        setSelectedDisplayName('');
        setSuggestions([]);

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
                    {/* OpenStreetMap Address Search */}
                    <div ref={searchRef} className="relative">
                        <label className="block text-xs font-bold text-gray-900 mb-1">
                            Tìm nhanh địa chỉ trên Bản đồ (OpenStreetMap)
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Gõ để tìm kiếm địa chỉ nhanh..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowSuggestions(true);
                                }}
                                className="w-full border border-gray-300 text-gray-900 font-semibold bg-white rounded-lg pl-9 pr-8 p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                {searchLoading ? (
                                    <Loader2 className="h-4 w-4 text-emerald-500 animate-spin" />
                                ) : (
                                    <Search className="h-4 w-4 text-gray-400" />
                                )}
                            </div>
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSelectedDisplayName('');
                                        setSuggestions([]);
                                    }}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {/* Suggestions List */}
                        {showSuggestions && suggestions.length > 0 && (
                            <ul className="absolute z-[60] w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1 divide-y divide-gray-100">
                                {suggestions.map((s, idx) => (
                                    <li key={idx}>
                                        <button
                                            type="button"
                                            onClick={() => handleSuggestionSelect(s)}
                                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-xs text-gray-700 font-medium flex items-start gap-2 transition-colors"
                                        >
                                            <MapPin className="h-3.5 w-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                                            <span>{s.display_name}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

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
                        <CustomSelect
                            label="Tỉnh / Thành phố"
                            value={selectedProvinceId}
                            options={provinces.map(p => ({ value: p.id, label: p.name }))}
                            onChange={handleProvinceChange}
                            placeholder={provinces.length === 0 ? "Đang tải..." : "Chọn Tỉnh / Thành phố"}
                        />
                        <CustomSelect
                            label="Quận / Huyện"
                            value={selectedDistrictId}
                            options={districts.map(d => ({ value: d.id, label: d.name }))}
                            onChange={handleDistrictChange}
                            placeholder="Chọn Quận / Huyện"
                            disabled={provinces.length === 0}
                        />
                    </div>

                    {/* Grid row 3: Ward */}
                    <CustomSelect
                        label="Phường / Xã"
                        value={selectedWardCode}
                        options={wards.map(w => ({ value: w.code, label: w.name }))}
                        onChange={setSelectedWardCode}
                        placeholder="Chọn Phường / Xã"
                        disabled={districts.length === 0}
                    />

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
