import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Coffee, ShoppingBag, ClipboardList, User, Search, MapPin, Settings } from 'lucide-react';
import { useTable } from '../context/TableContext';
import { useCart } from '../context/CartContext';
import { useLocale } from '../context/LocaleContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { activeTable } = useTable();
  const { cartItemsCount, cartTotal } = useCart();
  const { t, locale } = useLocale();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/menu?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/order';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col relative transition-colors duration-200">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-surface border-b border-border text-text-primary">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Desktop Nav Links */}
          <div className="flex items-center justify-between md:justify-start gap-8 w-full md:w-auto">
            {/* Logo */}
            <Link to="/" className="flex flex-col group flex-shrink-0">
              <span className="font-display text-2xl tracking-tight text-caramel group-hover:text-caramel-hover transition-colors leading-none font-semibold">
                NUVORA
              </span>
              <span className="text-[9px] uppercase tracking-widest text-text-secondary mt-0.5 font-mono">
                Café
              </span>
            </Link>

            {/* Navigation links (Desktop only) */}
            <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-medium font-sans text-text-secondary">
              <Link to="/" className={`hover:text-caramel transition-colors ${isActive('/') && !location.pathname.startsWith('/menu') ? 'text-caramel font-semibold' : ''}`}>
                {t('nav.home')}
              </Link>
              <Link to="/menu" className={`hover:text-caramel transition-colors ${isActive('/menu') ? 'text-caramel font-semibold' : ''}`}>
                {t('nav.menu')}
              </Link>
              <button 
                onClick={() => {
                  if (location.pathname !== '/') {
                    navigate('/?scroll=about');
                  } else {
                    document.getElementById('about-nuvora')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }} 
                className="hover:text-caramel transition-colors cursor-pointer font-medium"
              >
                {t('nav.about')}
              </button>
              <button 
                onClick={() => {
                  if (location.pathname !== '/') {
                    navigate('/?scroll=hours');
                  } else {
                    document.getElementById('opening-hours')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }} 
                className="hover:text-caramel transition-colors cursor-pointer font-medium"
              >
                {t('nav.contact')}
              </button>
            </nav>

            {/* Mobile table badge & cart icon row */}
            <div className="flex md:hidden items-center gap-3">
              {activeTable ? (
                <div className="bg-caramel/10 border border-caramel/30 px-2.5 py-1 rounded-full flex items-center gap-1 text-[10px] text-caramel font-semibold uppercase tracking-wider">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span>M{activeTable.table_number}</span>
                </div>
              ) : null}

              <Link
                to="/cart"
                className="relative p-1.5 text-text-primary hover:text-caramel transition-colors"
                id="header-mobile-cart"
              >
                <ShoppingBag className="w-5.5 h-5.5" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-caramel text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Search bar & Desktop Buttons */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between md:justify-end gap-3.5 w-full md:w-auto">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative w-full md:w-48 lg:w-60">
              <input
                type="text"
                placeholder={t('menu.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background hover:bg-border/30 focus:bg-surface focus:text-text-primary placeholder-text-secondary/50 text-xs text-text-primary px-4 py-2.5 pl-9 rounded-xl outline-none border border-border focus:border-caramel/30 transition-all duration-200 font-sans"
                id="global-search-input"
              />
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary text-[10px] font-semibold"
                  id="clear-search-button"
                >
                  Batal
                </button>
              )}
            </form>

            {/* Desktop only buttons */}
            <div className="hidden md:flex items-center gap-4">
              {activeTable ? (
                <div className="bg-caramel/10 border border-caramel/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs text-caramel font-semibold">
                  <MapPin className="w-4 h-4" />
                  <span>Meja {activeTable.table_number}</span>
                </div>
              ) : null}

              <Link
                to="/orders"
                className={`p-2 rounded-xl border border-transparent transition-colors ${
                  isActive('/orders') ? 'text-caramel bg-caramel/10' : 'text-text-secondary hover:text-text-primary hover:bg-background'
                }`}
                title={t('nav.orders')}
              >
                <ClipboardList className="w-5 h-5" />
              </Link>

              <Link
                to="/profile"
                className={`p-2 rounded-xl border border-transparent transition-colors ${
                  isActive('/profile') ? 'text-caramel bg-caramel/10' : 'text-text-secondary hover:text-text-primary hover:bg-background'
                }`}
                title={t('nav.profile')}
              >
                <User className="w-5 h-5" />
              </Link>

              <Link
                to="/settings"
                className={`p-2 rounded-xl border border-transparent transition-colors ${
                  isActive('/settings') ? 'text-caramel bg-caramel/10' : 'text-text-secondary hover:text-text-primary hover:bg-background'
                }`}
                title={t('nav.settings')}
              >
                <Settings className="w-5 h-5" />
              </Link>

              <Link
                to="/cart"
                className="bg-caramel hover:bg-caramel-hover text-white px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold transition-all shadow-sm"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{t('nav.cart')} ({cartItemsCount})</span>
              </Link>
            </div>
          </div>

        </div>
      </header>

      {/* Main Content Page Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 pb-28 md:pb-8">
        {children}
      </main>

      {/* Floating Cart Bar (Mobile only, hidden on md/lg screens) */}
      {!location.pathname.startsWith('/cart') && 
       !location.pathname.startsWith('/checkout') && 
       !location.pathname.startsWith('/payment') && 
       !location.pathname.startsWith('/order-status') && 
       cartItemsCount > 0 && (
        <div className="fixed bottom-[72px] left-1/2 -translate-x-1/2 z-30 w-full max-w-sm px-4 md:hidden">
          <div className="bg-surface text-text-primary h-14 px-4 rounded-xl shadow-xl border border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-4.5 h-4.5 text-caramel flex-shrink-0" />
              <span className="text-xs font-sans text-text-primary">
                <span className="font-bold">{t('cart.itemCount', { count: cartItemsCount })}</span>
                <span className="mx-1.5 opacity-40">&bull;</span>
                <span className="font-semibold text-caramel">
                  {new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(cartTotal)}
                </span>
              </span>
            </div>
            
            <Link
              to="/cart"
              className="bg-caramel hover:bg-caramel-hover text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all shadow-md active:scale-95 uppercase tracking-wider font-sans"
              id="view-cart-floating-btn"
            >
              {t('cart.viewCart').split(' ')[0] /* "Lihat" / "View" */}
            </Link>
          </div>
        </div>
      )}

      {/* Bottom Sticky Navigation (Mobile only) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border py-2.5 px-6 flex items-center justify-between shadow-lg md:hidden">
        <Link
          to="/"
          className={`flex flex-col items-center gap-1 transition-colors ${
            isActive('/') ? 'text-caramel' : 'text-text-secondary/60 hover:text-text-primary'
          }`}
          id="nav-home"
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium font-sans">{t('nav.home')}</span>
        </Link>

        <Link
          to="/menu"
          className={`flex flex-col items-center gap-1 transition-colors ${
            isActive('/menu') ? 'text-caramel' : 'text-text-secondary/60 hover:text-text-primary'
          }`}
          id="nav-menu"
        >
          <Coffee className="w-5 h-5" />
          <span className="text-[10px] font-medium font-sans">{t('nav.menu')}</span>
        </Link>

        <Link
          to="/cart"
          className={`flex flex-col items-center gap-1 transition-colors relative ${
            isActive('/cart') ? 'text-caramel' : 'text-text-secondary/60 hover:text-text-primary'
          }`}
          id="nav-cart"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {cartItemsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-caramel text-white text-[9px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center">
                {cartItemsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium font-sans">{t('nav.cart')}</span>
        </Link>

        <Link
          to="/orders"
          className={`flex flex-col items-center gap-1 transition-colors ${
            isActive('/orders') ? 'text-caramel' : 'text-text-secondary/60 hover:text-text-primary'
          }`}
          id="nav-orders"
        >
          <ClipboardList className="w-5 h-5" />
          <span className="text-[10px] font-medium font-sans">{t('nav.orders')}</span>
        </Link>

        <Link
          to="/profile"
          className={`flex flex-col items-center gap-1 transition-colors ${
            isActive('/profile') ? 'text-caramel' : 'text-text-secondary/60 hover:text-text-primary'
          }`}
          id="nav-profile"
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium font-sans">{t('nav.profile')}</span>
        </Link>
      </nav>
    </div>
  );
};
