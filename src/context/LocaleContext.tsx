import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { id } from '../translations/id';
import { en } from '../translations/en';

export type Locale = 'id' | 'en';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

const dictionaries = {
  id,
  en
};

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      const saved = localStorage.getItem('nuvora_locale');
      if (saved === 'id' || saved === 'en') {
        return saved;
      }
      return 'id'; // default language is Indonesian
    } catch {
      return 'id';
    }
  });

  useEffect(() => {
    try {
      document.documentElement.lang = locale;
    } catch (e) {
      console.error(e);
    }
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem('nuvora_locale', newLocale);
    } catch (e) {
      console.error('Failed to save locale', e);
    }
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const dict = dictionaries[locale] || dictionaries.id;
    let translation = (dict as Record<string, string>)[key];

    if (!translation) {
      // Fallback to id if key not found in active locale
      translation = (dictionaries.id as Record<string, string>)[key] || key;
    }

    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translation = translation.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
      });
    }

    return translation;
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
};
