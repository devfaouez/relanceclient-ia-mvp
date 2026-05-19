/* eslint-disable jsx-a11y/alt-text */
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

type Prospect = {
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
};

type QuoteLine = {
  id: string;
  description: string;
  quantity: unknown;
  unitPrice: unknown;
  sortOrder: number;
};

type Quote = {
  id: string;
  quoteNumber: string | null;
  title: string;
  amount: unknown;
  currency: string;
  status: string;
  validUntil: Date | null;
  legalNotice: string | null;
  paymentTerms: string | null;
  createdAt: Date;
  prospect: Prospect;
  lines: QuoteLine[];
};

type Preferences = {
  businessName: string | null;
  logoUrl: string | null;
  companyAddress: string | null;
  companyPhone: string | null;
  companyEmail: string | null;
  companyWebsite: string | null;
  quoteFooter: string | null;
} | null;

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    color: "#0f172a",
    fontFamily: "Helvetica",
    lineHeight: 1.35,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 18,
    marginBottom: 20,
  },
  companyBlock: {
    flex: 1,
  },
  quoteBlock: {
    width: 170,
    alignItems: "flex-end",
    paddingTop: 2,
  },
  logo: {
    width: 120,
    height: 54,
    objectFit: "contain",
    marginBottom: 12,
  },
  companyName: {
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 8,
  },
  muted: {
    color: "#475569",
  },
  detailLine: {
    color: "#475569",
    marginTop: 2,
  },
  quoteTitle: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "right",
    letterSpacing: 0.8,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 2,
  },
  metaLabel: {
    color: "#64748b",
    fontSize: 9,
  },
  metaValue: {
    color: "#0f172a",
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "right",
  },
  status: {
    marginTop: 6,
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 8,
    paddingRight: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    fontSize: 9,
    textAlign: "center",
    color: "#334155",
    fontWeight: "bold",
  },
  sectionRow: {
    flexDirection: "row",
    gap: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 20,
    marginBottom: 22,
  },
  half: {
    flex: 1,
  },
  infoCard: {
    flex: 1,
    padding: 14,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  bold: {
    fontWeight: "bold",
  },
  table: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#eef2f7",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  tableHeaderText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#334155",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  tableRowLast: {
    flexDirection: "row",
  },
  cellDescription: {
    flex: 4,
    padding: 10,
  },
  cellSmall: {
    flex: 1,
    padding: 10,
    textAlign: "right",
  },
  emptyText: {
    padding: 12,
    color: "#64748b",
    fontStyle: "italic",
  },
  totalBox: {
    marginTop: 18,
    marginLeft: "auto",
    width: 210,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 14,
    paddingRight: 14,
    backgroundColor: "#0f172a",
    color: "#ffffff",
    borderRadius: 6,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 13,
    fontWeight: "bold",
  },
  totalLabel: {
    color: "#cbd5e1",
    fontSize: 10,
    textTransform: "uppercase",
  },
  terms: {
    flexDirection: "row",
    gap: 18,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 18,
    marginTop: 24,
  },
  termsBlock: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 14,
    marginTop: 24,
    fontSize: 8,
    color: "#64748b",
    lineHeight: 1.4,
  },
});

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  SENT: "Envoyé",
  ACCEPTED: "Accepté",
  REJECTED: "Refusé",
  EXPIRED: "Expiré",
  CANCELLED: "Annulé",
};

function toNumber(value: unknown) {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function fmtDate(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("fr-FR").format(date);
}

function fmtAmount(amount: number, currency: string) {
  const sign = amount < 0 ? "-" : "";
  const [integerPart, decimalPart] = Math.abs(amount).toFixed(2).split(".");
  const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const currencyLabel = currency === "EUR" ? "€" : currency;

  return `${sign}${groupedInteger},${decimalPart} ${currencyLabel}`;
}

function cleanText(value: string | null | undefined) {
  const text = value?.trim();
  return text ? text : null;
}

function isPdfCompatibleLogoUrl(value: string | null | undefined) {
  const logoUrl = cleanText(value);
  if (!logoUrl) return false;

  if (/^data:image\/(png|jpe?g|webp);base64,/i.test(logoUrl)) {
    return true;
  }

  if (!/^https?:\/\//i.test(logoUrl)) {
    return false;
  }

  try {
    const url = new URL(logoUrl);
    return !/\.(svg|gif|avif)$/i.test(url.pathname);
  } catch {
    return false;
  }
}

function getLines(quote: Quote) {
  if (quote.lines.length > 0) {
    return quote.lines.map((line) => {
      const quantity = toNumber(line.quantity);
      const unitPrice = toNumber(line.unitPrice);

      return {
        id: line.id,
        description: line.description,
        quantity,
        unitPrice,
        total: quantity * unitPrice,
      };
    });
  }

  const amount = toNumber(quote.amount);

  return [
    {
      id: "fallback",
      description: quote.title,
      quantity: 1,
      unitPrice: amount,
      total: amount,
    },
  ];
}

export function QuotePdfDocument({
  quote,
  preferences,
}: {
  quote: Quote;
  preferences: Preferences;
}) {
  const lines = getLines(quote);
  const total = lines.reduce((sum, line) => sum + line.total, 0);
  const logoUrl = isPdfCompatibleLogoUrl(preferences?.logoUrl)
    ? cleanText(preferences?.logoUrl)
    : null;
  const businessName = cleanText(preferences?.businessName) ?? "Entreprise";
  const companyAddress = cleanText(preferences?.companyAddress);
  const companyPhone = cleanText(preferences?.companyPhone);
  const companyEmail = cleanText(preferences?.companyEmail);
  const companyWebsite = cleanText(preferences?.companyWebsite);
  const quoteFooter = cleanText(preferences?.quoteFooter);
  const prospectCompany = cleanText(quote.prospect.company);
  const prospectEmail = cleanText(quote.prospect.email);
  const prospectPhone = cleanText(quote.prospect.phone);
  const paymentTerms = cleanText(quote.paymentTerms);
  const legalNotice = cleanText(quote.legalNotice);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.companyBlock}>
            {logoUrl ? (
              <Image src={logoUrl} style={styles.logo} />
            ) : null}

            <Text style={styles.companyName}>{businessName}</Text>

            {companyAddress && (
              <Text style={styles.detailLine}>{companyAddress}</Text>
            )}
            {companyPhone && (
              <Text style={styles.detailLine}>Tél. : {companyPhone}</Text>
            )}
            {companyEmail && (
              <Text style={styles.detailLine}>Email : {companyEmail}</Text>
            )}
            {companyWebsite && (
              <Text style={styles.detailLine}>Site : {companyWebsite}</Text>
            )}
          </View>

          <View style={styles.quoteBlock}>
            <Text style={styles.quoteTitle}>DEVIS</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Numéro</Text>
              <Text style={styles.metaValue}>
                {quote.quoteNumber ?? quote.id.slice(0, 8)}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Créé le</Text>
              <Text style={styles.metaValue}>{fmtDate(quote.createdAt)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Validité</Text>
              <Text style={styles.metaValue}>{fmtDate(quote.validUntil)}</Text>
            </View>
            <Text style={styles.status}>
              {STATUS_LABELS[quote.status] ?? quote.status}
            </Text>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <View style={styles.infoCard}>
            <Text style={styles.sectionLabel}>Client</Text>
            <Text style={styles.bold}>{quote.prospect.name}</Text>
            {prospectCompany && <Text style={styles.detailLine}>{prospectCompany}</Text>}
            {prospectEmail && <Text style={styles.detailLine}>{prospectEmail}</Text>}
            {prospectPhone && <Text style={styles.detailLine}>{prospectPhone}</Text>}
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.sectionLabel}>Objet du devis</Text>
            <Text style={styles.bold}>{quote.title}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.cellDescription, styles.tableHeaderText]}>
              Désignation
            </Text>
            <Text style={[styles.cellSmall, styles.tableHeaderText]}>Qté</Text>
            <Text style={[styles.cellSmall, styles.tableHeaderText]}>
              P.U.
            </Text>
            <Text style={[styles.cellSmall, styles.tableHeaderText]}>Total</Text>
          </View>

          {lines.length > 0 ? (
            lines.map((line, index) => (
              <View
                key={line.id}
                style={
                  index === lines.length - 1
                    ? styles.tableRowLast
                    : styles.tableRow
                }
              >
                <Text style={styles.cellDescription}>{line.description}</Text>
                <Text style={styles.cellSmall}>{line.quantity}</Text>
                <Text style={styles.cellSmall}>
                  {fmtAmount(line.unitPrice, quote.currency)}
                </Text>
                <Text style={styles.cellSmall}>
                  {fmtAmount(line.total, quote.currency)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Aucune ligne renseignée.</Text>
          )}
        </View>

        <View style={styles.totalBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text>{fmtAmount(total, quote.currency)}</Text>
          </View>
        </View>

        {(paymentTerms || legalNotice) && (
          <View style={styles.terms}>
            {paymentTerms && (
              <View style={styles.termsBlock}>
                <Text style={styles.sectionLabel}>Conditions de paiement</Text>
                <Text style={styles.muted}>{paymentTerms}</Text>
              </View>
            )}

            {legalNotice && (
              <View style={styles.termsBlock}>
                <Text style={styles.sectionLabel}>Mentions légales</Text>
                <Text style={styles.muted}>{legalNotice}</Text>
              </View>
            )}
          </View>
        )}

        {quoteFooter && <Text style={styles.footer}>{quoteFooter}</Text>}
      </Page>
    </Document>
  );
}
