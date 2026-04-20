import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, Timestamp, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useAdmin } from '../../contexts/AdminContext';
import { Order } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { 
  Search, 
  Clock, 
  User, 
  MapPin, 
  CreditCard, 
  CheckCircle2, 
  Timer, 
  XCircle,
  ChevronDown
} from 'lucide-react';

export function Orders() {
  const { user } = useAuth();
  const { restaurant } = useAdmin();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [openStatusMenuId, setOpenStatusMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurant?.id || !user?.uid) return;

    const q = query(
      collection(db, 'restaurants', restaurant.id, 'orders'),
      where('ownerUid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error("Error in Orders listener:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [restaurant?.id]);

  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    if (!restaurant?.id) return;
    try {
      const orderRef = doc(db, 'restaurants', restaurant.id, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'all' || order.status === filter;
    const matchesSearch = order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Pedidos</h1>
          <p className="text-zinc-500 mt-1">Gerencie os pedidos recebidos em tempo real.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar pedido ou cliente..." 
              className="pl-10 pr-4 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Todos os status</option>
            <option value="pending">Pendentes</option>
            <option value="preparing">Preparando</option>
            <option value="on_the_way">A caminho</option>
            <option value="completed">Concluídos</option>
            <option value="cancelled">Cancelados</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div key={order.id} className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${getStatusIconColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-zinc-900 text-lg">{order.customer.name}</h3>
                        <span className="text-xs text-zinc-400">#{order.id.slice(-6).toUpperCase()}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-zinc-500 mt-1">
                        <span className="flex items-center gap-1"><Clock size={14} /> {formatDate(order.createdAt)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 capitalize"><Timer size={14} /> {order.customer.orderType}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right mr-4">
                      <p className="text-sm text-zinc-500">Total</p>
                      <p className="text-xl font-bold text-zinc-900">{formatCurrency(order.totalPrice)}</p>
                      {(order.discountAmount || 0) + (order.cashbackUsed || 0) > 0 && (
                        <p className="text-[10px] text-emerald-600 font-bold">
                          Desc: -{formatCurrency((order.discountAmount || 0) + (order.cashbackUsed || 0))}
                        </p>
                      )}
                    </div>
                    <div className="relative">
                      <button 
                        onClick={() => setOpenStatusMenuId(openStatusMenuId === order.id ? null : order.id)}
                        className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors ${getStatusBadgeClass(order.status)}`}
                      >
                        {getStatusLabel(order.status)}
                        <ChevronDown size={14} />
                      </button>
                      
                      {openStatusMenuId === order.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setOpenStatusMenuId(null)}
                          />
                          <div className="absolute right-0 mt-2 w-48 bg-white border border-zinc-100 rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                            {['pending', 'preparing', 'on_the_way', 'completed', 'cancelled'].map((status) => (
                              <button
                                key={status}
                                onClick={() => {
                                  handleStatusUpdate(order.id, status as any);
                                  setOpenStatusMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 transition-colors capitalize border-b border-zinc-50 last:border-0"
                              >
                                {getStatusLabel(status as any)}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 border-t border-zinc-100">
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Itens do Pedido</h4>
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-zinc-600">
                              <span className="font-bold text-zinc-900">{item.quantity}x</span> {item.name}
                            </span>
                            <span className="font-medium text-zinc-900">
                              {formatCurrency((item.price + (item.selectedOptions?.reduce((sum, o) => sum + o.price, 0) || 0)) * item.quantity)}
                            </span>
                          </div>
                          {item.selectedOptions && item.selectedOptions.length > 0 && (
                            <div className="pl-6 space-y-0.5">
                              {item.selectedOptions.map((opt, optIdx) => (
                                <p key={optIdx} className="text-[10px] text-zinc-400">
                                  + {opt.optionName} {opt.price > 0 ? `(${formatCurrency(opt.price)})` : ''}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Entrega & Pagamento</h4>
                    <div className="space-y-2 text-sm">
                      <p className="flex items-start gap-2 text-zinc-600">
                        <MapPin size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                        {order.customer.address}
                      </p>
                      <p className="flex items-center gap-2 text-zinc-600">
                        <CreditCard size={16} className="text-zinc-400 shrink-0" />
                        {order.customer.paymentMethod}
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-zinc-50 space-y-1">
                      {order.couponCode && (
                        <div className="flex justify-between text-[10px]">
                          <span className="text-zinc-400 font-bold uppercase">Cupom: {order.couponCode}</span>
                          <span className="text-emerald-600 font-bold">-{formatCurrency(order.discountAmount || 0)}</span>
                        </div>
                      )}
                      {order.cashbackUsed && order.cashbackUsed > 0 && (
                        <div className="flex justify-between text-[10px]">
                          <span className="text-zinc-400 font-bold uppercase">Cashback Usado:</span>
                          <span className="text-emerald-600 font-bold">-{formatCurrency(order.cashbackUsed)}</span>
                        </div>
                      )}
                      {order.cashbackEarned && order.cashbackEarned > 0 && (
                        <div className="flex justify-between text-[10px]">
                          <span className="text-zinc-400 font-bold uppercase">Cashback Gerado:</span>
                          <span className="text-amber-600 font-bold">+{formatCurrency(order.cashbackEarned)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {order.customer.notes && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Observações</h4>
                      <p className="text-sm text-zinc-600 italic bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                        "{order.customer.notes}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-white border border-zinc-200 rounded-xl">
            <p className="text-zinc-500">Nenhum pedido encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(date: any) {
  if (!date) return 'Agora';
  const d = date instanceof Timestamp ? date.toDate() : new Date(date);
  return d.toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'pending': return <Clock size={20} />;
    case 'preparing': return <Timer size={20} />;
    case 'on_the_way': return <MapPin size={20} />;
    case 'completed': return <CheckCircle2 size={20} />;
    case 'cancelled': return <XCircle size={20} />;
    default: return <Clock size={20} />;
  }
}

function getStatusIconColor(status: string) {
  switch (status) {
    case 'pending': return 'bg-amber-100 text-amber-600';
    case 'preparing': return 'bg-blue-100 text-blue-600';
    case 'on_the_way': return 'bg-indigo-100 text-indigo-600';
    case 'completed': return 'bg-emerald-100 text-emerald-600';
    case 'cancelled': return 'bg-zinc-100 text-zinc-500';
    default: return 'bg-zinc-100 text-zinc-500';
  }
}

function getStatusLabel(status: Order['status']) {
  const labels: Record<string, string> = {
    pending: 'Pendente',
    preparing: 'Preparando',
    on_the_way: 'A caminho',
    completed: 'Concluído',
    cancelled: 'Cancelado'
  };
  return labels[status] || status;
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'pending': return 'bg-amber-500 text-white hover:bg-amber-600';
    case 'preparing': return 'bg-blue-500 text-white hover:bg-blue-600';
    case 'on_the_way': return 'bg-indigo-500 text-white hover:bg-indigo-600';
    case 'completed': return 'bg-emerald-500 text-white hover:bg-emerald-600';
    case 'cancelled': return 'bg-zinc-400 text-white hover:bg-zinc-500';
    default: return 'bg-zinc-500 text-white';
  }
}
