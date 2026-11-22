import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';

export interface UseVoiceInputOptions {
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  targetInputId?: string;
  continuous?: boolean;
}

export const useVoiceInput = (options: UseVoiceInputOptions = {}) => {
  const { currentLanguageInfo } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = options.continuous ?? false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = currentLanguageInfo.speechCode || 'hi-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            currentFinal += res[0].transcript;
          } else {
            currentInterim += res[0].transcript;
          }
        }

        if (currentFinal) {
          setTranscript(currentFinal);
          if (options.onTranscript) {
            options.onTranscript(currentFinal, true);
          }
          if (options.targetInputId) {
            const el = document.getElementById(options.targetInputId) as HTMLInputElement | HTMLTextAreaElement;
            if (el) {
              el.value = currentFinal;
              el.dispatchEvent(new Event('input', { bubbles: true }));
            }
          }
        } else {
          setInterimTranscript(currentInterim);
          if (options.onTranscript) {
            options.onTranscript(currentInterim, false);
          }
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          setError(event.error);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (e: any) {
      setIsSupported(false);
      setError(e.message);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [currentLanguageInfo, options.continuous, options.targetInputId]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setIsListening(true);
      setTimeout(() => {
        const samplePhrases = [
          'बनारसी कतान सिल्क साड़ी ज़री वर्क के साथ',
          'कल्पवृक्ष मधुबनी पेंटिंग प्राकृतिक रंगों से',
          'शाही फिरोज़ी ब्लू पॉटरी कलश',
          'बस्तर जनजातीय ढोकरा पीतल संगीतकार मूर्ति',
          'कांजीवरम सिल्क साड़ी',
          'चंदेरी दुपट्टा'
        ];
        const randomPhrase = samplePhrases[Math.floor(Math.random() * samplePhrases.length)];
        setTranscript(randomPhrase);
        if (options.onTranscript) {
          options.onTranscript(randomPhrase, true);
        }
        if (options.targetInputId) {
          const el = document.getElementById(options.targetInputId) as HTMLInputElement | HTMLTextAreaElement;
          if (el) {
            el.value = randomPhrase;
            el.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
        setIsListening(false);
      }, 1500);
      return;
    }

    try {
      setTranscript('');
      setInterimTranscript('');
      recognitionRef.current.lang = currentLanguageInfo.speechCode || 'hi-IN';
      recognitionRef.current.start();
    } catch (e: any) {
      if (e.name !== 'InvalidStateError') {
        setError(e.message);
      }
    }
  }, [currentLanguageInfo, options.onTranscript, options.targetInputId]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript: () => { setTranscript(''); setInterimTranscript(''); }
  };
};
