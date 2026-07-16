import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useTable, tableNumberToId } from '../context/TableContext';
import { useToast } from '../context/ToastContext';
import { useLocale } from '../context/LocaleContext';
import { apiService } from '../services/api';
import { OrderItemInput } from '../types';
import { storageHelper, GuestUser } from '../utils/storage';
import { ArrowLeft, User, Mail, Phone, MapPin, ClipboardCheck, Wallet, Loader2, AlertCircle, Truck, Info, Compass } from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const { cart, cartTotal, clearCart } = useCart();
  const { activeTable, orderType } = useTable();
  const { showError, showSuccess, showInfo } = useToast();
  const { t, locale } = useLocale();
  const navigate = useNavigate();

  // Loading and Process State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Common Customer Form State
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [checkoutNote, setCheckoutNote] = useState('');

  // Delivery-Specific State
  const [deliveryName, setDeliveryName] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [streetName, setStreetName] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [landmark, setLandmark] = useState('');
  const [courierNotes, setCourierNotes] = useState('');

  // Tax Rate State
  const [taxRate, setTaxRate] = useState<number>(0.10); // Default to 10%

  // Payment Selection (Locked to QRIS for Dine-in)
  const [paymentMethod, setPaymentMethod] = useState<'QRIS' | 'CASH'>('QRIS');

  // Pre-populate customer info from Google user session
  useEffect(() => {
    const googleUser = storageHelper.getUser();
    if (!googleUser) {
      showInfo('Silakan masuk dengan akun Google Anda terlebih dahulu untuk melanjutkan pemesanan.');
      navigate('/login?redirect=/checkout', { replace: true });
      return;
    }

    setCustomerName(googleUser.name || '');
    setCustomerEmail(googleUser.email || '');
    setDeliveryName(googleUser.name || '');
    
    const savedGuest = storageHelper.getGuestUser();
    if (savedGuest?.phone) {
      setCustomerPhone(savedGuest.phone);
      setDeliveryPhone(savedGuest.phone);
    }

    // Redirect to menu if cart is empty
    if (cart.length === 0) {
      navigate('/menu');
    }
  }, [cart.length, navigate, showInfo]);

  // Fetch backend settings for tax calculation
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await apiService.getSettings();
        if (settings) {
          if (typeof settings.tax_rate === 'number') {
            setTaxRate(settings.tax_rate);
          } else if (typeof settings.tax_percent === 'number') {
            setTaxRate(settings.tax_percent / 100);
          } else if (typeof settings.pb1 === 'number') {
            setTaxRate(settings.pb1);
          } else if (settings.data && typeof settings.data.tax_rate === 'number') {
            setTaxRate(settings.data.tax_rate);
          }
        }
      } catch (err) {
        console.warn('Gagal memuat pengaturan pajak, default 10%:', err);
        setTaxRate(0.10);
      }
    };
    fetchSettings();
  }, []);

  const formatCurrencyValue = (val: number) => {
    return new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Form Validation
  const isFormValid = () => {
    const baseValid = (
      customerName.trim().length >= 3 &&
      customerEmail.trim().match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) &&
      customerPhone.trim().length >= 10
    );

    if (!baseValid) return false;

    if (orderType === 'delivery') {
      // Receiver details & detailed address are mandatory for delivery
      return (
        deliveryName.trim().length >= 3 &&
        deliveryPhone.trim().length >= 10 &&
        streetName.trim().length >= 5 &&
        houseNumber.trim().length >= 1 &&
        district.trim().length >= 3 &&
        city.trim().length >= 3
      );
    }

    return true;
  };

  const handleGetCurrentLocation = () => {
    showInfo('Mohon masukkan alamat pengiriman Anda secara manual saat ini.');
  };

  const handleProcessCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (orderType === 'dine_in' && !activeTable) {
      showError('Sesi meja tidak terdeteksi. Silakan pilih meja terlebih dahulu.');
      navigate('/');
      return;
    }

    if (!isFormValid()) {
      showError('Mohon isi semua field data kontak Anda dengan lengkap.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const activeTableNum = activeTable ? (activeTable.table_number || activeTable.tableName || '1') : '';
    const cleanTableId = activeTable ? (activeTable.table_id || activeTable.tableId || tableNumberToId(activeTableNum)) : '';

    // Validate table existence on backend before creating order (ONLY for Dine-in)
    if (orderType === 'dine_in') {
      try {
        const tablesList = await apiService.getTables();
        const matchedTable = tablesList.find(t => 
          String(t.table_id).toLowerCase() === String(cleanTableId).toLowerCase()
        );

        if (!matchedTable) {
          showError(`Meja ${cleanTableId} tidak ditemukan atau tidak terdaftar di sistem café.`);
          setIsSubmitting(false);
          return;
        }

        const status = String(matchedTable.status ?? "").toLowerCase();
        if (status !== "available" && status !== "active") {
          showError(`Meja ${matchedTable.table_name || cleanTableId} saat ini sedang tidak aktif.`);
          setIsSubmitting(false);
          return;
        }
      } catch (tableErr: any) {
        console.warn('Aktivitas validasi meja dilewati:', tableErr);
      }
    }

    // Prepare items input structure
    const orderItems: OrderItemInput[] = cart.map((item) => {
      const optionsInput = item.selected_options.flatMap((g) =>
        g.options.map((opt) => ({
          option_id: opt.option_id || opt.id,
          quantity: 1,
        }))
      );

      return {
        menu_id: item.menu_id,
        quantity: item.quantity,
        note: item.item_note || '',
        options: optionsInput,
      };
    });

    try {
      const orderPayload: any = {
        order_type: orderType,
        customer_name: customerName.trim(),
        customer_email: String(customerEmail ?? "").trim().toLowerCase(),
        customer_phone: customerPhone.trim(),
        payment_method: 'QRIS', // Locked to QRIS for dine-in & delivery
        payment_gateway: 'midtrans',
        customer_note: checkoutNote.trim(),
        items: orderItems,
      };

      if (orderType === 'dine_in') {
        orderPayload.table_id = cleanTableId;
      } else {
        orderPayload.delivery_name = deliveryName.trim();
        orderPayload.delivery_phone = deliveryPhone.trim();
        orderPayload.delivery_address = `${streetName}, No. ${houseNumber}, ${district}, ${city}${landmark ? ` (Patokan: ${landmark})` : ''}`.trim();
        orderPayload.delivery_note = courierNotes.trim();
        orderPayload.delivery_fee = 5000;
      }

      // Save customer profile as guest user for convenience
      const guestProfile: GuestUser = {
        name: customerName.trim(),
        email: String(customerEmail ?? "").trim().toLowerCase(),
        phone: customerPhone.trim(),
      };
      storageHelper.setGuestUser(guestProfile);

      const orderResult = await apiService.createOrder(orderPayload);
      
      if (!orderResult || !orderResult.order_id) {
        throw new Error('Gagal membuat pesanan baru dari server.');
      }

      const orderId = orderResult.order_id;
      const orderNumber = orderResult.order_number || orderId;

      // Add to Order history
      storageHelper.addOrderToHistory(orderId);

      // Handle QRIS Payment (Redirection via Midtrans Sandbox)
      try {
        const paymentResult = await apiService.createPayment(orderId);

        if (!paymentResult || !paymentResult.redirect_url) {
          throw new Error('Gagal membuat URL pembayaran Midtrans.');
        }

        const redirectUrl = paymentResult.redirect_url;

        // Save latest order state with payment details
        storageHelper.setLatestOrder({
          orderId,
          orderNumber,
          redirectUrl,
        });

        // Clear cart before redirection
        clearCart();

        showInfo('Mengalihkan Anda ke halaman pembayaran Midtrans...');
        window.location.href = redirectUrl;

      } catch (payError: any) {
        console.error('Payment generation failed:', payError);
        setErrorMessage(
          `Pesanan Anda #${orderNumber} berhasil dibuat, tetapi sistem gagal memproses pembayaran online. Silakan hubungi kasir dan infokan ID Pesanan Anda.`
        );
        showError('Gagal memproses pembayaran online.');
        setIsSubmitting(false);
      }

    } catch (err: any) {
      console.error('Checkout creation failed:', err);
      setErrorMessage(err.message || 'Gagal memproses pembuatan pesanan.');
      showError(err.message || 'Koneksi checkout bermasalah.');
      setIsSubmitting(false);
    }
  };

  const totals = {
    subtotal: cartTotal,
    tax: Math.round(cartTotal * taxRate),
    deliveryFee: orderType === 'delivery' ? 5000 : 0,
    grandTotal: cartTotal + Math.round(cartTotal * taxRate) + (orderType === 'delivery' ? 5000 : 0),
  };

  const activeTableNum = activeTable ? (activeTable.table_number || activeTable.tableName || '1') : '';
  const cleanTableId = activeTable ? (activeTable.table_id || activeTable.tableId || tableNumberToId(activeTableNum)) : '';

  return (
    <div className="space-y-6 pb-20 max-w-2xl mx-auto text-left">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/cart')}
          className="border border-border p-2 rounded-xl text-text-primary hover:bg-surface hover:text-caramel transition-colors active:scale-95"
          disabled={isSubmitting}
          id="checkout-back-btn"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-display font-medium text-lg uppercase tracking-tight text-text-primary">Informasi Pemesanan</span>
      </div>

      <form onSubmit={handleProcessCheckout} className="space-y-6">
        {/* Table Confirmation Card - ONLY for Dine In */}
        {orderType === 'dine_in' ? (
          activeTable ? (
            <div className="bg-surface border border-border p-5 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-caramel/10 p-2.5 rounded-xl border border-caramel/20 text-caramel">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-text-secondary uppercase tracking-wider block font-mono font-bold">Meja Makan Anda</span>
                  <span className="font-display text-sm font-semibold text-text-primary">
                    {t('order.deliveredToTable').replace('{table}', String(activeTableNum))}
                  </span>
                </div>
              </div>
              <span className="text-[10px] bg-background border border-border px-3 py-1.5 rounded-lg text-text-secondary font-mono font-bold">
                ID: {cleanTableId}
              </span>
            </div>
          ) : (
            <div className="bg-warning/10 border border-warning/20 p-5 rounded-2xl flex items-center gap-3 text-warning shadow-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-xs font-semibold font-sans">Nomor meja belum terdaftar. Silakan pindai ulang atau hubungkan meja di halaman profil/awal.</span>
            </div>
          )
        ) : (
          /* Delivery Info Banner */
          <div className="bg-caramel/5 border border-caramel/20 p-5 rounded-2xl flex items-start gap-3 shadow-sm text-left">
            <Truck className="w-5 h-5 text-caramel flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-semibold text-xs text-text-primary uppercase tracking-wider">{t('order.delivery')}</h4>
              <p className="text-xs text-text-secondary leading-relaxed font-sans font-light">
                {t('order.deliveryComingSoon')} Selesaikan data alamat pengiriman Anda di bawah ini untuk mensimulasikan order.
              </p>
            </div>
          </div>
        )}

        {/* Customer Detail Inputs */}
        <div className="bg-surface border border-border rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-text-primary font-display font-semibold text-xs uppercase tracking-wider pb-3 border-b border-border">
            <User className="w-4 h-4 text-caramel" />
            <span>{t('checkout.recipient')}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider block font-mono">Nama Penerima</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Nama Akun"
                  value={customerName}
                  readOnly
                  disabled={isSubmitting}
                  className="w-full bg-background/50 border border-border text-text-secondary rounded-xl py-3 px-4 pl-10 text-xs outline-none cursor-not-allowed font-medium font-sans"
                  required
                  id="customer-name-input"
                />
                <User className="w-4 h-4 text-text-secondary/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider block font-mono">Alamat Email</label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="Email"
                  value={customerEmail}
                  readOnly
                  disabled={isSubmitting}
                  className="w-full bg-background/50 border border-border text-text-secondary rounded-xl py-3 px-4 pl-10 text-xs outline-none cursor-not-allowed font-medium font-sans"
                  required
                  id="customer-email-input"
                />
                <Mail className="w-4 h-4 text-text-secondary/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Phone Field */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-text-primary uppercase tracking-wider block font-mono">Nomor Handphone / WhatsApp (Wajib)</label>
            <div className="relative">
              <input
                type="tel"
                placeholder="Contoh: 081234567890"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-background border border-border focus:border-caramel/50 rounded-xl py-3 px-4 pl-10 text-xs outline-none transition-all font-medium font-sans"
                required
                id="customer-phone-input"
              />
              <Phone className="w-4 h-4 text-text-secondary/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        {/* Delivery Address Form Block - ONLY for Delivery */}
        {orderType === 'delivery' && (
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2 text-text-primary font-display font-semibold text-xs uppercase tracking-wider">
                <MapPin className="w-4 h-4 text-caramel" />
                <span>{t('checkout.address')}</span>
              </div>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                className="text-[10px] bg-caramel/10 text-caramel border border-caramel/20 hover:bg-caramel/15 px-2.5 py-1.5 rounded-lg font-bold uppercase tracking-wider flex items-center gap-1 active:scale-95 transition-all font-sans"
              >
                <Compass className="w-3 h-3" />
                <span>Gunakan Lokasi Saat Ini</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Recipient Name Field */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-text-primary uppercase tracking-wider block font-mono">Nama Penerima (Wajib)</label>
                  <input
                    type="text"
                    placeholder="Nama lengkap penerima"
                    value={deliveryName}
                    onChange={(e) => setDeliveryName(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full bg-background border border-border focus:border-caramel/50 rounded-xl py-3 px-4 text-xs outline-none transition-all font-sans font-light"
                    required
                  />
                </div>

                {/* Recipient Phone Field */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-text-primary uppercase tracking-wider block font-mono">No. HP Penerima (Wajib)</label>
                  <input
                    type="tel"
                    placeholder="Contoh: 08123456789"
                    value={deliveryPhone}
                    onChange={(e) => setDeliveryPhone(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full bg-background border border-border focus:border-caramel/50 rounded-xl py-3 px-4 text-xs outline-none transition-all font-sans font-light"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Street Name Field */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-text-primary uppercase tracking-wider block font-mono">Nama Jalan (Wajib)</label>
                  <input
                    type="text"
                    placeholder="Nama Jalan, Blok, Gang"
                    value={streetName}
                    onChange={(e) => setStreetName(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full bg-background border border-border focus:border-caramel/50 rounded-xl py-3 px-4 text-xs outline-none transition-all font-sans font-light"
                    required
                  />
                </div>

                {/* House Number Field */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-text-primary uppercase tracking-wider block font-mono">No. Rumah / Unit (Wajib)</label>
                  <input
                    type="text"
                    placeholder="No. 12B, Lantai 3, dll"
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full bg-background border border-border focus:border-caramel/50 rounded-xl py-3 px-4 text-xs outline-none transition-all font-sans font-light"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* District Field */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-text-primary uppercase tracking-wider block font-mono">Kecamatan (Wajib)</label>
                  <input
                    type="text"
                    placeholder="Kecamatan"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full bg-background border border-border focus:border-caramel/50 rounded-xl py-3 px-4 text-xs outline-none transition-all font-sans font-light"
                    required
                  />
                </div>

                {/* City Field */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-text-primary uppercase tracking-wider block font-mono">Kota / Kabupaten (Wajib)</label>
                  <input
                    type="text"
                    placeholder="Kota / Kabupaten"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full bg-background border border-border focus:border-caramel/50 rounded-xl py-3 px-4 text-xs outline-none transition-all font-sans font-light"
                    required
                  />
                </div>
              </div>

              {/* Landmark Field */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-text-primary uppercase tracking-wider block font-mono">Patokan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: Sebelah indomaret, pagar warna hijau"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-background border border-border focus:border-caramel/50 rounded-xl py-3 px-4 text-xs outline-none transition-all font-sans font-light"
                />
              </div>

              {/* Courier Notes Field */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-text-primary uppercase tracking-wider block font-mono">Catatan Kurir (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: Ketuk pintu 3 kali, titip ke pos satpam"
                  value={courierNotes}
                  onChange={(e) => setCourierNotes(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-background border border-border focus:border-caramel/50 rounded-xl py-3 px-4 text-xs outline-none transition-all font-sans font-light"
                />
              </div>

              {/* Shipping Estimate Info Card */}
              <div className="bg-background border border-border p-3 rounded-xl flex items-center gap-2 text-text-secondary text-[10px] font-sans font-light">
                <Info className="w-3.5 h-3.5 text-caramel flex-shrink-0" />
                <span>Estimasi pengantaran: 25-35 menit tergantung jarak tempuh dan kondisi cuaca.</span>
              </div>
            </div>
          </div>
        )}

        {/* Note for kitchen/order */}
        <div className="bg-surface border border-border rounded-2xl p-5 space-y-2 shadow-sm text-left">
          <label className="text-xs font-semibold text-text-primary uppercase tracking-wider block">{t('order.orderNote')}</label>
          <input
            type="text"
            placeholder="Contoh: Antar setelah semua menu siap..."
            value={checkoutNote}
            onChange={(e) => setCheckoutNote(e.target.value)}
            disabled={isSubmitting}
            className="w-full bg-background border border-border focus:border-caramel/50 rounded-xl py-3 px-4 text-xs outline-none transition-all font-sans font-light"
            id="checkout-note-input"
          />
        </div>

        {/* Payment Methods - ONLY shown / enabled for Dine-In. (Hidden CASH entirely for dine-in) */}
        {orderType === 'dine_in' && (
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-4 shadow-sm text-left">
            <div className="flex items-center gap-2 text-text-primary font-display font-semibold text-xs uppercase tracking-wider pb-3 border-b border-border">
              <Wallet className="w-4 h-4 text-caramel" />
              <span>Metode Pembayaran</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('QRIS')}
                disabled={isSubmitting}
                className="p-4 rounded-xl border bg-caramel/5 border-caramel text-text-primary font-bold shadow-sm text-center flex flex-col items-center justify-center gap-1"
                id="payment-method-qris"
              >
                <span className="font-display font-medium text-sm text-caramel">{t('checkout.payWithQris')}</span>
                <span className="text-[9px] uppercase font-mono tracking-widest text-text-secondary font-semibold">Proses instan via Midtrans</span>
              </button>
            </div>
          </div>
        )}

        {/* Items Summary Details */}
        <div className="bg-surface border border-border rounded-2xl p-5 space-y-4 shadow-sm text-left">
          <div className="flex items-center gap-2 text-text-primary font-display font-semibold text-xs uppercase tracking-wider pb-3 border-b border-border">
            <ClipboardCheck className="w-4 h-4 text-caramel" />
            <span>{t('checkout.orderSummary')}</span>
          </div>

          <div className="space-y-3.5 max-h-52 overflow-y-auto pr-1">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between items-start text-xs text-text-secondary gap-4 border-b border-border/40 pb-3 last:border-0 last:pb-0 font-sans font-light">
                <div className="space-y-1">
                  <p className="font-semibold text-text-primary text-xs leading-snug">
                    {item.menu_name} <span className="text-caramel ml-1">x{item.quantity}</span>
                  </p>
                  {item.selected_options && item.selected_options.length > 0 && (
                    <p className="text-[9px] text-text-secondary font-sans leading-none">
                      {item.selected_options.flatMap(g => g.options.map(o => o.option_name ?? o.name)).join(', ')}
                    </p>
                  )}
                  {item.item_note && (
                    <p className="text-[9px] text-caramel italic">Catatan: {item.item_note}</p>
                  )}
                </div>
                <span className="font-semibold font-mono text-text-primary text-xs">{formatCurrencyValue(item.item_total)}</span>
              </div>
            ))}
          </div>

          {/* Money Totals */}
          <div className="pt-4 border-t border-border space-y-2 text-xs font-sans font-light text-text-secondary">
            <div className="flex justify-between">
              <span>Subtotal Menu</span>
              <span className="font-semibold font-mono text-text-primary">{formatCurrencyValue(totals.subtotal)}</span>
            </div>
            {orderType === 'delivery' && (
              <div className="flex justify-between">
                <span>Biaya Pengiriman</span>
                <span className="font-semibold font-mono text-text-primary">{formatCurrencyValue(totals.deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Pajak PB1 ({Math.round(taxRate * 100)}%)</span>
              <span className="font-semibold font-mono text-text-primary">{formatCurrencyValue(totals.tax)}</span>
            </div>
            <div className="pt-3 border-t border-border flex justify-between font-display text-text-primary items-baseline font-normal">
              <span className="text-xs uppercase tracking-wider font-semibold">Total Tagihan</span>
              <span className="text-caramel text-base font-bold font-mono">{formatCurrencyValue(totals.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Error Notification Block */}
        {errorMessage && (
          <div className="bg-danger/10 border border-danger/15 p-4 rounded-xl flex items-start gap-3 shadow-sm text-left">
            <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
            <p className="text-xs text-danger leading-relaxed font-semibold">{errorMessage}</p>
          </div>
        )}

        {/* Checkout Button Panel */}
        <div className="pt-2 pb-12">
          <button
            type="submit"
            disabled={isSubmitting || !isFormValid() || (orderType === 'dine_in' && !activeTable)}
            className={`w-full py-4 rounded-xl font-display font-medium text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 ${
              isSubmitting || !isFormValid() || (orderType === 'dine_in' && !activeTable)
                ? 'bg-border text-text-secondary/45 cursor-not-allowed shadow-none'
                : 'bg-espresso hover:bg-espresso-hover text-white'
            }`}
            id="checkout-submit-btn"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 text-caramel animate-spin" />
                <span>{t('checkout.preparingPayment')}</span>
              </>
            ) : (
              <>
                <span>{t('checkout.payWithQris')}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
