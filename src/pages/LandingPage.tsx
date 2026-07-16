import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useTable } from '../context/TableContext';
import { useToast } from '../context/ToastContext';
import { useLocale } from '../context/LocaleContext';
import { useTheme } from '../context/ThemeContext';
import { apiService } from '../services/api';
import { Category, Menu } from '../types';
import { 
  Coffee, 
  MapPin, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  Phone, 
  Instagram, 
  ChevronRight,
  BookOpen,
  QrCode,
  Check,
  Compass,
  Utensils
} from 'lucide-react';
import { CategorySkeleton, MenuCardSkeleton, HeroSkeleton } from '../components/Skeletons';

export const LandingPage: React.FC = () => {
  const { activeTable, setTable, orderType, setOrderType } = useTable();
  const { showSuccess } = useToast();
  const { t, locale } = useLocale();
  const { reduceMotion } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // API states
  const [categories, setCategories] = useState<Category[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Simulation tables
  const devTables = [
    { id: '1', name: 'Meja 1', token: 'NUVORA-MEJA-1-A1B2', table_number: 1 },
    { id: '2', name: 'Meja 2', token: 'NUVORA-MEJA-2-B2C3', table_number: 2 },
    { id: '3', name: 'Meja 3', token: 'NUVORA-MEJA-3-C3D4', table_number: 3 },
  ];

  useEffect(() => {
    // Scroll handling for hash parameters
    const scrollType = searchParams.get('scroll');
    if (scrollType === 'about') {
      setTimeout(() => {
        document.getElementById('about-nuvora')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      }, 300);
    } else if (scrollType === 'hours') {
      setTimeout(() => {
        document.getElementById('opening-hours')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      }, 300);
    }
  }, [searchParams, reduceMotion]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, menusRes] = await Promise.all([
          apiService.getCategories(),
          apiService.getMenus()
        ]);
        setCategories(catsRes || []);
        setMenus(menusRes || []);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const selectDevTable = (table: typeof devTables[0]) => {
    setTable({
      tableId: `TBL-00${table.id}`,
      table_id: `TBL-00${table.id}`,
      table_number: table.table_number,
      tableName: table.name,
      token: table.token
    });
    setOrderType('dine_in');
    showSuccess(t('home.connectedTable', { table: table.name }));
  };

  const clearDevTable = () => {
    setTable(null);
    setOrderType('delivery');
    showSuccess(locale === 'id' ? 'Sesi meja dibersihkan.' : 'Table session cleared.');
  };

  // Filter out subcategories, show only parent/main categories
  const mainCategories = useMemo(() => {
    return categories.filter(c => 
      !c.parent_category_id || 
      String(c.category_type ?? '').toLowerCase() === 'main' ||
      ['cat-001', 'cat-002', 'cat-003'].includes(String(c.category_id ?? '').toLowerCase())
    );
  }, [categories]);

  // Today's recommendations
  const recommendedMenus = useMemo(() => {
    return menus
      .filter(item => item.recommended === 'yes' || item.recommended === true || item.is_recommended === 'yes')
      .slice(0, 4);
  }, [menus]);

  // Fallback placeholder image
  const getCategoryPlaceholderImage = (catId: string) => {
    const id = catId.toLowerCase();
    if (id === 'cat-001') {
      return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400';
    }
    if (id === 'cat-002') {
      return 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=400';
    }
    return 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&q=80&w=400';
  };

  // Formatting helper
  const formatIDRCurrency = (val: number) => {
    return new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-12 pb-16 text-left">
      {/* Session Badge Alert (Simple & Discrete) */}
      {activeTable && (
        <div className="bg-caramel/10 border border-caramel/20 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs text-caramel font-sans shadow-sm">
          <div className="flex items-center gap-2">
            <Utensils className="w-3.5 h-3.5 text-caramel" />
            <span className="font-semibold">{t('home.orderingFromTable', { table: activeTable.table_number })}</span>
          </div>
          <button 
            onClick={clearDevTable}
            className="text-[10px] text-text-secondary hover:text-caramel font-bold underline font-mono"
          >
            {locale === 'id' ? 'Keluar Sesi Meja' : 'Exit Table'}
          </button>
        </div>
      )}

      {/* Hero Section: Height 420-480px, Two Columns, Real Photo on Right */}
      {isLoading ? (
        <HeroSkeleton />
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 bg-surface rounded-3xl overflow-hidden border border-border min-h-[420px] md:h-[450px]">
          {/* Left Column: Content */}
          <div className="p-8 sm:p-12 flex flex-col justify-center space-y-6 text-left">
            {activeTable && (
              <div className="inline-flex items-center gap-1.5 bg-caramel/10 border border-caramel/30 px-3 py-1 rounded-full text-[10px] text-caramel font-semibold uppercase tracking-wider w-max">
                <Utensils className="w-3 h-3" />
                <span>{t('home.orderingFromTable', { table: activeTable.table_number })}</span>
              </div>
            )}
            <div className="space-y-4">
              <h1 className="font-display font-medium text-3xl sm:text-4xl md:text-5xl leading-tight tracking-tight text-text-primary">
                {locale === 'id' ? 'Tempat singgah untuk kopi dan makanan hangat.' : 'Tempat singgah untuk kopi dan makanan hangat.'}
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-sans font-light max-w-md">
                {locale === 'id' ? 'Lihat menu, pesan dari meja, lalu biarkan kami menyiapkannya.' : 'Lihat menu, pesan dari meja, lalu biarkan kami menyiapkannya.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/menu"
                className="bg-espresso hover:bg-espresso-hover text-white text-xs sm:text-sm font-semibold px-6 py-3.5 rounded-xl transition-all flex items-center gap-2 shadow-sm active:scale-95 font-sans"
              >
                <span>{locale === 'id' ? 'Lihat Menu' : 'View Menu'}</span>
                <ArrowRight className="w-4 h-4 text-caramel" />
              </Link>
              <button
                onClick={() => {
                  document.getElementById('opening-hours')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
                }}
                className="bg-background hover:bg-border/30 text-text-primary text-xs sm:text-sm font-medium px-5 py-3.5 rounded-xl transition-all border border-border active:scale-95 font-sans"
              >
                {locale === 'id' ? 'Lokasi Café' : 'Café Location'}
              </button>
            </div>
          </div>

          {/* Right Column: Real Photo */}
          <div className="hidden md:block relative h-full w-full">
            <img
              src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=800"
              alt="Nuvora Café"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        </section>
      )}

      {/* Popular Categories Section */}
      <section className="space-y-6">
        <div className="flex items-end justify-between border-b border-border pb-3">
          <div className="space-y-0.5">
            <span className="text-[9px] text-caramel font-mono uppercase tracking-widest font-bold block">
              Pilihan Sajian
            </span>
            <h2 className="font-display text-lg sm:text-xl text-text-primary tracking-tight uppercase font-medium">
              {t('home.popularCategories')}
            </h2>
          </div>
          <Link to="/menu" className="text-xs text-caramel hover:text-caramel-hover font-semibold flex items-center gap-0.5 font-sans">
            <span>Lihat Semua</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <CategorySkeleton />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {mainCategories.map((cat) => (
              <Link
                key={cat.category_id}
                to={`/menu?category=${cat.category_id}`}
                className="group relative h-24 rounded-2xl overflow-hidden border border-border shadow-sm flex items-end p-4 bg-surface"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/25 to-transparent z-10" />
                <img
                  src={getCategoryPlaceholderImage(cat.category_id)}
                  alt={cat.category_name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                  loading="lazy"
                  decoding="async"
                />
                <span className="relative z-20 font-display text-xs sm:text-sm text-text-primary font-medium group-hover:text-caramel transition-colors">
                  {cat.category_name}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recommended Menu Section */}
      <section className="space-y-6">
        <div className="flex items-end justify-between border-b border-border pb-3">
          <div className="space-y-0.5">
            <span className="text-[9px] text-caramel font-mono uppercase tracking-widest font-bold block">
              Dikurasi Hari Ini
            </span>
            <h2 className="font-display text-lg sm:text-xl text-text-primary tracking-tight uppercase font-medium">
              {t('home.todaysFavorites')}
            </h2>
          </div>
          <Link to="/menu" className="text-xs text-caramel hover:text-caramel-hover font-semibold flex items-center gap-0.5 font-sans">
            <span>Lihat Semua</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <MenuCardSkeleton key={i} />
            ))}
          </div>
        ) : recommendedMenus.length === 0 ? (
          <div className="bg-surface border border-dashed border-border rounded-xl py-12 text-center">
            <p className="text-xs text-text-secondary font-sans font-light">Belum ada menu rekomendasi terpasang.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendedMenus.map((item) => (
              <Link
                key={item.id}
                to={`/menu/${item.id}`}
                className="bg-surface border border-border rounded-xl overflow-hidden hover:border-caramel/20 hover:shadow-sm transition-all flex flex-col group p-2 h-[210px] sm:h-[260px]"
              >
                {/* Product image - Square aspect ratio for compact grids */}
                <div className="w-full aspect-square rounded-lg overflow-hidden bg-background/30 relative">
                  <img
                    src={item.image_url || getCategoryPlaceholderImage(item.category_id)}
                    alt={item.menu_name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-101"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute top-1.5 right-1.5 bg-surface border border-border text-text-primary text-[7px] font-mono tracking-widest uppercase px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-sm font-semibold">
                    <Sparkles className="w-2 h-2 text-caramel fill-caramel" />
                    <span>Favorit</span>
                  </div>
                </div>

                <div className="pt-2 flex-1 flex flex-col justify-between gap-1">
                  <div className="space-y-0.5 text-left">
                    <h3 className="font-display text-xs text-text-primary line-clamp-2 leading-snug group-hover:text-caramel transition-colors font-medium">
                      {item.menu_name}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between border-t border-border/30 pt-1.5 mt-1">
                    <span className="font-mono text-[10px] sm:text-xs text-caramel font-semibold">
                      {formatIDRCurrency(item.price)}
                    </span>
                    <span className="text-[8px] sm:text-[9px] bg-background text-text-primary px-2 py-0.5 rounded-md border border-border font-semibold group-hover:bg-espresso group-hover:text-white group-hover:border-transparent transition-all">
                      {t('menu.add')}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Promotional Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface border border-border p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-1.5 text-left">
            <span className="text-[8px] bg-caramel/10 text-caramel font-mono px-2 py-0.5 rounded font-bold uppercase tracking-widest inline-block">
              {t('home.promoTitle')}
            </span>
            <h3 className="font-display font-medium text-base text-text-primary uppercase leading-tight">{t('home.promoTitle')}</h3>
            <p className="text-xs text-text-secondary font-sans font-light leading-relaxed">
              {t('home.promoDesc')}
            </p>
          </div>
          <Link to="/menu" className="text-xs text-caramel font-semibold flex items-center gap-1 group w-max font-sans">
            <span>{t('home.promoCta')}</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="bg-surface border border-border p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-1.5 text-left">
            <span className="text-[8px] bg-caramel/10 text-caramel font-mono px-2 py-0.5 rounded font-bold uppercase tracking-widest inline-block">
              {t('home.loyaltyTitle')}
            </span>
            <h3 className="font-display font-medium text-base text-text-primary uppercase leading-tight">{t('home.loyaltyTitle')}</h3>
            <p className="text-xs text-text-secondary font-sans font-light leading-relaxed">
              {t('home.loyaltyDesc')}
            </p>
          </div>
          <Link to="/profile" className="text-xs text-caramel font-semibold flex items-center gap-1 group w-max font-sans">
            <span>{t('home.loyaltyCta')}</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* Tentang Nuvora Café */}
      <section id="about-nuvora" className="py-6 grid grid-cols-1 md:grid-cols-12 gap-8 items-center border-t border-b border-border/40">
        <div className="md:col-span-5 relative">
          <div className="rounded-2xl overflow-hidden aspect-[4/3] border border-border shadow-sm">
            <img 
              src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&q=80&w=600" 
              alt="About Nuvora" 
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>

        <div className="md:col-span-7 text-left space-y-3.5">
          <span className="text-caramel uppercase tracking-widest text-[8px] font-mono font-bold block">
            {t('home.aboutSectionTitle')}
          </span>
          <h2 className="font-display font-medium text-xl text-text-primary uppercase tracking-tight">
            {t('home.aboutSectionHeading')}
          </h2>
          <p className="text-xs text-text-secondary leading-relaxed font-sans font-light">
            {t('home.aboutText1')}
          </p>
          <p className="text-xs text-text-secondary leading-relaxed font-sans font-light">
            {t('home.aboutText2')}
          </p>
        </div>
      </section>

      {/* Jam Buka & Lokasi Section */}
      <section id="opening-hours" className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Hours */}
        <div className="bg-surface border border-border p-6 rounded-2xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-caramel border-b border-border pb-2.5">
              <Clock className="w-4 h-4" />
              <h3 className="font-display font-medium text-xs text-text-primary uppercase tracking-wider">{t('home.hoursTitle')}</h3>
            </div>
            
            <div className="space-y-3 divide-y divide-border/20 text-xs text-left">
              <div className="flex justify-between py-1.5">
                <span className="text-text-secondary font-sans font-light">{t('home.hoursWeekdays')}</span>
                <span className="font-semibold text-text-primary">08:00 - 22:00 WIB</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-text-secondary font-sans font-light">{t('home.hoursWeekends')}</span>
                <span className="font-semibold text-text-primary">07:00 - 23:00 WIB</span>
              </div>
            </div>
          </div>

          <div className="bg-background border border-border p-3.5 rounded-xl flex items-center gap-3">
            <Phone className="w-4 h-4 text-caramel flex-shrink-0" />
            <div className="text-xs text-left font-sans">
              <span className="text-text-secondary block font-light">Hubungi Layanan Meja</span>
              <span className="font-bold text-text-primary">+62 812-3456-7890</span>
            </div>
          </div>
        </div>

        {/* Location / Contact */}
        <div className="bg-surface border border-border p-6 rounded-2xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-caramel border-b border-border pb-2.5">
              <MapPin className="w-4 h-4" />
              <h3 className="font-display font-medium text-xs text-text-primary uppercase tracking-wider">{t('home.locationTitle')}</h3>
            </div>
            
            <div className="space-y-1.5 text-xs text-left font-sans">
              <p className="font-semibold text-text-primary">{t('home.locationName')}</p>
              <p className="text-text-secondary leading-relaxed font-light">
                {t('home.locationAddress')}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <a 
              href="https://instagram.com" 
              target="_blank" 
              rel="noreferrer"
              className="bg-background hover:bg-border/10 border border-border p-3 rounded-xl text-text-secondary hover:text-caramel transition-all flex items-center justify-center flex-1 gap-2 text-xs font-semibold shadow-sm font-sans"
            >
              <Instagram className="w-4 h-4" />
              <span>@nuvoracafe</span>
            </a>
          </div>
        </div>
      </section>

      {/* Secondary Table Simulation Section at Bottom */}
      <section className="bg-surface rounded-3xl p-6 border border-border text-center space-y-6 relative overflow-hidden">
        <div className="max-w-md mx-auto space-y-2">
          <div className="w-10 h-10 bg-caramel/10 border border-caramel/25 rounded-xl mx-auto flex items-center justify-center mb-1">
            <QrCode className="w-5 h-5 text-caramel" />
          </div>
          <h2 className="font-display font-medium text-base text-text-primary uppercase tracking-tight">
            {t('home.tableSimulation')}
          </h2>
          <p className="text-xs text-text-secondary leading-relaxed font-sans font-light px-2">
            {t('home.tableSimulationDesc')}
          </p>
        </div>

        <div className="max-w-md mx-auto space-y-4">
          <div className="grid grid-cols-3 gap-2.5">
            {devTables.map((table) => {
              const isSelected = activeTable?.table_number === table.table_number;
              return (
                <button
                  key={table.id}
                  onClick={() => selectDevTable(table)}
                  className={`border p-3 rounded-xl font-sans text-xs transition-all flex flex-col items-center justify-center gap-0.5 active:scale-95 ${
                    isSelected
                      ? 'bg-caramel border-caramel text-white shadow-sm font-semibold'
                      : 'bg-background border-border text-text-secondary hover:bg-surface hover:border-text-secondary/30'
                  }`}
                  id={`dev-table-btn-${table.id}`}
                >
                  <span className={`text-[8px] uppercase tracking-wider font-mono ${isSelected ? 'text-white/80' : 'text-caramel'}`}>
                    Meja
                  </span>
                  <span className="text-base font-bold flex items-center gap-1">
                    {table.id}
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </span>
                </button>
              );
            })}
          </div>

          {activeTable ? (
            <div className="space-y-2">
              <p className="text-[9px] text-caramel font-mono uppercase tracking-wider font-semibold">
                &bull; {t('home.connectedTable', { table: activeTable.tableName })} &bull;
              </p>
              <button 
                onClick={clearDevTable}
                className="text-[10px] text-text-secondary hover:text-caramel font-semibold underline font-mono"
              >
                {locale === 'id' ? 'Hapus Koneksi Meja (Ubah ke Delivery)' : 'Disconnect Table (Change to Delivery)'}
              </button>
            </div>
          ) : (
            <p className="text-[10px] text-text-secondary/50 font-sans italic">
              {t('home.connectPrompt')}
            </p>
          )}
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="border-t border-border pt-8 text-center space-y-4">
        <div className="flex flex-col items-center gap-1">
          <span className="font-display text-lg tracking-tight text-text-primary font-semibold leading-none">NUVORA</span>
          <span className="text-[8px] uppercase tracking-widest text-text-secondary font-mono leading-none">- Café &amp; Kitchen -</span>
        </div>
        <p className="text-[9px] text-text-secondary/80 max-w-xs mx-auto leading-relaxed font-sans font-light">
          {t('home.footerDesc')}
        </p>
        <div className="text-[8px] text-text-secondary/40 font-mono pt-2">
          &copy; {new Date().getFullYear()} {t('home.footerCopyright')}
        </div>
      </footer>
    </div>
  );
};
