import React, { useState, useEffect } from 'react';
import { Search, Mic, Volume2, ShieldCheck, HeartHandshake, Eye, Sparkles, Filter, MapPin, Clock } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useVoiceOutput } from '../../hooks/useVoiceOutput';
import { Product } from '../../types';

interface MarketplaceViewProps {
  onStartBargain: (product: Product) => void;
  voiceSearchQuery?: string;
  onOpenVoiceSearch?: () => void;
}

const CATEGORIES = [
  'All Crafts',
  'Textiles & Handlooms',
  'Paintings & Folk Art',
  'Pottery & Ceramics',
  'Metal Craft & Bell Metal'
];

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  onStartBargain,
  voiceSearchQuery = '',
  onOpenVoiceSearch
}) => {
  const { t, language } = useLanguage();
  const { speak, isSpeaking, stop } = useVoiceOutput();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(voiceSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState('All Crafts');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (voiceSearchQuery) {
      setSearch(voiceSearchQuery);
    }
  }, [voiceSearchQuery]);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, search, language]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const catParam = selectedCategory === 'All Crafts' ? '' : `&category=${encodeURIComponent(selectedCategory)}`;
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
      const res = await fetch(`http://localhost:8000/api/products?lang=${language}${catParam}${searchParam}`);
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
      }
    } catch {
      // Fallback seed
    }
    setLoading(false);
  };

  const getProductTitle = (p: Product) => {
    if (p.title_translations && p.title_translations[language]) {
      return p.title_translations[language];
    }
    return p.title;
  };

  const getProductDesc = (p: Product) => {
    if (p.description_translations && p.description_translations[language]) {
      return p.description_translations[language];
    }
    return p.description;
  };

  const handleListenStory = (p: Product) => {
    if (isSpeaking) {
      stop();
    } else {
      const textToSpeak = `${getProductTitle(p)}. Created by master artisan ${p.artisan_name} in ${p.artisan_location}. ${getProductDesc(p)}. ${p.cultural_story || ''}`;
      speak(textToSpeak);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Search & Category Filter Header */}
      <div className="bg-white rounded-2xl p-6 shadow-md border border-amber-200/80 space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm font-medium"
            />
            <button
              onClick={onOpenVoiceSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 transition"
              title="Speak in your language"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm ${
                  selectedCategory === cat
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {cat === 'All Crafts' ? t('allCategories') : cat}
              </button>
            ))}
          </div>
        </div>

        {search && (
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>Showing results for: <strong className="text-amber-800 font-semibold">"{search}"</strong></span>
            <button onClick={() => setSearch('')} className="text-amber-700 hover:underline">Clear</button>
          </div>
        )}
      </div>

      {/* Product Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-slate-900 text-xl font-sans flex items-center gap-2">
            <span>{t('marketplace')}</span>
            <span className="text-xs font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
              {products.length} {t('directFromArtisan')}
            </span>
          </h3>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl h-96 animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-amber-200 max-w-lg mx-auto">
            <Sparkles className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <h4 className="font-bold text-slate-900 text-lg">No Crafts Found</h4>
            <p className="text-xs text-slate-500 mt-1">{t('noProductsFound')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-amber-200/80 shadow-sm hover:shadow-xl transition-all duration-200 overflow-hidden flex flex-col group"
              >
                {/* Image Container */}
                <div className="relative h-56 bg-slate-100 overflow-hidden">
                  <img
                    src={p.images?.[0] || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800'}
                    alt={getProductTitle(p)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-full border border-white/20">
                    {p.category}
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-emerald-700/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3 text-emerald-300" />
                    <span>{t('verifiedArtisan')}</span>
                  </div>

                  <button
                    onClick={() => handleListenStory(p)}
                    className="absolute bottom-3 right-3 p-2 bg-amber-600 hover:bg-amber-500 text-white rounded-full shadow-lg transition"
                    title={t('audioNarration')}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Artisan Info */}
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                      <span className="font-semibold text-amber-900 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-600" />
                        {p.artisan_location}
                      </span>
                      <span className="flex items-center gap-1 text-slate-600">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {p.hours_worked} {t('hoursOfWork')}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-base line-clamp-1 group-hover:text-amber-800 transition">
                      {getProductTitle(p)}
                    </h4>

                    <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                      {getProductDesc(p)}
                    </p>
                  </div>

                  {/* Pricing & Actions */}
                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex items-baseline justify-between mb-3">
                      <div>
                        <span className="text-xs text-slate-400 block">{t('suggestedRetail')}</span>
                        <span className="font-black text-xl text-slate-900">₹{p.price.toLocaleString('en-IN')}</span>
                      </div>

                      {p.fair_price_suggested && (
                        <div className="text-right">
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                            ✨ {t('fairPriceBadge')}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSelectedProduct(p)}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{t('viewDetails')}</span>
                      </button>

                      <button
                        onClick={() => onStartBargain(p)}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow-sm"
                      >
                        <HeartHandshake className="w-3.5 h-3.5" />
                        <span>{t('startBargain')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs text-amber-800 font-bold uppercase tracking-wider">{selectedProduct.category}</span>
                <h3 className="font-black text-xl text-slate-900 mt-0.5">{getProductTitle(selectedProduct)}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>By {selectedProduct.artisan_name} • {selectedProduct.artisan_location}</span>
                </p>
              </div>

              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-800 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="h-64 rounded-xl overflow-hidden bg-slate-100">
              <img
                src={selectedProduct.images?.[0] || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800'}
                alt={selectedProduct.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Cultural Story Section */}
            {selectedProduct.cultural_story && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-700" />
                    Living Craft Heritage & Lineage
                  </span>
                  <button
                    onClick={() => handleListenStory(selectedProduct)}
                    className="flex items-center gap-1 text-amber-800 hover:text-amber-950 font-bold"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{isSpeaking ? 'Stop Audio' : 'Listen'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed italic">
                  "{selectedProduct.cultural_story}"
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Craft Technique</span>
                <strong className="text-slate-900">{selectedProduct.craft_technique || 'Handloom / Handcrafted'}</strong>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Labor Time</span>
                <strong className="text-slate-900">{selectedProduct.hours_worked} Hours</strong>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Direct Price</span>
                <strong className="text-slate-900 text-sm">₹{selectedProduct.price.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const p = selectedProduct;
                  setSelectedProduct(null);
                  onStartBargain(p);
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow transition flex items-center gap-1.5"
              >
                <HeartHandshake className="w-4 h-4" />
                <span>{t('startBargain')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
