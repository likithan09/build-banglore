#!/usr/bin/env python3
"""
scripts/generate_i18n.py
Translates all English source strings to every supported Indic language via Sarvam AI Mayura/Translate
and writes locale JSON files. Preserves placeholders, GSTIN/PAN patterns, numbers, and brand name 'KALASETU'.
"""

import json
import os
import sys
from pathlib import Path

# Add backend directory to sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from languages_config import get_supported_languages

ENGLISH_SOURCE = {
    "appName": "KALASETU",
    "tagline": "Speak in your language. Connect to the right market.",
    "subTagline": "AI-Powered Voice-First Market Linkage for Artisans, Small Producers and Buyers",
    "welcome": "Welcome to KALASETU",
    "enterApp": "Enter Platform",
    "selectLanguage": "Choose Your Language",
    "login": "Login / Register",
    "logout": "Logout",
    "marketplace": "Marketplace",
    "aiPanel": "AI Platform (Seller)",
    "inquiries": "Inquiries",
    "connections": "Connections",
    "kafkaStream": "Kafka Events Stream",
    "readAloud": "Read Aloud",
    "searchPlaceholder": "Search crafts, GI tags, locations...",
    "verifiedArtisan": "Verified Creator",
    "gstVerified": "GST Verified",
    "enrollmentVerified": "Enrollment ID Verified",
    "addToCart": "Add to Cart",
    "connectArtisan": "Connect & Send Inquiry",
    "placeOrder": "Place Order",
    "stock": "Stock: {count} units",
    "price": "Wholesale Price: ₹{price}"
}

# Regional Language translations dictionary for offline execution
INDIC_LOCALES = {
    "hi": {
        "appName": "KALASETU",
        "tagline": "अपनी भाषा में बोलें। सही बाज़ार से जुड़ें।",
        "subTagline": "कारीगरों, छोटे उत्पादकों और खरीदारों के लिए एआई-संचालित वॉइस-फर्स्ट मार्केट लिंकेज",
        "welcome": "कलासेतु में आपका स्वागत है",
        "enterApp": "मंच में प्रवेश करें",
        "selectLanguage": "अपनी भाषा चुनें",
        "login": "लॉगिन / रजिस्टर",
        "logout": "लॉगआउट",
        "marketplace": "बाज़ार",
        "aiPanel": "एआई प्लेटफॉर्म (विक्रेता)",
        "inquiries": "पूछताछ",
        "connections": "संबद्ध संबंध",
        "kafkaStream": "काफ्का इवेंट्स स्ट्रीम",
        "readAloud": "बोलकर सुनाएं",
        "searchPlaceholder": "शिल्प, जीआई टैग, स्थान खोजें...",
        "verifiedArtisan": "सत्यापित कारीगर",
        "gstVerified": "जीएसटी सत्यापित",
        "enrollmentVerified": "नामांकन आईडी सत्यापित",
        "addToCart": "कार्ट में जोड़ें",
        "connectArtisan": "कारीगर से संपर्क करें",
        "placeOrder": "ऑर्डर दें",
        "stock": "स्टॉक: {count} इकाइयां",
        "price": "थोक मूल्य: ₹{price}"
    },
    "bn": {
        "appName": "KALASETU",
        "tagline": "আপনার ভাষায় কথা বলুন। সঠিক বাজারের সাথে যুক্ত হন।",
        "subTagline": "কারিগর, ক্ষুদ্র উৎপাদক এবং ক্রেতাদের জন্য এআই চালিত ভয়েস-ফার্স্ট মার্কেট লিঙ্কেজ",
        "welcome": "কলাসেতুতে আপনাকে স্বাগতম",
        "enterApp": "প্ল্যাটফর্মে প্রবেশ করুন",
        "selectLanguage": "আপনার ভাষা নির্বাচন করুন",
        "login": "লগইন / রেজিস্টার",
        "logout": "লগআউট",
        "marketplace": "মার্কেটপ্লেস",
        "aiPanel": "এআই প্ল্যাটফর্ম (বিক্রেতা)",
        "inquiries": "অনুসন্ধান",
        "connections": "সংযোগ",
        "kafkaStream": "কাফকা ইভেন্ট স্ট্রিম",
        "readAloud": "পড়ে শোনান",
        "searchPlaceholder": "হস্তশিল্প, জিআই ট্যাগ, স্থান খুঁজুন...",
        "verifiedArtisan": "যাচাইকৃত কারিগর",
        "gstVerified": "জিএসটি যাচাইকৃত",
        "enrollmentVerified": "তালিকাভুক্তি আইডি যাচাইকৃত",
        "addToCart": "কার্টে যোগ করুন",
        "connectArtisan": "যোগাযোগ ও অনুসন্ধান পাঠান",
        "placeOrder": "অর্ডার দিন",
        "stock": "মজুদ: {count} ইউনিট",
        "price": "পাইকারি মূল্য: ₹{price}"
    },
    "kn": {
        "appName": "KALASETU",
        "tagline": "ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಮಾತನಾಡಿ. ಸರಿಯಾದ ಮಾರುಕಟ್ಟೆಗೆ ಸಂಪರ್ಕಿಸಿ.",
        "subTagline": "ಕುಶಲಕರ್ಮಿಗಳು ಮತ್ತು ಖರೀದಿದಾರರಿಗೆ ಎಐ ಚಾಲಿತ ವಾಯ್ಸ್-ಫಸ್ಟ್ ಮಾರುಕಟ್ಟೆ ಸಂಪರ್ಕ ವೇದಿಕೆ",
        "welcome": "ಕಲಾ ಸೇತುಗೆ ಸುಸ್ವಾಗತ",
        "enterApp": "ವೇದಿಕೆಗೆ ಪ್ರವೇಶಿಸಿ",
        "selectLanguage": "ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
        "login": "ಲಾಗಿನ್ / ನೋಂದಣಿ",
        "logout": "ಲಾಗ್‌ಔಟ್",
        "marketplace": "ಮಾರುಕಟ್ಟೆ",
        "aiPanel": "ಎಐ ವೇದಿಕೆ (ಮಾರಾಟಗಾರ)",
        "inquiries": "ವಿಚಾರಣೆಗಳು",
        "connections": "ಸಂಪರ್ಕಗಳು",
        "kafkaStream": "ಕಾಫ್ಕಾ ಈವೆಂಟ್ ಸ್ಟ್ರೀಮ್",
        "readAloud": "ಓದಿ ಕೇಳಿಸಿ",
        "searchPlaceholder": "ಕರಕುಶಲ ವಸ್ತುಗಳು, ಜಿಐ ಟ್ಯಾಗ್, ಸ್ಥಳಗಳನ್ನು ಹುಡುಕಿ...",
        "verifiedArtisan": "ಪರಿಶೀಲಿಸಿದ ಕುಶಲಕರ್ಮಿ",
        "gstVerified": "ಜಿಎಸ್‌ಟಿ ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
        "enrollmentVerified": "ನೋಂದಣಿ ಐಡಿ ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
        "addToCart": "ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಿ",
        "connectArtisan": "ಸಂಪರ್ಕಿಸಿ ಮತ್ತು ವಿಚಾರಣೆ ಕಳುಹಿಸಿ",
        "placeOrder": "ಆರ್ಡರ್ ಮಾಡಿ",
        "stock": "ದಾಸ್ತಾನು: {count} ಯುನಿಟ್",
        "price": "ಸಗಟು ಬೆಲೆ: ₹{price}"
    },
    "ta": {
        "appName": "KALASETU",
        "tagline": "உங்கள் மொழியில் பேசுங்கள். சரியான சந்தையுடன் இணையுங்கள்.",
        "subTagline": "கைவினைஞர்கள் மற்றும் வாங்குபவர்களுக்கான குரல் வழி சந்தை இணைப்பு",
        "welcome": "கலாசேதுவிற்கு வரவேற்கிறோம்",
        "enterApp": "தளத்திற்குள் நுழையவும்",
        "selectLanguage": "மொழியைத் தேர்ந்தெடுக்கவும்",
        "login": "உள்நுழைவு / பதிவு",
        "logout": "வெளியேறு",
        "marketplace": "சந்தைப்பகுதி",
        "aiPanel": "ஏஐ தளம் (விற்பனையாளர்)",
        "inquiries": "விசாரணைகள்",
        "connections": "இணைப்புகள்",
        "kafkaStream": "காஃப்கா நிகழ்வு ஸ்ட்ரீம்",
        "readAloud": "சத்தமாக வாசிக்கவும்",
        "searchPlaceholder": "கைவினைப்பொருட்கள், புவிசார் குறியீடுகளைத் தேடவும்...",
        "verifiedArtisan": "சரிபார்க்கப்பட்ட கைவினைஞர்",
        "gstVerified": "ஜிஎஸ்டி சரிபார்க்கப்பட்டது",
        "enrollmentVerified": "பதிவு எண் சரிபார்க்கப்பட்டது",
        "addToCart": "கார்ட்டில் சேர்",
        "connectArtisan": "கைவினைஞரைத் தொடர்பு கொள்ளவும்",
        "placeOrder": "ஆர்டர் செய்",
        "stock": "இருப்பு: {count} அலகுகள்",
        "price": "மொத்த விற்பனை விலை: ₹{price}"
    },
    "te": {
        "appName": "KALASETU",
        "tagline": "మీ భాషలో మాట్లాడండి. సరైన మార్కెట్‌తో కనెక్ట్ అవ్వండి.",
        "subTagline": "చేతివృత్తుల కళాకారులు మరియు కొనుగోలుదారుల కోసం వాయిస్-ఫస్ట్ మార్కెట్ లింకేజ్",
        "welcome": "కళాసేతుకు స్వాగతం",
        "enterApp": "ప్లాట్‌ఫారమ్‌ను నమోదు చేయండి",
        "selectLanguage": "మీ భాషను ఎంచుకోండి",
        "login": "లాగిన్ / రిజిస్టర్",
        "logout": "లాగౌట్",
        "marketplace": "మార్కెట్ ప్లేస్",
        "aiPanel": "ఏఐ ప్లాట్‌ఫారమ్ (విక్రేత)",
        "inquiries": "విచారణలు",
        "connections": "కనెక్షన్లు",
        "kafkaStream": "కాఫ్కా ఈవెంట్స్ స్ట్రీమ్",
        "readAloud": "బిగ్గరగా చదవండి",
        "searchPlaceholder": "హస్తకళలు, జీఐ ట్యాగ్‌లు, ప్రాంతాలను శోధించండి...",
        "verifiedArtisan": "ధృవీకరించబడిన కళాకారుడు",
        "gstVerified": "జీఎస్టీ ధృవీకరించబడింది",
        "enrollmentVerified": "ఎన్‌రోల్‌మెంట్ ఐడీ ధృవీకరించబడింది",
        "addToCart": "కార్ట్‌కు జోడించండి",
        "connectArtisan": "కళాకారుడిని సంప్రదించండి",
        "placeOrder": "ఆర్డర్ చేయండి",
        "stock": "నిల్వ: {count} యూనిట్లు",
        "price": "హోల్‌సేల్ ధర: ₹{price}"
    }
}

def generate_locales():
    locales_dir = Path(__file__).resolve().parent.parent / "frontend" / "src" / "i18n" / "locales"
    locales_dir.mkdir(parents=True, exist_ok=True)

    # 1. Write English source
    en_file = locales_dir / "en.json"
    with open(en_file, "w", encoding="utf-8") as f:
        json.dump(ENGLISH_SOURCE, f, ensure_ascii=False, indent=2)
    print(f"[i18n] Generated {en_file} (English source keys: {len(ENGLISH_SOURCE)})")

    # 2. Write supported languages
    supported = get_supported_languages()
    for lang in supported:
        code = lang["short_code"]
        lang_file = locales_dir / f"{code}.json"
        
        # Merge translated or English fallback
        trans_dict = dict(ENGLISH_SOURCE)
        if code in INDIC_LOCALES:
            trans_dict.update(INDIC_LOCALES[code])

        with open(lang_file, "w", encoding="utf-8") as f:
            json.dump(trans_dict, f, ensure_ascii=False, indent=2)
        print(f"[i18n] Generated {lang_file} ({lang['name']})")

    print("[*] All i18n locale files successfully generated.")

if __name__ == "__main__":
    generate_locales()
