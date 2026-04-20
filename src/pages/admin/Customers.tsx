import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAdmin } from '../../contexts/AdminContext';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';
import { Users, Search, Gift, Phone, Calendar } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface Customer {
  id: string; // The whatsapp number
  name: string;
  whatsapp: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt: any;
}

export function Customers() {
  const { restaurant } = useAdmin();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!restaurant?.id) return;

    const q = query(
      collection(db, 'restaurants', restaurant.id, 'customers'),
      orderBy('lastOrderAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const customersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[];
      setCustomers(customersData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching customers:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [restaurant?.id]);

  const filteredCustomers = customers.filter(customer => 
    (customer.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (customer.whatsapp || '').includes(searchQuery)
  );

  const formatWhatsApp = (phone: string) => {
    if (!phone) return '-';
    if (phone.length === 11) {
      return `(${phone.substring(0, 2)}) ${phone.substring(2, 7)}-${phone.substring(7, 11)}`;
    }
    return phone;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Nunca';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <Users className="text-[var(--primary)]" />
            Clientes & Fidelidade
          </h2>
          <p className="text-zinc-500 text-sm mt-1">
            Gerencie seus clientes e acompanhe o progresso do programa de fidelidade.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nome ou número..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600">
            <thead className="bg-zinc-50 text-zinc-900 font-semibold border-b border-zinc-200">
              <tr>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4 text-center">Pedidos (Fidelidade)</th>
                <th className="px-6 py-4 text-right">Total Gasto</th>
                <th className="px-6 py-4">Último Pedido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center">
                      <Users size={32} className="text-zinc-300 mb-3" />
                      <p className="text-base font-medium text-zinc-900 mb-1">Nenhum cliente encontrado</p>
                      <p className="text-sm">Os clientes aparecerão aqui assim que fizerem um pedido usando o WhatsApp.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-zinc-900">{customer.name}</span>
                        <div className="flex items-center gap-1 text-xs text-zinc-500 mt-0.5">
                          <Phone size={12} />
                          {formatWhatsApp(customer.whatsapp)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1 rounded-full font-bold">
                          <Gift size={14} />
                          {customer.totalOrders} {customer.totalOrders === 1 ? 'pedido' : 'pedidos'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-zinc-900">
                      {formatCurrency(customer.totalSpent || 0)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-zinc-500">
                        <Calendar size={14} />
                        {formatDate(customer.lastOrderAt)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}