import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Coffee, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { apiService } from '../services/api';
import { storageHelper } from '../utils/storage';
import { useToast } from '../context/ToastContext';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            ux_mode?: 'popup' | 'redirect';
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              width?: number;
              logo_alignment?: 'left' | 'center';
            }
          ) => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID =
  (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
  '332461009691-lvhn26ctqjhog82t01j0r39euapv3n10.apps.googleusercontent.com';

const loadGoogleIdentityScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]'
    );

    if (existing) {
      const timeout = window.setTimeout(() => {
        if (window.google?.accounts?.id) {
          resolve();
        } else {
          reject(new Error('Google Identity Services gagal dimuat.'));
        }
      }, 5000);

      existing.addEventListener(
        'load',
        () => {
          window.clearTimeout(timeout);
          resolve();
        },
        { once: true }
      );

      existing.addEventListener(
        'error',
        () => {
          window.clearTimeout(timeout);
          reject(new Error('Script Google Identity Services gagal dimuat.'));
        },
        { once: true }
      );

      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;

    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error('Script Google Identity Services gagal dimuat.'));

    document.head.appendChild(script);
  });
};

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError, showInfo } = useToast();

  const buttonRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const [setupError, setSetupError] = useState('');

  const redirectPath =
    new URLSearchParams(location.search).get('redirect') || '/menu';

  useEffect(() => {
    let active = true;

    const initializeGoogleLogin = async () => {
      try {
        setSetupError('');

        if (!GOOGLE_CLIENT_ID) {
          throw new Error('VITE_GOOGLE_CLIENT_ID belum diatur.');
        }

        await loadGoogleIdentityScript();

        if (!active) return;

        if (!window.google?.accounts?.id) {
          throw new Error('Google Identity Services tidak tersedia.');
        }

        if (!buttonRef.current) {
          throw new Error('Kontainer tombol Google tidak ditemukan.');
        }

        if (!initializedRef.current) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredentialResponse,
            ux_mode: 'popup',
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          initializedRef.current = true;
        }

        buttonRef.current.innerHTML = '';

        window.google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          width: 320,
          logo_alignment: 'left',
        });

        setIsGoogleReady(true);
      } catch (error) {
        console.error('Google Sign-In setup error:', error);

        const message =
          error instanceof Error
            ? error.message
            : 'Login Google gagal disiapkan.';

        setSetupError(message);
        setIsGoogleReady(false);
      }
    };

    initializeGoogleLogin();

    return () => {
      active = false;
    };
  }, []);

  const handleGoogleCredentialResponse = async (response: {
    credential?: string;
  }) => {
    const idToken = response.credential;

    if (!idToken) {
      showError('Google tidak mengirim ID token.');
      return;
    }

    setIsLoading(true);

    try {
      showInfo('Memverifikasi akun Google...');

      const userData = await apiService.googleLogin(idToken);

      if (!userData?.session_token) {
        throw new Error('Session login tidak diterima dari server.');
      }

      storageHelper.setUser(userData);

      showSuccess(
        `Berhasil masuk. Selamat datang, ${String(
          userData.name ?? 'Pelanggan'
        )}!`
      );

      const userRole = String(userData.role ?? '').toLowerCase();
      if (userRole === 'owner' || userRole === 'admin') {
        navigate('/admin');
        return;
      }

      navigate(redirectPath);
    } catch (error) {
      console.error('Google login verification error:', error);

      const message =
        error instanceof Error
          ? error.message
          : 'Gagal memverifikasi login Google.';

      showError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 py-8 px-4 max-w-md mx-auto">
      {/* Brand Header */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 bg-espresso border border-caramel rounded-2xl mx-auto flex items-center justify-center shadow-lg transform transition hover:scale-105 duration-300">
          <Coffee className="w-7 h-7 text-caramel animate-pulse" />
        </div>
        <div className="space-y-1">
          <h2 className="font-display font-black text-2xl text-espresso tracking-tight">
            Nuvora Café
          </h2>
          <p className="text-xs text-charcoal/50 font-medium tracking-wider uppercase">
            Scan. Order. Enjoy.
          </p>
        </div>
        <p className="text-xs text-charcoal/60 leading-relaxed max-w-xs mx-auto">
          Masuk cepat & aman untuk menyimpan riwayat transaksi dan menikmati hidangan premium kami.
        </p>
      </div>

      {/* Main Form/Card */}
      <div className="bg-cream/15 border border-cream-dark/30 rounded-3xl p-6 shadow-sm space-y-6 flex flex-col items-center relative overflow-hidden">
        {/* Decorative corner glow */}
        <div className="absolute -right-12 -top-12 w-24 h-24 bg-caramel/5 rounded-full blur-xl pointer-events-none" />

        <div className="text-center space-y-2">
          <ShieldCheck className="w-8 h-8 text-caramel/80 mx-auto" />
          <h3 className="font-display font-bold text-sm text-espresso">Keamanan Akun Terjamin</h3>
          <p className="text-[11px] text-charcoal/50 leading-relaxed max-w-xs">
            Kami menggunakan Google Identity Services tanpa menyimpan password Anda demi keamanan data pribadi.
          </p>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-4 gap-2">
            <Loader2 className="w-7 h-7 text-caramel animate-spin" />
            <span className="text-xs text-charcoal/60 font-medium">Memproses verifikasi akun...</span>
          </div>
        )}

        {/* Setup Error */}
        {setupError && (
          <div className="w-full bg-red-50 border border-red-100 p-3 rounded-2xl flex gap-2 text-red-800 text-[11px] leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">Gagal memuat sistem login Google:</span>
              <span>{setupError}</span>
            </div>
          </div>
        )}

        {/* Official Google Sign-In Container */}
        <div 
          className={`w-full flex justify-center py-2 transition-all duration-300 ${
            isLoading ? 'pointer-events-none opacity-40' : ''
          }`}
          style={{ display: isLoading ? 'none' : 'flex' }}
        >
          <div ref={buttonRef} id="google-signin-btn" className="min-h-[44px]"></div>
        </div>

        {!isGoogleReady && !setupError && !isLoading && (
          <div className="flex flex-col items-center justify-center py-3 gap-2">
            <Loader2 className="w-5 h-5 text-caramel/70 animate-spin" />
            <span className="text-[10px] text-charcoal/40 font-medium">Menyiapkan tombol Google...</span>
          </div>
        )}

        <div className="w-full border-t border-cream-dark/20 pt-4 text-center">
          <p className="text-[10px] text-charcoal/40 font-mono">
            Auth Engine: Google Identity Web Client
          </p>
        </div>
      </div>
    </div>
  );
};
