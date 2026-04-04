function formatTimestamp(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("it-IT", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function StatusPill({ status }) {
  const isSubmitted = status === "submitted";
  const className = isSubmitted
    ? "bg-emerald-100 text-emerald-800"
    : "bg-amber-100 text-amber-900";

  const label = isSubmitted ? "Inviato" : "Bozza";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${className}`}
    >
      {label}
    </span>
  );
}

export default function TransportV2Header({ meta, certificationId }) {
  return (
    <header className="rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-500">
            Questionario trasporti
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Certificazione #{certificationId}
          </h1>
        </div>
        <StatusPill status={meta?.status} />
      </div>

      <dl className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="border-l-4 border-emerald-500/70 pl-4">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Versione schema
          </dt>
          <dd className="mt-1 text-base font-semibold text-slate-900">
            {meta?.version ?? "—"}
          </dd>
        </div>
        <div className="border-l-4 border-slate-300 pl-4">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Avviata il
          </dt>
          <dd className="mt-1 text-sm text-slate-800">
            {formatTimestamp(meta?.started_at)}
          </dd>
        </div>
        <div className="border-l-4 border-slate-300 pl-4">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Ultimo aggiornamento
          </dt>
          <dd className="mt-1 text-sm text-slate-800">
            {formatTimestamp(meta?.updated_at)}
          </dd>
        </div>
        <div className="border-l-4 border-slate-300 pl-4">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Inviata il
          </dt>
          <dd className="mt-1 text-sm text-slate-800">
            {formatTimestamp(meta?.submitted_at)}
          </dd>
        </div>
      </dl>
    </header>
  );
}
