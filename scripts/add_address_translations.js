const fs = require('fs');
const path = require('path');

const ADDRESS_KEYS = {
  en: {
    deliveryAddressTitle: "Select Delivery Location & Address",
    deliveryAddressSubtitle: "Where should the artisan dispatch this wholesale order?",
    useCurrentLocation: "Use Current Location (GPS)",
    fullNameLabel: "Full Name / Store Manager:",
    phoneNumberLabel: "Mobile Phone Number (10 digits):",
    pincodeLabel: "6-Digit Pincode:",
    flatBuildingLabel: "Shop, Building, Warehouse / Office No.:",
    streetAreaLabel: "Street, Commercial Road, Landmark:",
    cityLabel: "Town / City:",
    stateLabel: "State / UT:",
    addressTypeLabel: "Address Type:",
    typeBusiness: "Commercial Store / Office",
    typeWarehouse: "Wholesale Warehouse",
    typeHome: "Studio / Residence",
    deliveryPromise: "Direct Artisan Dispatch via India Post Speed Post / SafeXpress (3-5 Days)",
    deliverHereBtn: "Deliver to this Address & Proceed to Payment",
    changeAddress: "Change Address",
    deliveringTo: "Delivering to:"
  },
  hi: {
    deliveryAddressTitle: "डिलीवरी का स्थान एवं पता चुनें",
    deliveryAddressSubtitle: "कारीगर यह थोक ऑर्डर कहाँ भेजे?",
    useCurrentLocation: "वर्तमान स्थान का उपयोग करें (GPS)",
    fullNameLabel: "पूरा नाम / स्टोर प्रबंधक:",
    phoneNumberLabel: "मोबाइल नंबर (10 अंक):",
    pincodeLabel: "6 अंकों का पिनकोड:",
    flatBuildingLabel: "दुकान, भवन, गोदाम / कार्यालय संख्या:",
    streetAreaLabel: "सड़क, व्यावसायिक क्षेत्र, लैंडमार्क:",
    cityLabel: "शहर / कस्बा:",
    stateLabel: "राज्य / केंद्र शासित प्रदेश:",
    addressTypeLabel: "पते का प्रकार:",
    typeBusiness: "व्यावसायिक दुकान / कार्यालय",
    typeWarehouse: "थोक गोदाम (Warehouse)",
    typeHome: "स्टूडियो / आवास",
    deliveryPromise: "इंडिया पोस्ट स्पीड पोस्ट / सुरक्षित एक्सप्रेस द्वारा कारीगर से सीधी डिलीवरी (3-5 दिन)",
    deliverHereBtn: "इस पते पर भेजें एवं भुगतान के लिए आगे बढ़ें",
    changeAddress: "पता बदलें",
    deliveringTo: "डिलीवरी का गंतव्य:"
  },
  ta: {
    deliveryAddressTitle: "டெலிவரி இடம் மற்றும் முகவரியைத் தேர்ந்தெடுக்கவும்",
    deliveryAddressSubtitle: "கைவினைஞர் இந்த மொத்த ஆர்டரை எங்கு அனுப்ப வேண்டும்?",
    useCurrentLocation: "தற்போதைய இருப்பிடத்தைப் பயன்படுத்தவும் (GPS)",
    fullNameLabel: "முழு பெயர் / கடை மேலாளர்:",
    phoneNumberLabel: "மொபைல் எண் (10 இலக்கங்கள்):",
    pincodeLabel: "6-இலக்க பின்கோடு:",
    flatBuildingLabel: "கடை, கட்டிடம், கிடங்கு / அலுவலக எண்:",
    streetAreaLabel: "தெரு, வணிக பகுதி, முக்கிய அடையாளம்:",
    cityLabel: "நகரம் / ஊர்:",
    stateLabel: "மாநிலம்:",
    addressTypeLabel: "முகவரி வகை:",
    typeBusiness: "வணிக கடை / அலுவலகம்",
    typeWarehouse: "மொத்த விற்பனை கிடங்கு",
    typeHome: "ஸ்டுடியோ / இல்லம்",
    deliveryPromise: "இந்தியா போஸ்ட் ஸ்பீட் போஸ்ட் மூலம் கைவினைஞரிடமிருந்து நேரடி டெலிவரி (3-5 நாட்கள்)",
    deliverHereBtn: "இந்த முகவரிக்கு டெலிவரி செய்து பணம் செலுத்த தொடரவும்",
    changeAddress: "முகவரியை மாற்றவும்",
    deliveringTo: "டெலிவரி செய்யுமிடம்:"
  },
  te: {
    deliveryAddressTitle: "డెలివరీ స్థానం మరియు చిరునామాను ఎంచుకోండి",
    deliveryAddressSubtitle: "కళాకారుడు ఈ హోల్‌సేల్ ఆర్డర్‌ను ఎక్కడికి పంపాలి?",
    useCurrentLocation: "ప్రస్తుత స్థానాన్ని ఉపయోగించండి (GPS)",
    fullNameLabel: "పూర్తి పేరు / స్టోర్ మేనేజర్:",
    phoneNumberLabel: "మొబైల్ నంబర్ (10 అంకెలు):",
    pincodeLabel: "6-అంకెల పిన్‌కోడ్:",
    flatBuildingLabel: "షాప్, భవనం, గిడ్డంగి / కార్యాలయ సంఖ్య:",
    streetAreaLabel: "వీధి, వాణిజ్య ప్రాంతం, ల్యాండ్‌మార్క్:",
    cityLabel: "పట్టణం / నగరం:",
    stateLabel: "రాష్ట్రం:",
    addressTypeLabel: "చిరునామా రకం:",
    typeBusiness: "వాణిజ్య దుకాణం / కార్యాలయం",
    typeWarehouse: "హోల్‌సేల్ గిడ్డంగి (వేర్‌హౌస్)",
    typeHome: "స్టూడియో / నివాసం",
    deliveryPromise: "ఇండియా పోస్ట్ స్పీడ్ పోస్ట్ ద్వారా కళాకారుని నుండి నేరుగా డెలివరీ (3-5 రోజులు)",
    deliverHereBtn: "ఈ చిరునామాకు డెలివరీ చేసి చెల్లింపుకు కొనసాగండి",
    changeAddress: "చిరునామా మార్చండి",
    deliveringTo: "డెలివరీ చిరునామా:"
  },
  kn: {
    deliveryAddressTitle: "ಡೆಲಿವರಿ ಸ್ಥಳ ಮತ್ತು ವಿಳಾಸವನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    deliveryAddressSubtitle: "ಕುಶಲಕರ್ಮಿ ಈ ಸಗಟು ಆರ್ಡರ್ ಅನ್ನು ಎಲ್ಲಿಗೆ ರವಾನಿಸಬೇಕು?",
    useCurrentLocation: "ಪ್ರಸ್ತುತ ಸ್ಥಳ ಬಳಸಿ (GPS)",
    fullNameLabel: "ಪೂರ್ಣ ಹೆಸರು / ಸ್ಟೋರ್ ಮ್ಯಾನೇಜರ್:",
    phoneNumberLabel: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ (10 ಅಂಕೆಗಳು):",
    pincodeLabel: "6-ಅಂಕಿಯ ಪಿನ್‌ಕೋಡ್:",
    flatBuildingLabel: "ಅಂಗಡಿ, ಕಟ್ಟಡ, ಗೋದಾಮು / ಕಚೇರಿ ಸಂಖ್ಯೆ:",
    streetAreaLabel: "ರಸ್ತೆ, ವಾಣಿಜ್ಯ ಪ್ರದೇಶ, ಲ್ಯಾಂಡ್‌ಮಾರ್ಕ್:",
    cityLabel: "ಪಟ್ಟಣ / ನಗರ:",
    stateLabel: "ರಾಜ್ಯ:",
    addressTypeLabel: "ವಿಳಾಸದ ಪ್ರಕಾರ:",
    typeBusiness: "ವಾಣಿಜ್ಯ ಅಂಗಡಿ / ಕಚೇರಿ",
    typeWarehouse: "ಸಗಟು ಗೋದಾಮು",
    typeHome: "ಸ್ಟುಡಿಯೋ / ವಾಸಸ್ಥಳ",
    deliveryPromise: "ಇಂಡಿಯಾ ಪೋಸ್ಟ್ ಸ್ಪೀಡ್ ಪೋಸ್ಟ್ ಮೂಲಕ ಕುಶಲಕರ್ಮಿಗಳಿಂದ ನೇರ ರವಾನೆ (3-5 ದಿನಗಳು)",
    deliverHereBtn: "ಈ ವಿಳಾಸಕ್ಕೆ ತಲುಪಿಸಿ ಮತ್ತು ಪಾವತಿಗೆ ಮುಂದುವರಿಯಿರಿ",
    changeAddress: "ವಿಳಾಸ ಬದಲಾಯಿಸಿ",
    deliveringTo: "ತಲುಪಿಸುವ ಸ್ಥಳ:"
  },
  bn: {
    deliveryAddressTitle: "ডেলিভারির অবস্থান ও ঠিকানা বেছে নিন",
    deliveryAddressSubtitle: "কারিগর এই পাইকারি অর্ডারটি কোথায় পাঠাবেন?",
    useCurrentLocation: "বর্তমান অবস্থান ব্যবহার করুন (GPS)",
    fullNameLabel: "পুরো নাম / স্টোর ম্যানেজার:",
    phoneNumberLabel: "মোবাইল নম্বর (১০ ডিজিট):",
    pincodeLabel: "৬-সংখ্যার পিনকোড:",
    flatBuildingLabel: "দোকান, বিল্ডিং, গুদাম / অফিস নম্বর:",
    streetAreaLabel: "রাস্তা, বাণিজ্যিক এলাকা, ল্যান্ডমার্ক:",
    cityLabel: "শহর / নগর:",
    stateLabel: "রাজ্য:",
    addressTypeLabel: "ঠিকানার ধরন:",
    typeBusiness: "বাণিজ্যিক দোকান / অফিস",
    typeWarehouse: "পাইকারি গুদাম",
    typeHome: "স্টুডিও / বাসস্থান",
    deliveryPromise: "ইন্ডিয়া পোস্ট স্পিড পোস্টের মাধ্যমে কারিগর থেকে সরাসরি ডেলিভারি (৩-৫ দিন)",
    deliverHereBtn: "এই ঠিকানায় পাঠান এবং পেমেন্টে এগিয়ে যান",
    changeAddress: "ঠিকানা পরিবর্তন",
    deliveringTo: "ডেলিভারি ঠিকানা:"
  },
  mr: {
    deliveryAddressTitle: "डिलिव्हरीचे ठिकाण आणि पत्ता निवडा",
    deliveryAddressSubtitle: "कारागिराने ही घाऊक ऑर्डर कुठे पाठवावी?",
    useCurrentLocation: "सध्याचे स्थान वापरा (GPS)",
    fullNameLabel: "पूर्ण नाव / स्टोअर मॅनेजर:",
    phoneNumberLabel: "मोबाईल नंबर (१० अंक):",
    pincodeLabel: "६ अंकी पिनकोड:",
    flatBuildingLabel: "दुकान, इमारत, गोदाम / कार्यालय क्रमांक:",
    streetAreaLabel: "रस्ता, व्यावसायिक परिसर, लँडमार्क:",
    cityLabel: "शहर / गाव:",
    stateLabel: "राज्य:",
    addressTypeLabel: "पत्त्याचा प्रकार:",
    typeBusiness: "व्यावसायिक दुकान / कार्यालय",
    typeWarehouse: "घाऊक गोदाम (Warehouse)",
    typeHome: "स्टुडिओ / निवास",
    deliveryPromise: "इंडिया पोस्ट स्पीड पोस्टद्वारे थेट कारागिराकडून डिलिव्हरी (३-५ दिवस)",
    deliverHereBtn: "या पत्त्यावर पाठवा आणि पेमेंटसाठी पुढे जा",
    changeAddress: "पत्ता बदला",
    deliveringTo: "डिलिव्हरी पत्ता:"
  },
  gu: {
    deliveryAddressTitle: "ડિલિવરીનું સ્થળ અને સરનામું પસંદ કરો",
    deliveryAddressSubtitle: "કારીગરે આ જથ્થાબંધ ઓર્ડર ક્યાં મોકલવો?",
    useCurrentLocation: "વર્તમાન સ્થાનનો ઉપયોગ કરો (GPS)",
    fullNameLabel: "પૂરું નામ / સ્ટોર મેનેજર:",
    phoneNumberLabel: "મોબાઇલ નંબર (૧૦ અંક):",
    pincodeLabel: "૬ અંકનો પિનકોડ:",
    flatBuildingLabel: "દુકાન, ઇમારત, ગોદામ / ઓફિસ નંબર:",
    streetAreaLabel: "શેરી, વેપારી વિસ્તાર, લેન્ડમાર્ક:",
    cityLabel: "શહેર / નગર:",
    stateLabel: "રાજ્ય:",
    addressTypeLabel: "સરનામાનો પ્રકાર:",
    typeBusiness: "વેપારી દુકાન / ઓફિસ",
    typeWarehouse: "જથ્થાબંધ ગોદામ",
    typeHome: "સ્ટુડિયો / રહેઠાણ",
    deliveryPromise: "ઇન્ડિયા પોસ્ટ સ્પીડ પોસ્ટ દ્વારા સીધી કારીગર તરફથી ડિલિવરી (૩-૫ દિવસ)",
    deliverHereBtn: "આ સરનામે પહોંચાડો અને ચુકવણી માટે આગળ વધો",
    changeAddress: "સરનામું બદલો",
    deliveringTo: "ડિલિવરી સરનામું:"
  },
  ml: {
    deliveryAddressTitle: "ഡെലിവറി സ്ഥലവും വിലാസവും തിരഞ്ഞെടുക്കുക",
    deliveryAddressSubtitle: "കരകൗശല വിദഗ്ദ്ധൻ ഈ മൊത്തവ്യാപാര ഓർഡർ എവിടെ അയയ്ക്കണം?",
    useCurrentLocation: "നിലവിലെ ലൊക്കേഷൻ ഉപയോഗിക്കുക (GPS)",
    fullNameLabel: "പൂർണ്ണമായ പേര് / സ്റ്റോർ മാനേജർ:",
    phoneNumberLabel: "മൊബൈൽ നമ്പർ (10 അക്കങ്ങൾ):",
    pincodeLabel: "6-അക്ക പിൻകോഡ്:",
    flatBuildingLabel: "കട, കെട്ടിടം, വെയർഹൗസ് / ഓഫീസ് നമ്പർ:",
    streetAreaLabel: "സ്ട്രീറ്റ്, വാണിജ്യ പ്രദേശം, ലാൻഡ്മാർക്ക്:",
    cityLabel: "പട്ടണം / നഗരം:",
    stateLabel: "സംസ്ഥാനം:",
    addressTypeLabel: "വിലാസ തരം:",
    typeBusiness: "വാണിജ്യ കട / ഓഫീസ്",
    typeWarehouse: "മൊത്തവ്യാപാര വെയർഹൗസ്",
    typeHome: "സ്റ്റുഡിയോ / താമസം",
    deliveryPromise: "ഇന്ത്യ പോസ്റ്റ് സ്പീഡ് പോസ്റ്റ് വഴി കരകൗശല കേന്ദ്രത്തിൽ നിന്നുള്ള നേരിട്ടുള്ള ഡെലിവറി (3-5 ദിവസങ്ങൾ)",
    deliverHereBtn: "ഈ വിലാസത്തിൽ എത്തിക്കുക, പേയ്‌മെന്റിലേക്ക് തുടരുക",
    changeAddress: "വിലാസം മാറ്റുക",
    deliveringTo: "ഡെലിവറി ചെയ്യേണ്ടത്:"
  },
  pa: {
    deliveryAddressTitle: "ਡਿਲੀਵਰੀ ਸਥਾਨ ਅਤੇ ਪਤਾ ਚੁਣੋ",
    deliveryAddressSubtitle: "ਕਾਰੀਗਰ ਇਹ ਥੋਕ ਆਰਡਰ ਕਿੱਥੇ ਭੇਜੇ?",
    useCurrentLocation: "ਮੌਜੂਦਾ ਸਥਾਨ ਵਰਤੋ (GPS)",
    fullNameLabel: "ਪੂਰਾ ਨਾਮ / ਸਟੋਰ ਮੈਨੇਜਰ:",
    phoneNumberLabel: "ਮੋਬਾਈਲ ਨੰਬਰ (10 ਅੰਕ):",
    pincodeLabel: "6 ਅੰਕਾਂ ਦਾ ਪਿੰਨਕੋਡ:",
    flatBuildingLabel: "ਦੁਕਾਨ, ਇਮਾਰਤ, ਗੋਦਾਮ / ਦਫ਼ਤਰ ਨੰਬਰ:",
    streetAreaLabel: "ਸੜਕ, ਵਪਾਰਕ ਖੇਤਰ, ਲੈਂਡਮਾਰਕ:",
    cityLabel: "ਸ਼ਹਿਰ / ਕਸਬਾ:",
    stateLabel: "ਰਾਜ:",
    addressTypeLabel: "ਪਤੇ ਦੀ ਕਿਸਮ:",
    typeBusiness: "ਵਪਾਰਕ ਦੁਕਾਨ / ਦਫ਼ਤਰ",
    typeWarehouse: "ਥੋਕ ਗੋਦਾਮ",
    typeHome: "ਸਟੂਡੀਓ / ਰਿਹਾਇਸ਼",
    deliveryPromise: "ਇੰਡੀਆ ਪੋਸਟ ਸਪੀਡ ਪੋਸਟ ਰਾਹੀਂ ਕਾਰੀਗਰ ਤੋਂ ਸਿੱਧੀ ਡਿਲੀਵਰੀ (3-5 ਦਿਨ)",
    deliverHereBtn: "ਇਸ ਪਤੇ 'ਤੇ ਡਿਲੀਵਰ ਕਰੋ ਅਤੇ ਭੁਗਤਾਨ ਲਈ ਅੱਗੇ ਵਧੋ",
    changeAddress: "ਪਤਾ ਬਦਲੋ",
    deliveringTo: "ਡਿਲੀਵਰੀ ਪਤਾ:"
  },
  or: {
    deliveryAddressTitle: "ଡେଲିଭରୀ ସ୍ଥାନ ଏବଂ ଠିକଣା ଚୟନ କରନ୍ତୁ",
    deliveryAddressSubtitle: "କାରିଗର ଏହି ହୋଲସେଲ ଅର୍ଡର କେଉଁଠାକୁ ପଠାଇବେ?",
    useCurrentLocation: "ବର୍ତ୍ତମାନର ସ୍ଥାନ ବ୍ୟବହାର କରନ୍ତୁ (GPS)",
    fullNameLabel: "ପୂରା ନାମ / ଷ୍ଟୋର ମ୍ୟାନେଜର:",
    phoneNumberLabel: "ମୋବାଇଲ ନମ୍ବର (୧୦ ଅଙ୍କ):",
    pincodeLabel: "୬ ଅଙ୍କ ବିଶିଷ୍ଟ ପିନକୋଡ଼:",
    flatBuildingLabel: "ଦୋକାନ, କୋଠା, ଗୋଦାମ / କାର୍ଯ୍ୟାଳୟ ନମ୍ବର:",
    streetAreaLabel: "ରାସ୍ତା, ବ୍ୟବସାୟିକ ଅଞ୍ଚଳ, ଲ୍ୟାଣ୍ଡମାର୍କ:",
    cityLabel: "ସହର / ନଗର:",
    stateLabel: "ରାଜ୍ୟ:",
    addressTypeLabel: "ଠିକଣା ପ୍ରକାର:",
    typeBusiness: "ବାଣିଜ୍ୟିକ ଦୋକାନ / ଅଫିସ",
    typeWarehouse: "ହୋଲସେଲ ଗୋଦାମ",
    typeHome: "ଷ୍ଟୁଡିଓ / ବାସସ୍ଥାନ",
    deliveryPromise: "ଇଣ୍ଡିଆ ପୋଷ୍ଟ ସ୍ପିଡ ପୋଷ୍ଟ ଦ୍ୱାରା କାରିଗରଙ୍କ ଠାରୁ ସିଧାସଳଖ ଡେଲିଭରୀ (୩-୫ ଦିନ)",
    deliverHereBtn: "ଏହି ଠିକଣାକୁ ପଠାନ୍ତୁ ଏବଂ ପେମେଣ୍ଟ ଆଗକୁ ବଢ଼ାନ୍ତୁ",
    changeAddress: "ଠିକଣା ପରିବର୍ତ୍ତନ",
    deliveringTo: "ଡେଲିଭରୀ ଠିକଣା:"
  },
  as: {
    deliveryAddressTitle: "ডেলিভাৰী স্থান আৰু ঠিকনা বাছক",
    deliveryAddressSubtitle: "কাৰিকৰে এই পাইকাৰী অৰ্ডাৰ ক'লৈ প্ৰেৰণ কৰিব?",
    useCurrentLocation: "বৰ্তমান স্থান ব্যৱহাৰ কৰক (GPS)",
    fullNameLabel: "সম্পূৰ্ণ নাম / ষ্ট'ৰ মেনেজাৰ:",
    phoneNumberLabel: "মোবাইল নম্বৰ (১০ টা সংখ্যা):",
    pincodeLabel: "৬ টা সংখ্যাৰ পিনক'ড:",
    flatBuildingLabel: "দোকান, ভৱন, গুদাম / কাৰ্যালয় নম্বৰ:",
    streetAreaLabel: "ৰাস্তা, বাণিজ্যিক এলেকা, চিনাক্ত স্থান:",
    cityLabel: "চহৰ / নগৰ:",
    stateLabel: "ৰাজ্য:",
    addressTypeLabel: "ঠিকনাৰ ধৰণ:",
    typeBusiness: "বাণিজ্যিক দোকান / কাৰ্যালয়",
    typeWarehouse: "পাইকাৰী গুদাম",
    typeHome: "ষ্টুডিঅ' / বাসস্থান",
    deliveryPromise: "ইণ্ডিয়া প'ষ্ট স্পীড প'ষ্টৰ জৰিয়তে কাৰিকৰৰ পৰা পোনপটীয়া ডেলিভাৰী (৩-৫ দিন)",
    deliverHereBtn: "এই ঠিকনালৈ প্ৰেৰণ কৰক আৰু পৰিশোধৰ বাবে আগবাঢ়ক",
    changeAddress: "ঠিকনা সলনি কৰক",
    deliveringTo: "ডেলিভাৰী স্থান:"
  },
  ur: {
    deliveryAddressTitle: "ترسیل کا مقام اور پتہ منتخب کریں",
    deliveryAddressSubtitle: "کاریگر یہ تھوک آرڈر کہاں بھیجے؟",
    useCurrentLocation: "موجودہ مقام استعمال کریں (GPS)",
    fullNameLabel: "مکمل نام / اسٹور مینیجر:",
    phoneNumberLabel: "موبائل نمبر (10 ہندسے):",
    pincodeLabel: "6 ہندسوں کا پن کوڈ:",
    flatBuildingLabel: "دکان، عمارت، گودام / دفتر کا نمبر:",
    streetAreaLabel: "گلی، تجارتی سڑک، اہم مقام:",
    cityLabel: "شہر / قصبہ:",
    stateLabel: "ریاست:",
    addressTypeLabel: "پتے کی قسم:",
    typeBusiness: "تجارتی دکان / دفتر",
    typeWarehouse: "تھوک گودام (Warehouse)",
    typeHome: "اسٹوڈیو / رہائش گاہ",
    deliveryPromise: "انڈیا پوسٹ اسپیڈ پوسٹ کے ذریعے کاریگر سے براہ راست ترسیل (3-5 دن)",
    deliverHereBtn: "اس پتے پر بھیجیں اور ادائیگی کے لیے آگے بڑھیں",
    changeAddress: "پتہ تبدیل کریں",
    deliveringTo: "ترسیل کا پتہ:"
  }
};

const localesDir = path.join(__dirname, '..', 'frontend', 'src', 'i18n', 'locales');
const languages = Object.keys(ADDRESS_KEYS);

languages.forEach(lang => {
  const jsonPath = path.join(localesDir, `${lang}.json`);
  if (fs.existsSync(jsonPath)) {
    const raw = fs.readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(raw);
    Object.assign(data, ADDRESS_KEYS[lang]);
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Updated ${lang}.json with address keys`);
  }
});

// Update translations.ts
const translationsTsPath = path.join(__dirname, '..', 'frontend', 'src', 'i18n', 'translations.ts');
const tsCode = fs.readFileSync(translationsTsPath, 'utf8');
const allTranslations = {};

languages.forEach(lang => {
  const jsonPath = path.join(localesDir, `${lang}.json`);
  if (fs.existsSync(jsonPath)) {
    allTranslations[lang] = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  }
});

const regex = /export const TRANSLATIONS: Record<string, Record<string, string>> = \{[\s\S]*?\};/;
const replacement = 'export const TRANSLATIONS: Record<string, Record<string, string>> = ' + JSON.stringify(allTranslations, null, 2) + ';';

if (regex.test(tsCode)) {
  const newCode = tsCode.replace(regex, replacement);
  fs.writeFileSync(translationsTsPath, newCode, 'utf8');
  console.log('Successfully updated translations.ts with address keys!');
} else {
  console.log('Regex match failed for translations.ts');
}
