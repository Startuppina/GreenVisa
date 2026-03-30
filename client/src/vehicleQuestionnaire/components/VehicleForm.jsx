import { euroEmissions, fuelTypes, vehicleTypes } from "../model";
import BlueTicketToggle from "./BlueTicketToggle";

const inputClassName =
  "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100";

const VehicleForm = ({ result, onFieldChange, blueTicket, setBlueTicket }) => {
  return (
    <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
      <div className="flex flex-col gap-2">
        <label
          className="text-sm font-medium text-slate-700"
          htmlFor="registrationYear"
        >
          Anno di immatricolazione
        </label>
        <input
          className={inputClassName}
          type="number"
          id="registrationYear"
          min={1900}
          value={result.registrationYear}
          onChange={(e) =>
            onFieldChange("registrationYear", Number(e.target.value))
          }
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          className="text-sm font-medium text-slate-700"
          htmlFor="emissionArea"
        >
          Area di emissione
        </label>
        <select
          className={inputClassName}
          id="emissionArea"
          value={result.emissionArea}
          onChange={(e) => onFieldChange("emissionArea", e.target.value)}
        >
          {euroEmissions.map((emission) => (
            <option key={emission} value={emission}>
              {emission}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label
          className="text-sm font-medium text-slate-700"
          htmlFor="fuelType"
        >
          Tipo di carburante
        </label>
        <select
          className={inputClassName}
          id="fuelType"
          value={result.fuelType}
          onChange={(e) => onFieldChange("fuelType", e.target.value)}
        >
          {fuelTypes.map((fuel) => (
            <option key={fuel} value={fuel}>
              {fuel}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label
          className="text-sm font-medium text-slate-700"
          htmlFor="lastRevision"
        >
          Ultima revisione
        </label>
        <input
          className={inputClassName}
          type="date"
          id="lastRevision"
          value={result.lastRevision}
          onChange={(e) => onFieldChange("lastRevision", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          className="text-sm font-medium text-slate-700"
          htmlFor="kmPerYear"
        >
          KM per anno
        </label>
        <input
          className={inputClassName}
          type="number"
          id="kmPerYear"
          min={0}
          value={result.kmPerYear}
          onChange={(e) => onFieldChange("kmPerYear", Number(e.target.value))}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          className="text-sm font-medium text-slate-700"
          htmlFor="timeWithPeople"
        >
          Tempo con passeggeri (%)
        </label>
        <input
          className={inputClassName}
          type="number"
          id="timeWithPeople"
          value={result.timeWithPeople}
          min={0}
          max={100}
          onChange={(e) =>
            onFieldChange("timeWithPeople", Number(e.target.value))
          }
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="weight">
          Peso (kg)
        </label>
        <input
          className={inputClassName}
          type="number"
          id="weight"
          min={0}
          value={result.weight}
          onChange={(e) => onFieldChange("weight", Number(e.target.value))}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          className="text-sm font-medium text-slate-700"
          htmlFor="kmWithLoad"
        >
          KM con carico
        </label>
        <input
          className={inputClassName}
          type="number"
          id="kmWithLoad"
          min={0}
          value={result.kmWithLoad}
          onChange={(e) => onFieldChange("kmWithLoad", Number(e.target.value))}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          className="text-sm font-medium text-slate-700"
          htmlFor="vehicleType"
        >
          Tipo di veicolo
        </label>
        <select
          className={inputClassName}
          id="vehicleType"
          value={result.vehicleType}
          onChange={(e) => onFieldChange("vehicleType", e.target.value)}
        >
          {vehicleTypes.map((vehicleType) => (
            <option key={vehicleType} value={vehicleType}>
              {vehicleType}
            </option>
          ))}
        </select>
      </div>

      <BlueTicketToggle value={blueTicket} onChange={setBlueTicket} />
    </div>
  );
};

export default VehicleForm;
