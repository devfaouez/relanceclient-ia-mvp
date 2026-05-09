import type { Trade, ReminderTone } from "@prisma/client";

export const REMINDER_PROMPT_VERSION = "reminder-v1";

const TRADE_LABELS: Record<Trade, string> = {
  PLOMBIER: "plombier",
  ELECTRICIEN: "électricien",
  MACON: "maçon",
  CARRELEUR: "carreleur",
  MENUISIER: "menuisier",
  PEINTRE: "peintre",
  PAYSAGISTE: "paysagiste",
  CHAUFFAGISTE: "chauffagiste",
  COUVREUR: "couvreur",
  AUTRE: "artisan",
};

const TONE_INSTRUCTIONS: Record<ReminderTone, string> = {
  FORMAL:
    "Ton très formel, vouvoiement strict, formules de politesse complètes (« Madame, Monsieur », « Je vous prie d'agréer »).",
  PROFESSIONAL:
    "Ton professionnel et neutre, vouvoiement, formules courtes mais polies (« Bonjour », « Cordialement »).",
  FRIENDLY:
    "Ton chaleureux et accessible, vouvoiement par défaut, peut être plus chaleureux si l'historique le justifie.",
  DIRECT:
    "Ton direct et factuel, phrases courtes, va droit au but, vouvoiement simple.",
};

export interface ReminderPromptContext {
  businessName: string | null;
  trade: Trade | null;
  signatureBlock: string | null;
  tone: ReminderTone;

  prospectName: string;
  prospectCompany: string | null;

  quoteTitle: string;
  quoteNumber: string | null;
  quoteAmount: string | null;
  currency: string;
  quoteSentAt: Date | null;

  iteration: number;
  daysSinceLastContact: number | null;
  previousReminders: Array<{ subject: string; sentAt: Date }>;

  userNote: string | null;
}

export function buildReminderPrompt(ctx: ReminderPromptContext): {
  system: string;
  user: string;
} {
  const tradeLabel = ctx.trade ? TRADE_LABELS[ctx.trade] : "artisan";

  const system = `Tu es l'assistant rédactionnel d'un ${tradeLabel} français qui utilise un outil de suivi de devis appelé RelanceClient IA.

Ta mission : rédiger un email de relance commerciale court, professionnel et adapté au contexte, à destination d'un prospect qui n'a pas répondu à un devis.

Règles strictes que tu respectes toujours :
- Tu écris en français de France, sans anglicismes inutiles.
- Tu ne mens jamais sur le contexte. Tu n'inventes pas de fait, de date, de produit ou de prix qui ne soit pas explicitement dans les données fournies.
- Tu ne mets pas de pression agressive, pas de fausse urgence ("offre limitée", "dernière chance" sauf si c'est la 3ème relance).
- ${TONE_INSTRUCTIONS[ctx.tone]}
- Le message doit faire entre 80 et 180 mots maximum. Court et lisible sur mobile.
- Tu commences par une formule d'ouverture, tu rappelles le devis brièvement, tu invites à répondre, tu finis par une formule de politesse.
- Tu ne mets PAS de signature personnalisée si elle n'est pas fournie. Tu termines par "Cordialement," seulement.
- Tu ne mets PAS d'emoji.
- Tu adaptes l'intensité selon le numéro d'itération :
  * Itération 1 : posée, courtoise, simple rappel
  * Itération 2 : un peu plus directe, propose un échange téléphonique
  * Itération 3+ : claire sur le fait que c'est la dernière relance, propose d'archiver le dossier si pas de retour

Tu réponds UNIQUEMENT au format JSON valide avec exactement ces deux clés :
{
  "subject": "objet de l'email, max 70 caractères",
  "body": "corps de l'email en texte brut, sauts de ligne avec \\n"
}

Aucun texte avant ou après le JSON.`;

  const previousRemindersText =
    ctx.previousReminders.length > 0
      ? ctx.previousReminders
          .map(
            (r, i) =>
              `  - Relance ${i + 1} envoyée le ${r.sentAt.toLocaleDateString("fr-FR")} : "${r.subject}"`
          )
          .join("\n")
      : "  Aucune relance précédente.";

  const user = `Contexte de la relance à rédiger :

Émetteur :
  Entreprise : ${ctx.businessName ?? "(non renseigné)"}
  Métier : ${tradeLabel}

Destinataire :
  Nom : ${ctx.prospectName}
  Société : ${ctx.prospectCompany ?? "(non renseignée)"}

Devis concerné :
  Intitulé : ${ctx.quoteTitle}
  Numéro : ${ctx.quoteNumber ?? "(non numéroté)"}
  Montant : ${ctx.quoteAmount ? `${ctx.quoteAmount} ${ctx.currency}` : "(montant non communiqué dans la relance)"}
  Envoyé le : ${ctx.quoteSentAt ? ctx.quoteSentAt.toLocaleDateString("fr-FR") : "(date non renseignée)"}

Itération : c'est la relance numéro ${ctx.iteration}.
${ctx.daysSinceLastContact !== null ? `Dernier contact il y a ${ctx.daysSinceLastContact} jours.` : ""}

Historique des relances précédentes :
${previousRemindersText}
${ctx.userNote ? `\nNote ajoutée par l'utilisateur (à intégrer naturellement) :\n  ${ctx.userNote}` : ""}

Génère le JSON.`;

  return { system, user };
}
