
import React, { useState, useEffect } from 'react';
import { type TripType, type SearchParams, type Passengers } from '../types';
import AirportSelector from './AirportSelector';
import PassengerSelector from './PassengerSelector';
import PriceCalendar from './PriceCalendar';
import { CalendarIcon, PlaneTakeoffIcon, PlaneLandIcon, UserIcon, SearchIcon, RefreshIcon, CheckIcon, SwapArrowsIcon } from './icons/Icons';

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
  isLoading: boolean;
  initialParams?: SearchParams | null;
}

const airlines = [
    { code: 'VN', name: 'Vietnam Airlines', logo: 'https://plugin.datacom.vn/Resources/Images/Airline/VN.gif' },
    { code: 'VJ', name: 'Vietjet Air', logo: 'https://plugin.datacom.vn/Resources/Images/Airline/VJ.gif' },
    { code: 'QH', name: 'Bamboo Airways', logo: 'https://plugin.datacom.vn/Resources/Images/Airline/QH.gif' },
    { code: 'VU', name: 'Vietravel Airlines', logo: 'https://plugin.datacom.vn/Resources/Images/Airline/VU.gif' },
];

const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

const SearchForm: React.FC<SearchFormProps> = ({ onSearch, isLoading, initialParams }) => {
  const [tripType, setTripType] = useState<TripType>('one_way');
  const [departureId, setDepartureId] = useState<string>('SGN');
  const [arrivalId, setArrivalId] = useState<string>('HAN');
  const [activeAirportModal, setActiveAirportModal] = useState<'departure' | 'arrival' | null>(null);
  
  const getTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getDayAfterTomorrow = () => {
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    return dayAfter.toISOString().split('T')[0];
  };

  const [outboundDate, setOutboundDate] = useState<string>(getTomorrow());
  const [returnDate, setReturnDate] = useState<string>(getDayAfterTomorrow());
  const [passengers, setPassengers] = useState<Passengers>({ adults: 1, children: 0, infants: 0 });
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>(airlines.map(a => a.code));
  const [formError, setFormError] = useState<string | null>(null);
  const [isCalendarOpen, setCalendarOpen] = useState<'outbound' | 'inbound' | null>(null);
  const [findCheapest, setFindCheapest] = useState(false);

  useEffect(() => {
    if (initialParams) {
      setTripType(initialParams.type);
      setDepartureId(initialParams.departure_id);
      setArrivalId(initialParams.arrival_id);
      setOutboundDate(initialParams.outbound_date);
      if (initialParams.return_date) {
        setReturnDate(initialParams.return_date);
      } else {
        setReturnDate(getDayAfterTomorrow());
      }
      setPassengers(initialParams.passengers);
    }
  }, [initialParams]);

  const handleAirlineToggle = (code: string) => {
    setSelectedAirlines(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleSwapAirports = () => {
    const temp = departureId;
    setDepartureId(arrivalId);
    setArrivalId(temp);
  };
  
  const handleDepartureSelect = (id: string) => {
    setDepartureId(id);
    setActiveAirportModal('arrival');
  };

  const handleArrivalSelect = (id: string) => {
    setArrivalId(id);
    setActiveAirportModal(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (departureId === arrivalId) {
      setFormError('Điểm đi và điểm đến không được trùng nhau.');
      return;
    }
    
    const params: SearchParams = {
      departure_id: departureId,
      arrival_id: arrivalId,
      outbound_date: outboundDate,
      type: tripType,
      passengers: passengers,
    };

    if (tripType === 'round_trip') {
      if (!returnDate) {
        setFormError('Vui lòng chọn ngày về.');
        return;
      }
       if (new Date(returnDate) < new Date(outboundDate)) {
        setFormError('Ngày về phải sau hoặc cùng ngày đi.');
        return;
      }
      params.return_date = returnDate;
    }
    onSearch(params);
  };
  
  useEffect(() => {
    if (findCheapest) {
        setCalendarOpen('outbound');
    }
  }, [findCheapest]);

  return (
    <div className="bg-[var(--card-bg-color)] rounded-lg shadow-lg">
       {isCalendarOpen && (
            <PriceCalendar
                departureId={departureId}
                arrivalId={arrivalId}
                onClose={() => setCalendarOpen(null)}
                onSelectDate={(date) => {
                    if (isCalendarOpen === 'outbound') {
                        setOutboundDate(date);
                        if (tripType === 'round_trip' && new Date(date) > new Date(returnDate)) {
                            const nextDay = new Date(date);
                            nextDay.setDate(nextDay.getDate() + 1);
                            setReturnDate(nextDay.toISOString().split('T')[0]);
                        }
                    } else {
                        setReturnDate(date);
                    }
                    setCalendarOpen(null);
                }}
                minDate={isCalendarOpen === 'inbound' ? outboundDate : undefined}
                selectedDate={isCalendarOpen === 'outbound' ? outboundDate : returnDate}
            />
        )}
      <div className="bg-[#0083C2] text-white flex items-center p-3 rounded-t-lg">
          <RefreshIcon className="w-6 h-6" />
          <h2 className="text-xl font-bold ml-2">TÌM KIẾM CHUYẾN BAY</h2>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between">
            <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="tripType" value="round_trip" checked={tripType === 'round_trip'} onChange={() => setTripType('round_trip')} className="form-radio text-orange-500 h-4 w-4"/>
                    <span className="font-semibold">Khứ hồi</span>
                </label>
                 <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="tripType" value="one_way" checked={tripType === 'one_way'} onChange={() => setTripType('one_way')} className="form-radio text-orange-500 h-4 w-4"/>
                    <span className="font-semibold">Một chiều</span>
                </label>
                 <label className="flex items-center space-x-2 cursor-pointer opacity-50">
                    <input type="radio" name="tripType" value="multi" disabled className="form-radio text-orange-500 h-4 w-4"/>
                    <span className="font-semibold text-gray-400">Nhiều chặng</span>
                </label>
            </div>
            <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" checked={findCheapest} onChange={(e) => setFindCheapest(e.target.checked)} className="form-checkbox text-orange-500 rounded-sm h-4 w-4"/>
                <span className="font-semibold">Tìm vé rẻ</span>
            </label>
        </div>

        <div className="flex items-center space-x-6 border-t border-b border-[var(--border-color)] py-4">
          {airlines.map(airline => (
            <div key={airline.code} onClick={() => handleAirlineToggle(airline.code)} className="cursor-pointer relative">
              <img src={airline.logo} alt={airline.name} className={`h-6 object-contain transition-opacity duration-200 ${selectedAirlines.includes(airline.code) ? 'opacity-100' : 'opacity-30 dark:opacity-50'}`}/>
              {selectedAirlines.includes(airline.code) && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-px ring-1 ring-white">
                  <CheckIcon className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,_2fr)_auto_minmax(0,_2fr)_minmax(0,_2fr)_minmax(0,_2fr)_minmax(0,_1fr)_auto] gap-px bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-md">
            <div className="flex items-center bg-[var(--card-bg-color)]">
                <div className="bg-gray-100 dark:bg-gray-800 p-3 h-full flex items-center"><PlaneTakeoffIcon className="text-gray-500"/></div>
                <AirportSelector
                    id="departure"
                    selectedAirportId={departureId}
                    onSelectAirport={handleDepartureSelect}
                    placeholder="Điểm đi"
                    className="flex-grow"
                    isOpen={activeAirportModal === 'departure'}
                    onOpen={() => setActiveAirportModal('departure')}
                    onClose={() => setActiveAirportModal(null)}
                />
            </div>

            <div className="flex items-center justify-center bg-[var(--card-bg-color)] px-1">
                <button
                    type="button"
                    onClick={handleSwapAirports}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-red-500 transition-colors"
                    aria-label="Đảo chiều điểm đi và điểm đến"
                >
                    <SwapArrowsIcon className="w-5 h-5" />
                </button>
            </div>

            <div className="flex items-center bg-[var(--card-bg-color)]">
                <div className="bg-gray-100 dark:bg-gray-800 p-3 h-full flex items-center"><PlaneLandIcon className="text-gray-500"/></div>
                <AirportSelector
                    id="arrival"
                    selectedAirportId={arrivalId}
                    onSelectAirport={handleArrivalSelect}
                    placeholder="Điểm đến"
                    className="flex-grow"
                    isOpen={activeAirportModal === 'arrival'}
                    onOpen={() => setActiveAirportModal('arrival')}
                    onClose={() => setActiveAirportModal(null)}
                />
            </div>
             <div className="flex items-center bg-[var(--card-bg-color)]">
                <div className="bg-gray-100 dark:bg-gray-800 p-3 h-full flex items-center"><CalendarIcon className="text-gray-500"/></div>
                <button type="button" onClick={() => setCalendarOpen('outbound')} className="w-full p-2 text-left bg-transparent focus:outline-none">
                    {formatDateForDisplay(outboundDate)}
                </button>
             </div>
             <div className="flex items-center bg-[var(--card-bg-color)]">
                <div className={`bg-gray-100 dark:bg-gray-800 p-3 h-full flex items-center ${tripType === 'one_way' ? 'opacity-50' : ''}`}><CalendarIcon className={`${tripType === 'one_way' ? 'text-gray-400 dark:text-gray-600' : 'text-gray-500'}`}/></div>
                 <button type="button" onClick={() => setCalendarOpen('inbound')} disabled={tripType === 'one_way'} className="w-full p-2 text-left bg-transparent focus:outline-none disabled:bg-gray-50 dark:disabled:bg-gray-800/50 disabled:cursor-not-allowed">
                    {tripType === 'round_trip' ? formatDateForDisplay(returnDate) : 'Ngày về'}
                </button>
             </div>
             <div className="flex items-center bg-[var(--card-bg-color)]">
                <div className="bg-gray-100 dark:bg-gray-800 p-3 h-full flex items-center"><UserIcon className="text-gray-500"/></div>
                <PassengerSelector
                  value={passengers}
                  onChange={setPassengers}
                />
             </div>
             <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-orange-500 text-white font-bold py-3 px-4 hover:bg-orange-600 transition-colors duration-300 disabled:bg-orange-300 disabled:cursor-wait flex items-center justify-center"
                >
                {isLoading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    <>
                    <SearchIcon className="h-5 w-5" />
                    <span className="ml-2 hidden lg:inline">TÌM KIẾM</span>
                    </>
                )}
            </button>
        </div>
        {formError && <p className="text-red-600 text-center font-semibold text-sm mt-3">{formError}</p>}
      </form>
    </div>
  );
};

export default SearchForm;