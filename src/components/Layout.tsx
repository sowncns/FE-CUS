import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Gift, Home, Grid, Calendar as CalendarIcon, QrCode, User, AlertCircle } from 'lucide-react';
import VoucherModal from './VoucherModal';
import ProfileDrawer from './ProfileDrawer';
import PaymentModal from './PaymentModal';
import QrActionModal from './QrActionModal';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [resending, setResending] = useState(false);
  
  const { user, refreshProfile } = useAuth();

  const handleResendVerification = async () => {
    if (!user || resending) return;
    setResending(true);
    try {
      await api.post('/customer/auth/request-verification');
      alert('Đã gửi lại email xác thực. Vui lòng kiểm tra hộp thư của bạn.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi gửi lại email.');
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    const handleProfileUpdate = () => {
      refreshProfile();
    };
    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
  }, [refreshProfile]);
  useEffect(() => {
    setIsVoucherModalOpen(false);
    setIsProfileOpen(false);
    setIsQrModalOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 bg-white h-[72px] shadow-sm flex items-center justify-between px-6">
        {/* Left: Logo & Links */}
        <div className="flex items-center gap-8">
          <Link to="/" className="text-3xl font-bold text-primary tracking-tight">
            iGourmet
          </Link>
          <div className="hidden md:flex items-center gap-6 font-medium text-gray-600">
            <Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link>
            <Link to="/brands" className="hover:text-primary transition-colors">Thương hiệu</Link>
            <Link to="/booking" className="hover:text-primary transition-colors">Đặt bàn</Link>
          </div>
        </div>

        {/* Right: Search, Gift, Login */}
        <div className="flex items-center gap-4">
          {/* <div className="hidden md:flex relative items-center ">
            <Search className="absolute left-3 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm..." 
              className="bg-gray-100 rounded-full py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm w-48 lg:w-64"
            />
          </div> */}
          <button 
            onClick={() => setIsVoucherModalOpen(true)}
            className="hidden md:block p-2 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-full transition-colors relative"
          >
            <Gift className="w-5 h-5" />
          </button>
          
          {user ? (
            <div className="flex items-center gap-3">
              <div 
                onClick={() => setIsProfileOpen(true)}
                className="hidden md:flex items-center gap-2 bg-orange-50 hover:bg-orange-100 p-1.5 pr-4 rounded-full border border-orange-100 cursor-pointer transition-colors"
              >
                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold overflow-hidden">
                  <User className="w-5 h-5" />
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="font-bold text-xs text-gray-800 leading-tight">{user.full_name}</span>
                </div>
              </div>
            </div>
          ) : (
            <Link to="/login" className="hidden md:flex items-center gap-2 hover:bg-gray-50 p-2 rounded-full transition-colors">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 overflow-hidden">
                <User className="w-5 h-5" />
              </div>
              <span className="hidden sm:inline font-medium text-sm text-gray-700">Đăng nhập</span>
            </Link>
          )}

          {user ? (
            <button 
              onClick={() => setIsProfileOpen(true)}
              className="md:hidden p-1.5 rounded-full bg-primary/10"
            >
              <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold overflow-hidden">
                <User className="w-5 h-5" />
              </div>
            </button>
          ) : (
            <Link to="/login" className="md:hidden p-2 text-gray-600 hover:bg-gray-50 rounded-full">
              <User className="w-6 h-6" />
            </Link>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto p-4 sm:p-6 pb-24 md:pb-6">
        {user && !user.email_verified && (
          <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4">
            <div>
              <h4 className="text-amber-800 font-bold text-lg mb-1 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Xác thực địa chỉ email
              </h4>
              <p className="text-amber-700 text-sm ml-7">Vui lòng kiểm tra email của bạn để xác thực tài khoản. Một số tính năng như đặt bàn, nạp ví có thể bị giới hạn nếu chưa xác thực.</p>
            </div>
            <button 
              onClick={handleResendVerification}
              disabled={resending}
              className="sm:ml-4 ml-7 shrink-0 bg-amber-500 text-white hover:bg-amber-600 font-semibold px-4 py-2 rounded-lg transition-colors text-sm shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {resending ? 'Đang gửi...' : 'Gửi lại email'}
            </button>
          </div>
        )}
        <Outlet context={{ openVoucherModal: () => setIsVoucherModalOpen(true) }} />
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center h-16 z-40 pb-safe px-1">
        {[
          { path: '/', icon: Home, label: 'Trang chủ' },
          { path: '/brands', icon: Grid, label: 'Nhà hàng' },
          { 
            isAction: true, 
            isCenter: true,
            icon: QrCode, 
            label: 'Quét mã',
            onClick: () => setIsQrModalOpen(true) 
          },
          { 
            isAction: true, 
            icon: Gift, 
            label: 'Quà tặng',
            onClick: () => setIsVoucherModalOpen(true) 
          },
          { path: '/booking', icon: CalendarIcon, label: 'Đặt bàn' }
        ].map((item, idx) => {
          let isActive = false;
          if (isQrModalOpen) {
            isActive = item.label === 'Quét mã';
          } else if (isVoucherModalOpen) {
            isActive = item.label === 'Quà tặng';
          } else {
            isActive = item.path === location.pathname;
          }
          

          return (
            <button 
              key={idx}
              onClick={() => {
                if (item.onClick) {
                  item.onClick();
                } else if (item.path) {
                  navigate(item.path);
                  setIsVoucherModalOpen(false);
                  setIsQrModalOpen(false);
                  setIsProfileOpen(false);
                }
              }}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <item.icon className={`w-6 h-6 ${isActive ? 'fill-primary/20' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] font-medium ${isActive ? 'text-primary font-bold' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Voucher Modal */}
      <VoucherModal 
        isOpen={isVoucherModalOpen} 
        onClose={() => setIsVoucherModalOpen(false)} 
      />
      
      {/* QR Action Modal */}
      <QrActionModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        user={user}
      />

      {/* Profile Drawer */}
      <ProfileDrawer 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        openVoucherModal={() => {
          setIsProfileOpen(false);
          setIsVoucherModalOpen(true);
        }}
      />
      
      {/* Payment Push Modal */}
      <PaymentModal />
    </div>
  );
};

export default Layout;
