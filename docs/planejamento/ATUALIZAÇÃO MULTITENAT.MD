### Análise do Cenário Atual vs. Cenário Multitenant
Onde estamos hoje:

- Banco de Dados (Firestore): As coleções estão na raiz ( /products , /categories , /settings ). Isso significa que todos os dados pertencem a um único dono.
- Rotas: A vitrine pública fica na raiz ( / e /menu ). Não há distinção de qual loja o cliente está acessando.
- Storage: As imagens vão para a pasta raiz /products .
- Autenticação: Quem faz login no /admin gerencia o banco de dados global.
Para onde vamos (A Nova Arquitetura):

- Isolamento de Dados (Subcoleções): Em vez de coleções na raiz, teremos uma coleção principal restaurants . A Açaiteria do Jorginho será o documento restaurants/acaiteria-do-jorginho , e dentro dele teremos as subcoleções /products e /categories . Isso garante isolamento total de dados e segurança (um dono não vê o dado do outro).
- Rotas Dinâmicas (Slugs): O link público passará a ter um identificador (slug). Ex: seusite.com/acaiteria-jorginho e seusite.com/hamburgueria-zezinho .
- Admin Inteligente: Ao fazer login, o sistema identifica quem é o usuário ( ownerUid ), busca qual é o restaurante dele e carrega apenas os dados daquela empresa.
### 📋 Plano de Ação e Fases de Implementação
Para garantir estabilidade (sem quebrar o que já funciona), a migração deve ser feita em 5 fases estruturadas :
 FASE 1: Fundação (Modelagem de Dados e Segurança)
O alicerce do sistema multitenant no Firebase.

- Criar a coleção raiz restaurants com campos como: slug , name , ownerUid , isActive .
- Atualizar o types.ts para refletir o modelo Restaurant e ajustar as interfaces atuais.
- Reescrever o arquivo firestore.rules (Regras de Segurança) para garantir que:
  - Leituras públicas sejam permitidas apenas para restaurantes ativos.
  - Escritas sejam permitidas apenas se o request.auth.uid for igual ao ownerUid do restaurante. FASE 2: Roteamento Público e Tenant Context (Frontend Core)
Preparando o React para entender "em qual restaurante estamos".

- Atualizar o React Router ( App.tsx ) para usar rotas com parâmetros: /:restaurantSlug e /:restaurantSlug/menu .
- Criar um TenantContext (Contexto de Loja): um componente que lê o slug da URL, busca os dados do restaurante no Firebase e distribui para o resto do app. Se o slug não existir, mostra uma página 404 bonita.
- Refatorar os componentes Home e Menu para lerem os produtos baseados no ID do restaurante fornecido pelo TenantContext . FASE 3: Refatoração do Admin e Onboarding
Garantindo que o dono só veja o seu próprio negócio.

- Fluxo de Registro: Criar uma tela onde o novo lojista se cadastra e define o nome e a URL (slug) do seu restaurante (ex: "Açaiteria do Jorginho").
- Admin Context: Ao logar, o sistema busca o documento em restaurants onde o ownerUid é o do usuário logado.
- Atualizar as telas de Products.tsx , Categories.tsx e Settings.tsx para apontar as queries e gravações para a subcoleção correta (ex: doc(db, 'restaurants', tenantId, 'products', productId) ). FASE 4: Storage e Assets Isolados
Evitando colisão de imagens.

- Atualizar o componente ImageUpload.tsx para salvar os arquivos em pastas isoladas por tenant. Ex: restaurants/{tenantId}/products/imagem.jpg .
- Ajustar as regras do storage.rules para refletir essa mesma hierarquia de permissões. FASE 5: Carrinho e Checkout (Isolamento de Pedidos)
Garantindo que pedidos não se misturem.

- Atualizar o CartContext para armazenar itens no localStorage separadamente por loja (ex: cart_acaiteria-do-jorginho ), evitando que o cliente misture um hambúrguer do Zezinho com o açaí do Jorginho no mesmo carrinho.
- Garantir que o link do WhatsApp enviado no checkout puxe o número dinâmico do restaurante atual.