import { type ApiResult, type SearchParams, type FlightOption, type FlightDetailsResult, type SelectedFlightLeg, type BookingOption, type Baggage, type FeeConfig, type FlightDetail } from '../types';
import { PROXY_URL, FLIGHT_API_URL } from './apiConfig';

// Switched to a new CORS proxy to resolve blocking errors.
const API_BASE_URL = FLIGHT_API_URL;

// Helper function to get random integer in a range
const getRandomInt = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

// --- DYNAMIC DATA INJECTION FOR SEARCH RESULTS ---
const airlineBaseBaggage: { [key: string]: Baggage } = {
  'Vietnam Airlines': { carry_on: '12kg', checked: '23kg' },
  'Vietjet Air': { carry_on: '7kg', checked: 'Không bao gồm' },
  'Bamboo Airways': { carry_on: '7kg', checked: 'Không bao gồm' },
  'default': { carry_on: '7kg', checked: 'Theo quy định' }
};

export const searchFlights = async (params: SearchParams): Promise<ApiResult> => {
  const queryObj: { [key: string]: string } = {
    departure_id: params.departure_id,
    arrival_id: params.arrival_id,
    outbound_date: params.outbound_date,
    currency: 'VND',
    hl: 'vi',
  };

  // Explicitly set type and return_date based on params.type to ensure correctness
  if (params.type === 'round_trip' && params.return_date) {
    queryObj.type = 'round_trip';
    queryObj.return_date = params.return_date;
  } else {
    queryObj.type = 'one_way';
  }

  const queryParams = new URLSearchParams(queryObj);
  
  const finalApiUrl = `${API_BASE_URL}?${queryParams.toString()}`;
  const proxiedUrl = `${PROXY_URL}${finalApiUrl}`;

  try {
    const response = await fetch(proxiedUrl);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Proxy/API Error:", response.status, errorBody);
      throw new Error(`Network response was not ok. Status: ${response.status}`);
    }

    const data: ApiResult = await response.json();
    
    // Process flights: filter out zero price and inject dynamic mock data
    const processFlights = (flights: FlightOption[] | undefined): FlightOption[] => {
        return (flights || [])
            .filter(f => f.price_net > 0)
            .map(f => {
                const airlineLower = f.flights[0]?.airline.toLowerCase() || '';
                let baseBaggage: Baggage;

                if (airlineLower.includes('vietjet')) {
                    baseBaggage = airlineBaseBaggage['Vietjet Air'];
                } else if (airlineLower.includes('vietnam airlines')) {
                    baseBaggage = airlineBaseBaggage['Vietnam Airlines'];
                } else if (airlineLower.includes('bamboo')) {
                    baseBaggage = airlineBaseBaggage['Bamboo Airways'];
                } else {
                    baseBaggage = airlineBaseBaggage['default'];
                }

                return {
                    ...f,
                    seats_left: getRandomInt(3, 25), // Inject mock seat count
                    baggage: baseBaggage, // Inject dynamic base baggage info
                };
            });
    };
    
    return {
      ...data,
      best_flights: processFlights(data.best_flights),
      other_flights: processFlights(data.other_flights),
    };
  } catch (e) {
      console.error("Failed to fetch or parse flight data.", e);
      throw new Error("Invalid data format received or network error during flight search.");
  }
};


// --- DYNAMIC MOCK DATA GENERATION FOR CHECKOUT PAGE ---

// Data structure for airline-specific fare classes
const airlineFareClasses = {
  'Vietnam Airlines': [
    { name: 'Phổ thông Tiết kiệm', priceMultiplier: 1.0, seats: [10, 25], baggage: ["Miễn phí 1 kiện 12kg xách tay", "Miễn phí 1 kiện 23kg ký gửi"], extensions: ["Không hoàn vé", "Đổi vé mất phí", "Tích lũy dặm bay"] },
    { name: 'Phổ thông Tiêu chuẩn', priceMultiplier: 1.25, seats: [8, 20], baggage: ["Miễn phí 1 kiện 12kg xách tay", "Miễn phí 1 kiện 23kg ký gửi"], extensions: ["Hoàn vé mất phí", "Đổi vé mất phí", "Tích lũy dặm bay 100%"] },
    { name: 'Phổ thông Linh hoạt', priceMultiplier: 1.6, seats: [5, 15], baggage: ["Miễn phí 1 kiện 12kg xách tay", "Miễn phí 1 kiện 23kg ký gửi"], extensions: ["Miễn phí hoàn vé", "Miễn phí đổi vé", "Chọn trước chỗ ngồi"] },
    { name: 'Thương gia', priceMultiplier: 2.8, seats: [2, 8], baggage: ["Miễn phí 2 kiện 18kg xách tay", "Miễn phí 1 kiện 32kg ký gửi"], extensions: ["Miễn phí hoàn vé và đổi vé", "Phòng chờ thương gia", "Ưu tiên làm thủ tục"] }
  ],
  'Vietjet Air': [
    { name: 'Eco', priceMultiplier: 1.0, seats: [15, 30], baggage: ["Miễn phí 7kg xách tay"], extensions: ["Không hoàn vé", "Đổi vé mất phí", "Không bao gồm suất ăn"] },
    { name: 'Deluxe', priceMultiplier: 1.35, seats: [10, 25], baggage: ["Miễn phí 7kg xách tay", "Miễn phí 20kg ký gửi"], extensions: ["Miễn phí đổi vé (thu chênh lệch)", "Chọn trước chỗ ngồi (trừ hàng ghế thoát hiểm)"] },
    { name: 'SkyBoss', priceMultiplier: 2.4, seats: [3, 9], baggage: ["Miễn phí 10kg xách tay", "Miễn phí 30kg ký gửi"], extensions: ["Miễn phí thay đổi chuyến bay", "Phòng chờ ưu tiên", "Ưu tiên làm thủ tục & hành lý"] }
  ],
  'Bamboo Airways': [
    { name: 'Economy Saver', priceMultiplier: 1.0, seats: [12, 28], baggage: ["Miễn phí 7kg xách tay"], extensions: ["Không hoàn vé", "Đổi vé mất phí"] },
    { name: 'Economy Smart', priceMultiplier: 1.25, seats: [8, 22], baggage: ["Miễn phí 7kg xách tay", "Miễn phí 20kg ký gửi"], extensions: ["Hoàn vé mất phí", "Đổi vé mất phí"] },
    { name: 'Business', priceMultiplier: 2.6, seats: [4, 10], baggage: ["Miễn phí 2 kiện 7kg xách tay", "Miễn phí 40kg ký gửi"], extensions: ["Miễn phí hoàn vé", "Phòng chờ thương gia", "Suất ăn miễn phí"] }
  ],
  'default': [
    { name: 'Phổ thông Tiết kiệm', priceMultiplier: 1.0, seats: [10, 25], baggage: ["1 kiện xách tay miễn phí", "Hành lý ký gửi trả phí"], extensions: ["Không hoàn vé", "Đổi vé mất phí"] },
    { name: 'Phổ thông Linh hoạt', priceMultiplier: 1.4, seats: [5, 15], baggage: ["1 kiện xách tay miễn phí", "Miễn phí 1 kiện 23kg ký gửi"], extensions: ["Miễn phí đổi vé", "Miễn phí chọn chỗ ngồi"] }
  ]
};

const getFareClassesForAirline = (airlineName: string) => {
    const airlineLower = airlineName.toLowerCase();
    if (airlineLower.includes('vietjet')) return airlineFareClasses['Vietjet Air'];
    if (airlineLower.includes('vietnam airlines')) return airlineFareClasses['Vietnam Airlines'];
    if (airlineLower.includes('bamboo')) return airlineFareClasses['Bamboo Airways'];
    return airlineFareClasses['default'];
};


const generateBookingOptionsForLeg = (basePriceUSD: number, airline: string, logo: string, flightNumbers: string[]): BookingOption[] => {
    const fareClasses = getFareClassesForAirline(airline);
    return fareClasses.map(fare => ({
        together: {
            book_with: airline,
            airline: true,
            airline_logos: [logo],
            marketed_as: flightNumbers,
            price: parseFloat((basePriceUSD * fare.priceMultiplier).toFixed(2)),
            option_title: fare.name,
            extensions: fare.extensions,
            baggage_prices: fare.baggage,
            seats_left: getRandomInt(fare.seats[0], fare.seats[1]),
        }
    }));
};

// --- ROUND TRIP PROCESSING LOGIC ---

/**
 * Splits a list of flight legs into outbound and inbound journeys.
 * The split point is determined by finding the longest layover time between legs.
 */
export const splitRoundTrip = (flights: FlightDetail[]): { outbound: FlightDetail[], inbound: FlightDetail[] } => {
    if (flights.length < 2) {
        return { outbound: flights, inbound: [] };
    }

    let longestLayover = -1;
    let splitIndex = -1;

    for (let i = 0; i < flights.length - 1; i++) {
        const arrivalTime = new Date(flights[i].arrival_airport.time).getTime();
        const departureTime = new Date(flights[i + 1].departure_airport.time).getTime();
        const layover = departureTime - arrivalTime;
        if (layover > longestLayover) {
            longestLayover = layover;
            splitIndex = i + 1;
        }
    }

    if (splitIndex !== -1) {
        return {
            outbound: flights.slice(0, splitIndex),
            inbound: flights.slice(splitIndex),
        };
    }
    
    // Fallback for cases with no significant layover (e.g., only 2 legs)
    return { outbound: [flights[0]], inbound: flights.slice(1) };
};

const generateMockFlightDetails = (flightOption: FlightOption): FlightDetailsResult => {
  const USD_VND_RATE = 25400;
  const basePriceUSD = flightOption.price_net / USD_VND_RATE;
  
  const result: FlightDetailsResult = {
      selected_flights: [],
      booking_options: [],
      baggage_prices: { together: ["Thông tin hành lý chi tiết theo từng gói vé"] },
      price_insights: {
          lowest_price: parseFloat(basePriceUSD.toFixed(2)),
          price_level: "bình thường",
          typical_price_range: [parseFloat((basePriceUSD * 0.9).toFixed(2)), parseFloat((basePriceUSD * 1.5).toFixed(2))]
      }
  };

  if (flightOption.type.toLowerCase() === 'round trip' && flightOption.flights.length > 1) {
      const { outbound: outboundFlights, inbound: inboundFlights } = splitRoundTrip(flightOption.flights);
      
      const outboundLeg: SelectedFlightLeg = {
          flights: outboundFlights,
          total_duration: outboundFlights.reduce((sum, f) => sum + f.duration, 0),
          carbon_emissions: { this_flight: 20000 + getRandomInt(0, 2500), typical_for_this_route: 20000, difference_percent: getRandomInt(0, 10) },
          type: "Chuyến đi",
          airline_logo: outboundFlights[0].airline_logo,
          departure_token: `mock_token_outbound`
      };
      result.selected_flights.push(outboundLeg);

      if (inboundFlights.length > 0) {
          const inboundLeg: SelectedFlightLeg = {
              flights: inboundFlights,
              total_duration: inboundFlights.reduce((sum, f) => sum + f.duration, 0),
              carbon_emissions: { this_flight: 20000 + getRandomInt(0, 2500), typical_for_this_route: 20000, difference_percent: getRandomInt(0, 10) },
              type: "Chuyến về",
              airline_logo: inboundFlights[0].airline_logo,
              departure_token: `mock_token_inbound`
          };
          result.selected_flights.push(inboundLeg);

          // Generate separate booking options for each leg
          const legPrice = basePriceUSD / 2;
          result.outbound_booking_options = generateBookingOptionsForLeg(legPrice, outboundFlights[0].airline, outboundFlights[0].airline_logo, outboundFlights.map(f => f.flight_number));
          result.inbound_booking_options = generateBookingOptionsForLeg(legPrice, inboundFlights[0].airline, inboundFlights[0].airline_logo, inboundFlights.map(f => f.flight_number));
      } else {
         // Fallback to one-way logic if inbound is empty
         result.booking_options = generateBookingOptionsForLeg(basePriceUSD, outboundFlights[0].airline, outboundFlights[0].airline_logo, outboundFlights.map(f => f.flight_number));
      }

  } else {
      // One-way logic
      const leg: SelectedFlightLeg = {
          flights: flightOption.flights,
          total_duration: flightOption.flights.reduce((sum, f) => sum + f.duration, 0),
          carbon_emissions: { this_flight: 40000 + getRandomInt(0, 5000), typical_for_this_route: 40000, difference_percent: getRandomInt(0, 10) },
          type: "Một chiều",
          airline_logo: flightOption.flights[0].airline_logo,
          departure_token: `mock_token_oneway`
      };
      result.selected_flights.push(leg);
      result.booking_options = generateBookingOptionsForLeg(basePriceUSD, flightOption.flights[0].airline, flightOption.flights[0].airline_logo, flightOption.flights.map(f => f.flight_number));
  }
  
  return result;
};


const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export const getFlightDetails = async (flight: FlightOption): Promise<FlightDetailsResult> => {
  console.log(`Generating dynamic details for flight: ${flight.flights[0].airline} ${flight.flights[0].flight_number}.`);
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
  
  // Generate mock details based on the actual flight data
  const dynamicDetails = generateMockFlightDetails(flight);
  
  return dynamicDetails;
};