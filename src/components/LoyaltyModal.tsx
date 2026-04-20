import React, { useState } from 'react';
import { Star, Gift, Plus, Minus, X } from 'lucide-react';
import { LoyaltySettings } from '../types';

interface LoyaltyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onParticipate: () => void;
  settings?: LoyaltySettings;
  restaurantPhone?: string;
}

export function LoyaltyModal({ isOpen, onClose, onParticipate, settings, restaurantPhone }: LoyaltyModalProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  // Default benefits se não vier configurado do Admin
  const benefits = settings?.benefits?.length ? settings.benefits : [
    {
      id: '1',
      title: 'Um refrigerante 2l ou 1,5l de acordo com a disponibilidade.',
      milestone: 2,
    },
    {
      id: '2',
      title: 'Um cortador personalizado Forneria.',
      milestone: 5,
    },
    {
      id: '3',
      title: 'Uma borda recheada salgada. Colocar o sabor da borda e em qual pizza na observação do pedido.',
      milestone: 8,
    },
    {
      id: '4',
      title: 'Borda recheada doce. Exceto nas pizzas de 20cm. Especificar o sabor da borda doce na observação e indicando em qual pizza deseja.',
      milestone: 11,
    },
    {
      id: '5',
      title: 'Uma pizza doce 20cm qualquer sabor.',
      milestone: 14,
    },
    {
      id: '6',
      title: 'Uma pizza salgada 30cm qualquer sabor. Colocar o sabor na observação do pedido.',
      milestone: 17,
    },
    {
      id: '7',
      title: 'Uma pizza salgada 30cm (qualquer sabor) e uma pizza doce 20cm (qualquer sabor). Colocar o sabor na observação do pedido.',
      milestone: 20,
    },
  ];

  // Ordenar por milestone
  const sortedBenefits = [...benefits].sort((a, b) => a.milestone - b.milestone);
  
  // Extrair números para o subtítulo
  const milestonesText = sortedBenefits.map(b => `${b.milestone}º`).join(', ').replace(/, ([^,]*)$/, ' e $1');

  const faqs = settings?.faqs?.length ? settings.faqs : [
    {
      question: 'Como funciona a contagem dos pedidos?',
      answer: 'Cada pedido finalizado e entregue contabiliza para o seu programa de fidelidade. Cancelamentos não são contabilizados.'
    }
  ];

  const rules = settings?.rules?.length ? settings.rules : [
    'O prêmio deve ser resgatado no pedido correspondente à meta.',
    'Os prêmios não são cumulativos.',
    'Válido apenas para compras diretas pelo nosso aplicativo.'
  ];

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>
      
      <div className="relative bg-white w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col md:flex-row max-h-[90vh]">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-zinc-100/80 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 rounded-full flex items-center justify-center transition-colors md:hidden"
        >
          <X size={20} />
        </button>

        {/* Left Column - Promotional Card */}
        <div className="w-full md:w-5/12 bg-white p-8 md:p-12 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-zinc-100 shrink-0 relative">
          <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center text-white mb-6 shadow-md">
            <Star size={32} fill="currentColor" />
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-4 tracking-tight">
            PROGRAMA DE FIDELIDADE
          </h2>
          
          <p className="text-zinc-600 text-lg mb-10 max-w-xs mx-auto leading-relaxed">
            Ganhe prêmios após seu {milestonesText} pedido
          </p>
          
          <button 
            onClick={onParticipate}
            className="w-full max-w-xs bg-zinc-900 text-white py-4 px-6 rounded-2xl font-bold text-sm tracking-widest uppercase hover:bg-zinc-800 hover:-translate-y-1 transition-all shadow-lg hover:shadow-xl"
          >
            Entre e Participe
          </button>
        </div>

        {/* Right Column - Benefits List */}
        <div className="w-full md:w-7/12 bg-zinc-50 flex flex-col h-full overflow-hidden relative">
          
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 z-10 w-10 h-10 bg-white shadow-sm text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-full hidden md:flex items-center justify-center transition-colors"
          >
            <X size={20} />
          </button>

          <div className="p-8 md:p-10 overflow-y-auto flex-1 hide-scrollbar">
            <h3 className="text-xl font-bold text-zinc-900 mb-8">
              Benefícios que você pode ganhar
            </h3>

            <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-6 before:w-px before:bg-zinc-200">
              {sortedBenefits.map((benefit, index) => (
                <div key={benefit.id} className="relative flex gap-6">
                  {/* Icon / Timeline dot */}
                  <div className="relative z-10 w-12 h-12 rounded-full bg-white border-4 border-zinc-50 flex items-center justify-center shrink-0 shadow-sm">
                    <Gift size={20} className="text-zinc-400" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-zinc-800 font-medium leading-relaxed mb-2">
                      {benefit.title}
                    </p>
                    <p className="text-zinc-500 text-sm">
                      Ganhe após o {benefit.milestone}º pedido
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center text-zinc-400 text-sm italic mt-8">
              *Prêmio não cumulativo
            </p>

            {/* Mais informações */}
            <div className="mt-12 pt-8 border-t border-zinc-200">
              <h4 className="text-lg font-bold text-zinc-900 mb-6">Mais informações</h4>
              
              <div className="space-y-4">
                {/* Dúvidas Frequentes */}
                <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden shadow-sm">
                  <button 
                    onClick={() => toggleSection('faq')}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <span className="font-bold text-zinc-800">Dúvidas frequentes</span>
                    {expandedSection === 'faq' ? <Minus size={20} className="text-zinc-400" /> : <Plus size={20} className="text-zinc-400" />}
                  </button>
                  {expandedSection === 'faq' && (
                    <div className="p-5 pt-0 text-zinc-600 text-sm border-t border-zinc-50">
                      {faqs.map((faq, idx) => (
                        <div key={idx} className={idx > 0 ? "mt-4" : ""}>
                          <p className="font-medium text-zinc-800">{faq.question}</p>
                          <p className="mt-1 text-zinc-500">{faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Regulamento */}
                <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden shadow-sm">
                  <button 
                    onClick={() => toggleSection('rules')}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <span className="font-bold text-zinc-800">Regulamento do programa de fidelidade</span>
                    {expandedSection === 'rules' ? <Minus size={20} className="text-zinc-400" /> : <Plus size={20} className="text-zinc-400" />}
                  </button>
                  {expandedSection === 'rules' && (
                    <div className="p-5 pt-0 text-zinc-600 text-sm border-t border-zinc-50">
                      {rules.map((rule, idx) => (
                        <p key={idx} className={idx > 0 ? "mt-2" : ""}>{idx + 1}. {rule}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Help */}
              <div className="mt-8 text-center">
                <p className="text-zinc-500 text-sm mb-2">Ainda precisa de ajuda?</p>
                <a 
                  href={restaurantPhone ? `https://wa.me/${restaurantPhone}?text=Olá! Tenho dúvidas sobre o Programa de Fidelidade.` : '#'} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-900 font-bold hover:underline"
                >
                  Entre em contato com a gente
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
