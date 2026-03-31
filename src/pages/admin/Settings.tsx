import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Settings as SettingsType } from '../../types';
import { Save } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';

export function Settings() {
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Configuración General</h1>
      
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

        {/* Banner Promocional */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center border-b pb-2 mb-4">
            <h2 className="text-lg font-medium text-gray-900">Banner Promocional</h2>
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
