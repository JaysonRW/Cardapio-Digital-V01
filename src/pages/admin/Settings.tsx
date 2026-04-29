import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, writeBatch, collection } from 'firebase/firestore';
import { db } from '../../firebase';
import { Settings as SettingsType, MenuBanner } from '../../types';
import { useAdmin } from '../../contexts/AdminContext';
import { useAuth } from '../../contexts/AuthContext';
import { Save, Database, Palette, Gift, Plus, Trash2, Layout, Link as LinkIcon, MoveUp, MoveDown } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';
import { ImageUpload } from '../../components/ImageUpload';
import {
  buildPrimaryOverrideVariables,
  DEFAULT_THEME_INTENSITY,
  DEFAULT_THEME_PRESET,
  THEME_PRESETS,
  ThemeIntensity,
  ThemePresetId,
  isValidHexColor,
  normalizeThemeIntensity,
  normalizeThemePreset,
} from '../../lib/theme';

export function Settings() {
  const { restaurant } = useAdmin();
  const { user } = useAuth();
  const tenantId = restaurant?.id || '';
  const userId = user?.uid || '';
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const initialForm = {
    whatsappNumber: '',
    themePreset: DEFAULT_THEME_PRESET,
    themeIntensity: DEFAULT_THEME_INTENSITY,
    primaryColorOverride: '',
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
    restaurantName: '',
    restaurantLogoUrl: '',
    restaurantHours: '',
    restaurantAddress: '',
    restaurantPhone: '',
    instagramUrl: '',
    facebookUrl: '',
    heroSubtitle: '',
    heroDescription: '',
    heroImageUrl: '',
    footerDescription: '',
    isOpen: true,
    deliveryTime: '',
    pickupTime: '',
    enableReservations: false,
    reservationEnvironments: '',
    cashbackEnabled: false,
    cashbackPercentage: 0,
    cashbackType: 'percentage' as 'percentage' | 'fixed',
    cashbackValue: 0,
    menuBanners: [] as MenuBanner[],
    loyaltyProgram: {
      isActive: true,
      benefits: [],
      rules: [],
      faqs: [],
    },
  };
  const [formData, setFormData] = useState(initialForm);
  const hasInvalidPrimaryColor =
    formData.primaryColorOverride.trim().length > 0 &&
    !isValidHexColor(formData.primaryColorOverride.trim());
  const selectedTheme = THEME_PRESETS.find((theme) => theme.id === formData.themePreset) ?? THEME_PRESETS[0];
  const previewPrimaryColor =
    !hasInvalidPrimaryColor && formData.primaryColorOverride.trim().length > 0
      ? formData.primaryColorOverride.trim()
      : selectedTheme.color;
  const previewVariables = buildPrimaryOverrideVariables(previewPrimaryColor, formData.themeIntensity);

  useEffect(() => {
    if (!tenantId) return;

    const unsubscribe = onSnapshot(doc(db, 'restaurants', tenantId, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as SettingsType;
        setSettings({ id: docSnap.id, ...data });
        setFormData({
          whatsappNumber: data.whatsappNumber || '',
          themePreset: normalizeThemePreset(data.themePreset),
          themeIntensity: normalizeThemeIntensity(data.themeIntensity),
          primaryColorOverride: data.primaryColorOverride || '',
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
          restaurantName: data.restaurantName || '',
          restaurantLogoUrl: data.restaurantLogoUrl || '',
          restaurantHours: data.restaurantHours || '',
          restaurantAddress: data.restaurantAddress || '',
          restaurantPhone: data.restaurantPhone || '',
          instagramUrl: data.instagramUrl || '',
          facebookUrl: data.facebookUrl || '',
          heroSubtitle: data.heroSubtitle || '',
          heroDescription: data.heroDescription || '',
          heroImageUrl: data.heroImageUrl || '',
          footerDescription: data.footerDescription || '',
          isOpen: data.isOpen !== false,
          deliveryTime: data.deliveryTime || '',
          pickupTime: data.pickupTime || '',
          enableReservations: data.enableReservations || false,
          reservationEnvironments: data.reservationEnvironments || '',
          cashbackEnabled: data.loyaltyProgram?.cashbackEnabled || data.cashbackEnabled || false,
          cashbackPercentage: data.loyaltyProgram?.cashbackPercentage || data.cashbackPercentage || 0,
          cashbackType: data.loyaltyProgram?.cashbackType || data.cashbackType || 'percentage',
          cashbackValue: data.loyaltyProgram?.cashbackValue ?? (data.loyaltyProgram?.cashbackPercentage || data.cashbackPercentage || 0),
          menuBanners: data.menuBanners || [],
          loyaltyProgram: data.loyaltyProgram || {
            isActive: true,
            benefits: [],
            rules: [],
            faqs: [],
          },
        });
      } else {
        setSettings(null);
      }
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, `restaurants/${tenantId}/settings/general`));
    return unsubscribe;
  }, [tenantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;

    if (hasInvalidPrimaryColor) {
      alert('Informe uma cor hexadecimal valida, como #D9480F, antes de salvar.');
      return;
    }

    setSaving(true);
    try {
      const primaryColorOverride = formData.primaryColorOverride.trim();
      const { 
        cashbackEnabled, 
        cashbackPercentage, 
        cashbackType, 
        cashbackValue, 
        ...rest 
      } = formData;

      const payload = {
        ...rest,
        themePreset: normalizeThemePreset(formData.themePreset),
        themeIntensity: normalizeThemeIntensity(formData.themeIntensity),
        primaryColorOverride: isValidHexColor(primaryColorOverride) ? primaryColorOverride : '',
        loyaltyProgram: {
          ...formData.loyaltyProgram,
          cashbackEnabled,
          cashbackPercentage,
          cashbackType,
          cashbackValue,
        }
      };

      await setDoc(doc(db, 'restaurants', tenantId, 'settings', 'general'), payload, { merge: true });
      alert('Configurações salvas com sucesso.');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `restaurants/${tenantId}/settings/general`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddBanner = () => {
    const newBanner = {
      id: crypto.randomUUID(),
      title: '',
      subtitle: '',
      imageUrl: '',
      link: '',
      isActive: true,
      order: formData.menuBanners.length,
    };
    setFormData({ ...formData, menuBanners: [...formData.menuBanners, newBanner] });
  };

  const handleRemoveBanner = (id: string) => {
    setFormData({
      ...formData,
      menuBanners: formData.menuBanners.filter((b) => b.id !== id),
    });
  };

  const handleUpdateBanner = (id: string, updates: Partial<MenuBanner>) => {
    setFormData({
      ...formData,
      menuBanners: formData.menuBanners.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    });
  };

  const handleMoveBanner = (index: number, direction: 'up' | 'down') => {
    const newBanners = [...formData.menuBanners];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newBanners.length) return;

    [newBanners[index], newBanners[targetIndex]] = [newBanners[targetIndex], newBanners[index]];
    
    // Update order property
    const orderedBanners = newBanners.map((b, i) => ({ ...b, order: i }));
    setFormData({ ...formData, menuBanners: orderedBanners });
  };

  const handleAddLoyaltyBenefit = () => {
    const newBenefit = {
      id: crypto.randomUUID(),
      title: '',
      milestone: 1,
    };
    setFormData({
      ...formData,
      loyaltyProgram: {
        ...formData.loyaltyProgram,
        benefits: [...(formData.loyaltyProgram.benefits || []), newBenefit],
      },
    });
  };

  const handleRemoveLoyaltyBenefit = (id: string) => {
    setFormData({
      ...formData,
      loyaltyProgram: {
        ...formData.loyaltyProgram,
        benefits: formData.loyaltyProgram.benefits.filter((b) => b.id !== id),
      },
    });
  };

  const handleUpdateLoyaltyBenefit = (id: string, updates: any) => {
    setFormData({
      ...formData,
      loyaltyProgram: {
        ...formData.loyaltyProgram,
        benefits: formData.loyaltyProgram.benefits.map((b) =>
          b.id === id ? { ...b, ...updates } : b
        ),
      },
    });
  };

  const handleSeedDatabase = async () => {
    if (!tenantId) return;
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
        const ref = doc(db, 'restaurants', tenantId, 'categories', cat.id);
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
        const ref = doc(collection(db, 'restaurants', tenantId, 'products'));
        batch.set(ref, prod);
      });

      await batch.commit();
      
      // Update restaurant name
      await setDoc(doc(db, 'restaurants', tenantId, 'settings', 'general'), { restaurantName: 'Nome do Restaurante' }, { merge: true });

      alert('Cardápio de teste adicionado com sucesso!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'seed_data');
    } finally {
      setSeeding(false);
    }
  };

  if (loading) return <div className="text-zinc-500 animate-pulse">Carregando...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Configurações Gerais</h1>
        <button
          onClick={handleSeedDatabase}
          disabled={seeding}
          className="bg-orange-50 text-orange-600 border border-orange-100 px-4 py-2.5 rounded-lg hover:bg-orange-100 flex items-center gap-2 font-medium text-sm transition-colors disabled:opacity-50"
        >
          <Database size={16} />
          {seeding ? 'Adicionando...' : 'Adicionar Cardápio de Teste'}
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-8">
          <div className="flex items-start gap-3 border-b border-zinc-100 pb-4 mb-6">
            <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center shrink-0">
              <Palette size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Identidade Visual</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Escolha um tema por nicho e, se quiser, sobrescreva a cor principal para adaptar a marca do restaurante.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Tema pré-definido</label>
              <select
                className="block w-full rounded-lg border-zinc-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 py-2.5 px-3 text-zinc-900 text-sm"
                value={formData.themePreset}
                onChange={(e) => setFormData({ ...formData, themePreset: e.target.value as ThemePresetId })}
              >
                {THEME_PRESETS.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Cor primária customizada (opcional)</label>
              <input
                type="text"
                className="block w-full rounded-lg border-zinc-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 py-2.5 px-3 text-zinc-900 text-sm"
                value={formData.primaryColorOverride}
                onChange={(e) => setFormData({ ...formData, primaryColorOverride: e.target.value })}
                placeholder="Ex: #D9480F"
              />
              <p className="mt-1.5 text-sm text-zinc-500">
                Aceita hexadecimal com `#`. Deixe em branco para usar a cor padrão do tema.
              </p>
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-zinc-700 mb-3">Intensidade da cor</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {([
                { id: 'leve', label: 'Leve', description: 'Mais discreta, com acentos suaves.' },
                { id: 'medio', label: 'Médio', description: 'Equilíbrio entre contraste e suavidade.' },
                { id: 'forte', label: 'Forte', description: 'Acentos mais marcantes em estados ativos.' },
              ] as const).map((option) => {
                const isActive = formData.themeIntensity === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, themeIntensity: option.id as ThemeIntensity })}
                    className={`rounded-xl border p-4 text-left transition-all ${
                      isActive
                        ? 'border-orange-400 bg-orange-50 shadow-sm'
                        : 'border-zinc-200 bg-white hover:border-orange-200 hover:bg-zinc-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="font-semibold text-zinc-900">{option.label}</span>
                      <span className={`h-2.5 w-2.5 rounded-full ${isActive ? 'bg-orange-500' : 'bg-zinc-300'}`} />
                    </div>
                    <p className="text-sm text-zinc-500 leading-relaxed">{option.description}</p>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-sm text-zinc-500">
              Controla o peso visual dos estados ativos, badges e superfícies suaves sem colorir o fundo do app.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {THEME_PRESETS.map((theme) => {
              const isActive = theme.id === formData.themePreset;

              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, themePreset: theme.id })}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    isActive
                      ? 'border-orange-400 bg-orange-50 shadow-sm'
                      : 'border-zinc-200 bg-zinc-50 hover:border-orange-200 hover:bg-orange-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className="font-semibold text-zinc-900">{theme.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full border border-white shadow-sm" style={{ backgroundColor: theme.color }} />
                      <span className={`h-3 w-3 rounded-full ${isActive ? 'bg-orange-500' : 'bg-zinc-300'}`} />
                    </div>
                  </div>
                  <p className="text-sm text-zinc-500 leading-relaxed">{theme.description}</p>
                </button>
              );
            })}
          </div>

          <div
            className="mt-5 rounded-2xl border border-zinc-200 bg-white p-5"
            style={previewVariables as React.CSSProperties}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-zinc-900">Preview rápido</p>
                <p className="text-sm text-zinc-500">
                  Base neutra com a cor atuando apenas como destaque em CTA, badges e estado ativo.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: 'var(--primary-soft-border)', color: 'var(--primary)' }}>
                  {selectedTheme.label}
                </span>
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600">
                  Intensidade {formData.themeIntensity}
                </span>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <button
                type="button"
                className="rounded-xl px-4 py-3 text-sm font-semibold"
                style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
              >
                Botão principal
              </button>
              <div
                className="rounded-xl border px-4 py-3 text-sm font-semibold"
                style={{
                  backgroundColor: 'var(--primary-soft)',
                  borderColor: 'var(--primary-soft-border)',
                  color: 'var(--primary-strong)',
                }}
              >
                Badge / chip ativo
              </div>
              <div
                className="rounded-xl border bg-white px-4 py-3 text-sm font-medium"
                style={{ borderColor: 'var(--primary-soft-border)', color: 'var(--text)' }}
              >
                Superfície neutra com acento
              </div>
            </div>
          </div>

          {hasInvalidPrimaryColor && (
            <p className="mt-4 text-sm text-red-600">
              A cor customizada precisa estar em formato hexadecimal, como `#D9480F`.
            </p>
          )}
        </div>

        {/* Contato */}
        <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-8">
          <h2 className="text-lg font-semibold text-zinc-900 mb-6 border-b border-zinc-100 pb-3">Informações do Restaurante</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer bg-zinc-50 p-4 rounded-lg border border-zinc-200">
                <input
                  type="checkbox"
                  checked={formData.isOpen} onChange={(e) => setFormData({ ...formData, isOpen: e.target.checked })}
                  className="rounded border-zinc-300 text-orange-500 focus:ring-orange-500 w-5 h-5"
                />
                <span className="font-bold text-zinc-900">Restaurante Aberto para Pedidos</span>
              </label>
              <p className="mt-1.5 text-sm text-zinc-500">Desmarque para mostrar "Loja Fechada" no catálogo.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Nome do Restaurante</label>
              <input
                type="text"
                className="block w-full rounded-lg border-zinc-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 py-2.5 px-3 text-zinc-900 text-sm"
                value={formData.restaurantName} onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                placeholder="Ex: ÀUREA Gastronomia"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Horário de Funcionamento</label>
              <input
                type="text"
                className="block w-full rounded-lg border-zinc-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 py-2.5 px-3 text-zinc-900 text-sm"
                value={formData.restaurantHours} onChange={(e) => setFormData({ ...formData, restaurantHours: e.target.value })}
                placeholder="Ex: 18:00 - 23:00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Tempo de Entrega Estimado</label>
              <input
                type="text"
                className="block w-full rounded-lg border-zinc-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 py-2.5 px-3 text-zinc-900 text-sm"
                value={formData.deliveryTime} onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
                placeholder="Ex: 60 - 120"
              />
              <p className="mt-1 text-xs text-zinc-500">Aparecerá como "MINUTOS" no catálogo.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Tempo de Retirada Estimado</label>
              <input
                type="text"
                className="block w-full rounded-lg border-zinc-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 py-2.5 px-3 text-zinc-900 text-sm"
                value={formData.pickupTime} onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                placeholder="Ex: 40"
              />
              <p className="mt-1 text-xs text-zinc-500">Aparecerá como "MINUTOS" no catálogo.</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Endereço Completo</label>
              <input
                type="text"
                className="block w-full rounded-lg border-zinc-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 py-2.5 px-3 text-zinc-900 text-sm"
                value={formData.restaurantAddress} onChange={(e) => setFormData({ ...formData, restaurantAddress: e.target.value })}
                placeholder="Ex: Rua das Flores, 123 – Curitiba"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Telefone (Exibição)</label>
              <input
                type="text"
                className="block w-full rounded-lg border-zinc-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 py-2.5 px-3 text-zinc-900 text-sm"
                value={formData.restaurantPhone} onChange={(e) => setFormData({ ...formData, restaurantPhone: e.target.value })}
                placeholder="Ex: (41) 99534-3245"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Número de WhatsApp (com código do país)</label>
            <input
              type="text" required
              className="block w-full rounded-lg border-zinc-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 py-2.5 px-3 text-zinc-900 text-sm"
              value={formData.whatsappNumber} onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
              placeholder="5511999999999"
            />
            <p className="mt-1.5 text-sm text-zinc-500">Este número receberá os pedidos.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Instagram (URL)</label>
              <input
                type="url"
                className="block w-full rounded-lg border-zinc-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 py-2.5 px-3 text-zinc-900 text-sm"
                value={formData.instagramUrl} onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                placeholder="https://instagram.com/seu.restaurante"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Facebook (URL)</label>
              <input
                type="url"
                className="block w-full rounded-lg border-zinc-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 py-2.5 px-3 text-zinc-900 text-sm"
                value={formData.facebookUrl} onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                placeholder="https://facebook.com/seu.restaurante"
              />
            </div>
          </div>
        </div>

        {/* Cashback e Fidelidade */}
        <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-8">
          <div className="flex items-start gap-3 border-b border-zinc-100 pb-4 mb-6">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
              <Gift size={20} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-zinc-900">Programa de Fidelidade</h2>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.loyaltyProgram.isActive} 
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      loyaltyProgram: { ...formData.loyaltyProgram, isActive: e.target.checked } 
                    })}
                    className="rounded border-zinc-300 text-amber-500 focus:ring-amber-500 w-5 h-5"
                  />
                  <span className="text-sm font-bold text-zinc-700">Ativar Programa</span>
                </label>
              </div>
              <p className="mt-1 text-sm text-zinc-500">
                Configure recompensas por metas de pedidos e/ou sistema de cashback.
              </p>
            </div>
          </div>

          <div className={`space-y-8 transition-opacity ${formData.loyaltyProgram.isActive ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            {/* Cashback Config */}
            <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <h3 className="text-md font-bold text-zinc-900">Sistema de Cashback</h3>
                  {!formData.cashbackEnabled && <span className="text-[10px] bg-zinc-200 text-zinc-500 px-2 py-0.5 rounded-full uppercase">Desativado</span>}
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.cashbackEnabled} onChange={(e) => setFormData({ ...formData, cashbackEnabled: e.target.checked })}
                    className="rounded border-zinc-300 text-amber-500 focus:ring-amber-500 w-4 h-4"
                  />
                  <span className="text-xs font-bold text-zinc-600">Ativar Cashback</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Tipo de Recompensa</label>
                  <select
                    disabled={!formData.cashbackEnabled}
                    className="block w-full rounded-lg border-zinc-200 shadow-sm focus:border-amber-500 focus:ring-amber-500 py-2 px-3 text-zinc-900 text-sm disabled:bg-zinc-50 disabled:text-zinc-400"
                    value={formData.cashbackType}
                    onChange={(e) => setFormData({ ...formData, cashbackType: e.target.value as 'percentage' | 'fixed' })}
                  >
                    <option value="percentage">Porcentagem (%)</option>
                    <option value="fixed">Valor Fixo (R$)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                    {formData.cashbackType === 'percentage' ? 'Porcentagem (%)' : 'Valor Fixo (R$)'}
                  </label>
                  <div className="relative">
                    <input
                      type="number" min="0" step="0.01"
                      disabled={!formData.cashbackEnabled}
                      className="block w-full rounded-lg border-zinc-200 shadow-sm focus:border-amber-500 focus:ring-amber-500 py-2 px-3 text-zinc-900 text-sm disabled:bg-zinc-50 disabled:text-zinc-400"
                      value={formData.cashbackValue}
                      onChange={(e) => setFormData({ ...formData, cashbackValue: Number(e.target.value) })}
                      placeholder={formData.cashbackType === 'percentage' ? "Ex: 5" : "Ex: 2.00"}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">
                      {formData.cashbackType === 'percentage' ? '%' : 'R$'}
                    </span>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-zinc-500 leading-relaxed">
                {formData.cashbackType === 'percentage' 
                  ? 'O cashback será calculado sobre o valor final de cada pedido concluído.' 
                  : 'Um valor fixo será creditado na carteira do cliente para cada pedido concluído.'}
              </p>
            </div>

          <div className="mt-8 pt-8 border-t border-zinc-100">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-md font-bold text-zinc-900">Metas do Programa de Fidelidade</h3>
                <p className="text-sm text-zinc-500">Defina prêmios baseados na quantidade de pedidos do cliente.</p>
              </div>
              <button
                type="button"
                onClick={handleAddLoyaltyBenefit}
                className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 flex items-center gap-2 font-bold text-sm transition-colors shadow-sm"
              >
                <Plus size={18} />
                Adicionar Meta
              </button>
            </div>

            <div className="space-y-4">
              {formData.loyaltyProgram.benefits.length === 0 ? (
                <div className="text-center py-8 bg-zinc-50 rounded-xl border-2 border-dashed border-zinc-200">
                  <p className="text-zinc-500 text-sm">Nenhuma meta cadastrada. Clique em "Adicionar Meta".</p>
                </div>
              ) : (
                formData.loyaltyProgram.benefits
                  .sort((a, b) => a.milestone - b.milestone)
                  .map((benefit, index) => (
                    <div key={benefit.id} className="flex flex-col sm:flex-row gap-4 p-4 bg-zinc-50 rounded-xl border border-zinc-200 relative group">
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Título do Prêmio</label>
                        <input
                          type="text"
                          className="block w-full rounded-lg border-zinc-200 shadow-sm focus:border-amber-500 focus:ring-amber-500 py-2 px-3 text-sm"
                          value={benefit.title}
                          onChange={(e) => handleUpdateLoyaltyBenefit(benefit.id, { title: e.target.value })}
                          placeholder="Ex: Um refrigerante 2l grátis"
                        />
                      </div>
                      <div className="w-full sm:w-32">
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Qtd. Pedidos</label>
                        <input
                          type="number"
                          min="1"
                          className="block w-full rounded-lg border-zinc-200 shadow-sm focus:border-amber-500 focus:ring-amber-500 py-2 px-3 text-sm"
                          value={benefit.milestone}
                          onChange={(e) => handleUpdateLoyaltyBenefit(benefit.id, { milestone: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveLoyaltyBenefit(benefit.id)}
                          className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Configurações de Reserva */}
        <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-8">
          <div className="flex justify-between items-center border-b border-zinc-100 pb-3 mb-6">
            <h2 className="text-lg font-semibold text-zinc-900">Reservas de Mesa</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enableReservations} onChange={(e) => setFormData({ ...formData, enableReservations: e.target.checked })}
                className="rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-sm font-medium text-zinc-700">Ativar sistema de reservas</span>
            </label>
          </div>
          
          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Ambientes / Áreas Disponíveis (separados por vírgula)</label>
              <input
                type="text"
                className="block w-full rounded-lg border-zinc-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 py-2.5 px-3 text-zinc-900 text-sm"
                value={formData.reservationEnvironments} onChange={(e) => setFormData({ ...formData, reservationEnvironments: e.target.value })}
                placeholder="Ex: Salão Principal, Varanda Externa, Espaço Kids"
              />
              <p className="mt-1.5 text-sm text-zinc-500">Estas opções aparecerão para o cliente escolher durante a reserva.</p>
            </div>
          </div>
        </div>

        {/* Página Inicial (Home) */}
        <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-8">
          <h2 className="text-lg font-semibold text-zinc-900 mb-6 border-b border-zinc-100 pb-3">Página Inicial (Home)</h2>
          
          <div className="grid grid-cols-1 gap-5">
            <div>
              <ImageUpload
                value={formData.restaurantLogoUrl}
                onChange={(url) => setFormData({ ...formData, restaurantLogoUrl: url })}
                label="Logo do Restaurante"
                folder={`restaurants/${userId}/${tenantId}/settings`}
              />
              <p className="mt-1.5 text-sm text-zinc-500">Será exibida no cabeçalho do catálogo no lugar da letra inicial.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Subtítulo (Hero)</label>
              <input
                type="text"
                className="block w-full rounded-lg border-zinc-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 py-2.5 px-3 text-zinc-900 text-sm"
                value={formData.heroSubtitle} onChange={(e) => setFormData({ ...formData, heroSubtitle: e.target.value })}
                placeholder="Ex: Gastronomia"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Descrição (Hero)</label>
              <textarea
                className="block w-full rounded-lg border-zinc-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 py-2.5 px-3 text-zinc-900 text-sm"
                rows={3}
                value={formData.heroDescription} onChange={(e) => setFormData({ ...formData, heroDescription: e.target.value })}
                placeholder="Ex: Uma experiência sensorial que celebra a arte culinária..."
              />
            </div>
            <div>
              <ImageUpload
                value={formData.heroImageUrl}
                onChange={(url) => setFormData({ ...formData, heroImageUrl: url })}
                label="Imagem de Fundo (Hero)"
                folder={`restaurants/${userId}/${tenantId}/settings`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Descrição do Rodapé</label>
              <textarea
                className="block w-full rounded-lg border-zinc-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 py-2.5 px-3 text-zinc-900 text-sm"
                rows={2}
                value={formData.footerDescription} onChange={(e) => setFormData({ ...formData, footerDescription: e.target.value })}
                placeholder="Ex: Gastronomia autoral que celebra ingredientes locais..."
              />
            </div>
          </div>
        </div>

        {/* Banners do Cardápio (Novo) */}
        <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-8">
          <div className="flex justify-between items-center border-b border-zinc-100 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center shrink-0">
                <Layout size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Banners do Cardápio</h2>
                <p className="text-sm text-zinc-500">Adicione banners rotativos para destacar promoções e avisos.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddBanner}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center gap-2 font-bold text-sm transition-colors"
            >
              <Plus size={18} />
              Adicionar Banner
            </button>
          </div>

          <div className="space-y-6">
            {formData.menuBanners.length === 0 ? (
              <div className="text-center py-10 bg-zinc-50 rounded-xl border-2 border-dashed border-zinc-200">
                <p className="text-zinc-500 text-sm">Nenhum banner cadastrado. Clique em "Adicionar Banner" para começar.</p>
              </div>
            ) : (
              formData.menuBanners
                .sort((a, b) => a.order - b.order)
                .map((banner, index) => (
                  <div key={banner.id} className="p-6 bg-zinc-50 rounded-2xl border border-zinc-200 relative group">
                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleMoveBanner(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 bg-white border border-zinc-200 rounded-lg shadow-sm hover:bg-zinc-50 disabled:opacity-30"
                      >
                        <MoveUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveBanner(index, 'down')}
                        disabled={index === formData.menuBanners.length - 1}
                        className="p-1.5 bg-white border border-zinc-200 rounded-lg shadow-sm hover:bg-zinc-50 disabled:opacity-30"
                      >
                        <MoveDown size={14} />
                      </button>
                    </div>

                    <div className="flex justify-between items-start mb-6">
                      <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                        Banner #{index + 1}
                        {!banner.isActive && <span className="text-[10px] bg-zinc-200 text-zinc-600 px-2 py-0.5 rounded-full uppercase">Inativo</span>}
                      </h3>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={banner.isActive}
                            onChange={(e) => handleUpdateBanner(banner.id, { isActive: e.target.checked })}
                            className="rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
                          />
                          <span className="text-xs font-medium text-zinc-600">Ativo</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveBanner(banner.id)}
                          className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Título (Opcional)</label>
                          <input
                            type="text"
                            className="block w-full rounded-lg border-zinc-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 py-2 px-3 text-sm"
                            value={banner.title || ''}
                            onChange={(e) => handleUpdateBanner(banner.id, { title: e.target.value })}
                            placeholder="Ex: Super Promoção de Burger"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Subtítulo (Opcional)</label>
                          <input
                            type="text"
                            className="block w-full rounded-lg border-zinc-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 py-2 px-3 text-sm"
                            value={banner.subtitle || ''}
                            onChange={(e) => handleUpdateBanner(banner.id, { subtitle: e.target.value })}
                            placeholder="Ex: Apenas nesta terça-feira"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Link de Destino (Opcional)</label>
                          <div className="relative">
                            <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                              type="text"
                              className="block w-full rounded-lg border-zinc-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 py-2 pl-9 pr-3 text-sm"
                              value={banner.link || ''}
                              onChange={(e) => handleUpdateBanner(banner.id, { link: e.target.value })}
                              placeholder="URL ou slug de categoria"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <ImageUpload
                          value={banner.imageUrl}
                          onChange={(url) => handleUpdateBanner(banner.id, { imageUrl: url })}
                          label="Imagem do Banner"
                          folder={`restaurants/${userId}/${tenantId}/banners`}
                        />
                        <p className="mt-1.5 text-[10px] text-zinc-500">Recomendado: 1200x400px (Proporção 3:1)</p>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Banner de Promoção (Catálogo) */}
        <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-8">
          <div className="flex justify-between items-center border-b border-zinc-100 pb-3 mb-6">
            <h2 className="text-lg font-semibold text-zinc-900">Banner de Promoção (Catálogo)</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.promoBannerIsActive} onChange={(e) => setFormData({ ...formData, promoBannerIsActive: e.target.checked })}
                className="rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-sm font-medium text-zinc-700">Ativar Banner de Promoção</span>
            </label>
          </div>
          <div className="grid grid-cols-1 gap-5">
            <div>
              <ImageUpload
                value={formData.promoBannerImageUrl}
                onChange={(url) => setFormData({ ...formData, promoBannerImageUrl: url })}
                label="Imagem Promocional"
                folder={`restaurants/${userId}/${tenantId}/settings`}
              />
              <p className="mt-1.5 text-sm text-zinc-500">
                Será exibido logo abaixo do banner principal no catálogo. Recomendado: 1200x300px (Proporção 4:1).
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Link (Opcional)</label>
              <input
                type="url"
                className="block w-full rounded-lg border-zinc-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 py-2.5 px-3 text-zinc-900 text-sm"
                value={formData.promoBannerLink} onChange={(e) => setFormData({ ...formData, promoBannerLink: e.target.value })}
                placeholder="https://wa.me/... ou https://seu-site.com/promo"
              />
              <p className="mt-1.5 text-sm text-zinc-500">Se você adicionar um link, a imagem ficará clicável.</p>
            </div>
          </div>
        </div>

        {/* SEO e Marketing */}
        <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-8">
          <h2 className="text-lg font-semibold text-zinc-900 mb-6 border-b border-zinc-100 pb-3">SEO e Marketing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Título SEO (Aparece no Google e abas)</label>
              <input
                type="text"
                className="block w-full rounded-lg border-zinc-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 py-2.5 px-3 text-zinc-900 text-sm"
                value={formData.seoTitle} onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Descrição SEO</label>
              <textarea
                rows={2}
                className="block w-full rounded-lg border-zinc-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 py-2.5 px-3 text-zinc-900 text-sm"
                value={formData.seoDescription} onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Meta Pixel ID</label>
              <input
                type="text"
                className="block w-full rounded-lg border-zinc-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 py-2.5 px-3 text-zinc-900 text-sm"
                value={formData.metaPixelId} onChange={(e) => setFormData({ ...formData, metaPixelId: e.target.value })}
                placeholder="Ex: 123456789012345"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Google Tag ID</label>
              <input
                type="text"
                className="block w-full rounded-lg border-zinc-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 py-2.5 px-3 text-zinc-900 text-sm"
                value={formData.googleTagId} onChange={(e) => setFormData({ ...formData, googleTagId: e.target.value })}
                placeholder="Ex: G-XXXXXXXXXX"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving || hasInvalidPrimaryColor}
            className="bg-orange-500 text-white px-8 py-3.5 rounded-lg hover:bg-orange-600 flex items-center gap-2 font-bold shadow-sm disabled:opacity-50 transition-colors"
          >
            <Save size={20} />
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </form>
    </div>
  );
}
