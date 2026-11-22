import React from 'react';
import { Mic, MicOff, Volume2, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface VoiceVisualizerProps {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  onStop: () => void;
  onSearchSubmit?: (query: string) => void;
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({
  isListening,
  transcript,
  interimTranscript,
  onStop,
  onSearchSubmit
}) => {
  const { currentLanguageInfo, t } = useLanguage();

  if (!isListening && !transcript) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full bg-slate-900 text-white p-5 rounded-2xl shadow-2xl border-2 border-amber-500 animate-in fade-in slide-in-from-bottom-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center animate-pulse">
              <Mic className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900" />
          </div>
          <div>
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              {currentLanguageInfo.nativeLabel} ({currentLanguageInfo.label}) Speech Recognition
            </div>
            <div className="text-xs text-slate-300">
              {isListening ? t('voiceListening') : t('voiceInputReliable')}
            </div>
          </div>
        </div>

        <button
          onClick={onStop}
          className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Waveform Bars */}
      {isListening && (
        <div className="flex items-center justify-center gap-1.5 my-3 h-8 bg-slate-950/60 rounded-lg px-4">
          {[40, 70, 90, 60, 100, 50, 80, 65, 95, 45, 85, 55].map((h, i) => (
            <div
              key={i}
              className="w-1.5 bg-gradient-to-t from-amber-500 to-orange-400 rounded-full transition-all duration-150 animate-pulse"
              style={{
                height: `${Math.max(15, Math.floor(h * Math.random()))}%`,
                animationDelay: `${i * 80}ms`
              }}
            />
          ))}
        </div>
      )}

      {/* Spoken Text Output */}
      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-sm font-medium min-h-[48px] flex items-center">
        {transcript || interimTranscript ? (
          <p className="text-emerald-300">
            <span>{transcript}</span>
            <span className="text-slate-400 italic"> {interimTranscript}</span>
          </p>
        ) : (
          <span className="text-slate-500 text-xs italic">
            {t('speakSearchPlaceholder')}
          </span>
        )}
      </div>

      {transcript && onSearchSubmit && (
        <div className="mt-3 flex justify-end gap-2">
          <button
            onClick={() => onSearchSubmit(transcript)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-4 py-1.5 rounded-lg transition shadow"
          >
            Apply Query
          </button>
        </div>
      )}
    </div>
  );
};
