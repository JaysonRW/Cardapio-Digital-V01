# Deploy (Vercel + Firebase Hosting)

Este projeto é um SPA (Vite + React). Você pode publicar tanto na **Vercel** quanto no **Firebase Hosting**.

## Pré-requisitos gerais

- Projeto Firebase configurado (Auth + Firestore)
- Regras do Firestore publicadas (ver [firestore.rules](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/firestore.rules))
- Build funcionando localmente:

```bash
npm install
npm run build
```

## Deploy na Vercel (recomendado para SPA)

Arquivo de rewrite já incluído: [vercel.json](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/vercel.json)

### Passos

1) Importe o repositório na Vercel
2) Configure:
   - Framework preset: Vite
   - Build command: `npm run build`
   - Output directory: `dist`
3) Faça deploy

### Sobre rotas do React Router

O `vercel.json` faz rewrite de todas as rotas para `/index.html`, garantindo que:

- `/menu`, `/admin`, `/admin/products` etc. funcionem ao recarregar a página

## Deploy no Firebase Hosting (alternativa)

Quando você precisa consolidar tudo em Firebase (Auth + Firestore + Hosting), pode usar Firebase Hosting.

### Passos (alto nível)

1) Inicializar Firebase (se ainda não existir):
   - selecionar Hosting
   - escolher `dist` como public directory
2) Ajustar rewrite para SPA:
   - rewrite de `**` para `/index.html`
3) Build e deploy:

```bash
npm run build
firebase deploy
```

Observação: este repositório não inclui `firebase.json` de Hosting por padrão. Se você optar por Firebase Hosting, adicione o arquivo e documente o rewrite SPA.

## Ambientes (dev/test/prod)

Recomendação operacional:

- **dev**: projeto Firebase separado (ou um database separado), para testar seed e mudanças no admin
- **prod**: projeto Firebase dedicado

Checklist por ambiente:

- Auth Email/Senha habilitado
- Firestore Rules aplicadas
- `settings/general` preenchido (principalmente `whatsappNumber`)
- contas admin criadas no Firebase Auth

## Checklist de pós-deploy

- Acessar `/` e validar Home
- Acessar `/menu` e validar carregamento do catálogo
- Acessar `/admin` → redireciona para `/login`
- Login do admin funciona e consegue gravar dados (criar categoria/produto)
- Checkout abre WhatsApp (se `whatsappNumber` configurado)
