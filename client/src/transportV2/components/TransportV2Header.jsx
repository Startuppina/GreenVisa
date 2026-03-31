export default function TransportV2Header({ certificationId }) {
  return (
    <header className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold text-slate-900">Trasporti</h1>
        {certificationId ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            Certification ID: {certificationId}
          </span>
        ) : null}
      </div>

      <p className="max-w-4xl text-sm text-slate-600">
        Compila le informazioni generali e aggiungi i mezzi da certificare. Puoi inserirli
        manualmente oppure caricare i libretti per precompilare la tabella.
      </p>
    </header>
  );
}
