# React / Next.js — Referência Tenant Context

## TenantContext — Provider Global

```typescript
// contexts/TenantContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';

interface TenantContextValue {
  tenantId: string | null;
  tenantSlug: string | null;
  tenantName: string | null;
  plan: string | null;
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextValue>({
  tenantId: null,
  tenantSlug: null,
  tenantName: null,
  plan: null,
  isLoading: true,
});

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<TenantContextValue>({
    tenantId: null,
    tenantSlug: null,
    tenantName: null,
    plan: null,
    isLoading: true,
  });

  useEffect(() => {
    // Buscar tenant do session/token/subdomínio
    async function loadTenant() {
      const session = await getSession(); // next-auth ou cookie próprio
      if (session?.tenantId) {
        setTenant({
          tenantId: session.tenantId,
          tenantSlug: session.tenantSlug,
          tenantName: session.tenantName,
          plan: session.plan,
          isLoading: false,
        });
      } else {
        setTenant(prev => ({ ...prev, isLoading: false }));
      }
    }
    loadTenant();
  }, []);

  return (
    <TenantContext.Provider value={tenant}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => useContext(TenantContext);
```

---

## Hook de Proteção de Rota por Tenant

```typescript
// hooks/useTenantGuard.ts
import { useRouter } from 'next/navigation';
import { useTenant } from '../contexts/TenantContext';

export function useTenantGuard(requiredRole?: string) {
  const { tenantId, isLoading } = useTenant();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !tenantId) {
      router.replace('/login');
    }
  }, [tenantId, isLoading, router]);

  return { isReady: !isLoading && !!tenantId };
}
```

---

## Resolução de Tenant por Subdomínio

```typescript
// app/layout.tsx (App Router)
import { headers } from 'next/headers';

export default async function RootLayout({ children }) {
  const headersList = headers();
  const hostname = headersList.get('host') ?? '';
  const subdomain = hostname.split('.')[0];

  // Buscar org pelo slug/subdomínio
  const org = await db.organizations.findUnique({
    where: { slug: subdomain },
    select: { id: true, name: true, plan: true, settings: true }
  });

  return (
    <html>
      <body>
        <TenantProvider initialTenant={org}>
          {children}
        </TenantProvider>
      </body>
    </html>
  );
}
```

---

## Supabase Client com Tenant Context

```typescript
// lib/supabase-client.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// O tenant_id é injetado via RLS no banco —
// o frontend não precisa filtrar, mas pode para UX otimista

export const supabase = createClientComponentClient();

// Hook tipado para queries com tenant automático via RLS
export function useSupabaseQuery<T>(
  queryFn: (client: typeof supabase) => Promise<{ data: T | null; error: any }>
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    queryFn(supabase).then(({ data, error }) => {
      if (!error) setData(data);
      setIsLoading(false);
    });
  }, []);

  return { data, isLoading };
}
```

---

## Feature Flags por Tenant/Plano

```typescript
// lib/features.ts
const PLAN_FEATURES: Record<string, string[]> = {
  free:       ['projects:read', 'dashboard:basic'],
  starter:    ['projects:read', 'projects:write', 'dashboard:basic', 'reports:basic'],
  pro:        ['projects:read', 'projects:write', 'dashboard:advanced', 'reports:advanced', 'api:access'],
  enterprise: ['*'], // acesso total
};

export function hasFeature(plan: string, feature: string): boolean {
  const features = PLAN_FEATURES[plan] ?? [];
  return features.includes('*') || features.includes(feature);
}

// Componente de guarda
export function FeatureGate({
  feature,
  children,
  fallback = null
}: {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { plan } = useTenant();
  if (!plan || !hasFeature(plan, feature)) return <>{fallback}</>;
  return <>{children}</>;
}

// Uso:
// <FeatureGate feature="reports:advanced" fallback={<UpgradePrompt />}>
//   <AdvancedReportPanel />
// </FeatureGate>
```

---

## Zustand — Store com Tenant

```typescript
// stores/tenantStore.ts
import { create } from 'zustand';

interface TenantStore {
  tenantId: string | null;
  tenantName: string | null;
  plan: string | null;
  setTenant: (tenant: Partial<TenantStore>) => void;
  clearTenant: () => void;
}

export const useTenantStore = create<TenantStore>((set) => ({
  tenantId: null,
  tenantName: null,
  plan: null,
  setTenant: (tenant) => set(tenant),
  clearTenant: () => set({ tenantId: null, tenantName: null, plan: null }),
}));
```