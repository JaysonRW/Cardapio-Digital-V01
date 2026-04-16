import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Settings } from '../types';
import { Clock, MapPin, Phone, MessageCircle, Instagram, Facebook, Calendar, Users, Edit3, Star, Zap, DollarSign, ArrowRight } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { motion } from 'framer-motion';

export function Home() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [reservationData, setReservationData] = useState({
    date: '',
    environment: '',
    guests: '2',
    time: '',
    specialRequests: ''
  });

  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Settings;
        setSettings({ id: docSnap.id, ...data });
        
        // Atualiza o ambiente inicial caso exista
        if (data.reservationEnvironments) {
          const envs = data.reservationEnvironments.split(',').map(e => e.trim());
          if (envs.length > 0) {
            setReservationData(prev => ({ ...prev, environment: envs[0] }));
          }
        }
        
        if (data.seoTitle) document.title = data.seoTitle;
      }
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/general'));

    return () => unsubSettings();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
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
  const instagramUrl = settings?.instagramUrl || '';
  const facebookUrl = settings?.facebookUrl || '';

  const enableReservations = settings?.enableReservations || false;
  const reservationEnvironments = settings?.reservationEnvironments ? settings.reservationEnvironments.split(',').map(e => e.trim()) : ['Salão Principal'];

  const handleWhatsAppClick = () => {
    if (!whatsappNumber) return;
    const message = encodeURIComponent(`Olá! Gostaria de mais informações.`);
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  const handleReservationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsappNumber) return;
    
    // Formatar a data (assumindo YYYY-MM-DD do input type="date")
    const dateObj = new Date(reservationData.date + 'T00:00:00'); // Evitar problema de fuso horário
    const formattedDate = dateObj.toLocaleDateString('pt-BR');
    
    const text = `*NOVA SOLICITAÇÃO DE RESERVA* 🍽️\n\n*Data:* ${formattedDate}\n*Horário:* ${reservationData.time}\n*Pessoas:* ${reservationData.guests}\n*Ambiente:* ${reservationData.environment}\n*Observações:* ${reservationData.specialRequests || 'Nenhuma'}\n\nAguardo confirmação!`;
    
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`, '_blank');
    setIsReservationModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-white/92 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center w-full">
        <div className="text-2xl font-serif font-bold text-[var(--text)] tracking-tight">
          {restaurantName.toUpperCase()}
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-semibold tracking-[0.18em] text-zinc-500">
          <Link to="/" className="text-[var(--primary)] transition-colors">INICIO</Link>
          <Link to="/menu" className="hover:text-[var(--text)] transition-colors">CARDAPIO</Link>
          <a href="#contato" className="hover:text-[var(--text)] transition-colors">CONTATO</a>
        </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-10 md:py-16">
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[var(--primary-soft)] to-transparent opacity-70"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-2 mb-6 bg-white border border-[var(--border)] rounded-full py-2 px-4 w-fit shadow-sm"
            >
              <div className="flex items-center text-[var(--primary)]">
                <Star size={14} className="fill-[var(--primary)]" />
                <span className="font-bold ml-1.5 text-sm">4.8</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-zinc-300 mx-1"></div>
              <span className="text-zinc-500 text-sm font-medium">+500 pedidos</span>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-medium text-[var(--text)] mb-4 leading-[1.02] tracking-tight">
                {restaurantName}
              </h1>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-light text-zinc-700 mb-6 leading-tight italic">
                {heroSubtitle}
              </h2>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <div className="absolute -left-6 top-2 bottom-2 w-px bg-gradient-to-b from-[var(--primary-soft-border)] to-transparent hidden md:block"></div>
              <p className="text-lg md:text-xl text-zinc-600 mb-10 max-w-lg leading-relaxed font-normal">
                {heroDescription}
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row gap-5"
            >
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link 
                  to="/menu" 
                  className="bg-[var(--primary)] hover:bg-[var(--primary-strong)] text-[var(--primary-foreground)] font-semibold py-4 px-8 rounded-2xl transition-all flex items-center justify-center gap-3 text-lg h-full shadow-sm"
                >
                  Ver Cardápio
                  <span className="block transition-transform group-hover:translate-x-1">→</span>
                </Link>
              </motion.div>
              {whatsappNumber && (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  {enableReservations ? (
                    <button 
                      onClick={() => setIsReservationModalOpen(true)}
                      className="bg-white border border-[var(--border)] hover:border-[var(--primary-soft-border)] hover:bg-[var(--surface-strong)] text-[var(--text)] font-semibold py-4 px-8 rounded-2xl transition-all flex items-center justify-center gap-3 text-lg h-full w-full"
                    >
                      <Calendar size={20} className="text-[var(--primary)]" />
                      Reservar Mesa
                    </button>
                  ) : (
                    <button 
                      onClick={handleWhatsAppClick}
                      className="bg-white border border-[var(--border)] hover:border-[var(--primary-soft-border)] hover:bg-[var(--surface-strong)] text-[var(--text)] font-semibold py-4 px-8 rounded-2xl transition-all flex items-center justify-center gap-3 text-lg h-full w-full"
                    >
                      <MessageCircle size={20} className="text-[var(--primary)]" />
                      Falar Conosco
                    </button>
                  )}
                </motion.div>
              )}
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:block relative w-full max-w-md"
          >
            <div className="relative rounded-[2rem] border border-[var(--border)] bg-white p-4 shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
              <div className="aspect-[4/5] overflow-hidden rounded-[1.5rem] border border-[var(--border)] relative bg-zinc-100">
                <img 
                  src={heroImageUrl} 
                  alt="Detalhe Gastronômico" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <div className="rounded-2xl bg-white/92 backdrop-blur-sm border border-white px-4 py-4 text-left shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
                        <Star size={15} className="fill-[var(--primary)]" />
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Experiência</p>
                    </div>
                    <p className="text-sm text-zinc-700 leading-relaxed">
                      Visual limpo, leitura rápida e foco total na conversão do visitante em pedido.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Experiência / Diferencial */}
      <section className="bg-[var(--bg)] py-20 border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[var(--text)] mb-4">A melhor experiência para você</h2>
            <p className="text-zinc-500">Tudo pensado para o seu conforto, do pedido à entrega.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-[var(--border)] hover:border-[var(--primary-soft-border)] transition-colors group shadow-sm">
              <div className="w-14 h-14 bg-[var(--primary-soft)] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap size={28} className="text-[var(--primary)]" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text)] mb-3">Pedido Rápido</h3>
              <p className="text-zinc-500 leading-relaxed">Navegue pelo nosso cardápio digital de forma fluida e faça seu pedido em poucos cliques, sem complicação.</p>
            </div>
            
            <div className="bg-white p-8 rounded-3xl border border-[var(--border)] hover:border-[var(--primary-soft-border)] transition-colors group shadow-sm">
              <div className="w-14 h-14 bg-[var(--primary-soft)] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MessageCircle size={28} className="text-[var(--primary)]" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text)] mb-3">Direto no WhatsApp</h3>
              <p className="text-zinc-500 leading-relaxed">Sem intermediários. Seu pedido cai direto no nosso WhatsApp, com atendimento humanizado e rápido.</p>
            </div>
            
            <div className="bg-white p-8 rounded-3xl border border-[var(--border)] hover:border-[var(--primary-soft-border)] transition-colors group shadow-sm">
              <div className="w-14 h-14 bg-[var(--primary-soft)] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <DollarSign size={28} className="text-[var(--primary)]" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text)] mb-3">Sem Taxas Ocultas</h3>
              <p className="text-zinc-500 leading-relaxed">Comprando direto pelo nosso sistema você não paga taxas de aplicativos. É mais economia para você.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Info Bar */}
      <section className="relative z-20 bg-white border-y border-[var(--border)] py-16" id="contato">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10 items-start text-center divide-y md:divide-y-0 md:divide-x divide-[var(--border)]">
          <div className="py-6 md:py-0 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-[var(--primary-soft)] flex items-center justify-center mb-5">
              <Clock size={20} className="text-[var(--primary)]" />
            </div>
            <h3 className="text-zinc-500 text-xs font-bold tracking-widest mb-3 uppercase">Horário de Funcionamento</h3>
            <p className="text-xl font-serif text-[var(--text)]">{restaurantHours}</p>
          </div>
          <div className="py-6 md:py-0 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-[var(--primary-soft)] flex items-center justify-center mb-5">
              <MapPin size={20} className="text-[var(--primary)]" />
            </div>
            <h3 className="text-zinc-500 text-xs font-bold tracking-widest mb-3 uppercase">Localização</h3>
            <p className="text-xl font-serif text-[var(--text)] max-w-[200px] leading-snug mx-auto">{restaurantAddress}</p>
          </div>
          <div className="py-6 md:py-0 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-[var(--primary-soft)] flex items-center justify-center mb-5">
              <MessageCircle size={20} className="text-[var(--primary)]" />
            </div>
            <h3 className="text-zinc-500 text-xs font-bold tracking-widest mb-3 uppercase">Atendimento e Reservas</h3>
            <p className="text-xl font-serif text-[var(--text)] mb-4">{restaurantPhone}</p>
            {whatsappNumber && (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleWhatsAppClick}
                className="bg-[var(--primary)] hover:bg-[var(--primary-strong)] text-[var(--primary-foreground)] font-bold py-2.5 px-6 rounded-2xl transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
                Chamar no WhatsApp
              </motion.button>
            )}
          </div>
        </div>
      </section>

      {/* Modal de Reserva */}
      {isReservationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/35 backdrop-blur-sm" onClick={() => setIsReservationModalOpen(false)}></div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-lg bg-white border border-[var(--border)] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-bold text-[var(--text)] flex items-center gap-3 tracking-tight">
                  <Calendar size={20} className="text-[var(--primary)]" />
                  Fazer reserva de mesa
                </h2>
                <p className="text-sm text-zinc-500 mt-1">Escolha a data e venha ao restaurante</p>
              </div>
              <button onClick={() => setIsReservationModalOpen(false)} className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 flex items-center justify-center transition-colors">
                ✕
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 space-y-6">
              {/* Aviso */}
              <div className="bg-[var(--primary-soft)] border border-[var(--primary-soft-border)] rounded-2xl p-4 text-zinc-700 text-sm leading-relaxed">
                <p className="mb-3">Todos os convidados devem chegar no horário reservado. Mesas livres serão liberadas para a fila de espera.</p>
                <p>Favor não efetuar reservas para quantidades diferentes das disponíveis no dia selecionado, pois não conseguiremos atender.</p>
              </div>

              <form id="reservation-form" onSubmit={handleReservationSubmit} className="space-y-5">
                {/* Data */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-zinc-700 mb-2 uppercase tracking-wider">
                    <Calendar size={16} className="text-zinc-400" />
                    Dia da Reserva
                  </label>
                  <input
                    type="date" required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--text)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-colors"
                    value={reservationData.date} onChange={e => setReservationData({...reservationData, date: e.target.value})}
                  />
                </div>

                {/* Ambiente */}
                {reservationEnvironments.length > 0 && reservationEnvironments[0] !== '' && (
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-zinc-700 mb-2 uppercase tracking-wider">
                      <MapPin size={16} className="text-zinc-400" />
                      Salão, ambiente ou atividade
                    </label>
                    <select
                      required
                      className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--text)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-colors"
                      value={reservationData.environment} onChange={e => setReservationData({...reservationData, environment: e.target.value})}
                    >
                      {reservationEnvironments.map((env, idx) => (
                        <option key={idx} value={env}>{env}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Pessoas e Horário (Grid) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-zinc-700 mb-2 uppercase tracking-wider">
                      <Users size={16} className="text-zinc-400" />
                      Pessoas
                    </label>
                    <select
                      required
                      className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--text)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-colors"
                      value={reservationData.guests} onChange={e => setReservationData({...reservationData, guests: e.target.value})}
                    >
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(num => (
                        <option key={num} value={num}>{num} {num === 1 ? 'Pessoa' : 'Pessoas'}</option>
                      ))}
                      <option value="13+">13+ Pessoas</option>
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-zinc-700 mb-2 uppercase tracking-wider">
                      <Clock size={16} className="text-zinc-400" />
                      Horário
                    </label>
                    <input
                      type="time" required
                      className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--text)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-colors"
                      value={reservationData.time} onChange={e => setReservationData({...reservationData, time: e.target.value})}
                    />
                  </div>
                </div>

                {/* Algo especial */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-zinc-700 mb-2 uppercase tracking-wider">
                    <Edit3 size={16} className="text-zinc-400" />
                    Precisa de algo especial? (opcional)
                  </label>
                  <textarea
                    rows={2}
                    className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--text)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-colors resize-none placeholder:text-zinc-400"
                    placeholder="Ex.: Aniversário, ocasiões especiais, cadeira de bebê..."
                    value={reservationData.specialRequests} onChange={e => setReservationData({...reservationData, specialRequests: e.target.value})}
                  />
                </div>
              </form>
              
              <p className="text-center text-[var(--primary)] text-sm font-medium">
                Reserva válida somente para o horário selecionado.
              </p>
            </div>

            <div className="p-6 border-t border-[var(--border)] bg-white sticky bottom-0 z-10">
              <button
                type="submit"
                form="reservation-form"
                className="w-full bg-[var(--primary)] text-[var(--primary-foreground)] py-4 rounded-xl font-bold text-lg hover:bg-[var(--primary-strong)] transition-colors shadow-sm"
              >
                Continuar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* CTA Final */}
      <section className="bg-[var(--bg)] py-24 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="rounded-[2rem] border border-[var(--border)] bg-white px-8 py-12 shadow-sm"
          >
            <h2 className="text-4xl md:text-6xl font-serif font-bold text-[var(--text)] mb-6">Pronto para pedir?</h2>
            <p className="text-xl text-zinc-500 mb-10 max-w-2xl mx-auto">
              Experimente a melhor gastronomia no conforto da sua casa ou reserve sua mesa para uma noite inesquecível.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link 
                  to="/menu" 
                  className="bg-[var(--primary)] hover:bg-[var(--primary-strong)] text-[var(--primary-foreground)] font-bold py-4 px-10 rounded-2xl transition-all flex items-center justify-center gap-3 text-lg shadow-sm w-full sm:w-auto"
                >
                  <ArrowRight size={20} />
                  Fazer meu pedido
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-16 px-6 border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h2 className="text-2xl font-serif font-bold text-[var(--text)] mb-4 tracking-tight">
              {restaurantName.toUpperCase()}
            </h2>
            <p className="text-zinc-500 leading-relaxed max-w-sm">
              {footerDescription}
            </p>
          </div>
          
          <div>
            <h3 className="text-[var(--text)] text-sm font-bold tracking-widest mb-6 uppercase">Informações</h3>
            <ul className="space-y-4 text-zinc-500">
              <li className="flex items-center gap-3">
                <Clock size={18} className="text-[var(--primary)]" />
                {restaurantHours}
              </li>
              <li>
                <a 
                  href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 hover:text-[var(--primary)] transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--primary)] shrink-0">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                  </svg>
                  <span>{restaurantPhone}</span>
                </a>
              </li>
              <li>
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurantAddress)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 hover:text-[var(--primary)] transition-colors"
                >
                  <MapPin size={18} className="text-[var(--primary)] shrink-0 mt-0.5" />
                  <span>{restaurantAddress}</span>
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-[var(--text)] text-sm font-bold tracking-widest mb-6 uppercase">Redes Sociais</h3>
            <p className="text-zinc-500 mb-6 max-w-sm">
              Acompanhe nossas novidades, eventos e pratos especiais em nossas redes.
            </p>
            <div className="flex gap-4">
              {instagramUrl && (
                <motion.a 
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-12 h-12 rounded-full bg-white border border-[var(--border)] flex items-center justify-center text-zinc-400 hover:text-[var(--primary)] hover:border-[var(--primary-soft-border)] hover:bg-[var(--primary-soft)] transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram size={20} />
                </motion.a>
              )}
              {facebookUrl && (
                <motion.a 
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-12 h-12 rounded-full bg-white border border-[var(--border)] flex items-center justify-center text-zinc-400 hover:text-[var(--primary)] hover:border-[var(--primary-soft-border)] hover:bg-[var(--primary-soft)] transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook size={20} />
                </motion.a>
              )}
              {!instagramUrl && !facebookUrl && (
                <p className="text-sm text-zinc-600 italic">Redes sociais não configuradas.</p>
              )}
            </div>
            
            <div className="mt-10">
              <h3 className="text-[var(--text)] text-sm font-bold tracking-widest mb-4 uppercase">Links Rápidos</h3>
              <div className="flex flex-col gap-3">
                <Link to="/menu" className="text-zinc-500 hover:text-[var(--primary)] transition-colors w-fit">
                  Ver Cardápio Completo
                </Link>
                <Link to="/admin" className="text-zinc-600 hover:text-zinc-400 transition-colors w-fit text-sm">
                  Acesso Administrativo
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-[var(--border)] flex flex-col md:flex-row justify-between items-center gap-4 text-zinc-500 text-sm">
          <span>© {new Date().getFullYear()} {restaurantName}. Todos os direitos reservados.</span>
          <span>
            Criado por <a href="https://www.propagounaweb.com.br" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--primary)] transition-colors font-medium">propagounaweb</a>
          </span>
        </div>
      </footer>
    </div>
  );
}
