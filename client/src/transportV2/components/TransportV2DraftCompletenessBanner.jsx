export default function TransportV2DraftCompletenessBanner({ completeness }) {
  if (!completeness) {
    return null;
  }

  const toneClasses = completeness.isComplete
    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
    : 'border-amber-200 bg-amber-50 text-amber-900';

  return (
    <section className={`rounded-xl border p-5 shadow-sm ${toneClasses}`}>
      <div className="flex flex-col gap-2">
        <p className="text-lg font-semibold">
          {completeness.isComplete ? 'Draft completo' : 'Draft incompleto'}
        </p>
        <p className="text-sm">
          {completeness.isComplete
            ? 'Il draft risulta completo per la compilazione manuale e pronto per un futuro submit.'
            : 'Questo controllo e informativo: puoi continuare a modificare e salvare il draft anche se incompleto.'}
        </p>
      </div>

      {!completeness.isComplete ? (
        <div className="mt-4 space-y-4">
          {completeness.summary.messages.length > 0 ? (
            <div>
              <p className="text-sm font-semibold">Riepilogo</p>
              <ul className="mt-2 list-disc pl-5 text-sm">
                {completeness.summary.messages.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {completeness.questionnaire.missingFlags.length > 0 ? (
            <div>
              <p className="text-sm font-semibold">Questionnaire flags da completare</p>
              <ul className="mt-2 list-disc pl-5 text-sm">
                {completeness.questionnaire.missingFlags.map((flag) => (
                  <li key={flag.key}>{flag.label}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {completeness.vehicles.rowIssues.length > 0 ? (
            <div>
              <p className="text-sm font-semibold">Veicoli da completare</p>
              <ul className="mt-2 list-disc pl-5 text-sm">
                {completeness.vehicles.rowIssues.map((issue) => (
                  <li key={issue.vehicleLabel}>
                    {issue.vehicleLabel}: {issue.messages.join(' ')}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
