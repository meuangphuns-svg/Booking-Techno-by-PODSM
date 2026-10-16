import React, { useState } from 'react';
import { useAuth, SUPER_ADMIN_EMAIL } from '../context/AuthContext';
import { 
  Package, 
  CalendarClock, 
  ShieldCheck, 
  LogIn, 
  LogOut, 
  User as UserIcon, 
  Menu, 
  X, 
  Sparkles,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'catalog' | 'my-bookings' | 'admin';
  setActiveTab: (tab: 'catalog' | 'my-bookings' | 'admin') => void;
  onOpenProfile: () => void;
  pendingCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenProfile,
  pendingCount = 0,
}) => {
  const { currentUser, userProfile, isAdmin, signInWithGoogle, logOut, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-orange-100 shadow-xs">
      {/* Top micro-bar with university / department identity & View Switcher */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 text-white text-xs py-1.5 px-4 sm:px-8 flex justify-between items-center font-light">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-orange-200 animate-pulse"></span>
          <span>ภาควิชาเทคโนโลยีการศึกษา คณะศึกษาศาสตร์ มหาวิทยาลัยศิลปากร</span>
        </div>
        
        {/* Quick View Mode Switcher */}
        <div className="flex items-center space-x-2">
          <div className="bg-black/20 p-0.5 rounded-lg flex items-center text-[11px] font-medium">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-2.5 py-0.5 rounded-md transition cursor-pointer ${
                activeTab !== 'admin'
                  ? 'bg-white text-orange-700 shadow-xs font-bold'
                  : 'text-orange-100 hover:text-white'
              }`}
            >
              หน้าผู้ใช้งาน
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-2.5 py-0.5 rounded-md transition flex items-center gap-1 cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-white text-orange-700 shadow-xs font-bold'
                  : 'text-orange-100 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Admin หลังบ้าน</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main navigation bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div 
            onClick={() => setActiveTab('catalog')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 text-lg tracking-tight">EdTech Borrowing</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">SU</span>
              </div>
              <p className="text-xs text-gray-500 hidden sm:block">ระบบยืม-คืนอุปกรณ์เทคโนโลยีการศึกษา</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'catalog'
                  ? 'bg-orange-50 text-orange-700 shadow-xs ring-1 ring-orange-200'
                  : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50/50'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>รายการอุปกรณ์</span>
            </button>

            {currentUser && (
              <button
                onClick={() => setActiveTab('my-bookings')}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 relative cursor-pointer ${
                  activeTab === 'my-bookings'
                    ? 'bg-orange-50 text-orange-700 shadow-xs ring-1 ring-orange-200'
                    : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50/50'
                }`}
              >
                <CalendarClock className="w-4 h-4" />
                <span>คำขอจองของฉัน</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm shadow-orange-500/30'
                  : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-orange-500" />
              <span>มุมมอง Admin หลังบ้าน</span>
              {pendingCount > 0 && (
                <span className="bg-red-500 text-white text-[11px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center">
                  {pendingCount}
                </span>
              )}
            </button>
          </nav>

          {/* Right Action / Auth */}
          <div className="flex items-center space-x-3">
            {loading ? (
              <div className="w-8 h-8 rounded-full border-2 border-orange-300 border-t-orange-600 animate-spin" />
            ) : currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2.5 p-1.5 rounded-full hover:bg-orange-50 transition border border-orange-200/60"
                >
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'Profile'}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-orange-400"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-sm">
                      {currentUser.displayName ? currentUser.displayName[0] : 'U'}
                    </div>
                  )}
                  <div className="text-left hidden lg:block pr-1">
                    <p className="text-xs font-semibold text-gray-800 leading-tight max-w-[120px] truncate">
                      {userProfile?.displayName || currentUser.displayName}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {isAdmin ? 'ผู้ดูแลระบบ' : userProfile?.studentId || 'ผู้ใช้งาน'}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden lg:block" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-orange-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {userProfile?.displayName || currentUser.displayName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                      {userProfile?.studentId && (
                        <p className="text-[11px] text-orange-600 mt-0.5">รหัส: {userProfile.studentId}</p>
                      )}
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenProfile();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2.5"
                      >
                        <UserIcon className="w-4 h-4 text-gray-400" />
                        <span>แก้ไขข้อมูลโปรไฟล์ / ข้อมูลติดต่อ</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setActiveTab('my-bookings');
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2.5 md:hidden"
                      >
                        <CalendarClock className="w-4 h-4 text-gray-400" />
                        <span>รายการจองของฉัน</span>
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            setActiveTab('admin');
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2.5 md:hidden"
                        >
                          <ShieldCheck className="w-4 h-4 text-orange-500" />
                          <span>จัดการระบบ (แอดมิน)</span>
                        </button>
                      )}
                    </div>

                    <div className="border-t border-gray-100 pt-1 mt-1">
                      <button
                        onClick={async () => {
                          setUserDropdownOpen(false);
                          await logOut();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span>ออกจากระบบ</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-md shadow-orange-500/25 flex items-center gap-2 transition active:scale-95 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>เข้าสู่ระบบด้วย Google</span>
              </button>
            )}

            {/* Mobile Hamburger toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-orange-50 md:hidden"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-orange-100 space-y-1">
            <button
              onClick={() => {
                setActiveTab('catalog');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2.5 ${
                activeTab === 'catalog' ? 'bg-orange-50 text-orange-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>รายการอุปกรณ์</span>
            </button>

            {currentUser && (
              <button
                onClick={() => {
                  setActiveTab('my-bookings');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2.5 ${
                  activeTab === 'my-bookings' ? 'bg-orange-50 text-orange-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <CalendarClock className="w-4 h-4" />
                <span>คำขอจองของฉัน</span>
              </button>
            )}

            <button
              onClick={() => {
                setActiveTab('admin');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2.5 ${
                activeTab === 'admin' ? 'bg-orange-500 text-white' : 'text-orange-700 hover:bg-orange-50'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>มุมมอง Admin หลังบ้าน {pendingCount > 0 ? `(${pendingCount} รออนุมัติ)` : ''}</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
