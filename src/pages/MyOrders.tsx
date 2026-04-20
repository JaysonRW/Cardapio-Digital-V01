import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useTenant } from '../contexts/TenantContext';
import { formatCurrency } from '../lib/utils';
import { 
  ChevronLeft, 
  ShoppingBag, 
  Clock, 
  ArrowRight,
  Search,
  History,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function MyOrders() {
  const { restaurantSlug } = useParams();
  const { tenantId, loading: tenantLoading } = useTenant();
  const [phone, setPhone] = useState(localStorage.getItem(`last_phone_${restaurantSlug}`) || '');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (phone && tenantId) {
      handleSearch();
    }
  }, [tenantId]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!tenantId || !phone) return;

    setLoading(true);
    setHasSearched(true);
    
    const cleanPhone = phone.replace(/\D/g, '');
    localStorage.setItem(`last_phone_${restaurantSlug}`, phone);

    // Buscamos o pedido tanto pelo formato limpo quanto pelo formatado para garantir compatibilidade
    const ordersMap = new Map();

    const tryFetch = async (phoneToTry: string) => {
      console.log('Buscando pedidos para:', phoneToTry);
      const q = query(
        collection(db, 'restaurants', tenantId, 'orders'),
        where('customer.whatsapp', '==', phoneToTry),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      console.log(`Encontrados ${snapshot.docs.length} pedidos para ${phoneToTry}`);
      snapshot.docs.forEach(doc => {
        ordersMap.set(doc.id, { id: doc.id, ...doc.data() });
      });
    };

    try {
      // Tenta buscar com o formato exato que está no input (com máscara)
      await tryFetch(phone);
      
      // Tenta buscar com o formato limpo (apenas números)
      if (phone !== cleanPhone) {
        await tryFetch(cleanPhone);
      }
      
      const ordersData = Array.from(ordersMap.values()).sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate?.() || 0;
        const dateB = b.createdAt?.toDate?.() || 0;
        return dateB - dateA;
      });
      
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return { label: 'Pendente', color: 'bg-zinc-100 text-zinc-600' };
      case 'preparing': return { label: 'Preparando', color: 'bg-amber-100 text-amber-600' };
      case 'on_the_way': return { label: 'A caminho', color: 'bg-blue-100 text-blue-600' };
      case 'completed': return { label: 'Entregue', color: 'bg-emerald-100 text-emerald-600' };
      case 'cancelled': return { label: 'Cancelado', color: 'bg-red-100 text-red-600' };
      default: return { label: 'Desconhecido', color: 'bg-zinc-100 text-zinc-600' };
    }
  };

  if (tenantLoading) return null;

  return (
    <div className="min-h-screen bg-[var(--surface-strong)] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-[var(--border)] sticky top-0 z-10 p-4 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to={`/${restaurantSlug}/menu`} className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-500">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="font-serif font-bold text-lg">Meus Pedidos</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Search Section */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-[var(--border)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[var(--primary-soft)] text-[var(--primary)] rounded-2xl flex items-center justify-center">
              <History size={20} />
            </div>
            <div>
              <h2 className="font-bold text-zinc-900">Histórico de Pedidos</h2>
              <p className="text-xs text-zinc-500">Informe seu WhatsApp para ver seus pedidos</p>
            </div>
          </div>
          
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, '');
                  if (val.length > 11) val = val.slice(0, 11);
                  if (val.length > 2) val = `(${val.slice(0,2)}) ${val.slice(2)}`;
                  if (val.length > 10) val = `${val.slice(0,10)}-${val.slice(10)}`;
                  setPhone(val);
                }}
                placeholder="(00) 00000-0000"
                className="w-full bg-zinc-50 border-zinc-100 rounded-2xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
              />
            </div>
            <button 
              type="submit"
              disabled={loading || !phone}
              className="bg-zinc-900 text-white px-6 rounded-2xl font-bold text-sm hover:bg-black transition-all disabled:opacity-50"
            >
              {loading ? '...' : 'Buscar'}
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-white rounded-3xl border border-[var(--border)] animate-pulse" />
              ))}
            </div>
          ) : orders.length > 0 ? (
            orders.map((order) => {
              const status = getStatusLabel(order.status);
              return (
                <Link 
                  key={order.id}
                  to={`/${restaurantSlug}/order/${order.id}`}
                  className="block bg-white border border-[var(--border)] rounded-3xl p-5 hover:border-[var(--primary)] transition-all hover:shadow-md group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${status.color}`}>
                        {status.label}
                      </span>
                      <p className="text-xs text-zinc-400 mt-2 font-medium">
                        {order.createdAt?.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-zinc-900">{formatCurrency(order.totalPrice)}</p>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">ID: {order.id.slice(-6).toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-zinc-50">
                    <p className="text-xs text-zinc-500">
                      {order.items.length} {order.items.length === 1 ? 'item' : 'itens'} no pedido
                    </p>
                    <div className="flex items-center gap-1 text-[var(--primary)] font-bold text-xs group-hover:gap-2 transition-all">
                      Ver detalhes <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              );
            })
          ) : hasSearched ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[var(--border)]">
              <div className="w-16 h-16 bg-zinc-50 text-zinc-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag size={32} />
              </div>
              <h3 className="font-bold text-zinc-900 mb-1">Nenhum pedido encontrado</h3>
              <p className="text-sm text-zinc-500">Ainda não temos registros para este número de WhatsApp.</p>
            </div>
          ) : (
            <div className="text-center py-12">
              <History size={48} className="mx-auto text-zinc-200 mb-4" />
              <p className="text-zinc-400 text-sm">Digite seu número para ver seu histórico</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
