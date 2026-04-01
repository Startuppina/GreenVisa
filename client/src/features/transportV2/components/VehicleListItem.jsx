import { getVehicleBadges, getVehicleSubtitle, getVehicleTitle } from '../utils/vehicleSummary.js';

export default function VehicleListItem({ vehicle, index, isSelected, onSelect, onDelete, readOnly }) {
  const badges = getVehicleBadges(vehicle, index);

  return (
    <div
      className={`rounded-xl border p-4 transition ${
        isSelected
          ? 'border-emerald-500 bg-emerald-50 shadow-sm'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <button className="min-w-0 flex-1 text-left" type="button" onClick={onSelect}>
          <div className="font-medium text-slate-900">{getVehicleTitle(vehicle, index)}</div>
          <div className="mt-1 text-sm text-slate-500">{getVehicleSubtitle(vehicle)}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {badges.map((badge) => (
              <span
                key={`${vehicle.vehicle_id}-${badge}`}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700"
              >
                {badge}
              </span>
            ))}
          </div>
        </button>

        {!readOnly && (
          <button
            className="rounded-lg border border-rose-200 px-3 py-2 text-sm text-rose-700 transition hover:bg-rose-50"
            type="button"
            onClick={onDelete}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
