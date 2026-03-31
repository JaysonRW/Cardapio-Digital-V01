import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Product, Category, Settings } from '../types';
import { useCart } from '../contexts/CartContext';
import { formatCurrency } from '../lib/utils';
import { ShoppingCart, Plus, Minus, Trash2, Search, Clock, MapPin, Flame } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export function Menu() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckout, setIsCheckout] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    orderType: 'delivery',
    address: '',
    paymentMethod: 'cash',
    notes: ''
  });
  
  const { items, addItem, removeItem, updateQuantity, totalItems, totalPrice, clearCart } = useCart();

  useEffect(() => {
    const unsubCats = onSnapshot(query(collection(db, 'categories'), orderBy('order')), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'categories'));

    const unsubProds = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)).filter(p => p.isActive));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'products'));

    const unsubSettings = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Settings;
        setSettings({ id: docSnap.id, ...data });
        
        // Update SEO
        if (data.seoTitle) document.title = data.seoTitle;
        if (data.seoDescription) {
          let meta = document.querySelector('meta[name="description"]');
          if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('name', 'description');
            document.head.appendChild(meta);
          }
          meta.setAttribute('content', data.seoDescription);
        }
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/general'));

    return () => {
      unsubCats();
      unsubProds();
      unsubSettings();
    };
  }, []);

  const handleWhatsAppOrder = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!settings?.whatsappNumber) {
      alert('El número de WhatsApp no está configurado.');
      return;
    }

    let message = `*NUEVO PEDIDO* 🍔\n\n`;
    message += `*Cliente:* ${customerInfo.name}\n`;
    message += `*Tipo:* ${customerInfo.orderType === 'delivery' ? 'Entrega a domicilio' : 'Retiro en local'}\n`;
    if (customerInfo.orderType === 'delivery') {
      message += `*Dirección:* ${customerInfo.address}\n`;
    }
    message += `*Pago:* ${customerInfo.paymentMethod}\n\n`;
    
    message += `*RESUMEN DEL PEDIDO:*\n`;
    items.forEach(item => {
      message += `▪️ ${item.quantity}x ${item.name} - ${formatCurrency(item.price * item.quantity)}\n`;
    });
    
    if (customerInfo.notes) {
      message += `\n*Notas:* ${customerInfo.notes}\n`;
    }

    message += `\n*TOTAL: ${formatCurrency(totalPrice)}*`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${settings.whatsappNumber}?text=${encodedMessage}`;
    
    // Optional: Trigger Pixel/Analytics event here
    if ((window as any).fbq) {
      (window as any).fbq('track', 'InitiateCheckout', { value: totalPrice, currency: 'USD' });
    }
    if ((window as any).gtag) {
      (window as any).gtag('event', 'begin_checkout', { value: totalPrice, currency: 'USD' });
    }

    window.open(whatsappUrl, '_blank');
    clearCart();
    setIsCartOpen(false);
    setIsCheckout(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (categories.length === 0 && products.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Catálogo Público</h1>
        <p className="text-gray-600 mb-8 max-w-md">
          ¡Bienvenido! Nuestro menú digital aún se está preparando. Vuelve pronto para ver nuestros deliciosos productos.
        </p>
        <div className="text-sm text-gray-400 mt-12 border-t pt-4 w-full max-w-xs">
          ¿Eres el administrador? <a href="/admin" className="text-blue-600 hover:underline">Ir al panel de control</a>
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
    <div className="pb-24 bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-white pt-6 pb-4 px-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
            {settings?.bannerTitle ? settings.bannerTitle.charAt(0).toUpperCase() : 'B'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{settings?.bannerTitle || 'Burger House'}</h1>
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
              <span className="flex items-center gap-1"><Clock size={12} /> Lun-Dom 11:00-23:00</span>
              <span className="flex items-center gap-1"><MapPin size={12} /> Av. Principal 1234</span>
            </div>
          </div>
        </div>
      </header>

      {/* Sticky Category Navigation */}
      <div className="bg-white border-b border-gray-100 sticky top-[88px] z-20 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 overflow-x-auto hide-scrollbar flex gap-2">
          <button 
            onClick={() => { setActiveCategory('all'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`whitespace-nowrap px-5 py-2 rounded-full font-medium text-sm transition-colors ${activeCategory === 'all' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Todo
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
              className={`whitespace-nowrap px-5 py-2 rounded-full font-medium text-sm transition-colors ${activeCategory === category.id ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar en el menú..." 
            className="w-full bg-white border border-gray-200 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Banner de Promoción (Hero) */}
      {!searchQuery && settings?.promoBannerIsActive && settings?.promoBannerImageUrl && (
        <div className="max-w-4xl mx-auto px-4 mt-6">
          {settings.promoBannerLink ? (
            <a href={settings.promoBannerLink} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-2xl shadow-md hover:shadow-lg transition-shadow">
              <img src={settings.promoBannerImageUrl} alt="Promoción Especial" className="w-full h-auto object-cover max-h-64 sm:max-h-80" />
            </a>
          ) : (
            <div className="overflow-hidden rounded-2xl shadow-md">
              <img src={settings.promoBannerImageUrl} alt="Promoción Especial" className="w-full h-auto object-cover max-h-64 sm:max-h-80" />
            </div>
          )}
        </div>
      )}

      {/* Destacados (Highlights) */}
      {!searchQuery && promotedProducts.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Flame className="text-orange-500" size={20} /> Destacados
          </h2>
          <div className="flex overflow-x-auto gap-4 pb-4 hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {promotedProducts.map(product => (
              <div key={`promo-${product.id}`} className="min-w-[160px] max-w-[160px] flex-none cursor-pointer" onClick={() => addItem(product)}>
                <div className="relative h-40 rounded-2xl overflow-hidden mb-3 shadow-sm">
                   <img src={product.imageUrl || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80'} alt={product.name} className="w-full h-full object-cover" />
                   <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md">PROMO</span>
                </div>
                <h3 className="font-medium text-gray-900 text-sm leading-tight mb-1 line-clamp-2">{product.name}</h3>
                <p className="text-orange-500 font-bold">{formatCurrency(product.price)}</p>
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
              <h2 className="text-xl font-bold text-gray-900 mb-4">{category.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryProducts.map(product => (
                  <div 
                    key={product.id} 
                    onClick={() => addItem(product)}
                    className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900 text-base mb-1 leading-tight">{product.name}</h3>
                        <p className="text-gray-500 text-sm line-clamp-2 mb-2">{product.description}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-orange-500 font-bold text-lg">{formatCurrency(product.price)}</span>
                        {product.isPromotion && (
                          <>
                            <span className="text-gray-400 text-xs line-through">{formatCurrency(product.price * 1.2)}</span>
                            <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-md">-20%</span>
                          </>
                        )}
                      </div>
                    </div>
                    {product.imageUrl && (
                      <div className="w-28 h-28 flex-none relative">
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-xl" />
                        {product.isPromotion && (
                          <span className="absolute top-1 left-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">PROMO</span>
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
            <p className="text-gray-500">No se encontraron productos para "{searchQuery}"</p>
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      {totalItems > 0 && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 left-6 sm:left-auto sm:w-80 bg-green-600 text-white p-4 rounded-full shadow-xl hover:bg-green-700 transition-transform transform hover:scale-105 flex items-center justify-between z-40"
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <ShoppingCart size={24} />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-bold">{totalItems} {totalItems === 1 ? 'ítem' : 'ítems'}</span>
              <span className="text-sm opacity-90">Ver pedido</span>
            </div>
          </div>
          <span className="font-bold text-lg">{formatCurrency(totalPrice)}</span>
        </button>
      )}

      {/* Footer */}
      <footer className="mt-12 py-8 text-center text-gray-400 text-sm border-t border-gray-200">
        <p className="mb-2">© {new Date().getFullYear()} Cardápio Digital</p>
        <a href="/admin" className="hover:text-gray-600 transition-colors underline">Acesso Administrativo</a>
      </footer>

      {/* Cart Drawer/Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setIsCartOpen(false); setIsCheckout(false); }}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <ShoppingCart size={24} /> {isCheckout ? 'Finalizar Pedido' : 'Tu Pedido'}
              </h2>
              <button onClick={() => { setIsCartOpen(false); setIsCheckout(false); }} className="text-gray-500 hover:text-gray-700 p-2">
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {!isCheckout ? (
                items.length === 0 ? (
                  <div className="text-center text-gray-500 mt-10">
                    Tu carrito está vacío
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map(item => (
                      <div key={item.id} className="flex justify-between items-center border-b pb-4">
                        <div className="flex-1 pr-4">
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          <span className="text-sm text-gray-500">{formatCurrency(item.price)}</span>
                        </div>
                        <div className="flex items-center gap-3 bg-gray-100 rounded-full px-2 py-1">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-gray-600 hover:text-gray-900 p-1">
                            {item.quantity === 1 ? <Trash2 size={16} className="text-red-500" /> : <Minus size={16} />}
                          </button>
                          <span className="font-medium w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-gray-600 hover:text-gray-900 p-1">
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <form id="checkout-form" onSubmit={handleWhatsAppOrder} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tu Nombre</label>
                    <input
                      type="text" required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                      value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
                      placeholder="Ej: Juan Pérez"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Pedido</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio" name="orderType" value="delivery"
                          checked={customerInfo.orderType === 'delivery'}
                          onChange={e => setCustomerInfo({...customerInfo, orderType: e.target.value})}
                          className="text-green-600 focus:ring-green-500"
                        />
                        <span>Entrega</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio" name="orderType" value="pickup"
                          checked={customerInfo.orderType === 'pickup'}
                          onChange={e => setCustomerInfo({...customerInfo, orderType: e.target.value})}
                          className="text-green-600 focus:ring-green-500"
                        />
                        <span>Retiro en local</span>
                      </label>
                    </div>
                  </div>

                  {customerInfo.orderType === 'delivery' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Dirección de Entrega</label>
                      <input
                        type="text" required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                        value={customerInfo.address} onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})}
                        placeholder="Calle, Número, Barrio, Referencia"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Método de Pago</label>
                    <select
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                      value={customerInfo.paymentMethod} onChange={e => setCustomerInfo({...customerInfo, paymentMethod: e.target.value})}
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Tarjeta (Llevar máquina)">Tarjeta (Llevar máquina)</option>
                      <option value="Transferencia / Yape / Plin">Transferencia / Yape / Plin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notas Adicionales (Opcional)</label>
                    <textarea
                      rows={2}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                      value={customerInfo.notes} onChange={e => setCustomerInfo({...customerInfo, notes: e.target.value})}
                      placeholder="Sin cebolla, vuelto para 50, etc."
                    />
                  </div>
                </form>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600 font-medium">Total</span>
                <span className="text-2xl font-bold text-gray-900">{formatCurrency(totalPrice)}</span>
              </div>
              
              {!isCheckout ? (
                <button
                  onClick={() => setIsCheckout(true)}
                  disabled={items.length === 0}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Continuar
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsCheckout(false)}
                    className="w-1/3 bg-gray-200 text-gray-800 py-4 rounded-xl font-bold hover:bg-gray-300 flex items-center justify-center"
                  >
                    Volver
                  </button>
                  <button
                    type="submit"
                    form="checkout-form"
                    className="w-2/3 bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 flex items-center justify-center gap-2"
                  >
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
