export interface Airport {
  id: string;
  name: string;
}

export interface AirportInfo {
  airport: Airport;
  city: string;
  country: string;
  country_code: string;
}

export interface FlightAirportInfo {
  name: string;
  id: string;
  time: string;
}

export interface FlightDetail {
  departure_airport: FlightAirportInfo;
  arrival_airport: FlightAirportInfo;
  airline: string;
  airline_logo: string;
  flight_number: string;
  duration: number;
  airplane: string;
  class: string;
  travel_class?: string;
  legroom?: string;
  extensions?: string[];
}

export interface Baggage {
  carry_on: string;
  checked: string;
}

export interface FlightOption {
  flights: FlightDetail[];
  price_net: number;
  currency: string;
  type: string; 
  baggage: Baggage;
  booking_token?: string;
  seats_left?: number;
}

export interface ApiResult {
  status: string;
  best_flights: FlightOption[];
  other_flights: FlightOption[];
  airports: {
    departure: AirportInfo[];
    arrival: AirportInfo[];
  }[];
}

export type TripType = 'one_way' | 'round_trip';

export interface Passengers {
    adults: number;
    children: number;
    infants: number;
}

export interface SearchParams {
  departure_id: string;
  arrival_id: string;
  outbound_date: string;
  return_date?: string;
  type: TripType;
  passengers: Passengers;
}

export interface PassengerDetails {
  fullName: string;
  title: 'Mr' | 'Mrs' | 'Miss' | 'Master'; 
  dob: string;
  idNumber: string; 
  type: 'Adult' | 'Child' | 'Infant';
}

export interface ContactDetails {
  fullName: string;
  email: string;
  phone: string;
  gender: 'Mr' | 'Mrs';
  address: string;
}

export interface AncillaryOption {
  id: string;
  name: string;
  price: number;
  description?: string;
}

export interface SelectedAncillaries {
  outboundBaggage?: AncillaryOption;
  inboundBaggage?: AncillaryOption;
}

export interface BookingData {
    // Core booking info
    id: string; // Order ID
    pnr: string;
    bookingTimestamp: string; // ISO string
    passengers: PassengerDetails[];
    contact: ContactDetails;
    ancillaries?: SelectedAncillaries;
    status?: string; // e.g., 'pending', 'confirmed', 'cancelled'
    admin_note?: string;
    userId?: number | string;
    
    // Professional V2 Payment & Cancellation Fields
    payment_status?: 'pending' | 'paid' | 'refunded';
    payment_info?: any; // Stores JSON payment details (method, transaction ID, date)
    total_amount?: number;
    cancellation_reason?: string;

    // Data needed to reconstruct the E-Ticket
    flight: FlightOption;
    bookingDetails: FlightDetailsResult;
    selectedOutboundOption: BookingOption;
    selectedInboundOption: BookingOption | null;
}


// New types for flight details API
export interface SelectedFlightLeg {
  flights: FlightDetail[];
  total_duration: number;
  carbon_emissions: {
    this_flight: number;
    typical_for_this_route: number;
    difference_percent: number;
  };
  type: string;
  airline_logo: string;
  departure_token: string;
}

export interface BookingOptionDetails {
    book_with: string;
    airline: boolean;
    airline_logos: string[];
    marketed_as: string[];
    price: number;
    option_title?: string;
    extensions: string[];
    baggage_prices: string[];
    seats_left?: number;
}

export interface BookingOption {
  together: BookingOptionDetails;
  departing?: BookingOptionDetails;
  returning?: BookingOptionDetails;
  separate_tickets?: boolean;
}

export interface FlightDetailsResult {
  selected_flights: SelectedFlightLeg[];
  baggage_prices: {
    together?: string[];
    departing?: string[];
    returning?: string[];
  };
  booking_options: BookingOption[];
  outbound_booking_options?: BookingOption[];
  inbound_booking_options?: BookingOption[];
  price_insights: {
    lowest_price: number;
    price_level: string;
    typical_price_range: [number, number];
  };
}

export interface FeeConfig {
  service_type: 'fixed' | 'percent';
  service_value: number;
  tax_type: 'fixed' | 'percent';
  tax_value: number;
  currency?: string;
}

export interface AdminFeeConfig {
  default: FeeConfig;
  domestic: FeeConfig;
  international: FeeConfig;
  airlines: {
    [key: string]: FeeConfig; 
  };
}


export interface NewsArticle {
    title: string;
    link: string;
    source: string;
    summary: string;
    imageUrl?: string;
}

export interface AISuggestion {
  destinationName: string;
  airportCode: string;
  description: string;
  activities: string[];
  suggestedOutboundDate: string;
  suggestedReturnDate?: string;
}

export interface User {
  id?: number | string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  gender?: string;
  dob?: string;
  address?: string;
  id_card?: string; 
  nationality?: string;
  created_at?: string;
  loyalty_points?: number; // Professional V2
}

export interface Admin {
  id: number | string;
  name: string;
  username: string;
  role: string;
  created_at?: string;
}

export interface BookingLookupData {
  orderId: string;
  email: string;
}

export interface PaymentHistory {
    bookingId: string;
    pnr: string;
    payment_status: string;
    total_amount: number;
    payment_info: any;
    bookingTimestamp: string;
}