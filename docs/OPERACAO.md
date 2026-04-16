# Operação (Admin + Pedidos via WhatsApp)

Este guia é voltado para quem **opera** o cardápio (admin/atendimento). Ele cobre:

- como configurar o cardápio e a identidade do restaurante
- como cadastrar categorias e produtos
- como funciona o pedido via WhatsApp (fluxo atual)
- boas práticas para operar sem retrabalho

## Acesso ao painel administrativo

- URL: `/admin`
- Se não estiver logado, o app redireciona para `/login`.

Referência: rotas em [App.tsx](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/src/App.tsx) e proteção em [AdminLayout.tsx](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/src/components/AdminLayout.tsx).

## Primeiro setup (recomendado)

1) Entre em **Configurações**: `/admin/settings`
2) Preencha obrigatoriamente:
   - Número de WhatsApp (com DDI): `55...`
3) Configure também:
   - Nome do restaurante
   - Horário de funcionamento
   - Endereço e telefone
4) (Opcional) Ajuste:
   - SEO (título e descrição)
   - Banner do cardápio e banner promocional
   - Meta Pixel ID e Google Tag ID

As configurações são salvas no documento `settings/general` (Firestore). Referência: [Settings.tsx](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/src/pages/admin/Settings.tsx).

## Categorias

Página: `/admin/categories`

### Campos

- Nome
- Ordem (número)

### Como usar a ordem

- Use `1, 2, 3...` para controlar a sequência no cardápio.
- Evite “pular” muitos números. Quando precisar inserir uma categoria no meio, reajuste as ordens.

Referência: [Categories.tsx](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/src/pages/admin/Categories.tsx).

## Produtos

Página: `/admin/products`

### Campos

- Nome
- Categoria
- Preço
- URL da imagem (opcional, mas recomendado)
- Descrição (opcional)
- Ativo (mostra ou não no cardápio)
- Em promoção (aparece em “Destaques” e recebe selo)

Referência: [Products.tsx](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/src/pages/admin/Products.tsx).

### Boas práticas (cadastro)

- Padronize nomes: “Burger Clássico”, “Batata Rústica”.
- Descrição curta e objetiva: 1–2 linhas com ingredientes principais.
- Imagens:
  - prefira URLs estáveis (CDN, Storage, imagens próprias)
  - garanta que a imagem permite acesso público (sem login)

## Seed (Cardápio de Teste)

Em `/admin/settings` existe o botão **Adicionar Cardápio de Teste**.

O que ele faz:

- cria categorias com IDs fixos (ex.: `cat-hamburgueres`)
- cria produtos com IDs auto-gerados
- grava no Firestore em batch

Referência: função `handleSeedDatabase` em [Settings.tsx](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/src/pages/admin/Settings.tsx).

## Pedido via WhatsApp (fluxo atual)

No cardápio (`/menu`), o usuário:

1) adiciona itens ao carrinho
2) abre o carrinho
3) preenche dados do pedido (nome, tipo, endereço se delivery, pagamento e observações)
4) confirma → abre o WhatsApp com uma mensagem pronta

Referência: `handleWhatsAppOrder` em [Menu.tsx](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/src/pages/Menu.tsx).

### Exemplo de mensagem gerada

O app monta algo nesse formato (exemplo ilustrativo):

```
NUEVO PEDIDO

Cliente: Maria
Tipo: Entrega a domicilio
Dirección: Rua X, 123
Pago: cash

RESUMEN DEL PEDIDO:
▪️ 2x Clássico Smash - R$ 44,00
▪️ 1x Refrigerante Lata - R$ 6,00

Notas: Sem cebola

TOTAL: R$ 50,00
```

### O que acontece depois da confirmação

- o navegador abre um link `https://wa.me/<whatsappNumber>?text=<mensagem>`
- o carrinho é limpo
- o drawer do carrinho é fechado

### Pixel/Tag (opcional)

Se existirem as funções globais no `window`:

- `fbq` → dispara evento `InitiateCheckout`
- `gtag` → dispara evento `begin_checkout`

O app não injeta esses scripts automaticamente; eles precisam estar presentes via integração externa. Referência: [Menu.tsx](file:///c:/Users/jayso/Documents/TRAE/Cardapio-Digital-V01/src/pages/Menu.tsx).

## Recomendações (melhorias para operação)

O fluxo atual funciona bem para MVP, mas tem limitações operacionais:

- não existe “lista de pedidos” no painel
- não há status (novo, em preparo, entregue)
- não há persistência/auditoria (depende do WhatsApp)

Evolução recomendada (roadmap):

1) Persistir pedidos no Firestore (coleção `orders`)
2) Criar tela `/admin/orders` com status e filtro por data
3) Manter o WhatsApp como canal de comunicação, mas com pedido registrado e rastreável

## Checklist diário (operação)

- Conferir “Ativo” dos produtos (evita vender item indisponível)
- Revisar “Promoção” (destaques aparecem no topo)
- Conferir WhatsApp configurado e funcionando
- Validar horário/telefone/endereço em Configurações
