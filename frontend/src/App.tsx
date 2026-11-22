import React, { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Header } from './components/common/Header';
import { SplashScreen } from './components/splash/SplashScreen';
import { RegisterLoginModal } from './components/auth/RegisterLoginModal';
import { CallbackHandler } from './components/auth/CallbackHandler';
import { SellerOnboarding } from './components/onboarding/SellerOnboarding';
import { BuyerOnboarding } from './components/onboarding/BuyerOnboarding';
import { BuyerMarketplace } from './components/buyer/BuyerMarketplace';
import { ProductDetailModal } from './components/buyer/ProductDetailModal';
import { CartDrawer } from './components/buyer/CartDrawer';
import { AIPoweredPlatform } from './components/seller/AIPoweredPlatform';
import { MinimalAddProductModal } from './components/seller/MinimalAddProductModal';
import { ArtisanInbox } from './components/seller/ArtisanInbox';
import { ConnectionsHub } from './components/connections/ConnectionsHub';
import { AdminEventsPage } from './components/admin/AdminEventsPage';

function MainApp() {
  const { 
    user, 
    isAuthenticated, 
    activeRole, 
    artisanProfileCompleted, 
    buyerProfileCompleted, 
    setArtisanCompleted, 
    setBuyerCompleted 
  } = useAuth();
  const { t } = useLanguage();

  // Navigation State
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    return !localStorage.getItem('kalasetu_splash_seen');
  });
  const [currentTab, setCurrentTab] = useState<string>('marketplace');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialRole, setAuthModalInitialRole] = useState<'artisan' | 'buyer'>('buyer');
  const [isCallbackRoute, setIsCallbackRoute] = useState(false);

  // Modals & Cart State
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);

  // Strict Role Route & Tab Protection: Buyers can NEVER access artisan tabs
  useEffect(() => {
    if (!isAuthenticated) {
      if (currentTab === 'ai-panel' || currentTab === 'artisan-inbox') {
        setCurrentTab('marketplace');
      }
    } else if (activeRole === 'buyer') {
      if (currentTab === 'ai-panel' || currentTab === 'artisan-inbox') {
        setCurrentTab('marketplace');
      }
    }
  }, [activeRole, isAuthenticated, currentTab]);

  useEffect(() => {
    // Check if returning from GST Demo Callback on port 5173
    const path = window.location.pathname;
    const search = window.location.search;
    if (path.includes('/auth/callback') || search.includes('enrollmentId')) {
      setIsCallbackRoute(true);
      setShowSplash(false);
    }
  }, []);

  const handleEnterFromSplash = () => {
    setShowSplash(false);
    localStorage.setItem('kalasetu_splash_seen', 'true');
    if (!isAuthenticated) {
      setAuthModalInitialRole('buyer');
      setIsAuthModalOpen(true);
    }
  };

  const handleOpenAuth = (role: 'artisan' | 'buyer' = 'buyer') => {
    setAuthModalInitialRole(role);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (role: string) => {
    if (role === 'artisan') {
      setCurrentTab(artisanProfileCompleted ? 'ai-panel' : 'marketplace');
    } else {
      setCurrentTab('marketplace');
    }
  };

  const handleAddToCart = (product: any) => {
    const existing = cartItems.find((it) => it.id === product.id);
    if (existing) {
      setCartItems(cartItems.map((it) => it.id === product.id ? { ...it, quantity: (it.quantity || 1) + 1 } : it));
    } else {
      setCartItems([...cartItems, { ...product, quantity: 1 }]);
    }
    setSelectedProduct(null);
    setIsCartOpen(true);
  };

  const handleRemoveCartItem = (id: string) => {
    setCartItems(cartItems.filter((it) => it.id !== id));
  };

  const handleOrderPlaced = (orderData: any) => {
    setCartItems([]);
  };

  // If on GST callback route from port 5173
  if (isCallbackRoute) {
    return <CallbackHandler onCompleted={() => setIsCallbackRoute(false)} />;
  }

  // If showing splash screen
  if (showSplash) {
    return <SplashScreen onEnter={handleEnterFromSplash} />;
  }

  const isRoleProfileComplete = activeRole === 'artisan' ? artisanProfileCompleted : buyerProfileCompleted;

  return (
    <div className="min-h-screen bg-[#fcf9f2] flex flex-col font-sans text-slate-800">
      {/* GLOBAL HEADER WITH DEDICATED ROLE ISOLATION */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenAuth={handleOpenAuth}
        cartCount={cartItems.length}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <main className="flex-1">
        {/* MANDATORY ONBOARDING FLOW SEPARATED BY ACTIVE ROLE */}
        {isAuthenticated && !isRoleProfileComplete ? (
          activeRole === 'artisan' ? (
            <SellerOnboarding
              onProfileCompleted={() => {
                setArtisanCompleted(true);
                setCurrentTab('ai-panel');
              }}
            />
          ) : (
            <BuyerOnboarding
              onProfileCompleted={() => {
                setBuyerCompleted(true);
                setCurrentTab('marketplace');
              }}
            />
          )
        ) : (
          /* REGULAR POST-ONBOARDING TABS */
          <>
            {currentTab === 'marketplace' && (
              <BuyerMarketplace
                onSelectProduct={(p) => setSelectedProduct(p)}
              />
            )}

            {/* ARTISAN ONLY TABS - STRICTLY ACCESSIBLE TO ARTISANS */}
            {activeRole === 'artisan' && currentTab === 'ai-panel' && (
              <AIPoweredPlatform
                onOpenAddProduct={() => setIsAddProductOpen(true)}
              />
            )}

            {activeRole === 'artisan' && currentTab === 'artisan-inbox' && (
              <ArtisanInbox
                onOpenConnections={() => setCurrentTab('connections')}
              />
            )}

            {currentTab === 'connections' && (
              <ConnectionsHub />
            )}

            {currentTab === 'admin-events' && (
              <AdminEventsPage />
            )}
          </>
        )}
      </main>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        onInquirySent={() => setCurrentTab('connections')}
      />

      {/* Minimal Add Product Modal - ONLY FOR ARTISAN SELLERS */}
      {activeRole === 'artisan' && (
        <MinimalAddProductModal
          isOpen={isAddProductOpen}
          onClose={() => setIsAddProductOpen(false)}
          onProductCreated={(newProd) => {
            // Keep seller inside seller studio & notify inventory to reload
            if (newProd) {
              window.dispatchEvent(new CustomEvent('product_created', { detail: newProd }));
            }
          }}
          onViewProduct={() => {
            // Navigate to marketplace preview without opening buyer purchase modal
            setCurrentTab('marketplace');
            setIsAddProductOpen(false);
          }}
          onOpenInquiries={() => {
            // Navigate to Artisan Inquiries inbox
            setCurrentTab('artisan-inbox');
            setIsAddProductOpen(false);
          }}
        />
      )}

      {/* Cart & Checkout Drawer - ONLY FOR BUYERS */}
      {(activeRole === 'buyer' || !isAuthenticated) && (
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cartItems}
          onRemoveItem={handleRemoveCartItem}
          onOrderPlaced={handleOrderPlaced}
          onNavigateToTab={(tab) => {
            setCurrentTab(tab);
            setIsCartOpen(false);
          }}
        />
      )}

      {/* Register & Login Modal with Strict Role Propagation */}
      <RegisterLoginModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialRole={authModalInitialRole}
        onSuccess={handleAuthSuccess}
      />

      {/* Global Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800 text-center mt-12">
        <div className="max-w-6xl mx-auto px-4 space-y-2">
          <p className="font-semibold text-slate-300">
            KALASETU (कलासेतु) — "Speak in your language. Connect to the right market."
          </p>
          <p className="text-slate-500 text-[11px]">
            AI-Powered Voice-First Market Linkage Platform for Marginalized Indian Artisans and Ethical Buyers.
          </p>
        </div>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <NotificationProvider>
          <MainApp />
        </NotificationProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
