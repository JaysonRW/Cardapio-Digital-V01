import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Product, Category } from '../../types';
import { useAdmin } from '../../contexts/AdminContext';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Edit2, Trash2, Image as ImageIcon, X, ChevronDown, ChevronUp } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';
import { ImageUpload } from '../../components/ImageUpload';

interface ProductFormProps {
  formData: any;
  setFormData: (data: any) => void;
  categories: Category[];
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isEditing: boolean;
  tenantId: string;
  userId: string;
}

function ProductForm({ formData, setFormData, categories, onSubmit, onCancel, isEditing, tenantId, userId }: ProductFormProps) {
  const addOptionGroup = () => {
    const newGroup = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      minOptions: 0,
      maxOptions: 1,
      options: []
    };
    setFormData({
      ...formData,
      optionGroups: [...(formData.optionGroups || []), newGroup]
    });
  };

  const removeOptionGroup = (groupId: string) => {
    setFormData({
      ...formData,
      optionGroups: formData.optionGroups.filter((g: any) => g.id !== groupId)
    });
  };

  const updateOptionGroup = (groupId: string, data: any) => {
    setFormData({
      ...formData,
      optionGroups: formData.optionGroups.map((g: any) => g.id === groupId ? { ...g, ...data } : g)
    });
  };

  const addOption = (groupId: string) => {
    const newOption = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      price: 0
    };
    setFormData({
      ...formData,
      optionGroups: formData.optionGroups.map((g: any) => 
        g.id === groupId ? { ...g, options: [...g.options, newOption] } : g
      )
    });
  };

  const removeOption = (groupId: string, optionId: string) => {
    setFormData({
      ...formData,
      optionGroups: formData.optionGroups.map((g: any) => 
        g.id === groupId ? { ...g, options: g.options.filter((o: any) => o.id !== optionId) } : g
      )
    });
  };

  const updateOption = (groupId: string, optionId: string, data: any) => {
    setFormData({
      ...formData,
      optionGroups: formData.optionGroups.map((g: any) => 
        g.id === groupId ? { 
          ...g, 
          options: g.options.map((o: any) => o.id === optionId ? { ...o, ...data } : o) 
        } : g
      )
    });
  };

  return (
    <div className={`bg-white border border-zinc-200 shadow-lg rounded-xl p-6 ${isEditing ? 'border-orange-200 ring-1 ring-orange-100' : ''}`}>
      <h2 className="text-lg font-semibold text-zinc-900 mb-6">{isEditing ? 'Editar Produto' : 'Novo Produto'}</h2>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Preço Base (R$)</label>
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
              folder={`restaurants/${userId}/${tenantId}/products`}
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
          <div className="flex flex-wrap items-center gap-6 mt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-zinc-300 text-[var(--primary)] focus:ring-[var(--primary)]"
              />
              <span className="text-sm font-medium text-zinc-700">Ativo no cardápio</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPromotion} onChange={(e) => setFormData({ ...formData, isPromotion: e.target.checked })}
                className="rounded border-zinc-300 text-[var(--primary)] focus:ring-[var(--primary)]"
              />
              <span className="text-sm font-medium text-zinc-700">Destacar como Promoção</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer" title="Sugere este produto no carrinho antes do cliente finalizar o pedido (Aumenta o ticket médio)">
              <input
                type="checkbox"
                checked={formData.isUpsell} onChange={(e) => setFormData({ ...formData, isUpsell: e.target.checked })}
                className="rounded border-zinc-300 text-[var(--primary)] focus:ring-[var(--primary)]"
              />
              <span className="text-sm font-medium text-zinc-700 flex items-center gap-1">
                Sugestão no Carrinho (Up-sell)
              </span>
            </label>
          </div>
        </div>

        {/* Grupos de Opções */}
        <div className="border-t border-zinc-100 pt-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-zinc-900">Personalização</h3>
              <p className="text-sm text-zinc-500">Adicione grupos como "Adicionais", "Tamanhos" ou "Molhos".</p>
            </div>
            <button 
              type="button"
              onClick={addOptionGroup}
              className="bg-zinc-100 text-zinc-900 px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors flex items-center gap-2 font-bold text-sm"
            >
              <Plus size={18} /> Adicionar Grupo
            </button>
          </div>

          <div className="space-y-6">
            {formData.optionGroups?.map((group: any, groupIdx: number) => (
              <div key={group.id} className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 relative">
                <button 
                  type="button"
                  onClick={() => removeOptionGroup(group.id)}
                  className="absolute top-4 right-4 text-zinc-400 hover:text-red-500 transition-colors"
                >
                  <X size={20} />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="md:col-span-1">
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Nome do Grupo</label>
                    <input
                      type="text" required
                      className="block w-full rounded-lg border-zinc-200 py-2 px-3 text-zinc-900 text-sm focus:ring-orange-500 focus:border-orange-500"
                      value={group.name} onChange={(e) => updateOptionGroup(group.id, { name: e.target.value })}
                      placeholder="Ex: Escolha o tamanho"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Mínimo</label>
                    <input
                      type="number" min="0" required
                      className="block w-full rounded-lg border-zinc-200 py-2 px-3 text-zinc-900 text-sm focus:ring-orange-500 focus:border-orange-500"
                      value={group.minOptions} onChange={(e) => updateOptionGroup(group.id, { minOptions: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Máximo</label>
                    <input
                      type="number" min="1" required
                      className="block w-full rounded-lg border-zinc-200 py-2 px-3 text-zinc-900 text-sm focus:ring-orange-500 focus:border-orange-500"
                      value={group.maxOptions} onChange={(e) => updateOptionGroup(group.id, { maxOptions: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-zinc-700">Opções</h4>
                    <button 
                      type="button"
                      onClick={() => addOption(group.id)}
                      className="text-orange-500 text-xs font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus size={14} /> Adicionar Opção
                    </button>
                  </div>
                  
                  {group.options.map((option: any) => (
                    <div key={option.id} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-zinc-200">
                      <input
                        type="text" required
                        className="flex-1 rounded-md border-transparent py-1.5 px-2 text-sm focus:ring-orange-500 focus:border-orange-500"
                        value={option.name} onChange={(e) => updateOption(group.id, option.id, { name: e.target.value })}
                        placeholder="Nome da opção (ex: Grande)"
                      />
                      <div className="flex items-center gap-2 w-32">
                        <span className="text-xs text-zinc-400 font-bold">R$</span>
                        <input
                          type="number" step="0.01" required
                          className="w-full rounded-md border-transparent py-1.5 px-2 text-sm focus:ring-orange-500 focus:border-orange-500"
                          value={option.price} onChange={(e) => updateOption(group.id, option.id, { price: Number(e.target.value) })}
                          placeholder="0.00"
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={() => removeOption(group.id, option.id)}
                        className="text-zinc-300 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {group.options.length === 0 && (
                    <p className="text-xs text-zinc-400 italic text-center py-4 bg-white/50 rounded-lg border border-dashed border-zinc-200">Nenhuma opção adicionada ainda.</p>
                  )}
                </div>
              </div>
            ))}
            {(!formData.optionGroups || formData.optionGroups.length === 0) && (
              <div className="text-center py-10 bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200">
                <p className="text-zinc-400 text-sm">Este produto não possui personalizações.</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100">
          <button
            type="button"
            onClick={onCancel}
            className="bg-zinc-100 text-zinc-700 px-6 py-3 rounded-xl hover:bg-zinc-200 transition-colors font-bold text-sm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="bg-orange-500 text-white px-8 py-3 rounded-xl hover:bg-orange-600 transition-colors flex items-center gap-2 font-bold text-sm shadow-lg shadow-orange-500/20"
          >
            {isEditing ? <Edit2 size={18} /> : <Plus size={18} />}
            {isEditing ? 'Salvar Alterações' : 'Adicionar Produto'}
          </button>
        </div>
      </form>
    </div>
  );
}

export function Products() {
  const { restaurant } = useAdmin();
  const { user } = useAuth();
  const tenantId = restaurant?.id || '';
  const userId = user?.uid || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  const initialForm = {
    name: '',
    description: '',
    price: 0,
    imageUrl: '',
    categoryId: '',
    isPromotion: false,
    isActive: true,
    isUpsell: false,
    optionGroups: [],
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    if (!tenantId) return;

    const unsubCats = onSnapshot(query(collection(db, 'restaurants', tenantId, 'categories'), orderBy('order')), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `restaurants/${tenantId}/categories`));

    const unsubProds = onSnapshot(collection(db, 'restaurants', tenantId, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `restaurants/${tenantId}/products`));

    return () => {
      unsubCats();
      unsubProds();
    };
  }, [tenantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;

    try {
      if (isEditing) {
        await updateDoc(doc(db, 'restaurants', tenantId, 'products', isEditing), formData);
        setIsEditing(null);
      } else {
        await addDoc(collection(db, 'restaurants', tenantId, 'products'), formData);
        setIsAdding(false);
      }
      setFormData(initialForm);
    } catch (error) {
      handleFirestoreError(error, isEditing ? OperationType.UPDATE : OperationType.CREATE, `restaurants/${tenantId}/products`);
    }
  };

  const handleEdit = (product: Product) => {
    setIsAdding(false);
    setIsEditing(product.id);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      imageUrl: product.imageUrl || '',
      categoryId: product.categoryId,
      isPromotion: product.isPromotion || false,
      isActive: product.isActive,
      isUpsell: product.isUpsell || false,
      optionGroups: product.optionGroups || [],
    });
  };

  const handleCancel = () => {
    setIsEditing(null);
    setIsAdding(false);
    setFormData(initialForm);
  };

  const handleDelete = async (id: string) => {
    if (!tenantId) return;
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await deleteDoc(doc(db, 'restaurants', tenantId, 'products', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `restaurants/${tenantId}/products/${id}`);
      }
    }
  };

  if (loading) return <div className="text-zinc-500 animate-pulse">Carregando...</div>;

  return (
    <div className="max-w-6xl pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 mb-2 tracking-tight">Produtos</h1>
          <p className="text-zinc-500">Gerencie os itens do seu cardápio, preços e disponibilidade.</p>
        </div>
        {!isAdding && !isEditing && (
          <button
            onClick={() => setIsAdding(true)}
            className="bg-orange-500 text-white px-6 py-3 rounded-xl hover:bg-orange-600 transition-all flex items-center justify-center gap-2 font-bold shadow-sm hover:shadow-md"
          >
            <Plus size={20} />
            Novo Produto
          </button>
        )}
      </div>
      
      {isAdding && (
        <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-300">
          <ProductForm 
            formData={formData} 
            setFormData={setFormData} 
            categories={categories} 
            onSubmit={handleSubmit} 
            onCancel={handleCancel}
            isEditing={false}
            tenantId={tenantId}
            userId={userId}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          isEditing === product.id ? (
            <div key={product.id} className="md:col-span-2 lg:col-span-3 animate-in fade-in zoom-in-95 duration-300">
              <ProductForm 
                formData={formData} 
                setFormData={setFormData} 
                categories={categories} 
                onSubmit={handleSubmit} 
                onCancel={handleCancel}
                isEditing={true}
                tenantId={tenantId}
                userId={userId}
              />
            </div>
          ) : (
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
                    {product.isUpsell && <span className="px-2 py-1 bg-amber-50 text-amber-600 border border-amber-100 text-[10px] uppercase font-bold rounded-md tracking-wider">Up-sell</span>}
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
          )
        ))}
      </div>
    </div>
  );
}
