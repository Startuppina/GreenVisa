import TransportV2VehicleRowEditor from './TransportV2VehicleRowEditor';

export default function TransportV2VehicleList({
  vehicles,
  rowIssues,
  disabled,
  onAddVehicle,
  onUpdateVehicle,
  onRemoveVehicle,
}) {
  const rowIssuesByVehicleLabel = new Map(
    (rowIssues || []).map((issue) => [issue.vehicle_id || issue.vehicleLabel, issue]),
  );

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Veicoli</h2>
          <p className="mt-1 text-sm text-slate-600">
            I veicoli vengono letti da `draft.vehicles`. Le righe OCR appaiono qui insieme a
            quelle manuali, nello stesso draft condiviso.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddVehicle}
          disabled={disabled}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
        >
          Aggiungi riga
        </button>
      </div>

      {!vehicles?.length ? (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
          Nessun veicolo presente nel draft condiviso.
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {vehicles.map((vehicle, index) => (
            <TransportV2VehicleRowEditor
              key={vehicle?.vehicle_id || `vehicle-${index}`}
              vehicle={vehicle}
              index={index}
              disabled={disabled}
              rowIssue={
                rowIssuesByVehicleLabel.get(vehicle?.vehicle_id) ||
                rowIssuesByVehicleLabel.get(`vehicle-${index + 1}`) ||
                null
              }
              onUpdateVehicle={onUpdateVehicle}
              onRemoveVehicle={onRemoveVehicle}
            />
          ))}
        </div>
      )}
    </section>
  );
}
