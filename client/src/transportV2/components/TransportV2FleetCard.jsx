import TransportV2OcrUploadPanel from './TransportV2OcrUploadPanel';
import TransportV2VehicleEditor from './TransportV2VehicleEditor';
import TransportV2VehicleTable from './TransportV2VehicleTable';

export default function TransportV2FleetCard({
  certificationId,
  vehicles,
  selectedVehicleId,
  disabled,
  onAddVehicle,
  onSelectVehicle,
  onUpdateVehicle,
  onRemoveVehicle,
}) {
  const selectedIndex = vehicles.findIndex((vehicle) => vehicle?.vehicle_id === selectedVehicleId);
  const selectedVehicle = selectedIndex >= 0 ? vehicles[selectedIndex] : null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Parco mezzi</h2>
          <p className="mt-1 text-sm text-slate-600">
            Tabella compatta per la panoramica del fleet e editor dettagliato per il mezzo
            selezionato.
          </p>
        </div>

        <button
          type="button"
          disabled={disabled}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
          onClick={onAddVehicle}
        >
          Aggiungi mezzo
        </button>
      </div>

      <div className="mt-5">
        <TransportV2OcrUploadPanel certificationId={certificationId} disabled={disabled} />
      </div>

      <div className="mt-5">
        <TransportV2VehicleTable
          vehicles={vehicles}
          selectedVehicleId={selectedVehicleId}
          disabled={disabled}
          onSelectVehicle={onSelectVehicle}
          onRemoveVehicle={onRemoveVehicle}
        />
      </div>

      <div className="mt-5">
        <TransportV2VehicleEditor
          vehicle={selectedVehicle}
          index={selectedIndex >= 0 ? selectedIndex : 0}
          disabled={disabled}
          onUpdateVehicle={onUpdateVehicle}
        />
      </div>
    </section>
  );
}
