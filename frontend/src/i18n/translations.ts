import { LanguageCode, LanguageInfo } from '../types';

import en from './locales/en.json';
import hi from './locales/hi.json';
import kn from './locales/kn.json';
import ta from './locales/ta.json';
import te from './locales/te.json';
import bn from './locales/bn.json';
import mr from './locales/mr.json';
import gu from './locales/gu.json';
import ml from './locales/ml.json';
import pa from './locales/pa.json';
import orLocale from './locales/or.json';
import asLocale from './locales/as.json';
import ur from './locales/ur.json';

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', speechCode: 'en-IN' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', speechCode: 'hi-IN' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ', speechCode: 'kn-IN' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்', speechCode: 'ta-IN' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు', speechCode: 'te-IN' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা', speechCode: 'bn-IN' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी', speechCode: 'mr-IN' },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી', speechCode: 'gu-IN' },
  { code: 'ml', label: 'Malayalam', nativeLabel: 'മലയാളം', speechCode: 'ml-IN' },
  { code: 'pa', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ', speechCode: 'pa-IN' },
  { code: 'or', label: 'Odia', nativeLabel: 'ଓଡ଼ିଆ', speechCode: 'od-IN' },
  { code: 'od', label: 'Odia', nativeLabel: 'ଓଡ଼ିଆ', speechCode: 'od-IN' },
  { code: 'as', label: 'Assamese', nativeLabel: 'অসমীয়া', speechCode: 'as-IN' },
  { code: 'ur', label: 'Urdu', nativeLabel: 'اردو', speechCode: 'ur-IN' }
];

export const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: en as Record<string, string>,
  hi: hi as Record<string, string>,
  kn: kn as Record<string, string>,
  ta: ta as Record<string, string>,
  te: te as Record<string, string>,
  bn: bn as Record<string, string>,
  mr: mr as Record<string, string>,
  gu: gu as Record<string, string>,
  ml: ml as Record<string, string>,
  pa: pa as Record<string, string>,
  or: orLocale as Record<string, string>,
  od: orLocale as Record<string, string>,
  as: asLocale as Record<string, string>,
  ur: ur as Record<string, string>
};
