# Fase 4: Qualidade e Infraestrutura

Esta fase foca na robustez técnica, confiabilidade do sistema e automação de processos de desenvolvimento.

## Objetivo
Garantir que novas funcionalidades não quebrem as existentes e que o projeto possa ser escalado com segurança.

---

## 🛡️ Testes Automatizados (Vitest + RTL)

### 1. Testes Unitários
- **Cart Logic**: Garantir que o cálculo de totais, adição e remoção de itens funciona conforme o esperado.
- **Utils**: Validar funções de formatação (moeda, datas).

### 2. Testes de Integração
- **Auth Flow**: Verificar se rotas admin estão protegidas e se o login funciona.
- **Order Flow**: Testar se o fluxo de checkout e gravação de pedido no Firestore é bem-sucedido.

---

## 🛠️ DevOps e CI/CD (GitHub Actions)

### 1. Automação de Build e Lint
- Rodar `npm run lint` e `npm run build` em cada PR ou Push para o `main`.
- Garantir que nenhum código com erros de tipos (TypeScript) seja integrado.

### 2. Automação de Testes
- Rodar toda a suíte de testes unitários e de integração antes do deploy.

---

## 🚀 Infraestrutura e Segurança

### 1. Custom Claims (Firebase Auth)
- Criar script Admin SDK para atribuir claims `{ admin: true }` aos usuários.
- Refatorar `firestore.rules` para usar `request.auth.token.admin == true` em vez de hardcode de emails.

### 2. Monitoramento (Sentry/LogRocket)
- Integrar ferramenta de monitoramento de erros para capturar falhas em tempo real em produção.
- Auxilia na resolução rápida de bugs relatados pelos usuários.

---

## ✅ Critérios de Aceite
- Suíte de testes com cobertura mínima de 60% das funções críticas.
- Pipeline de CI/CD configurada e passando.
- Regras de segurança dinâmicas e baseadas em Claims.
- Sistema de logs e monitoramento ativo.
