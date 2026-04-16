# Roadmap de Evolução - Cardápio Digital 2026

Este documento delineia a visão de longo prazo para o projeto, priorizando a escalabilidade, manutenibilidade e experiência do usuário (UX).

## Visão Geral
Transformar o cardápio digital de um simples catálogo estático em uma plataforma completa de gerenciamento de pedidos, com automação e inteligência.

---

## 🚀 Fase 1: Fundação e Refatoração (Curto Prazo)
**Objetivo**: Melhorar a base de código para suportar o crescimento sem dívida técnica.

- **Refatoração de Componentes**: Quebrar o `Menu.tsx` (>500 linhas) em subcomponentes atômicos.
- **Hooks Customizados**: Isolar a lógica do Firebase em hooks (`useProducts`, `useCategories`).
- **Validação de Formulários**: Implementar `react-hook-form` + `zod` no Admin e Checkout.
- **Correção de Documentação**: Sincronizar docs com o código atual (ex: Cart persistence).

## 📦 Fase 2: Gestão de Pedidos e Mídia (Médio Prazo)
**Objetivo**: Sair do modelo "WhatsApp-only" para um fluxo de trabalho profissional e facilitar a gestão de imagens.

- **Coleção `orders`**: Persistir pedidos no Firestore antes do redirecionamento para o WhatsApp.
- **Firebase Storage**: Upload direto de imagens no painel administrativo (substituir URLs externas).
- **Painel de Pedidos Admin**: Visualização em tempo real de novos pedidos.
- **Status do Pedido**: Implementar fluxo (Pendente -> Preparando -> Saiu para Entrega -> Entregue).

## ✨ Fase 3: Personalização e UX (Médio/Longo Prazo)
**Objetivo**: Tornar o app visualmente impecável e permitir que o admin controle a identidade visual.

- **Temas Dinâmicos**: Implementar personalização de cores e estilos via painel Admin (Prioridade).
- **Skeleton Screens**: Substituir spinners por carregamentos progressivos.
- **Notificações em Tempo Real**: Alertas sonoros e visuais para o admin ao receber novos pedidos.
- **Animações**: Refinar transições com Framer Motion.

## 🛡️ Fase 4: Qualidade e Infraestrutura (Longo Prazo)
**Objetivo**: Garantir que o sistema seja robusto e confiável.

- **Testes Automatizados**: Cobertura com Vitest e React Testing Library.
- **CI/CD**: Automação total via GitHub Actions.
- **Multi-Tenant (Opcional)**: Preparar a arquitetura para suportar múltiplos restaurantes em uma única instância.
- **Segurança Avançada**: Refinar Custom Claims no Firebase Auth para controle de acesso granular.

---

## Prioridades Imediatas (Backlog)
1. Refatorar `Menu.tsx` (Manutenibilidade).
2. Criar coleção `orders` (Funcionalidade Crítica).
3. Corrigir e atualizar `/docs` (Comunicação).
