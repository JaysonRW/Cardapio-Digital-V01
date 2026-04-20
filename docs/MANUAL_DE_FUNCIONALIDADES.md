# Visão Geral e Funcionalidades do Sistema (Cardápio Digital)

Este documento centraliza todas as funcionalidades, telas e recursos disponíveis no sistema, divididos entre a **Visão do Cliente** (o cardápio público) e a **Visão do Lojista** (o painel administrativo).

---

## 1. Visão do Cliente (O Cardápio Público)
A interface que o cliente final acessa através do link exclusivo do restaurante (ex: `seusite.com/nome-da-loja`).

### 📱 Tela Inicial e Navegação
* **Cabeçalho da Loja:** Exibe o logotipo, nome do restaurante, horário de funcionamento e endereço (com link direto para o Google Maps).
* **Status de Operação:** Um selo visual indicando claramente se a loja está "ABERTA" ou "FECHADA".
* **Tempo de Espera:** Mostra a estimativa de tempo para Entrega e/ou Retirada no local.
* **Barra de Busca:** Permite ao cliente pesquisar produtos rapidamente por nome ou ingredientes.
* **Menu de Categorias Fixo:** Uma barra de navegação no topo que acompanha a rolagem da tela, permitindo pular rapidamente para seções específicas (ex: Lanches, Bebidas, Sobremesas) com ícones intuitivos.

### 🍔 Exibição de Produtos
* **Banners Promocionais:** Espaço para um banner de destaque no topo do cardápio (opcional).
* **Carrossel de Destaques:** Uma seção horizontal que destaca produtos marcados como "Promoção", exibindo foto, nome e preço.
* **Lista de Produtos:** Produtos organizados por categoria. Cada item exibe:
  * Foto do produto.
  * Nome e descrição detalhada.
  * Preço atual.
  * Se estiver em promoção, exibe o preço antigo riscado e um selo de "PROMO".

### 🛒 Carrinho e Finalização de Pedido (Checkout)
* **Botão Flutuante do Carrinho:** Fica sempre visível na parte inferior da tela, mostrando a quantidade de itens e o valor total do pedido.
* **Gerenciamento do Carrinho:** O cliente pode revisar os itens, aumentar ou diminuir quantidades, e esvaziar o carrinho.
* **Motor de Adicionais e Up-selling:** Antes do formulário final, uma etapa intermediária exibe sugestões inteligentes (ex: "Bacon extra?", "Bebidas?", "Sobremesas?") de itens que ainda não estão no carrinho para aumentar o ticket médio da venda.
* **Recuperação de Carrinho Abandonado:** Caso o cliente adicione itens e fique inativo na página (ou feche e retorne após 15 minutos), o sistema dispara um modal sutil lembrando-o de concluir o pedido, recuperando vendas perdidas por distração.
* **Cupons de Desconto:** Campo para aplicar códigos promocionais (ex: `PRIMEIRACOMPRA`) com validação em tempo real de valor mínimo e data de expiração.
* **Sistema de Cashback:** Se o lojista ativar, o cliente visualiza seu saldo acumulado de compras anteriores (vinculado ao WhatsApp) e pode optar por usar o crédito como desconto no pedido atual.
* **Formulário de Pedido (Checkout):**
  * **Dados do Cliente:** Nome completo.
  * **Tipo de Pedido:** Escolha entre "Entrega" ou "Retirada".
  * **Endereço:** Solicitado apenas se a opção for "Entrega".
  * **Pagamento:** Seleção da forma de pagamento (Dinheiro, Cartão na maquininha, Pix/Transferência).
  * **Observações:** Campo livre para remover ingredientes, pedir troco, etc.
* **Proteção de Loja Fechada:** Se o cliente tentar prosseguir com o carrinho enquanto a loja estiver fechada, um aviso amigável ("Loja fechada no momento") será exibido, informando o horário de funcionamento e bloqueando o envio do pedido.
* **Envio via WhatsApp:** Ao finalizar, o pedido é salvo no sistema da loja e o cliente é redirecionado para o WhatsApp do restaurante com uma mensagem formatada contendo o resumo completo do pedido.

---

## 2. Visão do Lojista (Painel Administrativo)
O centro de controle onde o dono do restaurante gerencia toda a sua operação de forma privada e segura.

### 🚀 Onboarding (Primeiro Acesso)
* **Criação da Loja:** Tela para definir o nome do restaurante e escolher o "slug" (o link personalizado, ex: `meuburger`).

### 📊 Dashboard Inicial (Visão Geral)
A primeira tela ao entrar no painel, focada nos números do dia atual.
* **Métricas Principais (Cards):**
  * **Pedidos Hoje:** Quantidade de pedidos recebidos no dia atual.
  * **Faturamento Hoje:** Valor total vendido no dia atual em R$.
  * **Ticket Médio:** Valor médio gasto por cliente no dia.
  * **Total de Pedidos:** Número total de pedidos em todo o histórico.
* **Pedidos Recentes:** Uma lista rápida mostrando os últimos 5 pedidos recebidos, com nome do cliente, horário, quantidade de itens, valor e status atual.
* **Mais Vendidos (Ranking):** Um top 5 dos produtos que mais saíram, mostrando o nome, quantidade de vezes que foi pedido e a receita gerada por ele.
* **Dica do Dia:** Espaço para dicas de vendas e gestão (ex: dicas sobre qualidade de fotos).

### 📋 Painel de Pedidos
Tela dedicada exclusivamente ao gerenciamento da operação em tempo real.
* **Filtros e Buscas:**
  * Barra de pesquisa para encontrar pedidos pelo nome do cliente ou código do pedido.
  * Filtro por status (Todos, Pendentes, Preparando, A caminho, Concluídos, Cancelados).
* **Card de Pedido Detalhado:** Cada pedido recebido exibe:
  * Nome do cliente, horário exato da compra e tipo (Entrega ou Retirada).
  * Lista completa dos itens com quantidades e valores.
  * Endereço de entrega (se aplicável) e forma de pagamento escolhida.
  * Observações deixadas pelo cliente (em destaque).
  * Resumo Financeiro (Subtotal, Cupom, Cashback utilizado, Cashback gerado, Total a pagar).
* **Gestão de Status:** Um botão para avançar o status do pedido (ex: mover de "Pendente" para "Preparando", e depois para "A caminho").

### 🏷️ Gestão de Categorias
* Criação, edição e exclusão de categorias (ex: Entradas, Pratos Principais, Bebidas).
* Controle de ordem: Define qual categoria aparece primeiro no cardápio do cliente.

### 🎫 Gestão de Cupons
* Criação de códigos de desconto personalizados.
* **Configurações de Cupom:**
  * Tipo de desconto: Porcentagem (%) ou Valor Fixo (R$).
  * Pedido mínimo para ativação.
  * Data de expiração automática.
  * Botão Ativar/Desativar cupom instantaneamente.

### 🍔 Gestão de Produtos
* Cadastro completo de itens do cardápio.
* **Informações do Produto:** Nome, descrição, preço, foto (upload de imagem) e categoria a qual pertence.
* **Ações Rápidas:**
  * Ligar/Desligar produto (pausar a venda caso acabe o estoque, sem precisar deletar).
  * Marcar como "Promoção" (para dar destaque visual no cardápio público).
  * Marcar como "Sugestão no Carrinho (Up-sell)" (para que o produto seja oferecido automaticamente como complemento antes do cliente finalizar a compra).

### 👥 Clientes & Fidelidade
* **Base de Clientes:** Listagem em tempo real de todos os clientes que já realizaram pedidos na loja (rastreados de forma inteligente via WhatsApp).
* **Busca Rápida:** Filtro dinâmico para encontrar clientes pelo Nome ou número de WhatsApp.
* **Métricas Individuais:** O sistema rastreia e atualiza automaticamente o "Total de Pedidos" e o "Valor Total Gasto" de cada cliente com base em seu histórico, preparando o terreno para ações de CRM e recompensas no Programa de Fidelidade.

### ⚙️ Configurações da Loja
Onde o lojista personaliza a cara do seu negócio e suas regras de operação.
* **Perfil do Restaurante:** Nome, Logotipo, Horário de Funcionamento, Endereço completo e Telefone.
* **Operação:**
  * **Botão Loja Aberta/Fechada:** Um interruptor mestre que liga ou desliga o recebimento de novos pedidos.
  * Tempos estimados de Entrega e Retirada.
  * Número do WhatsApp (para onde os pedidos serão enviados).
* **Fidelidade & Cashback:**
  * Ativar/Desativar motor de Cashback.
  * Definir % de cashback por compra.
  * O sistema calcula e credita o saldo automaticamente para o cliente usar na próxima compra.
* **Personalização Visual:**
  * Temas e cores (ajuste da cor principal do cardápio para combinar com a marca).
  * Imagem e textos de capa (Banner principal).
  * Configuração de um banner promocional extra (com opção de link externo).
* **Marketing e SEO:**
  * Campos para inserir Pixel do Facebook e Google Analytics.
  * Título e descrição de SEO (como a loja aparece nas buscas do Google e ao compartilhar o link no WhatsApp).
* **Links de Redes Sociais:** Inserção de links para Instagram e Facebook.
