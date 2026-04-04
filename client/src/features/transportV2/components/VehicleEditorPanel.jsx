import VehicleFieldsForm from "./VehicleFieldsForm.jsx";

export default function VehicleEditorPanel({
  vehicle,
  vehicleIndex,
  fieldErrors,
  onTransportModeChange,
  onFieldChange,
  onNotesChange,
  readOnly,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          Dettaglio veicolo
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
          Compila i campi tecnici (immatricolazione, emissioni, carburante, ecc.). Le righe create da OCR
          diventano veicoli normali dopo l’applicazione: controlla sempre i valori estratti.
        </p>
      </div>

      <div className="px-6 py-6 sm:px-8 sm:py-8">
        {vehicle ? (
          <VehicleFieldsForm
            vehicle={vehicle}
            vehicleIndex={vehicleIndex}
            fieldErrors={fieldErrors}
            onTransportModeChange={onTransportModeChange}
            onFieldChange={onFieldChange}
            onNotesChange={onNotesChange}
            readOnly={readOnly}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-600">
            Seleziona un veicolo dall’elenco a sinistra, oppure aggiungine uno nuovo per iniziare.
          </div>
        )}
      </div>
    </section>
  );
}
