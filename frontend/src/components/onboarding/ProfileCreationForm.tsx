import React, { useState } from 'react';
import { ShieldCheck, Sparkles, Mic, ArrowRight, UserCheck, MapPin, Briefcase } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useVoiceOutput } from '../../hooks/useVoiceOutput';

interface ProfileCreationFormProps {
  onCompleted: () => void;
}

const INDIAN_STATES = [
  'Uttar Pradesh', 'Rajasthan', 'Bihar', 'West Bengal', 'Tamil Nadu',
  'Karnataka', 'Gujarat', 'Maharashtra', 'Odisha', 'Andhra Pradesh',
  'Telangana', 'Kerala', 'Punjab', 'Madhya Pradesh', 'Chhattisgarh',
  'Assam', 'Delhi', 'Jammu & Kashmir'
];

const CRAFT_CATEGORIES = [
  'Textiles & Handlooms',
  'Paintings & Folk Art',
  'Pottery & Ceramics',
  'Metal Craft & Bell Metal (Dhokra)',
  'Woodcraft & Lacquerware',
  'Jewelry & Filigree',
  'Leather & Footwear',
  'Natural Fibers & Bamboo Craft',
  'Agricultural & Spices'
];

export const ProfileCreationForm: React.FC<ProfileCreationFormProps> = ({ onCompleted }) => {
  const { t, language } = useLanguage();
  const { user, saveProfile } = useAuth();
  const { speak } = useVoiceOutput();

  const [formData, setFormData] = useState({
    fullName: user?.full_name || (user?.role === 'artisan' ? 'Ramprasad Bunkar' : 'Ananya Sharma'),
    businessName: user?.business_name || (user?.role === 'artisan' ? 'Kashi Resham Handlooms' : 'IndiCraft Retail'),
    craftCategory: user?.craft_category || 'Textiles & Handlooms',
    state: user?.state || 'Uttar Pradesh',
    district: 'Varanasi',
    pincode: '221001',
    address: 'Plot 42, Weavers Colony, Bunkar Seva Kendra',
    bioStory: 'We are 5th generation silk weavers specializing in Kadwa gold-silver zari weaving on pit looms.',
    languagesSpoken: ['Hindi', 'English'],
    experienceYears: 18,
    upiId: 'artisan@okhdfcbank',
    bankAccount: '309827162534',
    bankIfsc: 'SBIN0001234'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEnhancingStory, setIsEnhancingStory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isListening: isBioListening, toggleListening: toggleBioVoice } = useVoiceInput({
    targetInputId: 'bioStoryInput',
    onTranscript: (txt) => {
      setFormData((prev) => ({ ...prev, bioStory: txt }));
    }
  });

  const handleEnhanceStory = async () => {
    setIsEnhancingStory(true);
    try {
      const res = await fetch('http://localhost:8000/api/ai/story-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artisan_name: formData.fullName,
          craft_type: formData.craftCategory,
          region: formData.state,
          tradition_heritage: formData.bioStory,
          language: language
        })
      });
      const data = await res.json();
      if (data.story) {
        setFormData((prev) => ({ ...prev, bioStory: data.story }));
        speak(data.story);
      }
    } catch {
      const enhanced = `Handcrafted with soul in ${formData.state} by ${formData.fullName}, this authentic ${formData.craftCategory} reflects generations of living craft heritage.`;
      setFormData((prev) => ({ ...prev, bioStory: enhanced }));
    }
    setIsEnhancingStory(false);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.fullName.trim()) errs.fullName = 'Full Name is required';
    if (!formData.businessName.trim()) errs.businessName = 'Workshop / Business Name is required';
    if (!formData.state) errs.state = 'State is required';
    if (!formData.district.trim()) errs.district = 'District is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const ok = await saveProfile({
      full_name: formData.fullName,
      business_name: formData.businessName,
      craft_category: formData.craftCategory,
      bio_story: formData.bioStory,
      state: formData.state,
      district: formData.district,
      pincode: formData.pincode,
      address: formData.address,
      languages_spoken: formData.languagesSpoken,
      experience_years: formData.experienceYears,
      upi_id: formData.upiId,
      bank_account: formData.bankAccount,
      bank_ifsc: formData.bankIfsc
    });
    setIsSubmitting(false);

    if (ok) {
      onCompleted();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 my-6">
      <div className="bg-white rounded-2xl shadow-xl border-2 border-amber-300 overflow-hidden">
        <div className="bg-gradient-to-r from-amber-700 via-orange-600 to-amber-800 text-white p-6 sm:p-8">
          <div className="inline-flex items-center gap-2 bg-amber-900/80 px-3 py-1 rounded-full text-xs font-bold border border-amber-400 mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>MANDATORY PROFILE ONBOARDING GATE (§3.5)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-sans">
            {t('profileGateTitle')}
          </h2>
          <p className="text-amber-100 text-sm mt-1 max-w-2xl">
            {t('profileGateDesc')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
          <div>
            <div className="flex items-center gap-2 pb-2 mb-4 border-b border-amber-200 text-amber-950 font-bold text-base">
              <UserCheck className="w-5 h-5 text-amber-700" />
              <span>1. Creator / Business Identification</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('fullNameLabel')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Ramprasad Bunkar"
                  className="w-full px-3.5 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none border-slate-300 font-semibold"
                />
                {errors.fullName && <p className="text-red-600 text-xs mt-1">{errors.fullName}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('businessNameLabel')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder="e.g. Kashi Resham Handlooms"
                  className="w-full px-3.5 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none border-slate-300 font-semibold"
                />
                {errors.businessName && <p className="text-red-600 text-xs mt-1">{errors.businessName}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('craftCategoryLabel')}
                </label>
                <select
                  value={formData.craftCategory}
                  onChange={(e) => setFormData({ ...formData, craftCategory: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded-xl text-sm bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none border-slate-300 font-semibold"
                >
                  {CRAFT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('experienceYearsLabel')}
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={formData.experienceYears}
                  onChange={(e) => setFormData({ ...formData, experienceYears: parseInt(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none border-slate-300 font-semibold"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 pb-2 mb-4 border-b border-amber-200 text-amber-950 font-bold text-base">
              <MapPin className="w-5 h-5 text-amber-700" />
              <span>2. Geography & Workshop Location</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('stateLabel')}</label>
                <select
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded-xl text-sm bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none border-slate-300 font-semibold"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('districtLabel')}</label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  placeholder="e.g. Varanasi / Jaipur"
                  className="w-full px-3.5 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none border-slate-300 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('pincodeLabel')}</label>
                <input
                  type="text"
                  maxLength={6}
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  placeholder="221001"
                  className="w-full px-3.5 py-2.5 border rounded-xl text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none border-slate-300 font-bold"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('addressLabel')}</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Complete workshop premises address"
                  className="w-full px-3.5 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none border-slate-300"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between pb-2 mb-4 border-b border-amber-200 text-amber-950 font-bold text-base">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-700" />
                <span>3. Artisan Heritage Story & Voice Introduction</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleBioVoice}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition ${
                    isBioListening ? 'bg-red-500 text-white animate-pulse' : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>{isBioListening ? 'Recording...' : 'Speak Story'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleEnhanceStory}
                  disabled={isEnhancingStory}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm transition disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isEnhancingStory ? 'Enhancing...' : 'AI Enhance'}</span>
                </button>
              </div>
            </div>

            <div>
              <textarea
                id="bioStoryInput"
                rows={4}
                value={formData.bioStory}
                onChange={(e) => setFormData({ ...formData, bioStory: e.target.value })}
                placeholder={t('speakBioHelp')}
                className="w-full p-3.5 border rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none border-slate-300 leading-relaxed font-medium"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 pb-2 mb-4 border-b border-amber-200 text-amber-950 font-bold text-base">
              <Briefcase className="w-5 h-5 text-amber-700" />
              <span>4. Direct Fair Payout Settlement</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('upiLabel')}</label>
                <input
                  type="text"
                  value={formData.upiId}
                  onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                  placeholder="name@upi"
                  className="w-full px-3.5 py-2.5 border rounded-xl text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none border-slate-300 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('bankAccountLabel')}</label>
                <input
                  type="text"
                  value={formData.bankAccount}
                  onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                  placeholder="309827162534"
                  className="w-full px-3.5 py-2.5 border rounded-xl text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('bankIfscLabel')}</label>
                <input
                  type="text"
                  value={formData.bankIfsc}
                  onChange={(e) => setFormData({ ...formData, bankIfsc: e.target.value.toUpperCase() })}
                  placeholder="SBIN0001234"
                  className="w-full px-3.5 py-2.5 border rounded-xl text-sm font-mono uppercase focus:ring-2 focus:ring-amber-500 focus:outline-none border-slate-300 font-bold"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-amber-200 flex items-center justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-base px-8 py-3.5 rounded-xl shadow-lg shadow-amber-600/30 transition hover:scale-105 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Saving Profile...</span>
              ) : (
                <>
                  <span>{t('saveProfileBtn')}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
