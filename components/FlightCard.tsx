import React, { useState, useMemo } from 'react';
import { type FlightOption, type FlightDetail, type Passengers } from '../types';
import { ClockIcon, PlaneIcon, BriefcaseIcon, TicketIcon, UserGroupIcon } from './icons/Icons';
import { AIRPORTS } from '../constants';
import { splitRoundTrip } from '../services/flightService';

interface FlightCardProps {
  flightOption: FlightOption;
  isBest: boolean;
  passengers: Passengers;
  onSelect: (flight: FlightOption) => void;
  isSelected: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const formatDuration = (minutes: number) => {
  if (minutes < 0) return 'N/A';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const getAirportFullName = (id: string): string => {
  const airport = AIRPORTS.find(a => a.id === id);
  return airport ? airport.name.replace(/\s*\([^)]+\)/, '') : id;
};

const FlightLeg: React.FC<{ flight: FlightDetail }> = ({ flight }) => (
    <div className="flex items-center space-x-4">
        {/* Airline Info */}
        <div className="flex-shrink-0 w-24 text-center">
            <img src={flight.airline_logo} alt={flight.airline} className="h-12 w-12 object-contain rounded-lg bg-white p-1 shadow-sm mx-auto" />
            <p className="text-sm font-semibold mt-1 truncate">{flight.airline}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{flight.flight_number}</p>
        </div>

        {/* Flight Timeline */}
        <div className="flex-grow">
            <div className="grid grid-cols-3 items-center gap-2">
                {/* Departure */}
                <div className="text-left">
                    <p className="font-bold text-xl">{formatTime(flight.departure_airport.time)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{getAirportFullName(flight.departure_airport.id)} ({flight.departure_airport.id})</p>
                </div>
                {/* Connection Info */}
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    <div className="flex items-center justify-center text-gray-400">
                        <div className="w-full border-t border-dashed border-[var(--border-color)]"></div>
                        <PlaneIcon className="mx-2 flex-shrink-0" />
                        <div className="w-full border-t border-dashed border-[var(--border-color)]"></div>
                    </div>
                    <div className="flex items-center justify-center mt-1">
                        <ClockIcon className="mr-1" />
                        <span>{formatDuration(flight.duration)}</span>
                    </div>
                     <span className="text-xs bg-blue-100 text-blue-800 font-medium px-2 py-0.5 rounded-full mt-1.5 inline-block">{flight.class}</span>
                </div>
                {/* Arrival */}
                <div className="text-right">
                    <p className="font-bold text-xl">{formatTime(flight.arrival_airport.time)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{getAirportFullName(flight.arrival_airport.id)} ({flight.arrival_airport.id})</p>
                </div>
            </div>
        </div>
    </div>
);

const LayoverInfo: React.FC<{ from: FlightDetail; to: FlightDetail }> = ({ from, to }) => {
    const arrivalTime = new Date(from.arrival_airport.time).getTime();
    const nextDepartureTime = new Date(to.departure_airport.time).getTime();
    const layoverMinutes = Math.round((nextDepartureTime - arrivalTime) / (1000 * 60));

    if (layoverMinutes <= 0) return null;

    return (
        <div className="my-4 mx-auto max-w-lg text-center py-3 px-4 bg-gray-100 dark:bg-gray-800 border-t border-b border-[var(--border-color)] rounded-lg">
            <p className="text-sm font-semibold">
                Điểm dừng tại {getAirportFullName(from.arrival_airport.id)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Thời gian chờ: <span className="font-medium">{formatDuration(layoverMinutes)}</span> • Hành khách có thể cần đổi máy bay
            </p>
        </div>
    );
};

const JourneyDetails: React.FC<{ title: string; legs: FlightDetail[] }> = ({ title, legs }) => (
    <div>
        <h3 className="text-md font-bold bg-gray-100 dark:bg-gray-800 px-6 py-2 -mx-6 mb-4 border-b border-t border-[var(--border-color)]">{title}</h3>
        <div className="space-y-2">
            {legs.map((leg, index) => (
                <React.Fragment key={`${leg.flight_number}-${index}`}>
                    <FlightLeg flight={leg} />
                    {index < legs.length - 1 && <LayoverInfo from={leg} to={legs[index + 1]} />}
                </React.Fragment>
            ))}
        </div>
    </div>
);

// Mock tax and fee calculation for a more detailed breakdown
const calculateTaxesAndFees = (baseFare: number): { taxes: number, fees: number } => {
    const taxRate = 0.08; // 8% VAT
    const airportFee = 99000; // Fixed airport fee per passenger
    const taxes = baseFare * taxRate;
    return { taxes, fees: airportFee };
};

const FlightItinerarySummary: React.FC<{ flight: FlightDetail }> = ({ flight }) => {
    return (
        <div className="p-3 mb-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                <div className="flex items-center gap-2">
                    <img src={flight.airline_logo} alt={flight.airline} className="h-6 w-6 object-contain" />
                    <div>
                        <div className="font-bold">{flight.airline}</div>
                        <div className="text-xs text-gray-500">{flight.flight_number} • {flight.class}</div>
                    </div>
                </div>
                <div>
                    <div className="font-semibold">Khởi hành</div>
                    <div className="text-gray-600 dark:text-gray-300">{getAirportFullName(flight.departure_airport.id)} ({flight.departure_airport.id})</div>
                </div>
                <div>
                     <div className="font-semibold">Thời gian</div>
                     <div className="text-gray-600 dark:text-gray-300">{formatTime(flight.departure_airport.time)}, {formatDate(flight.departure_airport.time)}</div>
                </div>
            </div>
        </div>
    );
};


const ExpandedDetails: React.FC<{ flight: FlightOption; passengers: Passengers; onSelect: () => void; isSelected: boolean; }> = ({ flight, passengers, onSelect, isSelected }) => {
    const totalPricedPassengers = passengers.adults + passengers.children;
    const baseFarePerPassenger = flight.price_net;

    const { taxes, fees } = calculateTaxesAndFees(baseFarePerPassenger);
    const totalPerPassenger = baseFarePerPassenger + taxes + fees;
    const total = totalPerPassenger * totalPricedPassengers;

    return (
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 -mx-1 -mb-1 mt-4 border-t border-[var(--border-color)]">
            <h4 className="font-bold mb-3 text-lg">Chi tiết chuyến bay và giá vé</h4>
            <FlightItinerarySummary flight={flight.flights[0]} />
            <div className="space-y-3 text-sm">
                {/* Headers */}
                <div className="grid grid-cols-5 gap-2 font-semibold text-gray-600 dark:text-gray-400">
                    <span>Hành khách</span>
                    <span className="text-center">Số lượng</span>
                    <span className="text-right">Giá vé</span>
                    <span className="text-right">Thuế & Phí</span>
                    <span className="text-right">Thành tiền</span>
                </div>
                
                {/* Adults */}
                {passengers.adults > 0 && (
                     <div className="grid grid-cols-5 gap-2 items-center border-b border-dashed pb-3">
                        <div className="font-semibold">Người lớn</div>
                        <div className="text-center">{passengers.adults}</div>
                        <div className="text-right">{formatCurrency(baseFarePerPassenger)}</div>
                        <div className="text-right">{formatCurrency(taxes + fees)}</div>
                        <div className="text-right font-semibold">{formatCurrency(totalPerPassenger * passengers.adults)}</div>
                    </div>
                )}
                
                {/* Children */}
                {passengers.children > 0 && (
                     <div className="grid grid-cols-5 gap-2 items-center border-b border-dashed pb-3">
                        <div className="font-semibold">Trẻ em</div>
                        <div className="text-center">{passengers.children}</div>
                        <div className="text-right">{formatCurrency(baseFarePerPassenger)}</div>
                        <div className="text-right">{formatCurrency(taxes + fees)}</div>
                        <div className="text-right font-semibold">{formatCurrency(totalPerPassenger * passengers.children)}</div>
                    </div>
                )}
                
                {/* Infants */}
                {passengers.infants > 0 && (
                    <div className="grid grid-cols-5 gap-2 items-center text-gray-500">
                        <span>Em bé</span>
                        <span className="text-center">{passengers.infants}</span>
                        <span className="text-right col-span-3">Phí em bé sẽ được báo sau</span>
                    </div>
                )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-[var(--border-color)] text-right">
                <p className="text-sm">Tổng cộng ({totalPricedPassengers} khách): <span className="font-bold text-2xl text-red-600 ml-2">{formatCurrency(total)}</span></p>
                <button 
                    onClick={(e) => { e.stopPropagation(); onSelect(); }}
                    className="mt-3 bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 transition-colors duration-300 shadow-md hover:shadow-lg">
                    {isSelected ? 'Đã chọn' : 'Chọn vé'}
                </button>
            </div>
        </div>
    );
};


const FlightCard: React.FC<FlightCardProps> = ({ flightOption, isBest, passengers, onSelect, isSelected }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const borderClass = isBest ? 'border-red-500' : 'border-transparent';
  const selectedClass = isSelected ? 'ring-2 ring-red-500 ring-offset-2' : 'shadow-lg';
  
  const totalPricedPassengers = passengers.adults + passengers.children;
  
  const isRoundTrip = flightOption.type.toLowerCase().includes('round');
  const { outbound: outboundLegs, inbound: inboundLegs } = isRoundTrip ? splitRoundTrip(flightOption.flights) : { outbound: flightOption.flights, inbound: [] };

  const getJourneyTitle = (journeyLegs: FlightDetail[], prefix: string = '') => {
    if (!journeyLegs || journeyLegs.length === 0) {
      return '';
    }
    const startAirport = journeyLegs[0].departure_airport;
    const endAirport = journeyLegs[journeyLegs.length - 1].arrival_airport;
    const journeyString = `${getAirportFullName(startAirport.id)} → ${getAirportFullName(endAirport.id)}`;
    return prefix + journeyString;
  };

  const airplaneInfo = [...new Set(flightOption.flights.map(f => f.airplane))].filter(Boolean).join(', ');
  const flightClass = flightOption.flights[0]?.class || 'Phổ thông';

  return (
    <div className={`bg-[var(--card-bg-color)] rounded-xl hover:shadow-xl transition-all duration-300 border-l-4 ${borderClass} ${selectedClass} overflow-hidden border border-t-0 border-r-0 border-b-0 cursor-pointer`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex flex-col md:flex-row items-stretch">
        <div className="flex-grow p-4 md:p-6">
          <div className="space-y-6">
             {isRoundTrip && inboundLegs.length > 0 ? (
                <>
                    <JourneyDetails title={getJourneyTitle(outboundLegs, "Chuyến đi: ")} legs={outboundLegs} />
                    <div className="border-t border-dashed border-[var(--border-color)] -mx-6"></div>
                    <JourneyDetails title={getJourneyTitle(inboundLegs, "Chuyến về: ")} legs={inboundLegs} />
                </>
             ) : (
                <JourneyDetails title={getJourneyTitle(outboundLegs)} legs={outboundLegs} />
             )}
          </div>
          <div className="mt-6 pt-4 border-t border-dashed border-[var(--border-color)] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-x-4 gap-y-3 text-sm">
              <div className="flex items-center">
                  <BriefcaseIcon className="w-5 h-5 mr-2 text-blue-500 flex-shrink-0" />
                  <div>
                      <span className="text-gray-500 dark:text-gray-400">Xách tay</span>
                      <p className="font-semibold">{flightOption.baggage?.carry_on || 'Theo quy định'}</p>
                  </div>
              </div>
              <div className="flex items-center">
                  <BriefcaseIcon className="w-5 h-5 mr-2 text-green-500 flex-shrink-0" />
                  <div>
                      <span className="text-gray-500 dark:text-gray-400">Ký gửi</span>
                      <p className={`font-semibold ${
                        !flightOption.baggage?.checked || flightOption.baggage.checked.toLowerCase().includes('không') || flightOption.baggage.checked.includes('0') 
                        ? 'text-gray-400' 
                        : 'text-gray-800 dark:text-gray-200'
                      }`}>
                        {flightOption.baggage?.checked || 'Không bao gồm'}
                      </p>
                  </div>
              </div>
               <div className="flex items-center">
                  <TicketIcon className="w-5 h-5 mr-2 text-purple-500 flex-shrink-0" />
                  <div>
                      <span className="text-gray-500 dark:text-gray-400">Hạng vé</span>
                      <p className="font-semibold">{flightClass}</p>
                  </div>
              </div>

              {flightOption.seats_left && (
                  <div className="flex items-center">
                      <UserGroupIcon className="w-5 h-5 mr-2 text-orange-500 flex-shrink-0" />
                      <div>
                          <span className="text-gray-500 dark:text-gray-400">Số chỗ</span>
                          <p className={`font-bold ${flightOption.seats_left <= 10 ? 'text-red-600 animate-pulse' : ''}`}>
                              Còn {flightOption.seats_left}
                          </p>
                      </div>
                  </div>
              )}
              {airplaneInfo && (
                <div className="flex items-center col-span-2 sm:col-span-1">
                    <PlaneIcon className="w-5 h-5 mr-2 text-gray-500 flex-shrink-0 transform-none" />
                    <div>
                        <span className="text-gray-500 dark:text-gray-400">Máy bay</span>
                        <p className="font-semibold">{airplaneInfo || 'Không xác định'}</p>
                    </div>
                </div>
              )}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/50 md:border-l border-[var(--border-color)] p-4 md:p-6 flex flex-col items-center justify-center text-center w-full md:w-64">
          <p className="text-lg font-semibold">{formatCurrency(flightOption.price_net)}<span className="text-sm font-normal text-gray-500 dark:text-gray-400">/khách</span></p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">(Giá vé cơ bản)</p>
          
          { totalPricedPassengers > 1 &&
            <div className="w-full border-t border-[var(--border-color)] pt-2 mt-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">Tổng giá vé cho {totalPricedPassengers} khách</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(flightOption.price_net * totalPricedPassengers)}</p>
            </div>
          }
          <div className="w-full mt-3 text-red-600 font-bold py-2 px-4 rounded-lg bg-red-100 dark:bg-red-900/40">
            {isExpanded ? 'Đóng chi tiết' : 'Xem chi tiết giá'}
          </div>
        </div>
      </div>
      {isExpanded && <ExpandedDetails flight={flightOption} passengers={passengers} onSelect={() => onSelect(flightOption)} isSelected={isSelected} />}
    </div>
  );
};

export default FlightCard;