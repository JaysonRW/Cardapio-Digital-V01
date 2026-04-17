import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection, serverTimestamp, getDocs, writeBatch, doc, query, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useAdmin } from '../../contexts/AdminContext';
import { Store, Rocket, Database, AlertCircle } from 'lucide-react';

export function Onboarding() {
  const { user } = useAuth();
  const { restaurant, refreshRestaurant } = useAdmin();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [importLegacyData, setImportLegacyData] = useState(false);
  const [hasLegacyData, setHasLegacyData] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Verifica se existem dados nas coleções legadas
  useEffect(() => {
    async function checkLegacyData() {
      if (!user) return;
      try {
        const categoriesSnapshot = await getDocs(query(collection(db, 'categories'), limit(1)));
        const productsSnapshot = await getDocs(query(collection(db, 'products'), limit(1)));
        if (!categoriesSnapshot.empty || !productsSnapshot.empty) {
          setHasLegacyData(true);
          setImportLegacyData(true); // Seleciona por padrão se houver dados
        }
      } catch (error) {
        console.warn('Erro ao verificar dados legados:', error);
      }
    }
    checkLegacyData();
  }, [user]);

  // Se já tem restaurante, vai pro dashboard
  useEffect(() => {
    if (restaurant) {
      navigate('/admin');
    }
  }, [restaurant, navigate]);

  const migrateData = async (restaurantId: string) => {
    const batch = writeBatch(db);
    
    // Migrar Categorias
    const categoriesSnap = await getDocs(collection(db, 'categories'));
    categoriesSnap.forEach((categoryDoc) => {
      const newRef = doc(db, 'restaurants', restaurantId, 'categories', categoryDoc.id);
      batch.set(newRef, categoryDoc.data());
    });

    // Migrar Produtos
    const productsSnap = await getDocs(collection(db, 'products'));
    productsSnap.forEach((productDoc) => {
      const newRef = doc(db, 'restaurants', restaurantId, 'products', productDoc.id);
      batch.set(newRef, productDoc.data());
    });

    // Migrar Settings
    const settingsSnap = await getDocs(collection(db, 'settings'));
    settingsSnap.forEach((settingDoc) => {
      const newRef = doc(db, 'restaurants', restaurantId, 'settings', settingDoc.id);
      batch.set(newRef, settingDoc.data());
    });

    await batch.commit();
    console.log('Migração concluída com sucesso!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const restaurantData = {
        name,
        slug: slug.toLowerCase().trim().replace(/\s+/g, '-'),
        ownerUid: user.uid,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const restaurantRef = await addDoc(collection(db, 'restaurants'), restaurantData);
      
      if (importLegacyData) {
        await migrateData(restaurantRef.id);
      }

      await refreshRestaurant();
      navigate('/admin');
    } catch (error) {
      console.error('Error creating restaurant:', error);
      alert('Erro ao criar restaurante. Verifique se o slug já existe.');
    } finally {
      setLoading(false);
    }
  };

  if (restaurant) return null;

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-zinc-200 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Store size={32} />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">Bem-vindo ao Painel!</h1>
          <p className="text-zinc-500 mt-2">Vamos configurar o seu primeiro restaurante.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-2 uppercase tracking-wider">Nome do Restaurante</label>
            <input
              type="text" required
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              placeholder="Ex: Açaiteria do Jorginho"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-2 uppercase tracking-wider">URL Amigável (slug)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">cardapio.com/</span>
              <input
                type="text" required
                className="w-full pl-28 pr-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                placeholder="acaiteria-do-jorginho"
                value={slug}
                onChange={e => setSlug(e.target.value)}
              />
            </div>
            <p className="text-xs text-zinc-400 mt-2 italic">Este será o link público da sua loja.</p>
          </div>

          {hasLegacyData && (
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 rounded border-orange-300 text-orange-500 focus:ring-orange-500"
                  checked={importLegacyData}
                  onChange={e => setImportLegacyData(e.target.checked)}
                />
                <div>
                  <div className="flex items-center gap-2 text-orange-700 font-bold text-sm">
                    <Database size={16} />
                    Importar dados existentes
                  </div>
                  <p className="text-xs text-orange-600/80 mt-1">
                    Detectamos produtos e categorias no sistema antigo. Deseja migrá-los para este novo restaurante?
                  </p>
                </div>
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !name || !slug}
            className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-orange-500/20"
          >
            {loading ? 'Processando...' : 'Criar e Configurar'}
            {!loading && <Rocket size={20} />}
          </button>
        </form>
      </div>
    </div>
  );
}
