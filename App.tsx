
import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import SearchForm from './components/SearchForm';
import FlightResults from './components/FlightResults';
import CheckoutPage from './components/CheckoutPage';
import Sidebar from './components/Sidebar';
import PopularFlights from './components/PopularFlights';
import AIPlanner from './components/AIPlanner';
import NewsSection from './components/NewsSection';
import AuthModal from './components/AuthModal';
import AdminPage from './components/AdminPage';
import BookingLookupModal from './components/BookingLookupModal';
import CompactSearchForm from './components/CompactSearchForm';
import MyBookingsModal from './components/MyBookingsModal';

import { type ApiResult, type SearchParams, type Passengers, type FlightOption, type BookingData, type FlightDetailsResult, type BookingOption, TripType, User, SelectedAncillaries, BookingLookupData } from './types';
import { searchFlights, getFlightDetails } from './services/flightService';
import * as authService from './services/authService';
import * as adminService from './services/adminService';
import * as emailService from './services/emailService';
import { CloseIcon, FilterIcon } from './components/icons/Icons';

const CHECKOUT_STATE_KEY = 'flightCheckoutState';
const DARK_MODE_KEY = 'flightDarkModeState';

const App: React.FC = () => {
  const [outboundSearchResults, setOutboundSearchResults] = useState<ApiResult | null>(null);
  const [inboundSearchResults, setInboundSearchResults] = useState<ApiResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchPerformed, setSearchPerformed] = useState<boolean>(false);
  const [currentPassengers, setCurrentPassengers] = useState<Passengers>({ adults: 1, children: 0, infants: 0 });
  const [selectedFlight, setSelectedFlight] = useState<FlightOption | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState<boolean>(false);
  const [confirmedBookingData, setConfirmedBookingData] = useState<BookingData | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentSearchParams, setCurrentSearchParams] = useState<SearchParams | null>(null);
  const [searchFormParams, setSearchFormParams] = useState<SearchParams | null>(null);
  const [bookingDetails, setBookingDetails] = useState<FlightDetailsResult | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState<boolean>(false);
  const [selectedOutboundOption, setSelectedOutboundOption] = useState<BookingOption | null>(null);
  const [selectedInboundOption, setSelectedInboundOption] = useState<BookingOption | null>(null);
  const [sortOption, setSortOption] = useState('price');
  const [filteredAirlines, setFilteredAirlines] = useState<string[]>([]);
  const [timeFilters, setTimeFilters] = useState<string[]>([]);
  const [stopFilters, setStopFilters] = useState<number[]>([]);

  // New states for professional features
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => localStorage.getItem(DARK_MODE_KEY) === 'true');
  const [currentUser, setCurrentUser] = useState<User | null>(authService.getCurrentUser());
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [isBookingLookupModalOpen, setBookingLookupModalOpen] = useState(false);
  const [isMyBookingsModalOpen, setMyBookingsModalOpen] = useState(false);
  const [view, setView] = useState<'main' | 'admin'>('main');

  // Dark Mode Effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(DARK_MODE_KEY, 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(DARK_MODE_KEY, 'false');
    }
  }, [isDarkMode]);

  // Restore checkout state from sessionStorage on initial load
  useEffect(() => {
    try {
      const savedStateJSON = sessionStorage.getItem(CHECKOUT_STATE_KEY);
      if (savedStateJSON) {
        const savedState = JSON.parse(savedStateJSON);
        if (savedState.selectedFlight && savedState.bookingDetails && savedState.currentPassengers) {
          setSelectedFlight(savedState.selectedFlight);
          setBookingDetails(savedState.bookingDetails);
          setCurrentPassengers(savedState.currentPassengers);
        }
      }
    } catch (error) {
      console.error("Failed to restore checkout state from sessionStorage", error);
      sessionStorage.removeItem(CHECKOUT_STATE_KEY);
    }
  }, []);


  useEffect(() => {
    if (bookingDetails) {
        if (bookingDetails.booking_options && bookingDetails.booking_options.length > 0) {
            setSelectedOutboundOption(bookingDetails.booking_options[0]);
        } else if (bookingDetails.outbound_booking_options && bookingDetails.outbound_booking_options.length > 0) {
            setSelectedOutboundOption(bookingDetails.outbound_booking_options[0]);
        } else {
            setSelectedOutboundOption(null);
        }
        if (bookingDetails.inbound_booking_options && bookingDetails.inbound_booking_options.length > 0) {
            setSelectedInboundOption(bookingDetails.inbound_booking_options[0]);
        } else {
            setSelectedInboundOption(null);
        }
    } else {
        setSelectedOutboundOption(null);
        setSelectedInboundOption(null);
    }
  }, [bookingDetails]);
  
  const resetStateForNewSearch = () => {
    setIsLoading(true);
    setError(null);
    setApiError(null);
    setSearchPerformed(true);
    setOutboundSearchResults(null);
    setInboundSearchResults(null);
    setSelectedFlight(null);
    setBookingDetails(null);
    setSelectedOutboundOption(null);
    setSelectedInboundOption(null);
    setBookingConfirmed(false);
    setConfirmedBookingData(null);
    resetFilters();
  }

  const handleSearch = async (params: SearchParams) => {
    resetStateForNewSearch();
    setCurrentPassengers(params.passengers);
    setCurrentSearchParams(params);

    try {
        if (params.type === 'round_trip' && params.return_date) {
            const outboundParams = { ...params, type: 'one_way' as TripType, return_date: undefined };
            const inboundParams = { 
                ...params, 
                departure_id: params.arrival_id,
                arrival_id: params.departure_id,
                outbound_date: params.return_date,
                return_date: undefined,
                type: 'one_way' as TripType,
            };
            
            const [outbound, inbound] = await Promise.all([
                searchFlights(outboundParams),
                searchFlights(inboundParams)
            ]);

            let errors: string[] = [];
            if (outbound.best_flights.length === 0 && outbound.other_flights.length === 0) {
                errors.push('Không tìm thấy chuyến bay đi.');
            }
             if (inbound.best_flights.length === 0 && inbound.other_flights.length === 0) {
                errors.push('Không tìm thấy chuyến bay về.');
            }
            if (errors.length > 0) {
                setError(errors.join(' Vui lòng thử lại với thông tin khác. '));
            }
            
            setOutboundSearchResults(outbound);
            setInboundSearchResults(inbound);

        } else { // One way
            const results = await searchFlights(params);
            if (results.best_flights.length === 0 && results.other_flights.length === 0) {
                setError('Không tìm thấy chuyến bay nào. Vui lòng thử lại với thông tin khác.');
            }
            setOutboundSearchResults(results);
        }
    } catch (err) {
        setError('Đã xảy ra lỗi khi tìm kiếm chuyến bay. Vui lòng thử lại.');
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  };

  const handleSuggestedSearch = (suggestion: Omit<SearchParams, 'passengers' | 'type'>) => {
    const params: SearchParams = {
        departure_id: suggestion.departure_id,
        arrival_id: suggestion.arrival_id,
        outbound_date: suggestion.outbound_date,
        return_date: suggestion.return_date,
        type: suggestion.return_date ? 'round_trip' : 'one_way',
        passengers: { adults: 1, children: 0, infants: 0 },
    };
    setSearchFormParams(params);
    handleSearch(params);
  };
  
  const handleSelectFlight = async (flight: FlightOption) => {
    setSelectedFlight(flight);
    window.scrollTo(0, 0);

    setIsDetailsLoading(true);
    setApiError(null);
    try {
        const details = await getFlightDetails(flight);
        setBookingDetails(details);
        
        const checkoutState = {
            selectedFlight: flight,
            currentPassengers: currentPassengers,
            bookingDetails: details,
        };
        sessionStorage.setItem(CHECKOUT_STATE_KEY, JSON.stringify(checkoutState));
    } catch (err) {
        console.error("Failed to fetch flight details", err);
        setApiError("Không thể tải chi tiết chuyến bay. Vui lòng thử lại.");
        setBookingDetails(null);
        sessionStorage.removeItem(CHECKOUT_STATE_KEY);
    } finally {
        setIsDetailsLoading(false);
    }
  };

  const handleBackToResults = () => {
    sessionStorage.removeItem(CHECKOUT_STATE_KEY);
    setSelectedFlight(null);
    setBookingDetails(null);
    setSelectedOutboundOption(null);
    setSelectedInboundOption(null);
    setBookingConfirmed(false);
    setConfirmedBookingData(null);
    setApiError(null);
  };
  
  const generateRandomCode = (prefix: string, length: number): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = prefix;
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  };

  const handleConfirmBooking = async (bookingData: Omit<BookingData, 'id' | 'pnr' | 'bookingTimestamp' | 'flight' | 'bookingDetails' | 'selectedOutboundOption' | 'selectedInboundOption'>) => {
    if (!selectedFlight || !bookingDetails || !selectedOutboundOption) {
        setApiError("Đã xảy ra lỗi: Không có chuyến bay hoặc lựa chọn đặt vé nào được chọn.");
        return;
    }

    setIsLoading(true);
    setApiError(null);

    let finalUserId = currentUser?.id;

    try {
        // LOGIC: Ensure we have a valid userId for the backend.
        // If not logged in, we check if email exists -> use that ID.
        // If email does NOT exist -> Auto-register (Silent Guest Checkout) -> use new ID.
        
        if (!finalUserId) {
            const contactEmail = bookingData.contact.email.trim().toLowerCase();
            const contactPhone = bookingData.contact.phone.replace(/\s/g, '');
            const defaultPassword = contactPhone; // Use phone as implicit password

            // 1. Fetch fresh user list to check existence
            let allUsers = await authService.getAllUsers();
            let existingUser = allUsers.find(u => u.email.trim().toLowerCase() === contactEmail);

            if (existingUser && existingUser.id) {
                // Case A: Email exists (Returning Guest) -> Use their ID
                finalUserId = existingUser.id;
                console.log("Guest checkout: Found existing user ID.");
            } else {
                // Case B: New Email (New Guest) -> Auto-register
                console.log("Guest checkout: Email not found, creating new account...");
                
                const newUser: User = {
                    name: bookingData.contact.fullName,
                    email: contactEmail,
                    phone: contactPhone,
                    password: defaultPassword,
                    gender: bookingData.contact.gender,
                    address: bookingData.contact.address,
                    nationality: 'Việt Nam',
                    // Important: Guest checkout doesn't ask for DOB/ID Card in contact info.
                    // Pass undefined/null so backend handles it gracefully.
                    dob: undefined, 
                    id_card: undefined, 
                };

                const regResult = await authService.register(newUser);
                
                if (regResult.success) {
                    // After register, we MUST fetch the list again to get the newly generated ID
                    const refreshedUsers = await authService.getAllUsers();
                    const newUserEntry = refreshedUsers.find(u => u.email.trim().toLowerCase() === contactEmail);
                    
                    if (newUserEntry && newUserEntry.id) {
                        finalUserId = newUserEntry.id;
                        console.log("Guest checkout: New account created and ID retrieved.");
                    } else {
                         // Fallback: Try login to get the object if list update is lagging (rare)
                         const loginRes = await authService.login(contactEmail, defaultPassword);
                         if(loginRes.success && loginRes.user?.id) {
                             finalUserId = loginRes.user.id;
                         }
                    }
                } else {
                    console.warn("Guest auto-registration failed:", regResult.message);
                    // If registration failed (e.g. duplicate phone but different email?), 
                    // we might be stuck. But usually distinct email is enough.
                }
            }
        }

        if (!finalUserId) {
            throw new Error("Không thể tạo hồ sơ khách hàng. Vui lòng thử Đăng ký tài khoản thủ công trước khi đặt vé.");
        }

        const fullBookingData: BookingData = {
            ...bookingData,
            id: generateRandomCode('VYY', 8),
            pnr: generateRandomCode('', 6),
            bookingTimestamp: new Date().toISOString(),
            flight: selectedFlight,
            bookingDetails: bookingDetails,
            selectedOutboundOption: selectedOutboundOption,
            selectedInboundOption: selectedInboundOption,
            userId: finalUserId,
            status: 'pending'
        };

        // Step 1: Save the booking to the primary database.
        const createResult = await adminService.createBooking(fullBookingData);
        if (!createResult.success) {
            throw new Error(createResult.message || 'Không thể lưu thông tin đặt vé vào hệ thống.');
        }

        // Step 2: Send confirmation email as a secondary step.
        const emailResult = await emailService.sendConfirmationEmail(fullBookingData);
        if (!emailResult.success) {
            console.warn("Booking was saved successfully, but the confirmation email failed to send.", emailResult.message);
        }

        setConfirmedBookingData(fullBookingData);
        setBookingConfirmed(true);
        window.scrollTo(0, 0);
        sessionStorage.removeItem(CHECKOUT_STATE_KEY);

    } catch (error) {
        console.error("Failed to process booking:", error);
        const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định.';
        setApiError(`Không thể hoàn tất yêu cầu đặt vé. ${errorMessage}`);
    } finally {
        setIsLoading(false);
    }
  };


  const resetBaseState = () => {
      sessionStorage.removeItem(CHECKOUT_STATE_KEY);
      setOutboundSearchResults(null);
      setInboundSearchResults(null);
      setIsLoading(false);
      setError(null);
      setApiError(null);
      setSearchPerformed(false);
      setCurrentPassengers({ adults: 1, children: 0, infants: 0 });
      setSelectedFlight(null);
      setBookingDetails(null);
      setSelectedOutboundOption(null);
      setSelectedInboundOption(null);
      setBookingConfirmed(false);
      setConfirmedBookingData(null);
      setSearchFormParams(null);
      setCurrentSearchParams(null);
  };
  
  const handleNewSearch = () => {
      resetBaseState();
      if(view === 'admin') setView('main');
  };
  
  const handleNavigateToAdmin = () => {
      resetBaseState();
      setView('admin');
  }

  const handleExitAdmin = () => {
    setView('main');
  }

  const resetFilters = () => {
    setSortOption('price');
    setFilteredAirlines([]);
    setTimeFilters([]);
    setStopFilters([]);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setAuthModalOpen(false);
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  const availableAirlines = useMemo(() => {
    if (!outboundSearchResults && !inboundSearchResults) return [];
    const allFlights = [
        ...(outboundSearchResults?.best_flights || []),
        ...(outboundSearchResults?.other_flights || []),
        ...(inboundSearchResults?.best_flights || []),
        ...(inboundSearchResults?.other_flights || [])
    ];
    const airlines = new Set(allFlights.map(f => f.flights[0].airline));
    return Array.from(airlines).sort();
  }, [outboundSearchResults, inboundSearchResults]);

  useEffect(() => {
    if (searchPerformed) {
        setFilteredAirlines(availableAirlines);
    }
  }, [availableAirlines, searchPerformed]);

  const handleAirlineFilterChange = (airline: string, isChecked: boolean) => {
    setFilteredAirlines(prev => isChecked ? [...prev, airline] : prev.filter(a => a !== airline));
  };
  
  const handleTimeFilterChange = (timeRange: string) => {
    setTimeFilters(prev => prev.includes(timeRange) ? prev.filter(t => t !== timeRange) : [...prev, timeRange]);
  };
  
  const handleStopFilterChange = (stopCount: number) => {
    setStopFilters(prev => prev.includes(stopCount) ? prev.filter(s => s !== stopCount) : [...prev, stopCount]);
  };
  
  const applyFiltersAndSort = useMemo(() => {
    return (flights: FlightOption[] | undefined): FlightOption[] => {
        if (!flights) return [];
        let processedFlights = [...flights];

        if (filteredAirlines.length > 0 && availableAirlines.length > 0) {
            processedFlights = processedFlights.filter(f => filteredAirlines.includes(f.flights[0].airline));
        }

        if (timeFilters.length > 0) {
            processedFlights = processedFlights.filter(f => {
                const departureHour = new Date(f.flights[0].departure_airport.time).getHours();
                return timeFilters.some(filter => {
                    if (filter === 'early_morning') return departureHour >= 0 && departureHour < 6;
                    if (filter === 'morning') return departureHour >= 6 && departureHour < 12;
                    if (filter === 'afternoon') return departureHour >= 12 && departureHour < 18;
                    if (filter === 'evening') return departureHour >= 18 && departureHour < 24;
                    return false;
                });
            });
        }
        
        if (stopFilters.length > 0) {
            processedFlights = processedFlights.filter(f => {
                const stops = f.flights.length - 1;
                if (stops < 0) return stopFilters.includes(0);
                if (stopFilters.includes(2) && stops >= 2) return true;
                return stopFilters.includes(stops);
            });
        }

        processedFlights.sort((a, b) => {
            switch (sortOption) {
                case 'time':
                    return new Date(a.flights[0].departure_airport.time).getTime() - new Date(b.flights[0].departure_airport.time).getTime();
                case 'airline':
                    return a.flights[0].airline.localeCompare(b.flights[0].airline);
                case 'price':
                default:
                    return a.price_net - b.price_net;
            }
        });
        return processedFlights;
    };
  }, [sortOption, filteredAirlines, availableAirlines, timeFilters, stopFilters]);

  const displayedOutboundFlights = useMemo(() => {
      if (!outboundSearchResults) return { best_flights: [], other_flights: [] };
      return {
          best_flights: applyFiltersAndSort(outboundSearchResults.best_flights),
          other_flights: applyFiltersAndSort(outboundSearchResults.other_flights),
      }
  }, [outboundSearchResults, applyFiltersAndSort]);

  const displayedInboundFlights = useMemo(() => {
      if (!inboundSearchResults) return { best_flights: [], other_flights: [] };
      return {
          best_flights: applyFiltersAndSort(inboundSearchResults.best_flights),
          other_flights: applyFiltersAndSort(inboundSearchResults.other_flights),
      }
  }, [inboundSearchResults, applyFiltersAndSort]);

  if (view === 'admin') {
      return <AdminPage onExitAdmin={handleExitAdmin} />;
  }


  const showSidebar = searchPerformed && !isLoading && (outboundSearchResults || inboundSearchResults);
  const hasActiveNonAirlineFilters = timeFilters.length > 0 || stopFilters.length > 0;
  const hasActiveAirlineFilters = filteredAirlines.length > 0 && filteredAirlines.length < availableAirlines.length;

  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] font-sans">
      <Header 
        onNavigateHome={handleNewSearch} 
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        currentUser={currentUser}
        onLoginClick={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        onBookingLookupClick={() => setBookingLookupModalOpen(true)}
        onNavigateToAdmin={handleNavigateToAdmin}
        onMyBookingsClick={() => setMyBookingsModalOpen(true)}
      />
       {isAuthModalOpen && <AuthModal onClose={() => setAuthModalOpen(false)} onLoginSuccess={handleLoginSuccess} />}
       {isBookingLookupModalOpen && <BookingLookupModal onClose={() => setBookingLookupModalOpen(false)} />}
       {isMyBookingsModalOpen && currentUser && <MyBookingsModal user={currentUser} onClose={() => setMyBookingsModalOpen(false)} />}

      <main>
        {selectedFlight ? (
           <CheckoutPage
            flight={selectedFlight}
            passengers={currentPassengers}
            onBack={handleBackToResults}
            onConfirmBooking={handleConfirmBooking}
            isLoading={isLoading}
            isDetailsLoading={isDetailsLoading}
            bookingDetails={bookingDetails}
            selectedOutboundOption={selectedOutboundOption}
            onSelectOutboundOption={setSelectedOutboundOption}
            selectedInboundOption={selectedInboundOption}
            onSelectInboundOption={setSelectedInboundOption}
            isBookingConfirmed={bookingConfirmed}
            onNewSearch={handleNewSearch}
            onSearch={handleSearch}
            bookingData={confirmedBookingData}
            apiError={apiError}
            currentUser={currentUser}
          />
        ) : (
          <div className="container mx-auto px-4 py-8 max-w-7xl">
              <SearchForm onSearch={handleSearch} isLoading={isLoading} initialParams={searchFormParams} />
              {!searchPerformed && !isLoading && (
                  <>
                    <AIPlanner onSuggestedSearch={handleSuggestedSearch} />
                    <PopularFlights onSearch={handleSearch} />
                    <NewsSection />
                  </>
              )}
              
              {searchPerformed && (
                <div className="mt-8 flex flex-col md:flex-row gap-8 items-start">
                    {showSidebar && (
                      <>
                        <div className="hidden md:block w-80 flex-shrink-0 space-y-6">
                           <CompactSearchForm onSearch={handleSearch} initialParams={currentSearchParams} />
                           <Sidebar
                              sortOption={sortOption}
                              onSortChange={setSortOption}
                              availableAirlines={availableAirlines}
                              filteredAirlines={filteredAirlines}
                              onAirlineFilterChange={handleAirlineFilterChange}
                              onSelectAllAirlines={() => setFilteredAirlines(availableAirlines)}
                              onDeselectAllAirlines={() => setFilteredAirlines([])}
                              timeFilters={timeFilters}
                              onTimeFilterChange={handleTimeFilterChange}
                              stopFilters={stopFilters}
                              onStopFilterChange={handleStopFilterChange}
                            />
                        </div>
                         {isSidebarOpen && (
                            <div className="fixed inset-0 z-50 bg-black bg-opacity-50 md:hidden" onClick={() => setIsSidebarOpen(false)}>
                                <div className="absolute left-0 top-0 h-full w-4/5 max-w-sm bg-[var(--bg-color)] p-4 overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
                                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-[var(--border-color)]">
                                        <h2 className="text-lg font-bold">Lọc & Sắp xếp</h2>
                                        <button onClick={() => setIsSidebarOpen(false)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                                          <CloseIcon className="w-6 h-6"/>
                                        </button>
                                    </div>
                                    <Sidebar
                                        sortOption={sortOption}
                                        onSortChange={setSortOption}
                                        availableAirlines={availableAirlines}
                                        filteredAirlines={filteredAirlines}
                                        onAirlineFilterChange={handleAirlineFilterChange}
                                        onSelectAllAirlines={() => setFilteredAirlines(availableAirlines)}
                                        onDeselectAllAirlines={() => setFilteredAirlines([])}
                                        timeFilters={timeFilters}
                                        onTimeFilterChange={handleTimeFilterChange}
                                        stopFilters={stopFilters}
                                        onStopFilterChange={handleStopFilterChange}
                                     />
                                </div>
                            </div>
                         )}
                      </>
                    )}
                    <div className="w-full">
                       {showSidebar && (
                           <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="md:hidden w-full flex items-center justify-center gap-2 p-3 mb-4 bg-[var(--card-bg-color)] rounded-md shadow font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 active:shadow-inner"
                            >
                                <FilterIcon className="w-5 h-5" />
                                Lọc & Sắp xếp kết quả
                            </button>
                       )}
                       <FlightResults
                          outboundFlights={displayedOutboundFlights}
                          inboundFlights={displayedInboundFlights}
                          isLoading={isLoading}
                          error={error}
                          passengers={currentPassengers}
                          onSelectFlight={handleSelectFlight}
                          hasActiveFilters={hasActiveAirlineFilters || hasActiveNonAirlineFilters}
                          searchParams={currentSearchParams}
                        />
                    </div>
                </div>
              )}
          </div>
        )}
      </main>
      <footer className="bg-gray-800 text-white text-center p-4 mt-8">
        <p>&copy; 2024 vemaybaynhauyen.com. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;
