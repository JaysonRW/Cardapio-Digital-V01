import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Product, Category, Settings } from '../types';
import { useCart } from '../contexts/CartContext';
import { useTenant } from '../contexts/TenantContext';
import { formatCurrency } from '../lib/utils';
import { Link, useParams } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Trash2, Search, Clock, MapPin, Flame, Utensils, Sandwich, Beef, CupSoda, IceCreamCone, UtensilsCrossed, Star, ArrowLeft, MessageCircle, Store, Bike, ShoppingBag } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export function Menu() {
  const { restaurant, settings, tenantId, loading: tenantLoading } = useTenant();
  const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckout, setIsCheckout] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    orderType: 'delivery',
    address: '',
    paymentMethod: 'Dinheiro',
    notes: ''
  });
  
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  const { items, addItem, removeItem, updateQuantity, totalItems, totalPrice, clearCart } = useCart();

  const getCategoryIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('hamburguer') || lowerName.includes('burger') || lowerName.includes('lanche')) return <Beef size={16} />;
    if (lowerName.includes('sanduiche') || lowerName.includes('sanduíche')) return <Sandwich size={16} />;
    if (lowerName.includes('bebida') || lowerName.includes('refri') || lowerName.includes('suco')) return <CupSoda size={16} />;
    if (lowerName.includes('sobremesa') || lowerName.includes('doce')) return <IceCreamCone size={16} />;
    if (lowerName.includes('combo') || lowerName.includes('promocao') || lowerName.includes('promoção')) return <Star size={16} />;
    if (lowerName.includes('acompanhamento') || lowerName.includes('batata')) return <UtensilsCrossed size={16} />;
    return <Utensils size={16} />;
  };

  useEffect(() => {
    if (settings) {
      // Update SEO
      if (settings.seoTitle) document.title = settings.seoTitle;
      if (settings.seoDescription) {
        let meta = document.querySelector('meta[name="description"]');
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('name', 'description');
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', settings.seoDescription);
      }
    }
  }, [settings]);

  useEffect(() => {
    if (!tenantId) return;

    const unsubCats = onSnapshot(query(collection(db, 'restaurants', tenantId, 'categories'), orderBy('order')), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `restaurants/${tenantId}/categories`));

    const unsubProds = onSnapshot(collection(db, 'restaurants', tenantId, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)).filter(p => p.isActive));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `restaurants/${tenantId}/products`));

    return () => {
      unsubCats();
      unsubProds();
    };
  }, [tenantId]);

  const handleWhatsAppOrder = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!settings?.whatsappNumber) {
      alert('O número de WhatsApp não está configurado.');
      return;
    }

    let message = `*NOVO PEDIDO* 🍔\n\n`;
    message += `*Cliente:* ${customerInfo.name}\n`;
    message += `*Tipo:* ${customerInfo.orderType === 'delivery' ? 'Entrega' : 'Retirada no local'}\n`;
    if (customerInfo.orderType === 'delivery') {
      message += `*Endereço:* ${customerInfo.address}\n`;
    }
    message += `*Pagamento:* ${customerInfo.paymentMethod}\n\n`;
    
    message += `*RESUMO DO PEDIDO:*\n`;
    items.forEach(item => {
      message += `▪️ ${item.quantity}x ${item.name} - ${formatCurrency(item.price * item.quantity)}\n`;
    });
    
    if (customerInfo.notes) {
      message += `\n*Observações:* ${customerInfo.notes}\n`;
    }

    message += `\n*TOTAL: ${formatCurrency(totalPrice)}*`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${settings.whatsappNumber}?text=${encodedMessage}`;
    
    // Optional: Trigger Pixel/Analytics event here
    if ((window as any).fbq) {
      (window as any).fbq('track', 'InitiateCheckout', { value: totalPrice, currency: 'BRL' });
    }
    if ((window as any).gtag) {
      (window as any).gtag('event', 'begin_checkout', { value: totalPrice, currency: 'BRL' });
    }

    window.open(whatsappUrl, '_blank');
    clearCart();
    setIsCartOpen(false);
    setIsCheckout(false);
  };

  if (tenantLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg)] px-6 text-center">
        <h1 className="text-4xl font-serif font-bold text-zinc-800 mb-4">Restaurante não encontrado</h1>
        <p className="text-zinc-500 mb-8">O link que você acessou pode estar incorreto ou o restaurante não está ativo.</p>
        <Link to="/" className="bg-orange-500 text-white px-8 py-3 rounded-xl font-bold">Voltar para o Início</Link>
      </div>
    );
  }

  if (categories.length === 0 && products.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg)] text-[var(--text)] p-4 text-center">
        <h1 className="text-3xl font-serif font-bold text-[var(--text)] mb-4">Cardápio Digital</h1>
        <p className="text-zinc-500 mb-8 max-w-md">
          Bem-vindo! Nosso cardápio digital ainda está sendo preparado. Volte em breve para ver nossos produtos.
        </p>
        <div className="text-sm text-zinc-500 mt-12 border-t border-[var(--border)] pt-4 w-full max-w-xs">
          Você é o administrador? <Link to="/admin" className="text-[var(--primary)] hover:underline">Ir para o painel</Link>
        </div>
      </div>
    );
  }

  const promotedProducts = products.filter(p => p.isPromotion);
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="pb-24 bg-[var(--bg)] min-h-screen text-[var(--text)]">
      {/* Header */}
      <header className="bg-white pt-6 pb-6 px-4 sticky top-0 z-30 border-b border-[var(--border)] shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link to={`/${restaurantSlug}`} className="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-[var(--primary)] hover:bg-[var(--primary-soft)] rounded-full transition-colors mr-2 shrink-0">
            <ArrowLeft size={24} />
          </Link>
          {settings?.restaurantLogoUrl ? (
            <div className="w-14 h-14 rounded-full overflow-hidden flex-none border border-[var(--border)] shadow-sm bg-white">
              <img src={settings.restaurantLogoUrl} alt="Logo" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-14 h-14 bg-[var(--primary-soft)] rounded-full flex-none flex items-center justify-center text-[var(--primary)] font-bold text-xl shadow-sm border border-[var(--primary-soft-border)]">
              {settings?.restaurantName ? settings.restaurantName.charAt(0).toUpperCase() : (settings?.bannerTitle ? settings.bannerTitle.charAt(0).toUpperCase() : 'A')}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-serif font-bold text-[var(--text)] truncate">{settings?.restaurantName || settings?.bannerTitle || 'ÀUREA'}</h1>
            <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
              <span className="flex items-center gap-1 shrink-0"><Clock size={12} /> {settings?.restaurantHours || 'Ter–Dom · 18h às 00h'}</span>
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings?.restaurantAddress || 'Rua das Flores, 123 – Curitiba')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-[var(--primary)] transition-colors truncate"
              >
                <MapPin size={12} className="shrink-0" /> <span className="truncate">{settings?.restaurantAddress || 'Rua das Flores, 123 – Curitiba'}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Informações de Operação (Status, Entrega, Retirada) */}
        <div className="max-w-4xl mx-auto mt-6 flex flex-col items-center">
          {/* Status Badge */}
          <div className={`flex items-center gap-2 px-4 py-1.5 rounded-md font-bold text-sm mb-4 transition-colors ${settings?.isOpen !== false ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
             <Store size={18} />
             {settings?.isOpen !== false ? 'LOJA ABERTA' : 'LOJA FECHADA'}
          </div>

          {/* Delivery & Pickup Info */}
          {(settings?.deliveryTime || settings?.pickupTime) && (
            <div className="flex items-center justify-center gap-6 md:gap-10 text-zinc-700">
              {settings?.deliveryTime && (
                <div className="flex items-center gap-3">
                  <Bike size={24} className="text-[var(--primary)]" />
                  <div className="flex flex-col">
                    <span className="font-bold text-[var(--text)] leading-none text-lg">{settings.deliveryTime}</span>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold opacity-70">Minutos</span>
                  </div>
                </div>
              )}

              {settings?.deliveryTime && settings?.pickupTime && (
                <div className="w-px h-8 bg-zinc-800"></div>
              )}

              {settings?.pickupTime && (
                <div className="flex items-center gap-3">
                  <ShoppingBag size={24} className="text-[var(--primary)]" />
                  <div className="flex flex-col">
                    <span className="font-bold text-[var(--text)] leading-none text-lg">{settings.pickupTime}</span>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold opacity-70">Minutos</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Sticky Category Navigation */}
      <div className="bg-white border-b border-[var(--border)] sticky top-[88px] z-20 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 overflow-x-auto hide-scrollbar flex gap-2">
          <button 
            onClick={() => { setActiveCategory('all'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`whitespace-nowrap px-5 py-2 rounded-full font-medium text-sm transition-colors flex items-center gap-2 ${activeCategory === 'all' ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'bg-white text-zinc-600 hover:bg-[var(--surface-strong)] border border-[var(--border)]'}`}
          >
            <Utensils size={16} />
            Tudo
          </button>
          {categories.map(category => (
            <button 
              key={category.id}
              onClick={() => { 
                setActiveCategory(category.id);
                const el = document.getElementById(`category-${category.id}`);
                if (el) {
                  const y = el.getBoundingClientRect().top + window.scrollY - 140;
                  window.scrollTo({ top: y, behavior: 'smooth' });
                }
              }}
              className={`whitespace-nowrap px-5 py-2 rounded-full font-medium text-sm transition-colors flex items-center gap-2 ${activeCategory === category.id ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'bg-white text-zinc-600 hover:bg-[var(--surface-strong)] border border-[var(--border)]'}`}
            >
              {getCategoryIcon(category.name)}
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
          <input 
            type="text" 
            placeholder="Buscar no cardápio..." 
            className="w-full bg-white border border-[var(--border)] text-[var(--text)] placeholder-zinc-400 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-colors shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Banner de Promoção (Hero) */}
      {!searchQuery && settings?.promoBannerIsActive && settings?.promoBannerImageUrl && (
        <div className="max-w-4xl mx-auto px-4 mt-6">
          {settings.promoBannerLink ? (
            <a href={settings.promoBannerLink} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-2xl shadow-md hover:shadow-lg transition-shadow">
              <img src={settings.promoBannerImageUrl} alt="Promoção Especial" className="w-full h-auto object-cover max-h-64 sm:max-h-80" />
            </a>
          ) : (
            <div className="overflow-hidden rounded-2xl shadow-md">
              <img src={settings.promoBannerImageUrl} alt="Promoção Especial" className="w-full h-auto object-cover max-h-64 sm:max-h-80" />
            </div>
          )}
        </div>
      )}

      {/* Destacados (Highlights) */}
      {!searchQuery && promotedProducts.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <h2 className="text-xl font-serif font-bold text-[var(--text)] mb-6 flex items-center gap-2">
            <Flame className="text-[var(--primary)]" size={24} /> Destaques
          </h2>
          <div className="flex overflow-x-auto gap-4 pb-4 hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {promotedProducts.map(product => (
              <div key={`promo-${product.id}`} className="min-w-[160px] max-w-[160px] flex-none cursor-pointer group" onClick={() => addItem(product)}>
                <div className="relative h-40 rounded-2xl overflow-hidden mb-3 shadow-sm border border-[var(--border)] group-hover:border-[var(--primary-soft-border)] transition-colors bg-white">
                   <img src={product.imageUrl || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80'} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                   <span className="absolute top-2 left-2 bg-[var(--primary)] text-[var(--primary-foreground)] text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">PROMO</span>
                </div>
                <h3 className="font-bold text-[var(--text)] text-sm leading-tight mb-1 line-clamp-2 group-hover:text-[var(--primary)] transition-colors">{product.name}</h3>
                <p className="text-[var(--primary)] font-bold">{formatCurrency(product.price)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Menu Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {categories.map(category => {
          const categoryProducts = filteredProducts.filter(p => p.categoryId === category.id);
          if (categoryProducts.length === 0) return null;

          return (
            <div key={category.id} id={`category-${category.id}`} className="mb-10 scroll-mt-36">
              <h2 className="text-2xl font-serif font-bold text-[var(--text)] mb-6">{category.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryProducts.map(product => (
                  <div 
                    key={product.id} 
                    onClick={() => addItem(product)}
                    className="bg-white rounded-2xl border border-[var(--border)] p-4 flex gap-4 shadow-sm hover:border-[var(--primary-soft-border)] hover:-translate-y-0.5 transition-all cursor-pointer group"
                  >
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-[var(--text)] text-base mb-1 leading-tight group-hover:text-[var(--primary)] transition-colors">{product.name}</h3>
                        <p className="text-zinc-500 text-sm line-clamp-2 mb-2">{product.description}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[var(--primary)] font-bold text-lg">{formatCurrency(product.price)}</span>
                        {product.isPromotion && (
                          <>
                            <span className="text-zinc-500 text-xs line-through">{formatCurrency(product.price * 1.2)}</span>
                            <span className="bg-[var(--primary-soft)] text-[var(--primary)] text-[10px] font-bold px-2 py-0.5 rounded-md border border-[var(--primary-soft-border)]">PROMO</span>
                          </>
                        )}
                      </div>
                    </div>
                    {product.imageUrl && (
                      <div className="w-28 h-28 flex-none relative overflow-hidden rounded-xl">
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        {product.isPromotion && (
                          <span className="absolute top-2 left-2 bg-[var(--primary)] text-[var(--primary-foreground)] text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">PROMO</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {filteredProducts.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <p className="text-zinc-500">Nenhum produto encontrado para "{searchQuery}"</p>
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      {totalItems > 0 && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 left-6 sm:left-auto sm:w-80 bg-[var(--primary)] text-[var(--primary-foreground)] p-4 rounded-full shadow-lg hover:bg-[var(--primary-strong)] transition-transform transform hover:scale-105 flex items-center justify-between z-40 font-bold"
        >
          <div className="flex items-center gap-3">
            <div className="bg-black/10 p-2 rounded-full">
              <ShoppingCart size={24} />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-bold">{totalItems} {totalItems === 1 ? 'item' : 'itens'}</span>
              <span className="text-xs font-medium opacity-80 uppercase tracking-wider">Ver pedido</span>
            </div>
          </div>
          <span className="font-bold text-lg bg-white/15 text-white px-3 py-1 rounded-full">{formatCurrency(totalPrice)}</span>
        </button>
      )}

      {/* Footer */}
      <footer className="mt-12 py-8 px-4 text-center text-zinc-500 text-sm border-t border-[var(--border)]">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} {settings?.restaurantName || 'Cardápio Digital'}. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <a href="/admin" className="hover:text-zinc-300 transition-colors underline">Acesso Administrativo</a>
            <span>•</span>
            <span>Criado por <a href="https://www.propagounaweb.com.br" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--primary)] transition-colors font-medium">propagounaweb</a></span>
          </div>
        </div>
      </footer>

      {/* Cart Drawer/Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-zinc-950/30 backdrop-blur-sm transition-opacity" onClick={() => { setIsCartOpen(false); setIsCheckout(false); }}></div>
          <div className="relative w-full max-w-md bg-white text-[var(--text)] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-white">
              <h2 className="text-xl font-serif font-bold text-[var(--text)] flex items-center gap-3 tracking-tight">
                <div className="w-10 h-10 rounded-full bg-[var(--primary-soft)] flex items-center justify-center text-[var(--primary)]">
                  <ShoppingCart size={20} />
                </div>
                {isCheckout ? 'Finalizar Pedido' : 'Seu Pedido'}
              </h2>
              <button onClick={() => { setIsCartOpen(false); setIsCheckout(false); }} className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 flex items-center justify-center transition-colors">
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-[var(--surface-strong)]">
              {!isCheckout ? (
                items.length === 0 ? (
                  <div className="text-center text-zinc-500 mt-20 flex flex-col items-center">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 text-zinc-400 border border-[var(--border)]">
                      <ShoppingCart size={32} />
                    </div>
                    <p className="text-lg font-medium text-[var(--text)]">Seu carrinho está vazio</p>
                    <p className="text-sm mt-1">Adicione itens do cardápio para continuar.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-end mb-4 relative">
                      <button 
                        onClick={() => setShowClearConfirm(true)}
                        className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1.5 font-bold transition-colors px-3 py-1.5 rounded-full hover:bg-red-50 uppercase tracking-wider"
                      >
                        <Trash2 size={14} />
                        Limpar itens
                      </button>
                      {showClearConfirm && (
                        <div className="absolute right-0 top-8 flex items-center gap-3 bg-white p-3 rounded-xl shadow-lg border border-red-100 z-10 w-max">
                          <span className="text-sm text-zinc-800 font-medium">Esvaziar carrinho?</span>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => { clearCart(); setShowClearConfirm(false); }} 
                              className="text-sm bg-red-500 text-white px-4 py-1.5 rounded-lg font-bold hover:bg-red-600 transition-colors"
                            >
                              Sim
                            </button>
                            <button 
                              onClick={() => setShowClearConfirm(false)} 
                              className="text-sm bg-zinc-100 text-zinc-600 px-4 py-1.5 rounded-lg font-bold hover:bg-zinc-200 transition-colors"
                            >
                              Não
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    {items.map(item => (
                      <div key={item.id} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-[var(--border)] shadow-sm relative group">
                        {/* Imagem do item */}
                        <div className="w-20 h-20 flex-none bg-zinc-50 rounded-xl overflow-hidden border border-[var(--border)]">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-600">
                              <ShoppingCart size={20} />
                            </div>
                          )}
                        </div>
                        
                        {/* Detalhes do item */}
                        <div className="flex-1 py-1">
                          <h4 className="font-bold text-[var(--text)] text-sm leading-tight mb-1.5 pr-6">{item.name}</h4>
                          <span className="text-[var(--primary)] font-bold text-sm">{formatCurrency(item.price)}</span>
                        </div>
                        
                        {/* Controles de quantidade */}
                        <div className="flex flex-col items-center gap-2 bg-zinc-50 border border-[var(--border)] rounded-full px-1.5 py-2 flex-none absolute right-4 top-1/2 -translate-y-1/2">
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-6 h-6 rounded-full bg-white border border-[var(--border)] text-zinc-500 hover:text-[var(--primary)] hover:border-[var(--primary-soft-border)] flex items-center justify-center transition-colors shadow-sm">
                            <Plus size={14} strokeWidth={3} />
                          </button>
                          <span className="font-bold w-4 text-center text-xs text-[var(--text)]">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-6 h-6 rounded-full bg-white border border-[var(--border)] text-zinc-500 hover:text-red-500 hover:border-red-300 flex items-center justify-center transition-colors shadow-sm">
                            {item.quantity === 1 ? <Trash2 size={12} strokeWidth={3} /> : <Minus size={14} strokeWidth={3} />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <form id="checkout-form" onSubmit={handleWhatsAppOrder} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Seu nome</label>
                    <input
                      type="text" required
                      className="block w-full rounded-xl border-[var(--border)] shadow-sm focus:border-[var(--primary)] focus:ring-[var(--primary)] py-3 px-4 text-[var(--text)] bg-white placeholder-zinc-400"
                      value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
                      placeholder="Como podemos te chamar?"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-zinc-500 mb-2 uppercase tracking-wider">Tipo de pedido</label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className={`flex items-center justify-center gap-2 cursor-pointer p-3 rounded-xl border-2 transition-all ${customerInfo.orderType === 'delivery' ? 'border-[var(--primary)] bg-[var(--primary-soft)]' : 'border-[var(--border)] bg-white hover:border-[var(--primary-soft-border)]'}`}>
                        <input
                          type="radio" name="orderType" value="delivery"
                          checked={customerInfo.orderType === 'delivery'}
                          onChange={e => setCustomerInfo({...customerInfo, orderType: e.target.value})}
                          className="sr-only"
                        />
                        <span className={`font-bold ${customerInfo.orderType === 'delivery' ? 'text-[var(--primary)]' : 'text-zinc-500'}`}>Entrega</span>
                      </label>
                      <label className={`flex items-center justify-center gap-2 cursor-pointer p-3 rounded-xl border-2 transition-all ${customerInfo.orderType === 'pickup' ? 'border-[var(--primary)] bg-[var(--primary-soft)]' : 'border-[var(--border)] bg-white hover:border-[var(--primary-soft-border)]'}`}>
                        <input
                          type="radio" name="orderType" value="pickup"
                          checked={customerInfo.orderType === 'pickup'}
                          onChange={e => setCustomerInfo({...customerInfo, orderType: e.target.value})}
                          className="sr-only"
                        />
                        <span className={`font-bold ${customerInfo.orderType === 'pickup' ? 'text-[var(--primary)]' : 'text-zinc-500'}`}>Retirar</span>
                      </label>
                    </div>
                  </div>

                  {customerInfo.orderType === 'delivery' && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                      <label className="block text-sm font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Endereço de entrega</label>
                      <input
                        type="text" required
                        className="block w-full rounded-xl border-[var(--border)] shadow-sm focus:border-[var(--primary)] focus:ring-[var(--primary)] py-3 px-4 text-[var(--text)] bg-white placeholder-zinc-400"
                        value={customerInfo.address} onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})}
                        placeholder="Rua, número, bairro, referência"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Pagamento</label>
                    <select
                      className="block w-full rounded-xl border-[var(--border)] shadow-sm focus:border-[var(--primary)] focus:ring-[var(--primary)] py-3 px-4 text-[var(--text)] bg-white font-medium"
                      value={customerInfo.paymentMethod} onChange={e => setCustomerInfo({...customerInfo, paymentMethod: e.target.value})}
                    >
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="Cartão (levar maquininha)">Cartão (levar maquininha)</option>
                      <option value="Transferência / Pix">Transferência / Pix</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Observações (opcional)</label>
                    <textarea
                      rows={2}
                      className="block w-full rounded-xl border-[var(--border)] shadow-sm focus:border-[var(--primary)] focus:ring-[var(--primary)] py-3 px-4 text-[var(--text)] bg-white resize-none placeholder-zinc-400"
                      value={customerInfo.notes} onChange={e => setCustomerInfo({...customerInfo, notes: e.target.value})}
                      placeholder="Ex: Tirar a cebola, troco para R$ 50..."
                    />
                  </div>
                </form>
              )}
            </div>

            <div className="p-6 border-t border-[var(--border)] bg-white">
              <div className="flex justify-between items-center mb-6">
                <span className="text-zinc-500 font-bold uppercase tracking-wider text-sm">Total a pagar</span>
                <span className="text-3xl font-bold text-[var(--text)] tracking-tight">{formatCurrency(totalPrice)}</span>
              </div>
              
              {!isCheckout ? (
                <button
                  onClick={() => setIsCheckout(true)}
                  disabled={items.length === 0}
                  className="w-full bg-[var(--primary)] text-[var(--primary-foreground)] py-4 rounded-xl font-bold text-lg hover:bg-[var(--primary-strong)] transition-colors disabled:opacity-50 disabled:hover:bg-[var(--primary)] disabled:cursor-not-allowed flex items-center justify-center shadow-sm"
                >
                  Continuar
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsCheckout(false)}
                    className="w-1/3 bg-zinc-100 text-zinc-700 py-4 rounded-xl font-bold hover:bg-zinc-200 transition-colors flex items-center justify-center"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    form="checkout-form"
                    className="w-2/3 bg-[var(--primary)] text-[var(--primary-foreground)] py-4 rounded-xl font-bold text-lg hover:bg-[var(--primary-strong)] transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <MessageCircle size={20} />
                    Enviar Pedido
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
