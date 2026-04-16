# Fase 1: Fundação e Refatoração

Esta fase foca na limpeza técnica e na criação de uma estrutura escalável para o projeto.

## Objetivo
Refatorar componentes grandes e isolar a lógica do Firebase para facilitar a manutenção e a adição de novas funcionalidades.

---

## 🏗️ Estrutura de Componentes

### 1. Refatoração do `Menu.tsx`
- **MenuHeader**: Logo, nome do restaurante, horários e status (aberto/fechado).
- **CategoryNav**: Navegação horizontal por categorias.
- **SearchBar**: Input de busca reativo.
- **ProductList**: Grid de produtos filtrados por categoria ou busca.
- **ProductCard**: Cartão individual com imagem, preço e botão de adicionar.
- **CartDrawer**: Modal lateral do carrinho com itens e checkout.
- **CheckoutForm**: Formulário de dados do cliente (Nome, Endereço, Pagamento).

### 2. Isolar Lógica (Hooks)
- `useMenuData`: Retorna `categories`, `products` e `settings` via snapshots.
- `useOrderFormatting`: Lógica de criação de mensagem do WhatsApp.
- `useCartPersistence`: Sincronização explícita entre estado e localStorage (já iniciado em `CartContext`).

---

## 🛠️ Validação e Formulários

### Implementar `react-hook-form` + `zod`
- **Checkout**: Validar campos obrigatórios e formato do endereço/nome.
- **Admin**: Validar campos de produtos (preço >= 0, nome obrigatório) e categorias.

---

## 📚 Documentação
- **Atualizar `docs/ARQUITETURA.md`**: Corrigir a informação sobre persistência do carrinho.
- **Criar `docs/CONVENCOES.md`**: Definir padrões de nomeação e estilos de codificação para novos desenvolvedores.

---

## ✅ Critérios de Aceite
- Arquivos de componentes não excedem 300 linhas.
- Nenhuma lógica de negócio ou de dados está diretamente em `Menu.tsx`.
- Todos os formulários têm feedback visual de erro.
- A experiência do usuário final permanece idêntica ou superior à atual.
