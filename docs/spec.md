# Cahier des Charges MVP - RelanceClient IA

---

## 1. Vision produit

RelanceClient IA est un outil SaaS conçu pour aider les artisans du bâtiment à transformer leurs devis en chantiers facturés. L'application résout le problème critique du "trou noir" après envoi d'un devis : la majorité des artisans ne relancent pas leurs prospects faute de temps, laissant ainsi 20 à 40% de revenus potentiels sur la table.

La vision est simple : un artisan saisit ses prospects en 30 secondes, le système génère des relances personnalisées et professionnelles, et l'artisan valide avant envoi. Aucun email ne part sans son accord.

**Promesse** : "Ne laissez plus jamais un devis s'endormir."

---

## 2. Client cible prioritaire

### Segment principal
**Artisans du bâtiment envoyant 10+ devis par mois**

- Métiers ciblés (priorité 1) : plombiers, électriciens, menuisiers, rénovateurs complets
- Taille d'entreprise : 1 à 5 salariés
- CA annuel : 100 000€ à 800 000€
- Situation : submergés par les tâches administratives, pas de secrétariat dédié
- Outils actuels : email professionnel (Gmail/Outlook), Excel ou papier pour le suivi

### Profil type - Persona "François"
- 42 ans, plombier indépendant depuis 8 ans
- Envoie 15-20 devis par mois, taux de conversion actuel : 25%
- Passe 1h30 par jour sur la route entre chantiers
- Gère tout seul : devis, facturation, appels clients, fournisseurs
- Frustration principale : "Je sais que je perds des clients parce que je n'ai pas le temps de relancer, mais entre deux urgences, j'oublie"

---

## 3. Problème métier

### La douleur
Après avoir passé 1 à 2 heures à établir un devis détaillé, l'artisan l'envoie au client puis... le oublie. Entre deux chantiers urgents, des appels fournisseurs, et la paperasse, la relance devient un luxe temporel impossible.

### Impact financier concret
- Un artisan envoyant 15 devis/mois à 3000€ en moyenne représente 45 000€ de pipeline mensuel
- Avec un taux de conversion de 25% → 11 250€ de CA réalisé
- Une relance bien faite augmente le taux de conversion à 35-40%
- **Perte mensuelle estimée : 4 500 à 6 750€ par mois** (soit 54 000 à 81 000€ par an)

### Pourquoi les solutions actuelles échouent
- CRM généralistes (Pipedrive, HubSpot) : trop complexes, trop chers, pas adaptés au vocabulaire artisan
- Relances manuelles : demandent une discipline impossible à maintenir
- Rien du tout : 60% des artisans n'ont aucun système de suivi

---

## 4. Proposition de valeur

### Pour l'artisan
1. **Gagnez 2 à 3 clients supplémentaires par mois** grâce aux relances systématiques
2. **Zéro temps perdu** : saisie en 30 secondes, validation en 1 clic
3. **Zéro risque d'image** : chaque email est validé avant envoi
4. **Tableau de bord simple** : visualisez immédiatement où en sont vos devis

### Différenciation concurrentielle
| Critère | RelanceClient IA | CRM généralistes | Excel/Papier |
|---------|------------------|------------------|--------------|
| Temps de prise en main | 5 minutes | 2-3 jours | Variable |
| Adapté au vocabulaire artisan | Oui | Non | N/A |
| Coût mensuel | 19-39€ | 49-99€ | Gratuit |
| Génération de relances | Automatique | Manuelle | Aucune |
| Validation avant envoi | Oui | Non applicable | N/A |

### ROI client
- Coût mensuel : 39€ (plan Pro)
- Gain moyen constaté : +2 clients/mois à 3000€ = +6000€/mois
- **ROI : 153x**

---

## 5. Fonctionnalités MVP

### Core - Suivi de prospects
| Fonctionnalité | Description | Priorité |
|----------------|-------------|----------|
| Formulaire de saisie rapide | Nom, email, téléphone, date devis, montant estimé, notes | P0 |
| Liste des prospects | Tableau avec filtres (statut, date, montant) | P0 |
| Statuts de suivi | À relancer → Relance envoyée → En négociation → Gagné/Perdu | P0 |
| Fiches prospect | Détails complet, historique des relances, prochaine action | P0 |

### Core - Gestion des relances
| Fonctionnalité | Description | Priorité |
|----------------|-------------|----------|
| 3 templates d'emails | Template 1 (3 jours), Template 2 (7 jours), Template 3 (14 jours) | P0 |
| Personnalisation simple | Variables : {nom_client}, {montant_devis}, {date_devis}, {nom_artisan} | P0 |
| Prévisualisation email | Vue du message final avant validation | P0 |
| Validation manuelle obligatoire | Bouton "Valider et envoyer" - aucun envoi automatique | P0 |
| Historique des relances | Liste des emails envoyés avec date et contenu | P0 |

### Core - Tableau de bord
| Fonctionnalité | Description | Priorité |
|----------------|-------------|----------|
| Vue d'ensemble | Nombre de devis en cours, taux de conversion, CA potentiel | P0 |
| Relances en attente | Liste des prospects nécessitant une action aujourd'hui | P0 |
| Activité récente | Derniers devis ajoutés, dernières relances envoyées | P1 |

### Support
| Fonctionnalité | Description | Priorité |
|----------------|-------------|----------|
| Authentification email/mot de passe | Inscription, connexion, récupération mot de passe | P0 |
| Profil entreprise | Nom, adresse, logo, signature email | P1 |
| Configuration SMTP | Connexion au serveur email de l'artisan (SendGrid/Resend) | P0 |

---

## 6. Fonctionnalités exclues du MVP

### Exclusions fonctionnelles V1
- **SMS** : relances par SMS (planifié V2)
- **IA générative** : suggestions de messages personnalisés par IA (planifié V2)
- **Import automatique** : import depuis CRM existants ou emails (planifié V2)
- **Intégrations** : API connecteurs vers logiciels de devis (planifié V3)
- **Multi-utilisateurs** : gestion d'équipe et permissions (planifié V3)
- **Application mobile** : interface responsive web uniquement (planifié V3)
- **Relances automatiques** : envoi sans validation humaine (JAMAIS - principe produit)
- **Facturation** : génération de factures depuis devis gagnés (hors scope)

### Pourquoi ces exclusions
Chaque fonctionnalité exclue a été évaluée selon le ratio "impact client / complexité technique" :
- SMS : forte valeur mais nécessite contrat opérateur et réglementation spécifique
- IA générative : ajoute coût API et complexité, valeur incertaine à ce stade
- Multi-utilisateurs : 95% des cibles sont des indépendants ou TPE mono-utilisateur

---

## 7. User stories

### US-001 : Créer un prospect
**En tant qu'** artisan  
**Je veux** ajouter rapidement un nouveau prospect  
**Pour que** je puisse suivre son devis  

**Critères d'acceptation :**
- Formulaire accessible en 1 clic depuis le tableau de bord
- Champs obligatoires : nom, email OU téléphone
- Champs optionnels : montant devis, date, notes
- Création en moins de 30 secondes
- Prospect créé avec statut "À relancer"

### US-002 : Consulter la liste des prospects
**En tant qu'** artisan  
**Je veux** voir tous mes prospects en cours  
**Pour que** je sache qui relancer aujourd'hui  

**Critères d'acceptation :**
- Tableau triable par date, montant, statut
- Filtre par statut (À relancer, Relancé, Gagné, Perdu)
- Badge visuel sur les prospects en retard de relance (> 3 jours)
- Affichage du nombre total et du montant potentiel

### US-003 : Générer une relance email
**En tant qu'** artisan  
**Je veux** générer un email de relance pour un prospect  
**Pour que** je puisse le relancer professionnellement  

**Critères d'acceptation :**
- Sélection du template selon délai écoulé (3j, 7j, 14j)
- Prévisualisation du message avec données du prospect injectées
- Possibilité d'éditer le message avant envoi
- Bouton "Valider et envoyer" actif uniquement après confirmation

### US-004 : Valider avant envoi
**En tant qu'** artisan  
**Je veux** voir et modifier l'email avant envoi  
**Pour que** je contrôle ce que reçoit mon client  

**Critères d'acceptation :**
- Aucun email ne part sans action explicite de validation
- Prévisualition exacte du rendu client (expéditeur, objet, corps)
- Éditeur simple pour ajuster le message
- Confirmation visuelle après envoi

### US-005 : Changer le statut d'un prospect
**En tant qu'** artisan  
**Je veux** mettre à jour le statut d'un prospect  
**Pour que** mon tableau de bord reflète la réalité  

**Critères d'acceptation :**
- Changement de statut en 1 clic depuis la liste ou la fiche
- Statuts disponibles : À relancer, Relancé, En négociation, Gagné, Perdu, Archivé
- Historique des changements de statut conservé
- Archivage automatique des prospects "Gagnés" après 30 jours

### US-006 : Voir le tableau de bord
**En tant qu'** artisan  
**Je veux** avoir une vue d'ensemble de mon activité  
**Pour que** je prenne les bonnes décisions  

**Critères d'acceptation :**
- Chargement en moins de 2 secondes
- Indicateurs clés visibles : devis en cours, taux conversion, CA potentiel
- Liste "Mes actions du jour" avec les relances prioritaires
- Graphique simple d'évolution sur 30 jours

---

## 8. Parcours utilisateur

### Parcours 1 : Première utilisation (onboarding)
```
1. Landing page → Clic "Essayer gratuitement"
2. Formulaire inscription (email, mot de passe, nom entreprise)
3. Email de confirmation → Clique lien
4. Configuration profil (nom, téléphone, signature email)
5. Configuration email (clé API SendGrid ou Resend)
6. Tutoriel guidé : ajout du premier prospect fictif
7. Démonstration relance : génération et prévisualisation
8. Tableau de bord avec prospect exemple
9. Prompt "Ajouter votre premier vrai prospect"
```

### Parcours 2 : Utilisation quotidienne (artisan connecté)
```
1. Connexion → Tableau de bord s'affiche
2. Vue "Actions du jour" : 3 prospects à relancer
3. Clique sur prospect #1 → Ouvre fiche détaillée
4. Clique "Générer une relance" → Sélectionne template 7 jours
5. Prévisualise l'email → Apporte une petite modification personnalisée
6. Clique "Valider et envoyer" → Confirmation visuelle
7. Retour tableau de bord → Prospect passe en "Relancé"
8. Répète pour prospect #2
9. Session terminée en 4 minutes
```

### Parcours 3 : Ajout rapide après un devis
```
1. Artisan vient d'envoyer un devis à M. Dupont depuis son logiciel de devis
2. Ouvre RelanceClient IA sur téléphone (navigateur)
3. Clique bouton "+ Nouveau prospect" flottant
4. Saisit : Nom "Dupont", Email "dupont@email.com", Montant "4500€"
5. Clique "Créer" → Retour tableau de bord
6. Total : 45 secondes
```

---

## 9. Architecture technique simple

### Stack technique MVP

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND                               │
│              Next.js 14 + TypeScript + Tailwind             │
│                    (Vercel hosting)                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND / API                           │
│              Next.js API Routes (serverless)                │
│              ORM : Prisma                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    BASE DE DONNÉES                          │
│                   PostgreSQL (Supabase)                     │
│         Auth native + Row Level Security                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   SERVICES EXTERNES                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Resend    │  │  SendGrid   │  │   Stripe (futur)    │  │
│  │   (email)   │  │   (backup)  │  │   (paiement)        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Justification des choix
- **Next.js** : framework full-stack, rapide à développer, hébergement Vercel simple
- **Supabase** : PostgreSQL managé + auth intégrée + gratuit jusqu'à 500k requêtes/jour
- **Resend** : service d'email simple, bonne délivrabilité, gratuit jusqu'à 3000 emails/mois
- **Tailwind** : styling rapide, design system cohérent sans effort

### Contraintes techniques MVP
- Pas de backend séparé (API routes Next.js suffisent)
- Pas de cache complexe (Redis ajouté uniquement si nécessaire)
- Pas de queue de traitement (envoi email synchrone acceptable à ce volume)
- Pas de websockets (polling simple pour les mises à jour)

---

## 10. Modèle de données initial

### Entités principales

#### User (utilisateur)
```sql
- id: uuid (PK)
- email: string (unique)
- password_hash: string
- company_name: string
- first_name: string
- last_name: string
- phone: string
- email_signature: text
- logo_url: string
- created_at: timestamp
- updated_at: timestamp
- subscription_status: enum (trial, active, cancelled)
- trial_ends_at: timestamp
```

#### Prospect
```sql
- id: uuid (PK)
- user_id: uuid (FK → User)
- name: string
- email: string
- phone: string
- project_description: text
- quote_amount: decimal
- quote_date: date
- status: enum (to_contact, contacted, negotiating, won, lost, archived)
- priority: enum (low, medium, high)
- notes: text
- created_at: timestamp
- updated_at: timestamp
- last_contact_date: timestamp
- next_reminder_date: date
```

#### Reminder (relance)
```sql
- id: uuid (PK)
- prospect_id: uuid (FK → Prospect)
- user_id: uuid (FK → User)
- template_used: enum (day_3, day_7, day_14, custom)
- subject: string
- body: text
- sent_at: timestamp
- status: enum (draft, sent, failed)
- opened_at: timestamp (si tracking activé)
```

#### EmailTemplate
```sql
- id: uuid (PK)
- user_id: uuid (FK → User, nullable - pour templates globaux)
- name: string
- subject: string
- body: text
- delay_days: integer (3, 7, 14)
- is_default: boolean
- created_at: timestamp
```

#### ActivityLog (journal d'activité)
```sql
- id: uuid (PK)
- user_id: uuid (FK → User)
- prospect_id: uuid (FK → Prospect, nullable)
- action: enum (prospect_created, reminder_sent, status_changed, login)
- details: jsonb
- created_at: timestamp
```

### Relations
- Un **User** a plusieurs **Prospects**
- Un **User** a plusieurs **Reminders**
- Un **User** a plusieurs **EmailTemplates**
- Un **Prospect** a plusieurs **Reminders**
- Un **Prospect** a plusieurs **ActivityLog**

---

## 11. API / Routes principales

### Authentification
| Route | Méthode | Description |
|-------|---------|-------------|
| /api/auth/register | POST | Création compte |
| /api/auth/login | POST | Connexion |
| /api/auth/logout | POST | Déconnexion |
| /api/auth/reset-password | POST | Demande réinitialisation |

### Prospects
| Route | Méthode | Description |
|-------|---------|-------------|
| /api/prospects | GET | Liste des prospects (avec filtres) |
| /api/prospects | POST | Créer un prospect |
| /api/prospects/:id | GET | Détails d'un prospect |
| /api/prospects/:id | PATCH | Modifier un prospect |
| /api/prospects/:id | DELETE | Supprimer un prospect |
| /api/prospects/:id/status | PATCH | Changer le statut |

### Relances
| Route | Méthode | Description |
|-------|---------|-------------|
| /api/reminders | GET | Historique des relances |
| /api/reminders/generate | POST | Générer une relance (template + données) |
| /api/reminders/send | POST | Envoyer une relance validée |
| /api/reminders/:id | GET | Détails d'une relance |

### Templates
| Route | Méthode | Description |
|-------|---------|-------------|
| /api/templates | GET | Liste des templates disponibles |
| /api/templates/:id | PATCH | Modifier un template personnalisé |

### Tableau de bord
| Route | Méthode | Description |
|-------|---------|-------------|
| /api/dashboard/stats | GET | Statistiques globales |
| /api/dashboard/actions | GET | Actions prioritaires du jour |

### Profil / Paramètres
| Route | Méthode | Description |
|-------|---------|-------------|
| /api/user/profile | GET/PUT | Profil utilisateur |
| /api/user/email-config | PUT | Configuration email SMTP/API |

---

## 12. Authentification et rôles

### Méthode d'authentification
- **Supabase Auth** : solution intégrée, gratuite, sécurisée
- JWT tokens avec expiration automatique (24h)
- Refresh token pour sessions prolongées
- Récupération mot de passe par email

### Flux d'authentification
```
1. Utilisateur soumet email + mot de passe
2. Supabase Auth vérifie et retourne JWT
3. JWT stocké en cookie httpOnly (sécurisé)
4. Middleware Next.js valide le JWT sur chaque requête API
5. Row Level Security (RLS) Supabase filtre les données selon user_id
```

### Rôles (MVP simplifié)
| Rôle | Description | Permissions |
|------|-------------|-------------|
| user | Artisan standard | CRUD sur ses prospects, envoi relances, modification profil |
| admin | Support technique | Accès lecture seule pour support, pas de modification données |

### Sécurité sessions
- Cookies httpOnly (non accessible en JavaScript)
- Secure flag en production (HTTPS uniquement)
- SameSite=strict (protection CSRF)
- Expiration JWT : 24 heures
- Déconnexion automatique après 7 jours d'inactivité

---

## 13. Sécurité et RGPD

### Protection des données

#### Données stockées
- **Données personnelles utilisateur** : email, nom, téléphone
- **Données prospects** : noms, emails, téléphones des clients finaux
- **Données métier** : montants devis, descriptions projets

#### Mesures de protection
- Chiffrement en transit : HTTPS/TLS 1.3 obligatoire
- Chiffrement au repos : PostgreSQL chiffré (fourni par Supabase)
- Pas de stockage de mots de passe en clair (bcrypt)
- Pas de stockage des clés API email en clair (chiffrement AES)

### Conformité RGPD

#### Base légale
- **Contrat** : exécution du service SaaS
- **Consentement** : pour les emails marketing (si applicable)

#### Droits des utilisateurs
| Droit | Implémentation |
|-------|----------------|
| Accès | Export CSV de toutes les données utilisateur |
| Rectification | Interface de modification profil et prospects |
| Effacement | Suppression compte avec anonymisation ou suppression totale |
| Portabilité | Export JSON de toutes les données |

#### Mesures RGPD spécifiques
- DPA (Data Processing Agreement) signé avec Supabase
- Pas de transfert de données hors UE (Supabase EU region)
- Conservation des logs : 12 mois maximum
- Suppression automatique des comptes inactifs après 2 ans
- Notification de breach sous 72 heures

### Sécurité applicative
- **Validation entrées** : Zod schemas sur toutes les API
- **Rate limiting** : 100 requêtes/minute par IP, 1000/heure par utilisateur
- **SQL Injection** : Prisma ORM (requêtes paramétrées)
- **XSS** : Escaping automatique React + CSP headers
- **CSRF** : Tokens CSRF sur mutations sensibles

---

## 14. Emails et délivrabilité

### Architecture d'envoi

```
RelanceClient IA
       │
       ├──► Resend (principal) ──► Destinataire
       │
       └──► SendGrid (fallback) ──► Destinataire (si Resend fail)
```

### Configuration requise
- L'artisan configure sa propre clé API Resend ou SendGrid
- Possibilité d'utiliser le service partagé (moins recommandé pour délivrabilité)
- Domaine personnalisé recommandé (SPF, DKIM, DMARC configurés)

### Optimisation délivrabilité

#### Configuration DNS (à recommander aux utilisateurs)
```
SPF : v=spf1 include:resend.com ~all
DKIM : Clé fournie par Resend à configurer
DMARC : v=DMARC1; p=quarantine; rua=mailto:dmarc@domaine.com
```

#### Bonnes pratiques intégrées
- **Rate limiting** : max 50 emails/heure par utilisateur (évite le marquage spam)
- **Objets optimisés** : pas de mots spam (GRATUIT, URGENT, !!!)
- **Texte alternatif** : version texte automatique pour chaque email HTML
- **Unsubscribe** : lien de désinscription obligatoire (footer automatique)
- **Bounce handling** : marquage automatique des emails invalides

### Templates email fournis

#### Template 1 : Relance 3 jours (polie)
```
Objet : Votre devis {nom_artisan} - Est-ce que vous avez des questions ?

Bonjour {nom_client},

J'espère que vous avez bien reçu mon devis du {date_devis} concernant {projet}.

Je me permets de vous recontacter pour savoir si vous avez des questions ou besoin de précisions sur le montant de {montant_devis}€.

Je reste disponible par téléphone ou email.

Bien cordialement,
{signature_artisan}
```

#### Template 2 : Relance 7 jours (engagement)
```
Objet : {nom_artisan} - Puis-je compter sur vous pour ce chantier ?

Bonjour {nom_client},

Suite à mon devis du {date_devis}, je me permis de vous relancer.

Avez-vous pu étudier mon proposition à hauteur de {montant_devis}€ ?

Mon planning se remplit rapidement, je souhaitais savoir si vous souhaitez avancer sur ce projet.

À votre disposition pour en discuter.

{signature_artisan}
```

#### Template 3 : Relance 14 jours (dernière chance)
```
Objet : Derniers créneaux disponibles - {nom_artisan}

Bonjour {nom_client},

Je me permis une dernière relance concernant le devis du {date_devis} ({montant_devis}€).

Si vous n'êtes plus intéressé, pas de souci, je comprends tout à fait. Pouvez-vous juste me le confirmer afin que je libère mon planning ?

Si c'est toujours d'actualité, il me reste quelques créneaux ce mois-ci.

Bien à vous,
{signature_artisan}
```

---

## 15. Tableau de bord MVP

### Vue principale
```
┌────────────────────────────────────────────────────────────────────┐
│  RelanceClient IA                    [Tableau de bord] [Déconnexion]
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐ │
│  │ 12          │  │ 3 400€      │  │ 28%         │  │ 5         │ │
│  │ Prospects   │  │ CA Potentiel│  │ Conversion  │  │À relancer │ │
│  │ en cours    │  │ ce mois     │  │ ce mois     │  │ aujourd'hui│ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘ │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  Mes actions du jour                                       │   │
│  │  ──────────────────────────────────────────────────────    │   │
│  │  [ ] Martin Dupont - Devis 3500€ - J+7 - Générer relance   │   │
│  │  [ ] Sophie Bernard - Devis 2800€ - J+3 - Générer relance  │   │
│  │  [ ] Entreprise XYZ - Devis 5200€ - J+14 - Générer relance │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  Prospects récents              [+ Nouveau prospect]       │   │
│  │  ──────────────────────────────────────────────────────    │   │
│  │  Nom              Date       Montant    Statut    Action   │   │
│  │  ──────────────────────────────────────────────────────    │   │
│  │  Martin Dupont    18/04      3 500€    À relancer  [Voir]  │   │
│  │  Sophie Bernard   15/04      2 800€    Relancé     [Voir]  │   │
│  │  Entreprise XYZ   10/04      5 200€    Relancé     [Voir]  │   │
│  │  Jean Moreau      08/04      1 900€    Gagné       [Voir]  │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Indicateurs clés affichés

#### En-tête (cards)
| Indicateur | Calcul | Usage |
|------------|--------|-------|
| Prospects en cours | COUNT(prospects WHERE status IN ('to_contact', 'contacted', 'negotiating')) | Volume pipeline |
| CA Potentiel | SUM(quote_amount WHERE status IN ('to_contact', 'contacted', 'negotiating')) | Valeur pipeline |
| Taux de conversion | (COUNT(won) / COUNT(won + lost)) * 100 | Performance |
| À relancer aujourd'hui | COUNT(prospects WHERE next_reminder_date <= TODAY) | Actions urgentes |

#### Liste d'actions prioritaires
Tri par : date de relance la plus urgente  
Filtré sur : prospects avec next_reminder_date <= aujourd'hui  
Limité à : 5 éléments (voir tout = page prospects)

#### Graphique d'évolution (simple)
- Barres : Nombre de relances envoyées par semaine (4 dernières semaines)
- Ligne : Taux de conversion cumulé

---

## 16. Pricing

### Modèle économique
Abonnement SaaS mensuel avec essai gratuit, sans commission sur les devis gagnés.

### Plans proposés

#### Plan Starter - 19€/mois
**Pour :** Artisans débutant ou avec peu de volume  
- Jusqu'à 50 prospects actifs simultanés
- Relances email uniquement
- 3 templates de base (personnalisables)
- Tableau de bord simple
- Support email (48h)

#### Plan Pro - 39€/mois (RECOMMANDÉ)
**Pour :** Artisans actifs avec flux régulier  
- Prospects illimités
- Relances email + SMS (V2)
- Templates personnalisés illimités
- Suivi d'ouverture des emails
- Tableau de bord avancé avec prévisions
- Support prioritaire (24h)
- Export données (CSV, PDF)

#### Plan Entreprise - 79€/mois (V2)
**Pour :** Entreprises avec équipe commerciale
- Tout le plan Pro
- Multi-utilisateurs (jusqu'à 5)
- Intégrations API
- Onboarding personnalisé
- Support téléphonique

### Essai gratuit
- **14 jours** sans carte bancaire
- Accès complet au plan Pro
- Limite : 10 prospects maximum
- Pas de engagement, conversion automatique sur plan Starter si pas de choix

### Réductions
- **Annuel** : 2 mois offerts (équivalent -17%)
- **Parrainage** : 1 mois offert pour filleul converti

### Coûts cachés à anticiper
| Coût | Montant | Fréquence |
|------|---------|-----------|
| SendGrid/Resend (dépassement) | ~0.001€/email | Mensuel |
| Stripe (commission) | 0.5% + 0.25€/transaction | Par paiement |
| Hébergement Vercel | Gratuit (moins de 100GB) | Mensuel |
| Supabase | Gratuit (moins de 500k req/jour) | Mensuel |

---

## 17. Risques

### Risques techniques

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| **Emails en spam** | Élevée | Critique | Configuration DNS stricte, warm-up progressif, monitoring délivrabilité |
| **Temps de réponse API lent** | Moyenne | Moyen | Optimisation requêtes DB, indexation, pagination systématique |
| **Perte de données** | Faible | Critique | Backups automatiques Supabase, exports utilisateur réguliers |
| **Bug envoi email multiple** | Moyenne | Élevé | Tests E2E sur workflow d'envoi, rate limiting, logs exhaustifs |

### Risques métier

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| **Adoption faible** (artisan trop occupé pour saisir) | Élevée | Critique | Onboarding ultra-rapide, possibilité import CSV, templates pré-remplis |
| **Churn élevé** | Moyenne | Élevé | Suivi personnalisé premier mois, value realization rapide, features bloquantes |
| **Concurrence CRM** | Moyenne | Moyen | Focus artisan uniquement, UX simple, prix agressif |
| **Image négative** (spam perçu) | Moyenne | Élevé | Validation obligatoire, templates professionnels, opt-out clair |

### Risques juridiques

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| **Violation RGPD** | Faible | Critique | DPA signé, consentement explicite, droit à l'oubli implémenté |
| **Responsabilité si email inapproprié** | Moyenne | Moyen | CGU claires, validation utilisateur, exclusion de responsabilité |
| **Violation CNIL** (télémarketing) | Faible | Élevé | Pas de SMS non sollicité, consentement prospect, registre opposition respecté |

### Plan de contingence
- **Monitoring** : Alertes immédiates si taux de bounce >5% ou spam >1%
- **Support** : Réponse sous 4h en cas de problème critique (pas d'envoi)
- **Rollback** : Possibilité de restaurer DB en 15 minutes
- **Communication** : Template email prêt en cas d'incident

---

## 18. Roadmap 30 jours

### Semaine 1 : Fondations

#### Jour 1-2 : Setup technique
- [ ] Création projet Next.js + Supabase
- [ ] Configuration CI/CD (Vercel)
- [ ] Mise en place base de données (schéma SQL)
- [ ] Configuration auth Supabase
- [ ] Mise en place structure dossiers

#### Jour 3-4 : Authentification & Profil
- [ ] Page inscription / connexion
- [ ] Middleware de protection routes
- [ ] Page profil utilisateur
- [ ] Configuration email (SendGrid/Resend)

#### Jour 5-7 : CRUD Prospects
- [ ] Modèle de données Prospect
- [ ] API prospects (GET, POST, PATCH, DELETE)
- [ ] Liste des prospects (tableau)
- [ ] Formulaire création prospect
- [ ] Fiche détail prospect

**Livraison S1** : Connexion fonctionnelle, prospects créables et listables

---

### Semaine 2 : Relances & Templates

#### Jour 8-10 : Système de templates
- [ ] Modèle EmailTemplate
- [ ] 3 templates par défaut (3j, 7j, 14j)
- [ ] Interface édition templates
- [ ] Système de variables (nom, montant, date)

#### Jour 11-12 : Génération relances
- [ ] API génération relance
- [ ] Interface prévisualisation email
- [ ] Éditeur simple (textarea avec variables)
- [ ] Calcul automatique délai depuis devis

#### Jour 13-14 : Envoi emails
- [ ] Intégration Resend API
- [ ] API envoi relance (avec validation)
- [ ] Stockage historique relances
- [ ] Marquage prospect comme "relancé"

**Livraison S2** : Relances générables, éditables et envoyables

---

### Semaine 3 : Dashboard & UX

#### Jour 15-17 : Tableau de bord
- [ ] Calcul statistiques (taux conversion, CA potentiel)
- [ ] Vue "Actions du jour"
- [ ] Graphique simple d'évolution
- [ ] Design responsive mobile

#### Jour 18-19 : Onboarding
- [ ] Flow inscription guidé
- [ ] Tutoriel interactif (prospect fictif)
- [ ] Emails transactionnels (welcome, rappel essai)
- [ ] Page configuration initiale

#### Jour 20-21 : Polish & Tests
- [ ] Tests utilisateur (3 artisans beta)
- [ ] Corrections bugs mineurs
- [ ] Optimisation perfs (chargement < 2s)
- [ ] Copywriting final (titres, labels, messages)

**Livraison S3** : Application complète et testable

---

### Semaine 4 : Préparation lancement

#### Jour 22-24 : Tests & Sécurité
- [ ] Tests end-toend (Playwright ou Cypress)
- [ ] Audit sécurité basique (headers, XSS)
- [ ] Tests délivrabilité email (Mail-tester)
- [ ] Validation RGPD (mentions légales, CGU)

#### Jour 25-26 : Paiement & Subscription
- [ ] Intégration Stripe
- [ ] Page pricing
- [ ] Gestion essai gratuit (14 jours)
- [ ] Redirection post-essai

#### Jour 27-28 : Landing page
- [ ] Landing page vitrine
- [ ] Formulaire inscription beta
- [ ] Captures d'écran / démo
- [ ] FAQ basique

#### Jour 29-30 : Lancement beta
- [ ] Déploiement production
- [ ] Invitation 10 artisans beta
- [ ] Collecte feedbacks
- [ ] Hotfixes urgents

**Livraison S4** : MVP en ligne, prêt pour beta privée

---

## 19. Critères de réussite

### Critères techniques (seuils minimum)
| Critère | Seuil | Mesure |
|---------|-------|--------|
| Temps de chargement page | < 2 secondes | Lighthouse / WebPageTest |
| Uptime | > 99.5% | Vercel Analytics |
| Taux délivrabilité emails | > 95% | Resend analytics |
| Bugs critiques | 0 | Issue tracker |
| Couverture tests | > 60% | Jest coverage |

### Critères produit (validation marché)
| Critère | Seuil | Timeline |
|---------|-------|----------|
| Artisans inscrits beta | 10 | J30 |
| Prospects créés | 100 | J60 |
| Relances envoyées | 200 | J60 |
| Taux conversion beta → payant | > 30% | J90 |
| NPS beta testers | > 40 | J60 |

### Critères business (viabilité)
| Critère | Seuil | Timeline |
|---------|-------|----------|
| Premier client payant | 1 | J45 |
| MRR (revenu mensuel) | 200€ | J90 |
| CAC (coût acquisition) | < 50€ | J120 |
| Churn mensuel | < 10% | J120 |
| LTV/CAC ratio | > 3 | J180 |

### Critères d'arrêt (pivot ou abandon)
| Situation | Décision |
|-----------|----------|
| < 5 inscrits beta après 30 jours de prospection active | Pivot sur proposition de valeur |
| Taux délivrabilité < 80% malgré corrections | Changement provider email ou pivot technique |
| 0 conversion payante après 60 jours | Abaissement prix ou pivot modèle éco |
| Retour utilisateurs : "pas le temps de saisir" | Pivot vers intégration automatisée |

---

## 20. Prompt Codex pour développer le MVP

```
Tu es un développeur full-stack expert Next.js 14 et TypeScript.
Tu dois développer le MVP de "RelanceClient IA", un SaaS de relance de devis pour artisans.

CONTEXTE PRODUIT :
- Application web permettant aux artisans de suivre leurs prospects et envoyer des relances email
- MVP ultra-simple : pas d'IA complexe, juste des templates personnalisables
- Validation humaine obligatoire avant chaque envoi d'email (principe fondamental)

STACK TECHNIQUE OBLIGATOIRE :
- Frontend : Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- Backend : Next.js API Routes
- Base de données : Supabase (PostgreSQL)
- Auth : Supabase Auth
- Emails : Resend (utilise le SDK @resend/email)
- ORM : Prisma

STRUCTURE DES DOSSIERS ATTENDUE :
```
app/
  (auth)/
    login/page.tsx
    register/page.tsx
  (dashboard)/
    dashboard/page.tsx
    prospects/page.tsx
    prospects/new/page.tsx
    prospects/[id]/page.tsx
    reminders/page.tsx
    settings/page.tsx
  api/
    auth/[...nextauth]/route.ts
    prospects/route.ts
    prospects/[id]/route.ts
    reminders/route.ts
    reminders/send/route.ts
    dashboard/stats/route.ts
components/
  ui/           # shadcn components
  prospects/    # composants spécifiques
  reminders/
  dashboard/
lib/
  supabase.ts
  prisma.ts
  resend.ts
prisma/
  schema.prisma
```

FONCTIONNALITÉS À IMPLÉMENTER (dans l'ordre) :

PHASE 1 - AUTH & SETUP (Priorité P0)
1. Configuration Supabase avec tables users, prospects, reminders, email_templates
2. Système d'authentification (inscription, connexion, déconnexion)
3. Middleware de protection des routes
4. Page profil utilisateur (nom entreprise, email, signature)

PHASE 2 - CRUD PROSPECTS (Priorité P0)
5. Modèle Prisma Prospect avec champs : id, userId, name, email, phone, quoteAmount, quoteDate, status, notes, createdAt
6. API prospects : GET (liste), POST (création), PATCH (modification), DELETE
7. Page liste des prospects avec tableau triable
8. Formulaire création prospect (champs : nom, email, téléphone, montant, date, notes)
9. Fiche détail prospect avec historique

PHASE 3 - TEMPLATES & RELANCES (Priorité P0)
10. Modèle EmailTemplate avec 3 templates par défaut (delay: 3j, 7j, 14j)
11. Système de variables : {{client_name}}, {{quote_amount}}, {{quote_date}}, {{company_name}}
12. API génération relance : reçoit prospect_id + template_id, retourne email généré
13. Interface prévisualisation email avec éditeur textarea
14. API envoi via Resend (POST /api/reminders/send)
15. Stockage historique des relances envoyées

PHASE 4 - DASHBOARD (Priorité P1)
16. API stats : nombre prospects, CA potentiel, taux conversion
17. Liste "Actions du jour" : prospects à relancer (quoteDate + delay <= aujourd'hui)
18. Cards indicateurs clés en haut de page

RÈGLES STRICTES :
- Utilise toujours Row Level Security (RLS) de Supabase pour filtrer par user_id
- Validation Zod sur toutes les API
- Pas d'envoi email automatique : toujours une validation manuelle via interface
- Emails transactionnels uniquement (pas de marketing)
- Design responsive avec Tailwind
- Composants UI via shadcn/ui (button, input, card, table, dialog, select)
- Gestion d'erreurs avec messages utilisateur clairs
- Loading states sur toutes les actions asynchrones

DONNÉES DE TEST À CRÉER :
- User : test@artisan.fr / password123
- 5 prospects fictifs avec différents statuts
- 3 templates de relance (voir cahier des charges section 14)

LIVRABLE ATTENDU :
Code source complet fonctionnel avec README expliquant :
1. Variables d'environnement requises
2. Commandes setup (npm install, prisma migrate, etc.)
3. Lancement en local (npm run dev)
4. Structure des fichiers

Commence par créer le fichier prisma/schema.prisma avec les modèles complets.
```

---

**Document créé le** : $(date +%d/%m/%Y)  
**Projet** : RelanceClient IA  
**Version** : MVP 1.0  
**Prochaine étape** : Développement selon Roadmap 30 jours
