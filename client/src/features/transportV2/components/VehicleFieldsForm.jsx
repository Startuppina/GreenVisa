import {
  EURO_CLASS_OPTIONS,
  FUEL_TYPE_OPTIONS,
  getFirstFieldError,
  isDualFuelType,
  PROFILE_OPTIONS,
  toBoolean,
  TRANSPORT_MODE_OPTIONS,
  YES_NO_OPTIONS,
} from '../utils/validation.js';

function parseIntegerOrNull(value) {
  if (value === '') {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function InputField({ label, error, children, hint }) {
  return (
    <label className="space-y-2">
      <div className="text-sm font-medium text-slate-800">{label}</div>
      {children}
      {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
      {error ? <div className="text-sm text-rose-600">{error}</div> : null}
    </label>
  );
}

function BaseInput(props) {
  return (
    <input
      {...props}
      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
    />
  );
}

function BaseSelect(props) {
  return (
    <select
      {...props}
      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
    />
  );
}

export default function VehicleFieldsForm({
  vehicle,
  vehicleIndex,
  fieldErrors,
  onTransportModeChange,
  onFieldChange,
  onNotesChange,
}) {
  const fieldPath = (name) => `draft.vehicles[${vehicleIndex}].fields.${name}`;
  const vehiclePath = (name) => `draft.vehicles[${vehicleIndex}].${name}`;
  const isPassenger = vehicle.transport_mode === 'passenger';
  const isGoods = vehicle.transport_mode === 'goods';
  const showAltFuelField = isDualFuelType(vehicle.fields.fuel_type);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <InputField label="Transport mode" error={getFirstFieldError(fieldErrors, vehiclePath('transport_mode'))}>
          <BaseSelect
            value={vehicle.transport_mode ?? ''}
            onChange={(event) => onTransportModeChange(event.target.value || null)}
          >
            <option value="">Select transport mode</option>
            {TRANSPORT_MODE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </BaseSelect>
        </InputField>

        <InputField label="OCR document id">
          <BaseInput disabled value={vehicle.ocr_document_id ?? 'Manual vehicle'} />
        </InputField>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <InputField
          label="Registration year"
          error={getFirstFieldError(fieldErrors, fieldPath('registration_year'))}
        >
          <BaseInput
            type="number"
            value={vehicle.fields.registration_year ?? ''}
            onChange={(event) => onFieldChange('registration_year', parseIntegerOrNull(event.target.value))}
          />
        </InputField>

        <InputField label="Euro class" error={getFirstFieldError(fieldErrors, fieldPath('euro_class'))}>
          <BaseSelect
            value={vehicle.fields.euro_class ?? ''}
            onChange={(event) => onFieldChange('euro_class', event.target.value || null)}
          >
            <option value="">Select euro class</option>
            {EURO_CLASS_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </BaseSelect>
        </InputField>

        <InputField label="Fuel type" error={getFirstFieldError(fieldErrors, fieldPath('fuel_type'))}>
          <BaseSelect
            value={vehicle.fields.fuel_type ?? ''}
            onChange={(event) => onFieldChange('fuel_type', event.target.value || null)}
          >
            <option value="">Select fuel type</option>
            {FUEL_TYPE_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </BaseSelect>
        </InputField>

        <InputField
          label="WLTP CO2 g/km"
          error={getFirstFieldError(fieldErrors, fieldPath('wltp_co2_g_km'))}
        >
          <BaseInput
            type="number"
            value={vehicle.fields.wltp_co2_g_km ?? ''}
            onChange={(event) => onFieldChange('wltp_co2_g_km', parseIntegerOrNull(event.target.value))}
          />
        </InputField>

        {showAltFuelField ? (
          <InputField
            label="WLTP CO2 g/km alternate fuel"
            error={getFirstFieldError(fieldErrors, fieldPath('wltp_co2_g_km_alt_fuel'))}
          >
            <BaseInput
              type="number"
              value={vehicle.fields.wltp_co2_g_km_alt_fuel ?? ''}
              onChange={(event) =>
                onFieldChange('wltp_co2_g_km_alt_fuel', parseIntegerOrNull(event.target.value))
              }
            />
          </InputField>
        ) : null}

        <InputField
          label="Last revision date"
          error={getFirstFieldError(fieldErrors, fieldPath('last_revision_date'))}
        >
          <BaseInput
            type="date"
            value={vehicle.fields.last_revision_date ?? ''}
            onChange={(event) => onFieldChange('last_revision_date', event.target.value || null)}
          />
        </InputField>

        <InputField
          label="Blue sticker"
          error={getFirstFieldError(fieldErrors, fieldPath('blue_sticker'))}
        >
          <BaseSelect
            value={vehicle.fields.blue_sticker == null ? '' : String(vehicle.fields.blue_sticker)}
            onChange={(event) => onFieldChange('blue_sticker', toBoolean(event.target.value))}
          >
            <option value="">Select value</option>
            {YES_NO_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </BaseSelect>
        </InputField>

        <InputField label="Annual km" error={getFirstFieldError(fieldErrors, fieldPath('annual_km'))}>
          <BaseInput
            type="number"
            value={vehicle.fields.annual_km ?? ''}
            onChange={(event) => onFieldChange('annual_km', parseIntegerOrNull(event.target.value))}
          />
        </InputField>
      </div>

      {isPassenger ? (
        <div className="grid gap-4 md:grid-cols-2">
          <InputField
            label="Occupancy profile code"
            error={getFirstFieldError(fieldErrors, fieldPath('occupancy_profile_code'))}
          >
            <BaseSelect
              value={vehicle.fields.occupancy_profile_code ?? ''}
              onChange={(event) =>
                onFieldChange('occupancy_profile_code', parseIntegerOrNull(event.target.value))
              }
            >
              <option value="">Select profile</option>
              {PROFILE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </BaseSelect>
          </InputField>

          <InputField label="Load profile code">
            <BaseInput disabled value="Not used for passenger vehicles" />
          </InputField>
        </div>
      ) : null}

      {isGoods ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <InputField
            label="Goods vehicle over 3.5 tons"
            error={getFirstFieldError(fieldErrors, fieldPath('goods_vehicle_over_3_5_tons'))}
          >
            <BaseSelect
              value={
                vehicle.fields.goods_vehicle_over_3_5_tons == null
                  ? ''
                  : String(vehicle.fields.goods_vehicle_over_3_5_tons)
              }
              onChange={(event) => onFieldChange('goods_vehicle_over_3_5_tons', toBoolean(event.target.value))}
            >
              <option value="">Select value</option>
              {YES_NO_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </BaseSelect>
          </InputField>

          <InputField
            label="Load profile code"
            error={getFirstFieldError(fieldErrors, fieldPath('load_profile_code'))}
          >
            <BaseSelect
              value={vehicle.fields.load_profile_code ?? ''}
              onChange={(event) => onFieldChange('load_profile_code', parseIntegerOrNull(event.target.value))}
            >
              <option value="">Select profile</option>
              {PROFILE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </BaseSelect>
          </InputField>

          <InputField label="Occupancy profile code">
            <BaseInput disabled value="Not used for goods vehicles" />
          </InputField>
        </div>
      ) : null}

      {!isPassenger && !isGoods ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
          Select a transport mode to unlock the mode-specific fields.
        </div>
      ) : null}

      <InputField label="Row notes">
        <textarea
          className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          value={vehicle.row_notes ?? ''}
          onChange={(event) => onNotesChange(event.target.value)}
          placeholder="Optional internal notes for this row"
        />
      </InputField>

      {Object.keys(vehicle.field_sources || {}).length ? (
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="text-sm font-medium text-slate-900">Field sources</div>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs text-slate-600">
            {JSON.stringify(vehicle.field_sources, null, 2)}
          </pre>
        </div>
      ) : null}

      {Object.keys(vehicle.field_warnings || {}).length ? (
        <div className="rounded-xl bg-amber-50 p-4">
          <div className="text-sm font-medium text-amber-900">Field warnings</div>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs text-amber-800">
            {JSON.stringify(vehicle.field_warnings, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
