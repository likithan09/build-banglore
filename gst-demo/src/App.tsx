import React, { useState, useEffect } from 'react';
import { GSTEnrollmentForm, EnrollmentData } from './components/GSTEnrollmentForm';
import { EnrollmentStatus } from './components/EnrollmentStatus';
import { ShieldCheck, HelpCircle } from 'lucide-react';

export function App() {
  const [redirectUri, setRedirectUri] = useState<string>('');
  const [initialPhone, setInitialPhone] = useState<string>('');
  const [initialRole, setInitialRole] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<'form' | 'status'>('form');
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect_uri') || params.get('callback') || 'http://localhost:5174/auth/callback';
    const phone = params.get('phone') || '';
    const role = params.get('role') || '';
    setRedirectUri(redirect);
    setInitialPhone(phone);
    setInitialRole(role);
  }, []);

  const handleEnrollmentSubmit = (data: EnrollmentData) => {
    setEnrollmentData(data);
    setCurrentPage('status');
  };

  const handleReset = () => {
    setEnrollmentData(null);
    setCurrentPage('form');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Govt of India Demo Banner */}
      <header className="bg-slate-900 text-white border-b-4 border-amber-500">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center font-bold text-amber-400 text-lg">
              GST
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                <span>Goods and Services Tax Portal</span>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] uppercase font-semibold px-2 py-0.5 rounded border border-amber-500/30">
                  Demo Sandbox
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Government of India • Ministry of Finance • Taxpayer & Artisan Services
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>SSL 256-Bit Encrypted</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-slate-400">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Helpdesk: 1800-103-4786</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8">
        {currentPage === 'form' ? (
          <GSTEnrollmentForm
            onSubmit={handleEnrollmentSubmit}
            redirectUri={redirectUri}
            initialPhone={initialPhone}
            initialRole={initialRole}
          />
        ) : (
          enrollmentData && (
            <EnrollmentStatus
              data={enrollmentData}
              redirectUri={redirectUri}
              onReset={handleReset}
            />
          )
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-6 border-t border-slate-800 text-center">
        <div className="max-w-6xl mx-auto px-4 space-y-1">
          <p>© 2026 Goods and Services Tax Network (GSTN). Sandbox Demo Environment for KALASETU Integration.</p>
          <p className="text-slate-500">Site Best Viewed in Latest Chrome / Firefox / Safari / Edge.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
