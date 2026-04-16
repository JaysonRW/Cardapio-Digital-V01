# Arquitetura (Front-end)

Este projeto é um SPA (Single Page Application) em React que consome o Firestore diretamente do navegador.

## Visão geral

- **Camada de UI**: páginas e componentes React
- **Estado global leve**: Context API para Auth e Carrinho
- **Dados**: Firebase Firestore (real-time via `onSnapshot`)
- **Autenticação**: Firebase Auth (email/senha)

## Estrutura de pastas

- `src/components`
  - `AdminLayout.tsx`: layout + proteção das rotas admin
  - `PublicLayout.tsx`: layout público (wrapper)
  - `ErrorBoundary.tsx`: fallback de erro global
- `src/contexts`
  - `AuthContext.tsx`: user/loading/login/logout
  - `CartContext.tsx`: carrinho local (itens, total, ações)
- `src/pages`
  - `Home.tsx`: landing pública (usa `settings/general`)
  - `Menu.tsx`: catálogo/carrinho/checkout WhatsApp
  - `Login.tsx`: login admin
  - `pages/admin/*`: telas do painel admin
- `src/lib`
  - `utils.ts`: utilitários (ex.: formatação)
  - `firestore-errors.ts`: normalização/log de erros do Firestore
- `src/firebase.ts`: bootstrap do Firebase (Auth + Firestore)
- `src/types.ts`: tipos principais do domínio

## Rotas e navegação

Definição das rotas: [App.tsx](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/src/App.tsx)

- Rotas públicas ficam sob `<PublicLayout />`
- Rotas admin ficam sob `<AdminLayout />` e exigem usuário autenticado
- `/login` fica fora dos layouts por ser uma tela específica

## Componentes estruturais

### ErrorBoundary

Arquivo: [ErrorBoundary.tsx](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/src/components/ErrorBoundary.tsx)

- captura erros não tratados na renderização
- exibe uma UI de fallback e permite recarregar

### AdminLayout

Arquivo: [AdminLayout.tsx](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/src/components/AdminLayout.tsx)

- controla navegação do admin
- garante autenticação (se não houver `user`, redireciona para `/login`)

## Estado global (Contexts)

### AuthContext

Arquivo: [AuthContext.tsx](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/src/contexts/AuthContext.tsx)

- expõe:
  - `user` (Firebase User)
  - `loading`
  - `login(email, pass)`
  - `logout()`
- usa `onAuthStateChanged` para manter o estado sincronizado

### CartContext

Arquivo: [CartContext.tsx](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/src/contexts/CartContext.tsx)

- mantém o carrinho em memória (estado do React)
- expõe:
  - `items` (itens com `quantity`)
  - `addItem`, `removeItem`, `updateQuantity`, `clearCart`
  - `totalItems`, `totalPrice`

Observação: no estado atual, o carrinho não persiste entre sessões (não usa localStorage).

## Fluxo de dados (Firestore)

### Leitura reativa (`onSnapshot`)

Padrão principal nas páginas:

- abre um `onSnapshot(...)` na montagem
- atualiza `useState(...)` com os documentos
- faz cleanup no retorno do `useEffect`

Exemplos:

- Home: lê `settings/general` ([Home.tsx](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/src/pages/Home.tsx))
- Menu: lê `categories`, `products` e `settings/general` ([Menu.tsx](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/src/pages/Menu.tsx))
- Admin: categorias e produtos via snapshots ([Categories.tsx](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/src/pages/admin/Categories.tsx), [Products.tsx](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/src/pages/admin/Products.tsx))

### Escrita (CRUD)

Admin usa:

- `addDoc`, `updateDoc`, `deleteDoc` para categorias/produtos
- `setDoc(..., { merge: true })` para configurações

Referência: telas em `src/pages/admin/*`.

## Tratamento de erros

Arquivo: [firestore-errors.ts](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/src/lib/firestore-errors.ts)

- normaliza info (tipo de operação, path e contexto do usuário autenticado)
- registra no console e relança erro

Impacto:

- facilita diagnóstico, mas pode gerar logs extensos no console em produção

## Pontos de extensão (roadmap)

### 1) Pedidos persistidos

Hoje, o “pedido” é apenas uma mensagem de WhatsApp. Evolução típica:

- criar coleção `orders`
- ao finalizar checkout:
  - gravar o pedido no Firestore
  - manter o WhatsApp como canal (link com o número do pedido)
- criar `/admin/orders` para listar e atualizar status

### 2) Autorização escalável

Hoje, admin é definido por emails hardcoded nas regras. Evolução:

- Custom Claims / roles no token
- multi-admin e multi-loja sem editar regras para cada novo email

## Convenções do domínio (types)

Tipos em: [types.ts](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/src/types.ts)

- `Category`, `Product`, `Settings`, `CartItem`
