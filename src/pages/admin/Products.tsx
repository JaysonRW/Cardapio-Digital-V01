import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Product, Category } from '../../types';
import { Plus, Edit2, Trash2, Image as ImageIcon } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';
import { ImageUpload } from '../../components/ImageUpload';

export function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  
  const initialForm = {
    name: '',
    description: '',
    price: 0,
    imageUrl: '',
    categoryId: '',
    isPromotion: false,
    isActive: true,
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    const unsubCats = onSnapshot(query(collection(db, 'categories'), orderBy('order')), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'categories'));

    const unsubProds = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'products'));

    return () => {
      unsubCats();
      unsubProds();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await updateDoc(doc(db, 'products', isEditing), formData);
      } else {
        await addDoc(collection(db, 'products'), formData);
      }
      setFormData(initialForm);
      setIsEditing(null);
    } catch (error) {
      handleFirestoreError(error, isEditing ? OperationType.UPDATE : OperationType.CREATE, 'products');
    }
  };

  const handleEdit = (product: Product) => {
    setIsEditing(product.id);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      imageUrl: product.imageUrl || '',
      categoryId: product.categoryId,
      isPromotion: product.isPromotion || false,
      isActive: product.isActive,
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
      }
    }
  };

  if (loading) return <div className="text-zinc-500 animate-pulse">Carregando...</div>;

  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-bold text-zinc-900 mb-2 tracking-tight">Produtos</h1>
      <p className="text-zinc-500 mb-8">Gerencie os itens do seu cardápio, preços e disponibilidade.</p>
      
      <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-zinc-900 mb-6">{isEditing ? 'Editar Produto' : 'Novo Produto'}</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Nome</label>
            <input
              type="text" required
              className="block w-full rounded-lg border-zinc-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 py-2.5 px-3 text-zinc-900 text-sm"
              value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: X-Salada"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Categoria</label>
            <select
              required
              className="block w-full rounded-lg border-zinc-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 py-2.5 px-3 text-zinc-900 text-sm"
              value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            >
              <option value="">Selecione uma categoria...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Preço (R$)</label>
            <input
              type="number" step="0.01" required
              className="block w-full rounded-lg border-zinc-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 py-2.5 px-3 text-zinc-900 text-sm"
              value={formData.price} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              placeholder="0.00"
            />
          </div>
          <div className="md:col-span-2">
            <ImageUpload 
              value={formData.imageUrl} 
              onChange={(url) => setFormData({ ...formData, imageUrl: url })} 
              label="Imagem do Produto"
              folder="products"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Descrição</label>
            <textarea
              rows={2}
              className="block w-full rounded-lg border-zinc-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 py-2.5 px-3 text-zinc-900 text-sm"
              value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva os ingredientes..."
            />
          </div>
          <div className="flex items-center gap-6 mt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-sm font-medium text-zinc-700">Ativo no cardápio</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPromotion} onChange={(e) => setFormData({ ...formData, isPromotion: e.target.checked })}
                className="rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-sm font-medium text-zinc-700">Destacar como Promoção</span>
            </label>
          </div>
          <div className="md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-zinc-100">
            {isEditing && (
              <button
                type="button"
                onClick={() => { setIsEditing(null); setFormData(initialForm); }}
                className="bg-zinc-100 text-zinc-700 px-5 py-2.5 rounded-lg hover:bg-zinc-200 transition-colors font-medium text-sm"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              className="bg-orange-500 text-white px-5 py-2.5 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 font-medium text-sm"
            >
              {isEditing ? <Edit2 size={16} /> : <Plus size={16} />}
              {isEditing ? 'Salvar Alterações' : 'Adicionar Produto'}
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className={`bg-white border border-zinc-200 shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-all ${!product.isActive ? 'opacity-60 grayscale-[50%]' : ''}`}>
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-full h-48 object-cover border-b border-zinc-100" />
            ) : (
              <div className="w-full h-48 bg-zinc-50 flex items-center justify-center text-zinc-300 border-b border-zinc-100">
                <ImageIcon size={40} />
              </div>
            )}
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-zinc-900 leading-tight">{product.name}</h3>
                <span className="font-bold text-orange-500 ml-2 whitespace-nowrap">R$ {product.price.toFixed(2)}</span>
              </div>
              <p className="text-sm text-zinc-500 mb-4 line-clamp-2 min-h-[40px]">{product.description}</p>
              <div className="flex justify-between items-center pt-4 border-t border-zinc-100">
                <div className="flex flex-wrap gap-2">
                  {product.isPromotion && <span className="px-2 py-1 bg-red-50 text-red-600 border border-red-100 text-[10px] uppercase font-bold rounded-md tracking-wider">Promo</span>}
                  <span className="px-2 py-1 bg-zinc-100 text-zinc-600 text-[10px] uppercase font-bold rounded-md tracking-wider">{categories.find(c => c.id === product.categoryId)?.name || 'Sem categoria'}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(product)} className="text-zinc-400 hover:text-orange-500 transition-colors p-1.5 rounded-md hover:bg-orange-50">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(product.id)} className="text-zinc-400 hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-red-50">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
