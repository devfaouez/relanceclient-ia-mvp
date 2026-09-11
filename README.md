# RelanceClient IA

RelanceClient IA est un SaaS destiné aux artisans qui centralise le suivi des
prospects et des devis, puis aide à préparer, programmer et envoyer les
relances commerciales. Les textes générés par l'IA restent sous contrôle de
l'utilisateur avant leur envoi ou leur programmation.

Le MVP est déployé en production sur
[relanceclientia.fr](https://relanceclientia.fr).

## Fonctionnalités du MVP

- Authentification email avec Supabase Auth.
- Gestion des prospects, devis, lignes de devis et statuts.
- Génération de devis PDF et envoi en pièce jointe.
- Paramètres entreprise, signature et logo PNG, JPEG, WebP ou SVG.
- Génération de relances avec OpenAI, édition et validation humaine.
- Envoi immédiat ou programmation des relances avec Resend.
- Templates de relance, historique d'activité et tableau de bord.
- Plan gratuit et abonnement Pro Stripe mensuel ou annuel.
- Checkout, portail client et synchronisation par webhooks Stripe.
- Interface responsive.

## Stack technique

- Next.js 14, App Router et React 18.
- TypeScript en mode strict.
- Tailwind CSS, Lucide React et Recharts.
- Supabase Auth et PostgreSQL Supabase.
- Prisma ORM 5.
- OpenAI Responses API pour la génération des relances.
- Resend pour les emails transactionnels.
- `@react-pdf/renderer` pour les devis PDF.
- Sharp pour convertir les logos SVG et WebP côté serveur.
- Stripe Checkout, Billing Portal et webhooks.
- Zod pour la validation des entrées.
- Vercel pour l'hébergement et le cron quotidien.

## Prérequis

- Node.js 20 ou une version LTS plus récente.
- npm.
- Un projet Supabase avec une base PostgreSQL.
- Un compte OpenAI avec une clé API active.
- Un compte Resend et un domaine d'envoi vérifié.
- Un compte Stripe avec un produit Pro et deux prix récurrents.
- Un projet Vercel pour le déploiement et le cron de production.

## Installation locale

Depuis la racine du projet :

```bash
npm install
cp .env.example .env.local
```

Renseigner ensuite `.env.local`, puis préparer la base :

```bash
npx prisma generate
npx prisma migrate dev
```

Démarrer l'application :

```bash
npm run dev
```

L'application est accessible sur `http://localhost:3000`.

## Commandes

| Commande | Usage |
| --- | --- |
| `npm run dev` | Démarre Next.js en développement. |
| `npm run build` | Génère le client Prisma puis compile la production. |
| `npm run start` | Démarre le build de production. |
| `npm run lint` | Exécute ESLint via Next.js. |
| `npm run typecheck` | Vérifie TypeScript sans produire de fichiers. |
| `npm run postinstall` | Régénère le client Prisma après installation. |
| `npx prisma migrate dev` | Applique les migrations en développement. |
| `npx prisma migrate deploy` | Applique les migrations existantes en production. |
| `npx prisma studio` | Ouvre l'interface locale Prisma Studio. |

## Variables d'environnement

Copier `.env.example` vers `.env.local`. Les secrets ne doivent jamais être
commités ni préfixés par `NEXT_PUBLIC_`.

| Variable | Requise | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Oui | URL publique sans slash final, par exemple `http://localhost:3000` en local. |
| `DATABASE_URL` | Oui | Connexion PostgreSQL utilisée par Prisma pour l'application. |
| `DIRECT_URL` | Oui | Connexion directe utilisée par Prisma pour les migrations. |
| `NEXT_PUBLIC_SUPABASE_URL` | Oui | URL du projet Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Oui | Clé publique anon de Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Non | Réservée aux opérations serveur administratives ; elle ne doit jamais être exposée au navigateur. |
| `OPENAI_API_KEY` | Oui | Clé API utilisée pour générer les relances. |
| `AI_MODEL` | Non | Modèle OpenAI, `gpt-5.5` par défaut. |
| `AI_MAX_TOKENS` | Non | Nombre maximal de tokens de sortie, `600` par défaut. |
| `AI_DAILY_LIMIT_PER_USER` | Non | Limite quotidienne de générations par utilisateur, `50` par défaut. |
| `RESEND_API_KEY` | Oui | Clé API Resend. |
| `RESEND_FROM_EMAIL` | Oui | Adresse d'expédition vérifiée, avec ou sans nom d'affichage. |
| `CRON_SECRET` | Oui en production | Secret utilisé par Vercel pour authentifier la route cron. |
| `STRIPE_SECRET_KEY` | Oui pour Stripe | Clé secrète Stripe correspondant au mode test ou production. |
| `STRIPE_WEBHOOK_SECRET` | Oui pour Stripe | Secret de signature de l'endpoint webhook. |
| `STRIPE_PRO_MONTHLY_PRICE_ID` | Oui pour Stripe | Identifiant du prix Pro mensuel. |
| `STRIPE_PRO_YEARLY_PRICE_ID` | Oui pour Stripe | Identifiant du prix Pro annuel. |

Les anciens noms `STRIPE_PRO_PRICE_ID` et `STRIPE_PRICE_PRO_ID` restent pris en
charge uniquement comme fallbacks du prix mensuel. Les nouvelles installations
doivent utiliser `STRIPE_PRO_MONTHLY_PRICE_ID`.

## Supabase

Supabase fournit l'authentification et la base PostgreSQL. Le client navigateur
et le client serveur utilisent l'URL du projet et la clé anon. Après validation
de l'email, `/api/auth/callback` échange le code Supabase contre une session et
crée si nécessaire l'utilisateur correspondant dans la base Prisma.

Dans les paramètres Auth de Supabase, configurer :

- Site URL locale : `http://localhost:3000`.
- Redirect URL locale : `http://localhost:3000/api/auth/callback`.
- Site URL de production : `https://relanceclientia.fr`.
- Redirect URL de production : `https://relanceclientia.fr/api/auth/callback`.

Récupérer `DATABASE_URL` et `DIRECT_URL` depuis les informations de connexion
PostgreSQL du projet. Utiliser la connexion directe pour les migrations et la
chaîne adaptée au runtime déployé pour les requêtes applicatives.

## Stripe

Créer un produit Pro avec deux prix récurrents : un mensuel et un annuel. Placer
leurs identifiants dans `STRIPE_PRO_MONTHLY_PRICE_ID` et
`STRIPE_PRO_YEARLY_PRICE_ID`, puis activer et configurer le Billing Portal dans
Stripe.

L'endpoint webhook de production est :

```text
https://relanceclientia.fr/api/stripe/webhook
```

Événements à envoyer à cet endpoint :

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

La signature est vérifiée avec `STRIPE_WEBHOOK_SECRET`. Les abonnements créés
depuis l'application sont reliés grâce aux métadonnées Stripe. Pour un
abonnement créé manuellement, le webhook essaie aussi l'identifiant
d'abonnement puis le Customer Stripe déjà enregistré sur l'utilisateur.

Pour tester localement avec Stripe CLI :

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Utiliser le secret temporaire affiché par Stripe CLI uniquement dans
`.env.local`.

## Resend

Vérifier le domaine d'envoi dans Resend, créer une clé API et configurer
`RESEND_FROM_EMAIL` avec une adresse autorisée, par exemple :

```dotenv
RESEND_FROM_EMAIL="RelanceClient IA <notifications@example.com>"
```

Le nom d'entreprise configuré dans `/settings` est utilisé comme nom
d'expéditeur. Si l'artisan renseigne une adresse email entreprise valide, elle
est placée dans `Reply-To` afin que les réponses du prospect lui arrivent
directement.

## OpenAI

`OPENAI_API_KEY` active la génération des relances. Le modèle, le nombre maximal
de tokens et la limite quotidienne par utilisateur peuvent être ajustés avec
`AI_MODEL`, `AI_MAX_TOKENS` et `AI_DAILY_LIMIT_PER_USER`.

La génération produit un objet structuré contenant le sujet et le corps du
message. L'utilisation et une estimation du coût sont enregistrées dans la base
pour alimenter les limites et le suivi du compte.

## Cron Vercel

Le fichier `vercel.json` appelle quotidiennement :

```text
GET /api/cron/reminders/send-scheduled
```

La planification actuelle est `0 7 * * *`, soit une exécution tous les jours à
07:00 UTC. La route attend l'en-tête `Authorization: Bearer CRON_SECRET` et
traite au maximum 50 relances arrivées à échéance par exécution.

Pour un appel manuel local :

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/reminders/send-scheduled
```

## Logos entreprise dans les PDF

L'URL du logo est enregistrée telle quelle dans `UserPreferences.logoUrl` et
sert directement à l'aperçu dans `/settings`. Lors de la génération du PDF, le
serveur télécharge le logo et prépare une data URI compatible avec React PDF :

- PNG et JPEG sont conservés dans leur format d'origine.
- SVG et WebP sont convertis en PNG en mémoire avec Sharp.
- La transparence est conservée pour le fond blanc du devis.
- Le `Content-Type` est prioritaire ; l'extension sert uniquement s'il est absent.
- Le téléchargement est limité à 5 Mio et 5 secondes, avec trois redirections.
- Les hôtes et adresses IP locaux, privés ou réservés sont bloqués contre les SSRF.

Si le logo est absent, inaccessible ou invalide, le PDF est tout de même généré
sans logo. Le téléchargement du devis et la pièce jointe envoyée par email
utilisent le même générateur serveur.

## Déploiement Vercel

1. Créer la base Supabase et appliquer les migrations avec
   `npx prisma migrate deploy`.
2. Importer le dépôt dans Vercel et conserver la commande de build
   `npm run build`.
3. Ajouter toutes les variables requises dans les environnements Vercel
   concernés, sans réutiliser les secrets de test en production.
4. Déployer puis associer le domaine `relanceclientia.fr`.
5. Mettre à jour les URL de site et de callback dans Supabase.
6. Créer l'endpoint webhook Stripe de production et reporter son secret dans
   Vercel.
7. Vérifier dans Vercel que le cron déclaré par `vercel.json` est actif et que
   `CRON_SECRET` est défini.

Après modification d'une variable serveur, redéployer l'application afin que
les fonctions utilisent la nouvelle valeur.

## Structure du projet

```text
app/
  (auth)/                  pages de connexion et d'inscription
  (dashboard)/             interface authentifiée du MVP
  api/                     routes métier et intégrations serveur
components/                composants React partagés
lib/
  ai/                      génération OpenAI et prompts
  email/                   expéditeur et templates Resend
  pdf/                     document devis et rendu serveur
  supabase/                clients Supabase navigateur et serveur
  auth.ts                  liaison Supabase Auth / utilisateur Prisma
  prisma.ts                client Prisma partagé
  stripe.ts                client Stripe
  stripe-billing.ts        prix et portail de facturation
prisma/
  migrations/              migrations PostgreSQL versionnées
  schema.prisma            modèle de données
public/                    ressources statiques éventuelles
vercel.json                configuration du cron Vercel
```

Les documents de cadrage historiques restent disponibles dans `docs/`,
`PROJECT_CONTEXT.md` et `CODEX_PROMPT.md`.
