export const PROSPECT_STATUS_LABELS: Record<string, string> = {
  NEW: "Nouveau",
  CONTACTED: "Contacté",
  QUALIFIED: "Qualifié",
  WON: "Gagné",
  LOST: "Perdu",
  ARCHIVED: "Archivé",
};

export const QUOTE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  SENT: "Envoyé",
  ACCEPTED: "Accepté",
  REJECTED: "Refusé",
  EXPIRED: "Expiré",
  CANCELLED: "Annulé",
};

export const REMINDER_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  PENDING_APPROVAL: "À approuver",
  APPROVED: "Approuvée",
  SCHEDULED: "Programmée",
  SENT: "Envoyée",
  CANCELLED: "Annulée",
  FAILED: "Échec",
};

export const TEMPLATE_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Actif",
  INACTIVE: "Inactif",
  ARCHIVED: "Archivé",
};

export const TRADE_LABELS: Record<string, string> = {
  PLOMBIER: "Plombier",
  ELECTRICIEN: "Électricien",
  MACON: "Maçon",
  CARRELEUR: "Carreleur",
  MENUISIER: "Menuisier",
  PEINTRE: "Peintre",
  PAYSAGISTE: "Paysagiste",
  CHAUFFAGISTE: "Chauffagiste",
  COUVREUR: "Couvreur",
  AUTRE: "Autre",
};

export const REMINDER_TONE_LABELS: Record<string, string> = {
  FORMAL: "Formel",
  PROFESSIONAL: "Professionnel",
  FRIENDLY: "Chaleureux",
  DIRECT: "Direct",
};

export function prospectStatusLabel(status: string) {
  return PROSPECT_STATUS_LABELS[status] ?? status;
}

export function quoteStatusLabel(status: string) {
  return QUOTE_STATUS_LABELS[status] ?? status;
}

export function reminderStatusLabel(status: string) {
  return REMINDER_STATUS_LABELS[status] ?? status;
}

export function templateStatusLabel(status: string) {
  return TEMPLATE_STATUS_LABELS[status] ?? status;
}

export function tradeLabel(trade: string) {
  return TRADE_LABELS[trade] ?? trade;
}

export function reminderToneLabel(tone: string) {
  return REMINDER_TONE_LABELS[tone] ?? tone;
}
