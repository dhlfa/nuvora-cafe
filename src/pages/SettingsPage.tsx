import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { Sun, Moon, Laptop, Globe, EyeOff, Trash2, RotateCcw, ChevronLeft } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, setTheme, reduceMotion, setReduceMotion } = useTheme();
  const { locale, setLocale, t } = useLocale();
  const { clearCart } = useCart();
  const { showSuccess } = useToast();

  const handleResetPreferences = () => {
    setTheme('system');
    setLocale('id');
    setReduceMotion(false);
    showSuccess(t('settings.resetSuccess'));
  };

  const handleClearCartData = () => {
    clearCart();
    showSuccess(t('settings.clearCartSuccess'));
  };

  return (
    <div className="max-w-xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 hover:bg-surface-elevated rounded-lg transition-colors border border-border"
          title="Back"
        >
          <ChevronLeft className="w-5 h-5 text-text-primary" />
        </button>
        <div>
          <h2 className="font-display text-xl uppercase tracking-wider text-text-primary font-medium leading-tight">
            {t('settings.title')}
          </h2>
          <p className="text-[11px] text-text-secondary font-sans">
            Personalize your Nuvora Café digital experience
          </p>
        </div>
      </div>

      {/* Theme Options */}
      <div className="space-y-3">
        <h3 className="font-display text-sm text-text-primary uppercase tracking-wider border-b border-border/40 pb-1.5">
          {t('settings.appearance')}
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {([
            { id: 'light', label: t('settings.light'), icon: Sun },
            { id: 'dark', label: t('settings.dark'), icon: Moon },
            { id: 'system', label: t('settings.system'), icon: Laptop },
          ] as const).map(({ id, label, icon: Icon }) => {
            const isSelected = theme === id;
            return (
              <button
                key={id}
                onClick={() => setTheme(id)}
                className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all font-sans text-xs active:scale-97 ${
                  isSelected
                    ? 'bg-espresso border-espresso text-surface'
                    : 'bg-surface border-border hover:border-text-secondary text-text-secondary hover:text-text-primary'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium text-[10px] sm:text-xs text-center">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Language Options */}
      <div className="space-y-3">
        <h3 className="font-display text-sm text-text-primary uppercase tracking-wider border-b border-border/40 pb-1.5">
          {t('settings.language')}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {([
            { id: 'id', label: t('settings.indonesian') },
            { id: 'en', label: t('settings.english') },
          ] as const).map(({ id, label }) => {
            const isSelected = locale === id;
            return (
              <button
                key={id}
                onClick={() => setLocale(id)}
                className={`p-3.5 rounded-xl border flex items-center justify-center gap-2 transition-all font-sans text-xs active:scale-97 ${
                  isSelected
                    ? 'bg-espresso border-espresso text-surface'
                    : 'bg-surface border-border hover:border-text-secondary text-text-secondary'
                }`}
              >
                <Globe className="w-4 h-4 opacity-70" />
                <span className="font-semibold">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preferences Section */}
      <div className="space-y-3">
        <h3 className="font-display text-sm text-text-primary uppercase tracking-wider border-b border-border/40 pb-1.5">
          {t('settings.preferences')}
        </h3>
        <div className="bg-surface border border-border rounded-2xl divide-y divide-border/50">
          {/* Reduce Motion */}
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="text-xs font-semibold text-text-primary flex items-center gap-2">
                <EyeOff className="w-4 h-4 text-caramel" />
                <span>{t('settings.reduceMotion')}</span>
              </h4>
              <p className="text-[10px] text-text-secondary leading-normal">
                Minimize scaling, long transitions, and animated interface components.
              </p>
            </div>
            <button
              onClick={() => setReduceMotion(!reduceMotion)}
              className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 outline-none ${
                reduceMotion ? 'bg-caramel' : 'bg-border'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                  reduceMotion ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Clear Cart Local Storage */}
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="text-xs font-semibold text-text-primary flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-danger" />
                <span>{t('settings.clearCartData')}</span>
              </h4>
              <p className="text-[10px] text-text-secondary leading-normal">
                Empty all local cart session cached data on this browser safely.
              </p>
            </div>
            <button
              onClick={handleClearCartData}
              className="px-3 py-1.5 bg-danger/10 hover:bg-danger/15 text-danger border border-danger/20 rounded-lg text-xs font-semibold transition-colors active:scale-95"
            >
              Clear
            </button>
          </div>

          {/* Reset Preferences */}
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="text-xs font-semibold text-text-primary flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-text-secondary" />
                <span>{t('settings.resetPreferences')}</span>
              </h4>
              <p className="text-[10px] text-text-secondary leading-normal">
                Restore theme, language, and custom configurations to system defaults.
              </p>
            </div>
            <button
              onClick={handleResetPreferences}
              className="px-3 py-1.5 bg-surface-elevated hover:bg-border/30 text-text-primary border border-border rounded-lg text-xs font-semibold transition-colors active:scale-95"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* About Application */}
      <div className="space-y-3">
        <h3 className="font-display text-sm text-text-primary uppercase tracking-wider border-b border-border/40 pb-1.5">
          {t('settings.aboutApp')}
        </h3>
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-2 text-xs text-text-secondary">
          <div className="flex justify-between">
            <span>Name</span>
            <span className="font-semibold text-text-primary">Nuvora Café Digital Portal</span>
          </div>
          <div className="flex justify-between">
            <span>Version</span>
            <span className="font-mono font-bold text-text-primary">{t('settings.appVersion')}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-border/40">
            <span>License</span>
            <span className="font-mono">Artisanal Proprietary</span>
          </div>
        </div>
      </div>
    </div>
  );
};
