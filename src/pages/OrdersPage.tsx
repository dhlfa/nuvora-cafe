import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { storageHelper } from '../utils/storage';
import { apiService } from '../services/api';
import { Order } from '../types';
import { useLocale } from '../context/LocaleContext';
import { useTheme } from '../context/ThemeContext';
import { ClipboardList, Loader2, MapPin, ShoppingBag } from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, locale } = useLocale();
  const { reduceMotion } = useTheme();
  const [orderIds, setOrderIds] = useState<string[]>([]);
  const [ordersDetails, setOrdersDetails] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrdersHistory = async () => {
    setIsLoading(true);
    try {
      const savedIds = storageHelper.getOrders();
      setOrderIds(savedIds);

      if (savedIds.length > 0) {
        const detailPromises = savedIds.map(async (id) => {
          try {
            return await apiService.getOrderStatus(id);
          } catch (e) {
            console.error(`Failed to fetch status for order ${id}`, e);
            return null;
          }
        });

        const results = await Promise.all(detailPromises);
        const filteredResults = results.filter((o): o is Order => o !== null);
        
        filteredResults.sort((a, b) => {
          return b.order_number.localeCompare(a.order_number);
        });

        setOrdersDetails(filteredResults);
      }
    } catch (err) {
      console.error('Failed to load orders history details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersHistory();
  }, []);

  const getStatusBadgeStyles = (paymentStatus: string, orderStatus: string) => {
    if (paymentStatus === 'UNPAID' || paymentStatus === 'PENDING' || paymentStatus === 'WAITING_PAYMENT') {
      return 'bg-warning/10 text-warning border-warning/20';
    }

    switch (orderStatus) {
      case 'DONE':
      case 'DELIVERED':
        return 'bg-success/10 text-success border-success/20';
      case 'COOKING':
        return 'bg-caramel/10 text-caramel border-caramel/20';
      case 'READY':
      case 'DELIVERING':
        return 'bg-espresso/10 text-espresso border-espresso/20';
      default:
        return 'bg-surface text-text-secondary border-border';
    }
  };

  const translateStatus = (paymentStatus: string, orderStatus: string) => {
    if (paymentStatus === 'UNPAID' || paymentStatus === 'PENDING' || paymentStatus === 'WAITING_PAYMENT') {
      return t('status.waiting_payment');
    }

    switch (orderStatus) {
      case 'COOKING': return t('status.cooking');
      case 'READY': return t('status.ready');
      case 'DONE': return t('status.done');
      default: return t('status.waiting_payment');
    }
  };

  const formatIDRCurrency = (val: number) => {
    return new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-8 pb-20 max-w-2xl mx-auto text-left">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="font-display font-medium text-2xl uppercase tracking-tight text-text-primary">
          {t('orders.title')}
        </h2>
        <p className="text-xs text-text-secondary font-sans font-light">
          {t('orders.desc')}
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-caramel animate-spin" />
          <span className="text-xs text-text-secondary font-sans font-light">{t('orders.syncing')}</span>
        </div>
      ) : orderIds.length === 0 ? (
        <div className="bg-surface border border-dashed border-border rounded-2xl py-14 px-6 text-center space-y-4">
          <div className="w-14 h-14 bg-background border border-border rounded-full flex items-center justify-center mx-auto shadow-sm">
            <ClipboardList className="w-6 h-6 text-text-secondary/50" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-display text-base text-text-primary uppercase tracking-wide font-medium">{t('orders.empty')}</h3>
            <p className="text-xs text-text-secondary leading-relaxed max-w-xs mx-auto font-sans font-light">
              {t('orders.emptyDesc')}
            </p>
          </div>
          <Link
            to="/menu"
            className="inline-block bg-espresso hover:bg-espresso-hover text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-sm uppercase tracking-wider font-mono transition-all"
            id="orders-to-menu-btn"
          >
            {t('orders.viewMenuBtn')}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {ordersDetails.map((order) => {
            const itemsCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
            const statusLabel = translateStatus(order.payment_status, order.order_status);
            const badgeStyle = getStatusBadgeStyles(order.payment_status, order.order_status);

            return (
              <button
                key={order.order_id}
                onClick={() => navigate(`/order-status/${order.order_id}`)}
                className="w-full text-left bg-surface border border-border hover:border-caramel/20 p-5 rounded-2xl shadow-sm transition-all flex flex-col gap-4"
                id={`history-order-btn-${order.order_id}`}
              >
                {/* Top Bar: Code & Date */}
                <div className="flex justify-between items-start w-full">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-text-secondary font-mono font-bold leading-none">{t('orders.idLabel')}</span>
                    <h4 className="font-display font-medium text-sm text-text-primary leading-none">
                      {order.order_number}
                    </h4>
                  </div>

                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-semibold border uppercase font-sans ${badgeStyle}`}>
                    {statusLabel}
                  </span>
                </div>

                {/* Info Row: Table & Items count */}
                <div className="flex justify-between items-center text-xs text-text-secondary border-t border-border/45 pt-3 font-sans">
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-3.5 h-3.5 text-caramel" />
                    <span className="font-semibold text-text-primary">Meja {order.table_id}</span>
                    <span className="text-border">|</span>
                    <ShoppingBag className="w-3.5 h-3.5 text-caramel" />
                    <span>{itemsCount} Item</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] text-text-secondary block leading-none mb-0.5 uppercase font-mono">{t('orders.totalLabel')}</span>
                    <span className="font-display font-semibold text-sm text-caramel">
                      {formatIDRCurrency(order.total_price)}
                    </span>
                  </div>
                </div>

                {/* List preview items */}
                <div className="text-[11px] text-text-secondary leading-relaxed space-y-0.5 border-t border-border/20 pt-2 font-sans font-light">
                  {order.items?.slice(0, 2).map((item, idx) => (
                    <p key={idx} className="truncate">
                      &bull; {item.menu_name} <span className="font-semibold text-text-primary ml-1">x{item.quantity}</span>
                    </p>
                  ))}
                  {order.items && order.items.length > 2 && (
                    <p className="text-[10px] italic text-caramel font-semibold font-sans">
                      {t('orders.moreItems', { count: order.items.length - 2 })}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
