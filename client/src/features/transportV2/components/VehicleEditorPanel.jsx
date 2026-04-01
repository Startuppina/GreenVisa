import VehicleFieldsForm from './VehicleFieldsForm.jsx';

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
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-slate-900">Modifica veicolo</h2>
        <p className="mt-1 text-sm text-slate-600">
          Qui si completano i campi. Le righe create dall&apos;OCR diventano righe normali dopo l&apos;applicazione.
        </p>
      </div>

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
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
          Seleziona un veicolo dall&apos;elenco oppure aggiungine uno manualmente per iniziare.
        </div>
      )}
    </section>
  );
}
