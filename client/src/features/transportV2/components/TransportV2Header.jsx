function formatTimestamp(value) {
  if (!value) {
    return 'Non disponibile';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('it-IT');
}

function statusLabel(status) {
  if (status === 'submitted') return 'Inviato';
  if (status === 'draft') return 'Bozza';
  return status || 'Bozza';
}

function StatusPill({ status }) {
  const className =
    status === 'submitted'
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-amber-100 text-amber-700';

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${className}`}>
      {statusLabel(status)}
    </span>
  );
}

export default function TransportV2Header({ meta, certificationId }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900">
            Certificazione n. {certificationId}
          </h1>
        </div>
        <StatusPill status={meta?.status} />
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">Versione</div>
          <div className="mt-1 text-base font-medium text-slate-900">{meta?.version ?? 'n/d'}</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">Inizio</div>
          <div className="mt-1 text-sm text-slate-900">{formatTimestamp(meta?.started_at)}</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">Ultimo aggiornamento</div>
          <div className="mt-1 text-sm text-slate-900">{formatTimestamp(meta?.updated_at)}</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">Invio</div>
          <div className="mt-1 text-sm text-slate-900">{formatTimestamp(meta?.submitted_at)}</div>
        </div>
      </div>
    </section>
  );
}
