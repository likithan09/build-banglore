import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Inbox, 
  Check, 
  X, 
  Loader2, 
  Sparkles, 
  Building2, 
  MapPin, 
  Calendar, 
  Package, 
  CheckCircle2, 
  MessageSquare
} from 'lucide-react';

interface ArtisanInboxProps {
  onOpenConnections: () => void;
}

export const ArtisanInbox: React.FC<ArtisanInboxProps> = ({ onOpenConnections }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const sellerId = user?.id || 'usr_artisan_channapatna';
      const res = await fetch(`http://localhost:8000/api/inquiries/seller/${sellerId}`);
      const data = await res.json();
      if (data.inquiries) {
        setInquiries(data.inquiries);
      }
    } catch {
      // Demo inquiries
      setInquiries([
        {
          id: 'inq_demo_01',
          product_title: 'Channapatna Handcrafted Lacquered Wooden Toys Set',
          product_image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=400&q=80',
          company_name: 'Desi Heritage Retail Enterprises',
          contact_name: 'Ananya Sharma',
          buyer_city: 'Bengaluru',
          buyer_state: 'Karnataka',
          quantity_needed: 50,
          target_timeline: 'Within 3 weeks',
          message: 'Hello, we are curating natural handmade wooden toys for our eco-friendly retail store. Would love to establish a direct producer partnership.',
          status: 'pending',
          match_affinity: 94,
          why_matched: 'Excellent Match (94% affinity) based on category fit, monthly volume capacity, and verified compliance status.',
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();

    const handleRefresh = () => {
      fetchInquiries();
    };
    window.addEventListener('orders_updated', handleRefresh);
    const interval = setInterval(fetchInquiries, 4000);

    return () => {
      window.removeEventListener('orders_updated', handleRefresh);
      clearInterval(interval);
    };
  }, [user]);

  const handleAccept = async (id: string) => {
    setProcessingId(id);
    try {
      await fetch(`http://localhost:8000/api/inquiries/${id}/accept`, { method: 'POST' });
      // Update local state
      setInquiries(inquiries.map(inq => inq.id === id ? { ...inq, status: 'accepted' } : inq));
    } catch {
      setInquiries(inquiries.map(inq => inq.id === id ? { ...inq, status: 'accepted' } : inq));
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (id: string) => {
    setProcessingId(id);
    try {
      await fetch(`http://localhost:8000/api/inquiries/${id}/decline`, { method: 'POST' });
      setInquiries(inquiries.map(inq => inq.id === id ? { ...inq, status: 'declined' } : inq));
    } catch {
      setInquiries(inquiries.map(inq => inq.id === id ? { ...inq, status: 'declined' } : inq));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Inbox className="w-5 h-5 text-amber-600" />
            <span>{t('inboxTitle')}</span>
          </h2>
          <p className="text-xs text-slate-500">
            {t('inboxSubtitle')}
          </p>
        </div>

        <button
          onClick={onOpenConnections}
          className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition"
        >
          {t('connections')}
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-amber-600" />
          <span className="text-xs">Loading incoming inquiries...</span>
        </div>
      ) : inquiries.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500 space-y-2">
          <Inbox className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">{t('noInquiries')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inq) => (
            <div key={inq.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={inq.product_image || 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=150&q=80'}
                    alt="Product"
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{inq.product_title}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="font-semibold text-slate-700">{inq.company_name || 'Buyer'}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {inq.buyer_city || 'India'}, {inq.buyer_state || ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Match affinity score */}
                {inq.match_affinity && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-1 text-right">
                    <span className="text-[10px] text-amber-800 font-bold block">AI Match Score</span>
                    <span className="text-sm font-black text-amber-900">{inq.match_affinity}%</span>
                  </div>
                )}
              </div>

              {/* Message */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-700">
                <span className="text-slate-400 font-bold block mb-1">Buyer Inquiry Message:</span>
                <p className="italic">"{inq.message}"</p>
                <div className="flex items-center gap-4 mt-2 text-[11px] font-semibold text-slate-500">
                  <span>Quantity: {inq.quantity_needed} units</span>
                  <span>Timeline: {inq.target_timeline || 'Flexible'}</span>
                </div>
              </div>

              {/* Explainability note */}
              {inq.why_matched && (
                <div className="text-[11px] text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>{inq.why_matched}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-[11px] font-mono text-slate-400">ID: {inq.id}</span>

                {inq.status === 'accepted' ? (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Connection Accepted
                  </span>
                ) : inq.status === 'declined' ? (
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    Declined
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDecline(inq.id)}
                      disabled={processingId === inq.id}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-600 flex items-center gap-1 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </button>
                    <button
                      onClick={() => handleAccept(inq.id)}
                      disabled={processingId === inq.id}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow transition"
                    >
                      {processingId === inq.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Accept Connection</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
