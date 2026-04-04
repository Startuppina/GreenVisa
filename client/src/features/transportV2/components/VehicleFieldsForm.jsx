import {
  EURO_CLASS_OPTIONS,
  FUEL_TYPE_OPTIONS,
  getFirstFieldError,
  isDualFuelType,
  PROFILE_OPTIONS,
  TRANSPORT_MODE_OPTIONS,
} from "../utils/validation.js";
import YesNoSwitch from "./YesNoSwitch.jsx";

function parseIntegerOrNull(value) {
  if (value === "") {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function InputField({ label, labelId, error, children, hint }) {
  return (
    <div className="flex flex-col gap-2">
      <div id={labelId} className="text-sm font-medium text-slate-800">
        {label}
      </div>
      {children}
      {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
      {error ? <div className="text-sm text-rose-600">{error}</div> : null}
    </div>
  );
}

function BaseInput(props) {
  return (
    <input
      {...props}
      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:bg-slate-100"
    />
  );
}

function BaseSelect(props) {
  return (
    <select
      {...props}
      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:bg-slate-100"
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
  readOnly,
}) {
  const fieldPath = (name) => `draft.vehicles[${vehicleIndex}].fields.${name}`;
  const vehiclePath = (name) => `draft.vehicles[${vehicleIndex}].${name}`;
  const isPassenger = vehicle.transport_mode === "passenger";
  const isGoods = vehicle.transport_mode === "goods";
  const showAltFuelField = isDualFuelType(vehicle.fields.fuel_type);

  return (
    <fieldset disabled={readOnly} className="space-y-10">
      <div>
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Modalità e documento
        </h3>
        <div className="grid gap-6 md:grid-cols-2">
          <InputField
            label="Modalità di trasporto"
            labelId={`vm-${vehicle.vehicle_id}`}
            error={getFirstFieldError(fieldErrors, vehiclePath("transport_mode"))}
          >
            <BaseSelect
              aria-labelledby={`vm-${vehicle.vehicle_id}`}
              value={vehicle.transport_mode ?? ""}
              onChange={(event) =>
                onTransportModeChange(event.target.value || null)
              }
            >
              <option value="">Seleziona…</option>
              {TRANSPORT_MODE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </BaseSelect>
          </InputField>

          <InputField label="Documento OCR" labelId={`ocr-${vehicle.vehicle_id}`}>
            <BaseInput
              aria-labelledby={`ocr-${vehicle.vehicle_id}`}
              disabled
              value={vehicle.ocr_document_id ?? "Inserimento manuale"}
            />
          </InputField>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Dati tecnici del veicolo
        </h3>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          <InputField
            label="Anno di immatricolazione"
            labelId={`ry-${vehicle.vehicle_id}`}
            error={getFirstFieldError(
              fieldErrors,
              fieldPath("registration_year"),
            )}
          >
            <BaseInput
              aria-labelledby={`ry-${vehicle.vehicle_id}`}
              type="number"
              value={vehicle.fields.registration_year ?? ""}
              onChange={(event) =>
                onFieldChange(
                  "registration_year",
                  parseIntegerOrNull(event.target.value),
                )
              }
            />
          </InputField>

          <InputField
            label="Classe Euro"
            labelId={`ec-${vehicle.vehicle_id}`}
            error={getFirstFieldError(fieldErrors, fieldPath("euro_class"))}
          >
            <BaseSelect
              aria-labelledby={`ec-${vehicle.vehicle_id}`}
              value={vehicle.fields.euro_class ?? ""}
              onChange={(event) =>
                onFieldChange("euro_class", event.target.value || null)
              }
            >
              <option value="">Seleziona classe Euro</option>
              {EURO_CLASS_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value.replaceAll("_", " ")}
                </option>
              ))}
            </BaseSelect>
          </InputField>

          <InputField
            label="Tipo di carburante"
            labelId={`ft-${vehicle.vehicle_id}`}
            error={getFirstFieldError(fieldErrors, fieldPath("fuel_type"))}
          >
            <BaseSelect
              aria-labelledby={`ft-${vehicle.vehicle_id}`}
              value={vehicle.fields.fuel_type ?? ""}
              onChange={(event) =>
                onFieldChange("fuel_type", event.target.value || null)
              }
            >
              <option value="">Seleziona carburante</option>
              {FUEL_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </BaseSelect>
          </InputField>

          <InputField
            label="Emissioni CO₂ (g/km)"
            labelId={`co2-${vehicle.vehicle_id}`}
            error={getFirstFieldError(
              fieldErrors,
              fieldPath("co2_emissions_g_km"),
            )}
          >
            <BaseInput
              aria-labelledby={`co2-${vehicle.vehicle_id}`}
              type="number"
              value={vehicle.fields.co2_emissions_g_km ?? ""}
              onChange={(event) =>
                onFieldChange(
                  "co2_emissions_g_km",
                  parseIntegerOrNull(event.target.value),
                )
              }
            />
          </InputField>

          {showAltFuelField ? (
            <InputField
              label="CO₂ — carburante alternativo (g/km)"
              labelId={`co2alt-${vehicle.vehicle_id}`}
              error={getFirstFieldError(
                fieldErrors,
                fieldPath("wltp_co2_g_km_alt_fuel"),
              )}
            >
              <BaseInput
                aria-labelledby={`co2alt-${vehicle.vehicle_id}`}
                type="number"
                value={vehicle.fields.wltp_co2_g_km_alt_fuel ?? ""}
                onChange={(event) =>
                  onFieldChange(
                    "wltp_co2_g_km_alt_fuel",
                    parseIntegerOrNull(event.target.value),
                  )
                }
              />
            </InputField>
          ) : null}

          <InputField
            label="Data ultima revisione"
            labelId={`rev-${vehicle.vehicle_id}`}
            error={getFirstFieldError(
              fieldErrors,
              fieldPath("last_revision_date"),
            )}
          >
            <BaseInput
              aria-labelledby={`rev-${vehicle.vehicle_id}`}
              type="date"
              value={vehicle.fields.last_revision_date ?? ""}
              onChange={(event) =>
                onFieldChange("last_revision_date", event.target.value || null)
              }
            />
          </InputField>

          <InputField
            label="Adesivo blu (crit’air / equivalente)"
            labelId={`bs-${vehicle.vehicle_id}`}
            error={getFirstFieldError(fieldErrors, fieldPath("blue_sticker"))}
          >
            <YesNoSwitch
              aria-labelledby={`bs-${vehicle.vehicle_id}`}
              value={vehicle.fields.blue_sticker}
              onChange={(v) => onFieldChange("blue_sticker", v)}
              disabled={readOnly}
            />
          </InputField>

          <InputField
            label="Chilometraggio annuo (km)"
            labelId={`akm-${vehicle.vehicle_id}`}
            error={getFirstFieldError(fieldErrors, fieldPath("annual_km"))}
          >
            <BaseInput
              aria-labelledby={`akm-${vehicle.vehicle_id}`}
              type="number"
              value={vehicle.fields.annual_km ?? ""}
              onChange={(event) =>
                onFieldChange("annual_km", parseIntegerOrNull(event.target.value))
              }
            />
          </InputField>
        </div>
      </div>

      {isPassenger ? (
        <div>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Passeggeri — profili
          </h3>
          <div className="grid gap-6 md:grid-cols-2">
            <InputField
              label="Codice profilo di occupazione"
              labelId={`opc-${vehicle.vehicle_id}`}
              error={getFirstFieldError(
                fieldErrors,
                fieldPath("occupancy_profile_code"),
              )}
            >
              <BaseSelect
                aria-labelledby={`opc-${vehicle.vehicle_id}`}
                value={vehicle.fields.occupancy_profile_code ?? ""}
                onChange={(event) =>
                  onFieldChange(
                    "occupancy_profile_code",
                    parseIntegerOrNull(event.target.value),
                  )
                }
              >
                <option value="">Seleziona profilo</option>
                {PROFILE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </BaseSelect>
            </InputField>

            <InputField
              label="Profilo di carico"
              labelId={`lpc-d-${vehicle.vehicle_id}`}
            >
              <BaseInput
                aria-labelledby={`lpc-d-${vehicle.vehicle_id}`}
                disabled
                value="Non applicabile ai passeggeri"
              />
            </InputField>
          </div>
        </div>
      ) : null}

      {isGoods ? (
        <div>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Merci — massa e carico
          </h3>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            <InputField
              label="Veicolo oltre 3,5 t"
              labelId={`g35-${vehicle.vehicle_id}`}
              error={getFirstFieldError(
                fieldErrors,
                fieldPath("goods_vehicle_over_3_5_tons"),
              )}
            >
              <YesNoSwitch
                aria-labelledby={`g35-${vehicle.vehicle_id}`}
                value={vehicle.fields.goods_vehicle_over_3_5_tons}
                onChange={(v) => onFieldChange("goods_vehicle_over_3_5_tons", v)}
                disabled={readOnly}
              />
            </InputField>

            <InputField
              label="Codice profilo di carico"
              labelId={`lpc-${vehicle.vehicle_id}`}
              error={getFirstFieldError(
                fieldErrors,
                fieldPath("load_profile_code"),
              )}
            >
              <BaseSelect
                aria-labelledby={`lpc-${vehicle.vehicle_id}`}
                value={vehicle.fields.load_profile_code ?? ""}
                onChange={(event) =>
                  onFieldChange(
                    "load_profile_code",
                    parseIntegerOrNull(event.target.value),
                  )
                }
              >
                <option value="">Seleziona profilo</option>
                {PROFILE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </BaseSelect>
            </InputField>

            <InputField
              label="Profilo di occupazione"
              labelId={`opc-d-${vehicle.vehicle_id}`}
            >
              <BaseInput
                aria-labelledby={`opc-d-${vehicle.vehicle_id}`}
                disabled
                value="Non applicabile ai veicoli merci"
              />
            </InputField>
          </div>
        </div>
      ) : null}

      {!isPassenger && !isGoods ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Scegli prima la modalità di trasporto (passeggeri o merci) per mostrare i campi dedicati.
        </p>
      ) : null}

      <div>
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Note sulla riga
        </h3>
        <InputField
          label="Annotazioni (facoltative)"
          labelId={`notes-${vehicle.vehicle_id}`}
        >
          <textarea
            aria-labelledby={`notes-${vehicle.vehicle_id}`}
            className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            value={vehicle.row_notes ?? ""}
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder="Es. veicolo in leasing, uso misto, verifiche da fare…"
          />
        </InputField>
      </div>

      {Object.keys(vehicle.field_sources || {}).length ? (
        <div className="border-t border-slate-200 pt-8">
          <div className="text-sm font-medium text-slate-900">
            Origine dei campi (debug)
          </div>
          <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            {JSON.stringify(vehicle.field_sources, null, 2)}
          </pre>
        </div>
      ) : null}

      {Object.keys(vehicle.field_warnings || {}).length ? (
        <div className="border-t border-amber-200 pt-8">
          <div className="text-sm font-medium text-amber-900">
            Avvisi sui campi
          </div>
          <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
            {JSON.stringify(vehicle.field_warnings, null, 2)}
          </pre>
        </div>
      ) : null}
    </fieldset>
  );
}
