import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, where, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useAdmin } from '../../contexts/AdminContext';
import { Order } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { 
  TrendingUp, 
  ShoppingCart, 
  DollarSign, 
  Package, 
  Clock, 
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Calendar
} from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();
  const { restaurant } = useAdmin();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurant?.id || !user?.uid) return;

    // Buscar todos os pedidos para estatísticas
    const q = query(
      collection(db, 'restaurants', restaurant.id, 'orders'),
      where('ownerUid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log(`Recebidos ${snapshot.docs.length} pedidos do Firestore`);
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error("Error in Dashboard orders listener:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [restaurant?.id]);

  // Cálculos de métricas
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayOrders = orders.filter(order => {
    if (!order.createdAt) return true; // Pedidos novos (ainda sem timestamp do servidor) são de hoje
    const orderDate = order.createdAt instanceof Timestamp ? order.createdAt.toDate() : new Date(order.createdAt);
    return orderDate >= today;
  });

  const totalRevenueToday = todayOrders.reduce((sum, order) => sum + order.totalPrice, 0);
  const avgTicketToday = todayOrders.length > 0 ? totalRevenueToday / todayOrders.length : 0;
  
  // Produtos mais pedidos
  const productStats = orders.reduce((acc: Record<string, { name: string, count: number, revenue: number }>, order) => {
    order.items.forEach(item => {
      if (!acc[item.id]) {
        acc[item.id] = { name: item.name, count: 0, revenue: 0 };
      }
      acc[item.id].count += item.quantity;
      const optionsPrice = item.selectedOptions?.reduce((s, o) => s + o.price, 0) || 0;
      acc[item.id].revenue += (item.price + optionsPrice) * item.quantity;
    });
    return acc;
  }, {});

  const topProducts = Object.values(productStats)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Dashboard</h1>
        <p className="text-zinc-500 mt-1">Visão geral do seu negócio hoje, {new Date().toLocaleDateString('pt-BR')}.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Pedidos Hoje" 
          value={todayOrders.length.toString()} 
          icon={<ShoppingCart className="text-blue-600" size={20} />}
          trend={{ value: '12%', isUp: true }}
          color="blue"
        />
        <StatCard 
          title="Faturamento Hoje" 
          value={formatCurrency(totalRevenueToday)} 
          icon={<DollarSign className="text-emerald-600" size={20} />}
          trend={{ value: '8%', isUp: true }}
          color="emerald"
        />
        <StatCard 
          title="Ticket Médio" 
          value={formatCurrency(avgTicketToday)} 
          icon={<TrendingUp className="text-purple-600" size={20} />}
          trend={{ value: '3%', isUp: false }}
          color="purple"
        />
        <StatCard 
          title="Total de Pedidos" 
          value={orders.length.toString()} 
          icon={<Package className="text-orange-600" size={20} />}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-zinc-900">Pedidos Recentes</h2>
            <button className="text-sm font-medium text-[var(--primary)] hover:underline flex items-center gap-1">
              Ver todos <ChevronRight size={14} />
            </button>
          </div>
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
            {todayOrders.length > 0 ? (
              <div className="divide-y divide-zinc-100">
                {todayOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 font-bold">
                        {order.customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900">{order.customer.name}</p>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <Clock size={12} />
                          {order.createdAt instanceof Timestamp 
                            ? order.createdAt.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                            : 'Agora'}
                          <span>•</span>
                          <span>{order.items.length} {order.items.length === 1 ? 'item' : 'itens'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-zinc-900">{formatCurrency(order.totalPrice)}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-300">
                  <Calendar size={32} />
                </div>
                <p className="text-zinc-500 font-medium">Nenhum pedido hoje ainda.</p>
                <p className="text-sm text-zinc-400">As vendas aparecerão aqui assim que começarem.</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-zinc-900">Mais Vendidos</h2>
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-6">
            {topProducts.length > 0 ? (
              topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-400">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900 line-clamp-1">{product.name}</p>
                      <p className="text-xs text-zinc-500">{product.count} vendas</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-zinc-900">{formatCurrency(product.revenue)}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-zinc-500 py-8">Sem dados de vendas.</p>
            )}
          </div>

          {/* Quick Actions / Tips */}
          <div className="bg-[var(--primary-soft)] border border-[var(--primary-soft-border)] rounded-xl p-6">
            <h3 className="font-bold text-[var(--primary)] mb-2 flex items-center gap-2">
              <TrendingUp size={18} /> Dica do dia
            </h3>
            <p className="text-sm text-[var(--text)] opacity-80 leading-relaxed">
              Produtos com fotos de alta qualidade vendem até 40% mais. Verifique se seus produtos mais pedidos têm boas imagens!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, color }: { title: string, value: string, icon: React.ReactNode, trend?: { value: string, isUp: boolean }, color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-100',
    emerald: 'bg-emerald-50 border-emerald-100',
    purple: 'bg-purple-50 border-purple-100',
    orange: 'bg-orange-50 border-orange-100',
  };

  return (
    <div className="bg-white border border-zinc-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-bold ${trend.isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {trend.value}
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-zinc-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-zinc-900 tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'pending': return 'bg-amber-100 text-amber-700';
    case 'preparing': return 'bg-blue-100 text-blue-700';
    case 'on_the_way': return 'bg-indigo-100 text-indigo-700';
    case 'completed': return 'bg-emerald-100 text-emerald-700';
    case 'cancelled': return 'bg-zinc-100 text-zinc-700';
    default: return 'bg-zinc-100 text-zinc-700';
  }
}
