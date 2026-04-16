import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Category } from '../../types';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', order: 0 });

  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cats: Category[] = [];
      snapshot.forEach((doc) => {
        cats.push({ id: doc.id, ...doc.data() } as Category);
      });
      setCategories(cats);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'categories'));
    return unsubscribe;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await updateDoc(doc(db, 'categories', isEditing), formData);
      } else {
        await addDoc(collection(db, 'categories'), formData);
      }
      setFormData({ name: '', order: 0 });
      setIsEditing(null);
    } catch (error) {
      handleFirestoreError(error, isEditing ? OperationType.UPDATE : OperationType.CREATE, 'categories');
    }
  };

  const handleEdit = (category: Category) => {
    setIsEditing(category.id);
    setFormData({ name: category.name, order: category.order });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      try {
        await deleteDoc(doc(db, 'categories', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `categories/${id}`);
      }
    }
  };

  if (loading) return <div className="text-zinc-500 animate-pulse">Carregando...</div>;

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-bold text-zinc-900 mb-2 tracking-tight">Categorias</h1>
      <p className="text-zinc-500 mb-8">Organize os grupos do seu cardápio (ex: Lanches, Bebidas).</p>
      
      <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">{isEditing ? 'Editar Categoria' : 'Nova Categoria'}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 sm:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Nome</label>
            <input
              type="text"
              required
              className="block w-full rounded-lg border-zinc-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 py-2.5 px-3 text-zinc-900 text-sm"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Hambúrgueres"
            />
          </div>
          <div className="w-full sm:w-28">
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Ordem</label>
            <input
              type="number"
              required
              className="block w-full rounded-lg border-zinc-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 py-2.5 px-3 text-zinc-900 text-sm"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-orange-500 text-white px-5 py-2.5 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 font-medium text-sm whitespace-nowrap h-[42px]"
            >
              {isEditing ? <Edit2 size={16} /> : <Plus size={16} />}
              {isEditing ? 'Salvar' : 'Adicionar'}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(null);
                  setFormData({ name: '', order: 0 });
                }}
                className="bg-zinc-100 text-zinc-700 px-5 py-2.5 rounded-lg hover:bg-zinc-200 transition-colors font-medium text-sm h-[42px]"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white border border-zinc-200 shadow-sm rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Ordem</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Nome da Categoria</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-zinc-100">
            {categories.map((category) => (
              <tr key={category.id} className="hover:bg-zinc-50/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 font-medium">{category.order}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">{category.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <button onClick={() => handleEdit(category)} className="text-zinc-400 hover:text-orange-500 transition-colors mr-4 p-1">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(category.id)} className="text-zinc-400 hover:text-red-500 transition-colors p-1">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-sm text-zinc-500">
                  Nenhuma categoria cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
