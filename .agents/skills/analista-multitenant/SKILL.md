---
name: multitenant-saas
description: >
  Guia completo para criar, analisar e migrar plataformas SaaS multitenant (multiempresas).
  Use esta Skill sempre que o usuário mencionar: multitenancy, multi-empresa, isolamento de dados entre clientes,
  Row-Level Security (RLS), tenant_id, migração de single-tenant para SaaS, Supabase com múltiplos clientes,
  Firebase multi-org, schemas compartilhados vs separados, ou qualquer pergunta sobre como separar dados de
  diferentes empresas/organizações em uma mesma base de dados. Também ative para revisões de arquitetura SaaS,
  checklists de segurança de dados por tenant, e geração de políticas RLS prontas.
---

# Multitenant SaaS — Skill de Arquitetura e Migração

Esta Skill apoia três fluxos principais:
1. **Análise** — revisar um projeto existente e mapear o que falta para ser multitenant
2. **Migração** — converter um sistema single-tenant em multitenant com segurança
3. **Boas práticas** — gerar artefatos prontos (RLS, schemas, checklists)

---

## 1. Conceitos Fundamentais

### O que é Multitenancy?
Um único sistema serve múltiplos clientes (tenants/empresas) com **isolamento total de dados** entre eles.
Cada tenant enxerga apenas seus próprios dados — nunca os de outro cliente.

### Modelos de Isolamento (do mais simples ao mais robusto)

| Modelo | Descrição | Quando usar |
|---|---|---|
| **Shared schema + tenant_id** | Uma única tabela, coluna `tenant_id` em tudo | Maioria dos SaaS B2B |
| **Schema por tenant** (PostgreSQL) | `CREATE SCHEMA tenant_abc` | Compliance rígido, dados sensíveis |
| **Banco por tenant** | Instância separada por cliente | Enterprise / dados críticos |
| **Row-Level Security** (Supabase) | Isolamento via policy no banco | Supabase, PostgRES puro |
| **Subcoleções por org** (Firebase) | `/orgs/{orgId}/...` | Firebase / Firestore |

**Regra de ouro**: Para a maioria dos SaaS no Brasil (condominios, HR, e-commerce), o modelo **Shared Schema + RLS** é suficiente, seguro e escalável.

---

## 2. Fluxo de Análise de Projeto Existente

Quando o usuário trouxer um projeto para análise, execute este roteiro:

### 2.1 Diagnóstico — Perguntas Obrigatórias

```
1. Existe uma tabela/coleção de "empresas" ou "organizações"?
2. As tabelas de dados têm coluna tenant_id (ou org_id, company_id)?
3. As queries filtram por tenant_id em TODA a aplicação?
4. A autenticação associa o usuário a um tenant?
5. Existe alguma política de RLS no banco? (Supabase/PostgreSQL)
6. Uploads de arquivos (Storage) são separados por tenant?
7. Relatórios e exports podem vazar dados de outro tenant?
```

### 2.2 Matriz de Risco

| Ponto de Vazamento | Risco | Como corrigir |
|---|---|---|
| Query sem WHERE tenant_id | 🔴 CRÍTICO | Adicionar filtro + RLS policy |
| Storage sem pasta por tenant | 🟠 ALTO | `/tenants/{id}/...` |
| Relatório/export sem filtro | 🟠 ALTO | Injetar tenant_id no contexto |
| Admin vê dados de todos | 🟡 MÉDIO | Criar role super_admin explícita |
| Logs sem tenant_id | 🟢 BAIXO | Adicionar ao contexto de log |

### 2.3 Output Esperado da Análise

Claude deve gerar:
- Lista de tabelas **sem** `tenant_id` que precisam de alteração
- Lista de queries/endpoints com risco de cross-tenant leak
- Prioridade de correção (Crítico → Alto → Médio)
- Script de migração inicial (ver seção 4)

---

## 3. Estratégias de Migração (Single → Multitenant)

### 3.1 Passo a Passo Seguro

```
Fase 1: Estrutura
  ├── Criar tabela `organizations` (ou `tenants`)
  ├── Adicionar coluna tenant_id em todas as tabelas
  ├── Popular tenant_id com o id da organização default
  └── Criar índices: INDEX ON tabela(tenant_id)

Fase 2: Autenticação
  ├── Associar usuários a organizations (tabela user_organizations)
  ├── Adicionar tenant_id no JWT/session token
  └── Middleware que injeta tenant_id em toda request

Fase 3: Isolamento
  ├── Adicionar WHERE tenant_id = :current em todas queries
  ├── Ativar RLS no banco (se Supabase/PostgreSQL)
  └── Testar com 2 tenants reais em staging

Fase 4: Storage & Arquivos
  └── Reorganizar paths: /uploads/{tenant_id}/...

Fase 5: Validação
  ├── Executar checklist de auditoria (ver seção 6)
  └── Pen test básico: logar como Tenant B, tentar acessar dados do Tenant A
```

### 3.2 Tabela `organizations` — Modelo Base

```sql
CREATE TABLE organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,        -- para URLs: /app/acme/...
  plan        TEXT DEFAULT 'free',         -- free | starter | pro | enterprise
  is_active   BOOLEAN DEFAULT true,
  settings    JSONB DEFAULT '{}',          -- configs por tenant
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

Para referências detalhadas de cada stack, leia:
- PostgreSQL/Supabase → `references/supabase-rls.md`
- Firebase/Firestore → `references/firebase-multitenant.md`
- Node.js/API → `references/nodejs-middleware.md`

---

## 4. Geração de Artefatos

### 4.1 Quando gerar schemas SQL
Sempre que o usuário descrever tabelas de negócio, gere o schema com:
- `tenant_id UUID NOT NULL REFERENCES organizations(id)`
- `INDEX ON tabela(tenant_id)`
- RLS policy correspondente

### 4.2 Quando gerar políticas RLS
Para Supabase/PostgreSQL, sempre gerar o par: **SELECT policy + INSERT/UPDATE/DELETE policy**.

### 4.3 Quando gerar checklist
Ao finalizar uma análise ou migração, sempre gerar o checklist da seção 6.

---

## 5. Padrões por Stack

> Leia o arquivo de referência correspondente antes de gerar código:

| Stack | Arquivo |
|---|---|
| Supabase + PostgreSQL + RLS | `references/supabase-rls.md` |
| Firebase / Firestore | `references/firebase-multitenant.md` |
| Node.js / REST / tRPC | `references/nodejs-middleware.md` |
| React / Next.js (frontend) | `references/nextjs-tenant-context.md` |

---

## 6. Checklist de Auditoria Multitenant

Quando solicitado, gere este checklist preenchido com o status do projeto:

```markdown
## Checklist Multitenant — [Nome do Projeto]

### 🗄️ Banco de Dados
- [ ] Tabela `organizations` (ou equivalente) existe
- [ ] Todas as tabelas de negócio têm coluna `tenant_id`
- [ ] Todos os índices incluem `tenant_id`
- [ ] RLS ativado em todas as tabelas (Supabase/PostgreSQL)
- [ ] Policies de SELECT filtram por tenant_id do usuário logado
- [ ] Policies de INSERT forçam tenant_id correto
- [ ] Sem função/procedure que faça SELECT sem filtro de tenant

### 🔐 Autenticação & Autorização
- [ ] JWT/session contém tenant_id do usuário
- [ ] Middleware valida tenant_id em toda request autenticada
- [ ] Troca de tenant (se permitida) gera novo token
- [ ] Role de super_admin documentada e com acesso explícito

### 🌐 API / Backend
- [ ] Nenhuma query sem WHERE tenant_id
- [ ] Endpoints de listagem paginam dentro do tenant
- [ ] Exports (CSV, PDF, Excel) filtrados por tenant
- [ ] Logs incluem tenant_id no contexto

### 📁 Storage / Arquivos
- [ ] Uploads em path separado: /tenants/{tenant_id}/...
- [ ] URLs de arquivo não são acessíveis entre tenants
- [ ] Bucket policies (se S3/Supabase Storage) restringem por tenant

### 🖥️ Frontend
- [ ] TenantContext (React Context ou Zustand) propagado globalmente
- [ ] Tenant resolvido via subdomínio, path ou session
- [ ] Sem hardcode de org_id no frontend

### ✅ Testes
- [ ] Teste automatizado: Tenant B não acessa dados do Tenant A
- [ ] Staging com pelo menos 2 tenants ativos
- [ ] Teste de admin cross-tenant documentado
```

---

## 7. Anti-Patterns Comuns (evitar)

```
❌ Filtrar tenant apenas no frontend (bypassável)
❌ Usar tenant_id como query param na URL sem validação server-side
❌ Compartilhar chaves de API entre tenants
❌ Tabela de configurações sem tenant_id
❌ Seed/fixtures que criam dados sem tenant_id
❌ Migrations que esquecem de adicionar RLS em novas tabelas
❌ Super admin sem log de auditoria
```

---

## Notas para Claude ao usar esta Skill

- **Sempre perguntar o stack** antes de gerar código (Supabase vs Firebase vs genérico)
- **Nunca assumir** que o projeto já tem multitenancy — fazer o diagnóstico da seção 2 primeiro
- **Gerar checklist ao final** de qualquer análise ou migração
- **Priorizar RLS no banco** sobre filtros apenas na aplicação (defesa em profundidade)
- Comunicar em **português brasileiro**