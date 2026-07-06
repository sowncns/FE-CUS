import { useState, useEffect } from 'react';
import { X, ScanLine, Smartphone, RefreshCw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../lib/api';

interface QrActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

const QrActionModal = ({ isOpen, onClose, user }: QrActionModalProps) => {
  const [paymentToken, setPaymentToken] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    let timer: any;
    if (paymentToken && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setPaymentToken(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [paymentToken, timeLeft]);

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      setPaymentToken(null);
      setTimeLeft(0);
    }
  }, [isOpen]);

  const handleGeneratePaymentToken = async () => {
    if (!user?.id) return alert("Vui lòng đăng nhập!");
    setGenerating(true);
    try {
      const res: any = await api.post('/customer/qr-payment/generate-token');
      setPaymentToken(res.token);
      setTimeLeft(res.expiresIn || 60);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể tạo mã thanh toán');
    } finally {
      setGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Quét Mã QR</h3>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Mã QR của tôi (Staff scan this) */}
        <div className={`rounded-3xl p-6 text-center border mb-6 transition-colors ${paymentToken ? 'bg-indigo-50 border-indigo-200' : 'bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20'}`}>
          <p className="text-gray-600 font-medium mb-4 text-sm">
            {paymentToken ? 'Mã QR thanh toán' : 'Mã QR thành viên của bạn'}
          </p>
          <div className="bg-white p-4 rounded-2xl inline-block shadow-sm relative">
            {user?.id ? (
              <QRCodeSVG 
                value={paymentToken ? paymentToken : String(user.id)} 
                size={160} 
                level="H" 
                fgColor={paymentToken ? "#4f46e5" : "#000000"} 
              />
            ) : (
              <div className="w-[160px] h-[160px] bg-gray-100 flex items-center justify-center text-sm text-gray-400">
                Vui lòng đăng nhập
              </div>
            )}
            {paymentToken && (
              <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-white/10 backdrop-blur-[1px]">
                <div className="bg-white/90 text-indigo-700 font-bold px-3 py-1 rounded-full shadow-sm text-sm border border-indigo-100">
                  {timeLeft}s
                </div>
              </div>
            )}
          </div>
          <p className="mt-4 text-xs text-gray-500 font-medium">
            {paymentToken 
              ? 'Đưa mã này cho nhân viên để trừ tiền vào hóa đơn. Mã sẽ tự động hết hạn.'
              : 'Đưa mã này cho nhân viên để tích điểm'}
          </p>
        </div>

        {/* 2 & 3. Quét mã QR */}
        <div className="flex gap-3">
          <button 
            className="flex-1 flex flex-col items-center justify-center bg-gray-50 border border-gray-100 hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all p-4 rounded-2xl gap-2 group"
            onClick={() => alert("Chức năng quét mã hóa đơn đang được phát triển!")}
          >
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-400 group-hover:text-primary group-hover:bg-primary/10 transition-colors">
              <ScanLine className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-gray-600 group-hover:text-primary">Tích điểm</span>
          </button>
          
          <button 
            className="flex-1 flex flex-col items-center justify-center bg-gray-50 border border-gray-100 hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all p-4 rounded-2xl gap-2 group disabled:opacity-50"
            onClick={handleGeneratePaymentToken}
            disabled={generating || !!paymentToken}
          >
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-400 group-hover:text-primary group-hover:bg-primary/10 transition-colors">
              {generating ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <Smartphone className="w-6 h-6" />
              )}
            </div>
            <span className="text-xs font-bold text-gray-600 group-hover:text-primary">Thanh toán</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QrActionModal;
