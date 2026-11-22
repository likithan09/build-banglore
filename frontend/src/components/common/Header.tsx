import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { 
  Globe, 
  Mic, 
  MicOff, 
  Volume2, 
  ShieldCheck, 
  Sparkles, 
  Activity, 
  User as UserIcon, 
  LogOut, 
  ShoppingBag,
  Inbox,
  Link2,
  Store,
  Bell,
  Check,
  ExternalLink
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: any) => void;
  onOpenAuth: (role?: 'artisan' | 'buyer') => void;
  cartCount?: number;
  onOpenCart?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  onOpenAuth,
  cartCount = 0,
  onOpenCart
}) => {
  const { language, setLanguage, languages, currentLanguageInfo, t } = useLanguage();
  const { user, isAuthenticated, activeRole, artisanProfileCompleted, buyerProfileCompleted, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const toggleVoiceAssistant = () => {
    setIsVoiceActive(!isVoiceActive);
    if (!isVoiceActive && window.speechSynthesis) {
      const msg = new SpeechSynthesisUtterance(t('welcome') || 'Welcome to KalaSetu');
      window.speechSynthesis.speak(msg);
    }
  };

  const readScreenAloud = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const textToRead = `${t('appName')}. ${t('tagline')}. Active role: ${activeRole}. Current section: ${currentTab}.`;
      const msg = new SpeechSynthesisUtterance(textToRead);
      window.speechSynthesis.speak(msg);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-200/60 shadow-sm transition-all">
      {/* Top Govt/Compliance & Voice Bar */}
      <div className="bg-[#1e293b] text-slate-300 text-xs px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-medium text-slate-200">
            KALASETU • कलासेतु • கலைசேது • ಕಲಾ ಸೇತು • କଳାସେତୁ
          </span>
          <span className="hidden sm:inline text-slate-400 text-[11px]">| AI-Powered Voice-First Indic Marketplace</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Audio Screen Readout Button */}
          <button
            onClick={readScreenAloud}
            title={t('readAloud') || 'Read Screen Aloud'}
            className="flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-amber-300 px-2 py-0.5 rounded border border-slate-700 transition"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">{t('readAloud') || 'Listen'}</span>
          </button>

          {/* Admin Kafka Events Link */}
          <button
            onClick={() => setCurrentTab('admin-events')}
            className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded transition ${
              currentTab === 'admin-events'
                ? 'bg-amber-500 text-slate-900 font-bold'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('kafkaStream') || 'Kafka Stream'}</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 relative">
        {/* Brand Logo & Tagline */}
        <div 
          onClick={() => setCurrentTab('marketplace')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 flex items-center justify-center shadow-md text-white font-black text-xl group-hover:scale-105 transition-transform flex-shrink-0">
            क
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold tracking-tight text-slate-900">
                KALA<span className="text-amber-600">SETU</span>
              </span>
              <span className="text-[11px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold border border-amber-200">
                {t('brandSub') || 'कलासेतु'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium hidden lg:block">
              {t('tagline') || 'Speak in your language. Connect to the right market.'}
            </p>
          </div>
        </div>

        {/* 🛡️ STRICT ROLE BADGE (No In-Session Switching - Must Log Out to Switch Role) */}
        {isAuthenticated ? (
          <div className="hidden sm:flex items-center">
            {activeRole === 'artisan' ? (
              <div 
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 shadow-sm"
                title="Active Artisan Seller Account. To access Buyer features, please log out first."
              >
                <div className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="leading-tight text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-amber-900">
                      {t('artisan') || 'Artisan Seller'}
                    </span>
                    <span className="text-[9px] bg-amber-200 text-amber-900 px-1 rounded font-bold uppercase tracking-wider">
                      Seller
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-700 block">
                    KalaSetu Seller Studio
                  </span>
                </div>
              </div>
            ) : (
              <div 
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-300 text-blue-900 shadow-sm"
                title="Active Buyer Account. To access Seller features, please log out first."
              >
                <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Store className="w-3.5 h-3.5" />
                </div>
                <div className="leading-tight text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-blue-900">
                      {t('buyer') || 'Buyer Portal'}
                    </span>
                    <span className="text-[9px] bg-blue-200 text-blue-900 px-1 rounded font-bold uppercase tracking-wider">
                      Buyer
                    </span>
                  </div>
                  <span className="text-[10px] text-blue-700 block">
                    Verified Ethical Marketplace
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => onOpenAuth('buyer')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold transition shadow-xs"
            >
              <Store className="w-3.5 h-3.5 text-blue-600" />
              <span>{t('buyer') || 'Buyer Portal'}</span>
            </button>
            <button
              onClick={() => onOpenAuth('artisan')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{t('artisan') || 'Artisan Seller'}</span>
            </button>
          </div>
        )}

        {/* Global Navigation Tabs (Filtered strictly by active role) */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-semibold text-slate-600">
          <button
            onClick={() => setCurrentTab('marketplace')}
            className={`px-2.5 py-1.5 rounded-lg transition ${
              currentTab === 'marketplace'
                ? 'bg-amber-50 text-amber-900 border border-amber-200 shadow-sm font-bold'
                : 'hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {activeRole === 'artisan' ? (t('marketplacePreview') || 'Marketplace Preview') : (t('marketplace') || 'Marketplace')}
          </button>

          {/* Artisan ONLY tabs - Never visible to Buyer */}
          {activeRole === 'artisan' && isAuthenticated && (
            <>
              <button
                onClick={() => setCurrentTab('ai-panel')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition ${
                  currentTab === 'ai-panel'
                    ? 'bg-amber-50 text-amber-900 border border-amber-200 shadow-sm font-bold'
                    : 'hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>{t('aiPanel') || 'AI Platform (Seller)'}</span>
              </button>

              <button
                onClick={() => setCurrentTab('artisan-inbox')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition ${
                  currentTab === 'artisan-inbox'
                    ? 'bg-amber-50 text-amber-900 border border-amber-200 shadow-sm font-bold'
                    : 'hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Inbox className="w-3.5 h-3.5 text-amber-600" />
                <span>{t('inquiries') || 'Inquiries'}</span>
              </button>
            </>
          )}

          {/* Connections tab - visible once authenticated */}
          {isAuthenticated && (
            <button
              onClick={() => setCurrentTab('connections')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition ${
                currentTab === 'connections'
                  ? 'bg-amber-50 text-amber-900 border border-amber-200 shadow-sm font-bold'
                  : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Link2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t('connections') || 'Connections'}</span>
            </button>
          )}
        </nav>

        {/* Action Controls: Notifications, Language, Voice, Cart, Profile */}
        <div className="flex items-center gap-2">
          {/* Notification Bell with Badge */}
          {isAuthenticated && (
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                title="Notifications"
                className="relative p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition"
              >
                <Bell className="w-4 h-4 text-slate-700" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Popover */}
              {isNotifOpen && (
                <div className="absolute right-0 top-10 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-fade-in">
                  <div className="bg-slate-900 text-white p-3 flex items-center justify-between text-xs font-bold">
                    <span>Notifications ({unreadCount} unread)</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (!n.is_read) markAsRead(n.id);
                            if (n.link_tab) {
                              if (activeRole === 'buyer' && (n.link_tab === 'ai-panel' || n.link_tab === 'artisan-inbox')) {
                                setCurrentTab('marketplace');
                              } else {
                                setCurrentTab(n.link_tab);
                              }
                            }
                            setIsNotifOpen(false);
                          }}
                          className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition ${
                            !n.is_read ? 'bg-amber-50/60 font-semibold' : 'text-slate-600'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-slate-900 font-bold block">{n.title}</span>
                            {!n.is_read && <span className="w-2 h-2 rounded-full bg-amber-600 flex-shrink-0 mt-1"></span>}
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                          <span className="text-[9px] text-slate-400 block mt-1">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* GLOBAL LANGUAGE SWITCHER */}
          <div className="relative flex items-center bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 hover:border-amber-500 transition shadow-sm">
            <Globe className="w-3.5 h-3.5 text-amber-600 mr-1 flex-shrink-0" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer pr-1"
              aria-label="Select Regional Language"
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.nativeLabel} ({l.label})
                </option>
              ))}
            </select>
          </div>

          {/* Global Voice Assistant Toggle */}
          <button
            onClick={toggleVoiceAssistant}
            title="Voice-first Assistant"
            className={`p-1.5 rounded-lg border transition flex items-center justify-center ${
              isVoiceActive
                ? 'bg-amber-600 text-white border-amber-700 animate-pulse'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
            }`}
          >
            {isVoiceActive ? <Mic className="w-4 h-4" /> : <Mic className="w-4 h-4 text-amber-700" />}
          </button>

          {/* Cart Icon (Buyer Mode Only) */}
          {(activeRole === 'buyer' || !isAuthenticated) && onOpenCart && (
            <button
              onClick={onOpenCart}
              title={t('cart') || 'Cart'}
              className="relative p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {/* User Status / Auth Button */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1 justify-end">
                  {activeRole === 'artisan' ? (t('artisan') || 'Artisan Seller') : (t('buyer') || 'Buyer')}
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{user?.phone}</span>
              </div>
              <button
                onClick={logout}
                title="Log out to switch accounts"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition shadow-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('logout') || 'Log Out'}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => onOpenAuth()}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow transition flex items-center gap-1.5"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>{t('login') || 'Register / Login'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
