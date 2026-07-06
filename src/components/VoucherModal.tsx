import { useState, useEffect } from 'react';
import { X, Gift, AlertCircle, } from 'lucide-react';
import api from '../lib/api';
import QRCode from 'react-qr-code';
import { useAuth } from '../contexts/AuthContext';

interface Voucher {
  customer_voucher_id: number;
  code: string;
  name: string;
  description: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number;
  apply_scope: string;
  type:string;
  max_discount_amount: number;
  end_date: string;
}

interface VoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1615361200141-f45040f367be?auto=format&fit=crop&q=80&w=800&h=400',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800&h=400',
  'https://images.unsplash.com/photo-1544025162-831e7fce95af?auto=format&fit=crop&q=80&w=800&h=400',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800&h=400',
];

const VoucherModal = ({ isOpen, onClose }: VoucherModalProps) => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      if (!user) {
        setLoading(false);
        setError('Vui lòng đăng nhập để xem voucher của bạn.');
        return;
      }
      
      const fetchVouchers = async () => {
        setLoading(true);
        setError('');
        try {
          const response: any = await api.get('/customer/voucher');
          if (response.vouchers) {
            setVouchers(response.vouchers);
          }
        } catch (err: any) {
          setError(err.response?.data?.message || 'Không thể tải danh sách voucher.');
        } finally {
          setLoading(false);
        }
      };
      
      fetchVouchers();
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()}`;
  };

  const filteredVouchers = vouchers.filter(v => {
    // Phân loại theo trường 'type'
    if (!v.type) return true;
    const typeStr = String(v.type).toLowerCase();
    return !typeStr.includes('delivery') && !typeStr.includes('giao');
  });

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-0 md:p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-[#f9fafb] w-full h-full md:h-auto md:max-w-5xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:max-h-[90vh]">
        {/* Header */}
        <div className="bg-white px-4 md:px-8 py-4 md:py-5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight">Quà tặng</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-4 md:p-8 pb-24 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a662]"></div>
            </div>
          ) : error ? (
            <div className="bg-white rounded-3xl p-12 text-center text-gray-500 flex flex-col items-center shadow-sm">
              <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-lg">{error}</p>
            </div>
          ) : filteredVouchers.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center text-gray-500 flex flex-col items-center shadow-sm border border-gray-100">
              <Gift className="w-24 h-24 text-gray-200 mb-6" />
              <p className="font-semibold text-xl text-gray-700">Bạn chưa có voucher nào</p>
              <p className="text-gray-500 mt-2 text-lg">Hãy tiếp tục sử dụng dịch vụ để nhận thêm nhiều ưu đãi nhé!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-8">
              {filteredVouchers.map((v, idx) => (
                <div key={v.customer_voucher_id} className="group cursor-pointer" onClick={() => setSelectedVoucher(v)}>
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 relative h-[180px] md:h-[220px]">
                    <img 
                      src={DEFAULT_IMAGES[idx % DEFAULT_IMAGES.length]} 
                      alt={v.name} 
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex flex-col justify-center p-4 md:p-8">
                      <span className="bg-white/20 backdrop-blur-md text-white text-[10px] md:text-xs font-bold px-2 md:px-3 py-1 rounded-full w-max mb-2 md:mb-3 border border-white/30">
                        {v.code}
                      </span>
                      <h3 className="text-white font-extrabold text-2xl sm:text-3xl md:text-4xl leading-tight mb-1 md:mb-2 max-w-[90%] md:max-w-[80%]">
                        {v.name}
                      </h3>
                      <p className="text-gray-200 font-medium text-xs md:text-sm max-w-[90%] md:max-w-[80%] line-clamp-2">
                        {v.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 md:mt-4 flex items-center justify-between px-1 md:px-2">
                    <span className="text-gray-600 md:text-gray-700 font-medium text-sm md:text-lg">
                      Hạn sử dụng: {formatDate(v.end_date)}
                    </span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedVoucher(v); }}
                      className="text-[#00a662] font-bold text-sm md:text-base hover:underline opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Dùng ngay
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Nested QR Modal */}
      {selectedVoucher && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => setSelectedVoucher(null)}
          />
          <div className="relative bg-white rounded-3xl p-8 max-w-sm w-full flex flex-col items-center shadow-2xl animate-in fade-in zoom-in duration-300">
            <button 
              onClick={() => setSelectedVoucher(null)}
              className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-6 mt-2 text-center">{selectedVoucher.name}</h3>
            
            <div className="bg-white p-4 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.1)] mb-6">
              <QRCode value={`${user ? user.id : ''}-${selectedVoucher.code}`} size={200} />
            </div>
            
            <p className="text-gray-500 text-sm mb-1">Mã Voucher</p>
            <p className="text-2xl font-black text-emerald-600 tracking-widest">{selectedVoucher.code}</p>
            <p className="text-sm text-gray-500 mt-6 text-center">
              Đưa mã QR này cho nhân viên phục vụ hoặc thu ngân để áp dụng giảm giá
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoucherModal;
