import React, { useState } from 'react';
import { ShieldCheck, Building2, MapPin, UserCheck, CreditCard, ArrowRight, Sparkles } from 'lucide-react';

interface GSTEnrollmentFormProps {
  onSubmit: (data: EnrollmentData) => void;
  redirectUri: string;
  initialPhone?: string;
  initialRole?: string;
}

export interface EnrollmentData {
  enrollmentId: string;
  gstin: string;
  legalName: string;
  tradeName: string;
  constitution: string;
  pan: string;
  state: string;
  district: string;
  pincode: string;
  address: string;
  signatoryName: string;
  phone: string;
  email: string;
  accountNumber: string;
  ifsc: string;
  category: string;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh'
];

export const GSTEnrollmentForm: React.FC<GSTEnrollmentFormProps> = ({
  onSubmit,
  redirectUri,
  initialPhone = '',
  initialRole = ''
}) => {
  const [formData, setFormData] = useState({
    legalName: '',
    tradeName: '',
    constitution: 'Individual Craftsman / Self-Employed Artisan',
    pan: '',
    state: 'Uttar Pradesh',
    district: 'Varanasi',
    pincode: '221001',
    address: 'Plot 42, Weavers Colony, Bunkar Seva Kendra',
    signatoryName: '',
    phone: initialPhone || '9876543210',
    email: 'artisan.contact@example.com',
    accountNumber: '50100492819283',
    ifsc: 'HDFC0001234',
    category: 'Handicrafts & Handlooms'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fillSampleArtisanData = () => {
    setFormData({
      legalName: 'Ramprasad Bunkar',
      tradeName: 'Kashi Resham Handlooms',
      constitution: 'Individual Craftsman / Self-Employed Artisan',
      pan: 'ABCDE1234F',
      state: 'Uttar Pradesh',
      district: 'Varanasi',
      pincode: '221001',
      address: 'House 14, Madanpura Silk Bunkar Gali',
      signatoryName: 'Ramprasad Bunkar',
      phone: initialPhone || '9876543210',
      email: 'ramprasad.varanasi@example.com',
      accountNumber: '309827162534',
      ifsc: 'SBIN0001234',
      category: 'Textiles & Handloom Weaving'
    });
    setErrors({});
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.legalName.trim()) errs.legalName = 'Legal Name is required';
    if (!formData.tradeName.trim()) errs.tradeName = 'Trade / Store Name is required';
    
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!formData.pan.trim()) {
      errs.pan = 'PAN is required';
    } else if (!panRegex.test(formData.pan.toUpperCase())) {
      errs.pan = 'Invalid PAN format (e.g. ABCDE1234F)';
    }

    if (!formData.signatoryName.trim()) errs.signatoryName = 'Signatory Name is required';
    
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      errs.phone = 'Valid 10-digit Indian Mobile Number required';
    }

    if (!/^[1-9][0-9]{5}$/.test(formData.pincode)) {
      errs.pincode = 'Valid 6-digit PIN code required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const cleanPan = formData.pan.toUpperCase().trim();
      const randomDigits = Math.floor(10000 + Math.random() * 90000);
      const enrollmentId = `GST-ENR-2026-${randomDigits}`;
      const stateCode = '09';
      const gstin = `${stateCode}${cleanPan}1Z${Math.floor(1 + Math.random() * 9)}`;

      const completedData: EnrollmentData = {
        ...formData,
        pan: cleanPan,
        enrollmentId,
        gstin
      };

      setIsSubmitting(false);
      onSubmit(completedData);
    }, 900);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-800/80 text-blue-200 text-xs px-3 py-1 rounded-full font-medium mb-2 border border-blue-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Goods & Services Tax Network (GSTN) • One-Time Enrollment Portal Demo
            </div>
            <h2 className="text-2xl font-bold">New Taxpayer & Artisan Registration (Form GST REG-01)</h2>
            <p className="text-blue-200 text-sm mt-1">
              Integrated Handshake with <strong>KALASETU</strong> for Artisan & Seller Onboarding
            </p>
          </div>

          <button
            type="button"
            onClick={fillSampleArtisanData}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            Auto-Fill Sample Artisan Data
          </button>
        </div>

        {redirectUri && (
          <div className="mt-4 pt-3 border-t border-blue-800/60 text-xs text-blue-300 flex items-center gap-2">
            <span className="font-semibold text-white">Redirect Callback Target:</span>
            <code className="bg-blue-950 px-2 py-0.5 rounded text-emerald-300 font-mono">
              {redirectUri}
            </code>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
        {/* Section 1: Business Details */}
        <div>
          <div className="flex items-center gap-2 pb-2 mb-4 border-b border-slate-200 text-blue-900 font-bold text-lg">
            <Building2 className="w-5 h-5 text-blue-700" />
            <span>1. Business & Tax Identity Details</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Legal Name of Business / Artisan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.legalName}
                onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                placeholder="e.g. Ramprasad Bunkar"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none border-slate-300"
              />
              {errors.legalName && <p className="text-red-600 text-xs mt-1">{errors.legalName}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Trade / Brand / Workshop Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.tradeName}
                onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                placeholder="e.g. Kashi Resham Handlooms"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none border-slate-300"
              />
              {errors.tradeName && <p className="text-red-600 text-xs mt-1">{errors.tradeName}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Constitution of Business
              </label>
              <select
                value={formData.constitution}
                onChange={(e) => setFormData({ ...formData, constitution: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none border-slate-300"
              >
                <option value="Individual Craftsman / Self-Employed Artisan">Individual Craftsman / Self-Employed Artisan</option>
                <option value="Proprietorship">Proprietorship</option>
                <option value="Registered Artisan Cooperative / SHG">Registered Artisan Cooperative / SHG</option>
                <option value="Partnership">Partnership</option>
                <option value="Private Limited Company">Private Limited Company</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Permanent Account Number (PAN) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                maxLength={10}
                value={formData.pan}
                onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                placeholder="ABCDE1234F"
                className="w-full px-3 py-2 border font-mono rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none border-slate-300 uppercase"
              />
              {errors.pan && <p className="text-red-600 text-xs mt-1">{errors.pan}</p>}
            </div>
          </div>
        </div>

        {/* Section 2: Location Details */}
        <div>
          <div className="flex items-center gap-2 pb-2 mb-4 border-b border-slate-200 text-blue-900 font-bold text-lg">
            <MapPin className="w-5 h-5 text-blue-700" />
            <span>2. Principal Place of Business</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State / UT</label>
              <select
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none border-slate-300"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">District / City</label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PIN Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                maxLength={6}
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                placeholder="221001"
                className="w-full px-3 py-2 border font-mono rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none border-slate-300"
              />
              {errors.pincode && <p className="text-red-600 text-xs mt-1">{errors.pincode}</p>}
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Premises / Workshop Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none border-slate-300"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Signatory & Contact */}
        <div>
          <div className="flex items-center gap-2 pb-2 mb-4 border-b border-slate-200 text-blue-900 font-bold text-lg">
            <UserCheck className="w-5 h-5 text-blue-700" />
            <span>3. Authorized Signatory & Contact</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Signatory Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.signatoryName}
                onChange={(e) => setFormData({ ...formData, signatoryName: e.target.value })}
                placeholder="Full Name"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none border-slate-300"
              />
              {errors.signatoryName && <p className="text-red-600 text-xs mt-1">{errors.signatoryName}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                maxLength={10}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="10-digit mobile"
                className="w-full px-3 py-2 border font-mono rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none border-slate-300"
              />
              {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none border-slate-300"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Bank Details */}
        <div>
          <div className="flex items-center gap-2 pb-2 mb-4 border-b border-slate-200 text-blue-900 font-bold text-lg">
            <CreditCard className="w-5 h-5 text-blue-700" />
            <span>4. Settlement Bank Account Details</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Account Number</label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                className="w-full px-3 py-2 border font-mono rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">IFSC Code</label>
              <input
                type="text"
                value={formData.ifsc}
                onChange={(e) => setFormData({ ...formData, ifsc: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border font-mono rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none border-slate-300 uppercase"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition duration-200 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Generating GST Enrollment Certificate...</span>
            ) : (
              <>
                <span>Submit & Generate Enrollment ID</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
