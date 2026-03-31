import {
  BOOLEAN_SELECT_OPTIONS,
  EURO_CLASS_OPTIONS,
  FUEL_TYPE_OPTIONS,
  PROFILE_CODE_OPTIONS,
  TRANSPORT_MODE_OPTIONS,
  booleanToSelectValue,
  formatTransportMode,
  getVehicleDisplayName,
  parseBooleanSelectValue,
  parseIntegerSelectValue,
} from '../transportV2Model';
import { applyUserFieldEdit } from '../transportV2FieldSources';
import {
  getRequiredVehicleFieldKeys,
  getVisibleVehicleFieldKeys,
  normalizeVehicleForTransportMode,
} from '../transportV2VehicleRules';

const inputClassName =
  'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-50';

export default function TransportV2VehicleEditor({
  vehicle,
  index,
  disabled,
  onUpdateVehicle,
}) {
  if (!vehicle) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
        Seleziona un mezzo dalla tabella per modificare i suoi dettagli.
      </div>
    );
  }

  const visibleFieldKeys = new Set(getVisibleVehicleFieldKeys(vehicle?.transport_mode));
  const requiredFieldKeys = new Set(getRequiredVehicleFieldKeys(vehicle?.transport_mode));
  const warningCount = Object.values(vehicle?.field_warnings || {}).reduce((total, entry) => {
    if (Array.isArray(entry)) {
      return total + entry.length;
    }

    return entry ? total + 1 : total;
  }, 0);

  const updateVehicle = (updater) => {
    onUpdateVehicle(vehicle.vehicle_id, updater);
  };

  const updateVehicleField = (fieldKey, value) => {
    updateVehicle((currentVehicle) => applyUserFieldEdit(currentVehicle, fieldKey, value));
  };

  const handleTransportModeChange = (event) => {
    const nextMode = event.target.value || null;
    updateVehicle((currentVehicle) => normalizeVehicleForTransportMode(currentVehicle, nextMode));
  };

  const handleNotesChange = (event) => {
    updateVehicle((currentVehicle) => ({
      ...currentVehicle,
      row_notes: event.target.value || null,
    }));
  };

  const isFieldVisible = (fieldKey) => visibleFieldKeys.has(fieldKey);
  const isFieldRequired = (fieldKey) => requiredFieldKeys.has(fieldKey);

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900">
              {getVehicleDisplayName(vehicle, index)}
            </h3>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
              {formatTransportMode(vehicle?.transport_mode)}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                vehicle?.ocr_document_id
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {vehicle?.ocr_document_id
                ? `Origine OCR #${vehicle.ocr_document_id}`
                : 'Origine manuale'}
            </span>
          </div>

          <p className="mt-2 text-sm text-slate-600">
            Modifica un solo mezzo alla volta. Le variazioni aggiornano il draft condiviso.
          </p>
        </div>

        {warningCount > 0 ? (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
            {warningCount} warning OCR
          </span>
        ) : null}
      </div>

      <div className="mt-5 space-y-5">
        <Section title="Dati tecnici">
          <SelectField
            label="Transport mode *"
            value={vehicle?.transport_mode || ''}
            options={TRANSPORT_MODE_OPTIONS}
            disabled={disabled}
            onChange={(value) => handleTransportModeChange({ target: { value } })}
          />
          <NumberField
            label={buildFieldLabel('Anno di immatricolazione', isFieldRequired('registration_year'))}
            value={vehicle?.fields?.registration_year}
            disabled={disabled}
            onChange={(value) => updateVehicleField('registration_year', value)}
          />
          <SelectField
            label={buildFieldLabel('Classe euro', isFieldRequired('euro_class'))}
            value={vehicle?.fields?.euro_class || ''}
            options={EURO_CLASS_OPTIONS}
            disabled={disabled}
            onChange={(value) => updateVehicleField('euro_class', value || null)}
          />
          <SelectField
            label={buildFieldLabel('Carburante', isFieldRequired('fuel_type'))}
            value={vehicle?.fields?.fuel_type || ''}
            options={FUEL_TYPE_OPTIONS}
            disabled={disabled}
            onChange={(value) => updateVehicleField('fuel_type', value || null)}
          />
          {isFieldVisible('goods_vehicle_over_3_5_tons') ? (
            <SelectField
              label={buildFieldLabel(
                'Veicolo merci oltre 3,5 ton',
                isFieldRequired('goods_vehicle_over_3_5_tons'),
              )}
              value={booleanToSelectValue(vehicle?.fields?.goods_vehicle_over_3_5_tons)}
              options={BOOLEAN_SELECT_OPTIONS}
              disabled={disabled}
              onChange={(value) =>
                updateVehicleField('goods_vehicle_over_3_5_tons', parseBooleanSelectValue(value))
              }
            />
          ) : null}
        </Section>

        <Section title="Emissioni">
          <SelectField
            label={buildFieldLabel('Omologazione WLTP', isFieldRequired('wltp_homologation'))}
            value={booleanToSelectValue(vehicle?.fields?.wltp_homologation)}
            options={BOOLEAN_SELECT_OPTIONS}
            disabled={disabled}
            onChange={(value) =>
              updateVehicleField('wltp_homologation', parseBooleanSelectValue(value))
            }
          />
          <NumberField
            label={buildFieldLabel('WLTP CO2 g/km', isFieldRequired('wltp_co2_g_km'))}
            value={vehicle?.fields?.wltp_co2_g_km}
            disabled={disabled}
            onChange={(value) => updateVehicleField('wltp_co2_g_km', value)}
          />
          <NumberField
            label="WLTP CO2 g/km secondo carburante"
            value={vehicle?.fields?.wltp_co2_g_km_alt_fuel}
            disabled={disabled}
            onChange={(value) => updateVehicleField('wltp_co2_g_km_alt_fuel', value)}
          />
        </Section>

        <Section title="Utilizzo">
          {isFieldVisible('occupancy_profile_code') ? (
            <SelectField
              label={buildFieldLabel(
                'Profilo occupazione passeggeri',
                isFieldRequired('occupancy_profile_code'),
              )}
              value={vehicle?.fields?.occupancy_profile_code?.toString?.() || ''}
              options={PROFILE_CODE_OPTIONS}
              disabled={disabled}
              onChange={(value) =>
                updateVehicleField('occupancy_profile_code', parseIntegerSelectValue(value))
              }
            />
          ) : null}
          {isFieldVisible('load_profile_code') ? (
            <SelectField
              label={buildFieldLabel('Profilo carico merci', isFieldRequired('load_profile_code'))}
              value={vehicle?.fields?.load_profile_code?.toString?.() || ''}
              options={PROFILE_CODE_OPTIONS}
              disabled={disabled}
              onChange={(value) =>
                updateVehicleField('load_profile_code', parseIntegerSelectValue(value))
              }
            />
          ) : null}
          <NumberField
            label={buildFieldLabel('KM annui', isFieldRequired('annual_km'))}
            value={vehicle?.fields?.annual_km}
            disabled={disabled}
            onChange={(value) => updateVehicleField('annual_km', value)}
          />
        </Section>

        <Section title="Manutenzione">
          <DateField
            label={buildFieldLabel('Data ultima revisione', isFieldRequired('last_revision_date'))}
            value={vehicle?.fields?.last_revision_date || ''}
            disabled={disabled}
            onChange={(value) => updateVehicleField('last_revision_date', value || null)}
          />
          <SelectField
            label={buildFieldLabel('Bollino blu', isFieldRequired('blue_sticker'))}
            value={booleanToSelectValue(vehicle?.fields?.blue_sticker)}
            options={BOOLEAN_SELECT_OPTIONS}
            disabled={disabled}
            onChange={(value) => updateVehicleField('blue_sticker', parseBooleanSelectValue(value))}
          />
        </Section>
      </div>

      <label className="mt-5 flex flex-col gap-2 text-sm text-slate-700">
        <span className="font-medium text-slate-800">Note riga</span>
        <textarea
          rows={3}
          className={inputClassName}
          value={vehicle?.row_notes || ''}
          disabled={disabled}
          onChange={handleNotesChange}
        />
      </label>
    </section>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h4>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  );
}

function SelectField({ label, value, options, disabled, onChange }) {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-700">
      <span className="font-medium text-slate-800">{label}</span>
      <select
        className={inputClassName}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => {
          if (typeof option === 'string') {
            return (
              <option key={option || 'empty'} value={option}>
                {option || 'Non impostato'}
              </option>
            );
          }

          return (
            <option key={option.value || 'empty'} value={option.value}>
              {option.label}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function NumberField({ label, value, disabled, onChange }) {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-700">
      <span className="font-medium text-slate-800">{label}</span>
      <input
        type="number"
        className={inputClassName}
        value={value ?? ''}
        disabled={disabled}
        onChange={(event) => onChange(parseNumericInputValue(event.target.value))}
      />
    </label>
  );
}

function DateField({ label, value, disabled, onChange }) {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-700">
      <span className="font-medium text-slate-800">{label}</span>
      <input
        type="date"
        className={inputClassName}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function buildFieldLabel(label, isRequired) {
  return isRequired ? `${label} *` : label;
}

function parseNumericInputValue(value) {
  if (value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
