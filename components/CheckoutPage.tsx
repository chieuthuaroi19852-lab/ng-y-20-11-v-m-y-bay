
import React, { useState, useMemo, useEffect } from 'react';
import { type FlightOption, type Passengers, type PassengerDetails, type ContactDetails, type BookingData, type FlightDetailsResult, type BookingOption, type AdminFeeConfig, User, SelectedAncillaries, AncillaryOption, FeeConfig, SearchParams } from '../types';
import { ArrowLeftIcon, ClockIcon, BriefcaseIcon, UserIcon, InfoIcon, CheckCircleIcon, TicketIcon, PhoneIcon, EnvelopeIcon, IdentificationIcon, CakeIcon, DownloadIcon, MailIcon, CloseIcon, PencilIcon, SearchIcon, CreditCardIcon } from './icons/Icons';
import PhoneInput from './PhoneInput';
import ETicket from './ETicket';
import * as adminService from '../services/adminService';
import { getBaggageOptionsForAirline } from '../data/ancillaryData';
import CompactSearchForm from './CompactSearchForm';

const USD_VND_RATE = 25400;

const formatCurrency = (amount: number, currency: 'VND' | 'USD' = 'VND') => {
    if (currency === 'USD') {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    }
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

const formatDuration = (minutes: number) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' };
    return date.toLocaleDateString('vi-VN', options);
}

const removeDiacritics = (str: string) => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D');
};

const capitalizeName = (name: string) => {
    if (!name) return '';
    return name.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const normalizePhone = (phone: string) => {
    if (!phone) return '+84';
    const cleanPhone = phone.replace(/\s+/g, '');
    if (cleanPhone.startsWith('+')) return cleanPhone;
    if (cleanPhone.startsWith('0')) return '+84' + cleanPhone.substring(1);
    return '+84' + cleanPhone;
};

type PassengerAncillaries = {
    outboundBaggage?: AncillaryOption;
    inboundBaggage?: AncillaryOption;
};

// --- SUB-COMPONENTS ---

const BookingSteps: React.FC<{ currentStep: 'select' | 'book' | 'complete' }> = ({ currentStep }) => {
    const steps = [
        { id: 'select', label: 'Chọn vé', icon: TicketIcon },
        { id: 'book', label: 'Đặt chỗ', icon: CreditCardIcon },
        { id: 'complete', label: 'Hoàn tất', icon: CheckCircleIcon },
    ];

    return (
        <div className="w-full max-w-3xl mx-auto mb-8">
            <div className="flex items-center justify-between relative">
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 dark:bg-gray-700 -z-10"></div>
                {steps.map((step, index) => {
                    const isActive = step.id === currentStep;
                    const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
                    
                    let colorClass = "bg-gray-200 text-gray-500 border-gray-300";
                    if (isActive) colorClass = "bg-red-600 text-white border-red-600 ring-4 ring-red-100 dark:ring-red-900/30";
                    if (isCompleted) colorClass = "bg-green-500 text-white border-green-500";

                    return (
                        <div key={step.id} className="flex flex-col items-center bg-[var(--bg-color)] px-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${colorClass}`}>
                                <step.icon className="w-5 h-5" />
                            </div>
                            <span className={`mt-2 text-xs sm:text-sm font-semibold ${isActive ? 'text-red-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const LayoverInfo: React.FC<{ from: FlightDetailsResult['selected_flights'][0]['flights'][0], to: FlightDetailsResult['selected_flights'][0]['flights'][0] }> = ({ from, to }) => {
    const arrivalTime = new Date(from.arrival_airport.time).getTime();
    const departureTime = new Date(to.departure_airport.time).getTime();
    const layoverMinutes = Math.round((departureTime - arrivalTime) / (1000 * 60));

    return (
        <div className="my-2 py-2 text-center text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-md">
            Nối chuyến tại <strong>{from.arrival_airport.id}</strong> • Chờ {formatDuration(layoverMinutes)}
        </div>
    );
};


const DetailedFlightSummary: React.FC<{ 
    details: FlightDetailsResult, 
    selectedOutboundOption: BookingOption | null, 
    selectedInboundOption: BookingOption | null,
    ancillaries?: SelectedAncillaries 
}> = ({ details, selectedOutboundOption, selectedInboundOption, ancillaries }) => {
    
    const renderFareDetails = (option: BookingOption | null, title: string, isReturn: boolean) => {
        if (!option) return null;

        const extraBaggage = isReturn ? ancillaries?.inboundBaggage : ancillaries?.outboundBaggage;

        return (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                    <TicketIcon className="w-5 h-5 text-blue-600"/>
                    <h4 className="font-bold text-blue-800 dark:text-blue-300 text-lg">{title}</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {/* Fare Info */}
                    <div>
                        <p className="font-semibold text-gray-700 dark:text-gray-300">Hạng vé:</p>
                        <p className="text-gray-900 dark:text-white font-bold">{option.together.option_title || 'Phổ thông'}</p>
                        
                        <p className="font-semibold text-gray-700 dark:text-gray-300 mt-2">Điều kiện vé:</p>
                        <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 pl-1">
                            {option.together.extensions.map((cond, i) => (
                                <li key={i}>{cond}</li>
                            ))}
                        </ul>
                    </div>

                    {/* Baggage Info */}
                    <div>
                        <p className="font-semibold text-gray-700 dark:text-gray-300">Hành lý & Dịch vụ:</p>
                        <ul className="space-y-1 mt-1">
                             {option.together.baggage_prices.map((item, i) => (
                                <li key={i} className="flex items-start text-gray-700 dark:text-gray-300">
                                    <CheckCircleIcon className="w-4 h-4 mr-2 text-green-500 mt-0.5 flex-shrink-0"/>
                                    <span>{item}</span>
                                </li>
                            ))}
                            {extraBaggage && (
                                <li className="flex items-start text-blue-700 dark:text-blue-300 font-semibold">
                                    <BriefcaseIcon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0"/>
                                    <span>Mua thêm: {extraBaggage.name}</span>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[var(--card-bg-color)] p-6 rounded-lg shadow-md space-y-5">
            <h3 className="text-xl font-bold text-[var(--text-color)] border-b border-[var(--border-color)] pb-3 mb-4">Chi tiết hành trình</h3>
            
            {details.selected_flights.map((leg, legIndex) => (
                <div key={legIndex}>
                    <h4 className="font-bold text-lg text-red-700 mb-3">{leg.type}</h4>
                    {leg.flights.map((flight, flightIndex) => (
                        <React.Fragment key={flightIndex}>
                             <div className="mb-2 pb-2 last:border-b-0 last:pb-0 last:mb-0">
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{formatDate(flight.departure_airport.time)}</p>
                                 <div className="flex items-start space-x-4">
                                    <img src={flight.airline_logo} alt={flight.airline} className="h-10 w-10 object-contain" />
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-center">
                                            <div className="text-left">
                                                <p className="font-bold text-lg">{new Date(flight.departure_airport.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{flight.departure_airport.id}</p>
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400 text-center flex-grow mx-2">
                                                <div className="border-t border-dashed w-full border-[var(--border-color)]"></div>
                                                <div className="flex items-center justify-center mt-1"><ClockIcon className="mr-1" /><span>{formatDuration(flight.duration)}</span></div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-lg">{new Date(flight.arrival_airport.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{flight.arrival_airport.id}</p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">{flight.airline} • {flight.flight_number}{flight.airplane ? ` • ${flight.airplane}` : ''}</p>
                                    </div>
                                </div>
                            </div>
                            {flightIndex < leg.flights.length - 1 && <LayoverInfo from={flight} to={leg.flights[flightIndex + 1]} />}
                        </React.Fragment>
                    ))}
                    {legIndex === 0 && renderFareDetails(selectedOutboundOption, "Gói vé chuyến đi", false)}
                    {legIndex === 1 && renderFareDetails(selectedInboundOption, "Gói vé chuyến về", true)}
                </div>
            ))}
        </div>
    );
};

type PriceData = {
    baseTotal: number;
    tax: number;
    serviceFee: number;
    ancillaryCost: number;
    finalTotal: number;
};

const PriceDetails: React.FC<{ 
    priceData: PriceData;
    passengers: Passengers;
    feeConfig: AdminFeeConfig | null;
}> = ({ priceData, passengers, feeConfig }) => {
    
    return (
        <div className="bg-[var(--card-bg-color)] p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-[var(--text-color)] border-b border-[var(--border-color)] pb-3 mb-4">Chi tiết giá</h3>
            <div className="space-y-2 text-[var(--text-color)]">
                <div className="flex justify-between">
                    <span>Giá vé ({passengers.adults + passengers.children}x)</span> 
                    <span>{formatCurrency(priceData.baseTotal)}</span>
                </div>
                {passengers.infants > 0 && <div className="flex justify-between"><span>Vé em bé ({passengers.infants}x)</span> <span>Liên hệ</span></div>}
                 
                 <div className="border-t border-[var(--border-color)] my-2 pt-2 space-y-2">
                    <div className="flex justify-between"><span>Thuế</span> <span>{feeConfig ? formatCurrency(priceData.tax) : 'Đang tính...'}</span></div>
                    <div className="flex justify-between"><span>Phí dịch vụ</span> <span>{feeConfig ? formatCurrency(priceData.serviceFee) : 'Đang tính...'}</span></div>
                     {priceData.ancillaryCost > 0 && (
                        <div className="flex justify-between"><span>Hành lý mua thêm</span> <span>{formatCurrency(priceData.ancillaryCost)}</span></div>
                    )}
                </div>
                <div className="border-t border-[var(--border-color)] my-2"></div>
                <div className="flex justify-between font-bold text-lg"><span>Tổng cộng</span> <span className="text-red-600">{feeConfig ? formatCurrency(priceData.finalTotal) : 'Đang tính...'}</span></div>
            </div>
        </div>
    );
};

const calculateAge = (dobString: string, referenceDate: Date): number => {
    if (!dobString) return -1;
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return -1;
    
    let age = referenceDate.getFullYear() - dob.getFullYear();
    const m = referenceDate.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && referenceDate.getDate() < dob.getDate())) {
        age--;
    }
    return age;
};


const BookingForm: React.FC<{passengers: Passengers, flight: FlightOption, onSubmit: (data: Pick<BookingData, 'passengers' | 'contact'>) => void, isLoading: boolean, apiError: string | null, currentUser: User | null}> = ({ passengers, flight, onSubmit, isLoading, apiError, currentUser }) => {
    const initialPassengerForms = useMemo(() => {
        const adults = Array(passengers.adults).fill(null).map((): PassengerDetails => ({ fullName: '', title: 'Mr', dob: '', idNumber: '', type: 'Adult' }));
        const children = Array(passengers.children).fill(null).map((): PassengerDetails => ({ fullName: '', title: 'Master', dob: '', idNumber: '', type: 'Child' }));
        const infants = Array(passengers.infants).fill(null).map((): PassengerDetails => ({ fullName: '', title: 'Master', dob: '', idNumber: '', type: 'Infant' }));
        return [...adults, ...children, ...infants];
    }, [passengers]);

    const [passengerForms, setPassengerForms] = useState<PassengerDetails[]>(initialPassengerForms);
    const [contactForm, setContactForm] = useState<ContactDetails>({ fullName: '', email: '', phone: '+84', gender: 'Mr', address: '' });

    useEffect(() => {
        const newPassengerForms = [...initialPassengerForms];
        let newContactForm: ContactDetails = { fullName: '', email: '', phone: '+84', gender: 'Mr', address: '' };

        if (currentUser) {
            newContactForm = {
                fullName: capitalizeName(currentUser.name || ''),
                email: currentUser.email || '',
                phone: normalizePhone(currentUser.phone || ''),
                gender: (currentUser.gender as any) || 'Mr',
                address: currentUser.address || '',
            };
            if (newPassengerForms.length > 0) {
                newPassengerForms[0] = {
                    ...newPassengerForms[0],
                    fullName: removeDiacritics(currentUser.name || '').toUpperCase(),
                    dob: currentUser.dob || '',
                    idNumber: currentUser.id_card || ''
                };
            }
        }
        
        setPassengerForms(newPassengerForms);
        setContactForm(newContactForm);
        
    }, [currentUser, initialPassengerForms]);


    const [validationError, setValidationError] = useState('');
    const [formErrors, setFormErrors] = useState<Array<{[key: string]: string | undefined}>>(initialPassengerForms.map(() => ({})));
    
    const departureDate = useMemo(() => new Date(flight.flights[0].departure_airport.time), [flight]);
    const isVietjetFlight = useMemo(() => flight.flights.some(f => f.airline.toLowerCase().includes('vietjet')), [flight]);
    
    const validatePassengerDob = (dob: string, type: PassengerDetails['type']): string | undefined => {
        if (!dob) return undefined; 
        const age = calculateAge(dob, departureDate);
        let error: string | undefined = undefined;

        if (age === -1) return 'Ngày sinh không hợp lệ.';

        switch (type) {
            case 'Adult':
                if (age < 12) error = 'Người lớn phải từ 12 tuổi trở lên.';
                break;
            case 'Child':
                if (age < 2 || age >= 12) error = 'Trẻ em phải từ 2 đến dưới 12 tuổi.';
                break;
            case 'Infant':
                if (age >= 2) error = 'Em bé phải dưới 2 tuổi.';
                break;
        }
        return error;
    };


    const handlePassengerChange = (index: number, field: keyof Omit<PassengerDetails, 'type'>, value: string) => {
        const updatedForms = [...passengerForms];
        let processedValue = value;
        if (field === 'fullName') processedValue = removeDiacritics(value).toUpperCase();
        updatedForms[index] = {...updatedForms[index], [field]: processedValue as any};
        setPassengerForms(updatedForms);
        if (field === 'dob') {
            const error = validatePassengerDob(value, updatedForms[index].type);
            const newErrors = [...formErrors];
            newErrors[index] = { ...newErrors[index], dob: error };
            setFormErrors(newErrors);
        }
    };
    
    const handleContactChange = (field: keyof ContactDetails, value: string) => {
        let processedValue = value;
        if (field === 'fullName') processedValue = capitalizeName(value);
        setContactForm(prev => ({...prev, [field]: processedValue as any}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError('');
        let isValid = true;
        const newErrors: Array<{[key: string]: string | undefined}> = passengerForms.map(() => ({}));
        passengerForms.forEach((p, index) => {
            if (!p.fullName.trim()) { newErrors[index].fullName = 'Vui lòng nhập họ tên.'; isValid = false; }
            if (isVietjetFlight && p.type === 'Adult' && !p.idNumber.trim()) { newErrors[index].idNumber = 'CCCD/Passport là bắt buộc.'; isValid = false; }
            if (p.dob) {
                const dobError = validatePassengerDob(p.dob, p.type);
                if (dobError) { newErrors[index].dob = dobError; isValid = false; }
            } else if (p.type !== 'Adult') { newErrors[index].dob = 'Ngày sinh là bắt buộc.'; isValid = false; }
        });
        setFormErrors(newErrors);

        if(!contactForm.fullName.trim() || !contactForm.email.trim() || !contactForm.phone.trim() || contactForm.phone.length < 11) {
            setValidationError('Vui lòng nhập đầy đủ và chính xác thông tin liên hệ.');
            isValid = false;
        } else if (!/^\S+@\S+\.\S+$/.test(contactForm.email)) {
            setValidationError('Vui lòng nhập địa chỉ email hợp lệ.');
            isValid = false;
        }
        
        if (!isValid) {
            if (!validationError) setValidationError('Vui lòng kiểm tra lại các thông tin có lỗi màu đỏ.');
            return;
        }
        onSubmit({ passengers: passengerForms, contact: contactForm });
    }

    const getPassengerTypeLabel = (type: PassengerDetails['type']) => {
        if (type === 'Adult') return 'Người lớn';
        if (type === 'Child') return 'Trẻ em';
        return 'Em bé';
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-[var(--card-bg-color)] p-6 rounded-lg shadow-md space-y-6">
                <div>
                    <h3 className="text-xl font-bold text-[var(--text-color)] border-b border-[var(--border-color)] pb-3 mb-4">Thông tin hành khách</h3>
                    {passengerForms.map((p, index) => {
                        const isIdRequired = isVietjetFlight && p.type === 'Adult';
                        const dobError = formErrors[index]?.dob;
                        return (
                            <div key={index} className="p-4 border border-[var(--border-color)] rounded-lg mb-4 space-y-4 bg-gray-50 dark:bg-gray-800/50">
                                <p className="font-semibold text-[var(--text-color)]">Hành khách {index + 1} ({getPassengerTypeLabel(p.type)})</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Họ và tên <span className="text-red-500">*</span> (Không dấu, viết hoa)</label>
                                        <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus-within:ring-1 focus-within:ring-red-500 focus-within:border-red-500 bg-white dark:bg-gray-700">
                                            <select value={p.title} onChange={e => handlePassengerChange(index, 'title', e.target.value)} className="pl-3 pr-2 py-2 text-base border-0 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-0 sm:text-sm rounded-l-md">
                                                {p.type === 'Adult' ? ( <> <option value="Mr">Ông</option> <option value="Mrs">Bà</option> <option value="Miss">Cô</option> </> ) : ( <> <option value="Master">Bé trai</option> <option value="Miss">Bé gái</option> </> )}
                                            </select>
                                            <div className="w-px bg-gray-300 dark:bg-gray-600 self-stretch my-1"></div>
                                            <input type="text" value={p.fullName} onChange={e => handlePassengerChange(index, 'fullName', e.target.value)} required className="flex-grow block w-full px-3 py-2 border-0 focus:outline-none focus:ring-0 sm:text-sm rounded-r-md bg-transparent" placeholder="NGUYEN VAN A"/>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div>
                                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày sinh {p.type !== 'Adult' && <span className="text-red-500">*</span>}</label>
                                       <input 
                                            type="date" 
                                            value={p.dob}
                                            required={p.type !== 'Adult'}
                                            onChange={e => handlePassengerChange(index, 'dob', e.target.value)} 
                                            className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm bg-white dark:bg-gray-700 ${dobError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-red-500 focus:border-red-500'}`} 
                                        />
                                        {dobError && <p className="mt-1 text-xs text-red-600">{dobError}</p>}
                                    </div>
                                     <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CCCD/Passport {isIdRequired && <span className="text-red-500">*</span>}</label>
                                        <input type="text" value={p.idNumber} onChange={e => handlePassengerChange(index, 'idNumber', e.target.value)} required={isIdRequired} className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm bg-white dark:bg-gray-700" placeholder={isIdRequired ? "Bắt buộc với Vietjet" : "Không bắt buộc"}/>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                 <div>
                    <div className="flex items-center gap-2 mb-4 border-b border-[var(--border-color)] pb-3">
                        <MailIcon className="w-6 h-6 text-gray-500"/>
                        <h3 className="text-xl font-bold text-[var(--text-color)]">Thông tin liên hệ</h3>
                    </div>
                     <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-sm text-blue-800 dark:text-blue-300 rounded-md mb-4">(*) Vui lòng cung cấp đầy đủ thông tin chi tiết của bạn.</div>
                     <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Giới tính <span className="text-red-500">*</span></label>
                                <select value={contactForm.gender} onChange={e => handleContactChange('gender', e.target.value)} required className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm bg-white dark:bg-gray-700">
                                    <option value="Mr">Nam</option>
                                    <option value="Mrs">Nữ</option>
                                </select>
                            </div>
                             <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Họ và tên <span className="text-red-500">*</span></label>
                                <input type="text" value={contactForm.fullName} onChange={e => handleContactChange('fullName', e.target.value)} required placeholder="VÍ DỤ: TRAN HUY HOANG" className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm bg-white dark:bg-gray-700" />
                            </div>
                        </div>

                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Điện thoại di động <span className="text-red-500">*</span></label>
                            <PhoneInput value={contactForm.phone} onChange={value => handleContactChange('phone', value)} required />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email <span className="text-red-500">*</span></label>
                                <input type="email" value={contactForm.email} onChange={e => handleContactChange('email', e.target.value)} required className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm bg-white dark:bg-gray-700" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Địa chỉ</label>
                                <input type="text" value={contactForm.address} onChange={e => handleContactChange('address', e.target.value)} className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm bg-white dark:bg-gray-700" />
                            </div>
                        </div>
                     </div>
                </div>
            </div>
            
            <div className="bg-[var(--card-bg-color)] p-6 rounded-lg shadow-md">
                {validationError && <p className="text-sm text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-300 p-3 rounded-md mb-4">{validationError}</p>}
                {apiError && <p className="text-sm text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-300 p-3 rounded-md mb-4">{apiError}</p>}
                
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 text-yellow-800 dark:text-yellow-200 rounded-r-lg">
                    <div className="flex">
                        <div className="flex-shrink-0"><InfoIcon className="h-5 w-5 text-yellow-500" /></div>
                        <div className="ml-3">
                            <p className="font-bold">Lưu ý quan trọng: Hình thức trả sau</p>
                            <p className="text-sm mt-1">Đây là yêu cầu <strong>Đặt vé trả sau</strong>. Sau khi hoàn tất, nhân viên của chúng tôi sẽ liên hệ với bạn qua Điện thoại hoặc Email để xác nhận và hướng dẫn thanh toán để xuất vé.</p>
                        </div>
                    </div>
                </div>

                <button type="submit" disabled={isLoading} className="w-full bg-red-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-700 transition-colors duration-300 disabled:bg-red-400 disabled:cursor-wait flex items-center justify-center shadow-lg mt-4">
                    {isLoading ? ( <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>) : 'Hoàn tất đặt vé'}
                </button>
            </div>
        </form>
    );
};

// --- MAIN COMPONENT ---

interface CheckoutPageProps {
  flight: FlightOption;
  passengers: Passengers;
  onBack: () => void;
  onConfirmBooking: (data: Omit<BookingData, 'id' | 'pnr' | 'bookingTimestamp' | 'flight' | 'bookingDetails' | 'selectedOutboundOption' | 'selectedInboundOption'>) => void;
  isLoading: boolean;
  isDetailsLoading: boolean;
  bookingDetails: FlightDetailsResult | null;
  selectedOutboundOption: BookingOption | null;
  onSelectOutboundOption: (option: BookingOption) => void;
  selectedInboundOption: BookingOption | null;
  onSelectInboundOption: (option: BookingOption) => void;
  isBookingConfirmed: boolean;
  onNewSearch: () => void;
  onSearch: (params: SearchParams) => void;
  bookingData: BookingData | null;
  apiError: string | null;
  currentUser: User | null;
}

const CheckoutPage: React.FC<CheckoutPageProps> = (props) => {
    const { flight, passengers, onBack, onConfirmBooking, isLoading, isDetailsLoading, bookingDetails, selectedOutboundOption, onSelectOutboundOption, selectedInboundOption, onSelectInboundOption, isBookingConfirmed, onNewSearch, onSearch, bookingData, apiError, currentUser } = props;
    const [showTicket, setShowTicket] = useState(false);
    const [fareSelectionModal, setFareSelectionModal] = useState<'outbound' | 'inbound' | null>(null);
    
    const totalPricedPassengers = passengers.adults + passengers.children;
    const [passengerAncillaries, setPassengerAncillaries] = useState<PassengerAncillaries[]>(() => Array(totalPricedPassengers).fill({}));
    const [feeConfig, setFeeConfig] = useState<AdminFeeConfig | null>(null);

    useEffect(() => {
        adminService.getFeeConfig().then(setFeeConfig);
    }, []);
    
    const currentSearchParams = useMemo((): SearchParams | null => {
        if (!flight || !flight.flights || flight.flights.length === 0) return null;
        
        const firstLeg = flight.flights[0];
        const isRoundTrip = flight.type.toLowerCase().includes('round');
        
        return {
            departure_id: firstLeg.departure_airport.id,
            arrival_id: firstLeg.arrival_airport.id,
            outbound_date: new Date(firstLeg.departure_airport.time).toISOString().split('T')[0],
            type: isRoundTrip ? 'round_trip' : 'one_way',
            passengers: passengers
        };
    }, [flight, passengers]);


    useEffect(() => {
      setPassengerAncillaries(Array(totalPricedPassengers).fill({}));
    }, [totalPricedPassengers]);

    const priceData = useMemo(() => {
        const pricedPassengers = passengers.adults + passengers.children;
        if (!selectedOutboundOption || pricedPassengers === 0) {
            return { baseTotal: 0, tax: 0, serviceFee: 0, ancillaryCost: 0, finalTotal: 0 };
        }

        const outboundFareUSD = selectedOutboundOption.together.price;
        const inboundFareUSD = (flight.type.toLowerCase().includes('round') && selectedInboundOption) 
            ? selectedInboundOption.together.price 
            : 0;
        
        const currentAncillaryCost = passengerAncillaries.reduce((total, p) => {
            return total + (p.outboundBaggage?.price || 0) + (p.inboundBaggage?.price || 0);
        }, 0);

        const currentBaseTotal = (outboundFareUSD + inboundFareUSD) * USD_VND_RATE * pricedPassengers;

        if (!feeConfig) {
             const defaultTax = currentBaseTotal * 0.1;
             return { baseTotal: currentBaseTotal, tax: defaultTax, serviceFee: 0, ancillaryCost: currentAncillaryCost, finalTotal: currentBaseTotal + defaultTax + currentAncillaryCost };
        }

        const primaryAirline = flight.flights[0]?.airline;
        const departureAirport = flight.flights[0]?.departure_airport.id;
        const arrivalAirport = flight.flights[flight.flights.length - 1]?.arrival_airport.id;
        
        const resolvedConfig = adminService.resolveFee(feeConfig, primaryAirline, departureAirport, arrivalAirport);

        let calculatedTax = 0;
        if (resolvedConfig.tax_type === 'percent') {
            calculatedTax = currentBaseTotal * (resolvedConfig.tax_value / 100);
        } else {
            calculatedTax = resolvedConfig.tax_value * pricedPassengers;
        }

        let calculatedServiceFee = 0;
        if (resolvedConfig.service_type === 'percent') {
            calculatedServiceFee = currentBaseTotal * (resolvedConfig.service_value / 100);
        } else {
            calculatedServiceFee = resolvedConfig.service_value * pricedPassengers;
        }

        const currentFinalTotal = currentBaseTotal + calculatedTax + calculatedServiceFee + currentAncillaryCost;
        
        return { baseTotal: currentBaseTotal, tax: calculatedTax, serviceFee: calculatedServiceFee, ancillaryCost: currentAncillaryCost, finalTotal: currentFinalTotal };
        
    }, [flight, passengers, selectedOutboundOption, selectedInboundOption, feeConfig, passengerAncillaries]);


    const handleFormSubmit = (formData: Pick<BookingData, 'passengers' | 'contact'>) => {
        const baggageSummary: SelectedAncillaries = {};
        
        const outboundSelections = passengerAncillaries.map(p => p.outboundBaggage?.name).filter(Boolean);
        if (outboundSelections.length > 0) {
            baggageSummary.outboundBaggage = {
                id: 'summary-out',
                name: outboundSelections.join(', '),
                price: passengerAncillaries.reduce((sum, p) => sum + (p.outboundBaggage?.price || 0), 0)
            };
        }

        const inboundSelections = passengerAncillaries.map(p => p.inboundBaggage?.name).filter(Boolean);
        if (inboundSelections.length > 0) {
            baggageSummary.inboundBaggage = {
                id: 'summary-in',
                name: inboundSelections.join(', '),
                price: passengerAncillaries.reduce((sum, p) => sum + (p.inboundBaggage?.price || 0), 0)
            };
        }

        const fullBookingData = {
            ...formData,
            ancillaries: baggageSummary,
            // CRITICAL FIX: Pass the calculated total amount here
            total_amount: priceData.finalTotal 
        };
        onConfirmBooking(fullBookingData);
    };
    
    const baggageOptions = useMemo(() => {
        const primaryAirline = flight.flights[0]?.airline || 'default';
        return getBaggageOptionsForAirline(primaryAirline);
    }, [flight]);

    const isRoundTrip = flight.type.toLowerCase().includes('round') && bookingDetails?.inbound_booking_options && bookingDetails.inbound_booking_options.length > 0;

    const handleAncillaryChange = (paxIndex: number, leg: 'outbound' | 'inbound', optionId: string | null) => {
        const newAncillaries = [...passengerAncillaries];
        const selectedOption = optionId ? baggageOptions.find(opt => opt.id === optionId) : undefined;
        
        if (leg === 'outbound') {
            newAncillaries[paxIndex] = { ...newAncillaries[paxIndex], outboundBaggage: selectedOption };
        } else {
            newAncillaries[paxIndex] = { ...newAncillaries[paxIndex], inboundBaggage: selectedOption };
        }
        setPassengerAncillaries(newAncillaries);
    };

    if(isBookingConfirmed && bookingData) {
        return (
            <>
                <BookingConfirmation 
                    onNewSearch={onNewSearch} 
                    bookingData={bookingData}
                    onShowTicket={() => setShowTicket(true)}
                    searchParamsForCompactForm={currentSearchParams}
                    onSearch={onSearch}
                />
                 {showTicket && (
                    <div className="fixed inset-0 z-[100] bg-black bg-opacity-70 flex items-center justify-center p-4 ticket-modal-container">
                        <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-full max-h-[95vh] overflow-hidden flex flex-col">
                            <div className="flex-shrink-0 p-3 bg-gray-100 flex justify-between items-center no-print">
                                <h3 className="font-bold text-gray-800">Vé điện tử</h3>
                                <div>
                                    <button onClick={() => window.print()} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 mr-2 text-sm">In vé</button>
                                    <button onClick={() => setShowTicket(false)} className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-md hover:bg-gray-300 text-sm">Đóng</button>
                                </div>
                            </div>
                            <div className="flex-grow overflow-y-auto ticket-modal-content">
                               <div className="ticket-to-print">
                                    <ETicket
                                        pnr={bookingData.pnr}
                                        bookingTimestamp={bookingData.bookingTimestamp}
                                        flight={bookingData.flight}
                                        bookingData={bookingData}
                                        bookingDetails={bookingData.bookingDetails}
                                        selectedOutboundOption={bookingData.selectedOutboundOption}
                                        selectedInboundOption={bookingData.selectedInboundOption}
                                    />
                               </div>
                            </div>
                        </div>
                    </div>
                 )}
            </>
        )
    }

    const renderFareSelection = () => {
        if (!bookingDetails) return null;

        return (
            <div className="bg-[var(--card-bg-color)] p-6 rounded-lg shadow-md space-y-4">
                <h3 className="text-xl font-bold text-[var(--text-color)] border-b border-[var(--border-color)] pb-3 mb-4">Chọn gói vé</h3>
                <SelectedFareDisplay 
                    legTitle="Gói vé chuyến đi" 
                    selectedOption={selectedOutboundOption} 
                    onChangeClick={() => setFareSelectionModal('outbound')} 
                />
                {isRoundTrip && (
                     <SelectedFareDisplay 
                        legTitle="Gói vé chuyến về" 
                        selectedOption={selectedInboundOption} 
                        onChangeClick={() => setFareSelectionModal('inbound')} 
                     />
                )}
            </div>
        );
    };

    const renderContent = () => {
        if (isDetailsLoading) {
            return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-pulse">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-gray-200 dark:bg-gray-700 p-6 rounded-lg shadow-md h-64"><div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-4"></div></div>
                        <div className="bg-gray-200 dark:bg-gray-700 p-6 rounded-lg shadow-md h-80"><div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-4"></div></div>
                    </div>
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-gray-200 dark:bg-gray-700 p-6 rounded-lg shadow-md h-96"><div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-2/3 mb-4"></div></div>
                    </div>
                </div>
            );
        }

        if (apiError && !bookingDetails) {
            return (
                <div className="max-w-2xl mx-auto text-center py-10 bg-[var(--card-bg-color)] p-8 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold text-red-700">Không thể tải chi tiết chuyến bay</h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">{apiError}</p>
                </div>
            );
        }

        if (!bookingDetails) {
            return (
                 <div className="max-w-2xl mx-auto text-center py-10 bg-[var(--card-bg-color)] p-8 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold text-[var(--text-color)]">Đang chuẩn bị trang đặt vé...</h2>
                 </div>
            )
        }
        
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-6">
                    {renderFareSelection()}
                    
                    <div className="bg-[var(--card-bg-color)] p-6 rounded-lg shadow-md space-y-4">
                        <h3 className="text-xl font-bold text-[var(--text-color)] border-b border-[var(--border-color)] pb-3 mb-4">Mua thêm dịch vụ</h3>
                        <div className="space-y-4">
                            {[...Array(totalPricedPassengers)].map((_, index) => (
                                <div key={index} className="grid grid-cols-1 sm:grid-cols-[100px_1fr] md:grid-cols-[120px_1fr_1fr] items-center gap-3 p-3 border rounded-md">
                                    <span className="font-bold sm:col-span-1 md:col-span-1">Hành khách {index + 1}</span>
                                    <select 
                                        value={passengerAncillaries[index]?.outboundBaggage?.id || ''}
                                        onChange={(e) => handleAncillaryChange(index, 'outbound', e.target.value || null)}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm"
                                    >
                                        <option value="">Chiều đi: Chưa mua hành lý</option>
                                        {baggageOptions.map(opt => (
                                            <option key={opt.id} value={opt.id}>Chiều đi: {opt.name} ({formatCurrency(opt.price)})</option>
                                        ))}
                                    </select>
                                    {isRoundTrip && (
                                        <select 
                                            value={passengerAncillaries[index]?.inboundBaggage?.id || ''}
                                            onChange={(e) => handleAncillaryChange(index, 'inbound', e.target.value || null)}
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm"
                                        >
                                            <option value="">Chiều về: Chưa mua hành lý</option>
                                            {baggageOptions.map(opt => (
                                                <option key={opt.id} value={opt.id}>Chiều về: {opt.name} ({formatCurrency(opt.price)})</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <BookingForm 
                        passengers={passengers} 
                        flight={flight}
                        onSubmit={handleFormSubmit} 
                        isLoading={isLoading} 
                        apiError={apiError}
                        currentUser={currentUser}
                    />
                </div>
                <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
                    <DetailedFlightSummary details={bookingDetails} selectedOutboundOption={selectedOutboundOption} selectedInboundOption={selectedInboundOption} />
                    <PriceDetails 
                        priceData={priceData}
                        passengers={passengers} 
                        feeConfig={feeConfig}
                    />
                    <div className="bg-[var(--card-bg-color)] p-4 rounded-lg shadow-md">
                        <h3 className="text-lg font-bold mb-3 text-gray-700 dark:text-gray-200 flex items-center gap-2">
                             <SearchIcon className="w-5 h-5" /> Thay đổi tìm kiếm
                        </h3>
                        <CompactSearchForm onSearch={onSearch} initialParams={currentSearchParams} />
                    </div>
                </div>
            </div>
        );
    };


    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
             <BookingSteps currentStep="book" />
            <button onClick={onBack} className="flex items-center text-red-600 font-semibold hover:underline mb-6">
                <ArrowLeftIcon className="mr-2" /> Quay lại kết quả tìm kiếm
            </button>
            {renderContent()}
            
            <FareSelectionModal 
                isOpen={fareSelectionModal === 'outbound'}
                onClose={() => setFareSelectionModal(null)}
                options={bookingDetails?.outbound_booking_options || bookingDetails?.booking_options || []}
                selectedOption={selectedOutboundOption}
                onSelect={onSelectOutboundOption}
                title="Chọn gói vé cho chuyến đi"
            />
            
            {isRoundTrip && (
                 <FareSelectionModal 
                    isOpen={fareSelectionModal === 'inbound'}
                    onClose={() => setFareSelectionModal(null)}
                    options={bookingDetails?.inbound_booking_options || []}
                    selectedOption={selectedInboundOption}
                    onSelect={onSelectInboundOption}
                    title="Chọn gói vé cho chuyến về"
                />
            )}
        </div>
    );
};

export default CheckoutPage;

// ... SelectedFareDisplay/FareSelectionModal/BookingConfirmation sub-components assumed unchanged ...
const SelectedFareDisplay: React.FC<{
    legTitle: string;
    selectedOption: BookingOption | null;
    onChangeClick: () => void;
}> = ({ legTitle, selectedOption, onChangeClick }) => {
    if (!selectedOption) {
        return (
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg animate-pulse h-24"></div>
        );
    }
    const { option_title, price, baggage_prices, airline_logos } = selectedOption.together;
    const primaryBaggage = baggage_prices.find(b => b.toLowerCase().includes('xách tay')) || baggage_prices[0] || 'Thông tin có trong chi tiết';

    return (
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-bold text-gray-600 dark:text-gray-400 mb-3">{legTitle}</h4>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {airline_logos[0] && <img src={airline_logos[0]} alt="airline logo" className="h-10 w-10 object-contain flex-shrink-0" />}
                <div className="flex-grow">
                    <p className="font-bold text-lg text-[var(--text-color)]">{option_title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{primaryBaggage}</p>
                </div>
                <div className="flex-shrink-0 text-left sm:text-right">
                    <p className="font-bold text-xl text-red-600">{formatCurrency(price * USD_VND_RATE)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">/ khách</p>
                </div>
                <button onClick={onChangeClick} className="w-full sm:w-auto flex-shrink-0 flex items-center justify-center gap-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-2 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm">
                    <PencilIcon className="w-4 h-4" />
                    Thay đổi
                </button>
            </div>
        </div>
    );
};

const FareSelectionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    options: BookingOption[];
    selectedOption: BookingOption | null;
    onSelect: (option: BookingOption) => void;
    title: string;
}> = ({ isOpen, onClose, options, selectedOption, onSelect, title }) => {
    if (!isOpen) return null;
    const [tempSelected, setTempSelected] = useState(selectedOption);

    const handleConfirm = () => {
        if (tempSelected) {
            onSelect(tempSelected);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4" onClick={onClose}>
            <div className="bg-[var(--card-bg-color)] rounded-lg shadow-xl w-full max-w-2xl transform transition-all flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-[var(--border-color)] flex-shrink-0">
                    <h2 className="text-xl font-bold">{title}</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <CloseIcon />
                    </button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    {options.map((option, index) => {
                         const isSelected = tempSelected === option;
                         return (
                            <div key={index} 
                                 onClick={() => setTempSelected(option)}
                                 className={`p-4 border rounded-lg cursor-pointer transition-all duration-300 ${isSelected ? 'border-red-500 bg-red-50 dark:bg-red-900/20 ring-1 ring-red-300' : 'border-gray-200 dark:border-gray-600 hover:border-red-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                <div className="flex items-start gap-4">
                                    <input type="radio" name="modal-booking-option" checked={isSelected} readOnly className="h-5 w-5 text-red-600 border-gray-300 focus:ring-red-500 flex-shrink-0 mt-1" />
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-lg text-[var(--text-color)]">{option.together.option_title}</h4>
                                                <ul className="mt-2 text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                                    {option.together.baggage_prices.map((item, i) => (
                                                        <li key={i} className="flex items-center"><BriefcaseIcon className="w-4 h-4 mr-2 text-gray-500"/>{item}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="text-right flex-shrink-0 ml-4">
                                                <p className="font-bold text-lg text-red-600">{formatCurrency(option.together.price * USD_VND_RATE)}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">/ khách</p>
                                            </div>
                                        </div>
                                         <div className="mt-3 pt-3 border-t border-dashed border-gray-300 dark:border-gray-600">
                                            <h5 className="font-semibold text-sm text-gray-600 dark:text-gray-400">Điều kiện vé:</h5>
                                            <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1 mt-1">
                                                {option.together.extensions.map((cond, i) => <li key={i}>{cond}</li>)}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                         );
                    })}
                </div>
                 <div className="p-4 border-t border-[var(--border-color)] text-right flex-shrink-0">
                    <button onClick={handleConfirm} className="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 transition-colors">
                        Xác nhận
                    </button>
                </div>
            </div>
        </div>
    );
};

const BookingConfirmation: React.FC<{
    onNewSearch: () => void;
    bookingData: BookingData;
    onShowTicket: () => void;
    searchParamsForCompactForm: SearchParams | null;
    onSearch: (params: SearchParams) => void;
}> = ({ onNewSearch, bookingData, onShowTicket, searchParamsForCompactForm, onSearch }) => {

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
             <BookingSteps currentStep="complete" />
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 max-w-4xl mx-auto bg-[var(--card-bg-color)] p-6 sm:p-8 rounded-lg shadow-lg w-full">
                    <div className="text-center border-b border-[var(--border-color)] pb-4 mb-6">
                        <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500" />
                        <h2 className="mt-4 text-3xl font-bold text-[var(--text-color)]">Yêu cầu đặt vé đã được gửi!</h2>
                        <p className="mt-2 text-gray-600 dark:text-gray-300">Cảm ơn <span className="font-semibold">{bookingData.contact.fullName}</span>, chúng tôi đã nhận được yêu cầu của bạn.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-center sm:text-left mb-6 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-[var(--border-color)]">
                        <div><p className="text-sm text-gray-500 dark:text-gray-400">Mã đơn hàng</p><p className="font-bold text-xl text-red-600 tracking-wider">{bookingData.id}</p></div>
                        <div className="sm:text-right"><p className="text-sm text-gray-500 dark:text-gray-400">Mã đặt chỗ (PNR)</p><p className="font-bold text-xl text-red-600 tracking-wider">{bookingData.pnr}</p></div>
                    </div>

                    <div className="space-y-8">
                        <DetailedFlightSummary 
                            details={bookingData.bookingDetails} 
                            selectedOutboundOption={bookingData.selectedOutboundOption} 
                            selectedInboundOption={bookingData.selectedInboundOption} 
                            ancillaries={bookingData.ancillaries}
                        />
                    </div>

                    <div className="mt-8 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg text-orange-800 dark:text-orange-200 flex items-start gap-3">
                        <InfoIcon className="w-6 h-6 flex-shrink-0 mt-0.5" />
                        <div>
                             <h4 className="font-bold">Lưu ý quan trọng về Giá vé & Xuất vé</h4>
                             <p className="text-sm mt-1">
                                Giá vé và tình trạng chỗ có thể thay đổi tùy thuộc vào thời điểm xuất vé thực tế của Hãng hàng không. 
                                Quý khách vui lòng hoàn tất thanh toán sớm để đảm bảo giữ được mức giá và hành trình đã chọn.
                                Vé chỉ được coi là xuất thành công khi có xác nhận Số vé điện tử từ nhân viên phòng vé.
                             </p>
                        </div>
                    </div>

                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
                        <h4 className="font-semibold text-blue-800 dark:text-blue-300">Bước tiếp theo là gì?</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">Nhân viên sẽ sớm kiểm tra tình trạng vé và liên hệ với bạn qua SĐT <strong className="whitespace-nowrap">{bookingData.contact.phone}</strong> hoặc email <strong className="whitespace-nowrap">{bookingData.contact.email}</strong> để xác nhận và hướng dẫn thanh toán.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 border-t border-[var(--border-color)] pt-6 mt-6">
                        <button onClick={onNewSearch} className="w-full sm:w-auto bg-gray-700 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-800 transition-colors duration-300">
                            Tìm kiếm mới
                        </button>
                        <button onClick={onShowTicket} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-700 transition-colors duration-300">
                            <DownloadIcon />
                            Xem & Tải vé điện tử
                        </button>
                    </div>
                </div>
                 <div className="lg:col-span-1 space-y-6">
                     <div className="bg-[var(--card-bg-color)] p-4 rounded-lg shadow-md">
                        <h3 className="text-lg font-bold mb-3 text-gray-700 dark:text-gray-200 flex items-center gap-2">
                             <SearchIcon className="w-5 h-5" /> Tìm vé khác
                        </h3>
                        <CompactSearchForm onSearch={onSearch} initialParams={searchParamsForCompactForm} />
                    </div>
                </div>
            </div>
        </div>
    );
}
