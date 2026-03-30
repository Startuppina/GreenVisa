import {
  BOOLEAN_SELECT_OPTIONS,
  EURO_CLASS_OPTIONS,
  FUEL_TYPE_OPTIONS,
  PROFILE_CODE_OPTIONS,
  TRANSPORT_MODE_OPTIONS,
  booleanToSelectValue,
  formatFieldValue,
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

export default function TransportV2VehicleRowEditor({
  vehicle,
  index,
  rowIssue,
  disabled,
  onUpdateVehicle,
  onRemoveVehicle,
}) {
  const visibleFieldKeys = new Set(getVisibleVehicleFieldKeys(vehicle?.transport_mode));
  const requiredFieldKeys = new Set(getRequiredVehicleFieldKeys(vehicle?.transport_mode));
  const fieldEntries = Object.entries(vehicle?.field_sources || {});
  const warningEntries = Object.entries(vehicle?.field_warnings || {});
  const isOcrRow = Boolean(vehicle?.ocr_document_id);

  const updateVehicle = (updater) => {
    onUpdateVehicle(vehicle.vehicle_id, updater);
  };

  const updateVehicleField = (fieldKey, value) => {
    updateVehicle((currentVehicle) => applyUserFieldEdit(currentVehicle, fieldKey, value));
  };

  const handleTransportModeChange = (event) => {
    const nextMode = event.target.value || null;
    updateVehicle((currentVehicle) =>
      normalizeVehicleForTransportMode(currentVehicle, nextMode),
    );
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
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900">
              {getVehicleDisplayName(vehicle, index)}
            </h3>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
              {formatTransportMode(vehicle?.transport_mode)}
            </span>
            {isOcrRow ? (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
                OCR documento #{vehicle.ocr_document_id}
              </span>
            ) : (
              <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700">
                Riga manuale
              </span>
            )}
          </div>

          <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2 xl:grid-cols-3">
            <SummaryItem label="Anno immatricolazione" value={vehicle?.fields?.registration_year} />
            <SummaryItem label="Classe euro" value={vehicle?.fields?.euro_class} />
            <SummaryItem label="Carburante" value={vehicle?.fields?.fuel_type} />
            <SummaryItem label="KM/anno" value={vehicle?.fields?.annual_km} />
            <SummaryItem label="WLTP CO2" value={vehicle?.fields?.wltp_co2_g_km} />
            <SummaryItem label="Revisione" value={vehicle?.fields?.last_revision_date} />
          </div>
        </div>

        <button
          type="button"
          onClick={() => onRemoveVehicle(vehicle.vehicle_id)}
          disabled={disabled}
          className="rounded-md border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Rimuovi
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          <span className="font-medium text-slate-800">Transport mode</span>
          <select
            data-testid="transport-v2-transport-mode"
            className={inputClassName}
            value={vehicle?.transport_mode || ''}
            disabled={disabled}
            onChange={handleTransportModeChange}
          >
            {TRANSPORT_MODE_OPTIONS.map((option) => (
              <option key={option.value || 'empty'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

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
          label={buildFieldLabel('Tipo carburante', isFieldRequired('fuel_type'))}
          value={vehicle?.fields?.fuel_type || ''}
          options={FUEL_TYPE_OPTIONS}
          disabled={disabled}
          onChange={(value) => updateVehicleField('fuel_type', value || null)}
        />

        <SelectField
          label={buildFieldLabel('Omologazione WLTP', isFieldRequired('wltp_homologation'))}
          value={booleanToSelectValue(vehicle?.fields?.wltp_homologation)}
          options={BOOLEAN_SELECT_OPTIONS}
          disabled={disabled}
          onChange={(value) => updateVehicleField('wltp_homologation', parseBooleanSelectValue(value))}
        />

        <NumberField
          label={buildFieldLabel('WLTP CO2 g/km', isFieldRequired('wltp_co2_g_km'))}
          value={vehicle?.fields?.wltp_co2_g_km}
          disabled={disabled}
          onChange={(value) => updateVehicleField('wltp_co2_g_km', value)}
        />

        <NumberField
          label="WLTP CO2 secondo carburante"
          value={vehicle?.fields?.wltp_co2_g_km_alt_fuel}
          disabled={disabled}
          onChange={(value) => updateVehicleField('wltp_co2_g_km_alt_fuel', value)}
        />

        <NumberField
          label={buildFieldLabel('KM annui', isFieldRequired('annual_km'))}
          value={vehicle?.fields?.annual_km}
          disabled={disabled}
          onChange={(value) => updateVehicleField('annual_km', value)}
        />

        <label className="flex flex-col gap-2 text-sm text-slate-700">
          <span className="font-medium text-slate-800">
            {buildFieldLabel('Data ultima revisione', isFieldRequired('last_revision_date'))}
          </span>
          <input
            type="date"
            className={inputClassName}
            value={vehicle?.fields?.last_revision_date || ''}
            disabled={disabled}
            onChange={(event) => updateVehicleField('last_revision_date', event.target.value || null)}
          />
        </label>

        <SelectField
          label={buildFieldLabel('Bollino blu', isFieldRequired('blue_sticker'))}
          value={booleanToSelectValue(vehicle?.fields?.blue_sticker)}
          options={BOOLEAN_SELECT_OPTIONS}
          disabled={disabled}
          onChange={(value) => updateVehicleField('blue_sticker', parseBooleanSelectValue(value))}
        />

        {isFieldVisible('goods_vehicle_over_3_5_tons') ? (
          <SelectField
            label={buildFieldLabel(
              'Veicolo merci oltre 3.5 ton',
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

        {isFieldVisible('occupancy_profile_code') ? (
          <SelectField
            label={buildFieldLabel(
              'Profilo passeggeri',
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
            label={buildFieldLabel('Profilo merci', isFieldRequired('load_profile_code'))}
            value={vehicle?.fields?.load_profile_code?.toString?.() || ''}
            options={PROFILE_CODE_OPTIONS}
            disabled={disabled}
            onChange={(value) =>
              updateVehicleField('load_profile_code', parseIntegerSelectValue(value))
            }
          />
        ) : null}
      </div>

      <label className="mt-4 flex flex-col gap-2 text-sm text-slate-700">
        <span className="font-medium text-slate-800">Note riga</span>
        <textarea
          rows={3}
          className={inputClassName}
          value={vehicle?.row_notes || ''}
          disabled={disabled}
          onChange={handleNotesChange}
        />
      </label>

      {rowIssue && !rowIssue.isComplete ? (
        <section className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Dati da completare per questo veicolo</p>
          <ul className="mt-2 list-disc pl-5">
            {rowIssue.messages.map((message, messageIndex) => (
              <li key={`${rowIssue.vehicleLabel}-issue-${messageIndex}`}>{message}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {(fieldEntries.length > 0 || warningEntries.length > 0) ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">Field sources</p>
            {fieldEntries.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Nessuna provenienza registrata.</p>
            ) : (
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                {fieldEntries.map(([fieldKey, source]) => (
                  <div key={fieldKey} className="rounded-lg bg-slate-50 p-3">
                    <p className="font-medium text-slate-900">{fieldKey}</p>
                    <p className="mt-1">Origine: {source?.source || 'n/d'}</p>
                    <p>Documento: {source?.document_id || 'n/d'}</p>
                    <p>Confidence: {source?.confidence ?? 'n/d'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">Field warnings</p>
            {warningEntries.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Nessun warning registrato.</p>
            ) : (
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                {warningEntries.map(([fieldKey, warnings]) => (
                  <div key={fieldKey} className="rounded-lg bg-amber-50 p-3">
                    <p className="font-medium text-slate-900">{fieldKey}</p>
                    <div className="mt-1 space-y-1">
                      {(Array.isArray(warnings) ? warnings : []).map((warning, warningIndex) => (
                        <p key={`${fieldKey}-${warningIndex}`}>
                          {warning?.code || 'warning'}: {warning?.message || 'Verifica manuale richiesta.'}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </article>
  );
}

function buildFieldLabel(label, isRequired) {
  return isRequired ? `${label} *` : label;
}

function SummaryItem({ label, value }) {
  return (
    <div className="rounded-lg bg-white p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-900">{formatFieldValue(value)}</p>
    </div>
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

function parseNumericInputValue(value) {
  if (value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
