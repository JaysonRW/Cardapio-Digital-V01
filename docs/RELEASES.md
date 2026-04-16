# Releases (Plano de evolução focado no cliente final)

Este documento consolida o roadmap de melhorias com foco em **usabilidade**, **design** e **otimização da jornada de compra** do cliente final, mantendo o fluxo de operação simples para o admin.

## Release 1 — Conversão e Confiança (MVP Premium)

### 1) Padronização de idioma e microcopy (PT-BR)

**Title:** Linguagem consistente (PT-BR) e microcopy de conversão  
**Description:** Unificar toda a experiência do cliente final (Home, Menu, Carrinho, Checkout) em PT-BR, com textos claros, orientados à ação e sem ambiguidade (ex.: entrega/retirada, pagamento).  
**Acceptance Criteria:**
- 100% dos textos visíveis ao cliente final em PT-BR (labels, placeholders, CTAs, mensagens e estados).
- Estados padronizados: carregando, vazio, erro e sucesso, com orientação do próximo passo.
- Termos locais: “Entrega”, “Retirada”, “Dinheiro”, “Cartão”, “Pix”.
**Priority:** P0

### 2) Checkout “sem erro” (validação + UX de confirmação)

**Title:** Checkout com validação inteligente e menos atrito  
**Description:** Melhorar o formulário do checkout para reduzir abandono: validação, CTA condicional, confirmação e fallback quando pop-up/WhatsApp falhar.  
**Acceptance Criteria:**
- CTA “Enviar pedido no WhatsApp” habilita apenas com dados válidos.
- Endereço obrigatório apenas quando “Entrega” estiver selecionado.
- Exibe resumo final do pedido antes de abrir o WhatsApp.
- Se pop-up for bloqueado, exibe fallback “Tentar novamente” com instrução.
**Priority:** P0

### 3) Persistência do carrinho (não perder pedido)

**Title:** Carrinho persistente (localStorage)  
**Description:** Persistir itens e quantidades do carrinho no dispositivo do cliente para evitar perda do pedido por refresh/fechar aba.  
**Acceptance Criteria:**
- Carrinho se mantém após refresh e reabertura do navegador.
- “Limpar carrinho” com confirmação.
- Persistência não inclui dados pessoais (somente itens/quantidades/IDs).
**Priority:** P0

### 4) Performance percebida (imagens e carregamento)

**Title:** Otimização de imagens e carregamento “premium”  
**Description:** Melhorar performance percebida no catálogo (principalmente mobile) com lazy-loading, placeholders e redução de layout shift.  
**Acceptance Criteria:**
- Imagens com lazy-loading e placeholder/skeleton.
- Redução visível de “pulos” de layout durante carregamento.
- Lista de produtos rola fluida com catálogos maiores.
**Priority:** P0

### 5) Descoberta rápida (filtros + zero results)

**Title:** Filtros e ordenação para encontrar itens mais rápido  
**Description:** Complementar busca com filtros simples e UX de “nenhum resultado”.  
**Acceptance Criteria:**
- Filtros rápidos: “Promoções” e “Disponíveis”.
- Zero results com sugestão e botão “limpar busca”.
- Definição aplicada para produto inativo no público: ocultar ou exibir como “indisponível” (decisão única e consistente).
**Priority:** P1

### 6) Blocos de confiança no cardápio

**Title:** Informações do restaurante sempre visíveis  
**Description:** Aumentar confiança e reduzir dúvidas exibindo horário/endereço/contato e CTA de WhatsApp em pontos-chave do Menu e Checkout.  
**Acceptance Criteria:**
- Menu mostra informações essenciais (horário/endereço) em layout compacto e responsivo.
- Checkout inclui CTA “Falar no WhatsApp” para dúvidas.
- Conteúdo é configurável via `settings/general`.
**Priority:** P1

### 7) Pedidos persistidos (MVP) + Admin Orders

**Title:** Orders no Firestore + `/admin/orders` (MVP)  
**Description:** Manter WhatsApp como canal, mas registrar o pedido para rastreabilidade, suporte e melhoria do atendimento.  
**Acceptance Criteria:**
- Ao finalizar checkout, cria documento `orders` com itens, total, tipo (entrega/retirada), observações e timestamp.
- Mensagem do WhatsApp inclui identificador do pedido (ex.: `#A1B2`).
- Admin lista pedidos com status: Novo/Em preparo/Pronto/Entregue/Cancelado e filtro por data.
**Priority:** P1

### Métricas de sucesso (Release 1)

- Aumento de “início de checkout” e “pedido enviado” por sessão.
- Redução de abandono no checkout (clientes que abriram carrinho e não enviaram).
- Redução de reclamações “perdi meu carrinho” / “WhatsApp não abriu”.
- Melhoria de performance percebida (tempo até conteúdo útil e estabilidade visual).

## Release 2 — Crescimento, Retenção e Observabilidade

### 1) SEO e compartilhamento (OpenGraph)

**Title:** SEO básico + preview ao compartilhar link  
**Description:** Melhorar aquisição e compartilhamento do cardápio com OG/Twitter Cards e metatags consistentes.  
**Acceptance Criteria:**
- `title` e `meta description` consistentes em Home e Menu.
- OpenGraph/Twitter com título/descrição/imagem configuráveis.
- Compartilhar `/menu` gera preview correto nos principais apps.
**Priority:** P1

### 2) Acessibilidade e UX mobile avançada

**Title:** A11y + UX mobile-first  
**Description:** Refinar usabilidade em mobile e acessibilidade (foco, teclado, áreas de toque, contraste, modais).  
**Acceptance Criteria:**
- Foco visível e navegação por teclado consistente.
- ESC fecha drawer/modal e não quebra rolagem.
- CTAs críticos com área mínima e bom contraste.
**Priority:** P1

### 3) PWA (instalação e retorno rápido)

**Title:** PWA (Add to Home Screen)  
**Description:** Tornar o app instalável para recorrência e abertura rápida em retornos.  
**Acceptance Criteria:**
- Manifest e ícones prontos; app instalável em mobile.
- Cache de assets para abertura rápida.
- Catálogo continua atualizando corretamente (sem cache incorreto de dados).
**Priority:** P2

### 4) Métricas de funil (eventos padronizados)

**Title:** Funil de eventos do cardápio (view_item → add_to_cart → begin_checkout → order_sent)  
**Description:** Instrumentar eventos para otimização contínua, sem coletar dados pessoais no payload.  
**Acceptance Criteria:**
- Eventos padronizados emitidos nos pontos-chave.
- Compatível com Pixel/GA quando scripts existirem.
- Controle para ativar/desativar tracking e respeitar consentimento quando aplicável.
**Priority:** P2

### 5) Upload de imagens (melhor UX no admin e qualidade no catálogo)

**Title:** Upload/gerenciamento de imagens de produto (Storage)  
**Description:** Substituir o campo “URL da imagem” por upload com preview e validações, reduzindo erro operacional e elevando qualidade visual do cardápio.  
**Acceptance Criteria:**
- Upload salva URL final no produto e exibe preview.
- Validações de tamanho/formato com mensagens claras.
- Permite salvar produto sem imagem (fallback).
**Priority:** P2

### Métricas de sucesso (Release 2)

- Aumento de tráfego via compartilhamento (com preview correto).
- Aumento de recorrência (usuários retornando / instalação PWA).
- Melhoria contínua via métricas do funil (identificar gargalos).

## Dependências e decisões (para não travar entrega)

- **Orders (Release 1):** definir schema `orders` e política de escrita/leitura (público com validação rigorosa vs backend intermediário).
- **SEO/OG (Release 2):** decidir estratégia de metatags em SPA (injeção via runtime vs build).
- **Upload (Release 2):** habilitar Firebase Storage e revisar regras de acesso.

## Notas de produto (guidelines de UX)

- Priorizar “menos passos até enviar no WhatsApp”.
- Evitar campos desnecessários no checkout.
- Manter o CTA principal sempre visível em mobile (sem competir com múltiplos botões).
