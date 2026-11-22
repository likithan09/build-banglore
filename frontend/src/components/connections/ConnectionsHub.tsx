import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Link2, 
  MessageSquare, 
  Send, 
  MapPin, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Calendar, 
  Loader2,
  Building2,
  UserCheck
} from 'lucide-react';

export const ConnectionsHub: React.FC = () => {
  const { user, activeRole } = useAuth();
  const { t } = useLanguage();
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConnection, setActiveConnection] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [inputMsg, setInputMsg] = useState('');

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const uid = user?.id || 'usr_buyer_demo';
      const res = await fetch(`http://localhost:8000/api/connections/${uid}`);
      const data = await res.json();
      if (data.connections && data.connections.length > 0) {
        setConnections(data.connections);
        setActiveConnection(data.connections[0]);
      } else {
        // Sample accepted connection
        const sample = [
          {
            id: 'conn_demo_01',
            artisan_name: 'Rameshwar Gowda',
            craft_name: 'Channapatna Wooden Toys',
            artisan_state: 'Karnataka',
            verification_type: 'enrollment_id',
            company_name: 'Desi Heritage Retail Enterprises',
            buyer_contact: 'Ananya Sharma',
            buyer_email: 'ananya@desiheritage.in',
            buyer_state: 'Karnataka',
            product_title: 'Channapatna Handcrafted Lacquered Wooden Toys Set',
            product_image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=400&q=80',
            initial_message: 'Interested in placing a wholesale order for 50 toy sets.',
            quantity_needed: 50,
            status: 'active',
            created_at: new Date().toISOString()
          }
        ];
        setConnections(sample);
        setActiveConnection(sample[0]);
      }
    } catch {
      const sample = [
        {
          id: 'conn_demo_01',
          artisan_name: 'Rameshwar Gowda',
          craft_name: 'Channapatna Wooden Toys',
          artisan_state: 'Karnataka',
          verification_type: 'enrollment_id',
          company_name: 'Desi Heritage Retail Enterprises',
          buyer_contact: 'Ananya Sharma',
          buyer_email: 'ananya@desiheritage.in',
          buyer_state: 'Karnataka',
          product_title: 'Channapatna Handcrafted Lacquered Wooden Toys Set',
          product_image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=400&q=80',
          initial_message: 'Interested in placing a wholesale order for 50 toy sets.',
          quantity_needed: 50,
          status: 'active',
          created_at: new Date().toISOString()
        }
      ];
      setConnections(sample);
      setActiveConnection(sample[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, [user]);

  useEffect(() => {
    if (activeConnection) {
      setChatMessages([
        {
          sender: 'buyer',
          name: activeConnection.company_name || 'Buyer',
          text: activeConnection.initial_message || 'Hello, we would like to collaborate directly on handloom and craft items.',
          time: '10:30 AM'
        },
        {
          sender: 'artisan',
          name: activeConnection.artisan_name || 'Artisan',
          text: 'Namaste! We are happy to connect. We can fulfill your order using traditional lacquer and natural dyes.',
          time: '10:45 AM'
        }
      ]);
    }
  }, [activeConnection]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const newMsg = {
      sender: activeRole === 'artisan' ? 'artisan' : 'buyer',
      name: activeRole === 'artisan' ? (activeConnection?.artisan_name || 'Artisan') : (activeConnection?.company_name || 'Buyer'),
      text: inputMsg.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages([...chatMessages, newMsg]);
    setInputMsg('');
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Link2 className="w-5 h-5 text-emerald-600" />
          <span>{t('connectionsTitle')}</span>
        </h2>
        <p className="text-xs text-slate-500">
          {t('connectionsSubtitle')}
        </p>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-amber-600" />
          <span className="text-xs">{t('loadingConnections') || 'Loading established connections...'}</span>
        </div>
      ) : connections.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500 space-y-2">
          <Link2 className="w-10 h-10 mx-auto text-slate-300" />
          <h3 className="text-base font-bold text-slate-800">{t('noConnections')}</h3>
          <p className="text-xs max-w-sm mx-auto">
            {t('noConnectionsDesc') || 'When a buyer sends an inquiry and the artisan accepts it, the established direct relationship will appear here with contact details and chat.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
          
          {/* Connection List Sidebar */}
          <div className="border-r border-slate-200 bg-slate-50/50 p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              {t('connectedPartners') || 'Connected Partners'}
            </h3>
            {connections.map((conn) => (
              <div
                key={conn.id}
                onClick={() => setActiveConnection(conn)}
                className={`p-3 rounded-xl border cursor-pointer transition ${
                  activeConnection?.id === conn.id
                    ? 'border-emerald-500 bg-emerald-50/60 shadow-sm'
                    : 'border-slate-200 bg-white hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={conn.product_image}
                    alt="Craft"
                    className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {activeRole === 'artisan' ? conn.company_name : conn.artisan_name}
                    </h4>
                    <span className="text-[10px] text-slate-500 block truncate">{conn.product_title}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Active Connection & Chat Thread Stub (§1 Mandate) */}
          {activeConnection && (
            <div className="md:col-span-2 flex flex-col justify-between">
              
              {/* Partner Contact Card */}
              <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold">
                      {activeRole === 'artisan' ? activeConnection.company_name : activeConnection.artisan_name}
                    </h3>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> {t('connectedPartner') || 'Connected Partner'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-300 mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-400" />
                      {activeRole === 'artisan' ? activeConnection.buyer_state : activeConnection.artisan_state}
                    </span>
                    <span>•</span>
                    <span>{t('directSupplyCorridor') || 'Direct Supply Corridor'}</span>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <span className="text-slate-400 block text-[10px]">{t('productContext') || 'Product Context:'}</span>
                  <span className="font-semibold text-amber-300">{activeConnection.product_title}</span>
                </div>
              </div>

              {/* Chat Thread Messages */}
              <div className="p-5 flex-1 overflow-y-auto space-y-3 bg-slate-50">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col max-w-[80%] ${
                      (activeRole === 'artisan' && msg.sender === 'artisan') ||
                      (activeRole !== 'artisan' && msg.sender === 'buyer')
                        ? 'ml-auto items-end'
                        : 'mr-auto items-start'
                    }`}
                  >
                    <span className="text-[10px] text-slate-400 mb-0.5">{msg.name} • {msg.time}</span>
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                        (activeRole === 'artisan' && msg.sender === 'artisan') ||
                        (activeRole !== 'artisan' && msg.sender === 'buyer')
                          ? 'bg-amber-600 text-white rounded-br-none'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input Stub */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-white flex gap-2">
                <input
                  type="text"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  placeholder={t('typeDirectMessage') || 'Type direct message to partner...'}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition"
                >
                  <Send className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t('send') || 'Send'}</span>
                </button>
              </form>

            </div>
          )}

        </div>
      )}
    </div>
  );
};
