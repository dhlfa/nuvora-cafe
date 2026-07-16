import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useTable } from '../context/TableContext';
import { useToast } from '../context/ToastContext';
import { useLocale } from '../context/LocaleContext';
import { ShoppingBag, ArrowLeft, Trash2, Plus, Minus, CreditCard, MessageSquare, AlertCircle, Utensils, Truck } from 'lucide-react';

export const CartPage: React.FC = () => {
  const { cart, updateQuantity, removeFromCart, clearCart, cartSubtotal, cartOptionsTotal, cartTotal, updateCartItem } = useCart();
  const { activeTable, setTable, orderType, setOrderType, isLockedToDineIn } = useTable();
  const { showError, showInfo, showSuccess } = useToast();
  const { t, locale } = useLocale();
  const navigate = useNavigate();

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState('');

  const formatCurrencyValue = (val: number) => {
    return new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleSaveNote = (itemId: string, noteText: string) => {
    const item = cart.find(i => i.id === itemId);
    if (item) {
      updateCartItem(itemId, item.quantity, item.selected_options, noteText);
      showSuccess(t('settings.clearCartSuccess') ? 'Catatan disimpan.' : 'Note saved.');
    }
  };

  const handleCheckoutRedirect = () => {
    if (orderType === 'dine_in' && !activeTable) {
      showError(t('error.invalidTable'));
      return;
    }
    navigate('/checkout');
  };

  const confirmClearCart = () => {
    clearCart();
    showInfo(t('settings.clearCartSuccess'));
  };

  const tax = Math.round(cartTotal * 0.1);
  const deliveryFee = orderType === 'delivery' ? 5000 : 0;
  const grandTotal = cartTotal + tax + deliveryFee;

  return (
    <div className="space-y-6 pb-32 max-w-2xl mx-auto text-left">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/menu')}
            className="border border-border p-2 rounded-xl text-text-primary hover:bg-surface hover:text-caramel transition-colors active:scale-95"
            id="cart-back-btn"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-display font-medium text-xl uppercase tracking-tight text-text-primary">{t('cart.title')}</span>
        </div>
        
        {cart.length > 0 && (
          <button
            onClick={confirmClearCart}
            className="text-xs font-semibold text-danger hover:bg-danger/10 border border-danger/15 px-3.5 py-2 rounded-xl transition-all active:scale-95"
            id="cart-clear-btn"
          >
            {t('cart.clearCart')}
          </button>
        )}
      </div>

      {/* Mode Selector Option */}
      {cart.length > 0 && (
        <div className="bg-surface border border-border p-4 rounded-2xl space-y-3">
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-secondary font-bold block">
            {t('checkout.paymentMethod') /* Mode order */}
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setOrderType('dine_in');
                if (!activeTable) {
                  setTable({
                    table_number: 1,
                    table_id: 'TBL-001',
                    tableId: 'TBL-001',
                    tableName: 'Meja 1',
                    token: 'NUVORA-MEJA-1-A1B2'
                  });
                }
              }}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all active:scale-95 ${
                orderType === 'dine_in'
                  ? 'bg-caramel/10 border-caramel text-caramel'
                  : 'bg-background border-border text-text-secondary hover:border-text-secondary/50'
              }`}
            >
              <Utensils className="w-4 h-4" />
              <span>{t('order.dineIn')}</span>
            </button>
            <button
              onClick={() => setOrderType('delivery')}
              disabled={isLockedToDineIn}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all active:scale-95 ${
                orderType === 'delivery'
                  ? 'bg-caramel/10 border-caramel text-caramel'
                  : 'bg-background border-border text-text-secondary hover:border-text-secondary/50'
              } ${isLockedToDineIn ? 'opacity-40 cursor-not-allowed' : ''}`}
              title={isLockedToDineIn ? 'Terkunci ke dine-in (dari QR meja)' : ''}
            >
              <Truck className="w-4 h-4" />
              <span>{t('order.delivery')}</span>
            </button>
          </div>

          {orderType === 'dine_in' && !isLockedToDineIn && (
            <div className="bg-background/50 p-3 rounded-xl border border-border/60">
              <span className="text-[9px] text-text-secondary uppercase font-bold tracking-wider font-mono block mb-1.5 text-center">
                Silakan Pilih Nomor Meja Anda:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((num) => {
                  const tid = `TBL-00${num}`;
                  const isSelected = activeTable?.table_id === tid;
                  return (
                    <button
                      key={num}
                      onClick={() => {
                        setTable({
                          table_number: num,
                          table_id: tid,
                          tableId: tid,
                          tableName: `Meja ${num}`,
                          token: num === 1 ? 'NUVORA-MEJA-1-A1B2' : num === 2 ? 'NUVORA-MEJA-2-B2C3' : 'NUVORA-MEJA-3-C3D4'
                        });
                        showSuccess(locale === 'id' ? `Terhubung ke Meja ${num}` : `Connected to Table ${num}`);
                      }}
                      className={`py-2 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                        isSelected
                          ? 'bg-caramel text-white shadow-sm'
                          : 'bg-surface border border-border text-text-secondary hover:border-text-secondary/30'
                      }`}
                    >
                      Meja {num}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {isLockedToDineIn && (
            <p className="text-[10px] text-text-secondary/70 italic font-light font-sans">
              * Mode otomatis terkunci ke Makan di Café karena Anda memindai QR Meja {activeTable?.table_number}.
            </p>
          )}
        </div>
      )}

      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
          <div className="w-16 h-16 bg-surface border border-border rounded-full flex items-center justify-center shadow-sm">
            <ShoppingBag className="w-7 h-7 text-text-secondary/40" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-display text-base text-text-primary uppercase tracking-wide font-medium">{t('cart.empty')}</h3>
            <p className="text-xs text-text-secondary max-w-xs leading-relaxed font-sans font-light">
              {t('cart.emptyDesc')}
            </p>
          </div>
          <Link
            to="/menu"
            className="bg-espresso hover:bg-espresso-hover text-white text-xs font-semibold px-6 py-3.5 rounded-xl shadow-sm transition-all active:scale-95 uppercase tracking-widest font-mono"
            id="cart-empty-back-menu"
          >
            {t('orders.viewMenuBtn')}
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Table warning for dine-in */}
          {orderType === 'dine_in' && !activeTable && (
            <div className="bg-warning/10 border border-warning/20 p-5 rounded-2xl flex items-start gap-3 shadow-sm text-left">
              <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <h4 className="font-semibold text-xs text-text-primary uppercase tracking-wider">{t('checkout.tableRequired')}</h4>
                <p className="text-xs text-text-secondary leading-relaxed font-sans font-light">
                  {t('checkout.tableRequiredDesc')}
                </p>
                <Link
                  to="/"
                  className="text-xs text-caramel font-bold underline hover:text-caramel-hover block font-sans"
                  id="cart-select-table-now"
                >
                  {t('profile.connectPrompt')} &rarr;
                </Link>
              </div>
            </div>
          )}

          {/* List of items */}
          <div className="space-y-4">
            {cart.map((item) => {
              const basePrice = Number(item.base_price ?? 0);
              const itemTotalValue = Number(item.item_total ?? 0);

              return (
                <div
                  key={item.id}
                  className="bg-surface border border-border rounded-2xl p-4 flex gap-4 hover:border-caramel/20 transition-all shadow-sm"
                >
                  {/* Item Image */}
                  {item.image_url && (
                    <div className="w-20 h-20 rounded-xl bg-background overflow-hidden flex-shrink-0 border border-border aspect-square">
                      <img
                        src={item.image_url}
                        alt={item.menu_name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Item Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-3">
                        <h4 className="font-display font-medium text-sm text-text-primary leading-tight">
                          {item.menu_name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-text-secondary/60 hover:text-danger p-1 transition-colors rounded-lg hover:bg-danger/10"
                          title="Hapus"
                          id={`cart-delete-${item.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Options display with correct field mapping */}
                      {item.selected_options && item.selected_options.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {item.selected_options.map((g) => 
                            g.options.map((opt) => {
                              const nameLabel = opt.option_name ?? opt.name ?? 'Pilihan';
                              const addPrice = Number(opt.additional_price ?? opt.price ?? 0);
                              return (
                                <span
                                  key={opt.option_id ?? opt.id}
                                  className="text-[9px] bg-background border border-border text-text-secondary font-semibold px-2 py-0.5 rounded font-sans"
                                >
                                  {nameLabel} {addPrice > 0 ? `(+${formatCurrencyValue(addPrice)})` : ''}
                                </span>
                              );
                            })
                          )}
                        </div>
                      )}

                      {/* Inline Note display & editor */}
                      {editingNoteId === item.id ? (
                        <div className="space-y-2 mt-2 pt-2 border-t border-border/40">
                          <input
                            type="text"
                            value={tempNoteText}
                            onChange={(e) => setTempNoteText(e.target.value)}
                            className="w-full bg-background border border-border text-xs px-3 py-2 rounded-xl focus:border-caramel outline-none font-sans"
                            placeholder={t('cart.notePlaceholder')}
                            maxLength={120}
                            autoFocus
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setEditingNoteId(null)}
                              className="text-[10px] bg-surface border border-border px-3 py-1.5 rounded-lg font-semibold hover:bg-background transition-all text-text-secondary active:scale-95"
                            >
                              {t('settings.appearance') === 'light' ? 'Batal' : 'Cancel'}
                            </button>
                            <button
                              onClick={() => {
                                handleSaveNote(item.id, tempNoteText);
                                setEditingNoteId(null);
                              }}
                              className="text-[10px] bg-caramel text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-caramel-hover transition-all active:scale-95"
                            >
                              Simpan
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mt-1">
                          {item.item_note ? (
                            <div className="flex items-start justify-between w-full bg-background border border-border/40 p-2 rounded-xl text-[10px] text-text-secondary font-sans font-light">
                              <div className="flex items-start gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5 text-caramel flex-shrink-0 mt-0.5" />
                                <span>{item.item_note}</span>
                              </div>
                              <button
                                onClick={() => {
                                  setEditingNoteId(item.id);
                                  setTempNoteText(item.item_note);
                                }}
                                className="text-caramel hover:underline font-semibold ml-2 flex-shrink-0 font-sans"
                              >
                                {t('order.editNote')}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingNoteId(item.id);
                                setTempNoteText('');
                              }}
                              className="text-[10px] text-caramel hover:text-caramel-hover font-semibold flex items-center gap-1 font-sans"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>+ {t('order.addNote')}</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Quantity selector and final cost */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/30 mt-3">
                      <span className="font-semibold text-xs text-caramel font-mono">
                        {formatCurrencyValue(itemTotalValue)}
                      </span>

                      {/* Quantity editor */}
                      <div className="flex items-center gap-1 bg-background border border-border rounded-lg p-0.5">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-6.5 h-6.5 bg-surface rounded border border-border flex items-center justify-center text-text-primary hover:border-caramel/30 transition-all active:scale-95"
                          id={`cart-qty-minus-${item.id}`}
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="w-6 text-center font-display text-xs font-semibold text-text-primary">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-6.5 h-6.5 bg-surface rounded border border-border flex items-center justify-center text-text-primary hover:border-caramel/30 transition-all active:scale-95"
                          id={`cart-qty-plus-${item.id}`}
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bill Summary Card */}
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-3 shadow-sm text-left">
            <h3 className="font-display text-xs uppercase tracking-wider text-text-primary font-bold pb-2.5 border-b border-border">
              Rincian Tagihan
            </h3>
            
            <div className="flex justify-between text-xs text-text-secondary font-sans font-light">
              <span>Total Menu</span>
              <span className="font-semibold text-text-primary">{formatCurrencyValue(cartSubtotal)}</span>
            </div>
            
            {cartOptionsTotal > 0 && (
              <div className="flex justify-between text-xs text-text-secondary font-sans font-light">
                <span>Pilihan Tambahan</span>
                <span className="font-semibold text-text-primary">{formatCurrencyValue(cartOptionsTotal)}</span>
              </div>
            )}

            {orderType === 'delivery' && (
              <div className="flex justify-between text-xs text-text-secondary font-sans font-light">
                <span>Biaya Pengiriman</span>
                <span className="font-semibold text-text-primary">{formatCurrencyValue(deliveryFee)}</span>
              </div>
            )}

            <div className="flex justify-between text-xs text-text-secondary font-sans font-light">
              <span>Pajak (PB1 10%)</span>
              <span className="font-semibold text-text-primary">{formatCurrencyValue(tax)}</span>
            </div>

            <div className="pt-3 border-t border-border flex justify-between text-sm font-display text-text-primary">
              <span className="uppercase tracking-wider font-semibold">Total Pembayaran</span>
              <span className="text-caramel font-bold text-base">{formatCurrencyValue(grandTotal)}</span>
            </div>
          </div>

          {/* Bottom Sticky Action Bar */}
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 border-t border-border py-4 px-6 flex justify-center shadow-lg">
            <div className="w-full max-w-2xl flex items-center justify-between gap-6">
              <div className="flex flex-col text-left">
                <span className="text-[9px] uppercase tracking-wider text-text-secondary font-mono leading-none">Total Tagihan</span>
                <span className="font-display text-lg text-caramel font-bold leading-tight pt-1">
                  {formatCurrencyValue(grandTotal)}
                </span>
              </div>

              <button
                onClick={handleCheckoutRedirect}
                disabled={orderType === 'dine_in' && !activeTable}
                className={`bg-espresso hover:bg-espresso-hover text-white px-6 py-3.5 rounded-xl font-display text-xs uppercase tracking-widest font-semibold flex items-center gap-2 shadow-sm transition-all active:scale-95 ${
                  orderType === 'dine_in' && !activeTable ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                id="cart-checkout-btn"
              >
                <CreditCard className="w-4 h-4 text-caramel" />
                <span>{t('cart.checkout')}</span>
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
