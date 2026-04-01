import { getFirstFieldError } from '../utils/validation.js';
import VehicleListItem from './VehicleListItem.jsx';

export default function VehicleListPanel({
  vehicles,
  selectedVehicleId,
  fieldErrors,
  onAddVehicle,
  onDeleteVehicle,
  onSelectVehicle,
  readOnly,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Veicoli</h2>
          <p className="mt-1 text-sm text-slate-600">
            Elenco sintetico; modifica i dettagli della riga selezionata nel pannello a destra.
          </p>
        </div>
        {!readOnly && (
          <button
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            type="button"
            onClick={onAddVehicle}
          >
            Aggiungi veicolo
          </button>
        )}
      </div>

      {getFirstFieldError(fieldErrors, 'draft.vehicles') ? (
        <p className="mt-4 text-sm text-rose-600">{getFirstFieldError(fieldErrors, 'draft.vehicles')}</p>
      ) : null}

      <div className="mt-5 space-y-3">
        {vehicles.length ? (
          vehicles.map((vehicle, index) => (
            <VehicleListItem
              key={vehicle.vehicle_id}
              vehicle={vehicle}
              index={index}
              isSelected={vehicle.vehicle_id === selectedVehicleId}
              onSelect={() => onSelectVehicle(vehicle.vehicle_id)}
              onDelete={() => onDeleteVehicle(vehicle.vehicle_id)}
              readOnly={readOnly}
            />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
            Nessun veicolo. Aggiungine uno manualmente o creane uno dall&apos;OCR qui sotto.
          </div>
        )}
      </div>
    </section>
  );
}
