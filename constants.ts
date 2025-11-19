
import { type Airport } from './types';

export const AIRPORTS: Airport[] = [
  // Vietnam
  { id: 'SGN', name: 'TP. Hồ Chí Minh (SGN)' },
  { id: 'HAN', name: 'Hà Nội (HAN)' },
  { id: 'DAD', name: 'Đà Nẵng (DAD)' },
  { id: 'PQC', name: 'Phú Quốc (PQC)' },
  { id: 'CXR', name: 'Nha Trang (CXR)' },
  { id: 'DLI', name: 'Đà Lạt (DLI)' },
  { id: 'HPH', name: 'Hải Phòng (HPH)' },
  { id: 'VCA', name: 'Cần Thơ (VCA)' },
  { id: 'VCS', name: 'Côn Đảo (VCS)' },
  { id: 'UIH', name: 'Quy Nhơn (UIH)' },
  { id: 'HUI', name: 'Huế (HUI)' },
  { id: 'VDH', name: 'Đồng Hới (VDH)' },
  { id: 'VCL', name: 'Chu Lai (VCL)' },
  { id: 'THD', name: 'Thanh Hóa (THD)' },
  { id: 'VII', name: 'Vinh (VII)' },
  { id: 'DIN', name: 'Điện Biên Phủ (DIN)' },
  { id: 'PXU', name: 'Pleiku (PXU)' },
  { id: 'BMV', name: 'Buôn Ma Thuột (BMV)' },
  { id: 'VKG', name: 'Rạch Giá (VKG)' },
  { id: 'CAH', name: 'Cà Mau (CAH)' },
  // Asia
  { id: 'BKK', name: 'Bangkok, Thái Lan (BKK)' },
  { id: 'SIN', name: 'Singapore (SIN)' },
  { id: 'KUL', name: 'Kuala Lumpur, Malaysia (KUL)' },
  { id: 'NRT', name: 'Tokyo-Narita, Nhật Bản (NRT)' },
  { id: 'ICN', name: 'Seoul-Incheon, Hàn Quốc (ICN)' },
  { id: 'HKG', name: 'Hồng Kông (HKG)' },
  { id: 'TPE', name: 'Đài Bắc-Đào Viên, Đài Loan (TPE)' },
  { id: 'DXB', name: 'Dubai, UAE (DXB)' },
  // Europe
  { id: 'LHR', name: 'London-Heathrow, Anh (LHR)' },
  { id: 'CDG', name: 'Paris-Charles de Gaulle, Pháp (CDG)' },
  { id: 'FRA', name: 'Frankfurt, Đức (FRA)' },
  { id: 'AMS', name: 'Amsterdam, Hà Lan (AMS)' },
  { id: 'IST', name: 'Istanbul, Thổ Nhĩ Kỳ (IST)' },
  // Americas
  { id: 'JFK', name: 'New York-JFK, Hoa Kỳ (JFK)' },
  { id: 'LAX', name: 'Los Angeles, Hoa Kỳ (LAX)' },
  { id: 'SFO', name: 'San Francisco, Hoa Kỳ (SFO)' },
  { id: 'YVR', name: 'Vancouver, Canada (YVR)' },
  // Australia & Africa
  { id: 'SYD', name: 'Sydney, Úc (SYD)' },
  { id: 'MEL', name: 'Melbourne, Úc (MEL)' },
];


export const REGIONAL_AIRPORTS: Record<string, Airport[]> = {
    'Việt Nam': [
        { id: 'HAN', name: 'Hà Nội (HAN)' },
        { id: 'SGN', name: 'TP. Hồ Chí Minh (SGN)' },
        { id: 'DAD', name: 'Đà Nẵng (DAD)' },
        { id: 'DIN', name: 'Điện Biên Phủ (DIN)' },
        { id: 'HPH', name: 'Hải Phòng (HPH)' },
        { id: 'THD', name: 'Thanh Hóa (THD)' },
        { id: 'VII', name: 'Vinh (VII)' },
        { id: 'VDH', name: 'Quảng Bình (VDH)' },
        { id: 'HUI', name: 'Huế (HUI)' },
        { id: 'VCL', name: 'Quảng Nam (VCL)' },
        { id: 'UIH', name: 'Quy Nhơn (UIH)' },
        { id: 'TBB', name: 'Phú Yên (TBB)' },
        { id: 'CXR', name: 'Nha Trang (CXR)' },
        { id: 'DLI', name: 'Đà Lạt (DLI)' },
        { id: 'PXU', name: 'Pleiku (PXU)' },
        { id: 'BMV', name: 'Ban Mê Thuột (BMV)' },
        { id: 'VCA', name: 'Cần Thơ (VCA)' },
        { id: 'VKG', name: 'Kiên Giang (VKG)' },
        { id: 'PQC', name: 'Phú Quốc (PQC)' },
        { id: 'CAH', name: 'Cà Mau (CAH)' },
        { id: 'VCS', name: 'Côn Đảo (VCS)' },
    ],
    'Châu Á': [
        { id: 'BKK', name: 'Bangkok, Thái Lan (BKK)' },
        { id: 'SIN', name: 'Singapore (SIN)' },
        { id: 'KUL', name: 'Kuala Lumpur, Malaysia (KUL)' },
        { id: 'NRT', name: 'Tokyo, Nhật Bản (NRT)' },
        { id: 'ICN', name: 'Seoul, Hàn Quốc (ICN)' },
        { id: 'HKG', name: 'Hồng Kông (HKG)' },
        { id: 'TPE', name: 'Đài Bắc, Đài Loan (TPE)' },
        { id: 'DXB', name: 'Dubai, UAE (DXB)' },
    ],
    'Châu Âu': [
        { id: 'LHR', name: 'London, Anh (LHR)' },
        { id: 'CDG', name: 'Paris, Pháp (CDG)' },
        { id: 'FRA', name: 'Frankfurt, Đức (FRA)' },
        { id: 'AMS', name: 'Amsterdam, Hà Lan (AMS)' },
        { id: 'IST', name: 'Istanbul, Thổ Nhĩ Kỳ (IST)' },
    ],
    'Hoa Kỳ - Canada': [
        { id: 'JFK', name: 'New York, Hoa Kỳ (JFK)' },
        { id: 'LAX', name: 'Los Angeles, Hoa Kỳ (LAX)' },
        { id: 'SFO', name: 'San Francisco, Hoa Kỳ (SFO)' },
        { id: 'YVR', name: 'Vancouver, Canada (YVR)' },
    ],
    'Châu Úc - Châu Phi': [
        { id: 'SYD', name: 'Sydney, Úc (SYD)' },
        { id: 'MEL', name: 'Melbourne, Úc (MEL)' },
    ]
}

export const COUNTRY_CODES = [
  { name: 'Vietnam', code: 'VN', dial: '84' },
  { name: 'United States', code: 'US', dial: '1' },
  { name: 'United Kingdom', code: 'GB', dial: '44' },
  { name: 'Australia', code: 'AU', dial: '61' },
  { name: 'Singapore', code: 'SG', dial: '65' },
  { name: 'Thailand', code: 'TH', dial: '66' },
  { name: 'South Korea', code: 'KR', dial: '82' },
  { name: 'Japan', code: 'JP', dial: '81' },
  { name: 'France', code: 'FR', dial: '33' },
  { name: 'Germany', code: 'DE', dial: '49' },
];