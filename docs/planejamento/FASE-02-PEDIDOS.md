# Fase 2: Gestão de Pedidos e Mídia (Storage)

Esta fase foca na transformação do cardápio digital em um sistema de gerenciamento de pedidos e na facilitação do upload de imagens.

## Objetivo
Criar a coleção `orders` no Firestore e integrar o Firebase Storage para upload direto de imagens no painel administrativo.

---

## 🖼️ Gerenciamento de Mídia (Firebase Storage)

### 1. Upload Direto de Imagens
- **Admin**: Substituir o campo de "URL da Imagem" por um componente de upload no painel de produtos e categorias.
- **Implementação**: Integrar `firebase/storage` para carregar imagens diretamente do navegador.
- **Estrutura de Pastas**:
  - `/products/{productId}`
  - `/categories/{categoryId}`
  - `/banners/{bannerId}`

### 2. Otimização de Imagens
- Implementar compressão no lado do cliente antes do upload para economizar banda e armazenamento.

---

## 📦 Modelo de Dados (Coleção `orders`)

### Esquema do Documento
```typescript
interface Order {
  id: string;
  customer: {
    name: string;
    address: string;
    orderType: 'delivery' | 'pickup';
    paymentMethod: string;
    notes?: string;
  };
  items: CartItem[];
  totalPrice: number;
  totalItems: number;
  status: 'pending' | 'preparing' | 'on_the_way' | 'completed' | 'cancelled';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## 🏗️ Implementação do Fluxo de Pedido

### 1. Gravação no Checkout
- Ao clicar em "Enviar Pedido" no `Menu.tsx`:
  - Validar campos do formulário.
  - Gravar pedido no Firestore (`addDoc` na coleção `orders`).
  - Redirecionar para o WhatsApp (mantendo a URL com os dados do pedido).
  - Limpar carrinho local.

### 2. Painel de Pedidos (Admin)
- Criar nova página `/admin/orders`.
- Listagem reativa (`onSnapshot`) dos pedidos em ordem decrescente de criação.
- Filtros por status (Pendentes, Concluídos, Cancelados).
- Botões de ação rápida para mudar o status (ex: "Marcar como Preparando").

---

## 🛠️ Notificações e UX Admin

### Real-time Alerts
- Som de notificação no navegador ao receber um novo pedido com status `pending`.
- Badge com contagem de pedidos pendentes na navegação lateral do admin.

---

## ✅ Critérios de Aceite
- Pedidos são gravados no Firestore antes de enviar para o WhatsApp.
- O admin consegue visualizar e alterar o status de qualquer pedido.
- O histórico de pedidos persiste e pode ser consultado a qualquer momento.
- Regras de segurança do Firestore (`firestore.rules`) protegem a coleção `orders` (somente admin lê, todos escrevem).
