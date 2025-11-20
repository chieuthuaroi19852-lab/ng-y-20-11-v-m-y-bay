import React, { useState, useEffect, useMemo } from 'react';
import { AdminFeeConfig, BookingData, FeeConfig, User, Admin } from '../types';
import * as adminService from '../services/adminService';
import * as authService from '../services/authService';
import * as emailService from '../services/emailService';
import ETicket from './ETicket';
import ChangeCredentialsModal from './ChangeCredentialsModal';
import { CloseIcon, InfoIcon, DownloadIcon, TrashIcon, EditIcon, CheckCircleIcon, UserGroupIcon, PlusIcon, CreditCardIcon, ArrowLeftIcon, MailIcon, ChevronLeftIcon, ChevronRightIcon } from './icons/Icons';
import { AIRPORTS } from '../constants';
import { PROXY_URL, BACKUP_API_URL } from '../services/apiConfig';


interface AdminPageProps {
    onExitAdmin: () => void;
}

// Fix: Defined the missing `getCityName` function to resolve airport codes to city names.
const getCityName = (airportId: string): string => {
    const airport = AIRPORTS.find(a => a.id === airportId);
    return airport ? airport.name.replace(/\s*\([^)]+\)/, '').trim() : airportId;
};


// --- Login Component ---
const AdminLogin: React.FC<{ onLoginSuccess: () => void, onExit: () => void }> = ({ onLoginSuccess, onExit }) => {
    const [loginInput, setLoginInput] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const success = await adminService.login(loginInput, password);
            if (success) {
                onLoginSuccess();
            } else {
                setError('Tên đăng nhập hoặc mật khẩu không đúng.');
            }
        } catch (err) {
             setError('Lỗi kết nối. Vui lòng kiểm tra mạng hoặc server.');
        } finally {
             setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-sm">
                <h1 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-white">Quản trị hệ thống</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Email / Tên đăng nhập</label>
                        <input
                            type="text"
                            value={loginInput}
                            onChange={e => setLoginInput(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-transparent text-gray-900 dark:text-white"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Mật khẩu</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-transparent text-gray-900 dark:text-white"
                            required
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button type="submit" disabled={isLoading} className="w-full bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-400">
                        {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>
                    
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button type="button" onClick={onExit} className="w-full flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors">
                            <ArrowLeftIcon className="w-4 h-4 mr-2"/> Quay lại trang chủ
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ... FeeConfiguration (unchanged) ...
const FeeConfiguration: React.FC<{ initialConfig: AdminFeeConfig }> = ({ initialConfig }) => {
    const [config, setConfig] = useState<AdminFeeConfig>(initialConfig);
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    useEffect(() => { setConfig(initialConfig); }, [initialConfig]);
    const handleGlobalChange = (group: any, field: any, value: any) => {
        setConfig(prev => ({ ...prev, [group]: { ...(prev as any)[group], [field]: field.endsWith('value') ? Number(value) : value } }));
    };
    const handleAirlineChange = (code: string, field: keyof FeeConfig, value: any) => {
        setConfig(prev => ({ ...prev, airlines: { ...prev.airlines, [code]: { ...(prev.airlines[code] || prev.default), [field]: field.endsWith('value') ? Number(value) : value } } }));
    };
    const handleSave = async () => {
        setStatus('saving');
        await adminService.saveFeeConfig(config);
        setTimeout(() => { setStatus('saved'); setTimeout(() => setStatus('idle'), 2000); }, 1000);
    };
    const renderFeeInputGroup = (groupKey: any, title: string) => {
        const group = (config as any)[groupKey];
        if (!group) return null;
        return (
            <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
                     <div><label className="block text-sm mb-1">Loại phí DV</label><select value={group.service_type} onChange={e => handleGlobalChange(groupKey, 'service_type', e.target.value)} className="w-full p-2 border rounded bg-transparent"><option value="fixed">Cố định</option><option value="percent">Phần trăm</option></select></div>
                    <div><label className="block text-sm mb-1">Giá trị phí DV</label><input type="number" value={group.service_value} onChange={e => handleGlobalChange(groupKey, 'service_value', e.target.value)} className="w-full p-2 border rounded bg-transparent"/></div>
                     <div><label className="block text-sm mb-1">Loại thuế</label><select value={group.tax_type} onChange={e => handleGlobalChange(groupKey, 'tax_type', e.target.value)} className="w-full p-2 border rounded bg-transparent"><option value="fixed">Cố định</option><option value="percent">Phần trăm</option></select></div>
                    <div><label className="block text-sm mb-1">Giá trị thuế</label><input type="number" value={group.tax_value} onChange={e => handleGlobalChange(groupKey, 'tax_value', e.target.value)} className="w-full p-2 border rounded bg-transparent"/></div>
                    <div><label className="block text-sm mb-1">Tiền tệ</label><input type="text" value={group.currency || 'VND'} onChange={e => handleGlobalChange(groupKey, 'currency', e.target.value)} className="w-full p-2 border rounded bg-transparent"/></div>
                </div>
            </div>
        );
    };
     const renderAirlineFeeGroup = (code: string, name: string) => {
        const group = config.airlines[code] || config.default;
        return (
            <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <h3 className="font-semibold text-lg mb-2">{name} ({code})</h3>
                <div className="grid grid-cols-2 gap-4">
                     <div><label className="block text-sm mb-1">Loại phí DV</label><select value={group.service_type} onChange={e => handleAirlineChange(code, 'service_type', e.target.value)} className="w-full p-2 border rounded bg-transparent"><option value="fixed">Cố định</option><option value="percent">Phần trăm</option></select></div>
                    <div><label className="block text-sm mb-1">Giá trị phí DV</label><input type="number" value={group.service_value} onChange={e => handleAirlineChange(code, 'service_value', e.target.value)} className="w-full p-2 border rounded bg-transparent"/></div>
                </div>
            </div>
        );
    };
    return (
        <div className="space-y-6">
            {renderFeeInputGroup('default', 'Cấu hình Mặc định')}
            {renderFeeInputGroup('domestic', 'Cấu hình Quốc nội')}
            {renderFeeInputGroup('international', 'Cấu hình Quốc tế')}
            <h2 className="text-xl font-bold pt-4 border-t">Cấu hình riêng cho Hãng bay</h2>
            {renderAirlineFeeGroup('VN', 'Vietnam Airlines')}
            {renderAirlineFeeGroup('VJ', 'Vietjet Air')}
            {renderAirlineFeeGroup('QH', 'Bamboo Airways')}
            <button onClick={handleSave} disabled={status === 'saving'} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400">{status === 'saving' ? 'Đang lưu...' : status === 'saved' ? 'Đã lưu!' : 'Lưu Cấu hình'}</button>
        </div>
    );
};

// --- Payment Processing Modal (CRITICAL FIX: Auto Sync Status) ---
const PaymentProcessingModal: React.FC<{ booking: BookingData; onClose: () => void; onSuccess: () => void }> = ({ booking, onClose, onSuccess }) => {
    const [amount, setAmount] = useState(booking.total_amount || 0);
    const [method, setMethod] = useState('transfer'); 
    const [txnId, setTxnId] = useState(booking.id || ''); 
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (booking) {
            let finalAmount = booking.total_amount || 0;
            // Fallback calculation if total is 0 and data is safe to access
            if (finalAmount === 0 && booking.flight && !Array.isArray(booking.flight)) {
                 const paxCount = (Array.isArray(booking.passengers) && booking.passengers.length > 0) ? booking.passengers.length : 1;
                 const price = booking.flight.price_net || 0; 
                 finalAmount = price * paxCount * 1.15; 
                 if (booking.ancillaries?.outboundBaggage) finalAmount += (booking.ancillaries.outboundBaggage.price || 0);
                 if (booking.ancillaries?.inboundBaggage) finalAmount += (booking.ancillaries.inboundBaggage.price || 0);
            }
            setAmount(Math.round(finalAmount));
            setTxnId(booking.id || '');
        }
    }, [booking]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            // 1. PROCESS PAYMENT
            let paymentResult;
            // FIX: 'cashPayment' does not exist. Use processPayment with appropriate info.
            if (method === 'cash') {
                const paymentInfo = { method: 'cash', note: txnId, date: new Date().toISOString() };
                paymentResult = await adminService.processPayment(booking.id, amount, paymentInfo);
            } else {
                const paymentInfo = { method, transaction_id: txnId, date: new Date().toISOString() };
                paymentResult = await adminService.processPayment(booking.id, amount, paymentInfo);
            }

            if (!paymentResult.success) {
                alert("Lỗi xử lý thanh toán: " + paymentResult.message);
                setIsLoading(false);
                return;
            }

            // 2. AUTO-UPDATE BOOKING STATUS TO 'confirmed' (Synchronous Flow)
            // This ensures the ticket status turns BLUE (Confirmed) when payment is GREEN (Paid)
            const statusResult = await adminService.updateBookingStatus(booking.id, 'confirmed', `Thanh toán hoàn tất (${method})`);
            
            if (!statusResult.success) {
                console.warn("Payment recorded but failed to auto-confirm ticket:", statusResult.message);
            }

            // 3. SEND EMAIL (With updated statuses)
            const paymentInfoFinal = method === 'cash' ? { method: 'Tiền mặt', date: new Date().toISOString() } : { method, transaction_id: txnId, date: new Date().toISOString() };
            
            const updatedBookingForEmail: BookingData = { 
                ...booking, 
                status: 'confirmed',       // Force confirmed for email
                payment_status: 'paid',    // Force paid for email
                payment_info: paymentInfoFinal 
            };
            
            await emailService.sendConfirmationEmail(updatedBookingForEmail);
             
            alert("Thành công! Đã thu tiền, xác nhận vé và gửi email cho khách hàng.");
            onSuccess(); // Refetch data
            onClose();

        } catch (err) {
            console.error(err);
            alert("Đã xảy ra lỗi hệ thống trong quá trình xử lý.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[130] p-4">
            <div className="bg-[var(--card-bg-color)] p-6 rounded-lg shadow-lg w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">Xác nhận Thanh toán</h3>
                <p className="text-sm mb-4">Đơn hàng: <span className="font-bold">{booking.pnr}</span></p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Số tiền thực thu</label>
                        <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} className="w-full p-2 border rounded bg-transparent" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Phương thức</label>
                        <select value={method} onChange={e => setMethod(e.target.value)} className="w-full p-2 border rounded bg-transparent">
                            <option value="transfer">Chuyển khoản ngân hàng</option>
                            <option value="cash">Tiền mặt</option>
                            <option value="gateway">Cổng thanh toán (VNPay/Momo)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Mã giao dịch / Ghi chú</label>
                        <input type="text" value={txnId} onChange={e => setTxnId(e.target.value)} className="w-full p-2 border rounded bg-transparent" placeholder="VD: FT234..." required />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-gray-800">Hủy</button>
                        <button type="submit" disabled={isLoading} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                            {isLoading ? 'Đang xử lý...' : 'Xác nhận Đã thu tiền'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- EditUserModal: FIXED ---
const EditUserModal: React.FC<{ user: User; onClose: () => void; onSave: () => void }> = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState(user);
    const [isLoading, setIsLoading] = useState(false);
    const [pointsDelta, setPointsDelta] = useState(0); 

    useEffect(() => {
        let genderVal = 'Mr';
        const g = user.gender ? String(user.gender).toLowerCase() : ''; 
        if (g === 'female' || g === 'mrs' || g === 'miss' || g === 'nữ' || g === 'nu') {
            genderVal = 'Mrs';
        }
        
        setFormData({
            ...user,
            gender: genderVal,
            dob: user.dob || '',
            id_card: user.id_card || '',
            address: user.address || '',
            nationality: user.nationality || ''
        });
        setPointsDelta(0);
    }, [user]);

    const handleChange = (field: keyof User, value: string) => { setFormData(prev => ({ ...prev, [field]: value })); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        const updateResult = await adminService.updateUser(formData);
        
        if (pointsDelta !== 0 && user.id) {
            await adminService.updateLoyaltyPoints(user.id, pointsDelta);
        }

        setIsLoading(false);
        if (updateResult.success) {
            onSave();
        } else {
            alert(updateResult.message || 'Có lỗi xảy ra.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[120]">
             <div className="bg-[var(--card-bg-color)] p-6 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-bold mb-4">Chỉnh sửa người dùng</h3>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <input type="text" placeholder="Tên" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} className="w-full p-2 border rounded bg-transparent" required />
                    <input type="email" placeholder="Email" value={formData.email || ''} onChange={e => handleChange('email', e.target.value)} className="w-full p-2 border rounded bg-transparent" required />
                    <input type="text" placeholder="SĐT" value={formData.phone || ''} onChange={e => handleChange('phone', e.target.value)} className="w-full p-2 border rounded bg-transparent" required />
                    
                    <div className="grid grid-cols-2 gap-2">
                        <input type="date" placeholder="Ngày sinh" value={formData.dob || ''} onChange={e => handleChange('dob', e.target.value)} className="w-full p-2 border rounded bg-transparent" />
                        <select value={formData.gender || 'Mr'} onChange={e => handleChange('gender', e.target.value)} className="w-full p-2 border rounded bg-transparent"><option value="Mr">Nam</option><option value="Mrs">Nữ</option></select>
                    </div>

                    <input type="text" placeholder="CMND/CCCD" value={formData.id_card || ''} onChange={e => handleChange('id_card', e.target.value)} className="w-full p-2 border rounded bg-transparent" />
                    <input type="text" placeholder="Địa chỉ" value={formData.address || ''} onChange={e => handleChange('address', e.target.value)} className="w-full p-2 border rounded bg-transparent" />
                    <input type="text" placeholder="Quốc tịch" value={formData.nationality || ''} onChange={e => handleChange('nationality', e.target.value)} className="w-full p-2 border rounded bg-transparent" />
                    
                    <div className="border-t pt-3 mt-3">
                        <label className="block text-sm font-bold mb-1">Điểm tích lũy hiện tại: {user.loyalty_points || 0}</label>
                        <div className="flex items-center gap-2"><span className="text-sm">Cộng/Trừ thêm:</span><input type="number" value={pointsDelta} onChange={e => setPointsDelta(Number(e.target.value))} className="w-24 p-1 border rounded text-sm"/></div>
                        <p className="text-xs text-gray-500 mt-1">Nhập số âm để trừ điểm.</p>
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-gray-800">Hủy</button>
                        <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{isLoading ? 'Đang lưu...' : 'Lưu'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AdminModal: React.FC<{ admin?: Admin | null; onClose: () => void; onSave: () => void }> = ({ admin, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Admin> & { password?: string }>({ name: '', username: '', role: 'admin', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    useEffect(() => { if (admin) { setFormData({ ...admin }); } }, [admin]);
    const handleChange = (field: string, value: string) => { setFormData(prev => ({ ...prev, [field]: value })); };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setIsLoading(true);
        let result;
        if (admin) { result = await adminService.updateAdmin(formData as Admin); } 
        else { if (!formData.password) { alert("Mật khẩu là bắt buộc khi tạo mới."); setIsLoading(false); return; } result = await adminService.createAdmin(formData as any); }
        setIsLoading(false); if (result.success) { onSave(); } else { alert(result.message); }
    };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[120]">
             <div className="bg-[var(--card-bg-color)] p-6 rounded-lg shadow-lg w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">{admin ? 'Sửa Admin' : 'Thêm Admin Mới'}</h3>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <input type="text" placeholder="Tên hiển thị" value={formData.name} onChange={e => handleChange('name', e.target.value)} className="w-full p-2 border rounded bg-transparent" required />
                    <input type="text" placeholder="Tên đăng nhập (Username)" value={formData.username} onChange={e => handleChange('username', e.target.value)} className="w-full p-2 border rounded bg-transparent" required />
                    <select value={formData.role} onChange={e => handleChange('role', e.target.value)} className="w-full p-2 border rounded bg-transparent"><option value="admin">Admin</option><option value="superadmin">Super Admin</option></select>
                    {!admin && ( <input type="password" placeholder="Mật khẩu" value={formData.password} onChange={e => handleChange('password', e.target.value)} className="w-full p-2 border rounded bg-transparent" required /> )}
                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-gray-800">Hủy</button>
                        <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{isLoading ? 'Đang lưu...' : 'Lưu'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ResetPasswordModal: React.FC<{ userId: number | string; type: 'user' | 'admin'; onClose: () => void }> = ({ userId, type, onClose }) => {
    const [newPassword, setNewPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); if(newPassword.length < 6) return alert("Mật khẩu tối thiểu 6 ký tự");
        setIsLoading(true); let result;
        if (type === 'admin') { result = await adminService.resetAdminPassword(userId, newPassword); } else { result = await adminService.resetUserPassword(userId, newPassword); }
        setIsLoading(false); if (result.success) { alert("Đã đổi mật khẩu thành công"); onClose(); } else { alert(result.message); }
    };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[120]">
             <div className="bg-[var(--card-bg-color)] p-6 rounded-lg shadow-lg w-full max-w-sm">
                <h3 className="text-lg font-bold mb-4">Reset Mật khẩu {type === 'admin' ? 'Admin' : 'User'}</h3>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <input type="password" placeholder="Mật khẩu mới" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-2 border rounded bg-transparent" required />
                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-gray-800">Hủy</button>
                        <button type="submit" disabled={isLoading} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">{isLoading ? 'Đang xử lý...' : 'Xác nhận'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- BookingsManager Component ---
interface BookingsManagerProps {
    allBookings: BookingData[];
    fetchData: () => void;
    onSelectBooking: (booking: BookingData) => void;
    onProcessPayment: (booking: BookingData) => void;
    onResendEmail: (booking: BookingData) => void;
    onCancelBooking: (bookingId: string) => void;
    onDeleteBooking: (bookingId: string) => void;
    onUpdateStatus: (bookingId: string, newStatus: string) => void;
    sendingEmailId: string | null;
    isUpdatingStatus: string | null;
}

const BookingsManager: React.FC<BookingsManagerProps> = (props) => {
    const { 
        allBookings, onSelectBooking, onProcessPayment, onResendEmail, onCancelBooking, onDeleteBooking, onUpdateStatus, sendingEmailId, isUpdatingStatus
    } = props;

    const [filter, setFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const bookingsPerPage = 15;

    const filteredBookings = useMemo(() => {
        return allBookings
            .filter(b => {
                if (statusFilter !== 'all' && b.status !== statusFilter) return false;
                if (!filter) return true;
                const lowerFilter = filter.toLowerCase();
                return (
                    b.pnr?.toLowerCase().includes(lowerFilter) ||
                    b.id?.toLowerCase().includes(lowerFilter) ||
                    b.contact?.fullName?.toLowerCase().includes(lowerFilter) ||
                    b.contact?.email?.toLowerCase().includes(lowerFilter) ||
                    b.contact?.phone?.toLowerCase().includes(lowerFilter)
                );
            })
            .sort((a, b) => new Date(b.bookingTimestamp).getTime() - new Date(a.bookingTimestamp).getTime());
    }, [allBookings, filter, statusFilter]);

    const totalPages = Math.ceil(filteredBookings.length / bookingsPerPage);
    const currentBookings = filteredBookings.slice((currentPage - 1) * bookingsPerPage, currentPage * bookingsPerPage);

    // SEPARATED BADGES FOR CLARITY
    const getPaymentBadge = (status?: string) => {
        switch (status) {
            case 'paid': return <span className="text-xs font-bold px-2 py-1 rounded bg-green-100 text-green-700 border border-green-200 whitespace-nowrap">🟢 Đã thanh toán</span>;
            case 'refunded': return <span className="text-xs font-bold px-2 py-1 rounded bg-purple-100 text-purple-700 border border-purple-200 whitespace-nowrap">🟣 Đã hoàn tiền</span>;
            default: return <span className="text-xs font-bold px-2 py-1 rounded bg-yellow-100 text-yellow-700 border border-yellow-200 whitespace-nowrap">🟡 Chờ thanh toán</span>;
        }
    };

    const getBookingStatusBadge = (status?: string) => {
        switch (status) {
            case 'confirmed': return <span className="text-xs font-bold px-2 py-1 rounded bg-blue-100 text-blue-700 border border-blue-200 whitespace-nowrap">🟦 Đã xác nhận</span>;
            case 'cancelled': return <span className="text-xs font-bold px-2 py-1 rounded bg-red-100 text-red-700 border border-red-200 whitespace-nowrap">🟥 Đã hủy</span>;
            default: return <span className="text-xs font-bold px-2 py-1 rounded bg-gray-100 text-gray-700 border border-gray-200 whitespace-nowrap">⬜ Mới / Chờ</span>;
        }
    };
    
    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Danh sách Đơn hàng ({filteredBookings.length})</h2>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-4">
                <input type="text" placeholder="Tìm theo PNR, Tên, SĐT, Email..." value={filter} onChange={e => setFilter(e.target.value)} className="flex-grow p-2 border rounded bg-transparent" />
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="p-2 border rounded bg-transparent">
                    <option value="all">Tất cả trạng thái</option>
                    <option value="pending">Chờ xử lý</option>
                    <option value="confirmed">Đã xác nhận</option>
                    <option value="cancelled">Đã hủy</option>
                </select>
            </div>

            {/* Bookings Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th className="p-3">PNR / Mã ĐH</th>
                            <th className="p-3">Khách hàng</th>
                            <th className="p-3">Hành trình</th>
                            <th className="p-3">Tổng tiền</th>
                            <th className="p-3">Thanh toán</th>
                            <th className="p-3">Trạng thái vé</th>
                            <th className="p-3">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                         {currentBookings.length > 0 ? currentBookings.map(b => (
                           <tr key={b.id} className="border-b dark:border-gray-700">
                                <td className="p-3">
                                    <button onClick={() => onSelectBooking(b)} className="font-bold text-red-600 hover:underline">{b.pnr}</button>
                                    <div className="text-xs text-gray-500">{b.id}</div>
                                </td>
                                <td className="p-3">
                                    <div className="font-semibold">{b.contact.fullName}</div>
                                    <div className="text-xs text-gray-500">{b.contact.phone}</div>
                                </td>
                                <td className="p-3">
                                     {b.flight.flights.length > 0 ?
                                        `${getCityName(b.flight.flights[0].departure_airport.id)} → ${getCityName(b.flight.flights[b.flight.flights.length - 1].arrival_airport.id)}`
                                        : 'N/A'
                                     }
                                     <div className="text-xs text-gray-500">{new Date(b.bookingTimestamp).toLocaleString('vi-VN')}</div>
                                </td>
                                <td className="p-3 font-bold text-red-600">{new Intl.NumberFormat('vi-VN').format(b.total_amount || 0)}đ</td>
                                <td className="p-3">{getPaymentBadge(b.payment_status)}</td>
                                <td className="p-3">{getBookingStatusBadge(b.status)}</td>
                                <td className="p-3">
                                    <div className="flex gap-2 items-center flex-wrap">
                                        {/* Thu Tiền Button */}
                                        <button 
                                            onClick={() => onProcessPayment(b)} 
                                            disabled={b.payment_status === 'paid'} 
                                            className="bg-green-100 text-green-700 p-1.5 rounded hover:bg-green-200 disabled:opacity-30 disabled:cursor-not-allowed" 
                                            title="Thu tiền (Xác nhận ngay)"
                                        >
                                            <CreditCardIcon className="w-4 h-4" />
                                        </button>

                                        {/* Status Selector */}
                                        <select 
                                            value={b.status || 'pending'}
                                            onChange={(e) => onUpdateStatus(b.id, e.target.value)}
                                            disabled={isUpdatingStatus === b.id}
                                            className="text-xs p-1 border rounded bg-transparent max-w-[110px]"
                                        >
                                            <option value="pending">Mới / Chờ</option>
                                            <option value="confirmed">Xác nhận</option>
                                            <option value="cancelled">Hủy vé</option>
                                        </select>

                                         <button onClick={() => onResendEmail(b)} disabled={sendingEmailId === b.id} className="text-blue-600 hover:text-blue-800 disabled:opacity-50" title="Gửi lại email">
                                            {sendingEmailId === b.id ? <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div> : <MailIcon className="w-4 h-4"/>}
                                        </button>
                                        
                                        {b.status !== 'cancelled' && (
                                            <button onClick={() => onCancelBooking(b.id)} className="text-orange-600 hover:text-orange-800" title="Hủy vé (ghi lý do)">
                                                <CloseIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button onClick={() => onDeleteBooking(b.id)} className="text-red-600 hover:text-red-800" title="Xóa">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={7} className="text-center p-4">Không có đơn hàng nào.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 disabled:opacity-50"><ChevronLeftIcon /></button>
                    <span>Trang {currentPage} / {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 disabled:opacity-50"><ChevronRightIcon /></button>
                </div>
            )}
        </div>
    );
};


// --- Main Dashboard Component ---
const AdminDashboard: React.FC<{ onLogout: () => void, onExitAdmin: () => void }> = ({ onLogout, onExitAdmin }) => {
    const [activeTab, setActiveTab] = useState<'bookings' | 'fees' | 'users' | 'admins'>('bookings');
    const [bookings, setBookings] = useState<BookingData[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [feeConfig, setFeeConfig] = useState<AdminFeeConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null);
    const [paymentBooking, setPaymentBooking] = useState<BookingData | null>(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
    
    const [isDownloading, setIsDownloading] = useState(false);
    const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
    
    // Modal states
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [resetPasswordData, setResetPasswordData] = useState<{id: string|number, type: 'user'|'admin'} | null>(null);
    const [editingAdmin, setEditingAdmin] = useState<Admin | null | undefined>(undefined);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [bookingsData, usersData, feeConfigData, adminsData] = await Promise.all([
                adminService.getAllBookings(),
                authService.getAllUsers(),
                adminService.getFeeConfig(),
                adminService.getAdmins()
            ]);
            setBookings(bookingsData);
            setUsers(usersData);
            setFeeConfig(feeConfigData);
            setAdmins(adminsData);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);
    
    const handleLogout = () => {
        adminService.logout();
        onLogout();
    }
    
    const handleDownloadBackup = async () => {
        setIsDownloading(true);
        try {
            const response = await fetch(`${PROXY_URL}${BACKUP_API_URL}`);
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'flight_app_data.json';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error('Download failed:', error);
            alert('Không thể tải xuống bản sao lưu. Vui lòng kiểm tra console để biết chi tiết.');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDeleteUser = async (userId: string | number) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa người dùng này và tất cả đơn hàng liên quan?")) {
            const result = await adminService.deleteUser(userId);
            if (result.success) {
                fetchData();
            } else {
                alert(result.message);
            }
        }
    }
    
    const handleDeleteAdmin = async (id: string | number) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa Admin này?")) {
            const result = await adminService.deleteAdmin(id);
            if (result.success) {
                fetchData();
            } else {
                alert(result.message);
            }
        }
    }

    const handleDeleteBooking = async (bookingId: string) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa đơn hàng này?")) {
            const result = await adminService.deleteBooking(bookingId);
            if (result.success) {
                fetchData();
            } else {
                alert(result.message);
            }
        }
    }
    
    const handleCancelBooking = async (bookingId: string) => {
        const reason = prompt("Vui lòng nhập lý do hủy vé:", "Khách yêu cầu hủy");
        if (reason) {
             const result = await adminService.cancelBooking(bookingId, reason);
             if (result.success) {
                 // Also send email notification
                 const booking = bookings.find(b => b.id === bookingId);
                 if(booking) {
                     emailService.sendConfirmationEmail({ ...booking, status: 'cancelled' });
                 }
                 alert("Đã hủy đơn hàng và cập nhật trạng thái.");
                 fetchData();
             } else {
                 alert(result.message);
             }
        }
    }

    const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
        const bookingToUpdate = bookings.find(b => b.id === bookingId);
        if (!bookingToUpdate) return;

        const confirmMsg = `Bạn có chắc chắn muốn đổi trạng thái sang "${newStatus}"?`;
        if (!window.confirm(confirmMsg)) return;

        setIsUpdatingStatus(bookingId);
        
        const note = prompt("Ghi chú admin (tùy chọn):", bookingToUpdate.admin_note || "");
        
        const result = await adminService.updateBookingStatus(bookingId, newStatus, note || '');
        
        if (result.success) {
            // Update local state optimistically or refetch
            const updatedBookingData: BookingData = {
                ...bookingToUpdate,
                status: newStatus,
                admin_note: note || ''
            };
            try {
                // Only send email if specific statuses are reached, or notify user manually
                if (newStatus === 'confirmed' || newStatus === 'cancelled') {
                     await emailService.sendConfirmationEmail(updatedBookingData);
                }
                alert(`Đã cập nhật trạng thái thành công.`);
            } catch (emailErr) {
                console.error(emailErr);
            }
            await fetchData();
        } else {
            alert("Lỗi cập nhật: " + (result.message || 'Lỗi không xác định'));
        }
        setIsUpdatingStatus(null);
    }

    const handleResendEmail = async (booking: BookingData) => {
        if (!confirm(`Gửi lại email xác nhận/vé điện tử cho ${booking.contact.email}?`)) return;
        setSendingEmailId(booking.id);
        try {
            const res = await emailService.sendConfirmationEmail(booking);
            if(res.success) alert("Đã gửi lại email thành công!");
            else alert("Gửi thất bại: " + res.message);
        } catch(e) {
            alert("Lỗi kết nối khi gửi mail.");
        } finally {
            setSendingEmailId(null);
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            {editingUser && (
                <EditUserModal 
                    user={editingUser} 
                    onClose={() => setEditingUser(null)} 
                    onSave={() => { setEditingUser(null); fetchData(); }} 
                />
            )}
            {resetPasswordData && (
                <ResetPasswordModal 
                    userId={resetPasswordData.id}
                    type={resetPasswordData.type}
                    onClose={() => setResetPasswordData(null)} 
                />
            )}
            {editingAdmin !== undefined && (
                <AdminModal
                    admin={editingAdmin}
                    onClose={() => setEditingAdmin(undefined)}
                    onSave={() => { setEditingAdmin(undefined); fetchData(); }}
                />
            )}
            {paymentBooking && (
                <PaymentProcessingModal 
                    booking={paymentBooking}
                    onClose={() => setPaymentBooking(null)}
                    onSuccess={() => { setPaymentBooking(null); fetchData(); }}
                />
            )}

            <header className="bg-white dark:bg-gray-800 shadow p-4 flex justify-between items-center sticky top-0 z-10">
                <h1 className="text-xl font-bold">Trang Quản Trị (V2 Professional)</h1>
                <div>
                     <button onClick={onExitAdmin} className="font-semibold text-blue-600 hover:underline mr-4">Trang chủ</button>
                    <button onClick={handleLogout} className="font-semibold text-red-600 hover:underline">Đăng xuất</button>
                </div>
            </header>
            <main className="p-4 md:p-8">
                {/* ... Tabs code ... */}
                 <div className="flex border-b mb-6 overflow-x-auto">
                    <button onClick={() => setActiveTab('bookings')} className={`px-4 py-2 font-semibold whitespace-nowrap ${activeTab === 'bookings' ? 'border-b-2 border-red-500 text-red-600' : ''}`}>Quản lý Đặt vé</button>
                    <button onClick={() => setActiveTab('users')} className={`px-4 py-2 font-semibold whitespace-nowrap ${activeTab === 'users' ? 'border-b-2 border-red-500 text-red-600' : ''}`}>Quản lý Người dùng</button>
                    <button onClick={() => setActiveTab('admins')} className={`px-4 py-2 font-semibold whitespace-nowrap ${activeTab === 'admins' ? 'border-b-2 border-red-500 text-red-600' : ''}`}>Quản trị viên</button>
                    <button onClick={() => setActiveTab('fees')} className={`px-4 py-2 font-semibold whitespace-nowrap ${activeTab === 'fees' ? 'border-b-2 border-red-500 text-red-600' : ''}`}>Cài đặt Phí & Thuế</button>
                    <div className="flex-grow"></div>
                    <button
                        onClick={handleDownloadBackup}
                        disabled={isDownloading}
                        className="ml-auto flex items-center justify-center px-4 py-1.5 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors disabled:bg-green-400 text-sm whitespace-nowrap"
                    >
                        {isDownloading ? 'Đang tải...' : <><DownloadIcon className="w-4 h-4 mr-2" /> Backup Data</>}
                    </button>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                   {isLoading ? <p>Đang tải dữ liệu...</p> : (
                       <>
                        {activeTab === 'bookings' && (
                            <BookingsManager 
                                allBookings={bookings} 
                                fetchData={fetchData}
                                onSelectBooking={setSelectedBooking}
                                onProcessPayment={setPaymentBooking}
                                onResendEmail={handleResendEmail}
                                onCancelBooking={handleCancelBooking}
                                onDeleteBooking={handleDeleteBooking}
                                onUpdateStatus={handleUpdateStatus}
                                sendingEmailId={sendingEmailId}
                                isUpdatingStatus={isUpdatingStatus}
                            />
                        )}
                        {activeTab === 'users' && (
                             <div>
                               <h2 className="text-xl font-bold mb-4">Danh sách Người dùng ({users.length})</h2>
                               <div className="overflow-x-auto">
                                   <table className="w-full text-sm text-left">
                                       <thead className="bg-gray-100 dark:bg-gray-700">
                                           <tr>
                                               <th className="p-3">ID</th>
                                               <th className="p-3">Họ tên</th>
                                               <th className="p-3">Liên hệ</th>
                                               <th className="p-3">Thông tin</th>
                                               <th className="p-3">Điểm Loyalty</th>
                                               <th className="p-3">Thao tác</th>
                                           </tr>
                                       </thead>
                                       <tbody>
                                            {users.length > 0 ? users.map(u => (
                                               <tr key={u.id || u.email} className="border-b dark:border-gray-700">
                                                   <td className="p-3 text-gray-500">{u.id}</td>
                                                   <td className="p-3 font-semibold">{u.name}</td>
                                                   <td className="p-3">
                                                       <div>{u.email}</div>
                                                       <div className="text-xs text-gray-500">{u.phone}</div>
                                                   </td>
                                                   <td className="p-3 text-xs">
                                                       <div>CCCD: {u.id_card}</div>
                                                       <div>Đ/C: {u.address}</div>
                                                   </td>
                                                   <td className="p-3 font-bold text-blue-600">{u.loyalty_points || 0}</td>
                                                   <td className="p-3">
                                                       <div className="flex gap-3">
                                                           <button onClick={() => setEditingUser(u)} className="text-blue-600 hover:text-blue-800" title="Sửa & Cộng điểm">
                                                               <EditIcon className="w-5 h-5" />
                                                           </button>
                                                           <button onClick={() => u.id && setResetPasswordData({id: u.id, type: 'user'})} className="text-yellow-600 hover:text-yellow-800" title="Đổi mật khẩu">
                                                               <span className="font-bold text-xs border border-yellow-500 rounded px-1">MK</span>
                                                           </button>
                                                           <button onClick={() => u.id && handleDeleteUser(u.id)} className="text-red-600 hover:text-red-800" title="Xóa">
                                                               <TrashIcon className="w-5 h-5" />
                                                           </button>
                                                       </div>
                                                   </td>
                                               </tr>
                                           )) : <tr><td colSpan={6} className="text-center p-4">Chưa có người dùng nào.</td></tr>}
                                       </tbody>
                                   </table>
                               </div>
                            </div>
                        )}
                         {activeTab === 'admins' && (
                             <div>
                               <div className="flex justify-between items-center mb-4">
                                   <h2 className="text-xl font-bold">Danh sách Admin ({admins.length})</h2>
                                   <button onClick={() => setEditingAdmin(null)} className="flex items-center bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700">
                                       <PlusIcon className="w-4 h-4 mr-2" /> Thêm Admin
                                   </button>
                               </div>
                               <div className="overflow-x-auto">
                                   <table className="w-full text-sm text-left">
                                       <thead className="bg-gray-100 dark:bg-gray-700">
                                           <tr>
                                               <th className="p-3">ID</th>
                                               <th className="p-3">Tên</th>
                                               <th className="p-3">Username</th>
                                               <th className="p-3">Role</th>
                                               <th className="p-3">Thao tác</th>
                                           </tr>
                                       </thead>
                                       <tbody>
                                            {admins.length > 0 ? admins.map(a => (
                                               <tr key={a.id} className="border-b dark:border-gray-700">
                                                   <td className="p-3 text-gray-500">{a.id}</td>
                                                   <td className="p-3 font-semibold">{a.name}</td>
                                                   <td className="p-3">{a.username}</td>
                                                   <td className="p-3 capitalize">{a.role}</td>
                                                   <td className="p-3">
                                                       <div className="flex gap-3">
                                                           <button onClick={() => setEditingAdmin(a)} className="text-blue-600 hover:text-blue-800" title="Sửa">
                                                               <EditIcon className="w-5 h-5" />
                                                           </button>
                                                           <button onClick={() => setResetPasswordData({id: a.id, type: 'admin'})} className="text-yellow-600 hover:text-yellow-800" title="Đổi mật khẩu">
                                                               <span className="font-bold text-xs border border-yellow-500 rounded px-1">MK</span>
                                                           </button>
                                                           <button onClick={() => handleDeleteAdmin(a.id)} className="text-red-600 hover:text-red-800" title="Xóa">
                                                               <TrashIcon className="w-5 h-5" />
                                                           </button>
                                                       </div>
                                                   </td>
                                               </tr>
                                           )) : <tr><td colSpan={5} className="text-center p-4">Chưa có admin nào khác.</td></tr>}
                                       </tbody>
                                   </table>
                               </div>
                            </div>
                        )}
                        {activeTab === 'fees' && feeConfig && <FeeConfiguration initialConfig={feeConfig} />}
                       </>
                   )}
                </div>
            </main>
            {selectedBooking && (
                <div className="fixed inset-0 z-[100] bg-black bg-opacity-70 flex items-center justify-center p-4 ticket-modal-container">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-full max-h-[95vh] overflow-hidden flex flex-col">
                        <div className="flex-shrink-0 p-3 bg-gray-100 flex justify-between items-center no-print">
                            <h3 className="font-bold text-gray-800">Chi tiết Đơn hàng: {selectedBooking.id}</h3>
                            <div>
                                <button onClick={() => window.print()} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 mr-2 text-sm">In vé</button>
                                <button onClick={() => setSelectedBooking(null)} className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-md hover:bg-gray-300 text-sm">Đóng</button>
                            </div>
                        </div>
                        <div className="flex-grow overflow-y-auto ticket-modal-content">
                            <div className="ticket-to-print">
                                <ETicket
                                    pnr={selectedBooking.pnr}
                                    bookingTimestamp={selectedBooking.bookingTimestamp}
                                    flight={selectedBooking.flight}
                                    bookingData={selectedBooking}
                                    bookingDetails={selectedBooking.bookingDetails}
                                    selectedOutboundOption={selectedBooking.selectedOutboundOption}
                                    selectedInboundOption={selectedBooking.selectedInboundOption}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const AdminPage: React.FC<AdminPageProps> = ({ onExitAdmin }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(adminService.isLoggedIn());
    const [isChangeCredsOpen, setChangeCredsOpen] = useState(false);
    
    const handleLoginSuccess = () => {
        setIsLoggedIn(true);
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
    };

    const handleCredsChanged = () => {
        setChangeCredsOpen(false);
        setIsLoggedIn(false); // Force re-login
    };

    if (!isLoggedIn) {
        return <AdminLogin onLoginSuccess={handleLoginSuccess} onExit={onExitAdmin} />;
    }

    return (
        <>
            <AdminDashboard onLogout={handleLogout} onExitAdmin={onExitAdmin} />
            {isChangeCredsOpen && (
                <ChangeCredentialsModal
                    onClose={() => setChangeCredsOpen(false)}
                    onSuccess={handleCredsChanged}
                />
            )}
        </>
    );
};

export default AdminPage;
