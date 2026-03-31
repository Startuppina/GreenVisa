function JsonBlock({ title, value }) {
  const hasValue = value && Object.keys(value).length > 0;

  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="text-sm font-medium text-slate-900">{title}</div>
      {hasValue ? (
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs text-slate-700">
          {JSON.stringify(value, null, 2)}
        </pre>
      ) : (
        <div className="mt-2 text-sm text-slate-500">No backend data returned yet.</div>
      )}
    </div>
  );
}

export default function TransportResultsPanel({ derived, results }) {
  const score = results?.score;
  const co2 = results?.co2;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-slate-900">Backend results</h2>
        <p className="mt-1 text-sm text-slate-600">
          These values are display-only and come back from the backend after submit.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl bg-emerald-50 p-4">
          <div className="text-sm font-medium text-emerald-900">Total score</div>
          <div className="mt-2 text-3xl font-semibold text-emerald-700">
            {score?.total_score ?? 'n/a'}
          </div>
        </div>
        <div className="rounded-xl bg-sky-50 p-4">
          <div className="text-sm font-medium text-sky-900">CO2 tons/year</div>
          <div className="mt-2 text-3xl font-semibold text-sky-700">
            {co2?.total_tons_per_year ?? 'n/a'}
          </div>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="text-sm font-medium text-slate-900">Calculator version</div>
          <div className="mt-2 text-2xl font-semibold text-slate-700">
            {results?.calculator_version || 'n/a'}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <JsonBlock title="Derived" value={derived} />
        <JsonBlock title="Results" value={results} />
      </div>
    </section>
  );
}
