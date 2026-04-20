import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Coupon } from '../../types';
import { useAdmin } from '../../contexts/AdminContext';
import { Plus, Edit2, Trash2, Tag, X, Calendar } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';

export function Coupons() {
  const { restaurant } = useAdmin();
  const tenantId = restaurant?.id || '';
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  const initialForm: Omit<Coupon, 'id'> = {
    code: '',
    type: 'percentage',
    value: 0,
    minOrderValue: 0,
    isActive: true,
    expiresAt: '',
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    if (!tenantId) return;

    const unsub = onSnapshot(query(collection(db, 'restaurants', tenantId, 'coupons'), orderBy('code')), (snapshot) => {
      setCoupons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coupon)));
      setLoading(false);
    }, (error) => {
      console.error('Error in Coupons listener:', error);
      setLoading(false);
      handleFirestoreError(error, OperationType.LIST, `restaurants/${tenantId}/coupons`);
    });

    return unsub;
  }, [tenantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;

    try {
      const data = {
        ...formData,
        code: formData.code.toUpperCase().trim(),
      };

      if (isEditing) {
        await updateDoc(doc(db, 'restaurants', tenantId, 'coupons', isEditing), data);
        setIsEditing(null);
      } else {
        await addDoc(collection(db, 'restaurants', tenantId, 'coupons'), data);
        setIsAdding(false);
      }
      setFormData(initialForm);
    } catch (error) {
      handleFirestoreError(error, isEditing ? OperationType.UPDATE : OperationType.CREATE, `restaurants/${tenantId}/coupons`);
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setIsAdding(false);
    setIsEditing(coupon.id);
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minOrderValue: coupon.minOrderValue || 0,
      isActive: coupon.isActive,
      expiresAt: coupon.expiresAt || '',
    });
  };

  const handleDelete = async (id: string) => {
    if (!tenantId) return;
    if (window.confirm('Tem certeza que deseja excluir este cupom?')) {
      try {
        await deleteDoc(doc(db, 'restaurants', tenantId, 'coupons', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `restaurants/${tenantId}/coupons/${id}`);
      }
    }
  };

  if (loading) return <div className="text-zinc-500 animate-pulse">Carregando...</div>;

  return (
    <div className="max-w-4xl pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 mb-2 tracking-tight">Cupons de Desconto</h1>
          <p className="text-zinc-500">Crie códigos promocionais para incentivar suas vendas.</p>
        </div>
        {!isAdding && !isEditing && (
          <button
            onClick={() => setIsAdding(true)}
            className="bg-[var(--primary)] text-[var(--primary-foreground)] px-6 py-3 rounded-xl hover:bg-[var(--primary-strong)] transition-all flex items-center justify-center gap-2 font-bold shadow-sm"
          >
            <Plus size={20} />
            Novo Cupom
          </button>
        )}
      </div>

      {(isAdding || isEditing) && (
        <div className="mb-12 bg-white border border-zinc-200 shadow-lg rounded-xl p-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-zinc-900">{isEditing ? 'Editar Cupom' : 'Novo Cupom'}</h2>
            <button onClick={() => { setIsAdding(false); setIsEditing(null); setFormData(initialForm); }} className="text-zinc-400 hover:text-zinc-600">
              <X size={24} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">Código do Cupom</label>
                <input
                  type="text" required
                  className="block w-full rounded-lg border-zinc-200 shadow-sm focus:border-[var(--primary)] focus:ring-[var(--primary)] py-3 px-4 text-zinc-900 font-bold text-lg"
                  value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="EX: PRIMEIRACOMPRA"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">Tipo de Desconto</label>
                <select
                  className="block w-full rounded-lg border-zinc-200 shadow-sm focus:border-[var(--primary)] focus:ring-[var(--primary)] py-3 px-4 text-zinc-900"
                  value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                >
                  <option value="percentage">Porcentagem (%)</option>
                  <option value="fixed">Valor Fixo (R$)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">Valor do Desconto</label>
                <input
                  type="number" step="0.01" required
                  className="block w-full rounded-lg border-zinc-200 shadow-sm focus:border-[var(--primary)] focus:ring-[var(--primary)] py-3 px-4 text-zinc-900"
                  value={formData.value} onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">Pedido Mínimo (R$)</label>
                <input
                  type="number" step="0.01"
                  className="block w-full rounded-lg border-zinc-200 shadow-sm focus:border-[var(--primary)] focus:ring-[var(--primary)] py-3 px-4 text-zinc-900"
                  value={formData.minOrderValue} onChange={(e) => setFormData({ ...formData, minOrderValue: Number(e.target.value) })}
                  placeholder="0.00 (opcional)"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">Data de Expiração</label>
                <input
                  type="date"
                  className="block w-full rounded-lg border-zinc-200 shadow-sm focus:border-[var(--primary)] focus:ring-[var(--primary)] py-3 px-4 text-zinc-900"
                  value={formData.expiresAt} onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2 h-full pt-8">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-zinc-300 text-[var(--primary)] focus:ring-[var(--primary)] w-5 h-5"
                  />
                  <span className="font-bold text-zinc-700">Cupom Ativo</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100">
              <button
                type="submit"
                className="bg-[var(--primary)] text-[var(--primary-foreground)] px-8 py-4 rounded-xl font-bold hover:bg-[var(--primary-strong)] transition-colors shadow-lg shadow-[var(--primary)]/20"
              >
                {isEditing ? 'Salvar Alterações' : 'Criar Cupom'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {coupons.map((coupon) => (
          <div key={coupon.id} className={`bg-white border border-zinc-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-all ${!coupon.isActive ? 'opacity-60 grayscale-[50%]' : ''}`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
                <Tag size={24} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-zinc-900 tracking-tight">{coupon.code}</h3>
                  {!coupon.isActive && <span className="bg-zinc-100 text-zinc-500 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Inativo</span>}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-zinc-500">
                  <p className="font-medium text-[var(--primary)]">
                    Desconto: {coupon.type === 'percentage' ? `${coupon.value}%` : `R$ ${coupon.value.toFixed(2)}`}
                  </p>
                  {coupon.minOrderValue > 0 && <p>Mínimo: R$ {coupon.minOrderValue.toFixed(2)}</p>}
                  {coupon.expiresAt && (
                    <p className="flex items-center gap-1">
                      <Calendar size={14} /> Expira em: {new Date(coupon.expiresAt).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(coupon)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 text-zinc-600 font-bold text-sm hover:bg-zinc-50 transition-colors">
                <Edit2 size={16} /> Editar
              </button>
              <button onClick={() => handleDelete(coupon.id)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-100 text-red-500 font-bold text-sm hover:bg-red-50 transition-colors">
                <Trash2 size={16} /> Excluir
              </button>
            </div>
          </div>
        ))}
        {coupons.length === 0 && (
          <div className="text-center py-20 bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200">
            <Tag size={48} className="mx-auto text-zinc-300 mb-4" />
            <p className="text-zinc-500 font-medium">Nenhum cupom criado ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
}
