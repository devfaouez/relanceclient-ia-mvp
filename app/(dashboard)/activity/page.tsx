"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock } from "lucide-react";
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
  prospect_created: "Prospect",
  quote_created: "Devis",
  quote_sent: "Devis",
  quote_accepted: "Devis",
  quote_rejected: "Devis",
  quote_cancelled: "Devis",
  reminder_created: "Relance",
  reminder_scheduled: "Relance",
  reminder_sent: "Relance",
  reminder_failed: "Relance",
};

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

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Activité</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Historique chronologique de vos prospects, devis et relances.
          </p>
        </div>

        {!loading && !error && (
          <p className="text-sm text-muted-foreground">
            {filteredEvents.length} événement
            {filteredEvents.length > 1 ? "s" : ""} affiché
            {filteredEvents.length > 1 ? "s" : ""}
          </p>
        )}
      </div>

      <div className="rounded-lg border bg-card p-5">
        <label className="text-sm font-medium">Type d&apos;activité</label>
        <div className="mt-3 flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={
                filter === item.value
                  ? "rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
                  : "rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
              }
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && events.length === 0 && (
        <div className="rounded-lg border bg-card px-5 py-10 text-center">
          <CalendarClock className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">
            Aucune activité pour l&apos;instant.
          </p>
        </div>
      )}

      {!loading && !error && events.length > 0 && filteredEvents.length === 0 && (
        <p className="rounded-lg border bg-card px-5 py-8 text-sm text-muted-foreground">
          Aucun événement ne correspond à ce filtre.
        </p>
      )}

      {!loading && !error && filteredEvents.length > 0 && (
        <div className="rounded-lg border bg-card p-5">
          <ol className="space-y-0">
            {filteredEvents.map((event, index) => (
              <li key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
                {index < filteredEvents.length - 1 && (
                  <span className="absolute left-2 top-5 h-full w-px bg-border" />
                )}

                <span className="relative mt-1 h-4 w-4 rounded-full border-2 border-primary bg-card" />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium">{event.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {event.description}
                      </p>
                    </div>

                    <time
                      dateTime={event.date}
                      className="whitespace-nowrap text-sm text-muted-foreground"
                    >
                      {formatDateTime(event.date)}
                    </time>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                      {typeLabels[event.type] ?? event.entityType}
                    </span>

                    {event.href && (
                      <Link
                        href={event.href}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Voir →
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
