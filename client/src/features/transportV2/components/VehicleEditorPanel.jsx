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
        <h2 className="text-xl font-semibold text-slate-900">Vehicle editor</h2>
        <p className="mt-1 text-sm text-slate-600">
          Detailed editing happens here. OCR-created rows become normal rows once applied.
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
          Select a vehicle from the list, or add one manually to start editing.
        </div>
      )}
    </section>
  );
}
