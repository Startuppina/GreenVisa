function formatTimestamp(value) {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function StatusPill({ status }) {
  const className =
    status === 'submitted'
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-amber-100 text-amber-700';

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${className}`}>
      {status || 'draft'}
    </span>
  );
}

export default function TransportV2Header({ meta, certificationId }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900">
            Certification #{certificationId}
          </h1>
        </div>
        <StatusPill status={meta?.status} />
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">Version</div>
          <div className="mt-1 text-base font-medium text-slate-900">{meta?.version ?? 'n/a'}</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">Started</div>
          <div className="mt-1 text-sm text-slate-900">{formatTimestamp(meta?.started_at)}</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">Updated</div>
          <div className="mt-1 text-sm text-slate-900">{formatTimestamp(meta?.updated_at)}</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">Submitted</div>
          <div className="mt-1 text-sm text-slate-900">{formatTimestamp(meta?.submitted_at)}</div>
        </div>
      </div>
    </section>
  );
}
