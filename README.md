# RelanceClient IA — MVP

RelanceClient IA est un MVP SaaS pour aider les artisans du batiment a suivre
leurs devis et preparer des relances email. Le principe produit central est
strict : aucun email ne doit etre envoye sans validation humaine explicite.

Cette version contient uniquement le squelette technique du projet. Les
fonctionnalites metier seront implementees par etapes.

## Stack

- Next.js 14 avec App Router
- TypeScript strict
- Tailwind CSS
- shadcn/ui prevu via `components/ui`
- Supabase Auth et PostgreSQL
- Prisma
- Resend
- Zod

## Prerequis

- Node.js 20+
- npm
- Un projet Supabase pour les prochaines etapes
- Un compte Resend pour les prochaines etapes email

## Installation

```bash
npm install
cp .env.example .env.local
npm run dev
```

L'application sera disponible sur `http://localhost:3000`.

## Variables d'environnement

Voir `.env.example`.

```bash
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
DIRECT_URL=
RESEND_API_KEY=
EMAIL_FROM=
```

## Commandes

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
```

## Structure

```text
app/
  (auth)/
  (dashboard)/
  api/
components/
  ui/
  auth/
  prospects/
  reminders/
  dashboard/
hooks/
lib/
  supabase/
prisma/
types/
```

## Documents de cadrage

- `PROJECT_CONTEXT.md`
- `docs/spec.md`
- `docs/mvp-plan.md`
- `CODEX_PROMPT.md`
