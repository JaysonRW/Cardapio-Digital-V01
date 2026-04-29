# Cardápio Digital (Vite + React + Firebase)

Aplicação web de **cardápio digital** com:

- **Catálogo público** (Home + Cardápio) com busca, destaques, carrinho e checkout via WhatsApp
- **Painel administrativo** (login + CRUD de categorias e produtos + configurações)
- **Firebase Auth + Firestore** com regras de segurança e validação de dados

## Sumário

- [Funcionalidades](#funcionalidades)
- [Stack](#stack)
- [Rotas](#rotas)
- [Modelo de dados](#modelo-de-dados)
- [Rodar localmente](#rodar-localmente)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Deploy](#deploy)
- [Documentação completa](#documentação-completa)

## Funcionalidades

### Público

- Página inicial com informações do restaurante (nome, horário, endereço, telefone) e CTA para o cardápio
- Cardápio com:
  - Categorias (ordenadas por `order`)
  - Busca por nome/descrição
  - Destaques (produtos com `isPromotion`)
  - Carrinho local (no navegador) com total e quantidades
  - Checkout que abre o WhatsApp com o pedido formatado

### Admin

- Login com email/senha
- Gerenciamento de:
  - Categorias (CRUD)
  - Produtos (CRUD, ativo/inativo e promoção)
  - Configurações gerais (SEO, **banners do cardápio em carrossel**, banner promocional, imagem Hero/Home, dados do restaurante, Pixel/Tag)
  - Seed de dados de exemplo (botão “Adicionar Cardápio de Teste”)

## Stack

- React 19 + TypeScript
- Vite 6
- React Router 7
- Tailwind CSS 4
- Firebase (Auth + Firestore)

## Rotas

- `/` → Home (pública)
- `/menu` → Cardápio (pública)
- `/login` → Login do admin
- `/admin` → Painel admin
  - `/admin/categories` → Categorias
  - `/admin/products` → Produtos
  - `/admin/settings` → Configurações

As rotas estão definidas em [App.tsx](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/src/App.tsx).

## Modelo de dados

O Firestore está organizado por restaurante (tenant), seguindo este padrão:

- `restaurants/{restaurantId}`
  - `settings/general`
    - `whatsappNumber` (string)
    - `restaurantName`, `restaurantLogoUrl`, `restaurantHours`, `restaurantAddress`, etc.
    - `heroImageUrl` (string, opcional)
    - `promoBannerIsActive`, `promoBannerImageUrl`, `promoBannerLink` (opcionais)
    - `menuBanners` (array opcional)
      - `id` (string)
      - `title` (string, opcional)
      - `subtitle` (string, opcional)
      - `imageUrl` (string)
      - `link` (string, opcional)
      - `isActive` (boolean)
      - `order` (number)
  - `categories/{categoryId}`
    - `name` (string)
    - `order` (number)
  - `products/{productId}`
    - `name` (string)
    - `description` (string, opcional)
    - `price` (number)
    - `imageUrl` (string, opcional)
    - `categoryId` (string)
    - `isPromotion` (boolean, opcional)
    - `isUpsell` (boolean, opcional)
    - `isActive` (boolean)

Regras e validações estão em [firestore.rules](file:///c:/Users/jayso/Documents/TRAE/SITE-Cardapio-Digital-V01/firestore.rules).

## Rodar localmente

### Pré-requisitos

- Node.js (recomendado: LTS)
- Projeto Firebase configurado (Firestore + Authentication)

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm run dev
```

Servidor padrão: `http://localhost:3000`

### Build e preview

```bash
npm run build
npm run preview
```

### Typecheck (lint)

```bash
npm run lint
```

## Variáveis de ambiente

Este projeto inclui um [.env.example](file:///c:/Users/jayso/Documents/TRAE/SITE-Cardapio-Digital-V01/.env.example) com:

- `GEMINI_API_KEY`
- `APP_URL`

Observação: o app atual (Cardápio Digital) não usa Gemini diretamente no código de `src/`. Se você não estiver usando recursos de IA, pode ignorar essas variáveis.

## Deploy

- Vercel (SPA) com rewrite já configurado em [vercel.json](file:///c:/Users/jayso/Documents/TRAE/SITE-Cardapio-Digital-V01/vercel.json)
- Firebase Hosting (opcional), usando as mesmas regras do Firestore

Guia detalhado em [/docs/DEPLOY.md](file:///c:/Users/jayso/Documents/TRAE/SITE-Cardapio-Digital-V01/docs/DEPLOY.md).

## Documentação completa

- Manual de imagens (tamanhos oficiais): [/docs/MANUAL_DE_IMAGENS.md](file:///c:/Users/jayso/Documents/TRAE/SITE-Cardapio-Digital-V01/docs/MANUAL_DE_IMAGENS.md)
- Operação (admin + pedidos WhatsApp): [/docs/OPERACAO.md](file:///c:/Users/jayso/Documents/TRAE/SITE-Cardapio-Digital-V01/docs/OPERACAO.md)
- Firebase (dados, regras e Auth): [/docs/FIREBASE.md](file:///c:/Users/jayso/Documents/TRAE/SITE-Cardapio-Digital-V01/docs/FIREBASE.md)
- Arquitetura do front-end: [/docs/ARQUITETURA.md](file:///c:/Users/jayso/Documents/TRAE/SITE-Cardapio-Digital-V01/docs/ARQUITETURA.md)
- Deploy (Vercel + Firebase Hosting): [/docs/DEPLOY.md](file:///c:/Users/jayso/Documents/TRAE/SITE-Cardapio-Digital-V01/docs/DEPLOY.md)
- Troubleshooting: [/docs/TROUBLESHOOTING.md](file:///c:/Users/jayso/Documents/TRAE/SITE-Cardapio-Digital-V01/docs/TROUBLESHOOTING.md)
