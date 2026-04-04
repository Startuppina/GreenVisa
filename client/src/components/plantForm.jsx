import React, { useCallback, useMemo, useState } from "react";
import axios from "axios";
import AutosaveStatus from "./AutosaveStatus";
import useAutosave from "./useAutosave";
import { useRecoveryContext } from "../provider/provider";
import {
  getFuelUnit,
  getGeneratorOptions,
  PLANT_TYPE_OPTIONS,
  plantRequiresFuel,
  plantSupportsGasLeak,
  THERMAL_SYSTEM_TYPES,
} from "./plantCatalog";

const GAS_NAMES = [
  "Idrogeno verde - zero emissioni",
  "R1233ZD",
  "R1234YF",
  "R1234ZE",
  "R125A",
  "R134A",
  "R23",
  "R236FA",
  "R245FA",
  "R290",
  "R32",
  "R404A",
  "R407A",
  "R407C",
  "R407F",
  "R407H",
  "R408A",
  "R409A",
  "R410A",
  "R413A",
  "R417A",
  "R422A",
  "R422B",
  "R422D",
  "R427A",
  "R434A",
  "R437A",
  "R438A",
  "R448A",
  "R449A",
  "R450A",
  "R452A",
  "R452B",
  "R454A",
  "R454B",
  "R454C",
  "R455A",
  "R456A",
  "R507",
  "R508B",
  "R513A",
  "R515B",
  "R600a",
  "R744",
];

const FUEL_OPTIONS = [
  "Gas Naturale (Metano)",
  "GPL",
  "Gasolio",
  "Benzina",
  "Olio combustibile",
  "Pellet",
  "Cippato di legna",
  "Biogas",
  "Elettricità",
  "Energia termica",
];

const inputClassName = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 disabled:bg-slate-100 disabled:text-slate-500";

function Field({ label, children, hint = null }) {
  return (
    <label className="space-y-2">
      <div className="text-sm font-medium text-slate-800">{label}</div>
      {children}
      {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
    </label>
  );
}

function PlantForm({
  plant = "empty",
  isEdit,
  onButtonClick,
  onSubmitSuccess,
  title = null,
  systemType = null,
  readOnly = false,
  onDeletePlant = null,
}) {
  const resolvedSystemType = systemType || plant.system_type || "";
  const isThermalSystem = THERMAL_SYSTEM_TYPES.includes(resolvedSystemType);
  const isVentilation = resolvedSystemType === "Ventilazione meccanica";
  const isLighting = resolvedSystemType === "Illuminazione";
  const requiresFuel = plantRequiresFuel(resolvedSystemType);
  const supportsGasLeak = plantSupportsGasLeak(resolvedSystemType);

  const [plantType, setPlantType] = useState(plant.plant_type || "");
  const [generatorType, setGeneratorType] = useState(plant.generator_type || "");
  const [generatorDescription, setGeneratorDescription] = useState(plant.generator_description || "");
  const [fuelType, setFuelType] = useState(plant.fuel_type || "");
  const [fuelConsumption, setFuelConsumption] = useState(plant.fuel_consumption || "");
  const [hasGasLeak, setHasGasLeak] = useState(Boolean(plant.has_gas_leak || plant.refrigerantGases?.length));
  const [refrigerantGases, setRefrigerantGases] = useState(
    (plant.refrigerantGases || []).map((gas) => ({
      type: gas.gas_type || gas.type || "",
      quantity: gas.quantity_kg || gas.quantity || "",
    })),
  );
  const [hasHeatRecovery, setHasHeatRecovery] = useState(Boolean(plant.has_heat_recovery));
  const [incandescentCount, setIncandescentCount] = useState(plant.incandescent_count || 0);
  const [ledCount, setLedCount] = useState(plant.led_count || 0);
  const [gasLampCount, setGasLampCount] = useState(plant.gas_lamp_count || 0);
  const [autoLightingControl, setAutoLightingControl] = useState(Boolean(plant.auto_lighting_control));

  const { buildingID, triggerRefresh } = useRecoveryContext();

  const generatorOptions = useMemo(
    () => getGeneratorOptions(resolvedSystemType, plantType),
    [plantType, resolvedSystemType],
  );
  const quantityUnit = useMemo(() => getFuelUnit(fuelType), [fuelType]);

  const buildPayload = useCallback(() => {
    const payload = {
      systemType: resolvedSystemType,
      plantType: isLighting ? null : plantType || null,
      generatorType: isThermalSystem ? generatorType : null,
      generatorDescription: isThermalSystem && generatorType === "Altro" ? generatorDescription : "",
      fuelType: requiresFuel ? fuelType : null,
      fuelConsumption: requiresFuel ? fuelConsumption : null,
      fuelUnit: requiresFuel ? quantityUnit : null,
      hasHeatRecovery: isVentilation ? hasHeatRecovery : false,
      incandescentCount: isLighting ? incandescentCount : 0,
      ledCount: isLighting ? ledCount : 0,
      gasLampCount: isLighting ? gasLampCount : 0,
      autoLightingControl: isLighting ? autoLightingControl : false,
      hasGasLeak: supportsGasLeak ? hasGasLeak : false,
      refrigerantGases: [],
    };

    if (supportsGasLeak && hasGasLeak) {
      const validGases = refrigerantGases.filter(
        (gas) => gas.type.trim() !== "" && gas.quantity !== "" && !isNaN(Number(gas.quantity)) && Number(gas.quantity) > 0,
      );
      if (validGases.length === 0) {
        throw new Error("Devi inserire almeno un gas refrigerante. Altrimenti rimuovi la spunta");
      }
      payload.refrigerantGases = validGases;
    }

    return payload;
  }, [
    autoLightingControl,
    fuelConsumption,
    fuelType,
    gasLampCount,
    generatorDescription,
    generatorType,
    hasGasLeak,
    hasHeatRecovery,
    incandescentCount,
    isLighting,
    isThermalSystem,
    isVentilation,
    ledCount,
    plantType,
    quantityUnit,
    refrigerantGases,
    requiresFuel,
    resolvedSystemType,
    supportsGasLeak,
  ]);

  const handleGasChange = (index, field, value) => {
    const updated = [...refrigerantGases];
    updated[index][field] = value;
    setRefrigerantGases(updated);
  };

  const addGasField = () => {
    setRefrigerantGases([...refrigerantGases, { type: "", quantity: "" }]);
  };

  const removeGasField = (index) => {
    setRefrigerantGases(refrigerantGases.filter((_, gasIndex) => gasIndex !== index));
  };

  const handleHasGasLeakChange = (event) => {
    setHasGasLeak(event.target.checked);
    if (event.target.checked && refrigerantGases.length === 0) {
      setRefrigerantGases([{ type: "", quantity: "" }]);
    }
    if (!event.target.checked) {
      setRefrigerantGases([]);
    }
  };

  const canAutosave = useMemo(() => {
    if (!resolvedSystemType) {
      return false;
    }

    if ((isThermalSystem || isVentilation) && !plantType) {
      return false;
    }

    if (isThermalSystem && !generatorType) {
      return false;
    }

    if (isThermalSystem && generatorType === "Altro" && !generatorDescription.trim()) {
      return false;
    }

    if (requiresFuel && !fuelType) {
      return false;
    }

    if (requiresFuel && fuelConsumption === "") {
      return false;
    }

    if (isLighting) {
      const counts = [incandescentCount, ledCount, gasLampCount].map((value) => Number(value));
      if (counts.some((value) => !Number.isFinite(value) || value < 0)) {
        return false;
      }
      if (counts.reduce((total, value) => total + value, 0) <= 0) {
        return false;
      }
    }

    if (supportsGasLeak && hasGasLeak) {
      return refrigerantGases.some(
        (gas) => gas.type.trim() !== "" && gas.quantity !== "" && Number.isFinite(Number(gas.quantity)) && Number(gas.quantity) > 0,
      );
    }

    return true;
  }, [
    fuelConsumption,
    fuelType,
    gasLampCount,
    generatorDescription,
    generatorType,
    hasGasLeak,
    incandescentCount,
    isLighting,
    isThermalSystem,
    isVentilation,
    ledCount,
    plantType,
    refrigerantGases,
    requiresFuel,
    resolvedSystemType,
    supportsGasLeak,
  ]);

  const autosaveSignature = useMemo(() => JSON.stringify({
    resolvedSystemType,
    plantType,
    generatorType,
    generatorDescription,
    fuelType,
    fuelConsumption,
    hasGasLeak,
    refrigerantGases,
    hasHeatRecovery,
    incandescentCount,
    ledCount,
    gasLampCount,
    autoLightingControl,
  }), [
    autoLightingControl,
    fuelConsumption,
    fuelType,
    gasLampCount,
    generatorDescription,
    generatorType,
    hasGasLeak,
    hasHeatRecovery,
    incandescentCount,
    ledCount,
    plantType,
    refrigerantGases,
    resolvedSystemType,
  ]);

  const savePlant = useCallback(async () => {
    const payload = buildPayload();
    const response = isEdit
      ? await axios.put(`/api/buildings/${buildingID}/update/plant/${plant.id}`, payload, { withCredentials: true })
      : await axios.post(`/api/buildings/${buildingID}/upload/plant`, payload, { withCredentials: true });

    if (response.status === 200) {
      triggerRefresh();
      if (typeof onSubmitSuccess === "function") {
        onSubmitSuccess();
      }
    }
  }, [buildPayload, buildingID, isEdit, onSubmitSuccess, plant.id, triggerRefresh]);

  const autosave = useAutosave({
    valueSignature: autosaveSignature,
    enabled: !readOnly,
    canSave: canAutosave,
    onSave: savePlant,
  });

  const statusLabel = readOnly ? "Scheda salvata" : "Scheda compilabile";
  const statusClassName = readOnly ? "bg-slate-100 text-slate-700" : "bg-emerald-100 text-emerald-700";
  const canCancel = typeof onButtonClick === "function";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            {title || (isEdit ? "Scheda impianto" : "Nuovo impianto")}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Le modifiche vengono salvate automaticamente come nel questionario trasporti. La scheda diventa in sola lettura solo a edificio finalizzato.
          </p>
        </div>
        <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusClassName}`}>
          {statusLabel}
        </div>
      </div>

      <form onSubmit={(event) => event.preventDefault()}>
        <fieldset disabled={readOnly} className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-medium text-slate-800">Categoria impianto</div>
            <div className="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-700">
              {resolvedSystemType || "-"}
            </div>
          </div>

          {(isThermalSystem || isVentilation) && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Tipo di impianto">
                <select
                  value={plantType}
                  onChange={(event) => setPlantType(event.target.value)}
                  className={inputClassName}
                  required
                >
                  <option value="" disabled>Seleziona tipo di impianto</option>
                  {PLANT_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </Field>
            </div>
          )}

          {isThermalSystem && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Tipo di generatore">
                <select
                  value={generatorType}
                  onChange={(event) => setGeneratorType(event.target.value)}
                  className={inputClassName}
                  required
                >
                  <option value="" disabled>Seleziona tipo di generatore</option>
                  {generatorOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </Field>

              {generatorType === "Altro" && (
                <Field label="Descrizione del generatore">
                  <input
                    type="text"
                    value={generatorDescription}
                    onChange={(event) => setGeneratorDescription(event.target.value)}
                    className={inputClassName}
                  />
                </Field>
              )}
            </div>
          )}

          {isVentilation && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <label className="flex items-center gap-3 text-sm text-slate-800">
                <input
                  type="checkbox"
                  checked={hasHeatRecovery}
                  onChange={(event) => setHasHeatRecovery(event.target.checked)}
                  className="h-4 w-4"
                />
                Ventilazione meccanica con recupero
              </label>
            </div>
          )}

          {isLighting && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Numero incandescenza">
                  <input type="number" min="0" value={incandescentCount} onChange={(event) => setIncandescentCount(event.target.value)} className={inputClassName} />
                </Field>
                <Field label="Numero LED">
                  <input type="number" min="0" value={ledCount} onChange={(event) => setLedCount(event.target.value)} className={inputClassName} />
                </Field>
                <Field label="Numero a gas">
                  <input type="number" min="0" value={gasLampCount} onChange={(event) => setGasLampCount(event.target.value)} className={inputClassName} />
                </Field>
              </div>

              <label className="mt-4 flex items-center gap-3 text-sm text-slate-800">
                <input
                  type="checkbox"
                  checked={autoLightingControl}
                  onChange={(event) => setAutoLightingControl(event.target.checked)}
                  className="h-4 w-4"
                />
                Sistemi di regolazione e controllo automatici dei corpi illuminanti
              </label>
            </div>
          )}

          {requiresFuel && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Tipo di carburante">
                <select
                  value={fuelType}
                  onChange={(event) => setFuelType(event.target.value)}
                  className={inputClassName}
                  required
                >
                  <option value="" disabled>Seleziona tipo di carburante</option>
                  {FUEL_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </Field>

              <Field label={`Quantità consumata${quantityUnit ? ` (${quantityUnit})` : ""}`}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={fuelConsumption}
                  onChange={(event) => setFuelConsumption(event.target.value)}
                  className={inputClassName}
                  required
                />
              </Field>
            </div>
          )}

          {supportsGasLeak && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <label className="flex items-center gap-3 text-sm text-slate-800">
                <input
                  type="checkbox"
                  checked={hasGasLeak}
                  onChange={handleHasGasLeakChange}
                  className="h-4 w-4"
                />
                L’impianto ha disperso gas refrigeranti negli ultimi 12 mesi?
              </label>

              {hasGasLeak && (
                <div className="mt-4 space-y-4">
                  {refrigerantGases.map((gas, index) => (
                    <div key={index} className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px_auto] md:items-end">
                      <Field label="Tipo di gas">
                        <select
                          value={gas.type}
                          onChange={(event) => handleGasChange(index, "type", event.target.value)}
                          className={inputClassName}
                        >
                          <option value="">Seleziona un gas</option>
                          {GAS_NAMES.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </Field>

                      <Field label="Quantità (kg)">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={gas.quantity}
                          onChange={(event) => handleGasChange(index, "quantity", event.target.value)}
                          className={inputClassName}
                        />
                      </Field>

                      {!readOnly ? (
                        <button
                          type="button"
                          onClick={() => removeGasField(index)}
                          className="rounded-lg border border-rose-200 px-3 py-2 text-sm text-rose-700 transition hover:bg-rose-50"
                        >
                          Elimina
                        </button>
                      ) : null}
                    </div>
                  ))}

                  {!readOnly ? (
                    <button
                      type="button"
                      onClick={addGasField}
                      className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      + Aggiungi un altro gas
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </fieldset>
      </form>

      <AutosaveStatus
        readOnly={readOnly}
        isDirty={autosave.isDirty}
        isSaving={autosave.isSaving}
        canSave={canAutosave}
        saveError={autosave.saveError}
        saveSuccessAt={autosave.saveSuccessAt}
        idleLabel="Le modifiche alla scheda impianto vengono salvate automaticamente."
        incompleteLabel="Completa i campi obbligatori della scheda per attivare il salvataggio automatico."
      />

      {!readOnly && canCancel ? (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onButtonClick}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Annulla
          </button>
        </div>
      ) : null}

      {isEdit && typeof onDeletePlant === "function" ? (
        <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onDeletePlant}
            className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
          >
            Elimina impianto
          </button>
        </div>
      ) : null}
    </section>
  );
}

export default PlantForm;
