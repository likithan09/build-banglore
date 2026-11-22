import json
import os

locales_dir = 'frontend/src/i18n/locales'

kn_full = {
    "subTagline": "ಕುಶಲಕರ್ಮಿಗಳು, ಸಣ್ಣ ಉತ್ಪಾದಕರು ಮತ್ತು ಖರೀದಿದಾರರಿಗೆ AI-ಚಾಲಿತ ಧ್ವನಿ-ಮೊದಲ ಮಾರುಕಟ್ಟೆ ಸಂಪರ್ಕ",
    "sellerOnboardingTitle": "ಮಾರಾಟಗಾರ ಮತ್ತು ಕುಶಲಕರ್ಮಿಗಳ ಅನುಸರಣೆ ನೋಂದಣಿ",
    "stepAuth": "1. ದೃಢೀಕರಣ",
    "stepCompliance": "2. ಜಿಎಸ್‌ಟಿ / ನೋಂದಣಿ ಪರಿಶೀಲನೆ",
    "stepProfile": "3. ಕುಶಲಕರ್ಮಿ ಪ್ರೊಫೈಲ್ ಪರಿಶೀಲನಾ ಪಟ್ಟಿ",
    "stepAiPlatform": "4. AI-ಚಾಲಿತ ವೇದಿಕೆ",
    "regulatoryVerificationTitle": "ಹಂತ 1: ನಿಯಂತ್ರಕ ಪರಿಶೀಲನೆ (GSTIN ಅಥವಾ ನೋಂದಣಿ ಐಡಿ)",
    "regulatoryVerificationDesc": "ಭಾರತೀಯ ಇ-ಕಾಮರ್ಸ್ ಮಾರುಕಟ್ಟೆ ನಿಯಮಾವಳಿಗಳಿಗೆ ಅನುಗುಣವಾಗಿ, ಎಲ್ಲಾ ಮಾರಾಟಗಾರರು ತಮ್ಮ GSTIN ಅಥವಾ ವೇದಿಕೆ ನೀಡಿದ GST ನೋಂದಣಿ ಐಡಿಯನ್ನು ಪರಿಶೀಲಿಸಬೇಕು.",
    "haveGstQuestion": "ನಿಮ್ಮ ಕರಕುಶಲ ವ್ಯವಹಾರಕ್ಕಾಗಿ ಜಿಎಸ್‌ಟಿ ಸಂಖ್ಯೆ (GSTIN) ಇದೆಯೇ?",
    "haveGstYes": "ಹೌದು, ನನ್ನ ಬಳಿ GSTIN ಇದೆ",
    "haveGstYesDesc": "ನೋಂದಾಯಿತ ವ್ಯವಹಾರಗಳು, ಸಹಕಾರಿ ಸಂಘಗಳು ಮತ್ತು ವಾಣಿಜ್ಯ ಕುಶಲಕರ್ಮಿಗಳಿಗಾಗಿ",
    "haveGstNo": "ಇಲ್ಲ, ನನಗೆ ಜಿಎಸ್‌ಟಿ ನೋಂದಣಿ ಐಡಿ ಬೇಕು (ಅಂಚಿನಲ್ಲಿರುವವರಿಗೆ)",
    "haveGstNoDesc": "ಅಸಂಘಟಿತ ಗ್ರಾಮೀಣ ಕುಶಲಕರ್ಮಿಗಳು, ಬುಡಕಟ್ಟು ಉತ್ಪಾದಕರು ಮತ್ತು ಸಣ್ಣ ತಯಾರಕರಿಗಾಗಿ",
    "enterGstinLabel": "15-ಅಂಕಿಯ GSTIN ನಮೂದಿಸಿ:",
    "verifyGstinBtn": "ಸ್ಯಾಂಡ್‌ಬಾಕ್ಸ್ API ಮೂಲಕ GSTIN ಪರಿಶೀಲಿಸಿ",
    "gstVerifiedCardTitle": "ಅಧಿಕೃತ GSTIN ಅನುಸರಣೆ ದಾಖಲೆ",
    "proceedToStep2": "ಹಂತ 2 ಕ್ಕೆ ಮುಂದುವರಿಯಿರಿ: ಕುಶಲಕರ್ಮಿ ಪ್ರೊಫೈಲ್",
    "enrollmentFormTitle": "ಅಂಚಿನಲ್ಲಿರುವ ಕುಶಲಕರ್ಮಿಗಳಿಗೆ ಜಿಎಸ್‌ಟಿ ನೋಂದಣಿ ಐಡಿ",
    "enrollmentFormDesc": "ಮಿತಿ ಮಟ್ಟಕ್ಕಿಂತ ಕೆಳಗಿರುವ ಕುಶಲಕರ್ಮಿಗಳಿಗಾಗಿ ವೇದಿಕೆ ನೀಡಿದ ಸಿಮ್ಯುಲೇಟೆಡ್ ನೋಂದಣಿ ಐಡಿ.",
    "panLabel": "ಖಾಯಂ ಖಾತೆ ಸಂಖ್ಯೆ (PAN):",
    "emailLabel": "ಇಮೇಲ್ ವಿಳಾಸ:",
    "addressLabel": "ಕಾರ್ಯಾಗಾರ / ಕ್ಲಸ್ಟರ್ ವಿಳಾಸ:",
    "initiateEnrollmentBtn": "ನೋಂದಣಿ ಐಡಿ ರಚಿಸಿ",
    "orUseDemoApp": "ಅಥವಾ ಬಾಹ್ಯ ಪೋರ್ಟಲ್ ಬಳಸಿ",
    "openDemoAppBtn": "5173 ಪೋರ್ಟಲ್ ತೆರೆಯಿರಿ",
    "manualEnrollmentLabel": "ಅಥವಾ ನಿಮ್ಮ 15-ಅಂಕಿಯ ನೋಂದಣಿ ಐಡಿಯನ್ನು ಹಸ್ತಚಾಲಿತವಾಗಿ ನಮೂದಿಸಿ:",
    "verifyManualEnrollmentBtn": "ನೋಂದಣಿ ಐಡಿ ಪರಿಶೀಲಿಸಿ",
    "trackingEnrollmentTitle": "ನೋಂದಣಿ ಪ್ರಕ್ರಿಯೆಯಲ್ಲಿದೆ...",
    "statusPending": "ಬಾಕಿ ಉಳಿದಿದೆ (ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ)",
    "statusVerified": "ಪರಿಶೀಲಿಸಲಾಗಿದೆ ಮತ್ತು ಸಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ",
    "artisanProfileTitle": "ಹಂತ 2: ಕುಶಲಕರ್ಮಿ ಪ್ರೊಫೈಲ್ ಪರಿಶೀಲನಾ ಪಟ್ಟಿ",
    "artisanProfileDesc": "ಖರೀದಿದಾರರು ನಿಮ್ಮ ಪರಂಪರೆ ಮತ್ತು ಸಾಮರ್ಥ್ಯವನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ನಿಮ್ಮ ಕರಕುಶಲ ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ.",
    "craftNameLabel": "ಪ್ರಾಥಮಿಕ ಕರಕುಶಲ ಹೆಸರು:",
    "craftCategoryLabel": "ಕರಕುಶಲ ವರ್ಗ:",
    "artisanBioLabel": "ಕುಶಲಕರ್ಮಿಗಳ ಜೀವನಚರಿತ್ರೆ ಮತ್ತು ಪರಂಪರೆಯ ಕಥೆ:",
    "capacityLabel": "ತಿಂಗಳಿಗೆ ಉತ್ಪಾದನಾ ಸಾಮರ್ಥ್ಯ (ಘಟಕಗಳು):",
    "completeProfileBtn": "ಪ್ರೊಫೈಲ್ ಪೂರ್ಣಗೊಳಿಸಿ ಮತ್ತು AI ಪರಿಕರಗಳನ್ನು ಅನ್‌ಲಾಕ್ ಮಾಡಿ",
    "profileSuccessTitle": "ಅನುಸರಣೆ ಪರಿಶೀಲನೆ ಪೂರ್ಣಗೊಂಡಿದೆ!",
    "profileSuccessDesc": "ನಿಮ್ಮ ವ್ಯಾಪಾರವನ್ನು ಸರ್ಕಾರಿ ಇ-ಕಾಮರ್ಸ್ ನಿಯಮಗಳ ಅಡಿಯಲ್ಲಿ ಪರಿಶೀಲಿಸಲಾಗಿದೆ. ಮಾರುಕಟ್ಟೆ ಸಿದ್ಧತೆಗೆ ಮುಂದುವರಿಯಿರಿ.",
    "openAiPlatformBtn": "AI ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ತೆರೆಯಿರಿ (ಮಾರಾಟಗಾರ)",
    "aiPlatformTitle": "ಕುಶಲಕರ್ಮಿಗಳಿಗಾಗಿ 6 ಪ್ರಮುಖ AI ಉಪಕರಣಗಳು",
    "aiPlatformSubtitle": "ಧ್ವನಿ-ಮೊದಲ ಕ್ಯಾಟಲಾಗ್, ಚಿತ್ರ ಸುಧಾರಣೆ, ಮತ್ತು ನ್ಯಾಯೋಚಿತ ಬೆಲೆ ಶಿಫಾರಸು",
    "aiTabImage": "ಚಿತ್ರ ಸುಧಾರಣೆ",
    "aiTabVoice": "ಧ್ವನಿ ಕ್ಯಾಟಲಾಗ್",
    "aiTabStt": "ಧ್ವನಿಯಿಂದ ಪಠ್ಯ (STT)",
    "aiTabDesc": "AI ಉತ್ಪನ್ನ ವಿವರಣೆ",
    "aiTabKeywords": "SEO ಕೀವರ್ಡ್‌ಗಳು",
    "aiTabPricing": "ನ್ಯಾಯೋಚಿತ ಬೆಲೆ ಮತ್ತು ಎಚ್ಚರಿಕೆ",
    "enhanceImageBtn": "AI ಹಿನ್ನೆಲೆ ತೆಗೆಯಿರಿ ಮತ್ತು ಸುಧಾರಿಸಿ",
    "enhancedSuccess": "ಹಿನ್ನೆಲೆಯನ್ನು ಸ್ವಚ್ಛವಾಗಿ ಪ್ರತ್ಯೇಕಿಸಲಾಗಿದೆ ಮತ್ತು ಬಣ್ಣವನ್ನು ಕ್ಯಾಲಿಬ್ರೇಟ್ ಮಾಡಲಾಗಿದೆ.",
    "listenVoiceDemo": "ಧ್ವನಿ ಮಾರ್ಗದರ್ಶನ ಆಲಿಸಿ",
    "voiceGuidanceText": "ನಿಮ್ಮ ಮಾತೃಭಾಷೆಯಲ್ಲಿ ಮಾತನಾಡಿ. ನಮ್ಮ AI ನಿಮ್ಮ ಕರಕುಶಲ ವಿವರಗಳನ್ನು ಗುರುತಿಸುತ್ತದೆ.",
    "sttFormFillPrompt": "ಮೈಕ್ ಒತ್ತಿ ಮತ್ತು ಉತ್ಪನ್ನದ ಬಗ್ಗೆ ಮಾತನಾಡಿ...",
    "sttListening": "ಆಲಿಸಲಾಗುತ್ತಿದೆ... ದಯವಿಟ್ಟು ಮಾತನಾಡಿ",
    "generateAiDescBtn": "AI ವಿವರಣೆ ರಚಿಸಿ",
    "generatedDescLabel": "ರಚಿಸಲಾದ ಬಹುಭಾಷಾ ವಿವರಣೆ:",
    "generateKeywordsBtn": "SEO ಕೀವರ್ಡ್‌ಗಳನ್ನು ರಚಿಸಿ",
    "materialsCost": "ಕಚ್ಚಾ ವಸ್ತುಗಳ ವೆಚ್ಚ",
    "laborHours": "ಕೈಕೆಲಸದ ಗಂಟೆಗಳು",
    "hourlyWage": "ಗಂಟೆಯ ನ್ಯಾಯೋಚಿತ ವೇತನ",
    "fairMargin": "ಕುಶಲಕರ್ಮಿಗಳ ಲಾಭಾಂಶ",
    "calculatePriceBtn": "ನ್ಯಾಯೋಚಿತ ಬೆಲೆಯನ್ನು ಲೆಕ್ಕಾಚಾರ ಮಾಡಿ",
    "fairPriceRange": "ಶಿಫಾರಸು ಮಾಡಿದ ನ್ಯಾಯೋಚಿತ ಬೆಲೆ ಶ್ರೇಣಿ",
    "underpricingWarning": "ಕಡಿಮೆ ಬೆಲೆಯ ಎಚ್ಚರಿಕೆ: ನಿಮ್ಮ ಬೆಲೆ ಕನಿಷ್ಠ ಜೀವನಾಧಾರ ಮಿತಿಗಿಂತ ಕಡಿಮೆಯಿರಬಾರದು.",
    "openAddProductModalBtn": "+ ಹೊಸ ಕರಕುಶಲ ಉತ್ಪನ್ನವನ್ನು ಸೇರಿಸಿ (AI ವಿಷನ್)",
    "addProductTitle": "ಹೊಸ ಕರಕುಶಲ ಉತ್ಪನ್ನವನ್ನು ಸೇರಿಸಿ (AI ಸ್ಮಾರ್ಟ್ ಕ್ಯಾಟಲಾಗ್)",
    "addProductSubtitle": "ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ ಅಥವಾ ವಿವರಣೆಯನ್ನು ಮಾತನಾಡಿ — AI ವೃತ್ತಿಪರ ಕ್ಯಾಟಲಾಗ್ ಡ್ರಾಫ್ಟ್ ಸಿದ್ಧಪಡಿಸುತ್ತದೆ.",
    "uploadPhotoLabel": "1. ಉತ್ಪನ್ನದ ಫೋಟೋ:",
    "voiceInputLabel": "2. ಧ್ವನಿ ವಿವರಣೆ (ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಮಾತನಾಡಿ):",
    "startVoiceInput": "ಮಾತನಾಡಲು ಪ್ರಾರಂಭಿಸಿ",
    "stopVoiceInput": "ಮಾತನಾಡುವುದನ್ನು ನಿಲ್ಲಿಸಿ",
    "generateAiDraftBtn": "AI ಸ್ಮಾರ್ಟ್ ಕ್ಯಾಟಲಾಗ್ ಡ್ರಾಫ್ಟ್ ರಚಿಸಿ",
    "reviewGateTitle": "ಹಂತ 2: ಕಡ್ಡಾಯ ಕುಶಲಕರ್ಮಿ ಪರಿಶೀಲನೆ ಗೇಟ್",
    "reviewGateNotice": "ಪ್ರಕಟಿಸುವ ಮೊದಲು ಪ್ರತಿ AI-ರಚಿತ ವಿವರವನ್ನು ಕುಶಲಕರ್ಮಿಗಳು ಪರಿಶೀಲಿಸುವುದು ಕಡ್ಡಾಯವಾಗಿದೆ.",
    "productTitleLabel": "ಉತ್ಪನ್ನದ ಶೀರ್ಷಿಕೆ:",
    "categoryLabel": "ಕರಕುಶಲ ವರ್ಗ:",
    "descriptionLabel": "ಉತ್ಪನ್ನದ ವಿವರಣೆ:",
    "tagsLabel": "ಟ್ಯಾಗ್‌ಗಳು ಮತ್ತು ಕೀವರ್ಡ್‌ಗಳು:",
    "priceLabel": "ಬೆಲೆ (₹):",
    "stockLabel": "ಲಭ್ಯವಿರುವ ದಾಸ್ತಾನು (ಘಟಕಗಳು):",
    "unitLabel": "ಅಳತೆಯ ಘಟಕ:",
    "publishProductBtn": "ಉತ್ಪನ್ನವನ್ನು ಪ್ರಕಟಿಸಿ ಮತ್ತು ಮಾರುಕಟ್ಟೆಗೆ ಸೇರಿಸಿ",
    "publishing": "ಪ್ರಕಟಿಸಲಾಗುತ್ತಿದೆ...",
    "priceLowToHigh": "ಬೆಲೆ: ಕಡಿಮೆಯಿಂದ ಹೆಚ್ಚು",
    "priceHighToLow": "ಬೆಲೆ: ಹೆಚ್ಚಿನಿಂದ ಕಡಿಮೆ",
    "directFromArtisan": "ಮಾಸ್ಟರ್ ಕುಶಲಕರ್ಮಿಗಳಿಂದ ನೇರವಾಗಿ",
    "stockAvailable": "ದಾಸ್ತಾನು ಲಭ್ಯವಿದೆ",
    "outOfStock": "ದಾಸ್ತಾನು ಮುಗಿದಿದೆ",
    "noProductsMatched": "ಯಾವುದೇ ಉತ್ಪನ್ನಗಳು ಕಂಡುಬಂದಿಲ್ಲ",
    "productDetailsTitle": "ಕರಕುಶಲ ವಿವರಗಳು ಮತ್ತು ಕುಶಲಕರ್ಮಿಗಳ ಪರಂಪರೆ",
    "craftOrigin": "ಮೂಲ ಮತ್ತು ಕ್ಲಸ್ಟರ್:",
    "materialsUsed": "ಬಳಸಿದ ನೈಸರ್ಗಿಕ ವಸ್ತುಗಳು:",
    "artisanStory": "ಕುಶಲಕರ್ಮಿಗಳ ಕಥೆ ಮತ್ತು ಸಂಪ್ರದಾಯ",
    "matchAffinityTitle": "ಖರೀದಿದಾರ-ಕುಶಲಕರ್ಮಿ ಹೊಂದಾಣಿಕೆ ಸ್ಕೋರ್",
    "matchScoreLabel": "ಹೊಂದಾಣಿಕೆಯ ದೃಢತೆ",
    "matchFactors": "ಹೊಂದಾಣಿಕೆಯ ಅಂಶಗಳು",
    "quantity": "ಪ್ರಮಾಣ:",
    "inquiryMessagePlaceholder": "ಕಸ್ಟಮ್ ಆರ್ಡರ್‌ಗಳು, ಬಣ್ಣಗಳು ಅಥವಾ ಬೃಹತ್ ಪ್ರಮಾಣದ ಕುರಿತು ಕುಶಲಕರ್ಮಿಗಳಿಗೆ ನೇರವಾಗಿ ಸಂದೇಶ ಕಳುಹಿಸಿ...",
    "sendInquiryBtn": "ಖರೀದಿ ವಿಚಾರಣೆಯನ್ನು ಕಳುಹಿಸಿ",
    "addedToCartToast": "ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಲಾಗಿದೆ!",
    "cartTitle": "ನಿಮ್ಮ ಕಾರ್ಟ್ (ಸಗಟು ಖರೀದಿ)",
    "cartEmpty": "ನಿಮ್ಮ ಕಾರ್ಟ್ ಪ್ರಸ್ತುತ ಖಾಲಿಯಾಗಿದೆ.",
    "subtotal": "ಒಟ್ಟು ಮೊತ್ತ:",
    "atomicNotice": "ಪಾವತಿಯ ನಂತರ ಅಟಾಮಿಕ್ ದಾಸ್ತಾನು ಕಾಯ್ದಿರಿಸುವಿಕೆ ಜಾರಿಯಾಗುತ್ತದೆ.",
    "checkoutBtn": "ಆರ್ಡರ್ ಇರಿಸಿ (ಅಟಾಮಿಕ್ ದಾಸ್ತಾನು ಮೀಸಲಾತಿ)",
    "orderSuccessTitle": "ಆರ್ಡರ್ ಯಶಸ್ವಿಯಾಗಿ ದೃಢೀಕರಿಸಲಾಗಿದೆ!",
    "orderSuccessDesc": "ಕಲಾ ಸೇತು ಎಸ್ಕ್ರೋದಲ್ಲಿ ಹಣ ಸುರಕ್ಷಿತವಾಗಿದೆ. ರವಾನೆಗಾಗಿ ಕುಶಲಕರ್ಮಿ ಕಾರ್ಯಾಗಾರಕ್ಕೆ ಸೂಚಿಸಲಾಗಿದೆ.",
    "inboxTitle": "ಕುಶಲಕರ್ಮಿ ಇನ್‌ಬಾಕ್ಸ್ ಮತ್ತು ವಿಚಾರಣೆಗಳು",
    "inboxSubtitle": "ಪರಿಶೀಲಿಸಿದ ಚಿಲ್ಲರೆ ಮತ್ತು B2B ಖರೀದಿದಾರರಿಂದ ಒಳಬರುವ ನೇರ ಖರೀದಿ ಆಸಕ್ತಿಗಳು.",
    "noInquiries": "ಇನ್ನೂ ಯಾವುದೇ ವಿಚಾರಣೆಗಳು ಬಂದಿಲ್ಲ.",
    "buyerMatchScore": "ಖರೀದಿದಾರರ ಹೊಂದಾಣಿಕೆ",
    "quantityRequested": "ಕೋರಿದ ಪ್ರಮಾಣ:",
    "timeline": "ಅಪೇಕ್ಷಿತ ಕಾಲಮಿತಿ:",
    "acceptInquiryBtn": "ವಿಚಾರಣೆಯನ್ನು ಸ್ವೀಕರಿಸಿ ಮತ್ತು ಸಂಪರ್ಕ ತೆರೆಯಿರಿ",
    "declineInquiryBtn": "ತಿರಸ್ಕರಿಸಿ",
    "acceptedBadge": "ಸ್ವೀಕರಿಸಲಾಗಿದೆ",
    "declinedBadge": "ತಿರಸ್ಕರಿಸಲಾಗಿದೆ",
    "connectionsTitle": "ಸಕ್ರಿಯ ಸಂಪರ್ಕಗಳು ಮತ್ತು ಮಾತುಕತೆ",
    "connectionsSubtitle": "ಪರಸ್ಪರ ಒಪ್ಪಿಗೆಯ ನಂತರ ನೇರ ಖರೀದಿದಾರ-ಕುಶಲಕರ್ಮಿ ಸಂಪರ್ಕ ಕೇಂದ್ರ.",
    "noConnections": "ಇನ್ನೂ ಯಾವುದೇ ಸಂಪರ್ಕಗಳು ಸ್ಥಾಪನೆಯಾಗಿಲ್ಲ.",
    "verifiedBadge": "ಪರಿಶೀಲಿತ ಪಾಲುದಾರ",
    "directPhone": "ನೇರ ಫೋನ್:",
    "directEmail": "ಇಮೇಲ್:",
    "chatThreadTitle": "ನೇರ ಪಾಲುದಾರಿಕೆ ಚಾಟ್",
    "chatPlaceholder": "ಪಾಲುದಾರರಿಗೆ ನೇರ ಸಂದೇಶವನ್ನು ಟೈಪ್ ಮಾಡಿ...",
    "sendMessageBtn": "ಕಳುಹಿಸಿ",
    "authModalTitle": "ಕಲಾ ಸೇತು ಪ್ರವೇಶ",
    "loginTab": "ಲಾಗಿನ್",
    "registerTab": "ನೋಂದಣಿ",
    "phoneLabel": "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ:",
    "passwordLabel": "ಪಾಸ್‌ವರ್ಡ್:",
    "roleSelectLabel": "ನಿಮ್ಮ ಖಾತೆಯ ಪ್ರಕಾರವನ್ನು ಆಯ್ಕೆಮಾಡಿ:",
    "roleArtisan": "ಕುಶಲಕರ್ಮಿ / ಮಾರಾಟಗಾರ (ತಯಾರಕರು, ನೇಕಾರರು)",
    "roleBuyer": "ಖರೀದಿದಾರ / ಚಿಲ್ಲರೆ ವ್ಯಾಪಾರಿ (B2B, ಸಗಟು)",
    "submitLogin": "ಸುರಕ್ಷಿತವಾಗಿ ಲಾಗಿನ್ ಮಾಡಿ",
    "submitRegister": "ಖಾತೆ ರಚಿಸಿ",
    "adminEventsTitle": "Aiven Kafka ನೈಜ-ಸಮಯದ ಈವೆಂಟ್ ಸ್ಟ್ರೀಮ್",
    "adminEventsSubtitle": "ಲೈವ್ ಈವೆಂಟ್‌ಗಳು ಮತ್ತು ಅಟಾಮಿಕ್ ಡೇಟಾಬೇಸ್ ವಹಿವಾಟುಗಳು",
    "topic": "ವಿಷಯ (Topic)",
    "payload": "ಡೇಟಾ (Payload)",
    "consumerAction": "ಗ್ರಾಹಕ ಕ್ರಿಯೆ",
    "timestamp": "ಸಮಯದ ಮುದ್ರೆ",
    "connectedPartners": "ಸಂಪರ್ಕಿತ ಪಾಲುದಾರರು",
    "connectedPartner": "ಸಂಪರ್ಕಿತ ಪಾಲುದಾರ",
    "directSupplyCorridor": "ನೇರ ಸರಬರಾಜು ಕಾರಿಡಾರ್",
    "productContext": "ಉತ್ಪನ್ನದ ಸಂದರ್ಭ:",
    "typeDirectMessage": "ಪಾಲುದಾರರಿಗೆ ನೇರ ಸಂದೇಶವನ್ನು ಟೈಪ್ ಮಾಡಿ...",
    "send": "ಕಳುಹಿಸಿ",
    "loadingConnections": "ಸ್ಥಾಪಿತ ಸಂಪರ್ಕಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
    "noConnectionsDesc": "ಖರೀದಿದಾರರು ವಿಚಾರಣೆಯನ್ನು ಕಳುಹಿಸಿದಾಗ ಮತ್ತು ಕುಶಲಕರ್ಮಿ ಅದನ್ನು ಸ್ವೀಕರಿಸಿದಾಗ, ಸ್ಥಾಪಿತ ನೇರ ಸಂಬಂಧವು ಇಲ್ಲಿ ಸಂಪರ್ಕ ವಿವರಗಳು ಮತ್ತು ಚಾಟ್‌ನೊಂದಿಗೆ ಗೋಚರಿಸುತ್ತದೆ."
}

# Update kn.json
with open(os.path.join(locales_dir, 'kn.json'), 'r', encoding='utf-8') as f:
    kn = json.load(f)

for k, v in kn_full.items():
    kn[k] = v

with open(os.path.join(locales_dir, 'kn.json'), 'w', encoding='utf-8') as f:
    json.dump(kn, f, ensure_ascii=False, indent=2)

print('Updated kn.json with 100% authentic Kannada translations!')

# Also update en.json with the new keys if not present
with open(os.path.join(locales_dir, 'en.json'), 'r', encoding='utf-8') as f:
    en = json.load(f)

en_extra = {
    "connectedPartners": "Connected Partners",
    "connectedPartner": "Connected Partner",
    "directSupplyCorridor": "Direct Supply Corridor",
    "productContext": "Product Context:",
    "typeDirectMessage": "Type direct message to partner...",
    "send": "Send",
    "loadingConnections": "Loading established connections...",
    "noConnectionsDesc": "When a buyer sends an inquiry and the artisan accepts it, the established direct relationship will appear here with contact details and chat."
}
for k, v in en_extra.items():
    en[k] = v

with open(os.path.join(locales_dir, 'en.json'), 'w', encoding='utf-8') as f:
    json.dump(en, f, ensure_ascii=False, indent=2)

print('Updated en.json with new connection keys!')

# Also update hi.json
with open(os.path.join(locales_dir, 'hi.json'), 'r', encoding='utf-8') as f:
    hi = json.load(f)

hi_extra = {
    "connectedPartners": "जुड़े हुए साझेदार",
    "connectedPartner": "सत्यापित साझेदार",
    "directSupplyCorridor": "प्रत्यक्ष आपूर्ति गलियारा",
    "productContext": "उत्पाद संदर्भ:",
    "typeDirectMessage": "साझेदार को सीधा संदेश लिखें...",
    "send": "भेजें",
    "loadingConnections": "स्थापित संबंधों को लोड किया जा रहा है...",
    "noConnectionsDesc": "जब कोई खरीदार पूछताछ भेजता है और कारीगर उसे स्वीकार करता है, तो स्थापित सीधा संबंध संपर्क विवरण और बातचीत के साथ यहाँ दिखाई देगा।"
}
for k, v in hi_extra.items():
    hi[k] = v

with open(os.path.join(locales_dir, 'hi.json'), 'w', encoding='utf-8') as f:
    json.dump(hi, f, ensure_ascii=False, indent=2)

print('Updated hi.json with new connection keys!')

# Rebuild translations.ts
with open('scripts/rebuild_i18n.py', 'r', encoding='utf-8') as f:
    code = f.read()
exec(code)
