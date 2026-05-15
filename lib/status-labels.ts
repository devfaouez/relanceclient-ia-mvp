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

export function prospectStatusLabel(status: string) {
  return PROSPECT_STATUS_LABELS[status] ?? status;
}

export function quoteStatusLabel(status: string) {
  return QUOTE_STATUS_LABELS[status] ?? status;
}

export function reminderStatusLabel(status: string) {
  return REMINDER_STATUS_LABELS[status] ?? status;
}
