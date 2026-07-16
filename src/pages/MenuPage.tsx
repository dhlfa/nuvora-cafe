import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { Category, Menu, MenuDetailResponse, OptionGroup, MenuOption } from '../types';
import { useToast } from '../context/ToastContext';
import { useLocale } from '../context/LocaleContext';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { CategorySkeleton, MenuGridSkeleton, MenuCardSkeleton } from '../components/Skeletons';
import { Search, Sparkles, AlertTriangle, RefreshCw, Layers, X, Check } from 'lucide-react';

export const MenuPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showError, showInfo, showSuccess } = useToast();
  const { t, locale } = useLocale();
  const { reduceMotion } = useTheme();
  const { addToCart } = useCart();

  // URL State
  const searchFilter = searchParams.get('search') || '';
  const selectedMainCategoryId = (searchParams.get('category') || 'all').toLowerCase();
  const selectedSubcategoryId = (searchParams.get('subcategory') || 'all').toLowerCase();

  // API State
  const [categories, setCategories] = useState<Category[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Local state for search input inside page
  const [localSearch, setLocalSearch] = useState(searchFilter);
  const [loadingQuickAddId, setLoadingQuickAddId] = useState<string | null>(null);

  // Quick Options Modal State
  const [activeQuickAddMenu, setActiveQuickAddMenu] = useState<MenuDetailResponse | null>(null);
  const [activeQuickAddSelections, setActiveQuickAddSelections] = useState<Record<string, MenuOption[]>>({});

  useEffect(() => {
    setLocalSearch(searchFilter);
  }, [searchFilter]);

  // Debounced search sync to URL search params
  useEffect(() => {
    const handler = setTimeout(() => {
      const newParams = new URLSearchParams(searchParams);
      if (localSearch) {
        newParams.set('search', localSearch);
      } else {
        newParams.delete('search');
      }
      if (searchParams.get('search') !== localSearch) {
        setSearchParams(newParams);
      }
    }, 250);

    return () => {
      clearTimeout(handler);
    };
  }, [localSearch]);

  const loadMenuData = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const [catsRes, menusRes] = await Promise.all([
        apiService.getCategories(),
        apiService.getMenus()
      ]);

      setCategories(catsRes || []);
      setMenus(menusRes || []);
    } catch (err: any) {
      console.error(err);
      setHasError(true);
      setErrorMessage(err.message || 'Gagal memuat data menu.');
      showError(t('error.network'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMenuData();
  }, []);

  // Sync search URL param (debounced internally via useEffect)
  const handleSearchChange = (val: string) => {
    setLocalSearch(val);
  };

  // Filter categories and subcategories
  const handleCategorySelect = (catId: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('subcategory'); // Reset subcategory on category change
    if (catId.toLowerCase() === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', catId);
    }
    setSearchParams(newParams);
  };

  const handleSubcategorySelect = (subId: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (subId.toLowerCase() === 'all') {
      newParams.delete('subcategory');
    } else {
      newParams.set('subcategory', subId);
    }
    setSearchParams(newParams);
  };

  // Main Categories tabs
  const mainCategories = useMemo(() => {
    return categories.filter(c => 
      !c.parent_category_id || 
      String(c.category_type ?? '').toLowerCase() === 'main' ||
      ['cat-001', 'cat-002', 'cat-003'].includes(String(c.category_id ?? '').toLowerCase())
    );
  }, [categories]);

  // Subcategories active under the selected Category
  const activeSubcategories = useMemo(() => {
    if (selectedMainCategoryId === 'all') {
      return categories.filter(c => 
        c.parent_category_id && 
        String(c.category_type ?? '').toLowerCase() !== 'main'
      );
    }
    return categories.filter(c => 
      String(c.parent_category_id ?? '').toLowerCase() === selectedMainCategoryId
    );
  }, [categories, selectedMainCategoryId]);

  // All subcategory IDs for currently active main category (used to filter menus)
  const selectedSubcategoryIds = useMemo(() => {
    if (selectedMainCategoryId === 'all') {
      return categories.map(c => String(c.category_id ?? '').toLowerCase());
    }
    return categories
      .filter(category => String(category.parent_category_id ?? "").toLowerCase() === selectedMainCategoryId)
      .map(category => String(category.category_id ?? "").toLowerCase());
  }, [categories, selectedMainCategoryId]);

  // Filtered menu items
  const filteredMenus = useMemo(() => {
    const searchQuery = String(searchFilter ?? "").toLowerCase();

    return menus.filter(menu => {
      const menuCatId = String(menu.category_id ?? "").toLowerCase();
      
      const matchesSearch =
        !searchQuery ||
        String(menu.menu_name ?? "").toLowerCase().includes(searchQuery) ||
        String(menu.description ?? "").toLowerCase().includes(searchQuery);

      const matchesMainCategory =
        selectedMainCategoryId === "all" ||
        menuCatId === selectedMainCategoryId ||
        selectedSubcategoryIds.includes(menuCatId);

      const matchesSubcategory =
        selectedSubcategoryId === "all" ||
        menuCatId === selectedSubcategoryId;

      return matchesSearch && matchesMainCategory && matchesSubcategory;
    });
  }, [menus, selectedMainCategoryId, selectedSubcategoryId, selectedSubcategoryIds, searchFilter]);

  // Recommended menu list
  const recommendedMenus = useMemo(() => {
    return menus.filter(item => item.recommended === 'yes' || item.recommended === true || item.is_recommended === 'yes');
  }, [menus]);

  const getSubcategoryName = (menuCategoryId: string) => {
    const found = categories.find(c => c.category_id === menuCategoryId);
    return found ? found.category_name : '';
  };

  const getPlaceholderImage = (category_id: string, subcategory: string) => {
    const cat = category_id.toLowerCase();
    const sub = subcategory.toLowerCase();
    
    if (cat === 'cat-001' || sub.includes('nasi') || sub.includes('mie') || sub.includes('makanan') || sub.includes('food')) {
      return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400';
    }
    if (cat === 'cat-002' || sub.includes('coffee') || sub.includes('minuman') || sub.includes('tea') || sub.includes('drink')) {
      return 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=400';
    }
    return 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&q=80&w=400';
  };

  const formatIDRCurrency = (val: number) => {
    return new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleQuickAdd = async (item: Menu) => {
    if (loadingQuickAddId) return;
    setLoadingQuickAddId(item.id);
    try {
      const detail = await apiService.getMenuDetail(item.id);
      const optionGroups = detail.option_groups || [];
      const requiredGroups = optionGroups.filter(g => g.is_required === 'yes' || g.is_required === true);
      
      if (requiredGroups.length > 0) {
        // Prepare initial selections for required single-select groups
        const initialSelections: Record<string, MenuOption[]> = {};
        optionGroups.forEach((group) => {
          const isGroupRequired = group.is_required === true || group.is_required === 'yes';
          if (group.selection_type === 'single' && isGroupRequired && group.options?.length > 0) {
            initialSelections[group.option_group_id] = [group.options[0]];
          } else {
            initialSelections[group.option_group_id] = [];
          }
        });
        setActiveQuickAddSelections(initialSelections);
        setActiveQuickAddMenu(detail);
      } else {
        addToCart(item, 1, [], "");
        showSuccess(t('menu.quickAdded'));
      }
    } catch (err) {
      console.error('Quick add failed, fallback to navigate:', err);
      navigate(`/menu/${item.id}`);
    } finally {
      setLoadingQuickAddId(null);
    }
  };

  const handleQuickAddOptionSelect = (group: OptionGroup, option: MenuOption) => {
    const groupId = group.option_group_id;
    const currentSelections = activeQuickAddSelections[groupId] || [];

    if (group.selection_type === 'single') {
      setActiveQuickAddSelections(prev => ({
        ...prev,
        [groupId]: [option]
      }));
    } else {
      const exists = currentSelections.some(o => o.option_id === option.option_id);
      if (exists) {
        setActiveQuickAddSelections(prev => ({
          ...prev,
          [groupId]: currentSelections.filter(o => o.option_id !== option.option_id)
        }));
      } else {
        const maxSelect = Number(group.maximum_selection ?? 999);
        if (currentSelections.length >= maxSelect) {
          showError(locale === 'id' ? `Pilihan maksimum adalah ${maxSelect}` : `Maximum selections limit is ${maxSelect}`);
          return;
        }
        setActiveQuickAddSelections(prev => ({
          ...prev,
          [groupId]: [...currentSelections, option]
        }));
      }
    }
  };

  const handleConfirmQuickAdd = () => {
    if (!activeQuickAddMenu) return;

    // Validate required options
    const requiredGroups = activeQuickAddMenu.option_groups?.filter(g => g.is_required === 'yes' || g.is_required === true) || [];
    for (const group of requiredGroups) {
      const selections = activeQuickAddSelections[group.option_group_id] || [];
      if (selections.length === 0) {
        showError(locale === 'id' ? `Silakan pilih salah satu opsi untuk ${group.group_name}.` : `Please select an option for ${group.group_name}.`);
        return;
      }
    }

    // Format selected groups for addToCart
    const formattedGroups = Object.entries(activeQuickAddSelections)
      .filter(([_, options]) => options.length > 0)
      .map(([groupId, options]) => {
        const group = activeQuickAddMenu.option_groups?.find(g => g.option_group_id === groupId);
        return {
          group_id: groupId,
          group_name: group?.group_name || '',
          options
        };
      });

    addToCart(activeQuickAddMenu, 1, formattedGroups, "");
    showSuccess(t('menu.quickAdded'));
    setActiveQuickAddMenu(null);
  };

  return (
    <div className="space-y-10 pb-12 text-left">
      {/* Editorial Cafe Header & Banner */}
      {selectedMainCategoryId === 'all' && !searchFilter && (
        <div className="bg-surface text-text-primary rounded-2xl p-8 md:p-10 relative overflow-hidden border border-border">
          <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-cover bg-center opacity-10 hidden md:block" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&q=80&w=600')` }} />
          <div className="relative z-10 max-w-xl space-y-4">
            <span className="font-mono text-[9px] uppercase tracking-widest text-caramel bg-caramel/10 border border-caramel/20 px-3 py-1 rounded-full font-semibold">
              The Nuvora Craftsmanship
            </span>
            <h1 className="font-display font-medium text-3xl sm:text-4xl text-text-primary tracking-tight leading-none uppercase">
              Aesthetic Brews & Fresh Daily Kitchen.
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-md font-sans font-light">
              Each cup of coffee and culinary creation is prepared with strict precision by our artisan baristas and culinary team.
            </p>
          </div>
        </div>
      )}

      {/* Search Header and Input */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
          <h2 className="font-display text-2xl text-text-primary tracking-tight uppercase font-medium">
            Menu Nuvora
          </h2>
          <p className="text-xs text-text-secondary font-sans font-light">Explore our curated artisan selections</p>
        </div>
        
        <div className="relative">
          <input
            type="text"
            placeholder={t('menu.searchPlaceholder')}
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full bg-surface border border-border focus:border-caramel/60 focus:bg-surface-elevated px-5 py-3.5 pl-12 rounded-xl outline-none text-xs sm:text-sm transition-all shadow-sm font-sans"
            id="page-search-input"
          />
          <Search className="w-4.5 h-4.5 text-text-secondary absolute left-4.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Error State */}
      {hasError && (
        <div className="bg-surface border border-border p-8 rounded-2xl flex flex-col items-center gap-4 text-center">
          <AlertTriangle className="w-10 h-10 text-caramel" />
          <div className="space-y-2">
            <h4 className="font-display text-lg font-medium text-text-primary uppercase">Connection Interrupted</h4>
            <p className="text-xs text-text-secondary max-w-sm leading-relaxed font-sans">
              {errorMessage}. Please retry loading our menu using the reload trigger.
            </p>
          </div>
          <button
            onClick={loadMenuData}
            className="bg-espresso hover:bg-espresso-hover text-white text-xs font-semibold px-5 py-3 rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-sm"
            id="retry-menu-load-btn"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reload Menu
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="space-y-8">
          <CategorySkeleton />
          <div className="h-6 bg-border/40 w-36 rounded animate-pulse" />
          <MenuGridSkeleton />
        </div>
      ) : !hasError && (
        <>
          {/* Chef Recommendations Carousel */}
          {recommendedMenus.length > 0 && selectedMainCategoryId === 'all' && !searchFilter && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <Sparkles className="w-4 h-4 text-caramel fill-caramel" />
                <h3 className="font-display text-xs uppercase tracking-widest text-text-primary font-bold">
                  {t('menu.recommended')}
                </h3>
              </div>

              <div className="flex gap-6 overflow-x-auto pb-4 pt-1 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                {recommendedMenus.map((item) => (
                  <Link
                    key={item.id}
                    to={`/menu/${item.id}`}
                    className="w-60 flex-shrink-0 bg-surface rounded-2xl border border-border overflow-hidden hover:border-caramel/40 hover:shadow-sm transition-all flex flex-col group"
                    id={`recommended-card-${item.id}`}
                  >
                    <div className="w-full h-40 relative overflow-hidden">
                      <img
                        src={item.image_url || getPlaceholderImage(item.category_id, getSubcategoryName(item.category_id))}
                        alt={item.menu_name}
                        referrerPolicy="no-referrer"
                        className={`w-full h-full object-cover transition-transform duration-500 ${reduceMotion ? '' : 'group-hover:scale-103'}`}
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="absolute top-3 right-3 bg-surface/90 text-text-primary text-[9px] font-mono tracking-widest uppercase px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm border border-border">
                        <Sparkles className="w-3 h-3 text-caramel fill-caramel" />
                        <span>Artisan</span>
                      </div>
                    </div>
                    
                    <div className="p-4 flex-1 flex flex-col justify-between gap-3 text-left">
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase tracking-wider text-caramel font-mono font-semibold">
                          {getSubcategoryName(item.category_id) || 'Signature'}
                        </span>
                        <h4 className="font-display text-sm text-text-primary line-clamp-1 group-hover:text-caramel transition-colors font-semibold">
                          {item.menu_name}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex flex-col">
                          {item.discount_price ? (
                            <>
                              <span className="text-[10px] text-text-secondary line-through">
                                {formatIDRCurrency(item.price)}
                              </span>
                              <span className="font-semibold text-sm text-caramel">
                                {formatIDRCurrency(item.discount_price)}
                              </span>
                            </>
                          ) : (
                            <span className="font-semibold text-sm text-text-primary">
                              {formatIDRCurrency(item.price)}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] border border-border px-3 py-1.5 rounded-lg text-text-primary group-hover:bg-espresso group-hover:text-white group-hover:border-transparent transition-all font-semibold">
                          Detail
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Categories and Subcategories Navigation */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <Layers className="w-4 h-4 text-caramel" />
              <h3 className="font-display text-xs uppercase tracking-widest text-text-primary font-bold">
                {t('home.popularCategories')}
              </h3>
            </div>

            {/* Main Categories Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar py-0.5">
              <button
                onClick={() => handleCategorySelect('ALL')}
                className={`px-5 py-2.5 rounded-xl font-display text-xs tracking-wider transition-all flex-shrink-0 border uppercase font-medium ${
                  selectedMainCategoryId === 'all'
                    ? 'bg-espresso text-white border-espresso shadow-sm'
                    : 'bg-surface text-text-primary border-border hover:border-text-secondary'
                }`}
                id="cat-tab-all"
              >
                {t('menu.allCategories')}
              </button>
              {mainCategories.map((cat) => {
                const isActive = selectedMainCategoryId === String(cat.category_id ?? '').toLowerCase();
                return (
                  <button
                    key={cat.category_id}
                    onClick={() => handleCategorySelect(cat.category_id)}
                    className={`px-5 py-2.5 rounded-xl font-display text-xs tracking-wider transition-all flex-shrink-0 border uppercase font-medium ${
                      isActive
                        ? 'bg-espresso text-white border-espresso shadow-sm'
                        : 'bg-surface text-text-primary border-border hover:border-text-secondary'
                    }`}
                    id={`cat-tab-${cat.category_id}`}
                  >
                    {String(cat.category_name ?? "")}
                  </button>
                );
              })}
            </div>

            {/* Subcategories Filter Tabs */}
            {activeSubcategories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar py-0.5">
                <button
                  onClick={() => handleSubcategorySelect('ALL')}
                  className={`px-4 py-2 rounded-full font-sans text-[11px] font-semibold transition-all flex-shrink-0 border ${
                    selectedSubcategoryId === 'all'
                      ? 'bg-caramel text-white border-caramel shadow-sm'
                      : 'bg-surface text-text-secondary border-border hover:bg-background hover:text-text-primary'
                  }`}
                  id="subcat-tab-all"
                >
                  All Sub
                </button>
                {activeSubcategories.map((sub) => {
                  const isActive = selectedSubcategoryId === String(sub.category_id ?? '').toLowerCase();
                  return (
                    <button
                      key={sub.category_id}
                      onClick={() => handleSubcategorySelect(sub.category_id)}
                      className={`px-4 py-2 rounded-full font-sans text-[11px] font-semibold transition-all flex-shrink-0 border ${
                        isActive
                          ? 'bg-caramel text-white border-caramel shadow-sm'
                          : 'bg-surface text-text-secondary border-border hover:bg-background hover:text-text-primary'
                      }`}
                      id={`subcat-tab-${String(sub.category_id ?? '').toLowerCase()}`}
                    >
                      {String(sub.category_name ?? '')}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Menus Grid Area */}
          <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-display text-xs uppercase tracking-widest text-text-primary font-bold">
                Daftar Hidangan
              </h3>
              <span className="font-mono text-[10px] text-text-secondary bg-surface border border-border px-2.5 py-1 rounded-lg font-semibold">
                {filteredMenus.length} Items
              </span>
            </div>

            {/* Empty Menu State */}
            {filteredMenus.length === 0 ? (
              <div className="bg-surface border border-dashed border-border rounded-2xl py-16 px-6 text-center space-y-3">
                <p className="text-xs sm:text-sm font-medium text-text-secondary">{t('menu.noResults')}</p>
                <button
                  onClick={() => {
                    setSearchParams(new URLSearchParams());
                    setLocalSearch('');
                  }}
                  className="text-xs text-caramel font-semibold underline hover:text-caramel-hover"
                  id="reset-all-filters-btn"
                >
                  {t('menu.backToCategories')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredMenus.map((item) => {
                  const isOutOfStock = item.stock <= 0;
                  const itemSubName = getSubcategoryName(item.category_id);
                  return (
                    <div
                      key={item.id}
                      className="bg-surface border border-border rounded-[14px] overflow-hidden flex flex-col hover:border-caramel/20 transition-all duration-200 group p-2.5 text-left h-[260px] sm:h-[310px] justify-between"
                    >
                      {/* Image Frame */}
                      <div className="w-full aspect-[4/3] relative overflow-hidden rounded-lg">
                        <img
                          src={item.image_url || getPlaceholderImage(item.category_id, itemSubName)}
                          alt={item.menu_name}
                          referrerPolicy="no-referrer"
                          className={`w-full h-full object-cover transition-transform duration-500 ${reduceMotion ? '' : 'group-hover:scale-102'} ${
                            isOutOfStock ? 'grayscale opacity-50' : ''
                          }`}
                          loading="lazy"
                          decoding="async"
                        />
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-espresso/40 flex items-center justify-center">
                            <span className="bg-danger text-white font-mono text-[8px] sm:text-[9px] tracking-wider px-2 py-1 rounded-full uppercase font-bold">
                              {t('menu.outOfStock')}
                            </span>
                          </div>
                        )}
                        {(item.recommended === 'yes' || item.is_recommended === 'yes') && !isOutOfStock && (
                          <div className="absolute top-2 left-2 bg-caramel text-white px-2 py-0.5 rounded flex items-center gap-0.5 shadow-sm font-display text-[8px] sm:text-[9px] uppercase tracking-wider font-semibold">
                            <Sparkles className="w-2.5 h-2.5 fill-white text-white" />
                            <span>Favorit</span>
                          </div>
                        )}
                      </div>

                      {/* Card Info */}
                      <div className="pt-2 flex-1 flex flex-col justify-between gap-1.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] uppercase tracking-wider text-caramel font-mono font-bold bg-caramel/5 px-1.5 py-0.5 rounded border border-caramel/10">
                              {itemSubName || 'Menu'}
                            </span>
                            {item.stock > 0 && item.stock <= 3 && (
                              <span className="text-[8px] sm:text-[9px] bg-warning/10 text-warning border border-warning/20 font-semibold px-1.5 py-0.5 rounded font-mono">
                                {t('menu.remainingStock', { stock: item.stock })}
                              </span>
                            )}
                          </div>
                          <h4 className="font-display text-xs sm:text-sm text-text-primary leading-snug line-clamp-2 group-hover:text-caramel transition-colors font-medium">
                            {item.menu_name}
                          </h4>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t border-border/30">
                          <div className="flex flex-col">
                            {item.discount_price ? (
                              <div className="flex flex-col">
                                <span className="text-[8px] sm:text-[10px] text-text-secondary line-through leading-none">
                                  {formatIDRCurrency(item.price)}
                                </span>
                                <span className="font-semibold text-xs sm:text-sm text-caramel leading-tight">
                                  {formatIDRCurrency(item.discount_price)}
                                </span>
                              </div>
                            ) : (
                              <span className="font-semibold text-xs sm:text-sm text-text-primary leading-tight">
                                {formatIDRCurrency(item.price)}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => handleQuickAdd(item)}
                            disabled={isOutOfStock}
                            className={`p-1 px-2.5 sm:px-3 sm:py-1.5 rounded-lg font-sans font-bold text-xs flex items-center justify-center transition-all active:scale-95 ${
                              isOutOfStock
                                ? 'bg-border text-text-secondary/50 cursor-not-allowed shadow-none'
                                : 'bg-espresso hover:bg-caramel text-white'
                            }`}
                            id={`menu-add-btn-${item.id}`}
                            title="Pilih Menu"
                          >
                            {loadingQuickAddId === item.id ? (
                              <span className="w-3.5 h-3.5 border-2 border-white/35 border-t-white rounded-full animate-spin"></span>
                            ) : (
                              <>
                                <span className="mr-0.5">{t('menu.choose')}</span>
                                <span className="text-sm font-bold sm:text-xs leading-none">+</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
