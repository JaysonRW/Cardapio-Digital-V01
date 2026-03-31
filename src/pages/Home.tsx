import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Settings } from '../types';
import { Clock, MapPin, Phone, MessageCircle } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export function Home() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Settings;
        setSettings({ id: docSnap.id, ...data });
        
        if (data.seoTitle) document.title = data.seoTitle;
      }
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/general'));

    return () => unsubSettings();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const restaurantName = settings?.restaurantName || 'ÀUREA';
  const restaurantHours = settings?.restaurantHours || 'Ter–Dom · 18h às 00h';
  const restaurantAddress = settings?.restaurantAddress || 'Rua das Flores, 123 – Curitiba';
  const restaurantPhone = settings?.restaurantPhone || '(41) 99534-3245';
  const whatsappNumber = settings?.whatsappNumber || '';
  
  const heroSubtitle = settings?.heroSubtitle || 'Gastronomia';
  const heroDescription = settings?.heroDescription || 'Uma experiência sensorial que celebra a arte culinária com ingredientes locais e técnicas contemporâneas.';
  const heroImageUrl = settings?.heroImageUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=2069&auto=format&fit=crop';
  const footerDescription = settings?.footerDescription || 'Gastronomia autoral que celebra ingredientes locais com técnicas contemporâneas.';

  const handleWhatsAppClick = () => {
    if (!whatsappNumber) return;
    const message = encodeURIComponent(`Olá! Gostaria de mais informações.`);
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans flex flex-col">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="text-2xl font-serif font-bold text-orange-400 tracking-wider">
          {restaurantName.toUpperCase()}
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium tracking-widest text-gray-300">
          <Link to="/" className="text-orange-400 hover:text-orange-300 transition-colors">INÍCIO</Link>
          <Link to="/menu" className="hover:text-white transition-colors">CARDÁPIO</Link>
          <a href="#contato" className="hover:text-white transition-colors">CONTATO</a>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative flex-1 flex items-center justify-center min-h-[80vh]">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImageUrl} 
            alt="Gastronomia" 
            className="w-full h-full object-cover opacity-40"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-transparent to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full pt-20">
          <div className="max-w-2xl">
            <h1 className="text-6xl md:text-8xl font-serif font-bold text-orange-400 mb-2 leading-tight">
              {restaurantName}
            </h1>
            <h2 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 leading-tight">
              {heroSubtitle}
            </h2>
            <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-lg leading-relaxed">
              {heroDescription}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/menu" 
                className="bg-orange-500 hover:bg-orange-400 text-zinc-950 font-bold py-4 px-8 rounded-md transition-colors flex items-center justify-center gap-2 text-lg"
              >
                Ver Cardápio →
              </Link>
              {whatsappNumber && (
                <button 
                  onClick={handleWhatsAppClick}
                  className="bg-transparent border border-orange-500/50 hover:border-orange-400 text-orange-400 font-bold py-4 px-8 rounded-md transition-colors flex items-center justify-center gap-2 text-lg"
                >
                  <MessageCircle size={20} />
                  Reservar Mesa
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Info Bar */}
      <section className="bg-zinc-900 border-y border-zinc-800 py-12" id="contato">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-zinc-800">
          <div className="py-4 md:py-0">
            <h3 className="text-orange-400 text-sm font-bold tracking-widest mb-3 uppercase">Horário</h3>
            <p className="text-xl font-serif text-gray-200">{restaurantHours}</p>
          </div>
          <div className="py-4 md:py-0">
            <h3 className="text-orange-400 text-sm font-bold tracking-widest mb-3 uppercase">Localização</h3>
            <p className="text-xl font-serif text-gray-200">{restaurantAddress}</p>
          </div>
          <div className="py-4 md:py-0">
            <h3 className="text-orange-400 text-sm font-bold tracking-widest mb-3 uppercase">Telefone</h3>
            <p className="text-xl font-serif text-gray-200">{restaurantPhone}</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-950 py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h2 className="text-2xl font-serif font-bold text-orange-400 mb-4 tracking-wider">
              {restaurantName.toUpperCase()}
            </h2>
            <p className="text-gray-400 leading-relaxed max-w-sm">
              {footerDescription}
            </p>
          </div>
          
          <div>
            <h3 className="text-white text-sm font-bold tracking-widest mb-6 uppercase">Informações</h3>
            <ul className="space-y-4 text-gray-400">
              <li className="flex items-center gap-3">
                <Clock size={18} className="text-orange-400" />
                {restaurantHours}
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-orange-400" />
                {restaurantPhone}
              </li>
              <li className="flex items-center gap-3">
                <MapPin size={18} className="text-orange-400" />
                {restaurantAddress}
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white text-sm font-bold tracking-widest mb-6 uppercase">Contato Rápido</h3>
            {whatsappNumber ? (
              <button 
                onClick={handleWhatsAppClick}
                className="bg-orange-500 hover:bg-orange-400 text-zinc-950 font-bold py-3 px-6 rounded-md transition-colors flex items-center gap-2 w-fit"
              >
                <MessageCircle size={20} />
                WhatsApp
              </button>
            ) : (
              <p className="text-gray-400">WhatsApp não configurado.</p>
            )}
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-zinc-800 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} {restaurantName}. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
