# Firebase / Firestore — Referência Multitenant

## Modelo de Dados Recomendado

### Estrutura de Coleções por Organização

```
/organizations/{orgId}
  ├── name: "Acme Corp"
  ├── plan: "pro"
  ├── settings: {...}
  └── /members/{userId}
        ├── role: "admin" | "member" | "viewer"
        └── joinedAt: Timestamp

/organizations/{orgId}/projects/{projectId}
  ├── name: "Projeto Alpha"
  ├── status: "active"
  └── createdBy: userId

/organizations/{orgId}/invoices/{invoiceId}
  ├── amount: 1500.00
  └── dueDate: Timestamp
```

> **Princípio**: Todos os dados de negócio ficam dentro de `/organizations/{orgId}/...`
> Isso garante que as Security Rules possam isolar por organização facilmente.

---

## Firestore Security Rules — Padrão Multitenant

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ─── Funções Helper ────────────────────────────────────────────

    // Verifica se o usuário é membro da organização
    function isMember(orgId) {
      return exists(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid));
    }

    // Verifica a role do usuário na organização
    function hasRole(orgId, role) {
      return get(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid)).data.role == role;
    }

    // Verifica se é admin ou owner
    function isAdmin(orgId) {
      let memberData = get(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid)).data;
      return memberData.role in ['admin', 'owner'];
    }

    // ─── Organização ───────────────────────────────────────────────

    match /organizations/{orgId} {
      // Qualquer membro pode ler dados da própria org
      allow read: if isMember(orgId);

      // Só owner/admin pode atualizar configurações
      allow update: if isAdmin(orgId);

      // Criação de nova org: apenas usuário autenticado
      allow create: if request.auth != null;

      // Nunca deletar via client SDK (use Cloud Function)
      allow delete: if false;

      // ─── Membros ─────────────────────────────────────────────────

      match /members/{userId} {
        // Membros veem outros membros da mesma org
        allow read: if isMember(orgId);

        // Só admin/owner gerencia membros
        allow write: if isAdmin(orgId);

        // Usuário pode atualizar seu próprio perfil (não a role)
        allow update: if request.auth.uid == userId
          && !('role' in request.resource.data.diff(resource.data).affectedKeys());
      }

      // ─── Dados de Negócio (exemplo: projects) ────────────────────

      match /projects/{projectId} {
        allow read: if isMember(orgId);
        allow create: if isMember(orgId) && request.resource.data.createdBy == request.auth.uid;
        allow update: if isMember(orgId);
        allow delete: if isAdmin(orgId);
      }

      // ─── Regra genérica para subcoleções ─────────────────────────
      // Aplica a qualquer subcoleção dentro da org
      match /{collection}/{docId} {
        allow read: if isMember(orgId);
        allow write: if isAdmin(orgId);
      }
    }

    // ─── Perfis de Usuário ─────────────────────────────────────────

    match /users/{userId} {
      // Usuário lê/atualiza apenas o próprio perfil
      allow read, update: if request.auth.uid == userId;
      allow create: if request.auth != null;
      allow delete: if false;
    }
  }
}
```

---

## Schema NoSQL — Documento de Organização

```typescript
// types/organization.ts
interface Organization {
  id: string;                    // Firestore document ID
  name: string;
  slug: string;                  // URL-friendly: "acme-corp"
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  isActive: boolean;
  settings: {
    locale: string;              // "pt-BR"
    timezone: string;            // "America/Sao_Paulo"
    features: string[];          // feature flags por tenant
  };
  billing: {
    email: string;
    cnpj?: string;               // campo brasileiro
    address?: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Membro da organização (subcoleção)
interface OrgMember {
  userId: string;
  displayName: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  isActive: boolean;
  invitedBy?: string;
  joinedAt: Timestamp;
}
```

---

## Resolução de Tenant no Frontend (React)

```typescript
// hooks/useCurrentOrg.ts
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc } from 'firebase/firestore';

export function useCurrentOrg() {
  const [user] = useAuthState(auth);
  const [org, setOrg] = useState<Organization | null>(null);

  useEffect(() => {
    if (!user) return;

    // Opção 1: orgId no custom claim do token
    user.getIdTokenResult().then(tokenResult => {
      const orgId = tokenResult.claims.orgId as string;
      if (orgId) fetchOrg(orgId);
    });

    // Opção 2: orgId no documento do usuário
    // getDoc(doc(db, 'users', user.uid)).then(snap => {
    //   const orgId = snap.data()?.currentOrgId;
    //   if (orgId) fetchOrg(orgId);
    // });
  }, [user]);

  return org;
}
```

---

## Custom Claims — Injetar orgId no Token

```javascript
// Cloud Function: ao criar usuário ou ao fazer login
const admin = require('firebase-admin');

async function setTenantClaim(userId, orgId) {
  await admin.auth().setCustomUserClaims(userId, {
    orgId: orgId,
    role: 'member'  // role global (não confundir com role na org)
  });
}

// Trigger: quando membro é adicionado à organização
exports.onMemberAdded = functions.firestore
  .document('organizations/{orgId}/members/{userId}')
  .onCreate(async (snap, context) => {
    const { orgId, userId } = context.params;
    const { role } = snap.data();
    await setTenantClaim(userId, orgId);
  });
```

---

## Firebase Storage — Isolamento por Org

```javascript
// Upload isolado por organização
const storageRef = ref(storage, `organizations/${orgId}/uploads/${filename}`);
await uploadBytes(storageRef, file);
```

```javascript
// Storage Security Rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Função helper: verifica membro da org via Firestore
    function isMember(orgId) {
      return firestore.exists(/databases/(default)/documents/organizations/$(orgId)/members/$(request.auth.uid));
    }

    match /organizations/{orgId}/{allPaths=**} {
      allow read: if isMember(orgId);
      allow write: if isMember(orgId) && request.resource.size < 10 * 1024 * 1024; // max 10MB
    }
  }
}
```

---

## Migração Firestore: Flat → Multitenant

```javascript
// Script de migração: mover documentos para subcoleção da org
const admin = require('firebase-admin');
const db = admin.firestore();

async function migrateToMultitenant(defaultOrgId) {
  const batch = db.batch();
  
  // Ler coleção flat antiga
  const oldProjects = await db.collection('projects').get();
  
  oldProjects.docs.forEach(doc => {
    const data = doc.data();
    
    // Novo path: dentro da organização
    const newRef = db
      .collection('organizations')
      .doc(data.orgId || defaultOrgId)  // usar orgId existente ou default
      .collection('projects')
      .doc(doc.id);
    
    batch.set(newRef, {
      ...data,
      migratedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Opcional: deletar o antigo após validar
    // batch.delete(doc.ref);
  });
  
  await batch.commit();
  console.log(`Migrados ${oldProjects.size} documentos`);
}
```