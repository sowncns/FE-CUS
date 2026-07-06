import { useState, useEffect } from 'react';
import { ArrowLeft, User, Bell, Gift, FileText, Smartphone, LogOut, ChevronRight, Calendar, MapPin as QrCode, Lock, Eye, EyeOff, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import PinVerification from './PinVerification';
import { useAuth } from '../contexts/AuthContext';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  openVoucherModal: () => void;
}

const t = {
  vi: {
    profile: "Hồ sơ",
    loading: "Đang tải...",
    customer: "Khách hàng",
    spendMore: "Chi tiêu thêm",
    beforeDate: "trước ngày",
    toUpgrade: "để nâng lên Hạng Vàng",
    account: "Tài khoản",
    profileInfo: "Thông tin hồ sơ",
    delivery: "Lịch sử giao hàng",
    bookTable: "Đặt bàn",
    address: "Địa chỉ",
    personalization: "Cá nhân hóa",
    messages: "Tin nhắn",
    gifts: "Quà tặng",
    policies: "Chính sách",
    terms: "Điều khoản dịch vụ",
    settings: "Cài đặt",
    appInfo: "Thông tin ứng dụng",
    language: "Ngôn ngữ",
    logout: "Đăng xuất",
    deleteAccount: "Xóa tài khoản",
    save: "Lưu",
    name: "Tên",
    dob: "Ngày sinh",
    phone: "Số điện thoại",
    gender: "Giới tính",
    male: "Nam",
    female: "Nữ",
    other: "Khác",
    email: "Email",
    password: "Mật khẩu",
    changePassword: "Thay đổi mật khẩu",
    fillForm: "Hoàn thành biểu mẫu sau để thay đổi mật khẩu",
    currentPassword: "Mật khẩu hiện tại",
    newPassword: "Mật khẩu mới",
    confirmPassword: "Nhập lại mật khẩu mới",
    selectDate: "Chọn ngày",
    successChange: "Thay đổi mật khẩu thành công!",
    fillAll: "Vui lòng điền đầy đủ thông tin.",
    passwordMismatch: "Mật khẩu mới không khớp.",
    errorUpdate: "Không thể cập nhật hồ sơ lúc này.",
    errorChange: "Không thể đổi mật khẩu.",
    rank_gold: "Hạng Vàng",
    rank_platinum: "Hạng Bạch Kim",
    rank_normal: "Sakura",
    changePin: "Đổi mã PIN",
    setupPin: "Thiết lập mã PIN",
    reservation: "Lịch sử đặt bàn",
    invoices: "Hóa đơn thanh toán",
  },
  en: {
    profile: "Profile",
    loading: "Loading...",
    customer: "Customer",
    spendMore: "Spend",
    beforeDate: "more before",
    toUpgrade: "to upgrade to Gold",
    account: "Account",
    profileInfo: "Profile Information",
    delivery: "Delivery ",
    bookTable: "Book Table",
    address: "Address",
    personalization: "Personalization",
    messages: "Messages",
    gifts: "Gifts",
    policies: "Policies",
    terms: "Terms of Service",
    settings: "Settings",
    appInfo: "App Information",
    language: "Language",
    logout: "Logout",
    deleteAccount: "Delete Account",
    save: "Save",
    name: "Name",
    dob: "Date of Birth",
    phone: "Phone",
    gender: "Gender",
    male: "Male",
    female: "Female",
    other: "Other",
    email: "Email",
    password: "Password",
    changePassword: "Change Password",
    fillForm: "Fill out the form below to change your password",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmPassword: "Confirm New Password",
    selectDate: "Select date",
    successChange: "Password changed successfully!",
    fillAll: "Please fill in all fields.",
    passwordMismatch: "New passwords do not match.",
    errorUpdate: "Could not update profile.",
    errorChange: "Could not change password.",
    rank_gold: "Gold Tier",
    rank_platinum: "Platinum Tier",
    rank_normal: "Sakura",
    changePin: "Change PIN",
    setupPin: "Setup PIN",
    reservation: "Reservation ",
    invoices: "Invoices",
  }
};

const ProfileDrawer = ({ isOpen, onClose, openVoucherModal }: ProfileDrawerProps) => {
  const navigate = useNavigate();
  const [view, setView] = useState<'main' | 'edit' | 'password' | 'pin'>('main');
  const [language] = useState<'vi' | 'en'>(() => {
    return (localStorage.getItem('app_language') as 'vi' | 'en') || 'vi';
  });
  

  
  const { user, logout, refreshProfile } = useAuth();

  const [profileLoading, setProfileLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(user);

  /* const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('avatar', file);

      try {
        const res: any = await api.post('/customer/profile/avatar', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        if (res.avatarUrl) {
          const newProfile = { ...userProfile, avatar_url: res.avatarUrl };
          setUserProfile(newProfile);
          localStorage.setItem('user', JSON.stringify(newProfile));
          window.dispatchEvent(new Event('profileUpdated'));
        }
      } catch (error) {
        console.error('Lỗi khi tải ảnh lên', error);
      }
    }
  }; */

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: user?.full_name || 'Khách hàng',
    dob: '',
    phone: '',
    gender: 'Nam',
    email: user?.email || ''
  });

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      const fetchProfile = async () => {
        setProfileLoading(true);
        try {
          const res: any = await api.get('/customer/profile/me');
          // Backend trả về { message, profile: {...} }
          const data = res.profile || res.customer || res.user || res.data || res;
          
          setUserProfile(data);
          
          // Format date for input type="date"
          let formattedDob = '';
          if (data.birthday || data.dob) {
            const dateStr = data.birthday || data.dob;
            formattedDob = dateStr.split('T')[0];
          }

          setEditForm({
            name: data.full_name || data.name || '',
            dob: formattedDob,
            phone: data.phone || '',
            gender: data.gender || 'Nam',
            email: data.email || ''
          });
        } catch (err) {
          console.error('Lỗi lấy thông tin hồ sơ:', err);
        } finally {
          setProfileLoading(false);
        }
      };
      fetchProfile();
    }
  }, [isOpen]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response: any = await api.put('/customer/profile/me', {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        gender: editForm.gender,
        dob: editForm.dob // birthday field
      });

      const updatedProfile = response.profile || response.data || response;
      
      // Update state
      setUserProfile((prev: any) => ({ ...prev, ...updatedProfile, full_name: updatedProfile.name || updatedProfile.full_name }));
      
      // Update context
      await refreshProfile();

      // Return to main view
      setView('main');
    } catch (err: any) {
      console.error('Lỗi cập nhật hồ sơ:', err);
      if (err.response?.status === 403) {
        alert('Bạn cần xác thực email trước khi có thể cập nhật hồ sơ. Vui lòng nhấn "Gửi lại email" ở thông báo trên cùng và làm theo hướng dẫn.');
      } else {
        alert(err.response?.data?.message || t[language].errorUpdate);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      alert(t[language].fillAll);
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert(t[language].passwordMismatch);
      return;
    }
    
    setChangingPassword(true);
    try {
      await api.post('/customer/auth/change-password', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      });
      alert(t[language].successChange);
      setView('main');
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      console.error('Lỗi đổi mật khẩu', err);
      alert(err.response?.data?.message || t[language].errorChange);
    } finally {
      setChangingPassword(false);
    }
  };

  if (!isOpen) {
    if (view !== 'main') setTimeout(() => setView('main'), 300); // reset after close animation
    return null;
  }

  const handleLogout = async () => {
    await logout();
  };

  const menuSectionClass = "space-y-1 mb-8";
  const sectionTitleClass = "text-[15px] font-semibold text-gray-900 mb-4 px-2";
  const menuItemClass = "flex items-center gap-4 py-3 px-2 cursor-pointer transition-colors group bg-white hover:bg-gray-50 rounded-xl";

  const renderMainView = () => {
    const getCardBg = () => {
      switch(userProfile?.rank) {
        case 'gold':
          return 'from-amber-400 via-yellow-500 to-orange-500';
        case 'platinum':
          return 'from-slate-700 via-gray-600 to-zinc-800';
        default:
          return 'from-rose-500 via-pink-500 to-rose-400';
      }
    };
    const currentRankText = userProfile?.rank === 'gold' ? t[language].rank_gold : (userProfile?.rank === 'platinum' ? t[language].rank_platinum : t[language].rank_normal);
    const currentPoints = parseInt(userProfile?.points || 0);

    return (
      <div className="flex flex-col h-full bg-white">
        {/* Header */}
        <div className="bg-white px-4 py-4 flex items-center relative border-b border-gray-50 shrink-0">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full absolute left-4">
            <ArrowLeft className="w-6 h-6 text-gray-800" />
          </button>
          <h2 className="text-lg font-bold text-gray-800 w-full text-center">{t[language].profile}</h2>
        </div>

        <div className="flex-1 overflow-y-auto pb-10">
          <div className="p-6 space-y-8">
            
            {/* User Info Basic */}
            <div className="flex items-center gap-4 cursor-pointer group px-2" onClick={() => setView('edit')}>
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 font-bold text-2xl group-hover:bg-emerald-100 transition-colors overflow-hidden">
                <User className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 leading-tight">
                  {profileLoading ? t[language].loading : (userProfile?.full_name || t[language].customer)}
                </h3>
                <p className="text-gray-500 text-[15px] mt-0.5">{userProfile?.phone || ''}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </div>

            {/* Membership Card */}
            <div className={`bg-gradient-to-br ${getCardBg()} rounded-[24px] p-6 text-white shadow-lg relative overflow-hidden mx-2 transition-colors duration-500`}>
              <div className="absolute right-0 top-0 w-48 h-48 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <h3 className="text-[22px] font-bold mb-0.5">{userProfile?.full_name || t[language].customer}</h3>
                    <p className="text-white/90 text-sm font-medium">{currentRankText}</p>
                  </div>
                  <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                    <QrCode className="w-5 h-5 text-white" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold tracking-wide">
                    <span>{currentPoints.toLocaleString('vi-VN')}đ</span>
                    <span>30.000.000đ</span>
                  </div>
                  <div className="h-1 w-full bg-white/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min((currentPoints / 30000000) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-white/90 mt-2 font-medium">
                    {t[language].spendMore} {Math.max(30000000 - currentPoints, 0).toLocaleString('vi-VN')}đ {t[language].beforeDate} 26/10/2026 {t[language].toUpgrade}
                  </p>
                </div>
              </div>
            </div>

            {/* Tài khoản */}
            <div className={menuSectionClass}>
              <h4 className={sectionTitleClass}>{t[language].account}</h4>
              <div>
                {[
                  { icon: User, label: t[language].profileInfo, onClick: () => setView('edit') },
                  { icon: Calendar, label: t[language].bookTable, onClick: () => { onClose(); navigate('/booking'); } },
                  { icon: FileText, label: t[language].reservation,onClick: () => { onClose(); navigate('/booking/history'); } },
                  { icon: Receipt, label: t[language].invoices, onClick: () => { onClose(); navigate('/invoices'); } },
                ].map((item, idx) => (
                  <div key={idx} onClick={item?.onClick} className={menuItemClass}>
                    <item.icon className="w-[22px] h-[22px] text-gray-700" strokeWidth={1.5} />
                    <span className="flex-1 text-[15px] text-gray-800 font-medium">{item.label}</span>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                ))}
              </div>
            </div>

            {/* Cá nhân hóa */}
            <div className={menuSectionClass}>
              <h4 className={sectionTitleClass}>{t[language].personalization}</h4>
              <div>
                <div className={menuItemClass}>
                  <Bell className="w-[22px] h-[22px] text-gray-700" strokeWidth={1.5} />
                  <span className="flex-1 text-[15px] text-gray-800 font-medium">{t[language].messages}</span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
                <div 
                  onClick={() => { onClose(); openVoucherModal(); }}
                  className={menuItemClass}
                >
                  <Gift className="w-[22px] h-[22px] text-gray-700" strokeWidth={1.5} />
                  <span className="flex-1 text-[15px] text-gray-800 font-medium">{t[language].gifts}</span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              </div>
            </div>

            {/* Chính sách & Cài đặt */}
            <div className={menuSectionClass}>
              <h4 className={sectionTitleClass}>{t[language].policies}</h4>
              <div>
                <div className={menuItemClass}>
                  <FileText className="w-[22px] h-[22px] text-gray-700" strokeWidth={1.5} />
                  <span className="flex-1 text-[15px] text-gray-800 font-medium">{t[language].terms}</span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              </div>
            </div>

            <div className={menuSectionClass}>
              <h4 className={sectionTitleClass}>{t[language].settings}</h4>
              <div>
                <div className={menuItemClass}>
                  <Smartphone className="w-[22px] h-[22px] text-gray-700" strokeWidth={1.5} />
                  <span className="flex-1 text-[15px] text-gray-800 font-medium">{t[language].appInfo}</span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
                <div 
                  className={menuItemClass}
                  onClick={() => setView('pin')}
                >
                  <Lock className="w-[22px] h-[22px] text-gray-700" strokeWidth={1.5} />
                  <span className="flex-1 text-[15px] text-gray-800 font-medium">
                    {userProfile?.has_payment_pin ? t[language].changePin : t[language].setupPin}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
                {/* <div 
                  className={menuItemClass}
                  onClick={() => setLanguage(lang => lang === 'vi' ? 'en' : 'vi')}
                >
                  <className="w-[22px] h-[22px] text-gray-700" strokeWidth={1.5} />
                  <span className="flex-1 text-[15px] text-gray-800 font-medium">{t[language].language}</span>
                  <span className="text-[14px] font-medium text-[#00a662] mr-1">{language === 'vi' ? 'Tiếng Việt' : 'English'}</span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div> */}
                <div 
                  onClick={handleLogout}
                  className="flex items-center gap-4 py-3 px-2 mt-2 cursor-pointer group"
                >
                  <LogOut className="w-[22px] h-[22px] text-red-500" strokeWidth={1.5} />
                  <span className="flex-1 text-[15px] text-red-500 font-medium">{t[language].logout}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  };

  const renderEditView = () => {
    return (
      <div className="flex flex-col h-full bg-white">
        {/* Header */}
        <div className="bg-white px-4 py-4 flex items-center relative border-b border-gray-50 shrink-0">
          <button onClick={() => setView('main')} className="p-2 hover:bg-gray-100 rounded-full absolute left-4">
            <ArrowLeft className="w-6 h-6 text-gray-800" />
          </button>
          <h2 className="text-lg font-bold text-gray-800 w-full text-center">{t[language].profile}</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pb-24">
          
          {/* Avatar Edit */}
          <div className="flex justify-center mb-10">
            <div className="relative">
              <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 font-bold text-4xl overflow-hidden">
                <User className="w-12 h-12" />
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-0">
            <div className="flex justify-between items-center py-5 border-b border-gray-100">
              <span className="text-gray-500 text-[15px]">{t[language].name}</span>
              <input 
                type="text" 
                value={editForm.name} 
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                className="text-right text-[15px] font-medium text-gray-900 outline-none bg-transparent w-1/2" 
              />
            </div>
            <div className="flex justify-between items-center py-5 border-b border-gray-100 relative">
              <span className="text-gray-500 text-[15px]">{t[language].dob}</span>
              <div className="relative flex justify-end items-center flex-1 ml-4 h-full">
                <span className="text-[15px] font-medium text-gray-900 pointer-events-none">
                  {editForm.dob ? editForm.dob.split('-').reverse().join('/') : t[language].selectDate}
                </span>
                <input 
                  type="date" 
                  value={editForm.dob} 
                  onChange={(e) => setEditForm({...editForm, dob: e.target.value})}
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-full h-[30px] opacity-0 cursor-pointer" 
                />
              </div>
            </div>
            <div className="flex justify-between items-center py-5 border-b border-gray-100">
              <span className="text-gray-500 text-[15px]">{t[language].phone}</span>
              <input 
                type="text" 
                value={editForm.phone} 
                onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                className="text-right text-[15px] font-medium text-gray-900 outline-none bg-transparent w-1/2" 
              />
            </div>
            <div className="flex justify-between items-center py-5 border-b border-gray-100">
              <span className="text-gray-500 text-[15px]">{t[language].gender}</span>
              <select 
                value={editForm.gender} 
                onChange={(e) => setEditForm({...editForm, gender: e.target.value})}
                className="text-right text-[15px] font-medium text-gray-900 outline-none bg-transparent appearance-none" 
                dir="rtl"
              >
                <option value="Nam">{t[language].male}</option>
                <option value="Nữ">{t[language].female}</option>
                <option value="Khác">{t[language].other}</option>
              </select>
            </div>
            <div className="flex justify-between items-center py-5 border-b border-gray-100">
              <span className="text-gray-500 text-[15px]">{t[language].email}</span>
              <input 
                type="email" 
                value={editForm.email} 
                onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                disabled={userProfile?.email_verified}
                className={`text-right text-[15px] font-medium outline-none bg-transparent w-[60%] truncate ${userProfile?.email_verified ? 'text-gray-400 cursor-not-allowed' : 'text-gray-900'}`} 
              />
            </div>
            <div className="flex justify-between items-center py-5 border-b border-gray-100">
              <span className="text-gray-500 text-[15px]">{t[language].password}</span>
              <button onClick={() => setView('password')} className="text-[#00a662] text-[15px] font-medium hover:underline">{t[language].changePassword}</button>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <button className="text-red-500 text-[15px] hover:underline">{t[language].deleteAccount}</button>
          </div>

        </div>

        {/* Footer Fixed Button */}
        <div className="p-4 border-t border-gray-100 bg-white shrink-0">
          <button 
            onClick={handleSave}
            disabled={saving}
            className={`w-full text-white font-medium py-3.5 rounded-xl transition-colors shadow-sm flex items-center justify-center ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#00a662] hover:bg-[#008f54]'}`}
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              t[language].save
            )}
          </button>
        </div>
      </div>
    );
  };

  const renderPasswordView = () => {
    const isFormValid = passwordForm.oldPassword && passwordForm.newPassword && passwordForm.confirmPassword;
    
    return (
      <div className="flex flex-col h-full bg-white">
        {/* Header */}
        <div className="px-4 py-4 flex items-center relative shrink-0 mb-2">
          <button onClick={() => setView('edit')} className="p-2 hover:bg-gray-100 rounded-full absolute left-4">
            <ArrowLeft className="w-6 h-6 text-gray-800" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-24">
          <h2 className="text-[26px] font-bold text-gray-900 mb-2 tracking-tight">{t[language].changePassword}</h2>
          <p className="text-gray-400 text-[15px] mb-8 leading-relaxed">
            {t[language].fillForm}
          </p>
          
          <div className="space-y-4">
            {/* Old Password */}
            <div className="relative flex items-center bg-[#f8f9fb] rounded-2xl px-4 py-4">
              <Lock className="w-5 h-5 text-gray-400 mr-3 shrink-0" strokeWidth={1.5} />
              <input 
                type={showOldPassword ? "text" : "password"} 
                placeholder={t[language].currentPassword}
                value={passwordForm.oldPassword}
                onChange={(e) => setPasswordForm({...passwordForm, oldPassword: e.target.value})}
                className="bg-transparent flex-1 outline-none text-[15px] text-gray-800 placeholder:text-gray-400"
              />
              <button onClick={() => setShowOldPassword(!showOldPassword)} className="p-1 shrink-0 ml-2">
                {showOldPassword ? <Eye className="w-5 h-5 text-gray-400" strokeWidth={1.5} /> : <EyeOff className="w-5 h-5 text-gray-400" strokeWidth={1.5} />}
              </button>
            </div>
            
            {/* New Password */}
            <div className="relative flex items-center bg-[#f8f9fb] rounded-2xl px-4 py-4">
              <Lock className="w-5 h-5 text-gray-400 mr-3 shrink-0" strokeWidth={1.5} />
              <input 
                type={showNewPassword ? "text" : "password"} 
                placeholder={t[language].newPassword}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                className="bg-transparent flex-1 outline-none text-[15px] text-gray-800 placeholder:text-gray-400"
              />
              <button onClick={() => setShowNewPassword(!showNewPassword)} className="p-1 shrink-0 ml-2">
                {showNewPassword ? <Eye className="w-5 h-5 text-gray-400" strokeWidth={1.5} /> : <EyeOff className="w-5 h-5 text-gray-400" strokeWidth={1.5} />}
              </button>
            </div>
            
            {/* Confirm New Password */}
            <div className="relative flex items-center bg-[#f8f9fb] rounded-2xl px-4 py-4">
              <Lock className="w-5 h-5 text-gray-400 mr-3 shrink-0" strokeWidth={1.5} />
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                placeholder={t[language].confirmPassword}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                className="bg-transparent flex-1 outline-none text-[15px] text-gray-800 placeholder:text-gray-400"
              />
              <button onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="p-1 shrink-0 ml-2">
                {showConfirmPassword ? <Eye className="w-5 h-5 text-gray-400" strokeWidth={1.5} /> : <EyeOff className="w-5 h-5 text-gray-400" strokeWidth={1.5} />}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Fixed Button */}
        <div className="p-6 shrink-0 bg-white">
          <button 
            disabled={!isFormValid || changingPassword}
            onClick={handleChangePassword}
            className={`w-full font-medium py-4 rounded-[14px] transition-colors shadow-sm flex items-center justify-center 
              ${isFormValid && !changingPassword ? 'bg-[#00a662] text-white hover:bg-[#008f54]' : 'bg-[#e9ecef] text-gray-400 cursor-not-allowed'}`}
          >
            {changingPassword ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            ) : (
              t[language].changePassword
            )}
          </button>
        </div>
      </div>
    );
  };

  const renderPinView = () => {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="bg-white px-4 py-4 flex items-center relative border-b border-gray-50 shrink-0">
          <button onClick={() => setView('main')} className="p-2 hover:bg-gray-100 rounded-full absolute left-4">
            <ArrowLeft className="w-6 h-6 text-gray-800" />
          </button>
          <h2 className="text-lg font-bold text-gray-800 w-full text-center">
            {userProfile?.has_payment_pin ? t[language].changePin : t[language].setupPin}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <PinVerification 
            onSuccess={() => {
              // Refresh profile to update has_payment_pin
              if (!userProfile?.has_payment_pin) {
                setUserProfile({ ...userProfile, has_payment_pin: true });
              }
              setView('main');
            }} 
            hasPin={userProfile?.has_payment_pin || false} 
            mode={userProfile?.has_payment_pin ? 'CHANGE' : 'SETUP'}
          />
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div 
        className={`fixed top-0 bottom-0 right-0 w-full sm:w-[400px] bg-white z-[70] shadow-2xl transition-transform duration-400 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {view === 'main' && renderMainView()}
        {view === 'edit' && renderEditView()}
        {view === 'password' && renderPasswordView()}
        {view === 'pin' && renderPinView()}
      </div>
    </>
  );
};

export default ProfileDrawer;
