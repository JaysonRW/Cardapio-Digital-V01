# Firebase (Auth + Firestore)

Este projeto usa Firebase para:

- **Authentication** (login do admin)
- **Firestore** (categorias, produtos e configurações)

Código de inicialização: [firebase.ts](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/src/firebase.ts).

## 1) Configuração do Firebase no front-end

O app inicializa o Firebase com um arquivo JSON:

- [firebase-applet-config.json](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/firebase-applet-config.json)

Esse arquivo contém as chaves de configuração do app e o ID do database do Firestore usado na inicialização. Em apps web Firebase, esses valores normalmente **não são tratados como segredo**, mas ainda assim são sensíveis do ponto de vista de governança (não substituem regras de segurança).

## 2) Modelo de dados (Firestore)

### Coleção: `categories`

Documento (exemplo):

```json
{
  "name": "Hambúrgueres",
  "order": 1
}
```

Uso:

- exibida no cardápio público
- ordenação por `order` (asc)

Referência: [Categories.tsx](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/src/pages/admin/Categories.tsx), [Menu.tsx](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/src/pages/Menu.tsx).

### Coleção: `products`

Documento (exemplo):

```json
{
  "name": "Clássico Smash",
  "description": "Burger 100g, cheddar, picles, maionese da casa.",
  "price": 22,
  "imageUrl": "https://...",
  "categoryId": "cat-hamburgueres",
  "isPromotion": true,
  "isActive": true
}
```

Uso:

- filtragem por `categoryId`
- “destaques” quando `isPromotion` é true
- recomendação de UX: respeitar `isActive` (hoje o cardápio administra isso e o produto inativo aparece esmaecido no admin)

Referência: [Products.tsx](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/src/pages/admin/Products.tsx), [Menu.tsx](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/src/pages/Menu.tsx).

### Coleção: `settings` (documento `general`)

Documento (exemplo):

```json
{
  "whatsappNumber": "5511999999999",
  "restaurantName": "ÀUREA",
  "restaurantHours": "Ter–Dom · 18h às 00h",
  "restaurantAddress": "Rua das Flores, 123 – Curitiba",
  "restaurantPhone": "(41) 99534-3245",
  "seoTitle": "ÀUREA — Cardápio",
  "seoDescription": "Cardápio digital com pedidos via WhatsApp.",
  "promoBannerIsActive": true,
  "promoBannerImageUrl": "https://...",
  "promoBannerLink": "https://wa.me/...",
  "metaPixelId": "123456789012345",
  "googleTagId": "G-XXXXXXXXXX"
}
```

Uso:

- personalização da Home e do Cardápio
- SEO básico (título e meta description)
- banners e links

Referência: [Settings.tsx](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/src/pages/admin/Settings.tsx), [Home.tsx](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/src/pages/Home.tsx), [Menu.tsx](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/src/pages/Menu.tsx).

## 3) Regras de segurança (Firestore Rules)

Arquivo: [firestore.rules](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/firestore.rules)

### Leituras públicas

- `categories`, `products`, `settings` permitem `read: if true;`

Impacto:

- qualquer visitante pode ler o catálogo e configurações de exibição
- evite armazenar informações sensíveis em `settings/general`

### Escritas restritas a admin

O projeto usa a função `isAdmin()` que:

- exige autenticação (`request.auth != null`)
- valida o email contra uma lista fixa

Trecho relevante:

- `request.auth.token.email == "propagoumkd@gmail.com"`
- `request.auth.token.email == "adm01@admin.com"`

### Validação de domínio

Além de restringir quem escreve, as regras validam formato e tamanho de campos para:

- categoria (`name`, `order`)
- produto (`name`, `price`, `categoryId`, `isActive`, etc.)
- settings (`whatsappNumber` obrigatório e limites de tamanho)

## 4) Authentication (Admin)

O app usa Firebase Auth com email/senha.

### Fluxo atual do login

Implementação: [AuthContext.tsx](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/src/contexts/AuthContext.tsx)

- tenta `signInWithEmailAndPassword`
- se o usuário não existir, tenta **criar automaticamente** com `createUserWithEmailAndPassword`

Observações:

- isso facilita o primeiro acesso (MVP), mas pode ser indesejado em produção
- caso o provedor Email/Senha não esteja habilitado no Firebase, o app exibe mensagem específica no login

Tela de login: [Login.tsx](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/src/pages/Login.tsx).

## 5) Recomendações de evolução (segurança e governança)

O modelo atual com emails hardcoded funciona para MVP, mas não escala bem para múltiplos admins/lojas.

Recomendação (ordem sugerida):

1) **Trocar lista fixa por roles**
   - usar Custom Claims (ex.: `role=admin`) e `request.auth.token.role == "admin"`
2) **Separar dados públicos de privados**
   - manter `settings/public` para exibição
   - criar `settings/private` para integrações sensíveis, com leitura restrita
3) **Auditoria**
   - registrar quem alterou produto/categoria (UID e timestamp)

## 6) Como trocar os emails admin (modelo atual)

Enquanto o projeto estiver usando emails hardcoded:

1) Edite a lista dentro de `isAdmin()` em [firestore.rules](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/firestore.rules)
2) Faça deploy das regras

Checklist:

- o usuário precisa existir no Auth do Firebase
- o email precisa ser exatamente igual ao usado na regra
