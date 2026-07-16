import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTable } from '../context/TableContext';
import { useToast } from '../context/ToastContext';
import { useLocale } from '../context/LocaleContext';
import { storageHelper } from '../utils/storage';
import { GoogleUser } from '../types';
import { User, Mail, LogOut, MapPin, ClipboardList, Key, Settings } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { activeTable, setTable } = useTable();
  const { showSuccess, showInfo } = useToast();
  const { t } = useLocale();

  const [currentUser, setCurrentUser] = useState<GoogleUser | null>(null);

  useEffect(() => {
    const user = storageHelper.getUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const handleLogout = () => {
    storageHelper.logout();
    setCurrentUser(null);
    showSuccess(t('profile.logoutSuccess'));
    navigate('/login');
  };

  const handleClearTableInfo = () => {
    setTable(null);
    showInfo(t('profile.disconnectSuccess'));
  };

  return (
    <div className="space-y-8 pb-20 max-w-2xl mx-auto text-left">
      {/* Title */}
      <div className="space-y-1">
        <h2 className="font-display font-medium text-2xl uppercase tracking-tight text-text-primary">
          {t('profile.title')}
        </h2>
        <p className="text-xs text-text-secondary font-sans font-light">
          {t('profile.desc')}
        </p>
      </div>

      {/* Google User Profile Details */}
      {currentUser ? (
        <div className="space-y-6">
          {/* Main User Card */}
          <div className="bg-surface border border-border p-6 rounded-3xl flex flex-col gap-5 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-5">
              {/* User Avatar */}
              {currentUser.photo_url ? (
                <img
                  src={currentUser.photo_url}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-full border border-caramel shadow-sm object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-caramel/10 border border-caramel flex items-center justify-center flex-shrink-0">
                  <User className="w-7 h-7 text-caramel" />
                </div>
              )}
              
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[9px] bg-caramel/10 text-caramel border border-caramel/20 px-2 py-0.5 rounded-full font-mono uppercase font-bold tracking-widest">
                    {currentUser.role || 'customer'}
                  </span>
                  <span className="text-[9px] bg-background text-text-secondary border border-border px-2.5 py-0.5 rounded-full font-mono">
                    ID: {currentUser.user_id}
                  </span>
                </div>
                
                <h3 className="font-display font-medium text-lg text-text-primary truncate leading-tight">
                  {currentUser.name}
                </h3>
                <p className="text-xs text-text-secondary truncate flex items-center gap-1.5 font-sans font-light">
                  <Mail className="w-3.5 h-3.5 text-caramel flex-shrink-0" />
                  <span>{currentUser.email}</span>
                </p>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="text-danger hover:bg-danger/10 p-2.5 rounded-xl border border-danger/15 transition-colors flex-shrink-0 active:scale-95"
                title={t('profile.logout')}
                id="profile-logout-btn"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>

            {/* Session Token Details */}
            {currentUser.session_token && (
              <div className="bg-background border border-border rounded-xl p-3.5 space-y-1.5 text-[10px]">
                <div className="flex items-center gap-1.5 text-caramel font-bold uppercase tracking-widest font-mono">
                  <Key className="w-3.5 h-3.5" />
                  <span>{t('profile.securityToken')}</span>
                </div>
                <p className="font-mono text-text-secondary break-all select-all leading-relaxed">
                  {currentUser.session_token}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Prompt to Login */
        <div className="bg-surface border border-dashed border-border rounded-3xl p-8 text-center space-y-5">
          <div className="w-14 h-14 bg-background border border-border rounded-full flex items-center justify-center mx-auto text-caramel shadow-sm">
            <User className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-display text-base text-text-primary uppercase tracking-wide font-medium">{t('profile.notLoggedIn')}</h3>
            <p className="text-xs text-text-secondary leading-relaxed max-w-xs mx-auto font-sans font-light">
              {t('profile.notLoggedInDesc')}
            </p>
          </div>
          <Link
            to="/login"
            className="inline-block bg-espresso hover:bg-espresso-hover text-white font-sans text-xs uppercase tracking-widest font-semibold px-6 py-3.5 rounded-xl shadow-sm transition-all"
            id="profile-login-redirect"
          >
            {t('profile.loginBtn')}
          </Link>
        </div>
      )}

      {/* Table Session Information Card */}
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-text-primary font-display font-semibold text-xs uppercase tracking-wider pb-3 border-b border-border">
          <MapPin className="w-4 h-4 text-caramel" />
          <span>{t('profile.tableInfo')}</span>
        </div>

        {activeTable ? (
          <div className="space-y-4 font-sans text-xs">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary font-light">{t('profile.activeTable')}:</span>
              <span className="font-bold text-text-primary">{activeTable.tableName}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-text-secondary bg-background px-3 py-2 rounded-lg border border-border">
              <span>{t('profile.tableToken')}:</span>
              <span>{activeTable.token}</span>
            </div>

            <div className="flex gap-3 pt-1.5">
              <Link
                to="/"
                className="bg-surface text-text-primary border border-border hover:border-text-secondary px-4 py-3 rounded-xl text-xs font-semibold text-center flex-1 transition-all"
                id="profile-change-table"
              >
                {t('profile.changeTable')}
              </Link>
              <button
                onClick={handleClearTableInfo}
                className="bg-danger/10 hover:bg-danger/15 text-danger border border-danger/20 px-4 py-3 rounded-xl text-xs font-semibold flex-1 transition-all"
                id="profile-clear-table"
              >
                {t('profile.disconnectTable')}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-text-secondary font-sans font-light">{t('profile.noTable')}</p>
            <Link
              to="/"
              className="bg-espresso hover:bg-espresso-hover text-white py-3.5 rounded-xl text-xs font-semibold text-center block w-full uppercase tracking-widest font-mono"
              id="profile-connect-table"
            >
              {t('profile.connectPrompt')}
            </Link>
          </div>
        )}
      </div>

      {/* Quick Links Menu List */}
      <div className="bg-surface border border-border rounded-2xl p-2.5 divide-y divide-border/50">
        <Link
          to="/orders"
          className="flex items-center justify-between p-4 text-xs text-text-primary font-semibold hover:text-caramel transition-colors font-sans"
          id="profile-menu-orders"
        >
          <div className="flex items-center gap-3">
            <ClipboardList className="w-4.5 h-4.5 text-caramel animate-pulse" />
            <span>{t('orders.title')}</span>
          </div>
          <span className="text-text-secondary/40 font-bold font-mono">&rarr;</span>
        </Link>

        {/* 4. Settings quick link button inside mobile profile page */}
        <Link
          to="/settings"
          className="flex items-center justify-between p-4 text-xs text-text-primary font-semibold hover:text-caramel transition-colors font-sans"
          id="profile-menu-settings"
        >
          <div className="flex items-center gap-3">
            <Settings className="w-4.5 h-4.5 text-caramel" />
            <span>{t('settings.title')}</span>
          </div>
          <span className="text-text-secondary/40 font-bold font-mono">&rarr;</span>
        </Link>
      </div>
    </div>
  );
};
