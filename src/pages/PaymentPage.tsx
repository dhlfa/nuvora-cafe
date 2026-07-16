import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { storageHelper } from '../utils/storage';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

export const PaymentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useToast();

  useEffect(() => {
    // Check search params sent back from Midtrans Redirect
    const orderIdParam = searchParams.get('order_id');
    const statusCode = searchParams.get('status_code');
    const transactionStatus = searchParams.get('transaction_status');

    if (orderIdParam) {
      if (transactionStatus === 'settlement' || statusCode === '200') {
        showSuccess('Pembayaran berhasil! Pesanan Anda segera disiapkan.');
        navigate(`/order-status/${orderIdParam}`);
      } else if (transactionStatus === 'pending') {
        showInfo('Pembayaran Anda tertunda. Silakan selesaikan pembayaran.');
        navigate(`/order-status/${orderIdParam}`);
      } else if (transactionStatus === 'deny' || transactionStatus === 'expire' || transactionStatus === 'cancel') {
        showError('Transaksi pembayaran gagal atau kedaluwarsa.');
        navigate(`/order-status/${orderIdParam}`);
      } else {
        navigate(`/order-status/${orderIdParam}`);
      }
    } else {
      // Check if there is a latest order in local storage
      const latest = storageHelper.getLatestOrder();
      if (latest && latest.orderId) {
        navigate(`/order-status/${latest.orderId}`);
      } else {
        // Fallback to home
        navigate('/');
      }
    }
  }, [searchParams, navigate, showSuccess, showError, showInfo]);

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
      <Loader2 className="w-10 h-10 text-caramel animate-spin" />
      <div className="space-y-1">
        <h3 className="font-display font-bold text-sm text-espresso uppercase tracking-wider">
          Memproses Transaksi
        </h3>
        <p className="text-xs text-charcoal/50">
          Harap tunggu sebentar selagi kami mengonfirmasi pembayaran Anda...
        </p>
      </div>
    </div>
  );
};
