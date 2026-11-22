import { useState, useCallback, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export const useVoiceOutput = () => {
  const { currentLanguageInfo } = useLanguage();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      setVoices(available);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const speak = useCallback((text: string, langCode?: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported.');
      return;
    }

    window.speechSynthesis.cancel();

    const targetLang = langCode || currentLanguageInfo.speechCode || 'hi-IN';
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = targetLang;
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const matchingVoice = voices.find((v) => v.lang === targetLang || v.lang.startsWith(targetLang.split('-')[0]));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [currentLanguageInfo, voices]);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return { speak, stop, isSpeaking };
};
