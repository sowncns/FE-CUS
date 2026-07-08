import { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Gift, Wallet, CreditCard, Phone, ChevronRight, X, MessageCircle, Mail } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

// const BANNER_IMAGES = [
//   'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200&h=400',
//   'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200&h=400',
//   'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=1200&h=400',
// ];


const t = {
  vi: {
    heroTitle: "Thưởng Thức Ẩm Thực Đỉnh Cao",
    heroDesc: "Khám phá ưu đãi lên đến 50% hôm nay",
    gifts: "Quà tặng",
    topup: "Nạp tiền",
    igoCard: "Thẻ iGo",
    contact: "Liên hệ",
    vouchersForYou: "Voucher dành riêng bạn",
    seeAll: "Xem tất cả",
    whatToEat: "Hôm nay ăn gì?",
    promoTag: "Ưu đãi",
    walletBalance: "Số dư ví",
    expireIn: "Hết hạn trong",
    expireAt: "HSD:",
    days: "ngày",
    contactUs: "Liên hệ với chúng tôi",
    callUs: "Gọi điện thoại",
    emailUs: "Gửi Email",
    facebook: "Fanpage Facebook",
  },
  en: {
    heroTitle: "Savor the Ultimate Cuisine",
    heroDesc: "Discover up to 50% off today",
    gifts: "Gifts",
    topup: "Top up",
    igoCard: "iGo Card",
    contact: "Contact",
    vouchersForYou: "Vouchers just for you",
    seeAll: "See all",
    whatToEat: "What to eat today?",
    promoTag: "Promo",
    walletBalance: "Wallet Balance",
    expireIn: "Expires in",
    expireAt: "Exp:",
    days: "days",
    contactUs: "Contact Us",
    callUs: "Call Us",
    emailUs: "Send Email",
    facebook: "Facebook Page",
  }
};

const Home = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState<'vi' | 'en'>(
    (localStorage.getItem('app_language') as 'vi' | 'en') || 'vi'
  );
  const [currentSlide, setCurrentSlide] = useState(0);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const vouchersRef = useRef<HTMLDivElement>(null);
  const promosRef = useRef<HTMLDivElement>(null);
  
  // Use fetched banners or fallback to default images
  const BANNER_IMAGES = banners.length > 0 
    ? banners.map((banner) => banner.image_url || banner.file_url) 
    : [
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200&h=400',
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200&h=400',
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=1200&h=400',
      ];

  useEffect(() => {
    const handleLangChange = () => setLanguage((localStorage.getItem('app_language') as 'vi' | 'en') || 'vi');
    window.addEventListener('languageChanged', handleLangChange);
    return () => window.removeEventListener('languageChanged', handleLangChange);
  }, []);

  useEffect(() => {
    if (BANNER_IMAGES.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % BANNER_IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [BANNER_IMAGES.length]);

  useEffect(() => {
    const fetchVouchers = async () => {
      if (!user) return;
      try {
        const response: any = await api.get('/customer/voucher');
        if (response.vouchers) {
          setVouchers(response.vouchers);
        }
      } catch (err) {
        console.error('Lỗi lấy danh sách voucher trang chủ:', err);
      }
    };
    fetchVouchers();
  }, []);

  useEffect(() => {
    const listTimer = setInterval(() => {
      [vouchersRef, promosRef].forEach((ref) => {
        if (ref.current) {
          const { scrollLeft, scrollWidth, clientWidth } = ref.current;
          // If we reached the end, scroll back to start
          if (scrollLeft + clientWidth >= scrollWidth - 10) {
            ref.current.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            // Scroll by one item roughly
            ref.current.scrollBy({ left: clientWidth * 0.8, behavior: 'smooth' });
          }
        }
      });
    }, 4500);
    return () => clearInterval(listTimer);
  }, []);



    useEffect(() => {
    const fetchWallet = async () => {
      try {
        const response: any = await api.get('/customer/profile/me');    
        if (response.profile) {
          setBalance(response.profile.wallet_balance || 0);
        }    
      } catch (err) {
        console.error('Lỗi tải thông tin tiền:', err);
      }
    };
    fetchWallet();
  }, [navigate]);
  const { openVoucherModal } = useOutletContext<any>();

  const VOUCHER_THEMES = [
    { bg: 'bg-yellow-100', color: 'text-yellow-800' },
    { bg: 'bg-green-100', color: 'text-green-800' },
    { bg: 'bg-orange-100', color: 'text-orange-800' },
    { bg: 'bg-blue-100', color: 'text-blue-800' },
    { bg: 'bg-rose-100', color: 'text-rose-800' },
  ];

  const MOCK_VOUCHERS = [
    { id: 'v1', brand: 'ASANOHA', title: 'Giảm 20%', desc: 'Tối đa 100k', expiry: `${t[language].expireIn} 3 ${t[language].days}`, ...VOUCHER_THEMES[0] },
    { id: 'v2', brand: 'SOM ตำ THAI', title: 'Tặng Món', desc: 'Gỏi đu đủ', expiry: `${t[language].expireIn} 5 ${t[language].days}`, ...VOUCHER_THEMES[1] },
    { id: 'v3', brand: 'RAMEN ICHIBANKEN', title: 'Giảm 50K', desc: 'Đơn từ 300k', expiry: `${t[language].expireIn} 7 ${t[language].days}`, ...VOUCHER_THEMES[2] },
  ];

  const displayVouchers = vouchers.length > 0 ? vouchers.map((v, i) => {
    const d = new Date(v.end_date);
    const formattedDate = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    return {
      id: v.customer_voucher_id,
      brand: v.code || 'iGOURMET',
      title: language === 'en' && v.name_en ? v.name_en : v.name,
      desc: language === 'en' && v.description_en ? v.description_en : v.description,
      expiry: `${t[language].expireAt} ${formattedDate}`,
      ...VOUCHER_THEMES[i % VOUCHER_THEMES.length]
    };
  }) : MOCK_VOUCHERS;

  return (
    <div className="space-y-12 pb-20 relative">
      {/* Hero Banner Slider */}
      <div className="relative h-[300px] sm:h-[400px] rounded-3xl overflow-hidden shadow-lg group">
        <div 
          className="flex h-full w-full transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {BANNER_IMAGES.map((img, index) => (
            <div 
              key={index}
              className="w-full h-full flex-shrink-0 relative"
            >
              <img src={img} alt="Banner" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-8 sm:p-12">
                <h2 className="text-white text-3xl sm:text-5xl font-bold mb-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  {t[language].heroTitle}
                </h2>
                <p className="text-gray-200 text-lg sm:text-xl transform translate-y-4 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-100">
                  {t[language].heroDesc}
                </p>
              </div>
            </div>
          ))}
        </div>
        {/* Dots Navigation */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {BANNER_IMAGES.map((_, idx) => (
            <button 
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentSlide ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/80'}`}
            />
          ))}
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Gift, title: t[language].gifts, color: 'text-rose-500', action: openVoucherModal },
          { icon: Wallet, title: t[language].topup, color: 'text-blue-500', action: () => navigate('/topup') },
          { icon: CreditCard, title: t[language].igoCard, color: 'text-amber-500', action: () => navigate('/igo-card') },
          { icon: Phone, title: t[language].contact, color: 'text-emerald-500', action: () => setIsContactModalOpen(true) },
        ].map((item, idx) => (
          <div 
            key={idx} 
            onClick={item.action}
            className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md hover:scale-105 transition-all cursor-pointer flex flex-col items-center justify-center gap-3"
          >
            <item.icon className={`w-8 h-8 ${item.color}`} />
            <span className="font-semibold text-gray-700">{item.title}</span>
          </div>
        ))}
      </div>

      {/* Vouchers Section */}
      <div>
        <div className="flex justify-between items-end mb-6">
          <h3 className="text-2xl font-bold text-gray-800">{t[language].vouchersForYou}</h3>
          <button onClick={openVoucherModal} className="text-primary hover:underline text-sm font-medium flex items-center">
            {t[language].seeAll} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div ref={vouchersRef} className="flex overflow-x-auto gap-4 md:gap-6 pb-4 snap-x snap-mandatory hide-scrollbar scroll-smooth">
          {displayVouchers.map((voucher, idx) => (
            <div 
              key={voucher.id || idx} 
              onClick={openVoucherModal}
              className={`w-full sm:w-[280px] md:w-[320px] snap-start ${voucher.bg} p-5 md:p-6 rounded-3xl relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all shrink-0 flex-none`}
            >
              <Gift className="absolute -right-4 -bottom-4 w-24 h-24 md:w-32 md:h-32 opacity-10 transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500" />
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <span className={`text-xs md:text-sm font-bold tracking-wider ${voucher.color} opacity-80 uppercase line-clamp-1`}>{voucher.brand}</span>
                  <h4 className={`text-xl md:text-3xl font-extrabold mt-1 md:mt-2 mb-1 ${voucher.color} line-clamp-2`}>{voucher.title}</h4>
                  <p className={`text-sm md:text-base ${voucher.color} font-medium mb-3 md:mb-4 line-clamp-2`}>{voucher.desc}</p>
                </div>
                <div className="inline-block bg-white/40 px-2.5 py-1 md:px-3 rounded-full text-[10px] md:text-xs font-semibold text-gray-800 backdrop-blur-sm self-start mt-2">
                  {voucher.expiry}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Food Promos */}
      <div>
        <h3 className="text-2xl font-bold text-gray-800 mb-6">{t[language].whatToEat}</h3>
        <div ref={promosRef} className="flex overflow-x-auto gap-4 md:gap-6 pb-4 snap-x snap-mandatory hide-scrollbar scroll-smooth">
          {(promotions.length > 0 ? promotions : [
            { title: 'Thưởng thức Iga Wagyu Thượng Hạng', title_en: 'Enjoy Premium Iga Wagyu', image_url: 'https://images.unsplash.com/photo-1544025162-831e7fce95af?auto=format&fit=crop&q=80&w=800&h=500' },
            { title: 'Trải nghiệm Shojin Ryori Tinh Tế', title_en: 'Exquisite Shojin Ryori Experience', image_url: 'https://images.unsplash.com/photo-1580828369018-0288cba8c6dc?auto=format&fit=crop&q=80&w=800&h=500' },
          ]).map((promo, idx) => (
            <div key={promo.id || idx} className="relative w-full sm:w-[320px] md:w-[400px] h-[200px] md:h-[250px] shrink-0 snap-start rounded-3xl overflow-hidden group cursor-pointer shadow-sm hover:shadow-xl transition-all">
              <img 
                src={promo.image_url || promo.image || 'https://images.unsplash.com/photo-1544025162-831e7fce95af?auto=format&fit=crop&q=80&w=800&h=500'} 
                alt={promo.title || promo.name} 
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" 
                onError={(e) => {
                  e.currentTarget.src = BANNER_IMAGES[idx % BANNER_IMAGES.length];
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-5 md:p-6">
                <span className="inline-block px-3 py-1 bg-[#00a662] text-white text-[10px] font-bold rounded-full w-max mb-2 uppercase tracking-wide">
                  {t[language].promoTag}
                </span>
                <h4 className="text-white text-lg md:text-2xl font-bold leading-tight">
                  {language === 'en' && promo.title_en ? promo.title_en : (promo.title || promo.name)}
                </h4>
                {(promo.description || promo.description_en) && (
                  <p className="text-gray-300 text-xs md:text-sm mt-1 line-clamp-2">
                    {language === 'en' && promo.description_en ? promo.description_en : promo.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Wallet Button */}
      <button 
        onClick={() => navigate('/topup')}
        className="fixed bottom-24 right-4 md:bottom-8 md:right-8 bg-primary text-white px-4 py-3 md:px-6 md:py-4 rounded-full shadow-2xl flex items-center gap-2 md:gap-3 hover:bg-amber-700 hover:scale-105 transition-all z-50 group"
      >
        <Wallet className="w-5 h-5 md:w-6 md:h-6 group-hover:rotate-12 transition-transform" />
        <div className="flex flex-col items-start">
          <span className="text-[10px] md:text-xs font-medium text-white/80">{t[language].walletBalance}</span>
          <span className="font-bold text-sm md:text-lg leading-none">{balance.toLocaleString('vi-VN')}đ</span>
        </div>
      </button>

      {/* Contact Modal */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setIsContactModalOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold text-gray-800">{t[language].contactUs}</h3>
              <button onClick={() => setIsContactModalOpen(false)} className="text-gray-400 hover:text-gray-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <a href="tel:+84123456789" className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-green-50 transition-colors group text-decoration-none">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-gray-800">{t[language].callUs}</div>
                  <div className="text-sm text-gray-500">1900 1234</div>
                </div>
              </a>
              
              <a href="mailto:contact@igourmet.com" className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors group text-decoration-none">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-gray-800">{t[language].emailUs}</div>
                  <div className="text-sm text-gray-500">contact@igourmet.com</div>
                </div>
              </a>
              
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-indigo-50 transition-colors group text-decoration-none">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-gray-800">{t[language].facebook}</div>
                  <div className="text-sm text-gray-500">@igourmet.vn</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
