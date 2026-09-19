import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShieldCheck, CheckCircle2, AlertCircle, UploadCloud, FileText,
    ArrowLeft, ArrowRight, Store, Building2, User as UserIcon,
    CreditCard, Lock, Sparkles, Clock, RefreshCw, Trash2, Check,
    Phone, Mail, AlertTriangle, FileCheck, Calendar
} from 'lucide-react';
import { sellerKycService, SellerKycStatusResponse } from '../services/sellerKycService';
import { userService } from '../../user/services/userService';
import { SUPPORTED_BANKS } from '../types/settings';
import { getApiErrorMessage } from '../../../infrastructure/api/interceptors';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';
import { useToast } from '../../../shared/components/Toast';

const CRAFT_CATEGORIES = [
    'Gốm sứ thủ công (Bát Tràng, Chu Đậu)',
    'Mây tre đan & Cói thủ công',
    'Dệt thổ cẩm & Lụa tơ tằm',
    'Tranh nghệ thuật, Sơn mài & Khắc gỗ',
    'Sản phẩm in theo yêu cầu (POD)',
    'Nến thơm & Thủ công tinh dầu thảo mộc',
    'Đồ lưu niệm & Quà tặng thủ công Việt Nam',
    'Thời trang & Phụ kiện tái chế thủ công'
];

function normalizeName(str: string) {
    if (!str) return '';
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toUpperCase()
        .replace(/\s+/g, ' ')
        .trim();
}

function toDisplayDate(str: string): string {
    if (!str) return '';
    if (str.includes('/')) return str;
    const parts = str.split('-');
    if (parts.length === 3) {
        const [y, m, d] = parts;
        return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }
    return str;
}

function toIsoDate(str: string): string {
    if (!str) return '';
    if (str.includes('-') && str.length === 10) return str;
    const parts = str.split('/');
    if (parts.length === 3 && parts[2]?.length === 4) {
        const [d, m, y] = parts;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return '';
}

function formatMaskedDateInput(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) {
        if (raw.endsWith('/') && digits.length > 0) {
            return `${digits.padStart(2, '0')}/`;
        }
        return digits;
    }
    if (digits.length <= 4) {
        const part1 = digits.slice(0, 2);
        const part2 = digits.slice(2);
        if (raw.endsWith('/') && digits.length === 4) {
            return `${part1}/${part2}/`;
        }
        return `${part1}/${part2}`;
    }
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function SellerRegisterPage() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusData, setStatusData] = useState<SellerKycStatusResponse | null>(null);
    const [showCancelKycModal, setShowCancelKycModal] = useState(false);
    const [cancellingKyc, setCancellingKyc] = useState(false);

    const [currentStep, setCurrentStep] = useState(1);

    const [phone, setPhone] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [phoneVerified, setPhoneVerified] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otpCountdown, setOtpCountdown] = useState(0);

    const [sellerType, setSellerType] = useState<'INDIVIDUAL' | 'BUSINESS'>('INDIVIDUAL');

    const [fullName, setFullName] = useState('');
    const [idCardNumber, setIdCardNumber] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [idIssueDate, setIdIssueDate] = useState('');
    const [idIssuePlace, setIdIssuePlace] = useState('');
    const [taxCode, setTaxCode] = useState('');
    const [frontIdFile, setFrontIdFile] = useState<{ filename: string; url: string } | null>(null);
    const [backIdFile, setBackIdFile] = useState<{ filename: string; url: string } | null>(null);
    const [portraitFile, setPortraitFile] = useState<{ filename: string; url: string } | null>(null);
    const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

    const [companyName, setCompanyName] = useState('');
    const [businessLicenseNumber, setBusinessLicenseNumber] = useState('');
    const [businessLicenseFile, setBusinessLicenseFile] = useState<{ filename: string; url: string } | null>(null);
    const [legalRepName, setLegalRepName] = useState('');
    const [legalRepPosition, setLegalRepPosition] = useState('');

    const [shopName, setShopName] = useState('');
    const [shopDescription, setShopDescription] = useState('');
    const [mainCategory, setMainCategory] = useState(CRAFT_CATEGORIES[0]);
    const [isCustomCategory, setIsCustomCategory] = useState(false);
    const [recipientName, setRecipientName] = useState('');
    const [pickupPhone, setPickupPhone] = useState('');
    const [province, setProvince] = useState('');
    const [district, setDistrict] = useState('');
    const [ward, setWard] = useState('');
    const [specificAddress, setSpecificAddress] = useState('');

    const [bankCode, setBankCode] = useState('VCB');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountHolder, setAccountHolder] = useState('');

    const [agreedTerms, setAgreedTerms] = useState(false);
    const [agreedPdpd, setAgreedPdpd] = useState(false);
    const [signature, setSignature] = useState('');

    const loadStatus = async () => {
        setLoading(true);
        try {
            const [data, profile] = await Promise.all([
                sellerKycService.getStatus(),
                userService.getProfile().catch(() => null)
            ]);

            setStatusData(data);
            if (data.user) {
                if (data.user.role === 'SELLER') {
                    navigate('/seller/dashboard');
                    return;
                }
                setPhone(data.user.phone || profile?.phone || '');
                setPhoneVerified(data.user.is_phone_verified);
                setFullName(data.user.name || profile?.full_name || '');
                setSignature(data.user.name || profile?.full_name || '');
            }

            if (profile?.addresses && profile.addresses.length > 0) {
                const defaultAddr = profile.addresses.find(a => a.is_default) || profile.addresses[0];
                setRecipientName(prev => prev || defaultAddr.recipient_name);
                setPickupPhone(prev => prev || defaultAddr.phone);
                setProvince(prev => prev || defaultAddr.province_id);
                setDistrict(prev => prev || defaultAddr.district_id);
                setWard(prev => prev || defaultAddr.ward_code);
                setSpecificAddress(prev => prev || defaultAddr.address_detail);
            }

            if (data.application) {
                const app = data.application;
                setSellerType(app.seller_type || 'INDIVIDUAL');
                setPhone(app.phone || data.user.phone || '');
                setPhoneVerified(app.is_phone_verified);
                if (app.kyc_data) {
                    setFullName(app.kyc_data.full_name || data.user.name || '');
                    setIdCardNumber(app.kyc_data.id_card_number_masked || app.kyc_data.identity_card_number || '');
                    setDateOfBirth(toDisplayDate(app.kyc_data.date_of_birth || ''));
                    setIdIssueDate(toDisplayDate(app.kyc_data.id_issue_date || ''));
                    setIdIssuePlace(app.kyc_data.id_issue_place || '');
                    setCompanyName(app.kyc_data.company_name || '');
                    setLegalRepName(app.kyc_data.legal_rep_name || '');
                    setLegalRepPosition(app.kyc_data.legal_rep_position || '');
                    setTaxCode(app.kyc_data.tax_code || '');
                    if (app.kyc_data.business_license_number_masked || app.kyc_data.business_license_number) {
                        setBusinessLicenseNumber(app.kyc_data.business_license_number_masked || app.kyc_data.business_license_number || '');
                    }
                    if (app.kyc_data.front_id_url) {
                        const fn = app.kyc_data.front_id_url.split('/files/')[1]?.split('?')[0] || 'front.jpg';
                        setFrontIdFile({ filename: fn, url: app.kyc_data.front_id_url });
                    }
                    if (app.kyc_data.back_id_url) {
                        const fn = app.kyc_data.back_id_url.split('/files/')[1]?.split('?')[0] || 'back.jpg';
                        setBackIdFile({ filename: fn, url: app.kyc_data.back_id_url });
                    }
                    if (app.kyc_data.portrait_url) {
                        const fn = app.kyc_data.portrait_url.split('/files/')[1]?.split('?')[0] || 'portrait.jpg';
                        setPortraitFile({ filename: fn, url: app.kyc_data.portrait_url });
                    }
                    if (app.kyc_data.business_license_url) {
                        const fn = app.kyc_data.business_license_url.split('/files/')[1]?.split('?')[0] || 'license.jpg';
                        setBusinessLicenseFile({ filename: fn, url: app.kyc_data.business_license_url });
                    }
                }
                if (app.shop_info) {
                    setShopName(app.shop_info.shop_name || '');
                    setShopDescription(app.shop_info.description || '');
                    const savedCategory = app.shop_info.main_category || CRAFT_CATEGORIES[0];
                    setMainCategory(savedCategory);
                    if (app.shop_info.main_category && !CRAFT_CATEGORIES.includes(app.shop_info.main_category)) {
                        setIsCustomCategory(true);
                    }
                    if (app.shop_info.pickup_address) {
                        setRecipientName(app.shop_info.pickup_address.recipient_name || '');
                        setPickupPhone(app.shop_info.pickup_address.phone || '');
                        setProvince(app.shop_info.pickup_address.province_id || '');
                        setDistrict(app.shop_info.pickup_address.district_id || '');
                        setWard(app.shop_info.pickup_address.ward_code || '');
                        setSpecificAddress(app.shop_info.pickup_address.address_detail || '');
                    }
                }
                if (app.bank_info) {
                    setBankCode(app.bank_info.bank_code || 'VCB');
                    setAccountHolder(app.bank_info.account_holder || '');
                }

                if (app.status === 'PENDING_APPROVAL') {
                    setCurrentStep(6);
                }
            }
        } catch (err: any) {
            setError(getApiErrorMessage(err, 'Không thể tải trạng thái đăng ký.'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStatus();
    }, []);

    useEffect(() => {
        if (otpCountdown <= 0) return;
        const timer = setInterval(() => {
            setOtpCountdown(c => c - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [otpCountdown]);

    const handleSendOtp = async () => {
        if (!phone || phone.length < 10) {
            setError('Vui lòng nhập số điện thoại hợp lệ (10 số).');
            return;
        }
        setError(null);
        try {
            await sellerKycService.sendPhoneOtp(phone);
            setOtpSent(true);
            setOtpCountdown(60);
            setOtpCode('');
        } catch (err: any) {
            setError(getApiErrorMessage(err, 'Gửi mã OTP thất bại.'));
        }
    };

    const handleVerifyOtp = async () => {
        if (!otpCode || otpCode.length < 6) {
            setError('Vui lòng nhập mã OTP 6 chữ số từ tin nhắn SMS trên điện thoại.');
            return;
        }
        setError(null);
        try {
            await sellerKycService.verifyPhoneOtp(phone, otpCode);
            setPhoneVerified(true);
            await loadStatus();
        } catch (err: any) {
            setError(getApiErrorMessage(err, 'Mã OTP không chính xác hoặc đã hết hạn.'));
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back' | 'portrait' | 'license') => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            setError('Kích thước file không được vượt quá 10MB.');
            return;
        }

        setError(null);
        setUploadingDoc(type);
        try {
            const res = await sellerKycService.uploadDocument(file);
            if (type === 'front') setFrontIdFile({ filename: res.filename, url: res.secureUrl });
            if (type === 'back') setBackIdFile({ filename: res.filename, url: res.secureUrl });
            if (type === 'portrait') setPortraitFile({ filename: res.filename, url: res.secureUrl });
            if (type === 'license') setBusinessLicenseFile({ filename: res.filename, url: res.secureUrl });
        } catch (err: any) {
            setError(getApiErrorMessage(err, 'Tải file lên thất bại.'));
        } finally {
            setUploadingDoc(null);
        }
    };

    const nameToCompare = sellerType === 'INDIVIDUAL' ? fullName : (legalRepName || companyName);
    const isNameMatched = accountHolder ? normalizeName(accountHolder) === normalizeName(nameToCompare) : false;

    const handleSubmit = async () => {
        setError(null);
        if (!phoneVerified) {
            setError('Vui lòng xác thực số điện thoại ở Bước 1 trước khi gửi hồ sơ.');
            setCurrentStep(1);
            return;
        }
        if (!agreedTerms || !agreedPdpd) {
            setError('Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách PDPD để tiếp tục.');
            return;
        }
        if (!signature) {
            setError('Vui lòng nhập họ và tên để xác nhận chữ ký điện tử.');
            return;
        }

        setSubmitting(true);
        try {
            const selectedBank = SUPPORTED_BANKS.find(b => b.code === bankCode);
            await sellerKycService.submitApplication({
                seller_type: sellerType,
                phone,
                phone_verified: true,
                kyc_data: {
                    full_name: fullName,
                    identity_card_number: idCardNumber,
                    date_of_birth: dateOfBirth,
                    id_issue_date: idIssueDate,
                    id_issue_place: idIssuePlace,
                    tax_code: taxCode,
                    front_id_image: frontIdFile?.filename,
                    back_id_image: backIdFile?.filename,
                    portrait_image: portraitFile?.filename,
                    company_name: sellerType === 'BUSINESS' ? companyName : undefined,
                    business_license_number: sellerType === 'BUSINESS' ? businessLicenseNumber : undefined,
                    business_license_image: sellerType === 'BUSINESS' ? businessLicenseFile?.filename : undefined,
                    legal_rep_name: sellerType === 'BUSINESS' ? legalRepName : undefined,
                    legal_rep_position: sellerType === 'BUSINESS' ? legalRepPosition : undefined,
                },
                shop_info: {
                    shop_name: shopName,
                    description: shopDescription,
                    main_category: mainCategory,
                    pickup_address: {
                        recipient_name: recipientName || fullName,
                        phone: pickupPhone || phone,
                        province_id: province,
                        district_id: district,
                        ward_code: ward || district || province || 'N/A',
                        address_detail: specificAddress,
                    }
                },
                bank_info: {
                    bank_code: bankCode,
                    bank_name: selectedBank ? selectedBank.name : bankCode,
                    account_number: accountNumber,
                    account_holder: accountHolder,
                },
                compliance: {
                    agreed_terms: agreedTerms,
                    agreed_pdpd_policy: agreedPdpd,
                    electronic_signature: signature,
                }
            });

            await loadStatus();
            setCurrentStep(6);
        } catch (err: any) {
            const errorMsg = getApiErrorMessage(err, 'Nộp hồ sơ thất bại.');
            console.error('[KYC Submit Error]:', errorMsg, err?.response?.data);
            setError(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelApplication = () => {
        setShowCancelKycModal(true);
    };

    const handleConfirmCancelKyc = async () => {
        setCancellingKyc(true);
        try {
            await sellerKycService.cancelOrDelete();
            showToast('Đã xóa dữ liệu hồ sơ KYC thành công.', 'success');
            setShowCancelKycModal(false);
            await loadStatus();
            setCurrentStep(1);
        } catch (err: any) {
            setError(getApiErrorMessage(err, 'Hủy hồ sơ thất bại.'));
        } finally {
            setCancellingKyc(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-[#007700] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-600 font-jakarta">Đang kiểm tra hồ sơ định danh...</p>
                </div>
            </div>
        );
    }

    const app = statusData?.application;
    const isRejected = app?.status === 'REJECTED';

    const STEPS = [
        { id: 1, title: 'Xác thực cơ bản' },
        { id: 2, title: 'Đối tượng bán hàng' },
        { id: 3, title: 'Thông tin KYC' },
        { id: 4, title: 'Gian hàng & Ngân hàng' },
        { id: 5, title: 'Ký kết & Pháp lý' },
        { id: 6, title: 'Chờ duyệt' },
    ];

    return (
        <div className="min-h-screen bg-white py-10 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate('/')}
                        className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#007700] transition-colors cursor-pointer"
                    >
                        <ArrowLeft size={16} /> Quay lại trang chủ
                    </button>
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-emerald-50 text-[#007700] border border-emerald-200 rounded-full text-xs font-bold font-jakarta shadow-xs">
                        <Sparkles size={14} /> Quy trình Định danh Người bán VietCraft (KYC)
                    </span>
                </div>

                <div className="bg-gradient-to-r from-[#173820] via-[#0e4823] to-[#007700] text-white p-8 sm:p-10 rounded-3xl shadow-sm relative overflow-hidden border border-emerald-800/30">
                    <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="relative z-10 space-y-2.5">
                        <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider text-emerald-300 bg-black/20 px-3 py-1 rounded-full font-jakarta backdrop-blur-xs">
                            Nghị định 52/2013 • Nghị định 85/2021 • Nghị định 13/2023 PDPD
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                            Đăng ký Trở thành Người bán VietCraft
                        </h1>
                        <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
                            Hoàn tất quy trình định danh khách hàng (KYC) để kích hoạt gian hàng trực tuyến, bảo vệ quyền lợi người tiêu dùng và tuân thủ các quy định TMĐT Việt Nam.
                        </p>
                    </div>
                </div>

                {isRejected && (
                    <div className="bg-rose-50 border-2 border-rose-300 p-5 rounded-2xl flex items-start gap-4 text-rose-900 shadow-sm animate-shake">
                        <AlertTriangle className="text-rose-600 flex-shrink-0 mt-0.5" size={24} />
                        <div className="space-y-1 flex-1">
                            <h4 className="font-extrabold text-sm text-rose-900">Hồ sơ của bạn cần được điều chỉnh lại</h4>
                            <p className="text-xs text-rose-700 leading-relaxed">
                                <strong>Lý do từ Ban Quản trị:</strong> {app?.review?.rejection_reason || 'Thông tin hoặc hình ảnh chưa đạt tiêu chuẩn theo quy định.'}
                            </p>
                            <div className="pt-2">
                                <button
                                    onClick={() => setCurrentStep(1)}
                                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                                >
                                    Cập nhật lại hồ sơ ngay
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                        <AlertCircle size={16} className="flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between relative">
                        <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1 bg-slate-100 z-0">
                            <div
                                className="h-full bg-[#007700] transition-all duration-300 rounded-full"
                                style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                            />
                        </div>

                        {STEPS.map((step) => {
                            const isDone = currentStep > step.id;
                            const isCurrent = currentStep === step.id;
                            return (
                                <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                                    <div
                                        className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-xs transition-all ${isDone
                                            ? 'bg-[#007700] text-white ring-4 ring-emerald-50 shadow-xs'
                                            : isCurrent
                                                ? 'bg-white border-2 border-[#007700] text-[#007700] ring-4 ring-emerald-100 shadow-xs'
                                                : 'bg-white border border-slate-200 text-slate-400'
                                            }`}
                                    >
                                        {isDone ? <Check size={16} className="stroke-[3]" /> : step.id}
                                    </div>
                                    <span
                                        className={`text-[11px] font-jakarta font-bold hidden sm:block ${isCurrent ? 'text-[#007700]' : isDone ? 'text-slate-800' : 'text-slate-400'
                                            }`}
                                    >
                                        {step.title}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white p-6 sm:p-9 rounded-3xl border border-slate-200 shadow-sm">
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <div className="border-b border-slate-100 pb-4">
                                <h3 className="text-lg font-extrabold text-slate-900">Bước 1: Xác thực tài khoản cơ bản</h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Theo quy định của sàn TMĐT, người bán phải xác thực chính chủ cả Email và Số điện thoại di động qua mã OTP.
                                </p>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#007700] flex items-center justify-center">
                                        <Mail size={20} />
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 font-semibold">Địa chỉ Email đăng nhập</div>
                                        <div className="text-sm font-bold text-slate-900">{statusData?.user?.email}</div>
                                    </div>
                                </div>
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#007700] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                                    <CheckCircle2 size={14} /> Đã xác thực
                                </span>
                            </div>

                            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#007700] flex items-center justify-center">
                                            <Phone size={20} />
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500 font-semibold">Số điện thoại di động</div>
                                            <div className="text-sm font-bold text-slate-900">
                                                {phoneVerified ? phone : 'Chưa xác thực số điện thoại'}
                                            </div>
                                        </div>
                                    </div>
                                    {phoneVerified && (
                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#007700] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                                            <CheckCircle2 size={14} /> Đã xác thực
                                        </span>
                                    )}
                                </div>

                                {!phoneVerified && (
                                    <div className="space-y-4 pt-3 border-t border-slate-100">
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <input
                                                type="tel"
                                                placeholder="Nhập số điện thoại (ví dụ: 0912345678)"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-[#007700] focus:ring-2 focus:ring-emerald-500/15 transition-all"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleSendOtp}
                                                disabled={otpCountdown > 0}
                                                className="px-5 py-2.5 bg-[#007700] hover:bg-[#005B00] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5"
                                            >
                                                {otpCountdown > 0 ? `Gửi lại (${otpCountdown}s)` : 'Gửi mã xác thực OTP'}
                                            </button>
                                        </div>

                                        {otpSent && (
                                            <div className="p-4.5 bg-emerald-50/80 border border-emerald-300/80 rounded-2xl space-y-3 shadow-xs">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-[#007700] text-white flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-xs">
                                                        <Phone size={18} />
                                                    </div>
                                                    <div className="flex-1 space-y-1.5 text-xs">
                                                        <div className="font-extrabold text-emerald-950 text-sm flex items-center gap-2">
                                                            Đã gửi tin nhắn SMS xác thực
                                                        </div>
                                                        <p className="text-slate-600 leading-relaxed">
                                                            Hệ thống đã gửi mã OTP gồm 6 chữ số qua tin nhắn SMS tới số điện thoại <strong className="text-slate-900 font-bold">{phone}</strong>. Vui lòng mở ứng dụng Tin nhắn (Messages/SMS) trên điện thoại để đọc mã và nhập vào ô bên dưới.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {otpSent && (
                                            <div className="flex flex-col sm:flex-row gap-3 pt-1 items-stretch sm:items-center">
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        maxLength={6}
                                                        autoFocus
                                                        placeholder="Nhập 6 số OTP"
                                                        value={otpCode}
                                                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                                        className="w-full sm:w-56 px-4 py-3 rounded-xl border-2 border-slate-300 bg-white text-base font-extrabold tracking-widest text-center text-slate-800 placeholder:text-slate-300 placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:border-[#007700] focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleVerifyOtp}
                                                    disabled={otpCode.length < 6}
                                                    className="px-6 py-3 bg-[#330033] hover:bg-[#4d004d] disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                                                >
                                                    Xác nhận OTP
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(2)}
                                    disabled={!phoneVerified}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#007700] hover:bg-[#005B00] disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer font-jakarta"
                                >
                                    <span>Tiếp tục: Phân loại kinh doanh</span>
                                    <ArrowRight size={15} />
                                </button>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div className="border-b border-slate-100 pb-4">
                                <h3 className="text-lg font-extrabold text-slate-900">Bước 2: Phân loại đối tượng bán hàng</h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Chọn hình thức kinh doanh phù hợp với quy mô hoạt động của bạn trên sàn VietCraft.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div
                                    onClick={() => setSellerType('INDIVIDUAL')}
                                    className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative ${sellerType === 'INDIVIDUAL'
                                        ? 'border-[#007700] bg-emerald-50/40 shadow-sm'
                                        : 'border-slate-200 hover:border-slate-300 bg-white'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#007700] flex items-center justify-center">
                                            <UserIcon size={24} />
                                        </div>
                                        <span className="text-[10px] font-extrabold px-2.5 py-1 bg-emerald-100 text-[#007700] rounded-full uppercase">
                                            Phổ biến
                                        </span>
                                    </div>
                                    <h4 className="font-extrabold text-base text-slate-900">Cá nhân / Nghệ nhân</h4>
                                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                                        Dành cho thợ thủ công, nghệ nhân làng nghề, cá nhân sáng tạo hoặc các gia đình tự chế tác sản phẩm.
                                    </p>
                                    <ul className="text-xs text-slate-500 mt-4 space-y-1.5 font-medium">
                                        <li>✓ CCCD/CMND chính chủ (2 mặt)</li>
                                        <li>✓ Ảnh chân dung rõ mặt</li>
                                        <li>✓ Tài khoản ngân hàng cá nhân</li>
                                    </ul>
                                </div>

                                <div
                                    onClick={() => setSellerType('BUSINESS')}
                                    className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative ${sellerType === 'BUSINESS'
                                        ? 'border-[#007700] bg-emerald-50/40 shadow-sm'
                                        : 'border-slate-200 hover:border-slate-300 bg-white'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#330033] flex items-center justify-center">
                                            <Building2 size={24} />
                                        </div>
                                        <span className="text-[10px] font-extrabold px-2.5 py-1 bg-purple-100 text-[#330033] rounded-full uppercase">
                                            Doanh nghiệp
                                        </span>
                                    </div>
                                    <h4 className="font-extrabold text-base text-slate-900">Hộ kinh doanh / Doanh nghiệp</h4>
                                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                                        Dành cho xưởng sản xuất, hợp tác xã thủ công mỹ nghệ, công ty POD và các đơn vị đã đăng ký kinh doanh.
                                    </p>
                                    <ul className="text-xs text-slate-500 mt-4 space-y-1.5 font-medium">
                                        <li>✓ Giấy phép Đăng ký Kinh doanh (GPKD)</li>
                                        <li>✓ Mã số thuế doanh nghiệp</li>
                                        <li>✓ CCCD Người đại diện pháp luật</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(1)}
                                    className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                    Quay lại
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(3)}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#007700] hover:bg-[#005B00] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer font-jakarta"
                                >
                                    <span>Tiếp tục: Thu thập thông tin KYC</span>
                                    <ArrowRight size={15} />
                                </button>
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-extrabold text-slate-900">
                                        Bước 3: Thu thập thông tin định danh (KYC)
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Đối tượng: <strong className="text-[#007700]">{sellerType === 'INDIVIDUAL' ? 'Cá nhân' : 'Hộ kinh doanh / Doanh nghiệp'}</strong>
                                    </p>
                                </div>
                                <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full font-semibold border border-emerald-200">
                                    <Lock size={13} /> Lưu trữ mã hóa AES-256
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700">
                                        Họ và tên trên CCCD <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="NGUYỄN VĂN A"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm uppercase focus:outline-none focus:border-[#007700] focus:ring-2 focus:ring-emerald-500/15"
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700">
                                        Số Căn cước công dân (12 số) <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        maxLength={12}
                                        placeholder="079200001234"
                                        value={idCardNumber}
                                        onChange={(e) => setIdCardNumber(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:border-[#007700] focus:ring-2 focus:ring-emerald-500/15"
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-700">Ngày sinh</label>
                                        <span className="text-[10.5px] text-slate-400 font-medium">Định dạng: Ngày/Tháng/Năm</span>
                                    </div>
                                    <div className="relative flex items-center">
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="DD/MM/YYYY"
                                            maxLength={10}
                                            value={dateOfBirth}
                                            onChange={(e) => setDateOfBirth(formatMaskedDateInput(e.target.value))}
                                            className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:border-[#007700] focus:ring-2 focus:ring-emerald-500/15 font-mono"
                                        />
                                        <div className="absolute right-3 flex items-center justify-center">
                                            <Calendar size={17} className="text-slate-400 hover:text-[#007700] transition-colors pointer-events-none" />
                                            <input
                                                type="date"
                                                tabIndex={-1}
                                                max={new Date().toISOString().split('T')[0]}
                                                value={toIsoDate(dateOfBirth)}
                                                onChange={(e) => {
                                                    if (e.target.value) {
                                                        setDateOfBirth(toDisplayDate(e.target.value));
                                                    }
                                                }}
                                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                                title="Mở lịch chọn ngày sinh"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-700">Ngày cấp CCCD</label>
                                        <span className="text-[10.5px] text-slate-400 font-medium">Định dạng: Ngày/Tháng/Năm</span>
                                    </div>
                                    <div className="relative flex items-center">
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="DD/MM/YYYY"
                                            maxLength={10}
                                            value={idIssueDate}
                                            onChange={(e) => setIdIssueDate(formatMaskedDateInput(e.target.value))}
                                            className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:border-[#007700] focus:ring-2 focus:ring-emerald-500/15 font-mono"
                                        />
                                        <div className="absolute right-3 flex items-center justify-center">
                                            <Calendar size={17} className="text-slate-400 hover:text-[#007700] transition-colors pointer-events-none" />
                                            <input
                                                type="date"
                                                tabIndex={-1}
                                                max={new Date().toISOString().split('T')[0]}
                                                value={toIsoDate(idIssueDate)}
                                                onChange={(e) => {
                                                    if (e.target.value) {
                                                        setIdIssueDate(toDisplayDate(e.target.value));
                                                    }
                                                }}
                                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                                title="Mở lịch chọn ngày cấp CCCD"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700">Nơi cấp </label>
                                    <input
                                        type="text"
                                        placeholder="Cục Cảnh sát QLHC về TTXH"
                                        value={idIssuePlace}
                                        onChange={(e) => setIdIssuePlace(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-[#007700] focus:ring-2 focus:ring-emerald-500/15"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700">Mã số thuế cá nhân</label>
                                    <input
                                        type="text"
                                        placeholder="8012345678"
                                        value={taxCode}
                                        onChange={(e) => setTaxCode(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-[#007700] focus:ring-2 focus:ring-emerald-500/15"
                                    />
                                </div>
                            </div>

                            {sellerType === 'BUSINESS' && (
                                <div className="pt-4 border-t border-slate-200 space-y-4">
                                    <h4 className="font-extrabold text-sm text-purple-900 flex items-center gap-1.5">
                                        <Building2 size={16} /> Thông tin Doanh nghiệp & Người đại diện
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1 sm:col-span-2">
                                            <label className="text-xs font-bold text-slate-700">
                                                Tên Doanh nghiệp / Hộ kinh doanh <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="CÔNG TY TNHH THỦ CÔNG VIỆTCRAFT"
                                                value={companyName}
                                                onChange={(e) => setCompanyName(e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm uppercase focus:outline-none focus:border-[#007700] focus:ring-2 focus:ring-emerald-500/15"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-700">Mã số thuế / Mã số doanh nghiệp</label>
                                            <input
                                                type="text"
                                                placeholder="0109123456"
                                                value={businessLicenseNumber}
                                                onChange={(e) => setBusinessLicenseNumber(e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-[#007700] focus:ring-2 focus:ring-emerald-500/15"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-700">Chức vụ người đại diện</label>
                                            <input
                                                type="text"
                                                placeholder="Giám đốc / Đại diện pháp luật"
                                                value={legalRepPosition}
                                                onChange={(e) => setLegalRepPosition(e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-[#007700] focus:ring-2 focus:ring-emerald-500/15"
                                            />
                                        </div>
                                        <div className="space-y-1 sm:col-span-2">
                                            <label className="text-xs font-bold text-slate-700">
                                                Họ tên người đại diện pháp luật <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="NGUYỄN VĂN A"
                                                value={legalRepName}
                                                onChange={(e) => setLegalRepName(e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm uppercase focus:outline-none focus:border-[#007700] focus:ring-2 focus:ring-emerald-500/15"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 border-t border-slate-200 space-y-4">
                                <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                                    <FileCheck size={16} /> Tải lên tài liệu định danh (Ảnh rõ nét, không lóa sáng)
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="p-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 hover:bg-slate-50 transition-colors flex flex-col items-center justify-center text-center space-y-2">
                                        <span className="text-xs font-bold text-slate-700">Mặt trước CCCD *</span>
                                        {frontIdFile ? (
                                            <div className="text-center space-y-1">
                                                <img src={frontIdFile.url} alt="Mặt trước" className="w-24 h-16 object-cover rounded-lg border mx-auto" />
                                                <span className="text-[11px] font-bold text-[#007700] block">✓ Đã tải lên</span>
                                            </div>
                                        ) : (
                                            <label className="cursor-pointer flex flex-col items-center">
                                                <UploadCloud className="text-slate-400 mb-1" size={24} />
                                                <span className="text-[11px] font-bold text-[#007700] hover:underline">
                                                    {uploadingDoc === 'front' ? 'Đang tải...' : 'Chọn ảnh'}
                                                </span>
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'front')} />
                                            </label>
                                        )}
                                    </div>

                                    <div className="p-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 hover:bg-slate-50 transition-colors flex flex-col items-center justify-center text-center space-y-2">
                                        <span className="text-xs font-bold text-slate-700">Mặt sau CCCD *</span>
                                        {backIdFile ? (
                                            <div className="text-center space-y-1">
                                                <img src={backIdFile.url} alt="Mặt sau" className="w-24 h-16 object-cover rounded-lg border mx-auto" />
                                                <span className="text-[11px] font-bold text-[#007700] block">✓ Đã tải lên</span>
                                            </div>
                                        ) : (
                                            <label className="cursor-pointer flex flex-col items-center">
                                                <UploadCloud className="text-slate-400 mb-1" size={24} />
                                                <span className="text-[11px] font-bold text-[#007700] hover:underline">
                                                    {uploadingDoc === 'back' ? 'Đang tải...' : 'Chọn ảnh'}
                                                </span>
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'back')} />
                                            </label>
                                        )}
                                    </div>

                                    <div className="p-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 hover:bg-slate-50 transition-colors flex flex-col items-center justify-center text-center space-y-2">
                                        <span className="text-xs font-bold text-slate-700">Ảnh chân dung</span>
                                        {portraitFile ? (
                                            <div className="text-center space-y-1">
                                                <img src={portraitFile.url} alt="Chân dung" className="w-16 h-16 object-cover rounded-full border mx-auto" />
                                                <span className="text-[11px] font-bold text-[#007700] block">✓ Đã tải lên</span>
                                            </div>
                                        ) : (
                                            <label className="cursor-pointer flex flex-col items-center">
                                                <UploadCloud className="text-slate-400 mb-1" size={24} />
                                                <span className="text-[11px] font-bold text-[#007700] hover:underline">
                                                    {uploadingDoc === 'portrait' ? 'Đang tải...' : 'Chọn ảnh'}
                                                </span>
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'portrait')} />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                {sellerType === 'BUSINESS' && (
                                    <div className="p-4 rounded-2xl border border-dashed border-purple-300 bg-purple-50/30 flex flex-col items-center justify-center text-center space-y-2">
                                        <span className="text-xs font-bold text-purple-900">Giấy phép ĐKKD (Ảnh chụp hoặc PDF) *</span>
                                        {businessLicenseFile ? (
                                            <span className="text-xs font-bold text-[#007700]">✓ Giấy phép kinh doanh đã tải lên</span>
                                        ) : (
                                            <label className="cursor-pointer flex flex-col items-center">
                                                <UploadCloud className="text-purple-400 mb-1" size={24} />
                                                <span className="text-[11px] font-bold text-[#330033] hover:underline">
                                                    {uploadingDoc === 'license' ? 'Đang tải...' : 'Tải lên Giấy phép kinh doanh (PDF/JPG/PNG)'}
                                                </span>
                                                <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleFileUpload(e, 'license')} />
                                            </label>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(2)}
                                    className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                    Quay lại
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!fullName || !idCardNumber) {
                                            setError('Vui lòng điền họ tên và số CCCD.');
                                            return;
                                        }
                                        if (sellerType === 'INDIVIDUAL' && (!frontIdFile || !backIdFile)) {
                                            setError('Vui lòng tải lên ảnh chụp 2 mặt Căn cước công dân.');
                                            return;
                                        }
                                        if (sellerType === 'BUSINESS' && (!companyName || !businessLicenseFile)) {
                                            setError('Vui lòng nhập tên công ty và tải lên Giấy phép kinh doanh.');
                                            return;
                                        }
                                        setError(null);
                                        setCurrentStep(4);
                                    }}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#007700] hover:bg-[#005B00] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer font-jakarta"
                                >
                                    <span>Tiếp tục: Thiết lập Gian hàng & Ngân hàng</span>
                                    <ArrowRight size={15} />
                                </button>
                            </div>
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <div className="border-b border-slate-100 pb-4">
                                <h3 className="text-lg font-extrabold text-slate-900">Bước 4: Thiết lập Gian hàng & Thanh toán</h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Thông tin này dùng để hiển thị thương hiệu và tự động đối soát thanh toán doanh thu định kỳ.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                                    <Store size={16} /> Thông tin Gian hàng
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-700">
                                            Tên Gian hàng (Shop Name) <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Gốm Mộc Bát Tràng"
                                            value={shopName}
                                            onChange={(e) => setShopName(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold focus:outline-none focus:border-[#007700] focus:ring-2 focus:ring-emerald-500/15"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-slate-700">
                                                Danh mục thủ công mỹ nghệ chủ đạo <span className="text-rose-500">*</span>
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (isCustomCategory) {
                                                        setIsCustomCategory(false);
                                                        if (!CRAFT_CATEGORIES.includes(mainCategory)) {
                                                            setMainCategory(CRAFT_CATEGORIES[0]);
                                                        }
                                                    } else {
                                                        setIsCustomCategory(true);
                                                        setMainCategory('');
                                                    }
                                                }}
                                                className="text-[11px] font-semibold text-[#007700] hover:text-[#005B00] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                                            >
                                                {isCustomCategory ? '📋 Chọn từ danh mục mẫu' : '✏️ Tự điền danh mục khác'}
                                            </button>
                                        </div>

                                        {isCustomCategory ? (
                                            <div className="space-y-1">
                                                <input
                                                    type="text"
                                                    autoFocus
                                                    placeholder="Nhập tên ngành nghề / danh mục của bạn (ví dụ: Trầm hương, Đồ da thủ công, Khảm xà cừ...)"
                                                    value={mainCategory}
                                                    onChange={(e) => setMainCategory(e.target.value)}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:border-[#007700] focus:ring-2 focus:ring-emerald-500/15"
                                                    required
                                                />
                                                <p className="text-[11px] text-slate-400">
                                                    Nhập ngành nghề / sản phẩm thủ công đặc thù của xưởng hoặc gian hàng của bạn.
                                                </p>
                                            </div>
                                        ) : (
                                            <select
                                                value={mainCategory}
                                                onChange={(e) => {
                                                    if (e.target.value === '__CUSTOM__') {
                                                        setIsCustomCategory(true);
                                                        setMainCategory('');
                                                    } else {
                                                        setMainCategory(e.target.value);
                                                    }
                                                }}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-[#007700] focus:ring-2 focus:ring-emerald-500/15 cursor-pointer"
                                            >
                                                {CRAFT_CATEGORIES.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                                <option value="__CUSTOM__">✨ Khác (Tự điền danh mục thủ công...)</option>
                                            </select>
                                        )}
                                    </div>
                                    <div className="space-y-1 sm:col-span-2">
                                        <label className="text-xs font-bold text-slate-700">Mô tả câu chuyện thương hiệu</label>
                                        <textarea
                                            rows={2}
                                            placeholder="Giới thiệu nét độc đáo, xuất xứ làng nghề truyền thống hoặc kỹ thuật chế tác..."
                                            value={shopDescription}
                                            onChange={(e) => setShopDescription(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-[#007700] focus:ring-2 focus:ring-emerald-500/15"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-200 space-y-4">
                                <h4 className="font-extrabold text-sm text-slate-900">Địa chỉ lấy hàng (Đơn vị vận chuyển sẽ tới lấy)</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-700">Người liên hệ gửi hàng</label>
                                        <input
                                            type="text"
                                            placeholder={fullName || 'Người đại diện kho'}
                                            value={recipientName}
                                            onChange={(e) => setRecipientName(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-[#007700] focus:ring-2 focus:ring-emerald-500/15"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-700">Số điện thoại liên hệ kho</label>
                                        <input
                                            type="text"
                                            placeholder={phone}
                                            value={pickupPhone}
                                            onChange={(e) => setPickupPhone(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-[#007700] focus:ring-2 focus:ring-emerald-500/15"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-700">Tỉnh / Thành phố <span className="text-rose-500">*</span></label>
                                        <input
                                            type="text"
                                            placeholder="Hà Nội"
                                            value={province}
                                            onChange={(e) => setProvince(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-[#007700] focus:ring-2 focus:ring-emerald-500/15"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-700">Quận / Huyện <span className="text-rose-500">*</span></label>
                                        <input
                                            type="text"
                                            placeholder="Gia Lâm"
                                            value={district}
                                            onChange={(e) => setDistrict(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-[#007700] focus:ring-2 focus:ring-emerald-500/15"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-700">Phường / Xã</label>
                                        <input
                                            type="text"
                                            placeholder="Bát Tràng"
                                            value={ward}
                                            onChange={(e) => setWard(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-[#007700] focus:ring-2 focus:ring-emerald-500/15"
                                        />
                                    </div>
                                    <div className="space-y-1 sm:col-span-2">
                                        <label className="text-xs font-bold text-slate-700">Địa chỉ cụ thể xưởng / kho hàng <span className="text-rose-500">*</span></label>
                                        <input
                                            type="text"
                                            placeholder="Số 25 ngõ 12, làng cổ Bát Tràng"
                                            value={specificAddress}
                                            onChange={(e) => setSpecificAddress(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-[#007700] focus:ring-2 focus:ring-emerald-500/15"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-200 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                                        <CreditCard size={16} /> Tài khoản ngân hàng nhận tiền quyết toán (Đối soát KYC)
                                    </h4>
                                    <span className="text-[11px] text-slate-500">Mã hóa AES-256 an toàn</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-700">Ngân hàng thụ hưởng <span className="text-rose-500">*</span></label>
                                        <select
                                            value={bankCode}
                                            onChange={(e) => setBankCode(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-[#007700] focus:ring-2 focus:ring-emerald-500/15"
                                        >
                                            {SUPPORTED_BANKS.map(b => (
                                                <option key={b.code} value={b.code}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-700">Số tài khoản ngân hàng <span className="text-rose-500">*</span></label>
                                        <input
                                            type="text"
                                            placeholder="1903456789012"
                                            value={accountNumber}
                                            onChange={(e) => setAccountNumber(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-mono font-bold focus:outline-none focus:border-[#007700] focus:ring-2 focus:ring-emerald-500/15"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-1 sm:col-span-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-slate-700">
                                                Tên chủ tài khoản (Phải khớp với giấy tờ định danh) <span className="text-rose-500">*</span>
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setAccountHolder(nameToCompare)}
                                                className="text-[11px] font-bold text-[#007700] hover:underline cursor-pointer"
                                            >
                                                Lấy theo tên trên CCCD: {nameToCompare}
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder={nameToCompare || 'NGUYEN VAN A'}
                                            value={accountHolder}
                                            onChange={(e) => setAccountHolder(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold uppercase focus:outline-none focus:border-[#007700] focus:ring-2 focus:ring-emerald-500/15"
                                            required
                                        />
                                    </div>
                                </div>

                                {accountHolder && (
                                    <div className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${isNameMatched
                                        ? 'bg-emerald-50 border-emerald-200 text-[#007700]'
                                        : 'bg-rose-50 border-rose-200 text-rose-700'
                                        }`}>
                                        {isNameMatched ? (
                                            <>
                                                <CheckCircle2 size={16} className="flex-shrink-0" />
                                                <span><strong>Đối soát hợp lệ:</strong> Tên chủ tài khoản ngân hàng hoàn toàn trùng khớp với tên trên giấy tờ định danh.</span>
                                            </>
                                        ) : (
                                            <>
                                                <AlertTriangle size={16} className="flex-shrink-0 text-rose-600" />
                                                <span><strong>Chưa khớp đối soát:</strong> Tên chủ tài khoản ngân hàng (<code>{accountHolder}</code>) không khớp với tên trên giấy tờ định danh (<code>{nameToCompare}</code>). Theo quy định pháp luật TMĐT, tên tài khoản nhận tiền phải chính chủ.</span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(3)}
                                    className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                    Quay lại
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!shopName) {
                                            setError('Vui lòng nhập tên gian hàng.');
                                            return;
                                        }
                                        if (!mainCategory || !mainCategory.trim()) {
                                            setError('Vui lòng chọn hoặc tự điền danh mục thủ công mỹ nghệ chủ đạo.');
                                            return;
                                        }
                                        if (!province || !district || !specificAddress) {
                                            setError('Vui lòng nhập đầy đủ Tỉnh/Thành phố, Quận/Huyện và địa chỉ lấy hàng chi tiết.');
                                            return;
                                        }
                                        if (!accountNumber || !accountHolder) {
                                            setError('Vui lòng nhập đầy đủ thông tin tài khoản ngân hàng.');
                                            return;
                                        }
                                        if (!isNameMatched) {
                                            setError('Tên chủ tài khoản ngân hàng chưa khớp với tên trên CCCD/Giấy phép kinh doanh.');
                                            return;
                                        }
                                        setError(null);
                                        setCurrentStep(5);
                                    }}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#007700] hover:bg-[#005B00] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer font-jakarta"
                                >
                                    <span>Tiếp tục: Ký kết & Pháp lý</span>
                                    <ArrowRight size={15} />
                                </button>
                            </div>
                        </div>
                    )}

                    {currentStep === 5 && (
                        <div className="space-y-6">
                            <div className="border-b border-slate-100 pb-4">
                                <h3 className="text-lg font-extrabold text-slate-900">Bước 5: Ký kết điện tử & Tuân thủ Pháp lý</h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Tuân thủ Nghị định 52/2013/NĐ-CP, Nghị định 85/2021/NĐ-CP và Nghị định 13/2023/NĐ-CP (PDPD) về bảo vệ dữ liệu cá nhân.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                    <FileText size={15} /> Điều khoản Dịch vụ dành cho Người bán VietCraft
                                </label>
                                <div className="h-44 overflow-y-auto p-4 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs text-slate-600 leading-relaxed space-y-3 shadow-inner">
                                    <p className="font-bold text-slate-900">1. NGHĨA VỤ VÀ TRÁCH NHIỆM CỦA NGƯỜI BÁN (SELLER):</p>
                                    <p>- Cam kết mọi sản phẩm đăng bán trên sàn VietCraft là hàng thủ công mỹ nghệ, sản phẩm in theo yêu cầu (POD) có nguồn gốc xuất xứ hợp pháp, không vi phạm bản quyền sở hữu trí tuệ hoặc hàng cấm theo pháp luật Việt Nam.</p>
                                    <p>- Cung cấp trung thực, đầy đủ và chính xác thông tin định danh cá nhân/doanh nghiệp, địa chỉ xưởng sản xuất và số tài khoản ngân hàng chính chủ.</p>
                                    <p className="font-bold text-slate-900">2. QUY ĐỊNH PHÁP LÝ TMĐT (Nghị định 52/2013/NĐ-CP & 85/2021/NĐ-CP):</p>
                                    <p>- Sàn VietCraft có trách nhiệm lưu trữ thông tin của Người bán và sẵn sàng cung cấp cho cơ quan quản lý nhà nước có thẩm quyền khi có yêu cầu (phục vụ quản lý thuế, chống hàng giả, bảo vệ quyền lợi người tiêu dùng).</p>
                                    <p className="font-bold text-slate-900">3. QUY CHUẨN ĐỐI SOÁT & CHI TRẢ DOANH THU:</p>
                                    <p>- Doanh thu bán hàng sau khi trừ phí nền tảng sẽ được quyết toán định kỳ vào tài khoản ngân hàng chính chủ đã được xác thực và đối soát tên khớp với hồ sơ định danh KYC.</p>
                                </div>
                                <label className="flex items-start gap-2.5 pt-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={agreedTerms}
                                        onChange={(e) => setAgreedTerms(e.target.checked)}
                                        className="mt-0.5 rounded text-[#007700] focus:ring-[#007700]"
                                    />
                                    <span className="text-xs font-bold text-slate-800">
                                        Tôi đã đọc kỹ và đồng ý với toàn bộ Điều khoản Dịch vụ Người bán của VietCraft.
                                    </span>
                                </label>
                            </div>

                            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-3">
                                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                                    <ShieldCheck size={18} className="text-[#007700]" />
                                    <span>Chính sách Bảo vệ Dữ liệu Cá nhân (Nghị định 13/2023/NĐ-CP - PDPD)</span>
                                </div>
                                <p className="text-xs text-emerald-950 leading-relaxed">
                                    Vì VietCraft thu thập dữ liệu nhạy cảm (ảnh CCCD, tài khoản ngân hàng), hệ thống cam kết mã hóa dữ liệu ở cấp độ schema (AES-256) và lưu trữ ảnh trên private storage. Bạn có toàn quyền yêu cầu rút hồ sơ hoặc xóa vĩnh viễn dữ liệu này nếu bạn ngừng hoạt động bán hàng trên nền tảng.
                                </p>
                                <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={agreedPdpd}
                                        onChange={(e) => setAgreedPdpd(e.target.checked)}
                                        className="mt-0.5 rounded text-[#007700] focus:ring-[#007700]"
                                    />
                                    <span className="text-xs font-bold text-emerald-900">
                                        Tôi đồng ý cho phép VietCraft xử lý dữ liệu định danh cá nhân phục vụ xác thực người bán và hiểu rõ quyền yêu cầu xóa dữ liệu của mình.
                                    </span>
                                </label>
                            </div>

                            <div className="space-y-2 pt-2">
                                <label className="text-xs font-bold text-slate-700">
                                    Ký tên xác nhận điện tử (Nhập họ và tên đầy đủ viết hoa) <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder={fullName || 'NGUYỄN VĂN A'}
                                    value={signature}
                                    onChange={(e) => setSignature(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold uppercase tracking-wide focus:outline-none focus:border-[#007700] focus:ring-2 focus:ring-emerald-500/15"
                                    required
                                />
                                <span className="text-[11px] text-slate-400 block">
                                    Họ tên được ký sẽ được lưu cùng địa chỉ IP và dấu thời gian chứng thực điện tử.
                                </span>
                            </div>

                            {error && (
                                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                                    <AlertCircle size={16} className="flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(4)}
                                    className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                    Quay lại
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={submitting || !agreedTerms || !agreedPdpd || !signature}
                                    className="inline-flex items-center gap-2 px-8 py-3 bg-[#007700] hover:bg-[#005B00] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer font-jakarta"
                                >
                                    {submitting ? (
                                        <>
                                            <RefreshCw className="animate-spin" size={16} />
                                            <span>Đang xử lý mã hóa & nộp hồ sơ...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Nộp hồ sơ xét duyệt KYC</span>
                                            <ArrowRight size={15} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {currentStep === 6 && (
                        <div className="py-6 text-center space-y-6">
                            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-[#007700] flex items-center justify-center mx-auto shadow-sm">
                                <Clock size={32} className="animate-pulse" />
                            </div>

                            <div className="space-y-2 max-w-lg mx-auto">
                                <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold uppercase tracking-wider">
                                    Trạng thái: Đang chờ phê duyệt (Pending Approval)
                                </span>
                                <h3 className="text-2xl font-extrabold text-slate-900">
                                    Hồ sơ đăng ký Người bán đã được tiếp nhận
                                </h3>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Hồ sơ định danh KYC và thông tin gian hàng của bạn đang được Ban Quản trị VietCraft đối soát và xét duyệt theo quy định. Thời gian dự kiến hoàn tất từ <strong>24 đến 48 giờ làm việc</strong>.
                                </p>
                            </div>

                            <div className="max-w-md mx-auto p-6 rounded-2xl bg-slate-50/80 border border-slate-200 text-left space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-full bg-[#007700] text-white flex items-center justify-center text-xs font-bold mt-0.5">
                                        ✓
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-900">Đã nộp hồ sơ định danh KYC</div>
                                        <div className="text-[11px] text-slate-500">Mã hóa dữ liệu & upload tài liệu thành công</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold mt-0.5 animate-pulse">
                                        2
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-900">Ban Quản trị đối soát thông tin</div>
                                        <div className="text-[11px] text-slate-500">Kiểm tra CCCD/GPKD và tên chủ tài khoản ngân hàng</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 opacity-50">
                                    <div className="w-7 h-7 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center text-xs font-bold mt-0.5">
                                        3
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-900">Kích hoạt Gian hàng & Cấp quyền Seller</div>
                                        <div className="text-[11px] text-slate-500">Nhận thông báo & email chúc mừng để bắt đầu đăng bán</div>
                                    </div>
                                </div>
                            </div>

                            {app && (
                                <div className="max-w-md mx-auto p-4 bg-white border border-slate-200 rounded-xl text-left text-xs text-slate-600 space-y-1.5">
                                    <div className="font-bold text-slate-800 pb-1 border-b border-slate-100">Thông tin đã nộp:</div>
                                    <div>Gian hàng: <strong>{app.shop_info?.shop_name}</strong></div>
                                    <div>Họ tên định danh: <strong>{app.kyc_data?.full_name}</strong></div>
                                    <div>Ngân hàng: <strong>{app.bank_info?.bank_name} ({app.bank_info?.account_number_masked})</strong></div>
                                </div>
                            )}

                            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => navigate('/')}
                                    className="w-full sm:w-auto px-6 py-2.5 bg-[#007700] hover:bg-[#005B00] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                                >
                                    Về trang chủ mua sắm
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCancelApplication}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                                    title="Quyền hủy bỏ và xóa dữ liệu theo Nghị định 13/2023/NĐ-CP"
                                >
                                    <Trash2 size={14} /> Yêu cầu hủy hồ sơ & Xóa dữ liệu KYC
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal xác nhận hủy hồ sơ KYC */}
            <ConfirmModal
                isOpen={showCancelKycModal}
                variant="danger"
                title="Xác nhận hủy hồ sơ & Xóa dữ liệu KYC"
                message={`Bạn có chắc chắn muốn hủy đơn đăng ký và xóa toàn bộ dữ liệu định danh KYC cá nhân khỏi hệ thống theo Nghị định 13/2023/NĐ-CP?\n\nThao tác này không thể hoàn tác và bạn sẽ cần bắt đầu lại từ đầu.`}
                confirmLabel="Hủy hồ sơ & Xóa dữ liệu"
                cancelLabel="Giữ lại hồ sơ"
                isLoading={cancellingKyc}
                onConfirm={handleConfirmCancelKyc}
                onCancel={() => setShowCancelKycModal(false)}
            />
        </div>
    );
}

export default SellerRegisterPage;
