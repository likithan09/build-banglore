import React, { useState } from 'react';
import { X, ShieldCheck, ArrowRight, Building2, User, Sparkles, KeyRound, ExternalLink } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface LoginVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const LoginVerificationModal: React.FC<LoginVerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { t } = useLanguage();
  const { selectedRole, setSelectedRole, loginWithPhone, verifyOtp, verifyPAN } = useAuth();

  const [step, setStep] = useState<'role' | 'phone' | 'otp' | 'buyer_verify'>('role');
  const [phone, setPhone] = useState('9876543210');
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState('123456');
  const [buyerVerifyType, setBuyerVerifyType] = useState<'gst' | 'pan'>('pan');
  const [pan, setPan] = useState('');
  const [panName, setPanName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep('phone');
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    setError(null);
    const res = await loginWithPhone(phone, selectedRole);
    setLoading(false);
    if (res.success) {
      if (res.demo_otp) setDemoOtp(res.demo_otp);
      setStep('otp');
    } else {
      setError('Failed to send OTP. Please try again.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const ok = await verifyOtp(phone, otp || '123456', selectedRole);
    setLoading(false);
    if (ok) {
      if (selectedRole === 'buyer') {
        setStep('buyer_verify');
      } else {
        onSuccess();
      }
    } else {
      setError('Invalid OTP code. Please use 123456 for demo verification.');
    }
  };

  const handleVerifyPanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(pan.toUpperCase())) {
      setError('Invalid PAN format (e.g. ABCDE1234F)');
      return;
    }
    if (!panName.trim()) {
      setError('Name on PAN card is required');
      return;
    }

    setLoading(true);
    setError(null);
    const res = await verifyPAN(phone, pan.toUpperCase(), panName);
    setLoading(false);
    if (res.success) {
      onSuccess();
    } else {
      setError(res.message || 'PAN verification failed.');
    }
  };

  const handleOpenGstPortal = () => {
    const callbackUrl = encodeURIComponent('http://localhost:5174/auth/callback');
    const gstUrl = `http://localhost:5173/?redirect_uri=${callbackUrl}&phone=${phone}&role=${selectedRole}`;
    window.location.href = gstUrl;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-amber-200 max-w-lg w-full overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 to-amber-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center font-bold text-base">
              क
            </div>
            <div>
              <h3 className="font-bold text-base">{t('appName')} Identity Gateway</h3>
              <p className="text-xs text-amber-200">Secure Onboarding & Verification</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          {step === 'role' && (
            <div className="space-y-4">
              <h4 className="text-center font-bold text-slate-900 text-base">
                {t('selectRoleTitle')}
              </h4>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => handleRoleSelect('artisan')}
                  className="w-full text-left p-4 rounded-xl border-2 border-amber-200 hover:border-amber-600 bg-amber-50/40 hover:bg-amber-50 transition group flex items-start gap-3.5"
                >
                  <div className="p-2.5 bg-amber-100 text-amber-800 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900">{t('roleArtisanTitle')}</div>
                    <div className="text-xs text-slate-600 mt-0.5">{t('roleArtisanDesc')}</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleSelect('seller')}
                  className="w-full text-left p-4 rounded-xl border-2 border-slate-200 hover:border-amber-600 bg-slate-50/40 hover:bg-amber-50 transition group flex items-start gap-3.5"
                >
                  <div className="p-2.5 bg-slate-200 text-slate-800 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900">{t('roleSellerTitle')}</div>
                    <div className="text-xs text-slate-600 mt-0.5">{t('roleSellerDesc')}</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleSelect('buyer')}
                  className="w-full text-left p-4 rounded-xl border-2 border-slate-200 hover:border-amber-600 bg-slate-50/40 hover:bg-amber-50 transition group flex items-start gap-3.5"
                >
                  <div className="p-2.5 bg-slate-200 text-slate-800 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900">{t('roleBuyerTitle')}</div>
                    <div className="text-xs text-slate-600 mt-0.5">{t('roleBuyerDesc')}</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {step === 'phone' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
                <span>Selected Role: <strong className="text-amber-800 capitalize">{selectedRole}</strong></span>
                <button type="button" onClick={() => setStep('role')} className="text-amber-700 hover:underline">Change</button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('phoneLabel')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-slate-500 font-bold">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder={t('phonePlaceholder')}
                    className="w-full pl-12 pr-3 py-2.5 border rounded-xl font-mono text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none border-slate-300 font-bold"
                    autoFocus
                  />
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
                💡 {t('demoOtpNotice')}
              </div>

              {selectedRole !== 'buyer' && (
                <div className="pt-2">
                  <div className="text-xs text-slate-500 text-center mb-2 font-medium">Or verify directly with GST Portal:</div>
                  <button
                    type="button"
                    onClick={handleOpenGstPortal}
                    className="w-full flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs py-2.5 rounded-xl transition"
                  >
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <span>{t('goToGstPortal')}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || phone.length < 10}
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {loading ? <span>Sending OTP...</span> : (
                  <>
                    <span>{t('sendOtp')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center">
                <div className="inline-flex p-3 bg-amber-100 text-amber-800 rounded-full mb-2">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-base">{t('enterOtp')}</h4>
                <p className="text-xs text-slate-500 mt-0.5">Sent to +91 {phone}</p>
              </div>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full text-center tracking-widest text-2xl font-mono py-2.5 border rounded-xl border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
                  autoFocus
                />
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-center text-xs text-emerald-800 font-semibold">
                ✨ Demo OTP is pre-filled: <strong>{demoOtp}</strong>
              </div>

              <div className="flex items-center justify-between text-xs">
                <button type="button" onClick={() => setStep('phone')} className="text-slate-500 hover:underline">
                  ← Change Number
                </button>
                <button type="button" onClick={() => setOtp('123456')} className="text-amber-700 font-bold hover:underline">
                  Auto-fill OTP
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {loading ? <span>Verifying...</span> : <span>{t('verifyAndProceed')}</span>}
              </button>
            </form>
          )}

          {step === 'buyer_verify' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="inline-flex p-2.5 bg-indigo-100 text-indigo-800 rounded-full mb-1">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-base">{t('buyerVerificationTitle')}</h4>
                <p className="text-xs text-slate-600">{t('buyerVerificationDesc')}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setBuyerVerifyType('pan')}
                  className={`py-2 rounded-lg transition ${buyerVerifyType === 'pan' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
                >
                  Verify PAN & Mobile
                </button>
                <button
                  type="button"
                  onClick={() => setBuyerVerifyType('gst')}
                  className={`py-2 rounded-lg transition ${buyerVerifyType === 'gst' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
                >
                  Verify GSTIN
                </button>
              </div>

              {buyerVerifyType === 'pan' ? (
                <form onSubmit={handleVerifyPanSubmit} className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t('panLabel')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={pan}
                      onChange={(e) => setPan(e.target.value.toUpperCase())}
                      placeholder={t('panPlaceholder')}
                      className="w-full px-3 py-2 border rounded-xl font-mono text-sm uppercase focus:ring-2 focus:ring-amber-500 focus:outline-none border-slate-300 font-bold"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t('panNameLabel')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={panName}
                      onChange={(e) => setPanName(e.target.value)}
                      placeholder={t('panNamePlaceholder')}
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none border-slate-300"
                    />
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-600">
                    🔒 Mobile Number (+91 {phone}) will be cryptographically linked with PAN for single-account integrity.
                  </div>

                  <button
                    type="submit"
                    disabled={loading || pan.length < 10}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl transition shadow text-xs flex items-center justify-center gap-2"
                  >
                    {loading ? <span>Validating PAN & Preventing Duplicates...</span> : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>{t('verifyPanButton')}</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="space-y-3 pt-2 text-center">
                  <p className="text-xs text-slate-600">
                    Business buyers with GSTIN can verify directly via the GST Portal.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenGstPortal}
                    className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs py-3 rounded-xl transition shadow flex items-center justify-center gap-2"
                  >
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <span>Open GST Enrollment Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
