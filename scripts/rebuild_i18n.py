import json
import os

locales_dir = 'frontend/src/i18n/locales'

extra_keys = {
    'en': {
        'discoverArtisansTitle': 'Discover Verified Artisans Across India',
        'discoverArtisansSubtitle': 'Typo-tolerant multi-lingual search across certified handlooms, GI-tagged crafts, and direct artisan producer clusters.',
        'poweredBySearch': 'Powered by Aiven OpenSearch Fuzzy Discovery',
        'allCrafts': 'All Crafts',
        'liveStockAndOrders': 'Live Stock & Order Management',
        'inventoryMetrics': 'Artisan Workshop Inventory & Revenue',
        'sellerOrders': 'Incoming Buyer Purchase Orders',
        'updateStatus': 'Update Status',
        'statusConfirmed': 'Confirmed',
        'statusPacked': 'Packed',
        'statusShipped': 'Shipped',
        'statusDelivered': 'Delivered',
        'statusCancelled': 'Cancelled',
        'openAddProductModalBtn': '+ Add New Craft Product (AI Vision)',
    },
    'hi': {
        'discoverArtisansTitle': 'भारत भर के सत्यापित कारीगरों को खोजें',
        'discoverArtisansSubtitle': 'प्रमाणित हथकरघा, जीआई-टैग वाले शिल्प और प्रत्यक्ष कारीगर उत्पादक समूहों में बहुभाषी खोज।',
        'poweredBySearch': 'Aiven OpenSearch फ़ज़ी खोज द्वारा संचालित',
        'allCrafts': 'सभी शिल्प',
        'liveStockAndOrders': 'लाइव स्टॉक एवं ऑर्डर प्रबंधन',
        'inventoryMetrics': 'कारीगर कार्यशाला इन्वेंटरी एवं राजस्व',
        'sellerOrders': 'खरीदार के खरीद आदेश',
        'updateStatus': 'स्थिति अपडेट करें',
        'statusConfirmed': 'पुष्ट (Confirmed)',
        'statusPacked': 'पैक किया गया (Packed)',
        'statusShipped': 'भेज दिया गया (Shipped)',
        'statusDelivered': 'वितरित (Delivered)',
        'statusCancelled': 'रद्द (Cancelled)',
        'openAddProductModalBtn': '+ नया शिल्प उत्पाद जोड़ें (AI विज़न)',
    },
    'kn': {
        'discoverArtisansTitle': 'ಭಾರತದಾದ್ಯಂತ ಪರಿಶೀಲಿಸಿದ ಕುಶಲಕರ್ಮಿಗಳನ್ನು ಅನ್ವೇಷಿಸಿ',
        'discoverArtisansSubtitle': 'ಪ್ರಮಾಣೀಕೃತ ಕೈಮಗ್ಗಗಳು, GI-ಟ್ಯಾಗ್ ಮಾಡಲಾದ ಕರಕುಶಲ ವಸ್ತುಗಳು ಮತ್ತು ನೇರ ಕುಶಲಕರ್ಮಿ ಸಮೂಹಗಳಲ್ಲಿ ಬಹುಭಾಷಾ ಹುಡುಕಾಟ.',
        'poweredBySearch': 'Aiven OpenSearch ಫಜಿ ಅನ್ವೇಷಣೆಯಿಂದ ಚಾಲಿತವಾಗಿದೆ',
        'allCrafts': 'ಎಲ್ಲಾ ಕರಕುಶಲ ವಸ್ತುಗಳು',
        'liveStockAndOrders': 'ಲೈವ್ ಸ್ಟಾಕ್ ಮತ್ತು ಆರ್ಡರ್ ನಿರ್ವಹಣೆ',
        'inventoryMetrics': 'ಕುಶಲಕರ್ಮಿಗಳ ದಾಸ್ತಾನು ಮತ್ತು ಆದಾಯ',
        'sellerOrders': 'ಬಂದಿರುವ ಖರೀದಿ ಆರ್ಡರ್‌ಗಳು',
        'updateStatus': 'ಸ್ಥಿತಿ ನವೀಕರಿಸಿ',
        'statusConfirmed': 'ದೃಢೀಕರಿಸಲಾಗಿದೆ',
        'statusPacked': 'ಪ್ಯಾಕ್ ಮಾಡಲಾಗಿದೆ',
        'statusShipped': 'ರವಾನಿಸಲಾಗಿದೆ',
        'statusDelivered': 'ತಲುಪಿಸಲಾಗಿದೆ',
        'statusCancelled': 'ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ',
        'openAddProductModalBtn': '+ ಹೊಸ ಉತ್ಪನ್ನವನ್ನು ಸೇರಿಸಿ (AI ವಿಷನ್)',
    },
    'ta': {
        'discoverArtisansTitle': 'இந்தியா முழுவதிலும் உள்ள சரிபார்க்கப்பட்ட கைவினைஞர்களைக் கண்டறியுங்கள்',
        'discoverArtisansSubtitle': 'சான்றளிக்கப்பட்ட கைத்தறிகள், புவிசார் குறியீடு பெற்ற கைவினைப் பொருட்கள் மற்றும் நேரடி கைவினைஞர் உற்பத்தியாளர் குழுக்களில் பலமொழி தேடல்.',
        'poweredBySearch': 'Aiven OpenSearch தேடலால் இயக்கப்படுகிறது',
        'allCrafts': 'அனைத்து கைவினைப்பொருட்கள்',
        'liveStockAndOrders': 'நேரடி இருப்பு மற்றும் ஆர்டர் மேலாண்மை',
        'inventoryMetrics': 'கைவினைஞர் பணிமனை இருப்பு மற்றும் வருவாய்',
        'sellerOrders': 'வாங்குபவரின் கொள்முதல் ஆர்டர்கள்',
        'updateStatus': 'நிலையைப் புதுப்பிக்கவும்',
        'statusConfirmed': 'உறுதிப்படுத்தப்பட்டது',
        'statusPacked': 'பேக் செய்யப்பட்டது',
        'statusShipped': 'அனுப்பப்பட்டது',
        'statusDelivered': 'டெலிவரி செய்யப்பட்டது',
        'statusCancelled': 'ரத்து செய்யப்பட்டது',
        'openAddProductModalBtn': '+ புதிய தயாரிப்பைச் சேர் (AI விஷன்)',
    },
    'te': {
        'discoverArtisansTitle': 'భారతదేశం అంతటా ధృవీకరించబడిన కళాకారులను కనుగొనండి',
        'discoverArtisansSubtitle': 'ధృవీకరించబడిన చేనేత వస్త్రాలు, GI-ట్యాగ్ చేయబడిన చేతిపనులు మరియు ప్రత్యక్ష కళాకారుల సమూహాలలో బహుభాషా శోధన.',
        'poweredBySearch': 'Aiven OpenSearch ఫజ్జీ సెర్చ్ ద్వారా ఆధారితం',
        'allCrafts': 'అన్ని చేతిపనులు',
        'liveStockAndOrders': 'లైవ్ స్టాక్ మరియు ఆర్డర్ నిర్వహణ',
        'inventoryMetrics': 'కళాకారుల వర్క్‌షాప్ ఇన్వెంటరీ మరియు ఆదాయం',
        'sellerOrders': 'కొనుగోలుదారుల ఆర్డర్లు',
        'updateStatus': 'స్థితిని నవీకరించండి',
        'statusConfirmed': 'ధృవీకరించబడింది',
        'statusPacked': 'ప్యాక్ చేయబడింది',
        'statusShipped': 'రవాణా చేయబడింది',
        'statusDelivered': 'డెలివరీ చేయబడింది',
        'statusCancelled': 'రద్దు చేయబడింది',
        'openAddProductModalBtn': '+ కొత్త చేతిపని ఉత్పత్తిని జోడించండి (AI విజన్)',
    },
    'bn': {
        'discoverArtisansTitle': 'ভারত জুড়ে যাচাইকৃত কারিগরদের আবিষ্কার করুন',
        'discoverArtisansSubtitle': 'প্রত্যয়িত তাঁত, জিআই-ট্যাগযুক্ত কারুশিল্প এবং প্রত্যক্ষ কারিগর ক্লাস্টারে বহুভাষিক অনুসন্ধান।',
        'poweredBySearch': 'Aiven OpenSearch ফাজি ডিসকভারি দ্বারা চালিত',
        'allCrafts': 'সমস্ত কারুশিল্প',
        'liveStockAndOrders': 'লাইভ স্টক এবং অর্ডার পরিচালনা',
        'inventoryMetrics': 'কারিগর ওয়ার্কশপ ইনভেন্টরি এবং আয়',
        'sellerOrders': 'ক্রেতাদের ক্রয় আদেশ',
        'updateStatus': 'স্ট্যাটাস আপডেট করুন',
        'statusConfirmed': 'নিশ্চিত',
        'statusPacked': 'প্যাক করা হয়েছে',
        'statusShipped': 'পাঠানো হয়েছে',
        'statusDelivered': 'বিতরিত',
        'statusCancelled': 'বাতিল',
        'openAddProductModalBtn': '+ নতুন কারুশিল্প পণ্য যোগ করুন (AI দৃষ্টি)',
    }
}

# Update all locale JSON files
for f in os.listdir(locales_dir):
    if f.endswith('.json'):
        lang = f.replace('.json', '')
        filepath = os.path.join(locales_dir, f)
        with open(filepath, 'r', encoding='utf-8') as jf:
            data = json.load(jf)
        
        # Merge extra keys
        to_add = extra_keys.get(lang, extra_keys['en'])
        for k, v in to_add.items():
            if k not in data:
                data[k] = v
        # Also ensure all en keys exist
        for k, v in extra_keys['en'].items():
            if k not in data:
                data[k] = v
                
        with open(filepath, 'w', encoding='utf-8') as jf:
            json.dump(data, jf, ensure_ascii=False, indent=2)

print('Updated all locale JSON files!')

# Write clean translations.ts importing all JSONs
translations_ts = '''import { LanguageCode, LanguageInfo } from '../types';

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
'''

with open('frontend/src/i18n/translations.ts', 'w', encoding='utf-8') as f:
    f.write(translations_ts)

print('Generated clean frontend/src/i18n/translations.ts successfully!')
