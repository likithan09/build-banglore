import React from 'react';
import { LayoutDashboard, ShieldCheck, Sparkles, TrendingUp, Package, MessageSquare, Plus, ArrowUpRight, Award } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

interface ArtisanDashboardProps {
  onAddListing: () => void;
  onOpenChat: () => void;
}

export const ArtisanDashboard: React.FC<ArtisanDashboardProps> = ({
  onAddListing,
  onOpenChat
}) => {
  const { t } = useLanguage();
  const { user, profile } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 text-xs px-3 py-1 rounded-full font-bold border border-amber-400/30">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>
                {user?.is_verified ? (user?.verification_type === 'pan' ? 'PAN Verified Buyer' : 'GST Verified Artisan') : 'Community Member'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold font-sans">
              Welcome, {profile?.full_name || user?.full_name || 'Artisan Partner'}!
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              {profile?.business_name} • {profile?.craft_category} • {profile?.state}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onAddListing}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-lg transition"
            >
              <Plus className="w-4 h-4" />
              <span>{t('addListing')}</span>
            </button>

            <button
              onClick={onOpenChat}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl border border-white/20 transition"
            >
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span>{t('bargainRooms')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Active Listings</span>
            <Package className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">4 Products</div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>100% Fair Price Certified</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Direct Inquiries</span>
            <MessageSquare className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">12 Buyers</div>
          <div className="text-[11px] text-indigo-600 font-semibold">Across 6 States in 4 Languages</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Fair Value Generated</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">₹48,200</div>
          <div className="text-[11px] text-emerald-600 font-semibold">Zero Middleman Deduction</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Trust Badge</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg font-black text-slate-900">Master Craftsman</div>
          <div className="text-[11px] text-slate-500 font-semibold">National Heritage Network</div>
        </div>
      </div>

      {/* Profile & Credentials Summary */}
      <div className="bg-white rounded-2xl p-6 border border-amber-200 shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-900 text-lg">Verified Identity Credentials</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 block">Verification Status</span>
            <strong className="text-emerald-700 text-sm flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
              {user?.is_verified ? 'Active & Validated' : 'Verified Community Account'}
            </strong>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 block">Linked Mobile Number</span>
            <strong className="text-slate-900 text-sm font-mono">+91 {user?.phone}</strong>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 block">Payout Destination</span>
            <strong className="text-slate-900 text-sm font-mono">{profile?.upi_id || 'UPI Connected'}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
