import { getFirstFieldError } from "../utils/validation.js";
import VehicleListItem from "./VehicleListItem.jsx";

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
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              Parco veicoli
            </h2>
            <p className="mt-1 max-w-md text-sm leading-relaxed text-slate-600">
              Scegli un veicolo dall’elenco per modificarne i dati nel pannello accanto. Puoi aggiungere
              righe a mano o tramite OCR.
            </p>
          </div>
          {!readOnly && (
            <button
              className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              type="button"
              onClick={onAddVehicle}
            >
              Aggiungi veicolo
            </button>
          )}
        </div>
      </div>

      {getFirstFieldError(fieldErrors, "draft.vehicles") ? (
        <p className="px-6 py-3 text-sm text-rose-600 sm:px-8">
          {getFirstFieldError(fieldErrors, "draft.vehicles")}
        </p>
      ) : null}

      <div className="min-h-[12rem] flex-1 overflow-auto px-2 pb-2 pt-1 sm:px-4">
        {vehicles.length ? (
          <div className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200">
            {vehicles.map((vehicle, index) => (
              <VehicleListItem
                key={vehicle.vehicle_id}
                vehicle={vehicle}
                index={index}
                isSelected={vehicle.vehicle_id === selectedVehicleId}
                onSelect={() => onSelectVehicle(vehicle.vehicle_id)}
                onDelete={() => onDeleteVehicle(vehicle.vehicle_id)}
                readOnly={readOnly}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-600">
            Nessun veicolo in elenco. Aggiungine uno oppure usa l’assistenza OCR in basso per crearne uno
            da documento.
          </div>
        )}
      </div>
    </section>
  );
}
