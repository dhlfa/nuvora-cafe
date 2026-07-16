import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { MenuDetailResponse, OptionGroup, MenuOption } from '../types';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import { MenuDetailSkeleton } from '../components/Skeletons';
import { formatCurrency } from '../utils/format';
import { ArrowLeft, Plus, Minus, ShoppingBag, MessageSquare, Check, Sparkles, HelpCircle } from 'lucide-react';

export const MenuDetailPage: React.FC = () => {
  const { menuId } = useParams<{ menuId: string }>();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const { addToCart } = useCart();

  const [menu, setMenu] = useState<MenuDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');

  // Selected options state: { [groupId: string]: MenuOption[] }
  const [selectedOptions, setSelectedOptions] = useState<Record<string, MenuOption[]>>({});

  useEffect(() => {
    if (!menuId) return;

    const loadMenuDetail = async () => {
      setIsLoading(true);
      setHasError(false);
      try {
        const data = await apiService.getMenuDetail(menuId);
        if (data) {
          // Log complete response to browser console as requested by user
          console.log('--- Menu Detail API Loaded in Component ---', data);
          setMenu(data);
          
          // Pre-populate default single selections if they are required and have 1 option
          const initialSelections: Record<string, MenuOption[]> = {};
          data.option_groups?.forEach((group) => {
            const isGroupRequired = group.is_required === true || group.is_required === 'yes';
            if (group.selection_type === 'single' && isGroupRequired && group.options?.length > 0) {
              // Pre-select the first option by default
              initialSelections[group.option_group_id] = [group.options[0]];
            } else {
              initialSelections[group.option_group_id] = [];
            }
          });
          setSelectedOptions(initialSelections);
        } else {
          setHasError(true);
          showError('Menu tidak ditemukan.');
        }
      } catch (err: any) {
        console.error(err);
        setHasError(true);
        showError(err.message || 'Gagal memuat detail menu.');
      } finally {
        setIsLoading(false);
      }
    };

    loadMenuDetail();
  }, [menuId, showError]);

  // Adjust quantity
  const handleQuantityChange = (delta: number) => {
    const newQty = quantity + delta;
    if (newQty >= 1) {
      setQuantity(newQty);
    }
  };

  // Option selection handler
  const handleOptionSelect = (group: OptionGroup, option: MenuOption) => {
    const groupId = group.option_group_id;
    const currentSelections = selectedOptions[groupId] || [];

    if (group.selection_type === 'single') {
      // Single selection (Radio button behavior)
      setSelectedOptions((prev) => ({
        ...prev,
        [groupId]: [option],
      }));
    } else {
      // Multiple selection (Checkbox behavior)
      const exists = currentSelections.some((o) => o.option_id === option.option_id);
      
      if (exists) {
        // Remove option
        setSelectedOptions((prev) => ({
          ...prev,
          [groupId]: currentSelections.filter((o) => o.option_id !== option.option_id),
        }));
      } else {
        // Check maximum selection limit
        const maxSelect = Number(group.maximum_selection ?? 999);
        if (currentSelections.length >= maxSelect) {
          showError(`Pilihan maksimum untuk ${group.group_name} adalah ${maxSelect}.`);
          return;
        }

        // Add option
        setSelectedOptions((prev) => ({
          ...prev,
          [groupId]: [...currentSelections, option],
        }));
      }
    }
  };

  // Validate if all requirements are satisfied
  const groupValidations = useMemo(() => {
    if (!menu || !menu.option_groups) return { isValid: true, errors: {} as Record<string, string> };

    const errors: Record<string, string> = {};
    let isValid = true;

    menu.option_groups.forEach((group) => {
      const selections = selectedOptions[group.option_group_id] || [];
      const isRequired = group.is_required === true || group.is_required === 'yes';
      const minSelect = Number(group.minimum_selection ?? (isRequired ? 1 : 0));
      const maxSelect = Number(group.maximum_selection ?? 999);

      if (selections.length < minSelect) {
        errors[group.option_group_id] = `Silakan pilih minimal ${minSelect} pilihan.`;
        isValid = false;
      } else if (selections.length > maxSelect) {
        errors[group.option_group_id] = `Maksimal pilihan adalah ${maxSelect}.`;
        isValid = false;
      }
    });

    return { isValid, errors };
  }, [menu, selectedOptions]);

  // Realtime calculation of total price
  const totals = useMemo(() => {
    if (!menu || !menu.menu) return { base: 0, options: 0, total: 0 };

    const basePrice = Number(menu.menu.final_price ?? menu.menu.price ?? 0);
    
    // Sum of selected options using Number(opt.additional_price ?? 0) to prevent NaN
    let optionsSum = 0;
    const selectionsArray = Object.values(selectedOptions) as MenuOption[][];
    selectionsArray.forEach((selections) => {
      if (Array.isArray(selections)) {
        selections.forEach((opt) => {
          optionsSum += Number(opt.additional_price ?? 0);
        });
      }
    });

    return {
      base: basePrice,
      options: optionsSum,
      total: (basePrice + optionsSum) * quantity,
    };
  }, [menu, selectedOptions, quantity]);

  // Add to Cart handler
  const handleAddToCart = () => {
    if (!menu || !menu.menu) return;

    if (!groupValidations.isValid) {
      showError('Harap lengkapi pilihan wajib terlebih dahulu.');
      return;
    }

    // Format options as CartItem options structure
    const selectedGroupsForCart = menu.option_groups
      .map((g) => ({
        group_id: g.option_group_id,
        group_name: g.group_name,
        options: selectedOptions[g.option_group_id] || [],
      }))
      .filter((g) => g.options.length > 0);

    const menuToCart: any = {
      id: menu.menu.menu_id,
      menu_id: menu.menu.menu_id,
      menu_name: menu.menu.menu_name,
      category_id: menu.menu.category_id || '',
      image_url: menu.menu.image_url || '',
      price: menu.menu.price || menu.menu.final_price || 0,
      final_price: menu.menu.final_price || 0,
      discount_price: menu.menu.discount_price || 0,
      stock: menu.menu.stock || 0,
      is_available: menu.menu.is_available !== false,
      subcategory: menu.menu.subcategory || '',
    };

    addToCart(menuToCart, quantity, selectedGroupsForCart, note);
    showSuccess(`${menu.menu.menu_name} ditambahkan ke keranjang`);
    navigate('/menu');
  };

  if (isLoading) {
    return <MenuDetailSkeleton />;
  }

  if (hasError || !menu) {
    return (
      <div className="py-16 text-center space-y-4 max-w-sm mx-auto">
        <div className="text-caramel font-display text-lg font-medium">Detail Hidangan Terkendala</div>
        <p className="text-xs text-muted">Gagal mengambil info menu, silakan kembali ke halaman utama.</p>
        <button
          onClick={() => navigate('/menu')}
          className="w-full bg-espresso text-ivory py-3 rounded-xl text-xs font-semibold hover:bg-espresso-dark transition-all"
        >
          Kembali ke Katalog Menu
        </button>
      </div>
    );
  }

  const getPlaceholderImage = (category_id?: string, subcategory?: string) => {
    const cat = String(category_id ?? "").toLowerCase();
    const sub = String(subcategory ?? "").toLowerCase();
    
    if (cat === 'cat-001' || sub.includes('nasi') || sub.includes('mie') || sub.includes('makanan')) {
      return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400';
    }
    if (cat === 'cat-002' || sub.includes('coffee') || sub.includes('minuman') || sub.includes('tea')) {
      return 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=400';
    }
    return 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&q=80&w=400';
  };

  const isOutOfStock = menu.menu ? menu.menu.stock <= 0 : true;

  return (
    <div className="space-y-8 pb-32 max-w-3xl mx-auto">
      {/* Header Bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="bg-ivory/50 border border-line p-2 rounded-xl text-espresso hover:bg-ivory hover:text-caramel transition-colors"
          id="detail-back-btn"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-display font-medium text-lg uppercase tracking-tight text-espresso">Detail Hidangan</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left Side: Image */}
        <div className="space-y-4">
          <div className="w-full aspect-[4/3] bg-ivory/40 rounded-2xl overflow-hidden relative border border-line/50 shadow-sm">
            <img
              src={menu.menu.image_url || getPlaceholderImage(menu.menu.category_id, menu.menu.subcategory)}
              alt={menu.menu.menu_name}
              referrerPolicy="no-referrer"
              className={`w-full h-full object-cover ${isOutOfStock ? 'grayscale opacity-70' : ''}`}
            />
            {(menu.menu.recommended === 'yes' || menu.menu.recommended === true) && (
              <div className="absolute top-4 right-4 bg-caramel text-ivory text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 fill-ivory text-ivory animate-pulse" />
                <span>Rekomendasi</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Description & Note */}
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-caramel uppercase tracking-widest bg-caramel/10 border border-caramel/20 px-2.5 py-1 rounded-lg">
                {menu.menu.subcategory || 'Artisan Drink'}
              </span>
              {menu.menu.stock > 0 ? (
                <span className="text-xs text-muted font-mono">
                  Sisa {menu.menu.stock} porsi
                </span>
              ) : (
                <span className="text-xs bg-red-50 text-red-700 border border-red-200/50 font-semibold px-2.5 py-1 rounded-lg uppercase">
                  Habis
                </span>
              )}
            </div>

            <div className="space-y-1">
              <h1 className="font-display font-medium text-3xl text-espresso leading-none">{menu.menu.menu_name}</h1>
              <div className="flex items-baseline gap-2 pt-1">
                {menu.menu.discount_price ? (
                  <>
                    <span className="font-display text-2xl text-caramel">
                      {formatCurrency(menu.menu.discount_price)}
                    </span>
                    <span className="text-sm text-muted line-through">
                      {formatCurrency(menu.menu.price)}
                    </span>
                  </>
                ) : (
                  <span className="font-display text-2xl text-espresso">
                    {formatCurrency(menu.menu.price)}
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs leading-relaxed text-muted font-sans border-t border-line/40 pt-3">{menu.menu.description || 'Disiapkan segar oleh tim kuliner Nuvora dengan bahan-bahan bersertifikasi premium.'}</p>
          </div>

          {/* Notes Input */}
          <div className="bg-ivory/50 border border-line/80 p-5 rounded-2xl space-y-3 shadow-sm">
            <div className="flex items-center gap-2 text-espresso font-display font-semibold text-xs uppercase tracking-wider">
              <MessageSquare className="w-4 h-4 text-caramel" />
              <span>Instruksi Khusus (Opsional)</span>
            </div>
            <textarea
              placeholder="Contoh: Kurang manis, tanpa gula, es pisah..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-white border border-line focus:border-caramel/50 rounded-xl p-3 text-xs outline-none resize-none h-18 transition-all"
              maxLength={150}
              id="item-note-textarea"
            />
            <div className="text-[10px] text-muted text-right font-mono">
              {note.length}/150 karakter
            </div>
          </div>
        </div>
      </div>

      {/* Customizable Ingredients and Option Groups */}
      {(!menu.option_groups || menu.option_groups.length === 0 || menu.option_groups.every(g => !g.options || g.options.length === 0)) ? (
        <div className="bg-ivory/30 border border-dashed border-line rounded-2xl p-8 text-center max-w-xl mx-auto">
          <p className="text-xs text-muted font-medium">Hidangan ini tidak memerlukan kustomisasi tambahan.</p>
        </div>
      ) : (
        <div className="space-y-6 pt-4 border-t border-line/50">
          <h2 className="font-display text-lg uppercase tracking-tight text-espresso">Kustomisasi Minuman / Makanan</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {menu.option_groups.map((group) => {
              // Do not render empty option groups
              if (!group.options || group.options.length === 0) return null;

              const selected = selectedOptions[group.option_group_id] || [];
              const isGroupRequired = group.is_required === true || group.is_required === 'yes';
              const error = groupValidations.errors[group.option_group_id];

              return (
                <div
                  key={group.option_group_id}
                  className="bg-ivory/30 border border-line rounded-2xl p-5 space-y-4 shadow-sm"
                >
                  {/* Group Header */}
                  <div className="flex items-center justify-between border-b border-line/40 pb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-sm uppercase tracking-wide text-espresso font-semibold">
                        {group.group_name}
                      </h3>
                      {isGroupRequired && (
                        <span className="text-[9px] bg-caramel/10 border border-caramel/30 text-caramel font-semibold px-2 py-0.5 rounded uppercase font-mono">
                          Wajib
                        </span>
                      )}
                    </div>
                    
                    <span className="text-[10px] text-muted uppercase font-mono tracking-wider">
                      {group.selection_type === 'single' ? 'Radio' : 'Multi'}
                    </span>
                  </div>

                  {/* Options List */}
                  <div className="space-y-2">
                    {group.options.map((option) => {
                      const isChecked = selected.some((o) => o.option_id === option.option_id);
                      const optPrice = Number(option.additional_price ?? 0);
                      
                      return (
                        <button
                          key={option.option_id}
                          onClick={() => handleOptionSelect(group, option)}
                          disabled={isOutOfStock}
                          className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                            isChecked
                              ? 'bg-espresso/5 border-caramel/40 text-espresso'
                              : 'bg-white border-line hover:border-caramel/20 text-charcoal/80'
                          }`}
                          id={`option-${group.option_group_id}-${option.option_id}`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-4 h-4 flex items-center justify-center border transition-all ${
                                group.selection_type === 'single'
                                  ? 'rounded-full'
                                  : 'rounded'
                              } ${
                                isChecked
                                  ? 'bg-caramel border-caramel text-ivory'
                                  : 'bg-white border-muted/30'
                              }`}
                            >
                              {isChecked && <Check className="w-2.5 h-2.5 stroke-[4.5]" />}
                            </div>
                            <span className="text-xs font-medium font-sans">{option.option_name}</span>
                          </div>

                          {optPrice > 0 && (
                            <span className="text-xs font-bold text-caramel">
                              +{formatCurrency(optPrice)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Validation Help Message */}
                  {error && (
                    <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1.5 pt-1 animate-pulse">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>{error}</span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Sticky Bottom Bar for Desktop & Mobile viewports */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-line py-4 px-6 flex justify-center shadow-xl">
        <div className="w-full max-w-3xl flex items-center justify-between gap-6">
          
          {/* Quantity selector */}
          <div className="flex items-center gap-1 bg-ivory/50 border border-line rounded-xl p-1.5">
            <button
              onClick={() => handleQuantityChange(-1)}
              disabled={isOutOfStock || quantity <= 1}
              className="w-8 h-8 bg-white border border-line rounded-lg text-espresso flex items-center justify-center transition-all disabled:opacity-40 disabled:pointer-events-none hover:border-caramel/40"
              id="detail-qty-minus"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-display text-sm font-semibold text-espresso">
              {quantity}
            </span>
            <button
              onClick={() => handleQuantityChange(1)}
              disabled={isOutOfStock || quantity >= menu.menu.stock}
              className="w-8 h-8 bg-white border border-line rounded-lg text-espresso flex items-center justify-center transition-all disabled:opacity-40 disabled:pointer-events-none hover:border-caramel/40"
              id="detail-qty-plus"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Pricing & Cart Action */}
          <div className="flex-1 flex items-center justify-end gap-6">
            <div className="flex flex-col text-right">
              <span className="text-[9px] uppercase tracking-widest text-muted font-mono font-bold leading-none">Total</span>
              <span className="font-display text-xl text-espresso font-semibold leading-tight pt-1">
                {formatCurrency(totals.total)}
              </span>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || !groupValidations.isValid}
              className={`px-8 py-3.5 rounded-xl font-display text-xs uppercase tracking-wider font-semibold flex items-center gap-2 shadow-sm transition-all active:scale-95 ${
                isOutOfStock || !groupValidations.isValid
                  ? 'bg-line/60 text-muted/40 cursor-not-allowed border border-line'
                  : 'bg-caramel hover:bg-caramel-dark text-ivory'
              }`}
              id="detail-add-to-cart-btn"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Tambah</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
