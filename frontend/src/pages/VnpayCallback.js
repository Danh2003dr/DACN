import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const VnpayCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking'); // checking, success, failed
  const [paymentId, setPaymentId] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Lấy thông tin từ URL params
        const success = searchParams.get('success');
        const msg = searchParams.get('message');
        const pid = searchParams.get('paymentId');
        const orderId = searchParams.get('vnp_TxnRef');

        if (msg) {
          setMessage(decodeURIComponent(msg));
        }

        if (pid) {
          setPaymentId(pid);
        }

        // Kiểm tra kết quả từ query params
        if (success === 'true') {
          setStatus('success');
          toast.success('Thanh toán VNPay thành công!');
        } else if (success === 'false') {
          setStatus('failed');
          toast.error(msg ? decodeURIComponent(msg) : 'Thanh toán VNPay thất bại');
        } else {
          // Nếu không có success param, kiểm tra các params khác từ VNPay
          const responseCode = searchParams.get('vnp_ResponseCode');
          
          if (responseCode === '00') {
            setStatus('success');
            toast.success('Thanh toán VNPay thành công!');
          } else {
            setStatus('failed');
            const errorMsg = msg || 'Thanh toán VNPay thất bại';
            toast.error(errorMsg);
          }
        }

        // Sau 3 giây, tự động redirect về trang orders
        setTimeout(() => {
          navigate('/orders');
        }, 3000);
      } catch (error) {
        console.error('Error processing VNPay callback:', error);
        setStatus('failed');
        toast.error('Có lỗi xảy ra khi xử lý kết quả thanh toán');
      }
    };

    processCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'checking' && (
          <>
            <Loader className="w-16 h-16 mx-auto mb-4 animate-spin text-blue-600" />
            <h2 className="text-xl font-semibold mb-2">Đang xử lý thanh toán...</h2>
            <p className="text-gray-600">Vui lòng đợi trong giây lát</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
            <h2 className="text-xl font-semibold mb-2 text-green-600">Thanh toán thành công!</h2>
            <p className="text-gray-600 mb-4">
              {message || 'Giao dịch của bạn đã được xử lý thành công.'}
            </p>
            {paymentId && (
              <p className="text-sm text-gray-500 mb-4">Mã thanh toán: {paymentId}</p>
            )}
            <button
              onClick={() => navigate('/orders')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Quay lại Đơn hàng
            </button>
            <p className="text-xs text-gray-500 mt-4">Tự động chuyển hướng sau 3 giây...</p>
          </>
        )}

        {status === 'failed' && (
          <>
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-600" />
            <h2 className="text-xl font-semibold mb-2 text-red-600">Thanh toán thất bại</h2>
            <p className="text-gray-600 mb-4">
              {message || 'Có lỗi xảy ra trong quá trình thanh toán.'}
            </p>
            <button
              onClick={() => navigate('/orders')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Quay lại Đơn hàng
            </button>
            <p className="text-xs text-gray-500 mt-4">Tự động chuyển hướng sau 3 giây...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default VnpayCallback;

