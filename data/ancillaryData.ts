import { AncillaryOption } from '../types';

export const MOCK_BAGGAGE_OPTIONS: Record<string, AncillaryOption[]> = {
  'vietjet air': [
    { id: 'vj_bag_15', name: 'Gói 15kg', price: 165000, description: 'Áp dụng cho 1 khách / 1 chiều' },
    { id: 'vj_bag_20', name: 'Gói 20kg', price: 198000, description: 'Áp dụng cho 1 khách / 1 chiều' },
    { id: 'vj_bag_25', name: 'Gói 25kg', price: 250000, description: 'Áp dụng cho 1 khách / 1 chiều' },
    { id: 'vj_bag_30', name: 'Gói 30kg', price: 340000, description: 'Áp dụng cho 1 khách / 1 chiều' },
    { id: 'vj_bag_40', name: 'Gói 40kg', price: 450000, description: 'Áp dụng cho 1 khách / 1 chiều' },
  ],
  'vietnam airlines': [
    { id: 'vn_bag_10', name: 'Gói 10kg', price: 220000, description: 'Áp dụng cho 1 khách / 1 chiều' },
    { id: 'vn_bag_23', name: 'Gói 23kg (1 kiện)', price: 440000, description: 'Áp dụng cho 1 khách / 1 chiều' },
    { id: 'vn_bag_32', name: 'Gói 32kg (1 kiện)', price: 660000, description: 'Áp dụng cho 1 khách / 1 chiều' },
  ],
  'bamboo airways': [
    { id: 'qh_bag_15', name: 'Gói 15kg', price: 180000, description: 'Áp dụng cho 1 khách / 1 chiều' },
    { id: 'qh_bag_20', name: 'Gói 20kg', price: 210000, description: 'Áp dụng cho 1 khách / 1 chiều' },
    { id: 'qh_bag_25', name: 'Gói 25kg', price: 260000, description: 'Áp dụng cho 1 khách / 1 chiều' },
    { id: 'qh_bag_30', name: 'Gói 30kg', price: 320000, description: 'Áp dụng cho 1 khách / 1 chiều' },
    { id: 'qh_bag_40', name: 'Gói 40kg', price: 430000, description: 'Áp dụng cho 1 khách / 1 chiều' },
  ],
  'default': [
    { id: 'def_bag_20', name: 'Gói 20kg', price: 250000, description: 'Áp dụng cho 1 khách / 1 chiều' },
    { id: 'def_bag_30', name: 'Gói 30kg', price: 380000, description: 'Áp dụng cho 1 khách / 1 chiều' },
  ]
};

export const getBaggageOptionsForAirline = (airlineName: string): AncillaryOption[] => {
    const airlineLower = airlineName.toLowerCase();
    if (airlineLower.includes('vietjet')) return MOCK_BAGGAGE_OPTIONS['vietjet air'];
    if (airlineLower.includes('vietnam airlines')) return MOCK_BAGGAGE_OPTIONS['vietnam airlines'];
    if (airlineLower.includes('bamboo')) return MOCK_BAGGAGE_OPTIONS['bamboo airways'];
    return MOCK_BAGGAGE_OPTIONS['default'];
};