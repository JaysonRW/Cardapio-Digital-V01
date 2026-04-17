# Supabase + PostgreSQL — Referência RLS Multitenant

## Configuração Inicial

### 1. Ativar RLS nas tabelas

```sql
-- Ativar RLS (SEMPRE fazer isso para toda tabela de negócio)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
-- ... repetir para cada tabela
```

### 2. Função helper — tenant_id do usuário logado

```sql
-- Função que extrai o tenant_id do JWT do Supabase
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
  SELECT (auth.jwt() ->> 'tenant_id')::UUID;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

> **Como popular o JWT com tenant_id**: Use um Database Hook no Supabase ou um trigger
> na tabela `auth.users` que adiciona `tenant_id` ao `raw_app_meta_data`.

```sql
-- Trigger para popular app_metadata com tenant_id ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Busca o tenant do usuário (assumindo tabela user_organizations)
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || 
      jsonb_build_object('tenant_id', NEW.tenant_id)
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Políticas RLS — Padrão por Operação

### SELECT — só ver dados do próprio tenant

```sql
CREATE POLICY "tenant_select"
ON projects
FOR SELECT
USING (tenant_id = current_tenant_id());
```

### INSERT — forçar tenant_id correto

```sql
CREATE POLICY "tenant_insert"
ON projects
FOR INSERT
WITH CHECK (tenant_id = current_tenant_id());
```

### UPDATE — só atualizar dados do próprio tenant

```sql
CREATE POLICY "tenant_update"
ON projects
FOR UPDATE
USING (tenant_id = current_tenant_id())
WITH CHECK (tenant_id = current_tenant_id());
```

### DELETE — só deletar dados do próprio tenant

```sql
CREATE POLICY "tenant_delete"
ON projects
FOR DELETE
USING (tenant_id = current_tenant_id());
```

---

## Schema Padrão — Tabelas de Negócio

```sql
-- Exemplo: tabela genérica de negócio
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  status      TEXT DEFAULT 'active',
  data        JSONB DEFAULT '{}',
  created_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Índice composto: tenant_id + campo mais consultado
CREATE INDEX idx_projects_tenant ON projects(tenant_id);
CREATE INDEX idx_projects_tenant_status ON projects(tenant_id, status);

-- RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_all" ON projects
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());
```

---

## Tabela user_organizations (usuário em múltiplos tenants)

```sql
CREATE TABLE user_organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'member', -- owner | admin | member | viewer
  is_active   BOOLEAN DEFAULT true,
  invited_at  TIMESTAMPTZ,
  joined_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tenant_id)
);

ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

-- Usuário só vê suas próprias associações
CREATE POLICY "user_sees_own_orgs" ON user_organizations
  FOR SELECT USING (user_id = auth.uid());
```

---

## Super Admin (acesso cross-tenant)

```sql
-- Role de super admin que bypassa RLS
CREATE POLICY "super_admin_all" ON projects
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_app_meta_data->>'role' = 'super_admin'
    )
  );
```

> ⚠️ **Sempre logar** acessos de super_admin em tabela de auditoria.

---

## Supabase Storage — Isolamento por Tenant

```javascript
// Upload com path isolado por tenant
const { data, error } = await supabase.storage
  .from('uploads')
  .upload(`${tenantId}/${userId}/${filename}`, file);

// Storage Policy (definir no dashboard Supabase)
// "Permitir upload apenas no próprio path de tenant"
```

```sql
-- Policy de storage via SQL
CREATE POLICY "tenant_storage_select"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = current_tenant_id()::TEXT
);

CREATE POLICY "tenant_storage_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = current_tenant_id()::TEXT
);
```

---

## Verificação de Saúde — Queries de Diagnóstico

```sql
-- Tabelas sem RLS ativado
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT IN (
  SELECT tablename FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  WHERE c.relrowsecurity = true
);

-- Tabelas sem coluna tenant_id
SELECT table_name
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
HAVING COUNT(CASE WHEN column_name = 'tenant_id' THEN 1 END) = 0;

-- Policies existentes por tabela
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```