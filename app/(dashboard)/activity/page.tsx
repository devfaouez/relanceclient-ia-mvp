"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, FileText, Mail, UserRound } from "lucide-react";
import { formatDateTime } from "@/lib/formatters";

type ActivityEntityType = "prospect" | "quote" | "reminder";

type ActivityEvent = {
  id: string;
  type: string;
  title: string;
  description: string;
  date: string;
  href?: string;
  entityType: ActivityEntityType;
  entityId: string;
};

type ActivityFilter = "ALL" | ActivityEntityType;

const filters: { value: ActivityFilter; label: string }[] = [
  { value: "ALL", label: "Tous" },
  { value: "prospect", label: "Prospects" },
  { value: "quote", label: "Devis" },
  { value: "reminder", label: "Relances" },
];

const typeLabels: Record<string, string> = {
  prospect_created: "Prospect créé",
  quote_created: "Devis créé",
  quote_sent: "Devis envoyé",
  quote_accepted: "Devis accepté",
  quote_rejected: "Devis refusé",
  quote_cancelled: "Devis annulé",
  reminder_created: "Relance créée",
  reminder_scheduled: "Relance programmée",
  reminder_sent: "Relance envoyée",
  reminder_failed: "Relance en échec",
};

function activityDotClassName(type: string) {
  if (type === "reminder_failed" || type === "quote_rejected") {
    return "relative mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-destructive bg-card";
  }

  if (type === "quote_accepted" || type === "reminder_sent") {
    return "relative mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-emerald-600 bg-card";
  }

  if (type === "reminder_scheduled") {
    return "relative mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-amber-500 bg-card";
  }

  return "relative mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-primary bg-card";
}

export default function ActivityPage() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ActivityFilter>("ALL");

  useEffect(() => {
    fetch("/api/activity")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Erreur lors du chargement de l'activité");
        }

        return res.json() as Promise<ActivityEvent[]>;
      })
      .then(setEvents)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredEvents = useMemo(() => {
    const filtered =
      filter === "ALL"
        ? events
        : events.filter((event) => event.entityType === filter);

    return [...filtered].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [events, filter]);

  const summaryCards = useMemo(
    () => [
      {
        label: "Prospects",
        value: events.filter((event) => event.entityType === "prospect").length,
        icon: UserRound,
      },
      {
        label: "Devis",
        value: events.filter((event) => event.entityType === "quote").length,
        icon: FileText,
      },
      {
        label: "Relances",
        value: events.filter((event) => event.entityType === "reminder").length,
        icon: Mail,
      },
    ],
    [events],
  );

  return (
    <section className="space-y-[22px]">
      <div className="grid gap-4 sm:grid-cols-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="rounded-2xl border border-border bg-card p-5 shadow-[var(--surface-shadow)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[13px] font-medium text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="mt-2 text-[30px] font-bold leading-none text-primary">
                    {card.value}
                  </p>
                </div>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[13px] border border-[hsl(var(--emerald-soft))] bg-[hsl(var(--emerald-tint))] text-primary">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card px-5 py-[22px] shadow-[var(--surface-shadow)] lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Filtrer l&apos;historique</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Consultez les événements commerciaux par type d&apos;objet.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
          {!loading && !error && (
            <p className="rounded-full border border-[hsl(var(--emerald-soft))] bg-[hsl(var(--emerald-tint))] px-3 py-1.5 text-xs font-semibold text-primary">
              {filteredEvents.length} événement
              {filteredEvents.length > 1 ? "s" : ""} affiché
              {filteredEvents.length > 1 ? "s" : ""}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {filters.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={
                  filter === item.value
                    ? "rounded-full bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--surface-shadow)]"
                    : "rounded-full border border-input bg-card px-3.5 py-2 text-sm font-semibold shadow-[var(--surface-shadow)] transition hover:border-primary hover:text-primary"
                }
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <p className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground shadow-[var(--surface-shadow)]">
          Chargement…
        </p>
      )}

      {error && (
        <p className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      {!loading && !error && events.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-[hsl(var(--emerald-tint))]/60 px-5 py-10 text-center shadow-[var(--surface-shadow)]">
          <CalendarClock className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">
            Aucune activité pour l&apos;instant.
          </p>
        </div>
      )}

      {!loading && !error && events.length > 0 && filteredEvents.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border bg-[hsl(var(--emerald-tint))]/60 px-5 py-8 text-sm text-muted-foreground shadow-[var(--surface-shadow)]">
          Aucun événement ne correspond à ce filtre.
        </p>
      )}

      {!loading && !error && filteredEvents.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--surface-shadow)]">
          <div className="border-b border-border bg-[hsl(var(--emerald-tint))]/45 px-5 py-4 sm:px-6">
            <h2 className="text-[17px] font-bold">Historique récent</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Actions classées de la plus récente à la plus ancienne.
            </p>
          </div>
          <ol className="p-5 sm:p-6">
            {filteredEvents.map((event, index) => (
              <li key={event.id} className="relative flex gap-3 pb-6 last:pb-0 sm:gap-4">
                {index < filteredEvents.length - 1 && (
                  <span className="absolute left-2 top-5 h-full w-px bg-border" />
                )}

                <span className={activityDotClassName(event.type)} />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="break-words font-semibold">{event.title}</p>
                      <p className="mt-1 break-words text-sm leading-6 text-muted-foreground">
                        {event.description}
                      </p>
                    </div>

                    <time
                      dateTime={event.date}
                      className="text-xs font-medium text-muted-foreground sm:whitespace-nowrap sm:text-sm"
                    >
                      {formatDateTime(event.date)}
                    </time>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[hsl(var(--emerald-tint))] px-2.5 py-1 text-xs font-semibold text-primary">
                      {typeLabels[event.type] ?? event.entityType}
                    </span>

                    {event.href && (
                      <Link
                        href={event.href}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Voir
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
