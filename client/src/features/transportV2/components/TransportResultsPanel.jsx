import {
  Calculator,
  ChevronRight,
  Cloud,
  Gauge,
  Server,
} from "lucide-react";

function hasJsonContent(value) {
  return (
    value != null &&
    typeof value === "object" &&
    (Array.isArray(value) ? value.length > 0 : Object.keys(value).length > 0)
  );
}

function StatCard({ icon: Icon, label, value, iconClassName }) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 sm:py-5">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
        aria-hidden
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p className="mt-0.5 truncate text-2xl font-semibold tabular-nums tracking-tight text-slate-900 sm:text-[1.65rem]">
          {value}
        </p>
      </div>
    </div>
  );
}

function JsonDetails({ title, value }) {
  const has = hasJsonContent(value);

  return (
    <details className="group/json border-t border-slate-100 first:border-t-0">
      <summary className="flex cursor-pointer list-none items-center gap-2 py-3 text-sm text-slate-600 transition hover:text-slate-900 [&::-webkit-details-marker]:hidden">
        <ChevronRight
          className="h-4 w-4 shrink-0 text-slate-400 transition group-open/json:rotate-90"
          aria-hidden
        />
        <span className="font-medium">{title}</span>
        {!has ? (
          <span className="text-slate-400">· vuoto</span>
        ) : null}
      </summary>
      <div className="pb-4 pl-6">
        {has ? (
          <pre className="max-h-48 overflow-auto rounded-lg bg-slate-50 px-3 py-2.5 font-mono text-[11px] leading-relaxed text-slate-600">
            {JSON.stringify(value, null, 2)}
          </pre>
        ) : (
          <p className="text-sm text-slate-400">Nessun dato.</p>
        )}
      </div>
    </details>
  );
}

export default function TransportResultsPanel({ derived, results }) {
  const score = results?.score;
  const co2 = results?.co2;
  const co2TonsPerYear =
    co2?.total_tons_per_year === null || co2?.total_tons_per_year === undefined
      ? null
      : Number(co2.total_tons_per_year);
  const co2TonsPerYearDisplay =
    co2TonsPerYear === null || Number.isNaN(co2TonsPerYear)
      ? "—"
      : `${co2TonsPerYear.toLocaleString("it-IT", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} t/anno`;

  const hasAnyRaw = hasJsonContent(derived) || hasJsonContent(results);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex items-start gap-4">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white"
            aria-hidden
          >
            <Server className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 pt-0.5">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
              Esito dal server
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Valori calcolati dopo l’invio · sola lettura
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-100 sm:grid sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <StatCard
          icon={Gauge}
          label="Punteggio"
          value={score?.total_score ?? "—"}
          iconClassName="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          icon={Cloud}
          label="CO₂ stimata"
          value={co2TonsPerYearDisplay}
          iconClassName="bg-sky-50 text-sky-700"
        />
        <StatCard
          icon={Calculator}
          label="Versione calcolatore"
          value={results?.calculator_version || "—"}
          iconClassName="bg-violet-50 text-violet-700"
        />
      </div>

      <details className="group border-t border-slate-100 bg-slate-50/40">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-3.5 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 sm:px-6 [&::-webkit-details-marker]:hidden">
          <ChevronRight
            className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-90"
            aria-hidden
          />
          <span className="font-medium text-slate-800">Dettaglio tecnico</span>
          <span className="text-slate-400">
            {hasAnyRaw ? "JSON" : "non disponibile"}
          </span>
        </summary>
        <div className="border-t border-slate-100 bg-white px-5 pb-2 sm:px-6">
          <JsonDetails title="Dati derivati" value={derived} />
          <JsonDetails title="Risposta completa" value={results} />
        </div>
      </details>
    </section>
  );
}
