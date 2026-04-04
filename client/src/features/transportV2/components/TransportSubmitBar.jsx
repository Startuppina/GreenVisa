import { useState } from "react";
import SubmitConfirmDialog from "./SubmitConfirmDialog.jsx";

export default function TransportSubmitBar({
  isDirty,
  isSaving,
  isSubmitting,
  isSubmitted,
  submittedAt,
  saveError,
  submitError,
  saveSuccessAt,
  onSave,
  onSubmit,
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  if (isSubmitted) {
    return (
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50/90 px-6 py-6 shadow-sm sm:px-8">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg text-emerald-600">
            &#10003;
          </span>
          <div>
            <h2 className="text-xl font-semibold text-emerald-900">
              Questionario inviato
            </h2>
            {submittedAt ? (
              <p className="text-sm text-emerald-800">
                Inviato il{" "}
                {new Date(submittedAt).toLocaleString("it-IT", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </p>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-sm sm:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl space-y-2">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Salva e invia
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Le modifiche vengono salvate in bozza mentre lavori. L’invio definitivo attiva i controlli del
            server e il calcolo del punteggio: assicurati che tutti i campi obbligatori siano compilati.
          </p>
          <div className="text-sm text-slate-700">
            <span className="font-medium text-slate-800">Stato bozza: </span>
            {isDirty
              ? "hai modifiche non ancora salvate sul server"
              : "allineata all’ultimo salvataggio"}
          </div>
          {saveSuccessAt ? (
            <div className="text-sm text-emerald-700">
              Ultimo salvataggio riuscito:{" "}
              {new Date(saveSuccessAt).toLocaleString("it-IT", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </div>
          ) : null}
          {saveError ? (
            <div className="text-sm text-rose-600">{saveError}</div>
          ) : null}
          {submitError ? (
            <div className="text-sm text-rose-600">{submitError}</div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap gap-3">
          <button
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100"
            type="button"
            onClick={onSave}
            disabled={isSaving || isSubmitting}
          >
            {isSaving ? "Salvataggio…" : "Salva bozza"}
          </button>
          <button
            className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            type="button"
            onClick={() => setShowConfirm(true)}
            disabled={isSaving || isSubmitting}
          >
            {isSubmitting ? "Invio in corso…" : "Invia questionario"}
          </button>
        </div>
      </div>

      {showConfirm && (
        <SubmitConfirmDialog
          onConfirm={() => {
            setShowConfirm(false);
            onSubmit();
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </section>
  );
}
