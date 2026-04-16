# Troubleshooting

Este guia lista problemas comuns e como diagnosticar.

## 1) Login não funciona (Email/Senha desabilitado)

Sintoma:

- na tela de login, aparece mensagem indicando que o acesso por email/senha não está habilitado

Causa:

- no Firebase Console, Authentication → Sign-in method, o provedor Email/Password está desativado

Como resolver:

1) Firebase Console → Authentication → Sign-in method
2) habilite **Email/Password**

Referência: tratamento de erro em [Login.tsx](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/src/pages/Login.tsx).

## 2) “client is offline” / Firestore não conecta

Sintoma:

- erro ao iniciar com mensagem similar a “the client is offline”

Possíveis causas:

- configuração do Firebase inválida
- bloqueio de rede/proxy
- extensão de bloqueio (AdBlock/Brave Shields) interferindo

Como diagnosticar:

- abra o console do navegador e verifique o erro logado
- valide o conteúdo de [firebase-applet-config.json](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/firebase-applet-config.json)

Referência: teste de conexão em [firebase.ts](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/src/firebase.ts).

## 3) Admin não consegue salvar (permissão negada)

Sintoma:

- criar/editar categoria/produto/config falha (Permission denied / missing or insufficient permissions)

Causa mais comum:

- usuário autenticado não está na lista de admins definida em regras

Como resolver (modelo atual):

1) confirme o email do usuário no Firebase Auth
2) verifique a lista em `isAdmin()` em [firestore.rules](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/firestore.rules)
3) faça deploy das regras após alteração

## 4) Checkout não abre WhatsApp

Sintoma:

- botão de finalizar pedido não abre WhatsApp

Possíveis causas:

- `settings/general.whatsappNumber` vazio
- bloqueio de pop-up pelo navegador

Como resolver:

1) Em `/admin/settings`, preencha “Número de WhatsApp” com DDI (ex.: `5511999999999`)
2) teste novamente e autorize pop-ups para o domínio do site

Referência: `handleWhatsAppOrder` em [Menu.tsx](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/src/pages/Menu.tsx).

## 5) Mudanças no catálogo não aparecem

Sintoma:

- admin salvou produto/categoria, mas não aparece no `/menu`

Checklist:

- o produto está com `isActive = true`
- o produto está com `categoryId` válido (existente em categories)
- a categoria tem `order` definido (number)

Referências:

- Admin Products: [Products.tsx](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/src/pages/admin/Products.tsx)
- Menu (filtros e renderização): [Menu.tsx](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/src/pages/Menu.tsx)

## 6) Pixel/Google Tag não dispara eventos

Sintoma:

- você esperava ver eventos no Meta/GA, mas nada acontece

Causa:

- o app só chama `window.fbq` e `window.gtag` se eles já existirem
- os scripts não são injetados automaticamente pelo projeto

Como resolver:

- adicione corretamente os scripts do Pixel/GA no ambiente de deploy (via gerenciador de tags ou inserção no HTML)

Referência: disparo condicional no checkout em [Menu.tsx](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/src/pages/Menu.tsx).
