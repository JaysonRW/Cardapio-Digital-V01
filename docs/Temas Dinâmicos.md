# 🎨 Sistema de Temas Dinâmicos por Nicho (SaaS Restaurantes)

## 🎯 Objetivo

Permitir que cada restaurante personalize rapidamente sua identidade visual com base no nicho, mantendo consistência, qualidade visual e alta conversão.

***

## 🧠 Estratégia

- Base visual: **Light UI (padrão)**
- Dark mode: opcional
- Temas pré-definidos por nicho
- Customização simples via painel admin

***

## 🧩 Estrutura do Sistema

### 1. Tokens Globais (CSS Variables)

```
:root {
  --primary: #FF7A00;
  --secondary: #1F2937;
  --bg: #FFFFFF;
  --surface: #F9FAFB;
  --text: #111827;
  --muted: #6B7280;

  --radius: 12px;
  --shadow: 0 4px 20px rgba(0,0,0,0.05);

  --font-heading: 'Inter', sans-serif;
  --font-body: 'Inter', sans-serif;
}

```

***

### 2. Estrutura de Tema

Cada tema será uma classe:

```
.theme-acai { ... }
.theme-burguer { ... }
.theme-sushi { ... }

```

Aplicação:

```
<body class="theme-acai light">

```

ou

```
<body class="theme-sushi dark">

```

***

## 🎨 Temas por Nicho

***

### 🟣 Açaiteria

```
.theme-acai {
  --primary: #7C3AED;
  --bg: #FFFFFF;
  --surface: #F5F3FF;
  --text: #1F2937;
}

```

**Características:**

- Roxo vibrante
- Visual energético
- Jovem / moderno

***

### ☕ Cafeteria

```
.theme-cafe {
  --primary: #6B4F3B;
  --bg: #FFFDF9;
  --surface: #F5F1EB;
  --text: #2C2C2C;
}

```

**Características:**

- Tons terrosos
- Tipografia elegante
- Sensação acolhedora

***

### 🥟 Pastelaria

```
.theme-pastel {
  --primary: #F59E0B;
  --bg: #FFFFFF;
  --surface: #FFFBEB;
  --text: #1F2937;
}

```

**Características:**

- Amarelo/dourado
- Alegre
- Rápido / informal

***

### 🍔 Hamburgueria

```
.theme-burguer {
  --primary: #EF4444;
  --bg: #FFFFFF;
  --surface: #FEF2F2;
  --text: #111827;
}

```

**Características:**

- Vermelho forte
- Contraste alto
- Apelo visual forte

***

### 🍱 Marmitaria

```
.theme-marmita {
  --primary: #10B981;
  --bg: #FFFFFF;
  --surface: #ECFDF5;
  --text: #064E3B;
}

```

**Características:**

- Verde confiável
- Simples
- Foco em praticidade

***

### 🍽️ Restaurante (genérico)

```
.theme-restaurant {
  --primary: #F97316;
  --bg: #FFFFFF;
  --surface: #FFF7ED;
  --text: #1C1917;
}

```

***

### 🍣 Sushi

```
.theme-sushi {
  --primary: #0F172A;
  --bg: #FFFFFF;
  --surface: #F1F5F9;
  --text: #020617;
}

```

**Extra (Dark recomendado):**

```
.dark.theme-sushi {
  --bg: #020617;
  --surface: #0F172A;
  --text: #F8FAFC;
}

```

***

### 🌱 Vegano

```
.theme-vegan {
  --primary: #22C55E;
  --bg: #FFFFFF;
  --surface: #F0FDF4;
  --text: #14532D;
}

```

***

### 🥩 Churrascaria

```
.theme-churrasco {
  --primary: #7F1D1D;
  --bg: #FFFFFF;
  --surface: #FEF2F2;
  --text: #1C1917;
}

```

***

## ⚙️ Dark Mode (Global)

```
.dark {
  --bg: #0B0B0F;
  --surface: #141419;
  --text: #FFFFFF;
  --muted: #A1A1AA;
}

```

***

## 🧠 Lógica no Frontend

```
const theme = "acai"; // vindo do admin
const mode = "light"; // ou dark

document.body.className = `theme-${theme} ${mode}`;

```

***

## 🎛️ Painel Admin

### Configurações disponíveis:

- 🎨 Escolher nicho (tema)
- 🌗 Light / Dark
- 🌈 Cor primária custom (override)
- 🔤 Tipografia (opcional)
- 🔘 Estilo de botão

***

## 🚀 Diferenciais do Sistema

- Troca instantânea de identidade
- Sem quebrar layout
- Escalável para novos nichos
- Permite branding sem designer

***

## 💡 Sugestões de Nichos Extras

- 🍕 Pizzaria
- 🧁 Doceria
- 🍺 Bar / Pub
- 🥗 Saudável / Fit
- 🍗 Frango frito
- 🥞 Café da manhã / brunch

***

## 🧠 Estratégia Final

O sistema deixa de ser:\
"um site de restaurante"

E passa a ser:\
"uma plataforma de identidade visual adaptável para food service"

Isso aumenta:

- valor percebido
- retenção
- diferenciação no mercado

