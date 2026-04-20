import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useTenant } from '../contexts/TenantContext';
import { formatCurrency } from '../lib/utils';
import { 
  Clock, 
  MapPin, 
  ChevronLeft, 
  CheckCircle2, 
  Circle, 
  Package, 
  Bike, 
  Home, 
  MessageCircle,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function OrderTracking() {
  const { restaurantSlug, orderId } = useParams();
  const { tenantId, settings, loading: tenantLoading } = useTenant();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState('');

  useEffect(() => {
    if (!tenantId || !orderId) return;

    const unsub = onSnapshot(doc(db, 'restaurants', tenantId, 'orders', orderId), (docSnap) => {
      if (docSnap.exists()) {
        setOrder({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    }, (error) => {
      console.error('Error listening to order:', error);
      setLoading(false);
    });

    return unsub;
  }, [tenantId, orderId]);

  // Timer logic
  useEffect(() => {
    if (!order?.createdAt) return;

    const calculateTime = () => {
      const start = order.createdAt.toDate();
      const end = order.status === 'completed' && order.updatedAt 
        ? order.updatedAt.toDate() 
        : new Date();
      
      const diffInMs = Math.abs(end.getTime() - start.getTime());
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const hours = Math.floor(diffInMinutes / 60);
      const minutes = diffInMinutes % 60;

      if (hours > 0) {
        setElapsedTime(`${hours}h ${minutes}min`);
      } else {
        setElapsedTime(`${minutes} min`);
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 30000); // Update every 30s
    return () => clearInterval(timer);
  }, [order?.createdAt, order?.status, order?.updatedAt]);

  if (tenantLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--surface-strong)]">
        <div className="w-12 h-12 border-4 border-[var(--primary-soft)] border-t-[var(--primary)] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[var(--surface-strong)] p-6 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
          <AlertCircle size={40} />
        </div>
        <h1 className="text-2xl font-serif font-bold text-zinc-900 mb-2">Pedido não encontrado</h1>
        <p className="text-zinc-500 mb-8 max-w-xs">Não conseguimos localizar as informações deste pedido. Verifique o link ou tente novamente.</p>
        <Link 
          to={`/${restaurantSlug}/menu`}
          className="bg-[var(--primary)] text-[var(--primary-foreground)] px-8 py-3 rounded-xl font-bold shadow-lg shadow-[var(--primary)]/20 transition-transform active:scale-95"
        >
          Voltar para o Cardápio
        </Link>
      </div>
    );
  }

  const steps = [
    { id: 'pending', label: 'Pendente', icon: Clock, description: 'Aguardando confirmação' },
    { id: 'preparing', label: 'Preparando', icon: Package, description: 'Seu pedido está sendo feito' },
    { id: 'on_the_way', label: 'A caminho', icon: Bike, description: 'Saiu para entrega' },
    { id: 'completed', label: 'Entregue', icon: CheckCircle2, description: 'Bom apetite!' }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === order.status);
  
  return (
    <div className="min-h-screen bg-[var(--surface-strong)] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-[var(--border)] sticky top-0 z-10 p-4 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to={`/${restaurantSlug}/menu`} className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-500">
            <ChevronLeft size={24} />
          </Link>
          <div className="text-center">
            <h1 className="font-serif font-bold text-lg">Acompanhar Pedido</h1>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">ID: {order.id.slice(-6).toUpperCase()}</p>
          </div>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Status Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-[var(--border)] overflow-hidden relative">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-serif font-bold text-zinc-900">
                {steps[currentStepIndex]?.label || 'Pedido em análise'}
              </h2>
              <p className="text-zinc-500 text-sm mt-1">{steps[currentStepIndex]?.description}</p>
            </div>
            <div className="bg-[var(--primary-soft)] text-[var(--primary)] px-4 py-2 rounded-2xl font-bold text-sm flex items-center gap-2">
              <Clock size={16} />
              {elapsedTime}
            </div>
          </div>

          {/* Stepper Vertical */}
          <div className="space-y-8 relative">
            {/* Line Background */}
            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-zinc-100"></div>
            
            {/* Animated Progress Line */}
            <motion.div 
              className="absolute left-[19px] top-2 w-0.5 bg-[var(--primary)] origin-top"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: currentStepIndex / (steps.length - 1) }}
              transition={{ duration: 1, ease: "easeOut" }}
            />

            {steps.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const Icon = step.icon;

              return (
                <div key={step.id} className="flex gap-4 relative">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-500 ${
                    isCompleted ? 'bg-[var(--primary)] text-white' : 'bg-white border-2 border-zinc-100 text-zinc-300'
                  }`}>
                    <Icon size={20} />
                  </div>
                  <div className={`flex-1 pt-1.5 transition-opacity duration-500 ${isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                    <h3 className={`font-bold text-sm ${isCurrent ? 'text-[var(--primary)]' : 'text-zinc-900'}`}>{step.label}</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">{step.description}</p>
                  </div>
                  {isCurrent && (
                    <motion.div 
                      className="absolute left-[19px] top-[19px] w-10 h-10 -translate-x-1/2 -translate-y-1/2 bg-[var(--primary-soft)] rounded-full -z-0"
                      initial={{ scale: 0.8, opacity: 0.5 }}
                      animate={{ scale: [0.8, 1.5, 0.8], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-[var(--border)]">
          <h3 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
            <Package size={18} className="text-zinc-400" /> Detalhes do Pedido
          </h3>
          <div className="space-y-4">
            {order.items.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between text-sm">
                <div className="flex gap-3">
                  <span className="font-bold text-[var(--primary)]">{item.quantity}x</span>
                  <div>
                    <p className="font-bold text-zinc-900">{item.name}</p>
                    {item.selectedOptions?.map((opt: any, optIdx: number) => (
                      <p key={optIdx} className="text-xs text-zinc-400">+ {opt.optionName}</p>
                    ))}
                  </div>
                </div>
                <span className="font-bold text-zinc-700">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
            
            <div className="pt-4 border-t border-zinc-100 space-y-2">
              <div className="flex justify-between text-sm text-zinc-500">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotalPrice || order.totalPrice)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600 font-bold">
                  <span>Descontos</span>
                  <span>-{formatCurrency(order.discountAmount)}</span>
                </div>
              )}
              {order.cashbackUsed > 0 && (
                <div className="flex justify-between text-sm text-amber-600 font-bold">
                  <span>Cashback Usado</span>
                  <span>-{formatCurrency(order.cashbackUsed)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-zinc-900 pt-2">
                <span>Total</span>
                <span>{formatCurrency(order.totalPrice)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-[var(--border)] space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400 shrink-0">
              <MapPin size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Endereço de {order.customer.orderType === 'delivery' ? 'Entrega' : 'Retirada'}</p>
              <p className="text-sm text-zinc-700 font-medium leading-relaxed">{order.customer.address}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400 shrink-0">
              <Home size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Restaurante</p>
              <p className="text-sm text-zinc-700 font-medium leading-relaxed">{settings?.restaurantName}</p>
              <p className="text-xs text-zinc-400 mt-1">{settings?.address}</p>
            </div>
          </div>
        </div>

        {/* WhatsApp Button */}
        <a 
          href={`https://wa.me/${settings?.whatsapp?.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá, gostaria de falar sobre o meu pedido #${order.id.slice(-6).toUpperCase()}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full bg-[#25D366] text-white py-4 rounded-2xl font-bold shadow-lg shadow-green-500/20 hover:scale-[1.02] transition-all active:scale-95"
        >
          <MessageCircle size={20} />
          Falar com o Restaurante
        </a>
      </div>
    </div>
  );
}
