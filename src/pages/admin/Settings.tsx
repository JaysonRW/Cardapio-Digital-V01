import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, writeBatch, collection } from 'firebase/firestore';
import { db } from '../../firebase';
import { Settings as SettingsType } from '../../types';
import { Save, Database } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';

export function Settings() {
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const initialForm = {
    whatsappNumber: '',
    bannerTitle: '',
    bannerSubtitle: '',
    bannerImageUrl: '',
    bannerIsActive: false,
    metaPixelId: '',
    googleTagId: '',
    seoTitle: '',
    seoDescription: '',
    promoBannerImageUrl: '',
    promoBannerIsActive: false,
    promoBannerLink: '',
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as SettingsType;
        setSettings({ id: docSnap.id, ...data });
        setFormData({
          whatsappNumber: data.whatsappNumber || '',
          bannerTitle: data.bannerTitle || '',
          bannerSubtitle: data.bannerSubtitle || '',
          bannerImageUrl: data.bannerImageUrl || '',
          bannerIsActive: data.bannerIsActive || false,
          metaPixelId: data.metaPixelId || '',
          googleTagId: data.googleTagId || '',
          seoTitle: data.seoTitle || '',
          seoDescription: data.seoDescription || '',
          promoBannerImageUrl: data.promoBannerImageUrl || '',
          promoBannerIsActive: data.promoBannerIsActive || false,
          promoBannerLink: data.promoBannerLink || '',
        });
      } else {
        setSettings(null);
      }
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/general'));
    return unsubscribe;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'general'), formData, { merge: true });
      alert('Configuración guardada correctamente.');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/general');
    } finally {
      setSaving(false);
    }
  };

  const handleSeedDatabase = async () => {
    if (!window.confirm('Isso irá adicionar os itens de teste ao seu banco de dados. Deseja continuar?')) return;
    
    setSeeding(true);
    try {
      const batch = writeBatch(db);
      
      const categoriesData = [
        { id: 'cat-hamburgueres', name: 'Hambúrgueres', order: 1 },
        { id: 'cat-sanduiches', name: 'Sanduíches', order: 2 },
        { id: 'cat-acompanhamentos', name: 'Acompanhamentos e Batatas', order: 3 },
        { id: 'cat-combos', name: 'Combos', order: 4 },
        { id: 'cat-promocoes', name: 'Promoções', order: 5 },
        { id: 'cat-bebidas', name: 'Bebidas', order: 6 },
        { id: 'cat-sobremesas', name: 'Sobremesas', order: 7 },
      ];

      categoriesData.forEach(cat => {
        const ref = doc(db, 'categories', cat.id);
        batch.set(ref, { name: cat.name, order: cat.order });
      });

      const productsData = [
        { name: "Clássico Smash", description: "Burger 100g, queijo cheddar derretido, picles e maionese da casa no pão brioche.", price: 22.00, categoryId: 'cat-hamburgueres', isActive: true, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80' },
        { name: "Double Bacon", description: "Dois burgers de 100g, bacon crocante, queijo prato e barbecue.", price: 34.00, categoryId: 'cat-hamburgueres', isActive: true, isPromotion: true, imageUrl: 'https://images.unsplash.com/photo-1594212202875-54ac4ab50f0e?w=500&q=80' },
        { name: "Salad Burger", description: "Burger 150g, queijo muçarela, alface, tomate, cebola roxa e molho especial.", price: 28.00, categoryId: 'cat-hamburgueres', isActive: true, imageUrl: 'https://images.unsplash.com/photo-1586816001966-79b736744398?w=500&q=80' },
        { name: "Cheddar & Cebola", description: "Burger 150g, muito creme de cheddar e cebola caramelizada no pão australiano.", price: 30.00, categoryId: 'cat-hamburgueres', isActive: true, imageUrl: 'https://images.unsplash.com/photo-1603064752734-4c48eff53d05?w=500&q=80' },
        
        { name: "Crispy Chicken", description: "Sobrecoxa de frango empanada, alface americana e maionese de ervas.", price: 26.00, categoryId: 'cat-sanduiches', isActive: true, imageUrl: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=500&q=80' },
        { name: "Veggie Soul", description: "Hambúrguer de grão-de-bico, queijo coalho grelhado, rúcula e tomate seco.", price: 27.00, categoryId: 'cat-sanduiches', isActive: true, imageUrl: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=500&q=80' },
        
        { name: "Batata Palito P", description: "Porção individual de batatas crocantes.", price: 12.00, categoryId: 'cat-acompanhamentos', isActive: true, imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=500&q=80' },
        { name: "Batata Rústica", description: "Temperada com alecrim e páprica, servida com maionese de alho.", price: 18.00, categoryId: 'cat-acompanhamentos', isActive: true, imageUrl: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=500&q=80' },
        { name: "Batata Supreme", description: "Porção grande com cheddar cremoso e farofa de bacon.", price: 25.00, categoryId: 'cat-acompanhamentos', isActive: true, imageUrl: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=500&q=80' },
        { name: "Onion Rings", description: "Anéis de cebola empanados e super crocantes (8 unidades).", price: 16.00, categoryId: 'cat-acompanhamentos', isActive: true, imageUrl: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=500&q=80' },
        
        { name: "Combo Individual", description: "1 Burger Clássico + Batata P + Refri Lata.", price: 38.00, categoryId: 'cat-combos', isActive: true, isPromotion: true, imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&q=80' },
        { name: "Combo Casal", description: "2 Burgers (Clássico ou Salad) + Batata Grande + 2 Bebidas.", price: 72.00, categoryId: 'cat-combos', isActive: true, imageUrl: 'https://images.unsplash.com/photo-1610440042657-612c34d95e9f?w=500&q=80' },
        { name: "Combo Galera", description: "4 Burgers Clássicos + 2 Batatas Grandes + 1 Refri de 2L.", price: 130.00, categoryId: 'cat-combos', isActive: true, imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&q=80' },
        
        { name: "Refrigerante Lata", description: "350ml - Diversos sabores.", price: 6.00, categoryId: 'cat-bebidas', isActive: true, imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80' },
        { name: "Suco Natural", description: "Laranja ou Limonada Suíça (400ml).", price: 9.00, categoryId: 'cat-bebidas', isActive: true, imageUrl: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=500&q=80' },
        { name: "Cerveja Artesanal", description: "Long Neck (consulte rótulos).", price: 14.00, categoryId: 'cat-bebidas', isActive: true, imageUrl: 'https://images.unsplash.com/photo-1614315584058-4b21cb58040a?w=500&q=80' },
        
        { name: "Milkshake de Nutella", description: "400ml de puro gelato batido com avelã.", price: 18.00, categoryId: 'cat-sobremesas', isActive: true, imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&q=80' },
        { name: "Brownie do Chef", description: "Brownie aquecido servido com uma bola de sorvete de creme.", price: 15.00, categoryId: 'cat-sobremesas', isActive: true, isPromotion: true, imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&q=80' },
        
        { name: "Terça em Dobro", description: "Na compra de um Smash, o segundo sai pela metade do preço.", price: 33.00, categoryId: 'cat-promocoes', isActive: true, isPromotion: true, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80' },
        { name: "Almoço Executivo", description: "Sanduíche de Frango + Batata P + Suco (Até às 14h).", price: 32.00, categoryId: 'cat-promocoes', isActive: true, isPromotion: true, imageUrl: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=500&q=80' }
      ];

      productsData.forEach((prod) => {
        const ref = doc(collection(db, 'products'));
        batch.set(ref, prod);
      });

      await batch.commit();
      
      // Update restaurant name
      await setDoc(doc(db, 'settings', 'general'), { bannerTitle: 'Nome do Restaurante' }, { merge: true });

      alert('Cardápio de teste adicionado com sucesso!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'seed_data');
    } finally {
      setSeeding(false);
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configuración General</h1>
        <button
          onClick={handleSeedDatabase}
          disabled={seeding}
          className="bg-orange-100 text-orange-700 px-4 py-2 rounded-md hover:bg-orange-200 flex items-center gap-2 font-medium text-sm transition-colors disabled:opacity-50"
        >
          <Database size={16} />
          {seeding ? 'Adicionando...' : 'Adicionar Cardápio de Teste'}
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Contacto */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Contacto y Pedidos</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700">Número de WhatsApp (con código de país, ej: 5511999999999)</label>
            <input
              type="text" required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              value={formData.whatsappNumber} onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
              placeholder="5511999999999"
            />
            <p className="mt-1 text-sm text-gray-500">Este número recibirá los pedidos.</p>
          </div>
        </div>

        {/* Banner Principal (Hero) */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center border-b pb-2 mb-4">
            <h2 className="text-lg font-medium text-gray-900">Banner Principal (Hero)</h2>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.bannerIsActive} onChange={(e) => setFormData({ ...formData, bannerIsActive: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Activar Banner</span>
            </label>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Título del Banner</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                value={formData.bannerTitle} onChange={(e) => setFormData({ ...formData, bannerTitle: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Subtítulo</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                value={formData.bannerSubtitle} onChange={(e) => setFormData({ ...formData, bannerSubtitle: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">URL de la Imagen de Fondo</label>
              <input
                type="url"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                value={formData.bannerImageUrl} onChange={(e) => setFormData({ ...formData, bannerImageUrl: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Banner de Promoción (Catálogo) */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center border-b pb-2 mb-4">
            <h2 className="text-lg font-medium text-gray-900">Banner de Promoción (Catálogo)</h2>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.promoBannerIsActive} onChange={(e) => setFormData({ ...formData, promoBannerIsActive: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Activar Banner de Promoción</span>
            </label>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">URL de la Imagen Promocional</label>
              <input
                type="url"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                value={formData.promoBannerImageUrl} onChange={(e) => setFormData({ ...formData, promoBannerImageUrl: e.target.value })}
                placeholder="https://ejemplo.com/imagen-promo.jpg"
              />
              <p className="mt-1 text-sm text-gray-500">Se mostrará justo debajo del banner principal en el catálogo.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Enlace (Opcional)</label>
              <input
                type="url"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                value={formData.promoBannerLink} onChange={(e) => setFormData({ ...formData, promoBannerLink: e.target.value })}
                placeholder="https://wa.me/... o https://tu-sitio.com/promo"
              />
              <p className="mt-1 text-sm text-gray-500">Si agregas un enlace, la imagen será clickeable.</p>
            </div>
          </div>
        </div>

        {/* SEO y Marketing */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">SEO y Marketing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Título SEO (Aparece en Google y pestañas)</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                value={formData.seoTitle} onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Descripción SEO</label>
              <textarea
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                value={formData.seoDescription} onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Meta Pixel ID</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                value={formData.metaPixelId} onChange={(e) => setFormData({ ...formData, metaPixelId: e.target.value })}
                placeholder="Ej: 123456789012345"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Google Tag ID</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                value={formData.googleTagId} onChange={(e) => setFormData({ ...formData, googleTagId: e.target.value })}
                placeholder="Ej: G-XXXXXXXXXX"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 flex items-center gap-2 font-medium shadow-sm disabled:opacity-50"
          >
            <Save size={20} />
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </form>
    </div>
  );
}
