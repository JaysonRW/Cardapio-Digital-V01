# Fase 3: Personalização e UX Avançada

Esta fase foca em dar autonomia ao administrador para controlar a identidade visual do cardápio e refinar a experiência do usuário final.

## Objetivo
Implementar um sistema de temas dinâmicos e melhorar o feedback visual do frontend com animações e skeletons.

---

## 🎨 Personalização de Temas (Prioridade)

### 1. Sistema de Variáveis CSS
- Injetar cores primárias, secundárias e neutras via variáveis CSS no `:root` do documento.
- Permitir que o admin escolha cores via um seletor de cores (color picker) no painel de configurações.

### 2. Configurações Dinâmicas (Admin)
- Novo campo em `settings/general` para armazenar o esquema de cores:
  ```json
  "theme": {
    "primary": "#F97316",
    "secondary": "#0B0B0F",
    "accent": "#FFFFFF",
    "borderRadius": "12px"
  }
  ```
- **Preview em Tempo Real**: Mostrar como o cardápio ficará conforme o admin altera as cores.

---

## ✨ Feedback Visual (Frontend)

### 1. Skeleton Screens
- Substituir o spinner central por skeletons de produtos e categorias para um carregamento "suave".
- Melhora a percepção de performance (LCP).

### 2. Animações com Framer Motion
- Transições suaves entre páginas e estados (ex: item entrando no carrinho).
- Efeitos de hover refinados nos cards de produtos.

---

## ✅ Critérios de Aceite
- O administrador consegue alterar as cores do cardápio sem editar código.
- As mudanças de tema refletem instantaneamente em todos os clientes.
- O carregamento inicial do cardápio parece instantâneo graças aos skeletons.
- O site é visualmente mais moderno com animações sutis.

