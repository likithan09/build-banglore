import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Search, 
  Filter, 
  ShieldCheck, 
  MapPin, 
  Sparkles, 
  Tag, 
  Loader2, 
  SlidersHorizontal,
  ChevronRight,
  ShoppingBag
} from 'lucide-react';

interface BuyerMarketplaceProps {
  onSelectProduct: (product: any) => void;
  voiceSearchQuery?: string;
}

export const BuyerMarketplace: React.FC<BuyerMarketplaceProps> = ({
  onSelectProduct,
  voiceSearchQuery
}) => {
  const { language, currentLanguageInfo, t } = useLanguage();

  const [query, setQuery] = useState(voiceSearchQuery || '');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [maxPrice, setMaxPrice] = useState(6000);
  const [selectedState, setSelectedState] = useState('All');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Update query when voiceSearchQuery changes
  useEffect(() => {
    if (voiceSearchQuery) {
      setQuery(voiceSearchQuery);
    }
  }, [voiceSearchQuery]);

  // Execute OpenSearch query
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (selectedCategory !== 'All') params.set('category', selectedCategory);
      if (selectedState !== 'All') params.set('state', selectedState);
      if (maxPrice < 6000) params.set('max_price', maxPrice.toString());
      if (verifiedOnly) params.set('verified_only', 'true');
      params.set('lang', currentLanguageInfo.speechCode || 'en-IN');

      const res = await fetch(`http://localhost:8000/api/products/search?${params.toString()}`);
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
      }
    } catch {
      // Fallback initial products
      setProducts([
        {
          id: 'prd_channapatna_01',
          title: 'Channapatna Handcrafted Lacquered Wooden Toys Set',
          category: 'Woodcraft',
          price: 650.0,
          stock: 45,
          seller_name: 'Rameshwar Gowda',
          state: 'Karnataka',
          city: 'Channapatna',
          is_verified: true,
          verification_type: 'enrollment_id',
          image_url: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80',
          tags: ['Channapatna', 'Wooden Toys', 'GI Tagged', 'Eco Friendly']
        },
        {
          id: 'prd_banarasi_02',
          title: 'Handwoven Banarasi Pure Katan Silk Saree',
          category: 'Handloom',
          price: 4850.0,
          stock: 18,
          seller_name: 'Ansari Weavers Guild',
          state: 'Uttar Pradesh',
          city: 'Varanasi',
          is_verified: true,
          verification_type: 'gstin',
          image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
          tags: ['Banarasi', 'Handloom', 'Pure Silk', 'Zari Work']
        },
        {
          id: 'prd_madhubani_03',
          title: 'Madhubani Traditional Folk Art Canvas Painting',
          category: 'Painting',
          price: 1450.0,
          stock: 25,
          seller_name: 'Sita Devi Mithila Collective',
          state: 'Bihar',
          city: 'Madhubani',
          is_verified: true,
          verification_type: 'enrollment_id',
          image_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
          tags: ['Madhubani', 'Mithila Art', 'Handmade Canvas']
        },
        {
          id: 'prd_bidriware_04',
          title: 'Bidriware Handcrafted Silver Inlay Flower Vase',
          category: 'Metalcraft',
          price: 2750.0,
          stock: 12,
          seller_name: 'Rashid Ahmed Bidri Crafts',
          state: 'Karnataka',
          city: 'Bidar',
          is_verified: true,
          verification_type: 'gstin',
          image_url: 'https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=800&q=80',
          tags: ['Bidriware', 'Silver Inlay', 'GI Tagged']
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [query, selectedCategory, selectedState, maxPrice, verifiedOnly, language]);

  // Fetch search suggestions as user types
  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (val.trim().length >= 2) {
      fetch(`http://localhost:8000/api/products/suggestions?prefix=${encodeURIComponent(val.trim())}`)
        .then(res => res.json())
        .then(data => {
          if (data.suggestions) setSuggestions(data.suggestions);
        })
        .catch(() => setSuggestions([]));
    } else {
      setSuggestions([]);
    }
  };

  const categories = ['All', 'Woodcraft', 'Handloom', 'Painting', 'Metalcraft', 'Pottery'];
  const states = ['All', 'Karnataka', 'Uttar Pradesh', 'Bihar', 'Rajasthan', 'West Bengal', 'Tamil Nadu', 'Gujarat'];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-6">
      
      {/* Search Header Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-slate-900 to-amber-950 rounded-3xl p-6 md:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="inline-block bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
            {t('poweredBySearch') || 'Powered by Aiven OpenSearch Fuzzy Discovery'}
          </span>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
            {t('discoverArtisansTitle') || 'Discover Verified Artisans Across India'}
          </h1>
          <p className="text-slate-300 text-xs md:text-sm">
            {t('discoverArtisansSubtitle') || 'Typo-tolerant multi-lingual search across certified handlooms, GI-tagged crafts, and direct artisan producer clusters.'}
          </p>

          {/* Search Bar Powered by OpenSearch (§4 Mandate) */}
          <div className="relative pt-2">
            <div className="relative flex items-center bg-white rounded-2xl shadow-2xl overflow-hidden p-1.5 border-2 border-amber-500/40">
              <Search className="w-5 h-5 text-slate-400 ml-3 flex-shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full px-3 py-2 text-sm text-slate-900 font-medium focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="text-xs text-slate-400 hover:text-slate-700 px-2 font-bold"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Search Suggestions Dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white text-slate-900 rounded-xl shadow-xl border border-slate-200 overflow-hidden z-20">
                {suggestions.map((s, idx) => (
                  <div
                    key={idx}
                    onClick={() => { setQuery(s); setSuggestions([]); }}
                    className="px-4 py-2 text-xs font-semibold hover:bg-amber-50 cursor-pointer flex items-center justify-between border-b border-slate-100 last:border-0"
                  >
                    <span>{s}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 ${
                selectedCategory === cat
                  ? 'bg-amber-600 text-white shadow'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* State Filter + Verified Only Toggle */}
        <div className="flex items-center gap-3 text-xs font-bold text-slate-700 ml-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Region:</span>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none"
            >
              {states.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t('verifiedOnly')}</span>
          </label>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-amber-600" />
          <span className="text-xs font-semibold">Searching via OpenSearch Index...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
          <Search className="w-10 h-10 mx-auto text-slate-300" />
          <h3 className="text-base font-bold text-slate-800">{t('noProductsMatched')}</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search keywords, lowering the price threshold, or resetting the regional filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <div
              key={p.id}
              onClick={() => onSelectProduct(p)}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between group hover:-translate-y-1"
            >
              <div>
                {/* Product Image */}
                <div className="relative h-48 bg-slate-100 overflow-hidden">
                  <img
                    src={p.enhanced_image_url || p.image_url}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Verification Badge (§2.f) */}
                  <div className="absolute top-2.5 left-2.5">
                    {p.verification_type === 'gstin' ? (
                      <span className="bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow backdrop-blur-sm flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> {t('gstVerified')}
                      </span>
                    ) : (
                      <span className="bg-amber-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow backdrop-blur-sm flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> {t('enrollmentVerified')}
                      </span>
                    )}
                  </div>

                  <span className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded backdrop-blur-sm">
                    Stock: {p.stock}
                  </span>
                </div>

                {/* Details */}
                <div className="p-4 space-y-2">
                  <span className="text-[10px] font-extrabold uppercase text-amber-700 tracking-wider">
                    {p.category}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-amber-700 transition">
                    {p.display_title || p.title}
                  </h3>
                  
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{p.seller_name || 'Artisan'} • {p.state || 'India'}</span>
                  </div>
                </div>
              </div>

              {/* Price & Action */}
              <div className="px-4 pb-4 pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Wholesale Price</span>
                  <span className="text-base font-extrabold text-slate-900">₹{p.price}</span>
                </div>

                <button
                  type="button"
                  className="bg-amber-50 group-hover:bg-amber-600 text-amber-800 group-hover:text-white text-xs font-bold px-3 py-1.5 rounded-xl transition shadow-sm"
                >
                  {t('viewDetails')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
