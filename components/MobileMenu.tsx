
import React from 'react';
import { User } from '../types';
import { CloseIcon, LoginIcon, LogoutIcon, TicketIcon } from './icons/Icons';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onLoginClick: () => void;
  onLogout: () => void;
  onBookingLookupClick: () => void;
  onNavigateToAdmin: () => void;
  onMyBookingsClick: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginClick,
  onLogout,
  onBookingLookupClick,
  onNavigateToAdmin,
  onMyBookingsClick
}) => {
  const handleAndClose = (action: () => void) => {
    return () => {
      action();
      onClose();
    };
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-[70] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      ></div>

      {/* Menu Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-4/5 max-w-sm bg-[var(--card-bg-color)] shadow-xl z-[80] transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b border-[var(--border-color)]">
          <h2 className="text-lg font-bold">Menu</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex flex-col p-4 space-y-2">
            <button onClick={handleAndClose(onBookingLookupClick)} className="text-left p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold">
                Kiểm tra đơn hàng
            </button>
            <a href="https://vemaybaynhauyen.com/huong-dan-thanh-toan" target="_blank" rel="noopener noreferrer" className="block p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold">
                Hướng dẫn thanh toán
            </a>
            <a href="https://vemaybaynhauyen.com/lien-he" target="_blank" rel="noopener noreferrer" className="block p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold">
                Liên hệ
            </a>
            <button onClick={handleAndClose(onNavigateToAdmin)} className="text-left p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold">
                Quản trị
            </button>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[var(--border-color)]">
          {currentUser ? (
            <div className="space-y-3">
              <div>
                <p className="font-semibold truncate">{currentUser.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{currentUser.email}</p>
              </div>
              <button onClick={handleAndClose(onMyBookingsClick)} className="w-full flex items-center justify-center gap-2 p-3 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 font-bold">
                <TicketIcon className="w-5 h-5" />
                Vé của tôi
              </button>
              <button onClick={handleAndClose(onLogout)} className="w-full flex items-center justify-center gap-2 p-3 rounded-md bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 font-bold">
                <LogoutIcon className="w-5 h-5" />
                Đăng xuất
              </button>
            </div>
          ) : (
            <button onClick={handleAndClose(onLoginClick)} className="w-full flex items-center justify-center gap-2 p-3 rounded-md bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold">
              <LoginIcon className="w-5 h-5" />
              Đăng nhập / Đăng ký
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default MobileMenu;
