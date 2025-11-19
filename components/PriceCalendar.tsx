
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from './icons/Icons';

interface PriceCalendarProps {
    departureId: string;
    arrivalId: string;
    onClose: () => void;
    onSelectDate: (date: string) => void;
    minDate?: string;
    selectedDate?: string;
}

const formatCurrency = (amount: number) => {
    return `${Math.round(amount / 1000)}k`;
};

// Simple hash function to generate a consistent "random" value for a given date and route
const simpleHash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
};

const generateMockPrice = (date: Date, departureId: string, arrivalId: string): number => {
    const day = date.getDay(); // Sunday - Saturday : 0 - 6
    const dateStr = date.toISOString().split('T')[0];
    const hashInput = `${dateStr}-${departureId}-${arrivalId}`;
    const hash = simpleHash(hashInput);

    let basePrice = 1200000 + (simpleHash(departureId) % 500000); // Base price based on route

    // Weekend price increase
    if (day === 5 || day === 6 || day === 0) { // Fri, Sat, Sun
        basePrice *= 1.3;
    }

    // Add some random variation
    const randomFactor = (hash % 100) / 100; // 0 to 0.99
    const variation = (randomFactor - 0.5) * 600000; // -300k to +300k
    
    return Math.round((basePrice + variation) / 10000) * 10000; // Round to nearest 10k
};

const PriceCalendar: React.FC<PriceCalendarProps> = ({ departureId, arrivalId, onClose, onSelectDate, minDate, selectedDate }) => {
    const [currentDate, setCurrentDate] = useState(new Date(selectedDate || minDate || new Date()));

    const { month, year, days, startingDay } = useMemo(() => {
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startingDay = new Date(year, month, 1).getDay();
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        return { month, year, days, startingDay };
    }, [currentDate]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const minSelectableDate = minDate ? new Date(minDate) : today;
    minSelectableDate.setHours(0,0,0,0);
    
    const selectedDateObj = selectedDate ? new Date(selectedDate) : null;
    if(selectedDateObj) selectedDateObj.setHours(0,0,0,0);


    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    return createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-[var(--card-bg-color)] rounded-lg shadow-xl w-full max-w-lg transform transition-all" onClick={e => e.stopPropagation()}>
                 <div className="flex justify-between items-center p-4 border-b border-[var(--border-color)]">
                    <h2 className="text-lg font-bold">Chọn ngày bay</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <CloseIcon />
                    </button>
                </div>
                <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={handlePrevMonth} className="font-bold text-2xl p-2">&lt;</button>
                        <div className="font-bold text-lg">{`Tháng ${month + 1}, ${year}`}</div>
                        <button onClick={handleNextMonth} className="font-bold text-2xl p-2">&gt;</button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                        {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => <div key={day}>{day}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: startingDay }).map((_, i) => <div key={`empty-${i}`}></div>)}
                        {days.map(day => {
                            const date = new Date(year, month, day);
                            const price = generateMockPrice(date, departureId, arrivalId);
                            const isPast = date < minSelectableDate;
                            const isSelected = selectedDateObj && date.getTime() === selectedDateObj.getTime();
                            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            
                            return (
                                <button
                                    key={day}
                                    disabled={isPast}
                                    onClick={() => onSelectDate(dateString)}
                                    className={`p-2 rounded-md transition-colors text-center ${
                                        isPast ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' : 
                                        isSelected ? 'bg-red-600 text-white font-bold' : 
                                        'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    <div className="font-semibold">{day}</div>
                                    {!isPast && <div className={`text-xs ${isSelected ? 'text-white/80' : 'text-green-600'}`}>{formatCurrency(price)}</div>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default PriceCalendar;
