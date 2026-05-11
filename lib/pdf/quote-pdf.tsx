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
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 20,
    marginBottom: 24,
  },
  logo: {
    maxWidth: 140,
    maxHeight: 60,
    marginBottom: 10,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  muted: {
    color: "#475569",
    lineHeight: 1.4,
  },
  quoteTitle: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "right",
    marginBottom: 8,
  },
  status: {
    marginTop: 8,
    padding: 6,
    backgroundColor: "#f1f5f9",
    fontSize: 9,
    textAlign: "center",
  },
  sectionRow: {
    flexDirection: "row",
    gap: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 20,
    marginBottom: 24,
  },
  half: {
    flex: 1,
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
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  cellDescription: {
    flex: 4,
    padding: 8,
  },
  cellSmall: {
    flex: 1,
    padding: 8,
    textAlign: "right",
  },
  totalBox: {
    marginTop: 18,
    marginLeft: "auto",
    width: 180,
    padding: 12,
    backgroundColor: "#f8fafc",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 12,
    fontWeight: "bold",
  },
  terms: {
    flexDirection: "row",
    gap: 24,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 18,
    marginTop: 24,
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
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
  }).format(amount);
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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            {preferences?.logoUrl ? (
              <Image src={preferences.logoUrl} style={styles.logo} />
            ) : null}

            <Text style={styles.companyName}>
              {preferences?.businessName ?? "Entreprise"}
            </Text>

            {preferences?.companyAddress && (
              <Text style={styles.muted}>{preferences.companyAddress}</Text>
            )}
            {preferences?.companyPhone && (
              <Text style={styles.muted}>Tél. : {preferences.companyPhone}</Text>
            )}
            {preferences?.companyEmail && (
              <Text style={styles.muted}>Email : {preferences.companyEmail}</Text>
            )}
            {preferences?.companyWebsite && (
              <Text style={styles.muted}>Site : {preferences.companyWebsite}</Text>
            )}
          </View>

          <View>
            <Text style={styles.quoteTitle}>DEVIS</Text>
            <Text style={styles.muted}>
              N° {quote.quoteNumber ?? quote.id.slice(0, 8)}
            </Text>
            <Text style={styles.muted}>Date : {fmtDate(quote.createdAt)}</Text>
            <Text style={styles.muted}>
              Valable jusqu’au : {fmtDate(quote.validUntil)}
            </Text>
            <Text style={styles.status}>
              {STATUS_LABELS[quote.status] ?? quote.status}
            </Text>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <View style={styles.half}>
            <Text style={styles.sectionLabel}>Client</Text>
            <Text style={styles.bold}>{quote.prospect.name}</Text>
            {quote.prospect.company && <Text>{quote.prospect.company}</Text>}
            {quote.prospect.email && <Text>{quote.prospect.email}</Text>}
            {quote.prospect.phone && <Text>{quote.prospect.phone}</Text>}
          </View>

          <View style={styles.half}>
            <Text style={styles.sectionLabel}>Objet du devis</Text>
            <Text style={styles.bold}>{quote.title}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.cellDescription}>Désignation</Text>
            <Text style={styles.cellSmall}>Qté</Text>
            <Text style={styles.cellSmall}>Prix unitaire</Text>
            <Text style={styles.cellSmall}>Total</Text>
          </View>

          {lines.map((line) => (
            <View key={line.id} style={styles.tableRow}>
              <Text style={styles.cellDescription}>{line.description}</Text>
              <Text style={styles.cellSmall}>{line.quantity}</Text>
              <Text style={styles.cellSmall}>
                {fmtAmount(line.unitPrice, quote.currency)}
              </Text>
              <Text style={styles.cellSmall}>
                {fmtAmount(line.total, quote.currency)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totalBox}>
          <View style={styles.totalRow}>
            <Text>Total</Text>
            <Text>{fmtAmount(total, quote.currency)}</Text>
          </View>
        </View>

        {(quote.paymentTerms || quote.legalNotice) && (
          <View style={styles.terms}>
            {quote.paymentTerms && (
              <View style={styles.half}>
                <Text style={styles.sectionLabel}>Conditions de paiement</Text>
                <Text style={styles.muted}>{quote.paymentTerms}</Text>
              </View>
            )}

            {quote.legalNotice && (
              <View style={styles.half}>
                <Text style={styles.sectionLabel}>Mentions légales</Text>
                <Text style={styles.muted}>{quote.legalNotice}</Text>
              </View>
            )}
          </View>
        )}

        {preferences?.quoteFooter && (
          <Text style={styles.footer}>{preferences.quoteFooter}</Text>
        )}
      </Page>
    </Document>
  );
}
