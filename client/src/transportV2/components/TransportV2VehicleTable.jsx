import {
  formatFieldValue,
  formatTransportMode,
  getVehicleDisplayName,
} from '../transportV2Model';
import { getRequiredVehicleFieldKeys } from '../transportV2VehicleRules';

export default function TransportV2VehicleTable({
  vehicles,
  selectedVehicleId,
  disabled,
  onSelectVehicle,
  onRemoveVehicle,
}) {
  if (!vehicles.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
        Nessun mezzo presente. Usa <span className="font-semibold text-slate-700">Aggiungi mezzo</span>{' '}
        per creare la prima riga manuale oppure carica un libretto nel pannello OCR.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            <HeaderCell>Mezzo</HeaderCell>
            <HeaderCell>Origine</HeaderCell>
            <HeaderCell>Tipo</HeaderCell>
            <HeaderCell>Anno</HeaderCell>
            <HeaderCell>Euro</HeaderCell>
            <HeaderCell>Carburante</HeaderCell>
            <HeaderCell>KM annui</HeaderCell>
            <HeaderCell>Stato</HeaderCell>
            <HeaderCell>Azioni</HeaderCell>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-200 bg-white">
          {vehicles.map((vehicle, index) => {
            const isSelected = vehicle?.vehicle_id === selectedVehicleId;
            const status = getVehicleRowStatus(vehicle);

            return (
              <tr
                key={vehicle?.vehicle_id || `vehicle-${index}`}
                className={isSelected ? 'bg-emerald-50' : 'hover:bg-slate-50'}
              >
                <BodyCell>
                  <button
                    type="button"
                    className="text-left font-medium text-slate-900"
                    onClick={() => onSelectVehicle(vehicle?.vehicle_id)}
                  >
                    {getVehicleDisplayName(vehicle, index)}
                  </button>
                </BodyCell>
                <BodyCell>{vehicle?.ocr_document_id ? 'OCR' : 'Manuale'}</BodyCell>
                <BodyCell>{formatTransportMode(vehicle?.transport_mode)}</BodyCell>
                <BodyCell>{formatFieldValue(vehicle?.fields?.registration_year)}</BodyCell>
                <BodyCell>{formatFieldValue(vehicle?.fields?.euro_class)}</BodyCell>
                <BodyCell>{formatFieldValue(vehicle?.fields?.fuel_type)}</BodyCell>
                <BodyCell>{formatFieldValue(vehicle?.fields?.annual_km)}</BodyCell>
                <BodyCell>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${status.toneClass}`}
                  >
                    {status.label}
                  </span>
                </BodyCell>
                <BodyCell>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      onClick={() => onSelectVehicle(vehicle?.vehicle_id)}
                    >
                      {isSelected ? 'Selezionato' : 'Modifica'}
                    </button>
                    <button
                      type="button"
                      disabled={disabled}
                      className="rounded-md border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => onRemoveVehicle(vehicle?.vehicle_id)}
                    >
                      Rimuovi
                    </button>
                  </div>
                </BodyCell>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function HeaderCell({ children }) {
  return <th className="whitespace-nowrap px-4 py-3 font-semibold">{children}</th>;
}

function BodyCell({ children }) {
  return <td className="whitespace-nowrap px-4 py-3 align-top text-slate-700">{children}</td>;
}

function getVehicleRowStatus(vehicle) {
  const missingFieldCount = countMissingRequiredFields(vehicle);

  if (missingFieldCount === 0) {
    return {
      label: 'Pronto',
      toneClass: 'bg-emerald-100 text-emerald-800',
    };
  }

  if (missingFieldCount === 1) {
    return {
      label: 'Da completare',
      toneClass: 'bg-amber-100 text-amber-800',
    };
  }

  return {
    label: `${missingFieldCount} campi mancanti`,
    toneClass: 'bg-amber-100 text-amber-800',
  };
}

function countMissingRequiredFields(vehicle) {
  const requiredFieldKeys = getRequiredVehicleFieldKeys(vehicle?.transport_mode);
  const fields = vehicle?.fields || {};
  let missingCount = isMissingValue(vehicle?.transport_mode) ? 1 : 0;

  requiredFieldKeys.forEach((fieldKey) => {
    if (isMissingValue(fields[fieldKey])) {
      missingCount += 1;
    }
  });

  return missingCount;
}

function isMissingValue(value) {
  return value === null || value === undefined || value === '';
}
