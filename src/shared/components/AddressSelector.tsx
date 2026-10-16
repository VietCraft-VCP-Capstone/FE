import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, X, ChevronDown, ChevronUp } from 'lucide-react';

export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

function cleanPrefix(s: string): string {
  if (!s) return '';
  return removeVietnameseTones(s)
    .replace(/^(thanh pho|tinh|quan|huyen|thi xa|thi tran|phuong|xa|duong)\s+/gi, '')
    .trim();
}

export interface AddressOption {
  value: string;
  label: string;
}

export interface CustomSelectProps {
  label: string;
  value: string;
  options: AddressOption[];
  onChange: (value: string, label: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  loading?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  value,
  options,
  onChange,
  placeholder = 'Chọn...',
  disabled = false,
  required = false,
  loading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value || opt.label === value);
  const displayText = selectedOption ? selectedOption.label : (value || placeholder);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) => {
    if (!searchQuery.trim()) return true;
    const q = removeVietnameseTones(searchQuery);
    return removeVietnameseTones(opt.label).includes(q);
  });

  return (
    <div ref={containerRef} className="relative w-full space-y-1.5">
      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta flex items-center justify-between">
        <span>
          {label} {required && <span className="text-rose-500">*</span>}
        </span>
        {loading && <Loader2 size={12} className="animate-spin text-[#007700]" />}
      </label>

      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => {
          if (!disabled && !loading) {
            setIsOpen(!isOpen);
            setSearchQuery('');
          }
        }}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm transition-all cursor-pointer ${
          disabled || loading
            ? 'opacity-60 cursor-not-allowed bg-stone-100/60'
            : 'hover:border-[#007700]/60 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700]'
        } ${selectedOption ? 'text-stone-900 font-semibold' : 'text-stone-400'}`}
      >
        <span className="truncate">{displayText}</span>
        <span className="text-stone-400 shrink-0 ml-2">
          {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
          {options.length > 7 && (
            <div className="p-2 border-b border-stone-100 bg-stone-50/50">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Gõ để tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-[#007700]"
                />
              </div>
            </div>
          )}

          <div className="max-h-56 overflow-y-auto divide-y divide-stone-50">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-xs text-stone-400 text-center">Không tìm thấy kết quả</div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value || opt.label === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value, opt.label);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#007700]/10 text-[#007700] font-bold'
                        : 'text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <span className="text-[#007700] text-xs">✓</span>}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export interface VietnamAddressValue {
  province: string;
  district: string;
  ward: string;
  specificAddress: string;
  provinceId?: string;
  districtId?: string;
  wardCode?: string;
}

export interface AddressSelectorProps {
  value: Partial<VietnamAddressValue>;
  onChange: (val: VietnamAddressValue) => void;
  showQuickSearch?: boolean;
  showSpecificAddress?: boolean;
  specificAddressLabel?: string;
  specificAddressType?: 'input' | 'textarea';
  required?: boolean;
  className?: string;
}

export const AddressSelector: React.FC<AddressSelectorProps> = ({
  value,
  onChange,
  showQuickSearch = true,
  showSpecificAddress = true,
  specificAddressLabel = 'Địa chỉ chi tiết (Số nhà, tên ngõ/đường)',
  specificAddressType = 'input',
  required = true,
  className = '',
}) => {
  const [provinces, setProvinces] = useState<AddressOption[]>([]);
  const [districts, setDistricts] = useState<AddressOption[]>([]);
  const [wards, setWards] = useState<AddressOption[]>([]);

  const [selectedProvinceId, setSelectedProvinceId] = useState<string>(value.provinceId || '');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>(value.districtId || '');
  const [selectedWardCode, setSelectedWardCode] = useState<string>(value.wardCode || '');

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  // Quick search via OpenStreetMap Nominatim
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Load provinces on mount
  useEffect(() => {
    let isMounted = true;
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const res = await fetch('https://provinces.open-api.vn/api/p/');
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (isMounted) {
          const mapped: AddressOption[] = data.map((p: any) => ({
            value: p.code.toString(),
            label: p.name,
          }));
          setProvinces(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch provinces', err);
      } finally {
        if (isMounted) setLoadingProvinces(false);
      }
    };
    fetchProvinces();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync initial / incoming values to selected IDs
  useEffect(() => {
    if (provinces.length === 0) return;

    let targetProv = provinces.find((p) => p.value === value.provinceId || p.label === value.province);
    if (!targetProv && value.province) {
      const cleanP = cleanPrefix(value.province);
      targetProv = provinces.find((p) => {
        const cleanOpt = cleanPrefix(p.label);
        return cleanOpt === cleanP || cleanOpt.includes(cleanP) || cleanP.includes(cleanOpt);
      });
    }

    if (targetProv && targetProv.value !== selectedProvinceId) {
      setSelectedProvinceId(targetProv.value);
      loadDistricts(targetProv.value, value.districtId || value.district, value.wardCode || value.ward);
    }
  }, [provinces, value.province, value.provinceId]);

  const loadWards = async (dId: string, targetWard?: string) => {
    if (!dId) {
      setWards([]);
      setSelectedWardCode('');
      return;
    }
    setLoadingWards(true);
    try {
      const res = await fetch(`https://provinces.open-api.vn/api/d/${dId}?depth=2`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const mapped: AddressOption[] = (data.wards || []).map((w: any) => ({
        value: w.code.toString(),
        label: w.name,
      }));
      setWards(mapped);

      let matchedW = mapped.find((w) => w.value === targetWard || w.label === targetWard);
      if (!matchedW && targetWard) {
        const cleanW = cleanPrefix(targetWard);
        matchedW = mapped.find((w) => {
          const optClean = cleanPrefix(w.label);
          return optClean === cleanW || optClean.includes(cleanW) || cleanW.includes(optClean);
        });
      }

      if (matchedW) {
        setSelectedWardCode(matchedW.value);
      }
    } catch (err) {
      console.error('Failed to load wards', err);
      setWards([]);
      setSelectedWardCode('');
    } finally {
      setLoadingWards(false);
    }
  };

  const loadDistricts = async (pId: string, targetDist?: string, targetWard?: string) => {
    if (!pId) {
      setDistricts([]);
      setSelectedDistrictId('');
      setWards([]);
      setSelectedWardCode('');
      return;
    }
    setLoadingDistricts(true);
    try {
      const res = await fetch(`https://provinces.open-api.vn/api/p/${pId}?depth=2`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const mapped: AddressOption[] = (data.districts || []).map((d: any) => ({
        value: d.code.toString(),
        label: d.name,
      }));
      setDistricts(mapped);

      let matchedD = mapped.find((d) => d.value === targetDist || d.label === targetDist);
      if (!matchedD && targetDist) {
        const cleanD = cleanPrefix(targetDist);
        matchedD = mapped.find((d) => {
          const optClean = cleanPrefix(d.label);
          return optClean === cleanD || optClean.includes(cleanD) || cleanD.includes(optClean);
        });
      }

      const dCode = matchedD ? matchedD.value : '';
      setSelectedDistrictId(dCode);
      if (dCode) {
        await loadWards(dCode, targetWard);
      } else {
        setWards([]);
        setSelectedWardCode('');
      }
    } catch (err) {
      console.error('Failed to load districts', err);
      setDistricts([]);
      setSelectedDistrictId('');
      setWards([]);
      setSelectedWardCode('');
    } finally {
      setLoadingDistricts(false);
    }
  };

  const handleProvinceChange = (pId: string, pLabel: string) => {
    setSelectedProvinceId(pId);
    setSelectedDistrictId('');
    setSelectedWardCode('');
    setDistricts([]);
    setWards([]);

    onChange({
      ...value,
      province: pLabel,
      provinceId: pId,
      district: '',
      districtId: '',
      ward: '',
      wardCode: '',
      specificAddress: value.specificAddress || '',
    });

    loadDistricts(pId);
  };

  const handleDistrictChange = (dId: string, dLabel: string) => {
    setSelectedDistrictId(dId);
    setSelectedWardCode('');
    setWards([]);

    const curProv = provinces.find((p) => p.value === selectedProvinceId)?.label || value.province || '';
    onChange({
      ...value,
      province: curProv,
      provinceId: selectedProvinceId,
      district: dLabel,
      districtId: dId,
      ward: '',
      wardCode: '',
      specificAddress: value.specificAddress || '',
    });

    loadWards(dId);
  };

  const handleWardChange = (wCode: string, wLabel: string) => {
    setSelectedWardCode(wCode);
    const curProv = provinces.find((p) => p.value === selectedProvinceId)?.label || value.province || '';
    const curDist = districts.find((d) => d.value === selectedDistrictId)?.label || value.district || '';

    onChange({
      ...value,
      province: curProv,
      provinceId: selectedProvinceId,
      district: curDist,
      districtId: selectedDistrictId,
      ward: wLabel,
      wardCode: wCode,
      specificAddress: value.specificAddress || '',
    });
  };

  const handleSpecificAddressChange = (detail: string) => {
    const curProv = provinces.find((p) => p.value === selectedProvinceId)?.label || value.province || '';
    const curDist = districts.find((d) => d.value === selectedDistrictId)?.label || value.district || '';
    const curWard = wards.find((w) => w.value === selectedWardCode)?.label || value.ward || '';

    onChange({
      ...value,
      province: curProv,
      provinceId: selectedProvinceId,
      district: curDist,
      districtId: selectedDistrictId,
      ward: curWard,
      wardCode: selectedWardCode,
      specificAddress: detail,
    });
  };

  // Nominatim quick search debounce
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          searchQuery
        )}&format=json&addressdetails=1&limit=5&countrycodes=vn`;
        const response = await fetch(url, {
          headers: { 'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8' },
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
  }, [searchQuery]);

  // Click outside Nominatim suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionSelect = async (suggestion: any) => {
    setShowSuggestions(false);
    setSearchQuery(suggestion.display_name);

    const osmAddr = suggestion.address;
    if (!osmAddr) return;

    const stateName = osmAddr.state || osmAddr.city || osmAddr.province || '';
    let matchedProv = provinces.find((p) => {
      const cleanP = cleanPrefix(p.label);
      const cleanS = cleanPrefix(stateName);
      return cleanP === cleanS || cleanP.includes(cleanS) || cleanS.includes(cleanP);
    });

    if (!matchedProv && suggestion.display_name) {
      const cleanDisplay = cleanPrefix(suggestion.display_name);
      matchedProv = provinces.find((p) => cleanDisplay.includes(cleanPrefix(p.label)));
    }

    if (!matchedProv) return;

    setSelectedProvinceId(matchedProv.value);

    let newDistrictName = '';
    let newDistrictId = '';
    let newWardName = '';
    let newWardCode = '';

    try {
      const resP = await fetch(`https://provinces.open-api.vn/api/p/${matchedProv.value}?depth=3`);
      if (resP.ok) {
        const dataP = await resP.json();
        const rawDistricts = dataP.districts || [];
        const mappedD: AddressOption[] = rawDistricts.map((d: any) => ({
          value: d.code.toString(),
          label: d.name,
        }));
        setDistricts(mappedD);

        const osmDist = osmAddr.district || osmAddr.county || osmAddr.suburb || osmAddr.city_district || '';
        const cleanOsmDist = cleanPrefix(osmDist);

        let foundDistrict = rawDistricts.find((d: any) => {
          const cleanD = cleanPrefix(d.name);
          return (
            cleanD === cleanOsmDist ||
            (cleanD.length >= 3 && cleanOsmDist.includes(cleanD)) ||
            (cleanOsmDist.length >= 3 && cleanD.includes(cleanOsmDist))
          );
        });

        if (foundDistrict) {
          newDistrictId = foundDistrict.code.toString();
          newDistrictName = foundDistrict.name;
          setSelectedDistrictId(newDistrictId);

          const rawWards = foundDistrict.wards || [];
          const mappedW: AddressOption[] = rawWards.map((w: any) => ({
            value: w.code.toString(),
            label: w.name,
          }));
          setWards(mappedW);

          const osmWard =
            osmAddr.ward || osmAddr.suburb || osmAddr.quarter || osmAddr.village || osmAddr.commune || '';
          const cleanOsmWard = cleanPrefix(osmWard);

          let foundWard = rawWards.find((w: any) => {
            const cleanW = cleanPrefix(w.name);
            return (
              cleanW === cleanOsmWard ||
              (cleanW.length >= 3 && cleanOsmWard.includes(cleanW)) ||
              (cleanOsmWard.length >= 3 && cleanW.includes(cleanOsmWard))
            );
          });

          if (foundWard) {
            newWardCode = foundWard.code.toString();
            newWardName = foundWard.name;
            setSelectedWardCode(newWardCode);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching full districts for suggestion', err);
    }

    const road = osmAddr.road || osmAddr.street || '';
    const houseNo = osmAddr.house_number || '';
    let detail = [houseNo, road].filter(Boolean).join(' ');

    if (!detail) {
      const amenity = osmAddr.amenity || osmAddr.shop || osmAddr.office || osmAddr.tourism || osmAddr.building || '';
      if (amenity) detail = amenity;
    }

    onChange({
      province: matchedProv.label,
      provinceId: matchedProv.value,
      district: newDistrictName || value.district || '',
      districtId: newDistrictId || value.districtId || '',
      ward: newWardName || value.ward || '',
      wardCode: newWardCode || value.wardCode || '',
      specificAddress: detail || value.specificAddress || '',
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Quick Search */}
      {showQuickSearch && (
        <div className="relative" ref={searchRef}>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta mb-1.5 flex items-center gap-1.5">
            <Search size={14} className="text-[#007700]" />
            <span>Tìm nhanh địa chỉ (Tự động điền)</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              placeholder="VD: Số 88 Đường Giang Cao, Bát Tràng, Gia Lâm, Hà Nội..."
              className="w-full pl-10 pr-10 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700] transition-all"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            {searchLoading && (
              <Loader2 className="w-4 h-4 text-[#007700] animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
            )}
            {searchQuery && !searchLoading && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSuggestions([]);
                  setShowSuggestions(false);
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-stone-100">
              {suggestions.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSuggestionSelect(item)}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#007700]/5 text-xs text-stone-700 font-medium flex items-start gap-2.5 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#007700] mt-0.5 shrink-0" />
                  <span className="line-clamp-2">{item.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selects: Province, District, Ward */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CustomSelect
          label="Tỉnh / Thành phố"
          value={selectedProvinceId}
          options={provinces}
          placeholder="Chọn Tỉnh / Thành phố"
          loading={loadingProvinces}
          onChange={handleProvinceChange}
          required={required}
        />

        <CustomSelect
          label="Quận / Huyện"
          value={selectedDistrictId}
          options={districts}
          placeholder={selectedProvinceId ? 'Chọn Quận / Huyện' : 'Vui lòng chọn Tỉnh/TP trước'}
          disabled={!selectedProvinceId}
          loading={loadingDistricts}
          onChange={handleDistrictChange}
          required={required}
        />

        <div className="md:col-span-2">
          <CustomSelect
            label="Phường / Xã"
            value={selectedWardCode}
            options={wards}
            placeholder={selectedDistrictId ? 'Chọn Phường / Xã' : 'Vui lòng chọn Quận/Huyện trước'}
            disabled={!selectedDistrictId}
            loading={loadingWards}
            onChange={handleWardChange}
            required={required}
          />
        </div>
      </div>

      {/* Specific Address */}
      {showSpecificAddress && (
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
            {specificAddressLabel} {required && <span className="text-rose-500">*</span>}
          </label>
          {specificAddressType === 'textarea' ? (
            <textarea
              required={required}
              placeholder="VD: Số 88 Đường Giang Cao, Thôn 2..."
              value={value.specificAddress || ''}
              onChange={(e) => handleSpecificAddressChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700] h-20 transition-all"
            />
          ) : (
            <input
              type="text"
              required={required}
              placeholder="VD: Số 88 Đường Giang Cao, Thôn 2..."
              value={value.specificAddress || ''}
              onChange={(e) => handleSpecificAddressChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700] transition-all"
            />
          )}
        </div>
      )}
    </div>
  );
};

export default AddressSelector;
