import {
  getVehicleBadges,
  getVehicleSubtitle,
  getVehicleTitle,
} from "../utils/vehicleSummary.js";

export default function VehicleListItem({
  vehicle,
  index,
  isSelected,
  onSelect,
  onDelete,
  readOnly,
}) {
  const badges = getVehicleBadges(vehicle, index);

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 transition sm:px-5 ${
        isSelected
          ? "bg-emerald-50/90 ring-2 ring-inset ring-emerald-400/40"
          : "bg-white hover:bg-slate-50/90"
      }`}
    >
      <button
        className="min-w-0 flex-1 text-left"
        type="button"
        onClick={onSelect}
      >
        <div className="font-medium text-slate-900">
          {getVehicleTitle(vehicle, index)}
        </div>
        <div className="mt-0.5 text-sm text-slate-600">
          {getVehicleSubtitle(vehicle)}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {badges.map((badge) => (
            <span
              key={`${vehicle.vehicle_id}-${badge}`}
              className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700"
            >
              {badge}
            </span>
          ))}
        </div>
      </button>

      {!readOnly && (
        <button
          className="shrink-0 rounded-lg border border-rose-200 px-3 py-2 text-sm text-rose-700 transition hover:bg-rose-50"
          type="button"
          onClick={onDelete}
        >
          Elimina
        </button>
      )}
    </div>
  );
}
