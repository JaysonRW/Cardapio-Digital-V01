import React from 'react';

export function Dashboard() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold text-zinc-900 mb-2 tracking-tight">Dashboard</h1>
      <p className="text-zinc-500 mb-8">Bem-vindo ao painel administrativo do seu cardápio.</p>
      
      <div className="bg-white border border-zinc-200 rounded-xl p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-zinc-900 mb-4">Comece a gerenciar</h2>
        <p className="text-zinc-600 leading-relaxed">
          Selecione uma opção no menu lateral para gerenciar suas categorias, produtos ou ajustar as configurações do seu estabelecimento.
        </p>
      </div>
    </div>
  );
}
