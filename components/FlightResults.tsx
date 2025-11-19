
import React, { useState, useMemo } from 'react';
import { type Passengers, type FlightOption, type SearchParams } from '../types';
import FlightCard from './FlightCard';
import { PlaneTakeoffIcon, PlaneLandIcon, SwapArrowsIcon } from './icons/Icons';

interface FlightListProps {
    flights: {
        best_flights: FlightOption[];
        other_flights: FlightOption[];
    };
    passengers: Passengers;
    onSelectFlight: (flight: FlightOption) => void;
    selectedFlight: FlightOption | null;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};


const FlightList: React.FC<FlightListProps> = ({ flights, passengers, onSelectFlight, selectedFlight }) => {
    const { best_flights, other_flights } = flights;

    if (best_flights.length === 0 && other_flights.length === 0) {
        return (
            <div className="text-center p-8 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-lg mt-4">
                <h3 className="text-xl font-semibold">Không tìm thấy chuyến bay</h3>
                <p>Không có chuyến bay nào khớp với bộ lọc của bạn cho chặng này. Hãy thử bỏ chọn một vài bộ lọc.</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-8 mt-4">
            {best_flights.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold mb-4 border-l-4 border-red-600 pl-3">Chuyến bay tốt nhất</h2>
                    <div className="space-y-4">
                        {best_flights.map((flight, index) => (
                            <FlightCard 
                                key={`best-${index}`} 
                                flightOption={flight} 
                                isBest={true} 
                                passengers={passengers} 
                                onSelect={onSelectFlight} 
                                isSelected={selectedFlight?.booking_token === flight.booking_token}
                            />
                        ))}
                    </div>
                </div>
            )}
            {other_flights.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold mb-4 border-l-4 border-gray-400 pl-3">Các chuyến bay khác</h2>
                    <div className="space-y-4">
                        {other_flights.map((flight, index) => (
                             <FlightCard 
                                key={`other-${index}`} 
                                flightOption={flight} 
                                isBest={false} 
                                passengers={passengers} 
                                onSelect={onSelectFlight} 
                                isSelected={selectedFlight?.booking_token === flight.booking_token}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}


interface FlightResultsProps {
  outboundFlights: { best_flights: FlightOption[]; other_flights: FlightOption[] };
  inboundFlights: { best_flights: FlightOption[]; other_flights: FlightOption[] };
  isLoading: boolean;
  error: string | null;
  passengers: Passengers;
  onSelectFlight: (flight: FlightOption) => void;
  hasActiveFilters: boolean;
  searchParams: SearchParams | null;
}

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="bg-[var(--card-bg-color)] p-4 rounded-lg shadow-md animate-pulse">
        <div className="flex justify-between items-center">
          <div className="w-1/4 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="w-1/3 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
        <div className="mt-4 border-t border-[var(--border-color)] pt-4">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const FlightResults: React.FC<FlightResultsProps> = (props) => {
    const { 
        outboundFlights, inboundFlights, isLoading, error, passengers, onSelectFlight, hasActiveFilters, searchParams
    } = props;
    
    const [activeTab, setActiveTab] = useState<'outbound' | 'inbound'>('outbound');
    const [selectedOutbound, setSelectedOutbound] = useState<FlightOption | null>(null);
    const [selectedInbound, setSelectedInbound] = useState<FlightOption | null>(null);
    
    const isRoundTrip = searchParams?.type === 'round_trip';

    const handleSelectOutbound = (flight: FlightOption) => {
        setSelectedOutbound(flight);
        setActiveTab('inbound');
    };

    const handleSelectInbound = (flight: FlightOption) => {
        setSelectedInbound(flight);
    };

    const handleConfirmSelection = () => {
        if (!selectedOutbound || !selectedInbound) return;
        
        const combinedFlight: FlightOption = {
            flights: [...selectedOutbound.flights, ...selectedInbound.flights],
            price_net: selectedOutbound.price_net + selectedInbound.price_net,
            currency: selectedOutbound.currency,
            type: 'Round trip', // Set type correctly
            baggage: { // Combine baggage info, or take primary. Checkout page will get specifics from fare class.
                carry_on: selectedOutbound.baggage.carry_on,
                checked: selectedOutbound.baggage.checked,
            },
            booking_token: `${selectedOutbound.booking_token}_${selectedInbound.booking_token}`
        };
        onSelectFlight(combinedFlight);
    };

    const totalPrice = useMemo(() => {
        const pricedPassengers = passengers.adults + passengers.children;
        if (!pricedPassengers) return 0;

        let total = 0;
        if (selectedOutbound) total += selectedOutbound.price_net;
        if (selectedInbound) total += selectedInbound.price_net;
        
        return total * pricedPassengers;
    }, [selectedOutbound, selectedInbound, passengers]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-red-100 border border-red-300 text-red-700 rounded-lg">
        <h3 className="text-xl font-semibold">Oops! Đã có lỗi xảy ra</h3>
        <p>{error}</p>
      </div>
    );
  }

  const noOutboundFlights = outboundFlights.best_flights.length === 0 && outboundFlights.other_flights.length === 0;
  const noInboundFlights = inboundFlights.best_flights.length === 0 && inboundFlights.other_flights.length === 0;

  if (isRoundTrip && (noOutboundFlights || noInboundFlights)) {
       return (
         <div className="text-center p-8 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-lg">
           <h3 className="text-xl font-semibold">Không tìm thấy đủ chặng bay</h3>
           <p>Chúng tôi không thể tìm thấy chuyến bay cho cả hai chiều đi và về. Vui lòng thử lại với ngày hoặc hành trình khác.</p>
         </div>
       );
  }
  
  if (!isRoundTrip && noOutboundFlights) {
       return (
         <div className="text-center p-8 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-lg">
           <h3 className="text-xl font-semibold">Không tìm thấy kết quả</h3>
           <p>{hasActiveFilters ? 'Không có chuyến bay nào khớp với bộ lọc của bạn. Hãy thử bỏ chọn một vài bộ lọc.' : 'Chúng tôi không tìm thấy chuyến bay nào phù hợp. Vui lòng thử lại với ngày hoặc hành trình khác.'}</p>
         </div>
       );
  }


  if (isRoundTrip) {
    return (
        <div className="relative pb-32"> {/* Padding bottom for the sticky bar */}
            {/* Tabs */}
            <div className="flex bg-[var(--card-bg-color)] p-1 rounded-t-lg shadow">
                <button
                    onClick={() => setActiveTab('outbound')}
                    className={`w-1/2 p-3 text-center font-bold rounded-md transition-colors ${activeTab === 'outbound' ? 'bg-red-600 text-white shadow-inner' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <PlaneTakeoffIcon className="w-5 h-5" />
                        <span>CHỌN CHIỀU ĐI</span>
                    </div>
                </button>
                 <button
                    onClick={() => setActiveTab('inbound')}
                    disabled={!selectedOutbound}
                    className={`w-1/2 p-3 text-center font-bold rounded-md transition-colors ${activeTab === 'inbound' ? 'bg-red-600 text-white shadow-inner' : 'hover:bg-gray-100 dark:hover:bg-gray-800'} disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <PlaneLandIcon className="w-5 h-5" />
                        <span>CHỌN CHIỀU VỀ</span>
                    </div>
                </button>
            </div>
            
            {/* Content */}
            <div className="tab-content">
                {activeTab === 'outbound' && <FlightList flights={outboundFlights} passengers={passengers} onSelectFlight={handleSelectOutbound} selectedFlight={selectedOutbound} />}
                {activeTab === 'inbound' && <FlightList flights={inboundFlights} passengers={passengers} onSelectFlight={handleSelectInbound} selectedFlight={selectedInbound} />}
            </div>

            {/* Sticky Summary Bar */}
            {selectedOutbound && (
                 <div className="fixed bottom-0 left-0 right-0 bg-[var(--card-bg-color)] shadow-[0_-4px_10px_rgba(0,0,0,0.1)] z-40 p-4 border-t border-[var(--border-color)]">
                     <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-x-4 w-full">
                            {/* Outbound selection */}
                            <div className="p-2 rounded-md bg-gray-100 dark:bg-gray-800 border border-[var(--border-color)] text-sm">
                                <div className="font-bold flex items-center gap-2"><PlaneTakeoffIcon className="text-gray-500"/> Chiều đi</div>
                                <div className="flex justify-between items-center mt-1">
                                    <span>{selectedOutbound.flights[0].airline} - {selectedOutbound.flights[0].flight_number}</span>
                                    <span className="font-semibold">{formatCurrency(selectedOutbound.price_net)}/khách</span>
                                </div>
                            </div>
                            {/* Inbound selection */}
                            <div className="p-2 rounded-md bg-gray-100 dark:bg-gray-800 border border-[var(--border-color)] text-sm">
                                <div className="font-bold flex items-center gap-2"><PlaneLandIcon className="text-gray-500"/> Chiều về</div>
                                 {selectedInbound ? (
                                    <div className="flex justify-between items-center mt-1">
                                        <span>{selectedInbound.flights[0].airline} - {selectedInbound.flights[0].flight_number}</span>
                                        <span className="font-semibold">{formatCurrency(selectedInbound.price_net)}/khách</span>
                                    </div>
                                 ) : (
                                    <div className="text-gray-500 dark:text-gray-400 mt-1">Vui lòng chọn chuyến bay...</div>
                                 )}
                            </div>
                        </div>
                        <div className="flex-shrink-0 text-center md:text-right w-full md:w-auto">
                             <p className="text-sm text-gray-600 dark:text-gray-400">Tổng cộng ({passengers.adults + passengers.children} khách)</p>
                             <p className="font-bold text-2xl text-red-600">{formatCurrency(totalPrice)}</p>
                             <button 
                                onClick={handleConfirmSelection}
                                disabled={!selectedInbound}
                                className="w-full md:w-auto mt-2 bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                             >
                                Tiếp tục
                             </button>
                        </div>
                     </div>
                 </div>
            )}

        </div>
    )
  }

  // One-way rendering
  return (
    <div className="space-y-8">
      {outboundFlights.best_flights.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 border-l-4 border-red-600 pl-3">Chuyến bay tốt nhất</h2>
          <div className="space-y-4">
            {outboundFlights.best_flights.map((flight, index) => (
              <FlightCard key={`best-${index}`} flightOption={flight} isBest={true} passengers={passengers} onSelect={onSelectFlight} isSelected={false} />
            ))}
          </div>
        </div>
      )}
      {outboundFlights.other_flights.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 border-l-4 border-gray-400 pl-3">Các chuyến bay khác</h2>
          <div className="space-y-4">
            {outboundFlights.other_flights.map((flight, index) => (
              <FlightCard key={`other-${index}`} flightOption={flight} isBest={false} passengers={passengers} onSelect={onSelectFlight} isSelected={false}/>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FlightResults;