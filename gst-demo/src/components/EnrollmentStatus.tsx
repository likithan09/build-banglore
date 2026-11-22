import React, { useState, useEffect } from 'react';
import { CheckCircle2, ArrowRight, ExternalLink, ShieldCheck, Copy, Check } from 'lucide-react';
import { EnrollmentData } from './GSTEnrollmentForm';

interface EnrollmentStatusProps {
  data: EnrollmentData;
  redirectUri: string;
  onReset: () => void;
}

export const EnrollmentStatus: React.FC<EnrollmentStatusProps> = ({
  data,
  redirectUri,
  onReset
}) => {
  const [countdown, setCountdown] = useState(5);
  const [copied, setCopied] = useState(false);
  const [autoRedirectEnabled, setAutoRedirectEnabled] = useState(true);

  const buildRedirectUrl = () => {
    if (!redirectUri) return '';
    try {
      const url = new URL(redirectUri, window.location.origin);
      url.searchParams.set('enrollmentId', data.enrollmentId);
      url.searchParams.set('gstin', data.gstin);
      url.searchParams.set('legalName', data.legalName);
      url.searchParams.set('tradeName', data.tradeName);
      url.searchParams.set('state', data.state);
      url.searchParams.set('district', data.district);
      url.searchParams.set('status', 'APPROVED');
      url.searchParams.set('pan', data.pan);
      url.searchParams.set('phone', data.phone);
      return url.toString();
    } catch {
      const glue = redirectUri.includes('?') ? '&' : '?';
      return `${redirectUri}${glue}enrollmentId=${encodeURIComponent(data.enrollmentId)}&gstin=${encodeURIComponent(data.gstin)}&legalName=${encodeURIComponent(data.legalName)}&tradeName=${encodeURIComponent(data.tradeName)}&state=${encodeURIComponent(data.state)}&status=APPROVED`;
    }
  };

  const redirectUrl = buildRedirectUrl();

  const handleRedirectNow = () => {
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  };

  useEffect(() => {
    if (!autoRedirectEnabled || !redirectUrl) return;

    if (countdown <= 0) {
      handleRedirectNow();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, autoRedirectEnabled, redirectUrl]);

  const copyUrl = () => {
    navigator.clipboard.writeText(redirectUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white p-6 text-center">
        <div className="inline-flex p-3 bg-white/10 rounded-full mb-3 backdrop-blur-sm">
          <CheckCircle2 className="w-12 h-12 text-emerald-300" />
        </div>
        <h2 className="text-2xl font-bold">GST Verification Successful!</h2>
        <p className="text-emerald-100 text-sm mt-1">
          Temporary Enrollment Number (ARN) has been generated and approved.
        </p>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        {/* Certificate Card */}
        <div className="border-2 border-emerald-500/40 bg-emerald-50/50 rounded-xl p-5 relative">
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-semibold border border-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            GOVT VERIFIED
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500 text-xs block font-medium">Enrollment ID (Ref No)</span>
              <span className="font-mono font-bold text-slate-900 text-base">{data.enrollmentId}</span>
            </div>

            <div>
              <span className="text-slate-500 text-xs block font-medium">Allotted GSTIN</span>
              <span className="font-mono font-bold text-blue-900 text-base">{data.gstin}</span>
            </div>

            <div>
              <span className="text-slate-500 text-xs block font-medium">Legal / Artisan Name</span>
              <span className="font-semibold text-slate-800">{data.legalName}</span>
            </div>

            <div>
              <span className="text-slate-500 text-xs block font-medium">Trade / Workshop Name</span>
              <span className="font-semibold text-slate-800">{data.tradeName}</span>
            </div>

            <div>
              <span className="text-slate-500 text-xs block font-medium">PAN</span>
              <span className="font-mono text-slate-800">{data.pan}</span>
            </div>

            <div>
              <span className="text-slate-500 text-xs block font-medium">Jurisdiction State</span>
              <span className="font-medium text-slate-800">{data.state}, {data.district}</span>
            </div>
          </div>
        </div>

        {/* Handshake Callback Information */}
        {redirectUrl ? (
          <div className="bg-slate-900 text-white rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                Returning to KALASETU via Handshake Callback
              </span>
              <button
                onClick={() => setAutoRedirectEnabled(!autoRedirectEnabled)}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                {autoRedirectEnabled ? 'Pause countdown' : 'Resume countdown'}
              </button>
            </div>

            <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs font-mono text-emerald-300 break-all">
              <span className="flex-1">{redirectUrl}</span>
              <button
                onClick={copyUrl}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition"
                title="Copy callback URL"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                {autoRedirectEnabled ? (
                  <>Redirecting back in <strong className="text-amber-400 font-bold text-sm">{countdown}s</strong>...</>
                ) : (
                  'Auto-redirect paused.'
                )}
              </span>

              <button
                onClick={handleRedirectNow}
                className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition shadow"
              >
                <span>Return to KALASETU Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-800">
            No <code>redirect_uri</code> parameter was supplied in the URL. You can inspect the enrollment credentials above.
          </div>
        )}

        <div className="flex justify-start">
          <button
            onClick={onReset}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium underline"
          >
            ← Register Another Business
          </button>
        </div>
      </div>
    </div>
  );
};
