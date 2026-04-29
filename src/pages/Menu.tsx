import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot, query, orderBy, doc, addDoc, setDoc, increment, serverTimestamp, getDoc, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Product, Category, Settings, OrderItem, SelectedOption } from '../types';
import { useCart } from '../contexts/CartContext';
import { useTenant } from '../contexts/TenantContext';
import { formatCurrency } from '../lib/utils';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Trash2, Search, Clock, MapPin, Flame, Utensils, Sandwich, Beef, CupSoda, IceCreamCone, UtensilsCrossed, Star, ArrowLeft, MessageCircle, Store, Bike, ShoppingBag, Gift, CheckCircle2, History } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { LoyaltyModal } from '../components/LoyaltyModal';

export function Menu() {
  const { restaurant, settings, tenantId, loading: tenantLoading } = useTenant();
  const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckout, setIsCheckout] = useState(false);
  const [isUpsellStep, setIsUpsellStep] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showClosedModal, setShowClosedModal] = useState(false);
  const [isLoyaltyModalOpen, setIsLoyaltyModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    whatsapp: '',
    orderType: 'delivery',
    address: '',
    paymentMethod: 'Dinheiro',
    notes: ''
  });
  
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showCartRecoveryModal, setShowCartRecoveryModal] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [availableCashback, setAvailableCashback] = useState(0);
  const [useCashback, setUseCashback] = useState(false);
  const [customerData, setCustomerData] = useState<any>(null);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  
  const { items, addItem, removeItem, updateQuantity, totalItems, totalPrice, clearCart } = useCart();

  const handleProductClick = (product: Product) => {
    if (product.optionGroups && product.optionGroups.length > 0) {
      setSelectedProduct(product);
      setSelectedOptions([]);
    } else {
      addItem(product);
    }
  };

  const toggleOption = (group: any, option: any) => {
    setSelectedOptions(prev => {
      const isSelected = prev.find(o => o.optionId === option.id);
      const groupOptions = prev.filter(o => o.groupId === group.id);

      if (isSelected) {
        return prev.filter(o => o.optionId !== option.id);
      }

      if (group.maxOptions === 1) {
        return [...prev.filter(o => o.groupId !== group.id), {
          groupId: group.id,
          groupName: group.name,
          optionId: option.id,
          optionName: option.name,
          price: option.price
        }];
      }

      if (group.maxOptions > 0 && groupOptions.length >= group.maxOptions) {
        return prev;
      }

      return [...prev, {
        groupId: group.id,
        groupName: group.name,
        optionId: option.id,
        optionName: option.name,
        price: option.price
      }];
    });
  };

  const handleAddProductWithOptions = () => {
    if (!selectedProduct) return;
    
    const invalidGroup = selectedProduct.optionGroups?.find(group => {
      const selectedInGroup = selectedOptions.filter(o => o.groupId === group.id).length;
      return selectedInGroup < group.minOptions;
    });

    if (invalidGroup) {
      alert(`Por favor, selecione pelo menos ${invalidGroup.minOptions} opção(ões) em "${invalidGroup.name}"`);
      return;
    }

    addItem(selectedProduct, selectedOptions);
    setSelectedProduct(null);
    setSelectedOptions([]);
  };

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

  // Cart Recovery logic
  useEffect(() => {
    if (tenantLoading || loading) return;

    // Verificar se tem itens no carrinho E não abriu o carrinho nos últimos 15 min
    const lastInteraction = localStorage.getItem(`cart_interaction_${restaurantSlug}`);
    const now = Date.now();
    
    if (items.length > 0 && (!lastInteraction || now - parseInt(lastInteraction) > 15 * 60 * 1000)) {
      // Pequeno delay para não ser tão intrusivo logo ao carregar
      const timer = setTimeout(() => {
        setShowCartRecoveryModal(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [items.length, restaurantSlug, tenantLoading, loading]);

  // Atualizar a última interação sempre que o carrinho for manipulado ou aberto
  useEffect(() => {
    if (isCartOpen || items.length > 0) {
      localStorage.setItem(`cart_interaction_${restaurantSlug}`, Date.now().toString());
    }
  }, [isCartOpen, items, restaurantSlug]);

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

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError('');
    
    try {
      const q = query(
        collection(db, 'restaurants', tenantId, 'coupons'), 
        where('code', '==', couponCode.toUpperCase().trim()),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setCouponError('Cupom inválido ou expirado.');
        setCoupon(null);
        return;
      }

      const couponData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as any;
      
      if (couponData.minOrderValue && totalPrice < couponData.minOrderValue) {
        setCouponError(`Este cupom requer um pedido mínimo de ${formatCurrency(couponData.minOrderValue)}`);
        setCoupon(null);
        return;
      }

      if (couponData.expiresAt && new Date(couponData.expiresAt) < new Date()) {
        setCouponError('Este cupom expirou.');
        setCoupon(null);
        return;
      }

      setCoupon(couponData);
      setCouponError('');
    } catch (error) {
      console.error('Erro ao validar cupom:', error);
      setCouponError('Erro ao validar cupom.');
    }
  };

  useEffect(() => {
    const fetchCashback = async () => {
      const cleanPhone = customerInfo.whatsapp.replace(/\D/g, '');
      if (cleanPhone.length >= 10 && tenantId) {
        const docRef = doc(db, 'restaurants', tenantId, 'customers', cleanPhone);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setAvailableCashback(data.cashbackBalance || 0);
          setCustomerData(data);
        } else {
          setAvailableCashback(0);
          setCustomerData(null);
        }
      } else {
        setAvailableCashback(0);
        setUseCashback(false);
      }
    };

    const timer = setTimeout(() => {
      fetchCashback();
    }, 1000);

    return () => clearTimeout(timer);
  }, [customerInfo.whatsapp, tenantId]);

  useEffect(() => {
    const activeBanners = settings?.menuBanners?.filter(b => b.isActive) || [];
    if (activeBanners.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % activeBanners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [settings?.menuBanners]);

  const calculateDiscount = () => {
    let discount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.type === 'percentage') {
        discount = totalPrice * (appliedCoupon.value / 100);
      } else {
        discount = appliedCoupon.value;
      }
    }
    return discount;
  };

  const discountAmount = calculateDiscount();
  const cashbackToUse = useCashback ? Math.min(availableCashback, totalPrice - discountAmount) : 0;
  const finalPrice = Math.max(0, totalPrice - discountAmount - cashbackToUse);

  const handleWhatsAppOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Verificar se a loja está aberta
    if (settings?.isOpen === false) {
      setShowClosedModal(true);
      return;
    }
    
    if (!settings?.whatsappNumber) {
      alert('O número de WhatsApp não está configurado.');
      return;
    }

    if (!tenantId) {
      console.error("tenantId is missing!");
      return;
    }

    // 1. Gravar pedido no Firestore
    let savedOrderId = '';
    try {
      console.log(`Tentando salvar pedido em restaurants/${tenantId}/orders`);
      
      // Calculate cashback to be earned
      let cashbackEarned = 0;
      const lp = settings?.loyaltyProgram;
      if (lp?.cashbackEnabled) {
        const type = lp.cashbackType || 'percentage';
        const value = lp.cashbackValue ?? lp.cashbackPercentage ?? 0;
        
        if (type === 'fixed') {
          cashbackEarned = value;
        } else {
          cashbackEarned = finalPrice * (value / 100);
        }
      }

      const orderData = {
        restaurantId: tenantId,
        ownerUid: restaurant.ownerUid,
        customer: {
          name: customerInfo.name,
          whatsapp: customerInfo.whatsapp,
          address: customerInfo.orderType === 'delivery' ? customerInfo.address : 'Retirada no local',
          orderType: customerInfo.orderType,
          paymentMethod: customerInfo.paymentMethod,
          notes: customerInfo.notes
        },
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl,
          selectedOptions: item.selectedOptions || []
        })),
        totalPrice: finalPrice,
        subtotalPrice: totalPrice,
        discountAmount: discountAmount,
        cashbackUsed: cashbackToUse,
        cashbackEarned: cashbackEarned,
        couponCode: appliedCoupon?.code || null,
        totalItems: totalItems,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      console.log("Dados do pedido:", orderData);
      
      const docRef = await addDoc(collection(db, 'restaurants', tenantId, 'orders'), orderData);
      savedOrderId = docRef.id;
      console.log("Pedido salvo com ID:", docRef.id);

      // Atualiza ou cria o cliente para o programa de fidelidade
      if (customerInfo.whatsapp) {
        const cleanPhone = customerInfo.whatsapp.replace(/\D/g, '');
        if (cleanPhone) {
          localStorage.setItem(`last_phone_${restaurantSlug}`, cleanPhone);
          try {
            const customerRef = doc(db, 'restaurants', tenantId, 'customers', cleanPhone);
            await setDoc(customerRef, {
              name: customerInfo.name,
              whatsapp: cleanPhone,
              lastOrderAt: serverTimestamp(),
              totalOrders: increment(1),
              totalSpent: increment(finalPrice),
              cashbackBalance: increment(cashbackEarned - cashbackToUse)
            }, { merge: true });
          } catch (err) {
            console.error("Erro ao salvar cliente (fidelidade):", err);
          }
        }
      }
    } catch (error) {
      console.error("Erro ao salvar pedido:", error);
      alert("Aviso: O pedido será enviado ao WhatsApp, mas houve um erro ao salvá-lo no painel administrativo. Por favor, informe ao suporte.");
    }

    let message = `*NOVO PEDIDO* 🍔\n\n`;
    message += `*Cliente:* ${customerInfo.name}\n`;
    if (customerInfo.whatsapp) {
      message += `*WhatsApp:* ${customerInfo.whatsapp}\n`;
    }
    message += `*Tipo:* ${customerInfo.orderType === 'delivery' ? 'Entrega' : 'Retirada no local'}\n`;
    if (customerInfo.orderType === 'delivery') {
      message += `*Endereço:* ${customerInfo.address}\n`;
    }
    message += `*Pagamento:* ${customerInfo.paymentMethod}\n\n`;
    
    message += `*RESUMO DO PEDIDO:*\n`;
    items.forEach(item => {
      const optionsPrice = item.selectedOptions?.reduce((sum, o) => sum + o.price, 0) || 0;
      message += `▪️ ${item.quantity}x ${item.name} - ${formatCurrency((item.price + optionsPrice) * item.quantity)}\n`;
      if (item.selectedOptions && item.selectedOptions.length > 0) {
        item.selectedOptions.forEach(opt => {
          message += `   + ${opt.optionName}${opt.price > 0 ? ` (${formatCurrency(opt.price)})` : ''}\n`;
        });
      }
    });
    
    message += `\n*RESUMO FINANCEIRO:*\n`;
    message += `Subtotal: ${formatCurrency(totalPrice)}\n`;
    if (discountAmount > 0) message += `Cupom (${appliedCoupon.code}): -${formatCurrency(discountAmount)}\n`;
    if (cashbackToUse > 0) message += `Cashback Utilizado: -${formatCurrency(cashbackToUse)}\n`;
    message += `*TOTAL: ${formatCurrency(finalPrice)}*\n`;

    let cashbackEarned = 0;
    const lpMessage = settings?.loyaltyProgram;
    if (lpMessage?.cashbackEnabled) {
      const type = lpMessage.cashbackType || 'percentage';
      const value = lpMessage.cashbackValue ?? lpMessage.cashbackPercentage ?? 0;
      
      if (type === 'fixed') {
        cashbackEarned = value;
      } else {
        cashbackEarned = finalPrice * (value / 100);
      }
    }
    if (cashbackEarned > 0) message += `\n_Você ganhou ${formatCurrency(cashbackEarned)} de cashback nesta compra!_`;

    if (customerInfo.notes) {
      message += `\n*Observações:* ${customerInfo.notes}\n`;
    }

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
    setIsUpsellStep(false);
    
    // Redirecionar para acompanhamento se tiver ID, senão mostrar sucesso padrão
    if (savedOrderId) {
      navigate(`/${restaurantSlug}/order/${savedOrderId}`);
    } else {
      setTimeout(() => {
        setShowSuccessModal(true);
      }, 500);
    }
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
  
  const upsellProducts = products.filter(p => p.isUpsell && !items.some(item => item.id === p.id));
  
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
          <Link 
            to={`/${restaurantSlug}/my-orders`}
            className="whitespace-nowrap px-5 py-2 rounded-full font-bold text-sm transition-colors flex items-center gap-2 bg-zinc-900 text-white hover:bg-black border border-zinc-900"
          >
            <History size={16} />
            Meus Pedidos
          </Link>
          {(settings?.loyaltyProgram?.isActive ?? true) && (
            <button 
              onClick={() => setIsLoyaltyModalOpen(true)}
              className="whitespace-nowrap px-5 py-2 rounded-full font-bold text-sm transition-colors flex items-center gap-2 bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200"
            >
              <Gift size={16} />
              Fidelidade
            </button>
          )}
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

      {/* Banner do Cardápio (Carousel) */}
      {!searchQuery && settings?.menuBanners && settings.menuBanners.filter(b => b.isActive).length > 0 && (
        <div className="max-w-4xl mx-auto px-4 mt-6">
          <div className="relative overflow-hidden rounded-3xl shadow-lg aspect-[3/1] bg-zinc-100">
            <AnimatePresence mode="wait">
              {settings.menuBanners
                .filter(b => b.isActive)
                .sort((a, b) => a.order - b.order)
                .map((banner, index) => index === currentBannerIndex && (
                  <motion.div
                    key={banner.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="absolute inset-0"
                  >
                    {banner.link ? (
                      <a href={banner.link} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                        <img src={banner.imageUrl} alt={banner.title || 'Banner'} className="w-full h-full object-cover" />
                        {(banner.title || banner.subtitle) && (
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-6">
                            {banner.title && <h3 className="text-white text-xl md:text-2xl font-bold leading-tight">{banner.title}</h3>}
                            {banner.subtitle && <p className="text-white/80 text-sm md:text-base mt-1">{banner.subtitle}</p>}
                          </div>
                        )}
                      </a>
                    ) : (
                      <div className="w-full h-full">
                        <img src={banner.imageUrl} alt={banner.title || 'Banner'} className="w-full h-full object-cover" />
                        {(banner.title || banner.subtitle) && (
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-6">
                            {banner.title && <h3 className="text-white text-xl md:text-2xl font-bold leading-tight">{banner.title}</h3>}
                            {banner.subtitle && <p className="text-white/80 text-sm md:text-base mt-1">{banner.subtitle}</p>}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
            </AnimatePresence>

            {/* Pagination Dots */}
            {settings.menuBanners.filter(b => b.isActive).length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {settings.menuBanners.filter(b => b.isActive).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentBannerIndex(idx)}
                    className={`h-1.5 rounded-full transition-all ${idx === currentBannerIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Banner de Promoção Secundário (Catálogo) */}
      {!searchQuery && settings?.promoBannerIsActive && settings?.promoBannerImageUrl && (
        <div className="max-w-4xl mx-auto px-4 mt-4">
          {settings.promoBannerLink ? (
            <a
              href={settings.promoBannerLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-2xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="aspect-[4/1] w-full">
                <img src={settings.promoBannerImageUrl} alt="Promoção Especial" className="w-full h-full object-cover" />
              </div>
            </a>
          ) : (
            <div className="overflow-hidden rounded-2xl shadow-sm">
              <div className="aspect-[4/1] w-full">
                <img src={settings.promoBannerImageUrl} alt="Promoção Especial" className="w-full h-full object-cover" />
              </div>
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
              <div key={`promo-${product.id}`} className="min-w-[160px] max-w-[160px] flex-none cursor-pointer group" onClick={() => handleProductClick(product)}>
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
                    onClick={() => handleProductClick(product)}
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

      {/* Modal de Recuperação de Carrinho */}
      {showCartRecoveryModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowCartRecoveryModal(false)}></div>
          <div className="relative bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 bg-[var(--primary)] text-white rounded-full flex items-center justify-center shadow-lg border-4 border-white">
              <ShoppingCart size={24} />
            </div>
            
            <h3 className="text-xl font-serif font-bold text-zinc-900 mt-6 mb-2">Esqueceu algo?</h3>
            
            <p className="text-zinc-500 mb-6 text-sm leading-relaxed">
              Você tem {items.length} {items.length === 1 ? 'item' : 'itens'} no carrinho aguardando para serem finalizados. Que tal concluir seu pedido agora?
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowCartRecoveryModal(false);
                  setIsCartOpen(true);
                  localStorage.setItem(`cart_interaction_${restaurantSlug}`, Date.now().toString());
                }}
                className="w-full bg-[var(--primary)] text-[var(--primary-foreground)] py-3.5 rounded-xl font-bold hover:bg-[var(--primary-strong)] transition-colors shadow-md shadow-[var(--primary)]/20"
              >
                Ver meu carrinho
              </button>
              <button
                onClick={() => {
                  setShowCartRecoveryModal(false);
                  localStorage.setItem(`cart_interaction_${restaurantSlug}`, Date.now().toString());
                }}
                className="w-full bg-zinc-100 text-zinc-500 py-3.5 rounded-xl font-bold hover:bg-zinc-200 hover:text-zinc-700 transition-colors"
              >
                Ainda estou escolhendo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer/Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-zinc-950/30 backdrop-blur-sm transition-opacity" onClick={() => { setIsCartOpen(false); setIsCheckout(false); setIsUpsellStep(false); }}></div>
          <div className="relative w-full max-w-md bg-white text-[var(--text)] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-white">
              <h2 className="text-xl font-serif font-bold text-[var(--text)] flex items-center gap-3 tracking-tight">
                <div className="w-10 h-10 rounded-full bg-[var(--primary-soft)] flex items-center justify-center text-[var(--primary)]">
                  {isUpsellStep ? <Flame size={20} /> : <ShoppingCart size={20} />}
                </div>
                {isCheckout ? 'Finalizar Pedido' : isUpsellStep ? 'Aproveite e leve' : 'Seu Pedido'}
              </h2>
              <button onClick={() => { setIsCartOpen(false); setIsCheckout(false); setIsUpsellStep(false); }} className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 flex items-center justify-center transition-colors">
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-[var(--surface-strong)]">
              {!isCheckout && !isUpsellStep ? (
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
                      <div key={item.cartId} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-[var(--border)] shadow-sm relative group">
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
                          <h4 className="font-bold text-[var(--text)] text-sm leading-tight mb-1 pr-6">{item.name}</h4>
                          {item.selectedOptions && item.selectedOptions.length > 0 && (
                            <div className="mb-2">
                              {item.selectedOptions.map((opt, idx) => (
                                <p key={idx} className="text-[10px] text-zinc-400 font-medium leading-tight">
                                  + {opt.optionName}
                                </p>
                              ))}
                            </div>
                          )}
                          <span className="text-[var(--primary)] font-bold text-sm">
                            {formatCurrency(item.price + (item.selectedOptions?.reduce((sum, o) => sum + o.price, 0) || 0))}
                          </span>
                        </div>
                        
                        {/* Controles de quantidade */}
                        <div className="flex flex-col items-center gap-2 bg-zinc-50 border border-[var(--border)] rounded-full px-1.5 py-2 flex-none absolute right-4 top-1/2 -translate-y-1/2">
                          <button onClick={() => updateQuantity(item.cartId, item.quantity + 1)} className="w-6 h-6 rounded-full bg-white border border-[var(--border)] text-zinc-500 hover:text-[var(--primary)] hover:border-[var(--primary-soft-border)] flex items-center justify-center transition-colors shadow-sm">
                            <Plus size={14} strokeWidth={3} />
                          </button>
                          <span className="font-bold w-4 text-center text-xs text-[var(--text)]">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.cartId, item.quantity - 1)} className="w-6 h-6 rounded-full bg-white border border-[var(--border)] text-zinc-500 hover:text-red-500 hover:border-red-300 flex items-center justify-center transition-colors shadow-sm">
                            {item.quantity === 1 ? <Trash2 size={12} strokeWidth={3} /> : <Minus size={14} strokeWidth={3} />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : isUpsellStep ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="text-center py-4 mb-4">
                    <div className="w-16 h-16 bg-[var(--primary-soft)] rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--primary-soft-border)]">
                      <Flame className="text-[var(--primary)]" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-[var(--text)] mb-2">Quase lá!</h3>
                    <p className="text-zinc-500 text-sm">Que tal adicionar um destes itens especiais para acompanhar seu pedido?</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {upsellProducts.map(upsell => (
                      <div 
                        key={`upsell-${upsell.id}`} 
                        className="bg-white border border-[var(--border)] rounded-2xl p-3 flex items-center gap-4 cursor-pointer hover:border-[var(--primary)] transition-all group shadow-sm hover:shadow-md" 
                        onClick={() => handleProductClick(upsell)}
                      >
                        <div className="w-20 h-20 bg-zinc-50 rounded-xl overflow-hidden relative border border-[var(--border)] flex-none">
                          {upsell.imageUrl ? (
                            <img src={upsell.imageUrl} alt={upsell.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-300">
                              <ShoppingCart size={20} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-[var(--text)] text-sm line-clamp-2 leading-tight mb-1 group-hover:text-[var(--primary)] transition-colors">{upsell.name}</h5>
                          <span className="text-[var(--primary)] font-bold">{formatCurrency(upsell.price)}</span>
                        </div>
                        <div className="w-8 h-8 bg-[var(--primary-soft)] text-[var(--primary)] rounded-full flex items-center justify-center shadow-sm flex-none group-hover:bg-[var(--primary)] group-hover:text-[var(--primary-foreground)] transition-colors">
                          <Plus size={16} strokeWidth={3} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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
                    <label className="block text-sm font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Seu WhatsApp</label>
                    <input
                      type="tel" required
                      className="block w-full rounded-xl border-[var(--border)] shadow-sm focus:border-[var(--primary)] focus:ring-[var(--primary)] py-3 px-4 text-[var(--text)] bg-white placeholder-zinc-400"
                      value={customerInfo.whatsapp} 
                      onChange={e => {
                        // Apenas números e formatação básica
                        let val = e.target.value.replace(/\D/g, '');
                        if (val.length > 11) val = val.slice(0, 11);
                        if (val.length > 2) val = `(${val.slice(0,2)}) ${val.slice(2)}`;
                        if (val.length > 10) val = `${val.slice(0,10)}-${val.slice(10)}`;
                        setCustomerInfo({...customerInfo, whatsapp: val});
                      }}
                      placeholder="(DD) 90000-0000"
                      maxLength={15}
                    />
                    <p className="text-xs text-zinc-400 mt-1">Usado para o seu Programa de Fidelidade.</p>
                  </div>

                  {/* Cupom e Cashback */}
                  <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-100 space-y-4">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Descontos e Promoções</h4>
                    
                    {/* Cupom */}
                    <div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="flex-1 rounded-xl border-zinc-200 shadow-sm focus:border-[var(--primary)] focus:ring-[var(--primary)] py-2.5 px-4 text-sm bg-white placeholder-zinc-400 uppercase font-bold"
                          value={couponCode} onChange={e => setCouponCode(e.target.value)}
                          placeholder="CÓDIGO DO CUPOM"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          className="bg-zinc-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-black transition-colors"
                        >
                          Aplicar
                        </button>
                      </div>
                      {couponError && <p className="text-red-500 text-xs mt-1.5 font-medium">{couponError}</p>}
                      {appliedCoupon && (
                        <div className="mt-2 flex items-center justify-between bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg border border-emerald-100">
                          <div className="flex items-center gap-2">
                            <Tag size={14} className="fill-emerald-100" />
                            <span className="text-xs font-bold">CUPOM APLICADO: {appliedCoupon.code}</span>
                          </div>
                          <button onClick={() => setCoupon(null)} className="text-emerald-700 hover:text-emerald-900">
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Cashback */}
                    {availableCashback > 0 && (
                      <div className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer ${useCashback ? 'border-amber-500 bg-amber-50' : 'border-zinc-200 bg-white hover:border-amber-200'}`} onClick={() => setUseCashback(!useCashback)}>
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${useCashback ? 'border-amber-500 bg-amber-500' : 'border-zinc-300'}`}>
                            {useCashback && <div className="w-2 h-2 bg-white rounded-full"></div>}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-zinc-900">Usar Cashback</p>
                            <p className="text-[10px] text-zinc-500">Saldo disponível: <span className="font-bold text-amber-600">{formatCurrency(availableCashback)}</span></p>
                          </div>
                        </div>
                        <Gift size={20} className={useCashback ? 'text-amber-500' : 'text-zinc-300'} />
                      </div>
                    )}
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
              <div className="space-y-2 mb-6">
                <div className="flex justify-between items-center text-zinc-500 text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(totalPrice)}</span>
                </div>
                {(discountAmount > 0 || cashbackToUse > 0) && (
                  <div className="flex justify-between items-center text-emerald-600 text-sm font-bold">
                    <span>Descontos</span>
                    <span>-{formatCurrency(discountAmount + cashbackToUse)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-zinc-100">
                  <span className="text-zinc-500 font-bold uppercase tracking-wider text-sm">Total a pagar</span>
                  <span className="text-3xl font-bold text-[var(--text)] tracking-tight">{formatCurrency(finalPrice)}</span>
                </div>
              </div>
              
              {!isCheckout && !isUpsellStep ? (
                <button
                  onClick={() => {
                    if (settings?.isOpen === false) {
                      setShowClosedModal(true);
                    } else if (upsellProducts.length > 0) {
                      setIsUpsellStep(true);
                    } else {
                      setIsCheckout(true);
                    }
                  }}
                  disabled={items.length === 0}
                  className="w-full bg-[var(--primary)] text-[var(--primary-foreground)] py-4 rounded-xl font-bold text-lg hover:bg-[var(--primary-strong)] transition-colors disabled:opacity-50 disabled:hover:bg-[var(--primary)] disabled:cursor-not-allowed flex items-center justify-center shadow-sm"
                >
                  Continuar
                </button>
              ) : isUpsellStep ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsUpsellStep(false)}
                    className="w-1/3 bg-zinc-100 text-zinc-700 py-4 rounded-xl font-bold hover:bg-zinc-200 transition-colors flex items-center justify-center"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={() => {
                      setIsUpsellStep(false);
                      setIsCheckout(true);
                    }}
                    className="w-2/3 bg-[var(--primary)] text-[var(--primary-foreground)] py-4 rounded-xl font-bold text-lg hover:bg-[var(--primary-strong)] transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    Ir para Pagamento
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      if (upsellProducts.length > 0) {
                        setIsUpsellStep(true);
                      } else {
                        setIsUpsellStep(false);
                      }
                      setIsCheckout(false);
                    }}
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

      <LoyaltyModal 
        isOpen={isLoyaltyModalOpen}
        onClose={() => setIsLoyaltyModalOpen(false)}
        settings={settings?.loyaltyProgram}
        restaurantPhone={settings?.whatsappNumber}
        customerOrders={customerData?.totalOrders || 0}
        onParticipate={() => {
          setIsLoyaltyModalOpen(false);
          // TODO: Implement participate logic (e.g. login/auth)
          alert("Em breve! Sistema de autenticação para o programa de fidelidade em desenvolvimento.");
        }}
      />

      {/* Modal de Opções do Produto */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedProduct(null)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] flex flex-col">
            <div className="relative h-48 sm:h-64 flex-none">
              <img 
                src={selectedProduct.imageUrl || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80'} 
                alt={selectedProduct.name} 
                className="w-full h-full object-cover"
              />
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-md hover:bg-black/70 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-6">
                <h3 className="text-2xl font-serif font-bold text-zinc-900 mb-1">{selectedProduct.name}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{selectedProduct.description}</p>
                <p className="text-[var(--primary)] font-bold text-xl mt-3">{formatCurrency(selectedProduct.price)}</p>
              </div>

              <div className="space-y-8">
                {selectedProduct.optionGroups?.map(group => (
                  <div key={group.id} className="space-y-4">
                    <div className="flex items-center justify-between bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                      <div>
                        <h4 className="font-bold text-zinc-900">{group.name}</h4>
                        <p className="text-xs text-zinc-500">
                          {group.minOptions > 0 ? `Mínimo ${group.minOptions}` : 'Opcional'} 
                          {group.maxOptions > 0 ? ` • Máximo ${group.maxOptions}` : ''}
                        </p>
                      </div>
                      {selectedOptions.filter(o => o.groupId === group.id).length >= group.minOptions && (
                        <span className="bg-emerald-100 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">OK</span>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {group.options.map(option => {
                        const isSelected = selectedOptions.some(o => o.optionId === option.id);
                        return (
                          <label 
                            key={option.id} 
                            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${isSelected ? 'border-[var(--primary)] bg-[var(--primary-soft)]' : 'border-zinc-100 bg-white hover:border-zinc-200'}`}
                            onClick={(e) => {
                              e.preventDefault();
                              toggleOption(group, option);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-[var(--primary)] bg-[var(--primary)]' : 'border-zinc-300'}`}>
                                {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                              </div>
                              <span className={`font-medium ${isSelected ? 'text-zinc-900' : 'text-zinc-600'}`}>{option.name}</span>
                            </div>
                            {option.price > 0 && (
                              <span className={`text-sm font-bold ${isSelected ? 'text-[var(--primary)]' : 'text-zinc-400'}`}>
                                + {formatCurrency(option.price)}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-zinc-100 bg-zinc-50">
              <button
                onClick={handleAddProductWithOptions}
                className="w-full bg-[var(--primary)] text-[var(--primary-foreground)] py-4 rounded-2xl font-bold text-lg hover:bg-[var(--primary-strong)] transition-all shadow-lg shadow-[var(--primary)]/20 flex items-center justify-between px-8"
              >
                <span>Adicionar ao pedido</span>
                <span>{formatCurrency(selectedProduct.price + selectedOptions.reduce((sum, o) => sum + o.price, 0))}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loja Fechada Modal */}
      {showClosedModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowClosedModal(false)}></div>
          <div className="relative bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock size={40} />
            </div>
            <h3 className="text-2xl font-serif font-bold text-zinc-900 mb-3">Loja fechada no momento</h3>
            <p className="text-zinc-500 mb-8 leading-relaxed">
              No momento não estamos aceitando pedidos online. Mas não se preocupe! Você ainda pode navegar pelo nosso cardápio e escolher seus favoritos para quando abrirmos.
            </p>
            <div className="space-y-3">
              <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 mb-6">
                <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-1">Nosso Horário</p>
                <p className="text-zinc-900 font-medium">{settings?.restaurantHours || 'Ter–Dom · 18h às 00h'}</p>
              </div>
              <button
                onClick={() => setShowClosedModal(false)}
                className="w-full bg-[var(--primary)] text-[var(--primary-foreground)] py-4 rounded-xl font-bold text-lg hover:bg-[var(--primary-strong)] transition-colors shadow-lg shadow-[var(--primary)]/20"
              >
                Entendido, vou dar uma olhada!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sucesso Pedido Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowSuccessModal(false)}></div>
          <div className="relative bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 relative">
              <CheckCircle2 size={40} />
              {customerInfo.whatsapp && (
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-amber-100 text-amber-600 rounded-full border-4 border-white flex items-center justify-center shadow-sm">
                  <Star size={20} fill="currentColor" />
                </div>
              )}
            </div>
            
            <h3 className="text-2xl font-serif font-bold text-zinc-900 mb-3">Pedido Enviado!</h3>
            
            <p className="text-zinc-600 mb-6 leading-relaxed">
              Obrigado, {customerInfo.name.split(' ')[0]}! Você foi redirecionado para o nosso WhatsApp.
            </p>

            {customerInfo.whatsapp && (
              <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 mb-8 text-left">
                <div className="flex items-center gap-3 mb-2">
                  <Gift className="text-amber-600" size={24} />
                  <h4 className="font-bold text-amber-800">Programa de Fidelidade</h4>
                </div>
                <p className="text-amber-700/80 text-sm leading-relaxed mb-3">
                  {customerData?.totalOrders 
                    ? `Parabéns! Com este pedido você completou ${customerData.totalOrders + 1} pedidos em nossa loja.`
                    : "Este foi o seu primeiro pedido! Comece a acumular para ganhar prêmios incríveis."}
                </p>
                <div className="flex items-center justify-between bg-white/50 p-3 rounded-xl border border-amber-200">
                  <span className="text-xs font-bold text-amber-800 uppercase">Seu Status</span>
                  <span className="text-sm font-black text-amber-600">{(customerData?.totalOrders || 0) + 1} PEDIDOS</span>
                </div>
                <button 
                  onClick={() => {
                    setShowSuccessModal(false);
                    setIsLoyaltyModalOpen(true);
                  }}
                  className="mt-4 w-full py-2 text-sm font-bold text-amber-600 hover:text-amber-700 border-2 border-amber-200 rounded-xl hover:bg-amber-100 transition-all"
                >
                  Ver próximos prêmios
                </button>
              </div>
            )}
            
            <button
              onClick={() => {
                setShowSuccessModal(false);
                // Opcional: Se já redirecionou, esse modal pode nem aparecer, mas fica como fallback
                navigate(`/${restaurantSlug}/my-orders`);
              }}
              className="w-full bg-[var(--primary)] text-[var(--primary-foreground)] py-4 rounded-xl font-bold text-lg hover:bg-[var(--primary-strong)] transition-colors shadow-lg shadow-[var(--primary)]/20 mb-3"
            >
              Acompanhar Pedido
            </button>
            
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-zinc-100 text-zinc-500 py-4 rounded-xl font-bold text-lg hover:bg-zinc-200 transition-colors"
            >
              Voltar ao Cardápio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
