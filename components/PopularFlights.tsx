
import React, { useState, useEffect } from 'react';
import { type SearchParams, type FlightOption } from '../types';
import { searchFlights } from '../services/flightService';
import { InfoIcon } from './icons/Icons';

interface PopularFlightsProps {
  onSearch: (params: SearchParams) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN').format(amount);
};


// Route definitions, dynamic data will be fetched
const popularRoutesConfig = {
    'Thành phố Hồ Chí Minh': [
        { from: 'SGN', to: 'HAN', toCity: 'Hà Nội' },
        { from: 'SGN', to: 'PQC', toCity: 'Phú Quốc' },
        { from: 'SGN', to: 'DAD', toCity: 'Đà Nẵng' }
    ],
    'Hà Nội': [
        { from: 'HAN', to: 'SGN', toCity: 'TP. Hồ Chí Minh' },
        { from: 'HAN', to: 'DAD', toCity: 'Đà Nẵng' },
        { from: 'HAN', to: 'PQC', toCity: 'Phú Quốc' }
    ],
    'Đà Nẵng': [
        { from: 'DAD', to: 'SGN', toCity: 'TP. Hồ Chí Minh' },
        { from: 'DAD', to: 'HAN', toCity: 'Hà Nội' },
        { from: 'DAD', to: 'HPH', toCity: 'Hải Phòng' }
    ],
    'Nha Trang': [
        { from: 'CXR', to: 'SGN', toCity: 'TP. Hồ Chí Minh' },
        { from: 'CXR', to: 'HAN', toCity: 'Hà Nội' },
        { from: 'CXR', to: 'HPH', toCity: 'Hải Phòng' }
    ],
};

const cities = Object.keys(popularRoutesConfig);
type CityName = keyof typeof popularRoutesConfig;

const CardSkeleton: React.FC = () => (
    <div className="bg-[var(--card-bg-color)] border border-[var(--border-color)] rounded-lg p-4 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
        <div className="flex items-center space-x-3 text-sm mt-2">
            <div className="h-5 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
        <div className="flex items-center justify-end mt-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        </div>
    </div>
);


const PopularFlights: React.FC<PopularFlightsProps> = ({ onSearch }) => {
    const [activeCity, setActiveCity] = useState<CityName>(cities[0] as CityName);
    const [flightData, setFlightData] = useState<Record<string, FlightOption | null | 'loading'>>({});

    useEffect(() => {
        const fetchPopularFlights = async () => {
            const routes = popularRoutesConfig[activeCity];
            
            // Set loading state for current city's routes
            const loadingState: Record<string, 'loading'> = {};
            routes.forEach(route => {
                loadingState[`${route.from}-${route.to}`] = 'loading';
            });
            setFlightData(prev => ({ ...prev, ...loadingState }));

            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 3); // Search for flights 3 days from now
            const outboundDate = futureDate.toISOString().split('T')[0];

            const promises = routes.map(route => 
                searchFlights({
                    departure_id: route.from,
                    arrival_id: route.to,
                    outbound_date: outboundDate,
                    type: 'one_way',
                    passengers: { adults: 1, children: 0, infants: 0 },
                }).then(result => ({
                    key: `${route.from}-${route.to}`,
                    data: result.best_flights[0] || result.other_flights[0] || null,
                })).catch(error => {
                    console.error(`Error fetching popular flight for ${route.from}-${route.to}:`, error);
                    return { key: `${route.from}-${route.to}`, data: null };
                })
            );

            const results = await Promise.all(promises);

            const newFlightData: Record<string, FlightOption | null> = {};
            results.forEach(result => {
                newFlightData[result.key] = result.data;
            });

            setFlightData(prev => ({ ...prev, ...newFlightData }));
        };

        fetchPopularFlights();
    }, [activeCity]);

    const handleRouteSelect = (from: string, to: string) => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 3); // Search for flights 3 days from now
        const outboundDate = futureDate.toISOString().split('T')[0];

        const params: SearchParams = {
            departure_id: from,
            arrival_id: to,
            outbound_date: outboundDate,
            type: 'one_way',
            passengers: { adults: 1, children: 0, infants: 0 },
        };
        onSearch(params);
    };

    const renderCardContent = (route: { from: string; to: string; toCity: string; }) => {
        const data = flightData[`${route.from}-${route.to}`];

        if (data === 'loading' || data === undefined) {
            return <CardSkeleton key={`${route.from}-${route.to}`} />;
        }
        
        if (data === null) {
            return (
                 <div
                    key={`${route.from}-${route.to}`}
                    onClick={() => handleRouteSelect(route.from, route.to)}
                    className="bg-[var(--card-bg-color)] border border-[var(--border-color)] rounded-lg p-4 cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all duration-200 opacity-70"
                >
                    <h3 className="text-lg font-bold">{activeCity} → {route.toCity}</h3>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-2 min-h-[20px]">
                        Không tìm thấy chuyến bay cho ngày gần nhất.
                    </div>
                    <div className="flex items-center justify-end mt-4">
                        <span className="text-lg font-bold text-gray-500 dark:text-gray-400">Thử tìm kiếm</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </div>
            );
        }

        const flightInfo = data.flights[0];
        const outboundDate = new Date(flightInfo.departure_airport.time);
        
        return (
            <div
                key={`${route.from}-${route.to}`}
                onClick={() => handleRouteSelect(route.from, route.to)}
                className="bg-[var(--card-bg-color)] border border-[var(--border-color)] rounded-lg p-4 cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all duration-200"
            >
                <h3 className="text-lg font-bold">{activeCity} → {route.toCity}</h3>
                <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-300 mt-2">
                    <img src={flightInfo.airline_logo} alt={flightInfo.airline} className="h-5" />
                    <span>{`Ngày ${outboundDate.getDate()} thg ${outboundDate.getMonth() + 1}`}</span>
                    <span>•</span>
                    <span>Bay thẳng</span>
                </div>
                <div className="flex items-center justify-end mt-4">
                    <span className="text-gray-500 dark:text-gray-400 mr-auto">từ</span>
                    <div className="flex items-center">
                        <span className="text-lg font-bold">{formatCurrency(data.price_net)} đ</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="mt-12">
            <div className="flex items-center mb-4">
                <h2 className="text-xl font-semibold">Tìm các chuyến bay giá rẻ từ Việt Nam đến bất cứ đâu</h2>
                <InfoIcon className="w-5 h-5 ml-2 text-gray-500" />
            </div>
            
            <div className="flex items-center space-x-2 mb-6 flex-wrap gap-y-2">
                {cities.map(city => (
                    <button
                        key={city}
                        onClick={() => setActiveCity(city as CityName)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 ${
                            activeCity === city
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-[var(--card-bg-color)] border border-[var(--border-color)] hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                    >
                        {city}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {popularRoutesConfig[activeCity].map(route => renderCardContent(route))}
            </div>
        </div>
    );
};

export default PopularFlights;