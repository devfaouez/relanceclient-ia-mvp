# Plan de Développement MVP - RelanceClient IA

**Version** : 1.0  
**Date** : 26/04/2026  
**Status** : Prêt pour développement Codex  

---

## 1. Objectif du MVP

Développer une application web SaaS permettant aux artisans du bâtiment de :
1. **Saisir leurs prospects** en moins de 30 secondes (nom, email, montant devis)
2. **Suivre leurs devis** via un tableau de bord simple avec statuts clairs
3. **Générer des relances email** à partir de 3 templates professionnels
4. **Valider chaque email avant envoi** - principe fondamental : aucune relance ne part sans accord explicite de l'artisan

**Critère de succès MVP** : Un artisan peut créer un prospect, générer une relance personnalisée et l'envoyer en moins de 2 minutes.

**Exclusions assumées** : Pas d'IA générative, pas d'SMS, pas d'intégrations externes, pas de multi-utilisateur, pas de paiement en V1 (essai gratuit uniquement).

---

## 2. Stack recommandée

| Couche | Technologie | Justification |
|--------|-------------|---------------|
| **Framework** | Next.js 14 (App Router) | Full-stack, SSR, hébergement Vercel simple |
| **Langage** | TypeScript | Typage fort, moins d'erreurs en production |
| **Styling** | Tailwind CSS | Rapidité, design system cohérent |
| **UI Components** | shadcn/ui | Composants accessibles, personnalisables |
| **Base de données** | PostgreSQL (Supabase) | Gratuit jusqu'à 500k req/jour, auth intégrée |
| **ORM** | Prisma | Type-safe, migrations automatisées |
| **Auth** | Supabase Auth | JWT natif, Row Level Security (RLS) |
| **Email** | Resend | 3000 emails/mois gratuits, excellente délivrabilité |
| **Hébergement** | Vercel | Déploiement automatique, CDN global |
| **Validation** | Zod | Schémas stricts API + formulaires |

**Alternatives acceptables** :
- Au lieu de Resend : SendGrid, Mailgun, AWS SES
- Au lieu de Supabase : Neon PostgreSQL + Auth.js
- Au lieu de shadcn/ui : Headless UI + Tailwind personnalisé

---

## 3. Architecture des dossiers

```
relanceclient-ia/
├── app/
│   ├── (auth)/                    # Groupe routes auth (pas de layout dashboard)
│   │   ├── layout.tsx             # Layout minimal auth
│   │   ├── login/page.tsx         # Page connexion
│   │   └── register/page.tsx      # Page inscription
│   │
│   ├── (dashboard)/               # Groupe routes protégées
│   │   ├── layout.tsx             # Layout avec sidebar/nav
│   │   ├── dashboard/page.tsx     # Tableau de bord principal
│   │   ├── prospects/
│   │   │   ├── page.tsx           # Liste des prospects
│   │   │   ├── new/page.tsx       # Formulaire création
│   │   │   └── [id]/
│   │   │       ├── page.tsx       # Détail prospect
│   │   │       └── edit/page.tsx  # Édition prospect
│   │   ├── reminders/
│   │   │   ├── page.tsx           # Historique des relances
│   │   │   └── new/page.tsx       # Créer une relance (sélection template)
│   │   └── settings/
│   │       └── page.tsx           # Profil + config email
│   │
│   ├── api/                       # Routes API (App Router)
│   │   ├── auth/
│   │   │   └── callback/route.ts  # Callback OAuth (si besoin)
│   │   ├── prospects/
│   │   │   ├── route.ts           # GET (liste), POST (créer)
│   │   │   └── [id]/
│   │   │       ├── route.ts       # GET, PATCH, DELETE
│   │   │       └── reminders/
│   │   │           └── route.ts   # GET (relances du prospect)
│   │   ├── reminders/
│   │   │   ├── route.ts           # GET (toutes les relances)
│   │   │   ├── generate/route.ts  # POST (générer une relance)
│   │   │   └── send/route.ts      # POST (envoyer la relance validée)
│   │   ├── templates/
│   │   │   └── route.ts           # GET (templates), PATCH (modifier)
│   │   └── dashboard/
│   │       ├── stats/route.ts     # GET (stats globales)
│   │       └── actions/route.ts   # GET (actions prioritaires)
│   │
│   ├── globals.css                # Styles globaux + Tailwind
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Landing page (redirection si auth)
│
├── components/
│   ├── ui/                        # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── table.tsx
│   │   ├── dialog.tsx
│   │   ├── select.tsx
│   │   ├── textarea.tsx
│   │   ├── badge.tsx
│   │   └── alert.tsx
│   │
│   ├── auth/                      # Composants auth
│   │   ├── login-form.tsx
│   │   ├── register-form.tsx
│   │   └── auth-guard.tsx
│   │
│   ├── prospects/                 # Composants prospects
│   │   ├── prospect-list.tsx
│   │   ├── prospect-form.tsx
│   │   ├── prospect-card.tsx
│   │   ├── status-badge.tsx
│   │   └── prospect-detail.tsx
│   │
│   ├── reminders/                 # Composants relances
│   │   ├── reminder-form.tsx
│   │   ├── reminder-preview.tsx
│   │   ├── template-selector.tsx
│   │   └── reminder-history.tsx
│   │
│   └── dashboard/                 # Composants dashboard
│       ├── stat-card.tsx
│       ├── action-list.tsx
│       └── recent-activity.tsx
│
├── lib/
│   ├── supabase/                  # Client Supabase
│   │   ├── client.ts              # Client browser
│   │   ├── server.ts              # Client server
│   │   └── middleware.ts          # Middleware auth
│   │
│   ├── prisma.ts                  # Client Prisma (singleton)
│   ├── resend.ts                  # Client Resend
│   ├── utils.ts                   # Utilities (cn, formatDate, etc.)
│   ├── validations.ts             # Schémas Zod
│   └── constants.ts               # Constantes (statuts, templates)
│
├── prisma/
│   └── schema.prisma              # Schéma base de données
│
├── types/
│   └── index.ts                   # Types TypeScript globaux
│
├── hooks/
│   ├── use-auth.ts                # Hook authentification
│   ├── use-prospects.ts           # Hook CRUD prospects
│   └── use-reminders.ts           # Hook relances
│
├── public/
│   └── (assets statiques)
│
├── .env.local                     # Variables d'environnement
├── .env.example                   # Template variables
├── next.config.js                 # Config Next.js
├── tailwind.config.ts             # Config Tailwind
├── tsconfig.json                  # Config TypeScript
└── package.json
```

---

## 4. Modèle de données MVP

### Schéma Prisma complet

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Utilisateur (géré par Supabase Auth, mais on stocke les métadonnées)
model User {
  id                String    @id @default(uuid())
  email             String    @unique
  companyName       String?
  firstName         String?
  lastName          String?
  phone             String?
  emailSignature    String?   @default("Cordialement,")
  resendApiKey      String?   // Clé API Resend (chiffrée idéalement)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // Relations
  prospects         Prospect[]
  reminders         Reminder[]
  templates         EmailTemplate[]
  
  @@map("users")
}

// Prospect (client potentiel)
model Prospect {
  id                String          @id @default(uuid())
  userId            String
  name              String          // Nom du prospect
  email             String          // Email du prospect
  phone             String?         // Téléphone optionnel
  projectDescription String?        // Description du projet
  quoteAmount       Decimal?        @db.Decimal(10, 2) // Montant du devis
  quoteDate         DateTime        @default(now())    // Date du devis
  
  // Statut du prospect
  status            ProspectStatus  @default(TO_CONTACT)
  
  // Notes libres
  notes             String?
  
  // Dates de suivi
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  lastContactDate   DateTime?       // Dernière relance envoyée
  nextReminderDate  DateTime?       // Prochaine relance prévue
  
  // Relations
  user              User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  reminders         Reminder[]
  
  @@index([userId])
  @@index([status])
  @@index([nextReminderDate])
  @@map("prospects")
}

enum ProspectStatus {
  TO_CONTACT       // À relancer
  CONTACTED        // Relancé
  NEGOTIATING      // En négociation
  WON              // Gagné (devis accepté)
  LOST             // Perdu
  ARCHIVED         // Archivé
}

// Relance envoyée
model Reminder {
  id                String          @id @default(uuid())
  prospectId        String
  userId            String
  templateUsed      TemplateType    @default(CUSTOM)
  subject           String          // Objet de l'email
  body              String          @db.Text // Corps de l'email
  sentAt            DateTime        @default(now())
  status            ReminderStatus  @default(SENT)
  
  // Relations
  prospect          Prospect        @relation(fields: [prospectId], references: [id], onDelete: Cascade)
  user              User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([prospectId])
  @@index([sentAt])
  @@map("reminders")
}

enum TemplateType {
  DAY_3            // Template 3 jours
  DAY_7            // Template 7 jours
  DAY_14           // Template 14 jours
  CUSTOM           // Template personnalisé
}

enum ReminderStatus {
  DRAFT            // Brouillon (non utilisé en MVP mais pour futur)
  SENT             // Envoyé
  FAILED           // Échec d'envoi
}

// Templates d'emails
model EmailTemplate {
  id                String          @id @default(uuid())
  userId            String?         // Null = template système
  name              String          // Nom du template
  subject           String          // Objet avec variables
  body              String          @db.Text // Corps avec variables
  delayDays         Int             // Délai en jours (3, 7, 14)
  isDefault         Boolean         @default(false) // Template système
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  
  // Relations
  user              User?           @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@map("email_templates")
}
```

### Variables utilisables dans les templates

| Variable | Description | Exemple |
|----------|-------------|---------|
| `{{client_name}}` | Nom du prospect | Martin Dupont |
| `{{quote_amount}}` | Montant du devis | 3 500 € |
| `{{quote_date}}` | Date du devis | 15/04/2024 |
| `{{company_name}}` | Nom entreprise artisan | Dupont Plomberie |
| `{{first_name}}` | Prénom artisan | Jean |
| `{{phone}}` | Téléphone artisan | 06 12 34 56 78 |

---

## 5. Pages frontend à créer

| Page | Chemin | Priorité | Description |
|------|--------|----------|-------------|
| **Login** | `/login` | P0 | Formulaire connexion email/mdp |
| **Register** | `/register` | P0 | Formulaire inscription |
| **Dashboard** | `/dashboard` | P0 | Vue d'ensemble + actions du jour |
| **Prospects List** | `/prospects` | P0 | Tableau des prospects avec filtres |
| **New Prospect** | `/prospects/new` | P0 | Formulaire création prospect |
| **Prospect Detail** | `/prospects/[id]` | P0 | Fiche complète + historique |
| **Edit Prospect** | `/prospects/[id]/edit` | P1 | Modification prospect |
| **New Reminder** | `/reminders/new?prospectId=` | P0 | Création relance (sélection template) |
| **Reminders History** | `/reminders` | P1 | Historique des relances envoyées |
| **Settings** | `/settings` | P1 | Profil + configuration email |

### Détail des pages critiques (P0)

#### Dashboard `/dashboard`
- 4 cards statistiques (prospects en cours, CA potentiel, taux conversion, à relancer)
- Liste "Actions du jour" (max 5 items)
- Tableau prospects récents (5 derniers)
- Bouton "+ Nouveau prospect" flottant

#### Prospects List `/prospects`
- Tableau avec colonnes : Nom, Email, Montant, Date, Statut, Actions
- Filtres par statut (boutons/tabs)
- Recherche par nom/email
- Pagination (10 items/page)
- Tri par date/montant

#### New Prospect `/prospects/new`
- Champs : Nom*, Email*, Téléphone, Montant, Date devis, Notes
- Validation temps réel
- Datepicker pour la date
- Redirection vers dashboard après création

#### New Reminder `/reminders/new`
- Query param : `prospectId` (obligatoire)
- Sélection template (3 boutons : 3j, 7j, 14j)
- Prévisualisation du message généré
- Éditeur textarea pour modifications
- Bouton "Valider et envoyer" (avec confirmation modal)

---

## 6. Routes API à créer

| Route | Méthode | Auth | Description |
|-------|---------|------|-------------|
| `/api/prospects` | GET | Oui | Liste prospects (filtres: status, search) |
| `/api/prospects` | POST | Oui | Créer un prospect |
| `/api/prospects/[id]` | GET | Oui | Détails prospect |
| `/api/prospects/[id]` | PATCH | Oui | Modifier prospect |
| `/api/prospects/[id]` | DELETE | Oui | Supprimer prospect |
| `/api/prospects/[id]/status` | PATCH | Oui | Changer statut rapidement |
| `/api/reminders` | GET | Oui | Liste relances (pagination) |
| `/api/reminders/generate` | POST | Oui | Générer prévisualisation relance |
| `/api/reminders/send` | POST | Oui | **Envoyer l'email** (validation obligatoire) |
| `/api/templates` | GET | Oui | Liste templates (système + utilisateur) |
| `/api/templates/[id]` | PATCH | Oui | Modifier template utilisateur |
| `/api/dashboard/stats` | GET | Oui | Stats pour le dashboard |
| `/api/dashboard/actions` | GET | Oui | Actions prioritaires du jour |

### Schémas Zod pour les API

```typescript
// validations.ts
import { z } from 'zod';

export const ProspectSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().optional(),
  quoteAmount: z.number().min(0).optional(),
  quoteDate: z.date().optional(),
  status: z.enum(['TO_CONTACT', 'CONTACTED', 'NEGOTIATING', 'WON', 'LOST', 'ARCHIVED']),
  notes: z.string().optional(),
});

export const ReminderGenerateSchema = z.object({
  prospectId: z.string().uuid(),
  templateType: z.enum(['DAY_3', 'DAY_7', 'DAY_14', 'CUSTOM']),
  customSubject: z.string().optional(),
  customBody: z.string().optional(),
});

export const ReminderSendSchema = z.object({
  prospectId: z.string().uuid(),
  subject: z.string().min(1, 'L\'objet est requis'),
  body: z.string().min(1, 'Le message est requis'),
});

export const UpdateStatusSchema = z.object({
  status: z.enum(['TO_CONTACT', 'CONTACTED', 'NEGOTIATING', 'WON', 'LOST', 'ARCHIVED']),
});
```

---

## 7. Services backend à créer

### 7.1 Email Service (`lib/email-service.ts`)

```typescript
interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  fromName: string;
  fromEmail: string;
  resendApiKey: string;
}

export async function sendReminderEmail(params: SendEmailParams): Promise<{ success: boolean; error?: string }>;

export function generateReminderContent(
  templateType: 'DAY_3' | 'DAY_7' | 'DAY_14',
  prospect: Prospect,
  user: User
): { subject: string; body: string };

export function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>
): string;
```

### 7.2 Template Service (`lib/template-service.ts`)

```typescript
export const DEFAULT_TEMPLATES = {
  DAY_3: {
    subject: "Votre devis {{company_name}} - Est-ce que vous avez des questions ?",
    body: `Bonjour {{client_name}},\n\nJ'espère que vous avez bien reçu mon devis du {{quote_date}}.\n\nJe me permets de vous recontacter pour savoir si vous avez des questions ou besoin de précisions sur le montant de {{quote_amount}}€.\n\nJe reste disponible par téléphone ou email.\n\nCordialement,\n{{first_name}}`
  },
  DAY_7: {
    subject: "{{company_name}} - Puis-je compter sur vous pour ce chantier ?",
    body: `Bonjour {{client_name}},\n\nSuite à mon devis du {{quote_date}}, je me permets de vous relancer.\n\nAvez-vous pu étudier ma proposition à hauteur de {{quote_amount}}€ ?\n\nMon planning se remplit rapidement, je souhaitais savoir si vous souhaitez avancer sur ce projet.\n\nÀ votre disposition pour en discuter.\n\nCordialement,\n{{first_name}}`
  },
  DAY_14: {
    subject: "Derniers créneaux disponibles - {{company_name}}",
    body: `Bonjour {{client_name}},\n\nJe me permets une dernière relance concernant le devis du {{quote_date}} ({{quote_amount}}€).\n\nSi vous n'êtes plus intéressé, pas de souci, je comprends tout à fait. Pouvez-vous juste me le confirmer afin que je libère mon planning ?\n\nSi c'est toujours d'actualité, il me reste quelques créneaux ce mois-ci.\n\nBien à vous,\n{{first_name}}`
  }
};

export async function getOrCreateTemplates(userId: string): Promise<EmailTemplate[]>;
export async function updateTemplate(templateId: string, data: Partial<EmailTemplate>): Promise<EmailTemplate>;
```

### 7.3 Dashboard Service (`lib/dashboard-service.ts`)

```typescript
interface DashboardStats {
  totalProspects: number;
  prospectsByStatus: Record<ProspectStatus, number>;
  potentialRevenue: number;
  conversionRate: number;
  toRemindToday: number;
}

export async function getDashboardStats(userId: string): Promise<DashboardStats>;

export async function getTodayActions(userId: string): Promise<Prospect[]>;

export async function getRecentProspects(userId: string, limit: number): Promise<Prospect[]>;
```

### 7.4 Prospect Service (`lib/prospect-service.ts`)

```typescript
export async function createProspect(userId: string, data: CreateProspectInput): Promise<Prospect>;

export async function updateProspect(prospectId: string, data: UpdateProspectInput): Promise<Prospect>;

export async function updateProspectStatus(prospectId: string, status: ProspectStatus): Promise<Prospect>;

export async function deleteProspect(prospectId: string): Promise<void>;

export async function listProspects(
  userId: string,
  filters: { status?: ProspectStatus; search?: string }
): Promise<Prospect[]>;
```

---

## 8. Authentification et rôles

### Configuration Supabase Auth

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createClient = () => {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value; },
        set(name, value, options) { cookieStore.set({ name, value, ...options }); },
        remove(name, options) { cookieStore.set({ name, value: '', ...options }); },
      },
    }
  );
};
```

### Middleware de protection

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return request.cookies.get(name)?.value; },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options });
          res.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          request.cookies.set({ name, value: '', ...options });
          res.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  
  // Redirection si non authentifié sur routes protégées
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Redirection si authentifié sur login/register
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### Rôles MVP

| Rôle | Permissions | Accès |
|------|-------------|-------|
| **USER** (artisan) | CRUD ses prospects, envoyer relances, modifier son profil | Routes dashboard |
| **ADMIN** (support) | Lecture seule pour support, pas de modif données | Panel admin (V2) |

**Note MVP** : Pas de gestion fine des permissions. Un utilisateur ne voit que ses propres données grâce au RLS Supabase.

---

## 9. Gestion des emails de relance

### Flow d'envoi (VALIDATION OBLIGATOIRE)

```
┌─────────────────────────────────────────────────────────────────────┐
│  1. Artisan sélectionne un prospect et clique "Générer relance"    │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  2. API /api/reminders/generate                                     │
│     - Récupère template selon délai (3j, 7j, 14j)                  │
│     - Remplace variables par données prospect/artisan              │
│     - Retourne { subject, body } générés                           │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  3. Frontend affiche PRÉVISUALISATION exacte                        │
│     - Expéditeur, objet, corps du message                          │
│     - Éditeur permet modifications si besoin                       │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  4. Artisan relit et clique "Valider et envoyer"                   │
│     ⚠️  MODAL DE CONFIRMATION : "Confirmez-vous l'envoi ?"         │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  5. API /api/reminders/send                                         │
│     - Validation Zod des champs                                     │
│     - Vérification rate limiting (max 50/h)                         │
│     - Appel API Resend avec clé utilisateur                        │
│     - Stockage en base (reminder créé)                             │
│     - Mise à jour prospect (status, lastContactDate)               │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  6. Confirmation à l'artisan + redirection dashboard                │
└─────────────────────────────────────────────────────────────────────┘
```

### Implémentation API Send

```typescript
// app/api/reminders/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { sendReminderEmail } from '@/lib/email-service';
import { ReminderSendSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const validated = ReminderSendSchema.parse(body);

    // Récupérer prospect et user
    const prospect = await prisma.prospect.findFirst({
      where: { id: validated.prospectId, userId: user.id },
    });

    if (!prospect) {
      return NextResponse.json({ error: 'Prospect non trouvé' }, { status: 404 });
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!userData?.resendApiKey) {
      return NextResponse.json(
        { error: 'Clé API email non configurée' }, 
        { status: 400 }
      );
    }

    // Envoyer l'email
    const result = await sendReminderEmail({
      to: prospect.email,
      subject: validated.subject,
      body: validated.body,
      fromName: userData.companyName || userData.firstName || 'Artisan',
      fromEmail: userData.email,
      resendApiKey: userData.resendApiKey,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Échec envoi email', details: result.error },
        { status: 500 }
      );
    }

    // Créer l'enregistrement de relance
    const reminder = await prisma.reminder.create({
      data: {
        prospectId: prospect.id,
        userId: user.id,
        subject: validated.subject,
        body: validated.body,
        status: 'SENT',
      },
    });

    // Mettre à jour le prospect
    await prisma.prospect.update({
      where: { id: prospect.id },
      data: {
        status: 'CONTACTED',
        lastContactDate: new Date(),
      },
    });

    return NextResponse.json({ success: true, reminder });
  } catch (error) {
    console.error('Erreur envoi relance:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
```

### Rate Limiting (Protection spam)

```typescript
// lib/rate-limit.ts
import { LRUCache } from 'lru-cache';

const rateLimitCache = new LRUCache<string, number>({
  max: 1000,
  ttl: 1000 * 60 * 60, // 1 heure
});

export function checkRateLimit(userId: string, maxRequests: number = 50): boolean {
  const current = rateLimitCache.get(userId) || 0;
  if (current >= maxRequests) return false;
  rateLimitCache.set(userId, current + 1);
  return true;
}
```

---

## 10. Sécurité minimale

### Checklist sécurité MVP

| Item | Implémentation | Priorité |
|------|----------------|----------|
| **Authentification** | Supabase Auth avec JWT | P0 |
| **Autorisation** | Row Level Security (RLS) PostgreSQL | P0 |
| **Validation entrées** | Zod sur toutes les API | P0 |
| **Injection SQL** | Prisma ORM (requêtes paramétrées) | P0 |
| **XSS** | React escaping automatique + CSP headers | P0 |
| **CSRF** | SameSite cookies + tokens si nécessaire | P1 |
| **Rate Limiting** | 50 emails/heure, 100 API/min | P0 |
| **Secrets** | Variables d'environnement uniquement | P0 |
| **HTTPS** | Forcé en production (Vercel) | P0 |
| **Headers sécurité** | HSTS, X-Frame-Options, CSP | P1 |

### RLS Policies Supabase

```sql
-- Users : un utilisateur ne voit que son propre profil
CREATE POLICY "Users can only access their own data"
ON users FOR ALL
USING (auth.uid() = id);

-- Prospects : un utilisateur ne voit que ses prospects
CREATE POLICY "Prospects are user-isolated"
ON prospects FOR ALL
USING (auth.uid() = user_id);

-- Reminders : un utilisateur ne voit que ses relances
CREATE POLICY "Reminders are user-isolated"
ON reminders FOR ALL
USING (auth.uid() = user_id);
```

### CSP Headers (next.config.js)

```javascript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://*.supabase.co https://api.resend.com;",
          },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

---

## 11. Variables d'environnement

### Fichier `.env.local` (production)

```bash
# =====================================================
# SUPABASE (Auth + Database)
# =====================================================
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# =====================================================
# DATABASE (Prisma)
# =====================================================
DATABASE_URL=postgresql://postgres:[password]@db.votre-projet.supabase.co:5432/postgres

# =====================================================
# EMAIL (Resend)
# =====================================================
# Clé par défaut pour les tests (optionnel si chaque user a sa clé)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx

# =====================================================
# APP
# =====================================================
NEXT_PUBLIC_APP_URL=https://relanceclient-ia.vercel.app
NODE_ENV=production
```

### Fichier `.env.example` (template)

```bash
# Copier ce fichier en .env.local et remplir les valeurs

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

DATABASE_URL=

RESEND_API_KEY=

NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Variables par environnement

| Variable | Dev | Staging | Prod |
|----------|-----|---------|------|
| `NEXT_PUBLIC_APP_URL` | localhost:3000 | staging.vercel.app | relanceclient-ia.com |
| `NODE_ENV` | development | production | production |
| `RESEND_API_KEY` | Clé test | Clé test | Clé production |

---

## 12. Backlog détaillé

### User Stories décomposées

| ID | User Story | Priorité | Estimation | Dépendances |
|----|------------|----------|------------|-------------|
| US-001 | En tant qu'artisan, je veux créer un compte avec email/mdp | P0 | 2h | - |
| US-002 | En tant qu'artisan, je veux me connecter à mon compte | P0 | 1h | US-001 |
| US-003 | En tant qu'artisan, je veux réinitialiser mon mot de passe | P1 | 2h | US-001 |
| US-004 | En tant qu'artisan, je veux créer un prospect rapidement | P0 | 3h | US-002 |
| US-005 | En tant qu'artisan, je veux voir la liste de mes prospects | P0 | 3h | US-004 |
| US-006 | En tant qu'artisan, je veux filtrer mes prospects par statut | P0 | 2h | US-005 |
| US-007 | En tant qu'artisan, je veux modifier un prospect | P1 | 2h | US-005 |
| US-008 | En tant qu'artisan, je veux supprimer un prospect | P1 | 1h | US-005 |
| US-009 | En tant qu'artisan, je veux changer le statut d'un prospect | P0 | 2h | US-005 |
| US-010 | En tant qu'artisan, je veux générer une relance depuis un template | P0 | 4h | US-005 |
| US-011 | En tant qu'artisan, je veux prévisualiser l'email avant envoi | P0 | 3h | US-010 |
| US-012 | En tant qu'artisan, je veux modifier le message avant envoi | P0 | 2h | US-011 |
| US-013 | En tant qu'artisan, je veux valider et envoyer la relance | P0 | 3h | US-011 |
| US-014 | En tant qu'artisan, je veux voir l'historique des relances envoyées | P1 | 2h | US-013 |
| US-015 | En tant qu'artisan, je veux voir mon tableau de bord avec stats | P0 | 4h | US-005, US-013 |
| US-016 | En tant qu'artisan, je veux voir mes actions prioritaires du jour | P0 | 3h | US-015 |
| US-017 | En tant qu'artisan, je veux configurer ma signature email | P1 | 2h | US-002 |
| US-018 | En tant qu'artisan, je veux configurer ma clé API Resend | P0 | 2h | US-013 |
| US-019 | En tant qu'artisan, je veux personnaliser les templates | P2 | 4h | US-010 |
| US-020 | En tant qu'artisan, je veux accéder à l'application sur mobile | P1 | 3h | Toutes |

### Bugs connus à anticiper

| ID | Description | Mitigation |
|----|-------------|------------|
| BUG-001 | Emails qui partent en spam | Config DNS DKIM/SPF, warm-up progressif |
| BUG-002 | Rate limit Resend atteint | File d'attente côté client, retry automatique |
| BUG-003 | Déconnexion inattendue | Refresh token, reconnexion silencieuse |
| BUG-004 | Perte de données formulaire | Autosave localStorage |
| BUG-005 | Temps de chargement long | Pagination, index DB, requêtes optimisées |

---

## 13. Ordre de développement

### Phase 1 : Fondations (Jours 1-3)

```
Jour 1 - Setup projet
├── Initialiser Next.js 14 + TypeScript + Tailwind
├── Installer shadcn/ui (button, input, card, table, dialog, select, textarea, badge)
├── Configurer Prisma + Supabase
├── Créer schema.prisma
├── Setup authentification Supabase
└── Créer structure dossiers

Jour 2 - Auth
├── Page /login
├── Page /register
├── Middleware de protection
├── Layout auth minimal
└── Layout dashboard avec navigation

Jour 3 - Prospects (CRUD API)
├── API GET /api/prospects
├── API POST /api/prospects
├── API PATCH /api/prospects/[id]
├── API DELETE /api/prospects/[id]
└── Tests API avec curl/Postman
```

### Phase 2 : Prospects Frontend (Jours 4-5)

```
Jour 4 - Liste Prospects
├── Page /prospects (tableau)
├── Composant ProspectList
├── Composant StatusBadge
├── Filtres par statut
└── Pagination

Jour 5 - Création/Édition Prospects
├── Page /prospects/new
├── Composant ProspectForm
├── Validation Zod
├── Redirection après création
└── Page détail prospect /prospects/[id]
```

### Phase 3 : Templates & Relances (Jours 6-8)

```
Jour 6 - Templates
├── Migration templates par défaut
├── API /api/templates
├── Service template-service.ts
└── Templates seed (3 templates)

Jour 7 - Génération Relances
├── API POST /api/reminders/generate
├── Service email-service.ts (generateReminderContent)
├── Page /reminders/new
├── Composant TemplateSelector
└── Prévisualisation basique

Jour 8 - Envoi Relances
├── Intégration Resend SDK
├── API POST /api/reminders/send
├── Modal confirmation envoi
├── Rate limiting
└── Stockage historique relances
```

### Phase 4 : Dashboard & Polish (Jours 9-10)

```
Jour 9 - Dashboard
├── API /api/dashboard/stats
├── API /api/dashboard/actions
├── Page /dashboard
├── Composant StatCard
├── Composant ActionList
└── RecentActivity

Jour 10 - Settings & Polish
├── Page /settings (profil + config email)
├── Responsive mobile
├── Messages d'erreur utilisateur
├── Loading states
└── Tests manuels parcours complet
```

### Phase 5 : Tests & Sécurité (Jours 11-14)

```
Jour 11-12 - Tests
├── Tests E2E parcours critique
├── Tests validation formulaires
├── Tests emails (Mail-tester)
└── Correction bugs

Jour 13-14 - Sécurité & RGPD
├── Audit headers sécurité
├── Vérification RLS policies
├── Page mentions légales
├── Page CGU basiques
└── Checklist RGPD
```

---

## 14. Plan de livraison 7 jours

### Objectif J7 : Version Alpha testable

**Fonctionnalités livrées :**
- Authentification complète (login/register)
- CRUD prospects fonctionnel
- Génération et envoi de relances (avec validation manuelle)
- 3 templates par défaut
- Tableau de bord basique (stats simples)

**Non livré en J7 :**
- Personnalisation des templates
- Historique des relances
- Configuration email utilisateur (clé Resend hardcodée en dev)
- Responsive mobile optimisé
- Tests automatisés

**Livrables J7 :**
```
✅ URL déployée sur Vercel (preview)
✅ Compte test : demo@relanceclient.fr / demo123
✅ 3 prospects fictifs pré-créés
✅ Documentation setup locale (README)
```

**Critères validation J7 :**
- [ ] Créer un prospect en < 30 secondes
- [ ] Générer une relance et l'envoyer en < 2 minutes
- [ ] Voir les stats à jour sur le dashboard
- [ ] Aucune erreur console
- [ ] Page chargement < 3s sur 4G

---

## 15. Plan de livraison 14 jours

### Objectif J14 : Version Beta prête pour testeurs

**Fonctionnalités livrées (en plus de J7) :**
- Personnalisation des templates
- Historique complet des relances
- Configuration clé API Resend par utilisateur
- Responsive mobile
- Page settings (profil utilisateur)
- Tests E2E parcours critiques
- Sécurité renforcée (headers, rate limiting)
- Mentions légales + CGU

**Non livré en J14 :**
- Paiement/Stripe (essai gratuit uniquement)
- Import CSV
- Notifications email
- Analytics avancés

**Livrables J14 :**
```
✅ Production déployée sur domaine définitif
✅ 10 comptes beta testers créés
✅ Documentation utilisateur (guide rapide)
✅ Formulaire feedback intégré
✅ Monitoring basique (Vercel Analytics)
```

**Critères validation J14 :**
- [ ] 3 artisans beta testeurs inscrits
- [ ] 10 prospects créés par les testeurs
- [ ] 5 relances envoyées avec succès
- [ ] Taux de spam < 1% (test Mail-tester > 8/10)
- [ ] Aucun bug critique remonté

---

## 16. Tests fonctionnels

### Scénarios de test obligatoires

#### Test 1 : Parcours inscription → première relance

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Aller sur /register | Formulaire inscription affiché |
| 2 | Remplir email, mdp, nom entreprise | Champs validés |
| 3 | Soumettre formulaire | Compte créé, redirection dashboard |
| 4 | Cliquer "+ Nouveau prospect" | Formulaire création ouvert |
| 5 | Saisir nom, email, montant | Champs remplis |
| 6 | Cliquer "Créer" | Prospect créé, visible dans liste |
| 7 | Cliquer "Générer relance" | Page relance ouverte |
| 8 | Sélectionner template 3 jours | Prévisualisation affichée |
| 9 | Cliquer "Valider et envoyer" | Modal confirmation |
| 10 | Confirmer | Email envoyé, retour dashboard |
| 11 | Vérifier historique | Relance visible avec statut "Envoyé" |

#### Test 2 : Filtres et recherche

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Créer 5 prospects avec statuts différents | Prospects visibles |
| 2 | Cliquer filtre "À relancer" | Uniquement TO_CONTACT affichés |
| 3 | Cliquer filtre "Relancé" | Uniquement CONTACTED affichés |
| 4 | Rechercher "Dupont" | Uniquement prospects "Dupont" |
| 5 | Trier par montant décroissant | Ordre correct |

#### Test 3 : Sécurité - Isolation données

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Créer compte User A avec prospects | Prospects créés |
| 2 | Créer compte User B | Compte créé |
| 3 | User B tente accès API prospect User A | 404 ou 403 |
| 4 | User B tente modification prospect User A | 403 Forbidden |

### Checklist tests navigateurs

| Navigateur | Version | Testé | Statut |
|------------|---------|-------|--------|
| Chrome | Dernière | ☐ | - |
| Firefox | Dernière | ☐ | - |
| Safari | Dernière | ☐ | - |
| Edge | Dernière | ☐ | - |
| Chrome Mobile | Dernière | ☐ | - |
| Safari iOS | Dernière | ☐ | - |

---

## 17. Tests sécurité

### Audit manuel obligatoire

| # | Test | Méthode | Résultat attendu |
|---|------|---------|------------------|
| 1 | Injection SQL dans champs | `' OR '1'='1` dans tous les inputs | Pas d'erreur SQL, rejeté par Zod |
| 2 | XSS dans nom prospect | `<script>alert('xss')</script>` | Échappé, pas d'exécution |
| 3 | Accès route protégée sans auth | CURL sur /api/prospects sans cookie | 401 Unauthorized |
| 4 | Modification ID prospect | PATCH avec prospectId d'un autre user | 403 Forbidden |
| 5 | Rate limiting emails | Envoyer 60 emails en 1 heure | Bloqué après 50, message clair |
| 6 | CSRF | Formulaire POST depuis autre domaine | Rejeté (SameSite cookie) |
| 7 | Exposition clé API | Vérifier bundle client | Aucune clé API dans JS bundle |
| 8 | Headers sécurité | Scanner securityheaders.com | Grade B minimum |

### Outils recommandés

```bash
# Test délivrabilité email
curl -X POST https://api.mail-tester.com/api/v1/test --data-urlencode "email=test@example.com"

# Test headers sécurité
npx security-headers-cli https://relanceclient-ia.vercel.app

# Test accessibilité (bonus)
npx pa11y https://relanceclient-ia.vercel.app
```

---

## 18. Checklist RGPD minimale

### Obligations MVP

| # | Obligation | Implémentation | Statut |
|---|------------|----------------|--------|
| 1 | Consentement explicite | Checkbox CGU à l'inscription | ☐ |
| 2 | Droit d'accès | Export CSV des données (settings) | ☐ |
| 3 | Droit de rectification | Page settings modifiable | ☐ |
| 4 | Droit à l'effacement | Bouton "Supprimer mon compte" | ☐ |
| 5 | Droit à la portabilité | Export JSON complet | ☐ |
| 6 | Notification breach | Procédure interne + template email | ☐ |
| 7 | DPA (Processing Agreement) | Signé avec Supabase | ☐ |
| 8 | Conservation limitée | Suppression auto comptes inactifs 2 ans | ☐ |
| 9 | Sécurité des données | Chiffrement, RLS, backups | ☐ |
| 10 | Transparence | Page mentions légales complète | ☐ |

### Mentions légales minimales (page /mentions-legales)

**Sections obligatoires :**
1. Éditeur du site (Raison sociale, adresse, contact)
2. Hébergeur (Vercel + Supabase)
3. Traitement des données (finalité, durée, destinataires)
4. Cookies (si analytics)
5. Contact DPO (email contact)

### CGU minimales

**Points à couvrir :**
- Description du service
- Conditions d'inscription
- Obligations utilisateur (pas de spam)
- Propriété intellectuelle
- Limitation de responsabilité (emails envoyés par user)
- Résiliation
- Droit applicable

---

## 19. Prompt Codex global

Ce prompt est destiné à être utilisé avec Codex (CLI OpenAI) ou tout autre agent de codage pour générer l'intégralité du MVP.

```
Tu es un développeur full-stack senior spécialisé Next.js 14, TypeScript et SaaS.
Tu dois développer le MVP complet de "RelanceClient IA" - un outil de relance de devis pour artisans.

CONTEXTE:
Application web permettant aux artisans du bâtiment de suivre leurs prospects et envoyer des relances email.
PRINCIPE FONDAMENTAL : Validation humaine obligatoire avant chaque envoi d'email.

STACK OBLIGATOIRE:
- Next.js 14 (App Router)
- TypeScript (strict)
- Tailwind CSS
- shadcn/ui (composants UI)
- Supabase (Auth + PostgreSQL)
- Prisma (ORM)
- Resend (emails)
- Zod (validation)

STRUCTURE DU PROJET:
```
relanceclient-ia/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (auth)/register/page.tsx
│   ├── (dashboard)/dashboard/page.tsx
│   ├── (dashboard)/prospects/page.tsx
│   ├── (dashboard)/prospects/new/page.tsx
│   ├── (dashboard)/prospects/[id]/page.tsx
│   ├── (dashboard)/reminders/new/page.tsx
│   ├── (dashboard)/settings/page.tsx
│   ├── api/prospects/route.ts
│   ├── api/prospects/[id]/route.ts
│   ├── api/reminders/generate/route.ts
│   ├── api/reminders/send/route.ts
│   ├── api/templates/route.ts
│   └── api/dashboard/stats/route.ts
├── components/
│   ├── ui/ (button, input, card, table, dialog, select, textarea, badge)
│   ├── prospects/ (prospect-list, prospect-form, prospect-card, status-badge)
│   ├── reminders/ (reminder-form, template-selector, reminder-preview)
│   └── dashboard/ (stat-card, action-list)
├── lib/
│   ├── supabase/ (client.ts, server.ts, middleware.ts)
│   ├── prisma.ts
│   ├── resend.ts
│   ├── validations.ts (Zod schemas)
│   ├── email-service.ts
│   ├── template-service.ts
│   └── dashboard-service.ts
├── prisma/schema.prisma
└── middleware.ts
```

MODÈLE DE DONNÉES (Prisma):
```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql" url = env("DATABASE_URL") }

model User {
  id             String    @id @default(uuid())
  email          String    @unique
  companyName    String?
  firstName      String?
  lastName       String?
  phone          String?
  emailSignature String?   @default("Cordialement,")
  resendApiKey   String?
  createdAt      DateTime  @default(now())
  prospects      Prospect[]
  reminders      Reminder[]
}

model Prospect {
  id                String   @id @default(uuid())
  userId            String
  name              String
  email             String
  phone             String?
  projectDescription String?
  quoteAmount       Decimal? @db.Decimal(10, 2)
  quoteDate         DateTime @default(now())
  status            ProspectStatus @default(TO_CONTACT)
  notes             String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  lastContactDate   DateTime?
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  reminders         Reminder[]
}

enum ProspectStatus { TO_CONTACT CONTACTED NEGOTIATING WON LOST ARCHIVED }

model Reminder {
  id           String   @id @default(uuid())
  prospectId   String
  userId       String
  templateUsed String
  subject      String
  body         String   @db.Text
  sentAt       DateTime @default(now())
  status       ReminderStatus @default(SENT)
  prospect     Prospect @relation(fields: [prospectId], references: [id], onDelete: Cascade)
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

enum ReminderStatus { SENT FAILED }
```

TEMPLATES EMAIL PAR DÉFAUT:
- DAY_3 (3 jours): "Votre devis {{company_name}} - Est-ce que vous avez des questions ?"
- DAY_7 (7 jours): "{{company_name}} - Puis-je compter sur vous pour ce chantier ?"
- DAY_14 (14 jours): "Derniers créneaux disponibles - {{company_name}}"

VARIABLES DE TEMPLATE: {{client_name}}, {{quote_amount}}, {{quote_date}}, {{company_name}}, {{first_name}}

FONCTIONNALITÉS À IMPLÉMENTER:

1. AUTHENTIFICATION:
   - Login / Register avec Supabase Auth
   - Middleware de protection routes
   - Row Level Security sur toutes les tables

2. PROSPECTS (CRUD):
   - Liste avec filtres (TO_CONTACT, CONTACTED, NEGOTIATING, WON, LOST)
   - Création rapide (nom, email, montant, date)
   - Édition et suppression
   - Changement de statut rapide

3. RELANCES (CORE):
   - Sélection template (3j, 7j, 14j)
   - Génération avec remplacement variables
   - PRÉVISUALISATION complète avant envoi
   - Édition possible du message
   - MODAL DE CONFIRMATION avant envoi
   - Envoi via Resend API
   - Stockage historique
   - Mise à jour automatique statut prospect

4. DASHBOARD:
   - Cards: Nombre prospects, CA potentiel, Taux conversion, À relancer
   - Liste "Actions du jour" (prospects avec nextReminderDate <= aujourd'hui)
   - Prospects récents

5. SETTINGS:
   - Profil (nom, entreprise, téléphone, signature)
   - Configuration clé API Resend

RÈGLES STRICTES:
- Validation Zod sur TOUTES les API
- RLS activé sur toutes les tables PostgreSQL
- Rate limiting: 50 emails/heure max par utilisateur
- Aucun email ne part sans validation manuelle explicite
- Design responsive (mobile first)
- Messages d'erreur clairs pour l'utilisateur
- Loading states sur toutes les actions asynchrones
- Pas de données sensibles dans le bundle client

VARIABLES ENV (.env.local):
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
RESEND_API_KEY=

COMMANDES SETUP:
1. npx create-next-app@latest relanceclient-ia --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
2. cd relanceclient-ia && npx shadcn-ui@latest init
3. npx shadcn add button input card table dialog select textarea badge
4. npm install @supabase/ssr @supabase/supabase-js
5. npm install prisma @prisma/client zod resend
6. npx prisma init
7. Configurer .env.local
8. npx prisma migrate dev --name init

LIVRABLE:
Code source complet, fonctionnel, prêt à déployer sur Vercel avec README détaillant:
- Installation
- Configuration variables d'environnement
- Lancement en local
- Structure des fichiers
- Tests manuels à effectuer

Commence par créer le fichier prisma/schema.prisma avec le modèle complet.
```

---

## 20. Prompts Codex découpés par étape

Pour une exécution itérative avec Codex, utiliser ces prompts séquentiels :

### ÉTAPE 1 : Setup et Authentification

```
Crée le projet RelanceClient IA avec authentification complète.

FICHIER À CRÉER:
1. prisma/schema.prisma (modèles User, Prospect, Reminder complets)
2. middleware.ts (protection routes)
3. lib/supabase/client.ts et server.ts
4. lib/prisma.ts
5. app/(auth)/login/page.tsx (formulaire)
6. app/(auth)/register/page.tsx (formulaire)
7. app/(dashboard)/layout.tsx (layout avec nav)
8. app/page.tsx (landing page basique avec liens login/register)
9. .env.example

STACK: Next.js 14 + TypeScript + Tailwind + shadcn/ui + Supabase Auth + Prisma

RÈGLES:
- Row Level Security activé sur toutes les tables
- Middleware redirige vers /login si non authentifié
- Layout dashboard affiche nom utilisateur et bouton déconnexion
- Messages d'erreur clairs (email/mdp incorrect, etc.)

TEST: Après exécution, je dois pouvoir créer un compte et me connecter.
```

### ÉTAPE 2 : CRUD Prospects

```
Implémente le CRUD complet des prospects.

FICHIER À CRÉER:
1. lib/validations.ts (schémas Zod Prospect)
2. app/api/prospects/route.ts (GET liste, POST création)
3. app/api/prospects/[id]/route.ts (GET, PATCH, DELETE)
4. app/api/prospects/[id]/status/route.ts (PATCH statut rapide)
5. components/prospects/prospect-form.tsx
6. components/prospects/prospect-list.tsx
7. components/prospects/status-badge.tsx
8. app/(dashboard)/prospects/page.tsx
9. app/(dashboard)/prospects/new/page.tsx
10. app/(dashboard)/prospects/[id]/page.tsx (détail)

FONCTIONNALITÉS:
- Liste paginée avec filtres par statut
- Formulaire création (nom*, email*, téléphone, montant, date, notes)
- Badge statut coloré (TO_CONTACT=orange, CONTACTED=blue, WON=green, LOST=red)
- Actions rapides: changer statut, supprimer
- Tri par date de création

RÈGLES:
- Validation temps réel avec Zod
- Isolation: un utilisateur ne voit que ses prospects (RLS)
- Redirection après création vers liste
- Toast confirmation après action

TEST: Créer 3 prospects, modifier le statut d'un, supprimer un.
```

### ÉTAPE 3 : Templates et Génération Relances

```
Implémente le système de templates et la génération de relances.

FICHIER À CRÉER:
1. lib/constants.ts (templates par défaut DAY_3, DAY_7, DAY_14)
2. lib/template-service.ts (fonctions de remplacement variables)
3. lib/validations.ts (schémas Zod pour reminders)
4. app/api/templates/route.ts (GET templates)
5. app/api/reminders/generate/route.ts (POST génération)
6. components/reminders/template-selector.tsx
7. components/reminders/reminder-preview.tsx
8. app/(dashboard)/reminders/new/page.tsx (interface création)

TEMPLATES À IMPLÉMENTER:
- DAY_3: Relance polie (3 jours après devis)
- DAY_7: Relance engagement (7 jours)
- DAY_14: Dernière chance (14 jours)

VARIABLES: {{client_name}}, {{quote_amount}}, {{quote_date}}, {{company_name}}, {{first_name}}

FONCTIONNALITÉS:
- Sélection template via boutons
- Calcul automatique du délai depuis quoteDate
- Prévisualisation en temps réel avec variables remplacées
- Zone d'édition pour modifier le message avant envoi
- Bouton "Valider et envoyer" (ouvre modal confirmation)

RÈGLES:
- Pas d'envoi automatique: uniquement prévisualisation à cette étape
- Variables manquantes = chaîne vide (pas d'erreur)
- Formatage montant: "3 500 €"
- Formatage date: "15/04/2024"

TEST: Sélectionner un prospect, choisir template 3j, vérifier prévisualisation.
```

### ÉTAPE 4 : Envoi Emails

```
Implémente l'envoi des relances via Resend avec validation obligatoire.

FICHIER À CRÉER:
1. lib/resend.ts (client Resend)
2. lib/rate-limit.ts (limitation 50 emails/heure)
3. lib/email-service.ts (fonction sendReminderEmail)
4. app/api/reminders/send/route.ts (API envoi)
5. components/reminders/send-confirmation-dialog.tsx
6. app/(dashboard)/settings/page.tsx (config clé API Resend)

FONCTIONNALITÉS:
- Modal confirmation avec récapitulatif complet
- Envoi via Resend API avec clé utilisateur
- Rate limiting: 50 emails/heure max
- Stockage relance en base (table Reminder)
- Mise à jour prospect: status=CONTACTED, lastContactDate=now
- Gestion erreurs: clé API invalide, email bounce, etc.
- Toast succès/erreur

EMAIL:
- Expéditeur: {{company_name}} <{{user_email}}>
- Reply-To: email de l'artisan
- Version texte + HTML
- Footer unsubscribe

RÈGLES CRITIQUES:
- Validation Zod stricte avant envoi
- Vérification prospect appartient bien à l'utilisateur
- Pas de retry automatique (afficher erreur à l'utilisateur)
- Log tous les envois (même échoués)

TEST: Configurer clé Resend, envoyer une relance, vérifier réception.
```

### ÉTAPE 5 : Dashboard et Stats

```
Implémente le tableau de bord avec statistiques.

FICHIER À CRÉER:
1. lib/dashboard-service.ts (calculs stats)
2. app/api/dashboard/stats/route.ts
3. app/api/dashboard/actions/route.ts
4. components/dashboard/stat-card.tsx
5. components/dashboard/action-list.tsx
6. components/dashboard/recent-activity.tsx
7. app/(dashboard)/dashboard/page.tsx

STATS À AFFICHER:
- Total prospects en cours (TO_CONTACT + CONTACTED + NEGOTIATING)
- CA potentiel (sum quoteAmount des prospects en cours)
- Taux conversion (WON / (WON + LOST) * 100)
- À relancer aujourd'hui (nextReminderDate <= today)

ACTIONS DU JOUR:
- Liste prospects TO_CONTACT avec quoteDate + 3j <= aujourd'hui
- Triage par ancienneté (les plus vieux d'abord)
- Bouton rapide "Générer relance"
- Limite: 5 items (lien "Voir tout")

ACTIVITÉ RÉCENTE:
- 5 derniers prospects créés
- 5 dernières relances envoyées

RÈGLES:
- Chargement < 2 secondes (requêtes optimisées)
- Cache côté client (SWR ou React Query optionnel)
- Responsive: cards en colonne sur mobile

TEST: Créer prospects variés, vérifier calculs stats corrects.
```

### ÉTAPE 6 : Polish et Responsive

```
Finalise l'application avec polish UX et responsive.

FICHIERS À MODIFIER/COMPLETER:
1. app/layout.tsx (metadata, favicon, fonts)
2. components/ui/toaster.tsx (notifications)
3. lib/utils.ts (formatters date, montant)
4. app/(dashboard)/settings/page.tsx (profil complet)
5. app/globals.css (ajustements responsive)
6. components/prospects/prospect-list.tsx (mobile cards)

AJUSTEMENTS:
- Navigation mobile (menu hamburger)
- Loading states sur tous les boutons
- Empty states (pas de prospects, pas de relances)
- Error boundaries
- Toast notifications (succès, erreur)
- Format dates: "15 avril 2024" en FR
- Format montants: "3 500 €"
- Accessibilité: labels, aria, contrastes

PAGE SETTINGS COMPLÈTE:
- Formulaire profil (prénom, nom, entreprise, téléphone, signature)
- Configuration Resend (clé API, test connexion)
- Export données (CSV prospects)
- Suppression compte

OPTIMISATIONS:
- Images optimisées (Next Image)
- Fonts optimisées (Next Font)
- Dynamic imports si nécessaire

TEST: Tester sur mobile (Chrome DevTools iPhone SE), vérifier UX fluide.
```

### ÉTAPE 7 : Tests et Documentation

```
Ajoute les tests E2E et documentation finale.

FICHIERS À CRÉER:
1. README.md (complet)
2. .env.example (template)
3. __tests__/auth.spec.ts (tests E2E auth)
4. __tests__/prospects.spec.ts (tests CRUD)
5. __tests__/reminders.spec.ts (tests relances)
6. app/mentions-legales/page.tsx
7. app/cgu/page.tsx

README DOIT CONTENIR:
- Description projet
- Stack technique
- Prérequis (Node, compte Supabase, compte Resend)
- Installation étape par étape
- Configuration variables d'environnement
- Lancement développement
- Structure dossiers
- Déploiement Vercel
- Tests manuels à faire

TESTS E2E (Playwright ou Cypress):
- Inscription -> Login -> Créer prospect -> Envoyer relance
- Vérifier isolation données (2 comptes)
- Vérifier rate limiting

PAGES LÉGALES:
- Mentions légales (éditeur, hébergeur, contact)
- CGU (conditions utilisation, responsabilités)
- Footer avec liens

CHECKLIST FINALE:
- [ ] Toutes les routes protégées fonctionnent
- [ ] RLS empêche accès données autres utilisateurs
- [ ] Emails s'envoient correctement
- [ ] Responsive mobile OK
- [ ] Pas d'erreur console
- [ ] Build production réussit (next build)

LIVRABLE: Projet prêt pour déploiement production.
```

---

**Fin du document** - Ce plan est prêt à être utilisé pour guider le développement du MVP RelanceClient IA.
