import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { Order } from '../types';
import { useToast } from '../context/ToastContext';
import { storageHelper } from '../utils/storage';
import { formatCurrency } from '../utils/format';
import { OrderStatusSkeleton } from '../components/Skeletons';
import { 
  ArrowLeft, Clock, MapPin, Receipt, CheckCircle, 
  ChefHat, Truck, Check, ExternalLink, AlertTriangle, RefreshCw 
} from 'lucide-react';
import { motion } from 'motion/react';

export const OrderStatusPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { showError, showSuccess, showInfo } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // References for terminal polling checks
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = async (showPulse = false) => {
    if (!orderId) return;
    if (showPulse) setIsRefreshing(true);

    try {
      const data = await apiService.getOrderStatus(orderId);
      if (data) {
        setOrder(data);
        setHasError(false);

        // Terminal states for polling
        const terminalPaymentStatuses = ['PAID', 'EXPIRED', 'FAILED', 'CANCELLED'];
        const terminalOrderStatuses = ['DONE', 'DELIVERED'];

        const isPaymentTerminal = terminalPaymentStatuses.includes(data.payment_status);
        const isOrderTerminal = terminalOrderStatuses.includes(data.order_status);

        // If payment is paid/expired/failed/cancelled, and order is delivered/done, stop polling
        if (isPaymentTerminal || isOrderTerminal) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
            console.log('Terminal status reached. Polling stopped.');
          }
        }
      } else {
        setHasError(true);
      }
    } catch (err: any) {
      console.error('Error fetching order status:', err);
      if (isLoading) {
        setHasError(true);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Start polling on mount and clean up on unmount
  useEffect(() => {
    fetchStatus();

    // Setup 5-second interval polling
    pollIntervalRef.current = setInterval(() => {
      fetchStatus();
    }, 5000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [orderId]);

  if (isLoading) {
    return <OrderStatusSkeleton />;
  }

  if (hasError || !order) {
    return (
      <div className="py-16 text-center space-y-6 max-w-sm mx-auto">
        <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mx-auto text-red-600">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-display text-lg text-espresso uppercase tracking-wide">Pesanan Tidak Ditemukan</h3>
          <p className="text-xs text-muted leading-relaxed font-sans">
            Gagal mengambil status pesanan terbaru dari server. Silakan muat ulang atau cek koneksi internet Anda.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/orders')}
            className="flex-1 bg-ivory border border-line text-espresso py-3 rounded-xl text-xs font-semibold hover:bg-line transition-all uppercase tracking-wider"
          >
            Riwayat
          </button>
          <button
            onClick={() => fetchStatus(true)}
            className="flex-1 bg-espresso text-ivory py-3 rounded-xl text-xs font-semibold hover:bg-espresso-dark flex items-center justify-center gap-1.5 transition-all uppercase tracking-wider"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Muat Ulang
          </button>
        </div>
      </div>
    );
  }

  // Calculate current stage in timeline
  const getTimelineStage = () => {
    const pStat = order.payment_status;
    const oStat = order.order_status;

    if (pStat === 'UNPAID' || pStat === 'PENDING' || pStat === 'WAITING_PAYMENT') return 0;
    
    if (oStat === 'WAITING') return 1;
    if (oStat === 'CONFIRMED') return 2;
    if (oStat === 'COOKING') return 3;
    if (oStat === 'READY' || oStat === 'DELIVERING') return 4;
    if (oStat === 'DELIVERED' || oStat === 'DONE') return 5;

    return 1;
  };

  const currentStage = getTimelineStage();

  const timelineNodes = [
    { label: 'Menunggu Pembayaran', desc: 'Selesaikan pembayaran di halaman Midtrans', icon: Clock },
    { label: 'Pembayaran Berhasil', desc: 'Sistem memverifikasi pembayaran Anda', icon: CheckCircle },
    { label: 'Pesanan Dikonfirmasi', desc: 'Pesanan diteruskan ke barista & kitchen', icon: Receipt },
    { label: 'Sedang Disiapkan', desc: 'Tim kuliner sedang meracik pesanan Anda', icon: ChefHat },
    { label: 'Siap & Diantar', desc: 'Pesanan sedang dibawa pelayan ke meja', icon: Truck },
    { label: 'Selesai', desc: 'Nikmati sajian istimewa Anda di meja', icon: Check },
  ];

  // Helper for payment status styles
  const getPaymentBadgeStyles = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PENDING':
      case 'WAITING_PAYMENT':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'UNPAID':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-ivory text-muted border-line';
    }
  };

  // Check if we have a locally stored redirect URL for unpaid orders
  const latestOrderLocal = storageHelper.getLatestOrder();
  const showPaymentLink = (order.payment_status === 'UNPAID' || order.payment_status === 'PENDING' || order.payment_status === 'WAITING_PAYMENT') && 
                          latestOrderLocal?.orderId === order.order_id && 
                          latestOrderLocal?.redirectUrl;

  return (
    <div className="space-y-8 pb-20 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/orders')}
            className="bg-ivory/50 border border-line p-2 rounded-xl text-espresso hover:bg-ivory hover:text-caramel transition-colors"
            id="order-status-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-display font-medium text-lg uppercase tracking-tight text-espresso">Status Pesanan</span>
        </div>
        
        <button
          onClick={() => fetchStatus(true)}
          disabled={isRefreshing}
          className="bg-ivory/50 hover:bg-ivory border border-line p-2 rounded-xl text-espresso transition-all disabled:opacity-45"
          id="order-status-refresh"
        >
          <RefreshCw className={`w-4.5 h-4.5 ${isRefreshing ? 'animate-spin text-caramel' : ''}`} />
        </button>
      </div>

      {/* Main Stats Card */}
      <div className="bg-espresso-dark text-ivory p-6 rounded-2xl shadow-sm border border-caramel/20 space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-0.5">
            <span className="text-[10px] text-ivory/50 uppercase tracking-widest font-mono">ID Pesanan</span>
            <h2 className="font-display text-lg text-caramel font-semibold">{order.order_number}</h2>
          </div>
          
          <div className="bg-caramel/10 border border-caramel/25 px-3 py-1 rounded-full flex items-center gap-1 text-xs text-caramel font-semibold">
            <MapPin className="w-3.5 h-3.5" />
            <span>Meja {order.table_id}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10 text-xs font-sans">
          <div>
            <span className="text-ivory/50 block mb-1">Metode Pembayaran</span>
            <span className="font-bold uppercase tracking-wider">{order.payment_method}</span>
          </div>
          <div>
            <span className="text-ivory/50 block mb-1">Status Pembayaran</span>
            <span className={`px-2.5 py-1 rounded-lg font-semibold text-[10px] uppercase border inline-block ${getPaymentBadgeStyles(order.payment_status)}`}>
              {order.payment_status}
            </span>
          </div>
        </div>

        {/* Dynamic QRIS payment redirect for unpaid */}
        {showPaymentLink && latestOrderLocal?.redirectUrl && (
          <div className="pt-2">
            <a
              href={latestOrderLocal.redirectUrl}
              target="_blank"
              referrerPolicy="no-referrer"
              rel="noopener noreferrer"
              className="w-full bg-caramel hover:bg-caramel-dark text-ivory py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm uppercase tracking-wider font-mono"
              id="repay-midtrans-btn"
            >
              <span>Bayar QRIS Sekarang</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>

      {/* Interactive Timeline Stepper */}
      <div className="bg-ivory/30 border border-line rounded-2xl p-6 space-y-5">
        <h3 className="font-display text-xs uppercase tracking-widest text-espresso font-semibold pb-2 border-b border-line">
          Lini Masa Pesanan
        </h3>

        <div className="relative pl-7 space-y-6 pt-1">
          {/* Timeline Connector Line */}
          <div className="absolute left-[9.5px] top-4 bottom-4 w-0.5 bg-line" />
          
          {/* Timeline Nodes */}
          {timelineNodes.map((node, index) => {
            const isCompleted = index < currentStage;
            const isActive = index === currentStage;

            const NodeIcon = node.icon;

            return (
              <div key={index} className="relative flex gap-4 text-left">
                {/* Node indicator */}
                <div 
                  className={`absolute -left-[27px] top-0.5 w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    isCompleted 
                      ? 'bg-caramel border-caramel text-ivory shadow-sm'
                      : isActive
                      ? 'bg-espresso border-espresso text-caramel scale-110 shadow-sm ring-4 ring-espresso/10 animate-pulse'
                      : 'bg-white border-line text-muted/30'
                  }`}
                >
                  <NodeIcon className="w-2.5 h-2.5 stroke-[3]" />
                </div>

                <div className="space-y-0.5 font-sans">
                  <h4 className={`text-xs font-semibold transition-colors ${
                    isCompleted ? 'text-espresso/70' : isActive ? 'text-espresso font-bold' : 'text-muted/40'
                  }`}>
                    {node.label}
                  </h4>
                  <p className={`text-[10px] leading-relaxed transition-colors ${
                    isCompleted ? 'text-muted/70' : isActive ? 'text-muted' : 'text-muted/30'
                  }`}>
                    {node.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bill Items list */}
      <div className="bg-white border border-line rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-1.5 text-espresso font-display font-semibold text-xs uppercase tracking-wider pb-3 border-b border-line/50">
          <Receipt className="w-4 h-4 text-caramel" />
          <span>Daftar Menu yang Dipesan</span>
        </div>

        <div className="space-y-3.5">
          {order.items?.map((item, i) => (
            <div key={i} className="flex justify-between items-start text-xs text-muted gap-4 border-b border-line/25 pb-3 last:border-0 last:pb-0">
              <div className="space-y-0.5 font-sans">
                <p className="font-semibold text-espresso">
                  {item.menu_name} <span className="text-caramel ml-1">x{item.quantity}</span>
                </p>
                {item.options && item.options.length > 0 && (
                  <p className="text-[10px] text-muted">
                    {item.options.map(o => o.name).join(', ')}
                  </p>
                )}
                {item.note && (
                  <p className="text-[10px] text-caramel italic">Catatan: {item.note}</p>
                )}
              </div>
              <span className="font-semibold font-mono text-espresso">{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-line flex justify-between font-display text-espresso items-baseline">
          <span className="uppercase tracking-wider text-xs font-semibold">Total Pesanan</span>
          <span className="text-caramel-dark text-base font-semibold font-mono">{formatCurrency(order.total_price)}</span>
        </div>
      </div>

      {/* Action to menu */}
      <div className="flex justify-center pt-2">
        <Link
          to="/menu"
          className="bg-espresso hover:bg-espresso-dark text-ivory font-display text-xs uppercase tracking-widest font-semibold py-4 rounded-xl shadow-sm transition-all active:scale-95 text-center flex-1"
          id="order-status-order-more-btn"
        >
          Kembali ke Menu Utama
        </Link>
      </div>
    </div>
  );
};
