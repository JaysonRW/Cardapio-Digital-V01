# Node.js / API REST / tRPC — Referência Multitenant

## Middleware de Tenant — Express / Fastify

### Express

```typescript
// middleware/tenant.ts
import { Request, Response, NextFunction } from 'express';
import { db } from '../lib/db';

declare global {
  namespace Express {
    interface Request {
      tenantId: string;
      tenantRole: string;
    }
  }
}

export async function tenantMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = req.user; // populado pelo middleware de auth

  if (!user?.tenantId) {
    return res.status(401).json({ error: 'Tenant não identificado' });
  }

  // Validar se o tenant está ativo
  const tenant = await db.organizations.findUnique({
    where: { id: user.tenantId, is_active: true },
    select: { id: true, plan: true }
  });

  if (!tenant) {
    return res.status(403).json({ error: 'Organização inativa ou não encontrada' });
  }

  req.tenantId = user.tenantId;
  req.tenantRole = user.role;
  next();
}
```

### Uso nos controllers

```typescript
// Sempre injetar tenantId nas queries — NUNCA confiar no body/params
router.get('/projects', tenantMiddleware, async (req, res) => {
  const projects = await db.projects.findMany({
    where: {
      tenant_id: req.tenantId,  // ← OBRIGATÓRIO
      // ...outros filtros
    }
  });
  res.json(projects);
});
```

---

## tRPC — Context com Tenant

```typescript
// server/context.ts
import { inferAsyncReturnType } from '@trpc/server';
import { CreateNextContextOptions } from '@trpc/server/adapters/next';
import { verifyToken } from './auth';

export async function createContext({ req }: CreateNextContextOptions) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) return { user: null, tenantId: null };

  const payload = verifyToken(token);
  
  return {
    user: payload,
    tenantId: payload?.tenantId ?? null,
    tenantRole: payload?.role ?? null,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
```

```typescript
// server/trpc.ts
import { initTRPC, TRPCError } from '@trpc/server';
import { Context } from './context';

const t = initTRPC.context<Context>().create();

// Middleware de proteção de tenant
const requireTenant = t.middleware(({ ctx, next }) => {
  if (!ctx.tenantId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Tenant não autenticado' });
  }
  return next({
    ctx: {
      ...ctx,
      tenantId: ctx.tenantId, // now non-null
    },
  });
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const tenantProcedure = t.procedure.use(requireTenant);
```

```typescript
// routers/projects.ts
export const projectsRouter = router({
  list: tenantProcedure
    .input(z.object({ status: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return db.projects.findMany({
        where: {
          tenant_id: ctx.tenantId,  // ← sempre injetado pelo context
          ...(input.status ? { status: input.status } : {})
        }
      });
    }),

  create: tenantProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return db.projects.create({
        data: {
          ...input,
          tenant_id: ctx.tenantId,  // ← nunca vem do cliente
        }
      });
    }),
});
```

---

## Prisma — Schema Multitenant

```prisma
// schema.prisma

model Organization {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  plan      String   @default("free")
  isActive  Boolean  @default(true)
  settings  Json     @default("{}")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users     UserOrganization[]
  projects  Project[]
  // ... outras relações
}

model UserOrganization {
  id         String       @id @default(cuid())
  userId     String
  tenantId   String
  role       String       @default("member")
  isActive   Boolean      @default(true)
  joinedAt   DateTime     @default(now())

  user       User         @relation(fields: [userId], references: [id])
  tenant     Organization @relation(fields: [tenantId], references: [id])

  @@unique([userId, tenantId])
  @@index([tenantId])
}

model Project {
  id        String   @id @default(cuid())
  tenantId  String                         // ← OBRIGATÓRIO em toda tabela
  name      String
  status    String   @default("active")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant    Organization @relation(fields: [tenantId], references: [id])

  @@index([tenantId])                      // ← OBRIGATÓRIO em toda tabela
  @@index([tenantId, status])
}
```

---

## JWT com Tenant Claims

```typescript
// lib/jwt.ts
import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  tenantId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  plan: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
  } catch {
    return null;
  }
}
```

---

## Tenant por Subdomínio (Next.js / Node)

```typescript
// middleware.ts (Next.js)
import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const hostname = req.headers.get('host') ?? '';
  const subdomain = hostname.split('.')[0];

  // Ignorar www e app principal
  if (['www', 'app', 'localhost'].includes(subdomain)) {
    return NextResponse.next();
  }

  // Reescrever URL para incluir o slug do tenant
  const url = req.nextUrl.clone();
  url.pathname = `/tenant/${subdomain}${url.pathname}`;
  return NextResponse.rewrite(url);
}
```

---

## Auditoria Cross-Tenant (Log de Super Admin)

```typescript
// lib/audit.ts
export async function logAdminAccess(params: {
  adminId: string;
  targetTenantId: string;
  action: string;
  resource: string;
}) {
  await db.adminAuditLog.create({
    data: {
      ...params,
      ipAddress: getCurrentIP(),
      timestamp: new Date(),
    }
  });
}
```