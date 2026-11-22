import React from 'react';
import { Sparkles, ArrowRight, Volume2, Globe, ShieldCheck, HeartHandshake, Mic } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useVoiceOutput } from '../../hooks/useVoiceOutput';
import { SUPPORTED_LANGUAGES } from '../../i18n/translations';

interface SplashScreenProps {
  onEnter: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onEnter }) => {
  const { language, setLanguage, currentLanguageInfo, t } = useLanguage();
  const { speak, isSpeaking, stop } = useVoiceOutput();

  const handlePlayTagline = () => {
    if (isSpeaking) {
      stop();
    } else {
      const greeting = `${t('appName')}. ${t('tagline')}. ${t('subTagline')}`;
      speak(greeting, currentLanguageInfo.speechCode);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fbf7ee] via-[#f7edd4] to-[#faeacf] flex flex-col justify-between p-6 md:p-12 relative overflow-hidden">
      {/* Decorative Traditional Indian Mandalas & Accents */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-amber-300/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-orange-300/20 blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between z-10">
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-amber-300 shadow-sm text-xs font-bold text-amber-900">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>NATIONAL VOICE-FIRST MARKET LINKAGE PLATFORM</span>
        </div>

        <button
          onClick={handlePlayTagline}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition shadow-sm ${
            isSpeaking ? 'bg-amber-600 text-white animate-pulse' : 'bg-white/80 hover:bg-white text-slate-800 border border-amber-300'
          }`}
        >
          <Volume2 className="w-4 h-4 text-amber-600" />
          <span>{isSpeaking ? t('stopAudio') : t('audioNarration')}</span>
        </button>
      </div>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center my-auto py-12 z-10 space-y-6">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-700 via-orange-600 to-amber-500 text-white font-black text-5xl shadow-2xl shadow-amber-600/30 border-4 border-white mb-2">
          क
        </div>

        <div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-slate-900 tracking-tight font-sans">
            {t('appName')}
          </h1>
          <div className="mt-4 inline-block bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl px-6 py-3">
            <h2 className="text-xl sm:text-3xl font-extrabold text-amber-950 font-serif italic">
              "{t('tagline')}"
            </h2>
          </div>
        </div>

        <p className="text-base sm:text-lg text-slate-700 max-w-2xl mx-auto font-medium">
          {t('subTagline')}
        </p>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 max-w-3xl mx-auto text-left">
          <div className="bg-white/80 backdrop-blur p-4 rounded-xl border border-amber-200 shadow-sm flex items-start gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Voice-Driven</h3>
              <p className="text-xs text-slate-600 mt-0.5">Speak naturally in your mother tongue to search, list, and bargain.</p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur p-4 rounded-xl border border-amber-200 shadow-sm flex items-start gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Verified & Fair</h3>
              <p className="text-xs text-slate-600 mt-0.5">GST & PAN verified direct linkage with AI fair artisan pricing.</p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur p-4 rounded-xl border border-amber-200 shadow-sm flex items-start gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-800 rounded-lg">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Real-Time Chat</h3>
              <p className="text-xs text-slate-600 mt-0.5">Live multilingual bargaining mediator breaking all language barriers.</p>
            </div>
          </div>
        </div>

        {/* Language Selection Grid */}
        <div className="pt-6">
          <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center justify-center gap-1.5">
            <Globe className="w-4 h-4 text-amber-700" />
            <span>{t('selectLanguage')}</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
            {SUPPORTED_LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition duration-150 flex items-center gap-1.5 shadow-sm ${
                  language === l.code
                    ? 'bg-amber-600 text-white scale-105 shadow-md shadow-amber-600/30'
                    : 'bg-white/90 hover:bg-white text-slate-800 border border-amber-200 hover:border-amber-400'
                }`}
              >
                <span className="text-sm">{l.nativeLabel}</span>
                <span className="text-[10px] opacity-75 font-mono">({l.label})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Enter Platform CTA */}
        <div className="pt-8">
          <button
            onClick={onEnter}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-extrabold text-base sm:text-lg px-8 py-4 rounded-2xl shadow-xl shadow-amber-600/30 hover:scale-105 transition-all duration-200"
          >
            <span>{t('enterApp')}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl w-full mx-auto text-center text-xs text-slate-500 z-10 border-t border-amber-200/60 pt-4">
        © 2026 KALASETU. Empowering Indian Artisans, Small Producers & Fair Trade Markets.
      </div>
    </div>
  );
};
