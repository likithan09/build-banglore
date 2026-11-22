import React, { useEffect, useState } from 'react';
import { CheckCircle2, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface CallbackHandlerProps {
  onCompleted: () => void;
}

export const CallbackHandler: React.FC<CallbackHandlerProps> = ({ onCompleted }) => {
  const { verifyGST } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const enrollmentId = params.get('enrollmentId');
    const gstin = params.get('gstin');
    const legalName = params.get('legalName') || '';
    const tradeName = params.get('tradeName') || '';
    const state = params.get('state') || '';
    const phone = params.get('phone') || '9876543210';

    if (enrollmentId && gstin) {
      setDetails({ enrollmentId, gstin, legalName, tradeName, state, phone });
      verifyGST({
        phone,
        enrollment_id: enrollmentId,
        gstin,
        legal_name: legalName,
        trade_name: tradeName,
        state
      }).then(() => {
        setStatus('success');
      });
    } else {
      setStatus('error');
    }
  }, [verifyGST]);

  return (
    <div className="min-h-screen bg-[#fbf7ee] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-amber-200 p-6 text-center space-y-4">
        {status === 'loading' && (
          <div className="py-8 space-y-3">
            <Loader2 className="w-10 h-10 text-amber-600 animate-spin mx-auto" />
            <h3 className="font-bold text-slate-900 text-lg">Validating GST Enrollment Handshake...</h3>
            <p className="text-xs text-slate-500">Connecting enrollment token to KALASETU account</p>
          </div>
        )}

        {status === 'success' && details && (
          <div className="py-4 space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold border border-emerald-200 mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>GST VERIFIED & ENROLLED</span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-xl">Handshake Successful!</h3>
              <p className="text-xs text-slate-600 mt-1">
                Enrollment ID: <strong className="font-mono">{details.enrollmentId}</strong>
              </p>
              <p className="text-xs text-slate-600">
                GSTIN: <strong className="font-mono text-blue-900">{details.gstin}</strong>
              </p>
            </div>

            <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-900 text-left border border-amber-200">
              👉 <strong>Next Mandatory Step:</strong> Please complete your artisan/business profile to unlock the marketplace dashboard.
            </div>

            <button
              onClick={onCompleted}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl transition shadow flex items-center justify-center gap-2 text-sm"
            >
              <span>Continue to Profile Setup</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="py-6 space-y-3">
            <h3 className="font-bold text-red-600 text-lg">Callback Parameters Missing</h3>
            <p className="text-xs text-slate-500">Could not find valid enrollmentId in the redirect query.</p>
            <button
              onClick={onCompleted}
              className="bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-lg"
            >
              Return Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
