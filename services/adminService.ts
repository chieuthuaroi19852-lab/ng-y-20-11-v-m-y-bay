import { AdminFeeConfig, BookingData, FeeConfig, BookingLookupData, User, Admin } from '../types';
import { REGIONAL_AIRPORTS } from '../constants';
import { DB_API_URL } from './apiConfig';

const ADMIN_LOGGED_IN_KEY = 'flightAdminLoggedIn';
const ADMIN_INFO_KEY = 'flightAdminInfo';

// --- Auth ---

export const login = async (loginInput: string, pass: string): Promise<boolean> => {
    try {
        const payload = { 
            username: loginInput, 
            email: loginInput, 
            password: pass 
        };

        const response = await fetch(`${DB_API_URL}?action=admin_login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (result.success) {
            sessionStorage.setItem(ADMIN_LOGGED_IN_KEY, 'true');
            if (result.admin) {
                sessionStorage.setItem(ADMIN_INFO_KEY, JSON.stringify(result.admin));
            }
            return true;
        }
        return false;
    } catch (error) {
        console.error("Admin login failed:", error);
        return false;
    }
};

export const logout = () => {
    sessionStorage.removeItem(ADMIN_LOGGED_IN_KEY);
    sessionStorage.removeItem(ADMIN_INFO_KEY);
};

export const isLoggedIn = (): boolean => {
    return sessionStorage.getItem(ADMIN_LOGGED_IN_KEY) === 'true';
};

export const getCurrentAdmin = (): Admin | null => {
    try {
        const data = sessionStorage.getItem(ADMIN_INFO_KEY);
        return data ? JSON.parse(data) : null;
    } catch { return null; }
};

export const changeAdminCredentials = async (newUsername: string, newPassword: string): Promise<boolean> => {
    const currentAdmin = getCurrentAdmin();
    if (!currentAdmin) return false;

    try {
        const updatePayload = { ...currentAdmin, username: newUsername };
        const updateResponse = await updateAdmin(updatePayload);
        if (!updateResponse.success) return false;

        const resetResponse = await resetAdminPassword(currentAdmin.id, newPassword);
        if (!resetResponse.success) return false;
        
        sessionStorage.setItem(ADMIN_INFO_KEY, JSON.stringify(updatePayload));
        return true;
    } catch (error) {
        console.error("Failed to change admin credentials:", error);
        return false;
    }
};

// --- Admin Management ---

export const getAdmins = async (): Promise<Admin[]> => {
    try {
        const response = await fetch(`${DB_API_URL}?action=get_admins&_t=${Date.now()}`, {
            cache: 'no-store'
        });
        if (!response.ok) throw new Error('Failed to fetch admins');
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Error fetching admins:", error);
        return [];
    }
};

export const createAdmin = async (admin: Omit<Admin, 'id'> & { password: string }): Promise<{ success: boolean, message: string }> => {
    try {
        const response = await fetch(`${DB_API_URL}?action=create_admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(admin),
        });
        return await response.json();
    } catch (error) {
        return { success: false, message: 'Lỗi kết nối khi tạo admin.' };
    }
};

export const updateAdmin = async (admin: Admin): Promise<{ success: boolean, message: string }> => {
    try {
        const response = await fetch(`${DB_API_URL}?action=update_admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(admin),
        });
        return await response.json();
    } catch (error) {
        return { success: false, message: 'Lỗi kết nối khi cập nhật admin.' };
    }
};

export const deleteAdmin = async (id: string | number): Promise<{ success: boolean, message: string }> => {
    try {
        const response = await fetch(`${DB_API_URL}?action=delete_admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
        return await response.json();
    } catch (error) {
        return { success: false, message: 'Lỗi kết nối khi xóa admin.' };
    }
};

export const resetAdminPassword = async (id: string | number, newPassword: string): Promise<{ success: boolean, message: string }> => {
    try {
        const response = await fetch(`${DB_API_URL}?action=reset_admin_password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, newPassword }),
        });
        return await response.json();
    } catch (error) {
        return { success: false, message: 'Lỗi kết nối khi reset mật khẩu admin.' };
    }
};

// --- Bookings ---
export const createBooking = async (bookingData: BookingData): Promise<{ success: boolean, message: string }> => {
    try {
        const payload = {
            ...bookingData,
            user_id: bookingData.userId,
            payment_status: 'pending',
            total_amount: bookingData.total_amount || 0, 
            payment_info: JSON.stringify({}) 
        };

        const response = await fetch(`${DB_API_URL}?action=create_booking`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Server error: ${response.status} - ${errorBody}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to create booking:", error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, message: `Could not save booking: ${message}` };
    }
};

export const getAllBookings = async (): Promise<BookingData[]> => {
    try {
        const response = await fetch(`${DB_API_URL}?action=get_bookings&_t=${Date.now()}`, {
             cache: 'no-store'
        });
        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }
        const data = await response.json();
        
        if (!Array.isArray(data)) return [];

        return data.map((b: any) => {
            // HELPER: Safe Parsing to avoid White Screen
            const safeParse = (val: any, defaultVal: any) => {
                if (val === null || val === undefined) return defaultVal;
                if (typeof val === 'string') {
                    try { 
                        const parsed = JSON.parse(val);
                        // Handle case where PHP json_encode([]) results in an empty array `[]` for an object
                        if (Array.isArray(parsed) && Object.keys(parsed).length === 0) {
                            return defaultVal;
                        }
                        return parsed || defaultVal;
                    } catch { 
                        return defaultVal; 
                    }
                }
                return val;
            };

            // Ensure objects are objects and not empty arrays (common PHP issue)
            const ensureObject = (val: any, defaultVal: any) => {
                const parsed = safeParse(val, defaultVal);
                if (Array.isArray(parsed) && parsed.length === 0) return defaultVal;
                return parsed;
            };

            return {
                ...b,
                userId: b.user_id || b.userId,
                total_amount: b.total_amount ? parseFloat(b.total_amount) : 0,
                payment_info: safeParse(b.payment_info, {}),
                passengers: Array.isArray(b.passengers) ? b.passengers : safeParse(b.passengers, []),
                contact: ensureObject(b.contact, {}),
                flight: ensureObject(b.flight, { price_net: 0, flights: [] }),
                bookingDetails: ensureObject(b.bookingDetails, { selected_flights: [] }),
                selectedOutboundOption: ensureObject(b.selectedOutboundOption, null),
                selectedInboundOption: ensureObject(b.selectedInboundOption, null),
                ancillaries: ensureObject(b.ancillaries, {})
            };
        });
    } catch (e) {
        console.error("Error fetching bookings from the database:", e);
        return [];
    }
};

export const deleteBooking = async (bookingId: string): Promise<{ success: boolean, message: string }> => {
    try {
        const response = await fetch(`${DB_API_URL}?action=admin_delete_booking`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingId }),
        });
        const result = await response.json();
        return result || { success: false, message: 'Không nhận được phản hồi từ server.' };
    } catch (error) {
        return { success: false, message: 'Lỗi kết nối khi xóa đơn hàng.' };
    }
};

export const updateBookingStatus = async (bookingId: string, status: string, admin_note: string = ''): Promise<{ success: boolean, message: string }> => {
    try {
        const response = await fetch(`${DB_API_URL}?action=admin_update_booking_status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingId, status, admin_note }),
        });
        const result = await response.json();
        return result || { success: false, message: 'Không nhận được phản hồi từ server.' };
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Lỗi không xác định';
        return { success: false, message: `Lỗi kết nối: ${msg}` };
    }
};

// New Professional V2: Process Payment
export const processPayment = async (bookingId: string, totalAmount: number, paymentInfo: any): Promise<{ success: boolean, message: string }> => {
    try {
        const response = await fetch(`${DB_API_URL}?action=process_payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bookingId,
                payment_status: 'paid',
                payment_info: JSON.stringify(paymentInfo),
                total_amount: totalAmount
            }),
        });
        const result = await response.json();
        return result || { success: false, message: 'Không nhận được phản hồi từ server.' };
    } catch (error) {
        return { success: false, message: 'Lỗi xử lý thanh toán.' };
    }
};

// New Professional V2: Cancel Booking with Reason
export const cancelBooking = async (bookingId: string, reason: string): Promise<{ success: boolean, message: string }> => {
    try {
        const response = await fetch(`${DB_API_URL}?action=cancel_booking`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bookingId,
                cancellation_reason: reason
            }),
        });
        return await response.json();
    } catch (error) {
        return { success: false, message: 'Lỗi hủy đơn hàng.' };
    }
};

export const lookupBooking = async (lookupData: BookingLookupData): Promise<BookingData | null> => {
    try {
        const allBookings = await getAllBookings();

        if (!allBookings || allBookings.length === 0) {
            return null;
        }

        const foundBooking = allBookings.find(booking => 
            booking.id?.trim().toUpperCase() === lookupData.orderId.trim().toUpperCase() && 
            booking.contact?.email?.trim().toLowerCase() === lookupData.email.trim().toLowerCase()
        );

        return foundBooking || null;
    } catch (error) {
        console.error("Error during booking lookup:", error);
        return null;
    }
};

// --- User Management ---

export const updateUser = async (user: User): Promise<{ success: boolean, message: string }> => {
    try {
         // Map gender back to DB format
        let genderDB = 'Other';
        const inputGender = user.gender; 
        
        if (inputGender === 'Mr' || inputGender === 'Nam' || inputGender === 'Male') {
            genderDB = 'Male';
        } else if (inputGender === 'Mrs' || inputGender === 'Miss' || inputGender === 'Nữ' || inputGender === 'Female') {
            genderDB = 'Female';
        }

        // Sanitize optional fields
        const sanitizeOptional = (str?: string) => {
            if (!str) return null;
            const trimmed = str.trim();
            return trimmed.length > 0 ? trimmed : null;
        };

        const payload = {
            ...user,
            gender: genderDB,
            dob: sanitizeOptional(user.dob),
            id_card: sanitizeOptional(user.id_card),
            address: sanitizeOptional(user.address),
            nationality: user.nationality || 'Việt Nam'
        };

        const response = await fetch(`${DB_API_URL}?action=admin_update_user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const result = await response.json();
        return result || { success: false, message: 'Server không trả về kết quả.' };
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Lỗi không xác định';
        return { success: false, message: `Lỗi kết nối cập nhật user: ${msg}` };
    }
};

export const resetUserPassword = async (userId: string | number, newPassword: string): Promise<{ success: boolean, message: string }> => {
    try {
        const response = await fetch(`${DB_API_URL}?action=admin_reset_password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: userId, newPassword }),
        });
        return await response.json();
    } catch (error) {
        return { success: false, message: 'Lỗi kết nối khi reset mật khẩu.' };
    }
};

export const deleteUser = async (userId: string | number): Promise<{ success: boolean, message: string }> => {
    try {
        const response = await fetch(`${DB_API_URL}?action=admin_delete_user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: userId }),
        });
        return await response.json();
    } catch (error) {
        return { success: false, message: 'Lỗi kết nối khi xóa người dùng.' };
    }
};

// New Professional V2: Update Loyalty Points
export const updateLoyaltyPoints = async (userId: string | number, pointsDelta: number): Promise<{ success: boolean, message: string }> => {
    try {
        const response = await fetch(`${DB_API_URL}?action=update_loyalty_points`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, points_delta: pointsDelta }),
        });
        return await response.json();
    } catch (error) {
        return { success: false, message: 'Lỗi cập nhật điểm tích lũy.' };
    }
};


// --- Fee Configuration ---
export const getFeeConfig = async (): Promise<AdminFeeConfig> => {
    try {
        const response = await fetch(`${DB_API_URL}?action=get_fees&_t=${Date.now()}`, {
            cache: 'no-store'
        });
        if (!response.ok) throw new Error('Failed to fetch fee config');
        const feeArray: (FeeConfig & {config_key: string})[] = await response.json();
        
        const config: AdminFeeConfig = {
            default: { service_type: 'fixed', service_value: 0, tax_type: 'percent', tax_value: 0, currency: 'VND' },
            domestic: { service_type: 'fixed', service_value: 0, tax_type: 'percent', tax_value: 0, currency: 'VND' },
            international: { service_type: 'fixed', service_value: 0, tax_type: 'percent', tax_value: 0, currency: 'VND' },
            airlines: {},
        };

        feeArray.forEach(item => {
            const { config_key, ...feeValues } = item;
            if (config_key === 'default' || config_key === 'domestic' || config_key === 'international') {
                config[config_key] = feeValues;
            } else {
                config.airlines[config_key] = feeValues;
            }
        });
        
        return config;

    } catch (e) {
        console.error("Error fetching fee config:", e);
         return {
            default: { service_type: 'fixed', service_value: 100000, tax_type: 'percent', tax_value: 8, currency: 'VND' },
            domestic: { service_type: 'fixed', service_value: 90000, tax_type: 'percent', tax_value: 8, currency: 'VND' },
            international: { service_type: 'fixed', service_value: 250000, tax_type: 'percent', tax_value: 0, currency: 'VND' },
            airlines: {}
        };
    }
};

export const saveFeeConfig = async (config: AdminFeeConfig): Promise<boolean> => {
    const feeUpdatePromises: Promise<any>[] = [];

    const configsToSave = [
        { config_key: 'default', ...config.default },
        { config_key: 'domestic', ...config.domestic },
        { config_key: 'international', ...config.international },
        ...Object.entries(config.airlines).map(([key, value]) => ({ config_key: key, ...value }))
    ];

    for (const fee of configsToSave) {
        const promise = fetch(`${DB_API_URL}?action=update_fee`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fee),
        }).then(res => {
            if (!res.ok) throw new Error(`Failed to update fee for ${fee.config_key}`);
            return res.json();
        });
        feeUpdatePromises.push(promise);
    }
    
    try {
        await Promise.all(feeUpdatePromises);
        return true;
    } catch(error) {
        console.error("Failed to save one or more fee configs:", error);
        return false;
    }
};

// --- Fee Resolution Logic (remains client-side) ---
const getAirlineCode = (airlineName: string): string => {
    const lowerName = airlineName.toLowerCase();
    if (lowerName.includes('vietnam airlines')) return 'VN';
    if (lowerName.includes('vietjet')) return 'VJ';
    if (lowerName.includes('bamboo')) return 'QH';
    return 'default';
};

const isInternational = (departureId: string, arrivalId: string): boolean => {
    if (!departureId || !arrivalId) return false;
    const vietnamAirports = new Set(REGIONAL_AIRPORTS['Việt Nam'].map(a => a.id));
    return !vietnamAirports.has(departureId) || !vietnamAirports.has(arrivalId);
};

export const resolveFee = (
    config: AdminFeeConfig, 
    airlineName: string, 
    departureId: string, 
    arrivalId: string
): FeeConfig => {
    const airlineCode = getAirlineCode(airlineName);
    if (config.airlines && config.airlines[airlineCode]) {
        return config.airlines[airlineCode];
    }
    
    if (isInternational(departureId, arrivalId)) {
        return config.international;
    }
    
    if (config.domestic) {
        return config.domestic;
    }

    return config.default;
};