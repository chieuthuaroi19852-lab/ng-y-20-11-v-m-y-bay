
import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { SunIcon, MoonIcon, UserCircleIcon, ChevronDownIcon, LoginIcon, LogoutIcon, TicketIcon } from './icons/Icons';
import MobileMenu from './MobileMenu';


const Logo: React.FC = () => (
  <svg width="220" height="50" viewBox="0 0 220 50" fill="none" xmlns="http://www.w3.org/2000/svg">
    <text x="5" y="28" fontFamily="Arial, Helvetica, sans-serif" fontSize="26" fontWeight="bold">
      <tspan className="fill-[#0056b3] dark:fill-blue-400">Nhã Uyên</tspan>
      <tspan className="fill-[#DA251D] dark:fill-red-500"> AIR</tspan>
    </text>
    <text x="5" y="45" fontFamily="Arial, Helvetica, sans-serif" fontSize="11" className="fill-[#333] dark:fill-gray-300">
      vemaybaynhauyen.com
    </text>
  </svg>
);

const DarkModeToggle: React.FC<{ isDarkMode: boolean; onToggle: () => void; }> = ({ isDarkMode, onToggle }) => (
    <button onClick={onToggle} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors" aria-label="Toggle dark mode">
        {isDarkMode ? <SunIcon className="w-5 h-5"/> : <MoonIcon className="w-5 h-5" />}
    </button>
);

const UserMenu: React.FC<{ user: User, onLogout: () => void, onMyBookingsClick: () => void }> = ({ user, onLogout, onMyBookingsClick }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                <UserCircleIcon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                <span className="font-semibold text-sm hidden sm:inline">{user.name}</span>
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[var(--card-bg-color)] border border-[var(--border-color)] rounded-md shadow-lg z-50">
                    <div className="p-2 border-b border-[var(--border-color)]">
                         <p className="text-sm font-semibold truncate">{user.name}</p>
                         <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                    </div>
                    <button onClick={() => { setIsOpen(false); onMyBookingsClick(); }} className="w-full text-left flex items-center space-x-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">
                        <TicketIcon className="w-5 h-5" />
                        <span>Vé của tôi</span>
                    </button>
                    <button onClick={onLogout} className="w-full text-left flex items-center space-x-2 px-4 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400">
                        <LogoutIcon className="w-5 h-5" />
                        <span>Đăng xuất</span>
                    </button>
                </div>
            )}
        </div>
    );
};


interface HeaderProps {
  onNavigateHome: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  currentUser: User | null;
  onLoginClick: () => void;
  onLogout: () => void;
  onBookingLookupClick: () => void;
  onNavigateToAdmin: () => void;
  onMyBookingsClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigateHome, isDarkMode, onToggleDarkMode, currentUser, onLoginClick, onLogout, onBookingLookupClick, onNavigateToAdmin, onMyBookingsClick }) => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onNavigateHome();
  };

  return (
    <header className="bg-[var(--card-bg-color)] shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-2">
          <a href="#" onClick={handleHomeClick} aria-label="Trang chủ" className="cursor-pointer">
            <Logo />
          </a>
          <div className="flex items-center space-x-2">
            <nav className="hidden md:flex items-center space-x-6 mr-4">
                <button onClick={onBookingLookupClick} className="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 font-semibold">Kiểm tra đơn hàng</button>
                <a href="https://vemaybaynhauyen.com/huong-dan-thanh-toan" target="_blank" rel="noopener noreferrer" className="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 font-semibold">Hướng dẫn thanh toán</a>
                <a href="https://vemaybaynhauyen.com/lien-he" target="_blank" rel="noopener noreferrer" className="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 font-semibold">Liên hệ</a>
                 <button onClick={onNavigateToAdmin} className="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 font-semibold">Quản trị</button>
            </nav>
            <DarkModeToggle isDarkMode={isDarkMode} onToggle={onToggleDarkMode} />
            {currentUser ? (
                <UserMenu user={currentUser} onLogout={onLogout} onMyBookingsClick={onMyBookingsClick} />
            ) : (
                <button onClick={onLoginClick} className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold text-sm">
                   <LoginIcon className="w-5 h-5" />
                   <span className="hidden sm:inline">Đăng nhập / Đăng ký</span>
                </button>
            )}
             <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
            </button>
          </div>
        </div>
      </div>
      <MobileMenu 
        isOpen={isMobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        currentUser={currentUser}
        onLoginClick={onLoginClick}
        onLogout={onLogout}
        onBookingLookupClick={onBookingLookupClick}
        onNavigateToAdmin={onNavigateToAdmin}
        onMyBookingsClick={onMyBookingsClick}
      />
    </header>
  );
};

export default Header;
