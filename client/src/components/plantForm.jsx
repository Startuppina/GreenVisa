import React, { useMemo, useState } from "react";
import axios from "axios";
import MessagePopUp from "./messagePopUp";
import { MutatingDots } from "react-loader-spinner";
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

function PlantForm({ plant = "empty", isEdit, onButtonClick, title = null, systemType = null }) {
  const resolvedSystemType = systemType || plant.system_type || "";
  const isThermalSystem = THERMAL_SYSTEM_TYPES.includes(resolvedSystemType);
  const isVentilation = resolvedSystemType === "Ventilazione meccanica";
  const isLighting = resolvedSystemType === "Illuminazione";
  const requiresFuel = plantRequiresFuel(resolvedSystemType);
  const supportsGasLeak = plantSupportsGasLeak(resolvedSystemType);

  const [plantType, setPlantType] = useState(plant.plant_type || "");
  const [generatorType, setGeneratorType] = useState(plant.generator_type || "");
  const [generatorDescription, setGeneratorDescription] = useState(plant.generator_description || "");
  const [fuelType, setFuelType] = useState(
    resolvedSystemType === "Illuminazione" ? (plant.fuel_type || "Elettricità") : (plant.fuel_type || ""),
  );
  const [fuelConsumption, setFuelConsumption] = useState(plant.fuel_consumption || "");
  const [hasGasLeak, setHasGasLeak] = useState(Boolean(plant.has_gas_leak));
  const [refrigerantGases, setRefrigerantGases] = useState([]);
  const [hasHeatRecovery, setHasHeatRecovery] = useState(Boolean(plant.has_heat_recovery));
  const [incandescentCount, setIncandescentCount] = useState(plant.incandescent_count || 0);
  const [ledCount, setLedCount] = useState(plant.led_count || 0);
  const [gasLampCount, setGasLampCount] = useState(plant.gas_lamp_count || 0);
  const [autoLightingControl, setAutoLightingControl] = useState(Boolean(plant.auto_lighting_control));
  const [isLoading, setIsLoading] = useState(false);
  const [buttonPopup, setButtonPopup] = useState(false);
  const [messagePopup, setMessagePopup] = useState("");

  const { buildingID, triggerRefresh } = useRecoveryContext();

  const generatorOptions = useMemo(
    () => getGeneratorOptions(resolvedSystemType, plantType),
    [plantType, resolvedSystemType],
  );
  const quantityUnit = useMemo(() => getFuelUnit(fuelType), [fuelType]);

  const buildPayload = () => {
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
  };

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const payload = buildPayload();
      const response = isEdit
        ? await axios.put(`/api/buildings/${buildingID}/update/plant/${plant.id}`, payload, { withCredentials: true })
        : await axios.post(`/api/buildings/${buildingID}/upload/plant`, payload, { withCredentials: true });

      if (response.status === 200) {
        setMessagePopup(response.data.msg);
        setButtonPopup(true);
        triggerRefresh();
      }
    } catch (error) {
      setMessagePopup(error.response?.data?.msg || error.message);
      setButtonPopup(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full mx-auto flex justify-center">
      <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
        {messagePopup}
      </MessagePopUp>
      <div className="w-full mx-auto my-4 rounded-2xl border border-gray-300 bg-[#f6f3f3] px-6 py-6 font-arial text-xl shadow-xl">
        <h2 className="mb-6 text-center text-2xl font-bold">{title || (isEdit ? "Modifica Impianto" : "Aggiungi un impianto")}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="mb-4 rounded-lg bg-white px-4 py-3 text-center font-semibold text-[#2d7044]">
            Tipo impianto: {resolvedSystemType}
          </div>

          {(isThermalSystem || isVentilation) && (
            <div className="mb-6 flex flex-col md:flex-row md:gap-4">
              <label className="flex w-full flex-col md:w-1/2">
                <span className="mb-2 block">Tipo di impianto</span>
                <select
                  value={plantType}
                  onChange={(event) => setPlantType(event.target.value)}
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-xl text-gray-900"
                  required
                >
                  <option value="" disabled>Seleziona tipo di impianto</option>
                  {PLANT_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {isThermalSystem && (
            <div className="mb-6 flex flex-col md:flex-row md:gap-4">
              <label className="flex w-full flex-col md:w-1/2">
                <span className="mb-2 block">Tipo di generatore</span>
                <select
                  value={generatorType}
                  onChange={(event) => setGeneratorType(event.target.value)}
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-xl text-gray-900"
                  required
                >
                  <option value="" disabled>Seleziona tipo di generatore</option>
                  {generatorOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              {generatorType === "Altro" && (
                <label className="flex w-full flex-col md:w-1/2">
                  <span className="mb-2 block">Descrizione del generatore</span>
                  <input
                    type="text"
                    value={generatorDescription}
                    onChange={(event) => setGeneratorDescription(event.target.value)}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-xl text-gray-900"
                  />
                </label>
              )}
            </div>
          )}

          {isVentilation && (
            <div className="mb-6">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={hasHeatRecovery}
                  onChange={(event) => setHasHeatRecovery(event.target.checked)}
                  className="h-5 w-5"
                />
                <span className="text-lg">Ventilazione meccanica con recupero</span>
              </label>
            </div>
          )}

          {isLighting && (
            <div className="mb-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <label className="flex flex-col">
                  <span className="mb-2 block">Numero incandescenza</span>
                  <input
                    type="number"
                    min="0"
                    value={incandescentCount}
                    onChange={(event) => setIncandescentCount(event.target.value)}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-xl text-gray-900"
                  />
                </label>
                <label className="flex flex-col">
                  <span className="mb-2 block">Numero LED</span>
                  <input
                    type="number"
                    min="0"
                    value={ledCount}
                    onChange={(event) => setLedCount(event.target.value)}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-xl text-gray-900"
                  />
                </label>
                <label className="flex flex-col">
                  <span className="mb-2 block">Numero a gas</span>
                  <input
                    type="number"
                    min="0"
                    value={gasLampCount}
                    onChange={(event) => setGasLampCount(event.target.value)}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-xl text-gray-900"
                  />
                </label>
              </div>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={autoLightingControl}
                  onChange={(event) => setAutoLightingControl(event.target.checked)}
                  className="h-5 w-5"
                />
                <span className="text-lg">Sistemi di regolazione e controllo automatici dei corpi illuminanti</span>
              </label>
            </div>
          )}

          {requiresFuel && (
            <div className="mb-6 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col">
                <span className="mb-2 block">Tipo di carburante</span>
                <select
                  value={fuelType}
                  onChange={(event) => setFuelType(event.target.value)}
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-xl text-gray-900"
                  disabled={isLighting}
                  required
                >
                  <option value="" disabled>Seleziona tipo di carburante</option>
                  {FUEL_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col">
                <span className="mb-2 block">Quantità consumata {quantityUnit ? `(${quantityUnit})` : ""}</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={fuelConsumption}
                  onChange={(event) => setFuelConsumption(event.target.value)}
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-xl text-gray-900"
                  required
                />
              </label>
            </div>
          )}

          {supportsGasLeak && (
            <>
              <div className="mb-6">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={hasGasLeak}
                    onChange={handleHasGasLeakChange}
                    className="h-5 w-5"
                  />
                  <span className="text-lg">L’impianto ha disperso gas refrigeranti negli ultimi 12 mesi?</span>
                </label>
              </div>

              {hasGasLeak && (
                <div className="mb-6 rounded-xl border border-gray-300 bg-white p-4 shadow-inner">
                  <h3 className="mb-4 text-xl font-semibold">Gas refrigeranti dispersi</h3>

                  {refrigerantGases.map((gas, index) => (
                    <div key={index} className="mb-4 flex flex-col justify-center md:flex-row md:items-end md:gap-4">
                      <label className="flex w-full flex-col md:w-1/2">
                        <span className="mb-2 block">Tipo di gas</span>
                        <select
                          value={gas.type}
                          onChange={(event) => handleGasChange(index, "type", event.target.value)}
                          className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-xl text-gray-900"
                        >
                          <option value="">Seleziona un gas</option>
                          {GAS_NAMES.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </label>

                      <label className="flex w-full flex-col md:w-1/3">
                        <span className="mb-2 block">Quantità (kg)</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={gas.quantity}
                          onChange={(event) => handleGasChange(index, "quantity", event.target.value)}
                          className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-xl text-gray-900"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => removeGasField(index)}
                        className="mt-2 text-red-600 hover:text-red-800 md:mt-0"
                        title="Rimuovi"
                      >
                        Elimina
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addGasField}
                    className="mt-2 text-lg font-semibold text-[#2d7044] hover:underline"
                  >
                    + Aggiungi un altro gas
                  </button>
                </div>
              )}
            </>
          )}

          {isLoading ? (
            <div className="mt-5 flex items-center justify-center">
              <MutatingDots
                height="100"
                width="100"
                color="#2d7044"
                secondaryColor="#2d7044"
                radius="12.5"
                ariaLabel="mutating-dots-loading"
                visible
              />
            </div>
          ) : (
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="submit"
                className="mt-7 w-[30%] rounded-lg border-2 border-transparent bg-[#2d7044] p-1 font-arial text-xl text-white transition-colors duration-300 ease-in-out hover:border-[#2d7044] hover:bg-white hover:text-[#2d7044] md:w-[30%] md:text-2xl lg:w-[20%] lg:text-2xl"
              >
                Salva
              </button>
              <button
                type="button"
                onClick={onButtonClick}
                className="mt-7 w-[30%] rounded-lg border-2 border-transparent bg-gray-500 p-1 font-arial text-xl text-white transition-colors duration-300 ease-in-out hover:border-gray-500 hover:bg-white hover:text-gray-500 md:w-[30%] md:text-2xl lg:w-[20%] lg:text-2xl"
              >
                Annulla
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default PlantForm;
