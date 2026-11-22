import React, { useState, useEffect } from 'react';
import { Send, Mic, Volume2, ShieldCheck, Sparkles, X, HeartHandshake, Check } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useVoiceOutput } from '../../hooks/useVoiceOutput';
import { Product, NegotiationSession, ChatMessage } from '../../types';

interface BargainingChatModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BargainingChatModal: React.FC<BargainingChatModalProps> = ({
  product,
  isOpen,
  onClose
}) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { speak } = useVoiceOutput();

  const [session, setSession] = useState<NegotiationSession | null>(null);
  const [inputText, setInputText] = useState('');
  const [offerPrice, setOfferPrice] = useState<number>(product ? Math.round(product.price * 0.9) : 0);
  const [dealAccepted, setDealAccepted] = useState(false);

  // Voice input for chat message
  const { isListening, toggleListening } = useVoiceInput({
    targetInputId: 'chatMsgInput',
    onTranscript: (txt) => {
      setInputText(txt);
    }
  });

  useEffect(() => {
    if (!product || !isOpen) return;

    // Create session
    const initSession = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/negotiation/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_id: product.id,
            product_title: product.title,
            product_price: product.price,
            buyer_id: user?.id || 'buyer_demo',
            buyer_name: user?.full_name || 'Buyer',
            buyer_lang: language,
            seller_id: product.artisan_id,
            seller_name: product.artisan_name,
            seller_lang: 'hi'
          })
        });
        const data = await res.json();
        if (data.session) {
          setSession(data.session);
        }
      } catch {
        // Fallback
        const fallbackSession: NegotiationSession = {
          session_id: `neg_${product.id}_101`,
          product_id: product.id,
          product_title: product.title,
          product_price: product.price,
          buyer_id: user?.id || 'buyer_demo',
          buyer_name: user?.full_name || 'Buyer',
          buyer_lang: language,
          seller_id: product.artisan_id,
          seller_name: product.artisan_name,
          seller_lang: 'hi',
          status: 'active',
          current_offer: product.price,
          messages: [
            {
              sender_id: 'system',
              sender_name: 'KALASETU Mediator',
              sender_role: 'mediator',
              text: `Bargaining room open for '${product.title}'. Original price ₹${product.price}. Real-time translation active.`,
              language: 'en',
              timestamp: new Date().toISOString()
            }
          ],
          created_at: new Date().toISOString()
        };
        setSession(fallbackSession);
      }
    };

    initSession();
    setOfferPrice(Math.round(product.price * 0.9));
    setDealAccepted(false);
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const handleSendMessage = async (e?: React.FormEvent, customOffer?: number) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !customOffer) return;

    const messageText = inputText || `I would like to offer ₹${customOffer}`;
    const priceToOffer = customOffer || (inputText.includes('₹') ? parseFloat(inputText.replace(/[^0-9]/g, '')) : undefined);

    const newMsg: ChatMessage = {
      sender_id: user?.id || 'usr_buyer',
      sender_name: user?.full_name || 'Buyer',
      sender_role: user?.role === 'artisan' ? 'seller' : 'buyer',
      text: messageText,
      language: language,
      price_offer: priceToOffer,
      timestamp: new Date().toISOString()
    };

    setInputText('');

    if (session) {
      const updatedMessages = [...session.messages, newMsg];
      setSession({ ...session, messages: updatedMessages });

      // Simulate Artisan Automated Regional Response
      setTimeout(() => {
        const artisanMsg: ChatMessage = {
          sender_id: product.artisan_id,
          sender_name: product.artisan_name,
          sender_role: 'seller',
          text: `नमस्ते! इस हस्तशिल्प को तैयार करने में 32 घंटे लगे हैं। मैं इसे ₹${Math.round(product.price * 0.95)} में दे सकता हूँ।`,
          translated_text: `Namaste! It takes 32 hours of dedicated handcraft to weave this piece. Lowest fair deal is ₹${Math.round(product.price * 0.95)}.`,
          translated_lang: language,
          language: 'hi',
          price_offer: Math.round(product.price * 0.95),
          timestamp: new Date().toISOString()
        };
        setSession((prev) => prev ? { ...prev, messages: [...prev.messages, artisanMsg] } : null);
        speak(artisanMsg.translated_text || artisanMsg.text);
      }, 1200);
    }
  };

  const handleAcceptDeal = () => {
    setDealAccepted(true);
    speak('Deal accepted! Connecting to direct payment.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-amber-200 max-w-2xl w-full h-[600px] flex flex-col overflow-hidden">
        {/* Chat Room Header */}
        <div className="bg-gradient-to-r from-slate-900 to-amber-950 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center">
              <HeartHandshake className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm">{t('negotiationTitle')}</h3>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold border border-emerald-400/40">
                  LIVE TRANSLATION
                </span>
              </div>
              <p className="text-xs text-amber-200">
                Item: <strong>{product.title}</strong> (₹{product.price.toLocaleString('en-IN')})
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Mediator Tip */}
        <div className="bg-amber-50 px-4 py-2 border-b border-amber-200 flex items-center gap-2 text-xs text-amber-900">
          <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
          <span>{t('aiMediatorTip')}</span>
        </div>

        {/* Messages List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
          {session?.messages.map((m, idx) => {
            const isMe = m.sender_id === (user?.id || 'buyer_demo');
            const isMediator = m.sender_role === 'mediator';

            if (isMediator) {
              return (
                <div key={idx} className="bg-slate-200/80 rounded-xl p-2.5 text-center text-xs text-slate-700 font-medium">
                  {m.text}
                </div>
              );
            }

            return (
              <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="text-[10px] text-slate-500 mb-0.5 px-1 font-semibold">
                  {m.sender_name} ({m.sender_role === 'seller' ? 'Artisan' : 'Buyer'})
                </div>
                <div
                  className={`max-w-[80%] p-3 rounded-2xl text-xs space-y-1 shadow-sm ${
                    isMe
                      ? 'bg-amber-600 text-white rounded-br-none'
                      : 'bg-white text-slate-900 border border-slate-200 rounded-bl-none'
                  }`}
                >
                  <p className="font-semibold text-sm leading-relaxed">{m.text}</p>
                  {m.translated_text && (
                    <div className="text-[11px] opacity-90 border-t border-white/20 pt-1 italic">
                      🌐 Translation: {m.translated_text}
                    </div>
                  )}
                  {m.price_offer && (
                    <div className="inline-block bg-slate-900 text-amber-300 px-2 py-0.5 rounded text-[11px] font-mono font-bold mt-1">
                      Offer: ₹{m.price_offer}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {dealAccepted && (
            <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-xl text-center space-y-2">
              <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-emerald-950 text-base">Fair Deal Finalized!</h4>
              <p className="text-xs text-emerald-800">
                Payment escrow and artisan fulfillment notification have been initiated.
              </p>
            </div>
          )}
        </div>

        {/* Quick Offer Bar */}
        {!dealAccepted && (
          <div className="px-4 py-2 bg-white border-t border-slate-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold">{t('makeOfferLabel')}:</span>
              <input
                type="number"
                value={offerPrice}
                onChange={(e) => setOfferPrice(parseFloat(e.target.value) || 0)}
                className="w-24 px-2 py-1 border rounded-lg text-xs font-mono font-bold"
              />
              <button
                type="button"
                onClick={() => handleSendMessage(undefined, offerPrice)}
                className="bg-amber-100 hover:bg-amber-200 text-amber-900 px-3 py-1 rounded-lg text-xs font-bold"
              >
                {t('sendOfferBtn')}
              </button>
            </div>

            <button
              type="button"
              onClick={handleAcceptDeal}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-xs font-extrabold shadow transition"
            >
              {t('acceptDealBtn')}
            </button>
          </div>
        )}

        {/* Chat Input Bar */}
        {!dealAccepted && (
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2.5 rounded-xl transition ${
                isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-amber-100 text-amber-900'
              }`}
              title="Speak in your language"
            >
              <Mic className="w-4 h-4" />
            </button>

            <input
              id="chatMsgInput"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Speak or type in your language..."
              className="flex-1 px-3.5 py-2.5 border rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none border-slate-300 font-medium"
            />

            <button
              type="submit"
              className="p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition shadow"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
