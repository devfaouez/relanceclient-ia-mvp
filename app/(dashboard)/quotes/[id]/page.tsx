"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Prospect = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
};

type Quote = {
  id: string;
  prospectId: string;
  quoteNumber: string | null;
  title: string;
  amount: string | null;
  currency: string;
  status: string;
  createdAt: string;
  prospect: Prospect;
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

type QuoteResponse = {
  quote: Quote;
  preferences: Preferences;
};

const QUOTE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  SENT: "Envoyé",
  ACCEPTED: "Accepté",
  REJECTED: "Refusé",
  EXPIRED: "Expiré",
  CANCELLED: "Annulé",
};

function fmtDate(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR");
}

function fmtAmount(amount: string | null, currency: string) {
  if (!amount) return "—";

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
  }).format(Number(amount));
}

export default function QuotePreviewPage({
  params,
}: {
  params: { id: string };
}) {
  const [data, setData] = useState<QuoteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/quotes/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Devis introuvable");
        return res.json() as Promise<QuoteResponse>;
      })
      .then(setData)
      .catch((error: Error) => setPageError(error.message))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <section>
        <p className="text-sm text-muted-foreground">Chargement du devis…</p>
      </section>
    );
  }

  if (pageError || !data) {
    return (
      <section>
        <p className="text-sm text-destructive">
          {pageError ?? "Devis introuvable"}
        </p>
        <Link
          href="/prospects"
          className="mt-4 inline-block text-sm underline hover:text-foreground"
        >
          ← Retour aux prospects
        </Link>
      </section>
    );
  }

  const { quote, preferences } = data;
  const prospect = quote.prospect;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href={`/prospects/${quote.prospectId}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Retour au prospect
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">Prévisualisation du devis</h1>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Imprimer
        </button>
      </div>

      <div className="mx-auto max-w-4xl rounded-xl border bg-white p-8 text-slate-950 shadow-sm print:border-0 print:shadow-none">
        <div className="flex items-start justify-between gap-8 border-b pb-8">
          <div>
            {preferences?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preferences.logoUrl}
                alt="Logo entreprise"
                className="mb-4 max-h-20 max-w-48 object-contain"
              />
            ) : null}

            <h2 className="text-xl font-bold">
              {preferences?.businessName ?? "Entreprise"}
            </h2>

            <div className="mt-3 space-y-1 whitespace-pre-line text-sm text-slate-600">
              {preferences?.companyAddress && <p>{preferences.companyAddress}</p>}
              {preferences?.companyPhone && <p>Tél. : {preferences.companyPhone}</p>}
              {preferences?.companyEmail && <p>Email : {preferences.companyEmail}</p>}
              {preferences?.companyWebsite && <p>Site : {preferences.companyWebsite}</p>}
            </div>
          </div>

          <div className="text-right">
            <p className="text-3xl font-bold uppercase tracking-wide">Devis</p>
            <p className="mt-2 text-sm text-slate-600">
              N° {quote.quoteNumber ?? quote.id.slice(0, 8)}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Date : {fmtDate(quote.createdAt)}
            </p>
            <p className="mt-3 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">
              {QUOTE_STATUS_LABELS[quote.status] ?? quote.status}
            </p>
          </div>
        </div>

        <div className="grid gap-8 border-b py-8 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Client
            </h3>
            <div className="mt-3 space-y-1 text-sm">
              <p className="font-semibold">{prospect.name}</p>
              {prospect.company && <p>{prospect.company}</p>}
              {prospect.email && <p>{prospect.email}</p>}
              {prospect.phone && <p>{prospect.phone}</p>}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Objet du devis
            </h3>
            <p className="mt-3 text-sm font-medium">{quote.title}</p>
          </div>
        </div>

        <div className="py-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left">
                <th className="px-4 py-3 font-semibold">Désignation</th>
                <th className="px-4 py-3 text-right font-semibold">Montant</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="px-4 py-4">{quote.title}</td>
                <td className="px-4 py-4 text-right font-medium">
                  {fmtAmount(quote.amount, quote.currency)}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-xs rounded-lg bg-slate-50 p-4">
              <div className="flex justify-between text-sm">
                <span>Total</span>
                <span className="font-bold">
                  {fmtAmount(quote.amount, quote.currency)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {preferences?.quoteFooter && (
          <div className="border-t pt-6 text-xs leading-relaxed text-slate-500 whitespace-pre-line">
            {preferences.quoteFooter}
          </div>
        )}
      </div>
    </section>
  );
}
