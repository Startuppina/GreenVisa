const VehiclesTable = ({ vehicles, onEdit, onDelete }) => {
  if (!vehicles.length) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
        Nessun veicolo aggiunto.
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="grid gap-3 md:hidden">
        {vehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            className="rounded-xl border border-slate-200 p-4"
          >
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p className="text-slate-500">Anno</p>
              <p className="font-medium text-slate-800">
                {vehicle.registrationYear}
              </p>
              <p className="text-slate-500">Emissioni</p>
              <p className="font-medium text-slate-800">
                {vehicle.emissionArea}
              </p>
              <p className="text-slate-500">Carburante</p>
              <p className="font-medium text-slate-800">{vehicle.fuelType}</p>
              <p className="text-slate-500">Revisione</p>
              <p className="font-medium text-slate-800">
                {vehicle.lastRevision}
              </p>
              <p className="text-slate-500">Bollino blu</p>
              <p className="font-medium text-slate-800">
                {vehicle.blueTicket ? "Si" : "No"}
              </p>
              <p className="text-slate-500">KM/anno</p>
              <p className="font-medium text-slate-800">{vehicle.kmPerYear}</p>
              <p className="text-slate-500">Tempo passeggeri</p>
              <p className="font-medium text-slate-800">
                {vehicle.timeWithPeople}
              </p>
              <p className="text-slate-500">Peso</p>
              <p className="font-medium text-slate-800">{vehicle.weight}</p>
              <p className="text-slate-500">KM con carico</p>
              <p className="font-medium text-slate-800">{vehicle.kmWithLoad}</p>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => onEdit(vehicle)}
                className="flex-1 rounded-md border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
              >
                Modifica
              </button>
              <button
                type="button"
                onClick={() => onDelete(vehicle.id)}
                className="flex-1 rounded-md border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
              >
                Elimina
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-emerald-50 text-slate-700">
            <tr>
              <th className="px-3 py-2">Anno</th>
              <th className="px-3 py-2">Emissioni</th>
              <th className="px-3 py-2">Carburante</th>
              <th className="px-3 py-2">Revisione</th>
              <th className="px-3 py-2">Biglietto blu</th>
              <th className="px-3 py-2">KM/anno</th>
              <th className="px-3 py-2">Tempo passeggeri</th>
              <th className="px-3 py-2">Peso</th>
              <th className="px-3 py-2">KM con carico</th>
              <th className="px-3 py-2">Tipo di veicolo</th>
              <th className="px-3 py-2">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id} className="border-t border-slate-100">
                <td className="px-3 py-2">{vehicle.registrationYear}</td>
                <td className="px-3 py-2">{vehicle.emissionArea}</td>
                <td className="px-3 py-2">{vehicle.fuelType}</td>
                <td className="px-3 py-2">{vehicle.lastRevision}</td>
                <td className="px-3 py-2">
                  {vehicle.blueTicket ? "Si" : "No"}
                </td>
                <td className="px-3 py-2">{vehicle.kmPerYear}</td>
                <td className="px-3 py-2">{vehicle.timeWithPeople}</td>
                <td className="px-3 py-2">{vehicle.weight}</td>
                <td className="px-3 py-2">{vehicle.kmWithLoad}</td>
                <td className="px-3 py-2">{vehicle.vehicleType}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(vehicle)}
                      className="rounded-md border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                    >
                      Modifica
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(vehicle.id)}
                      className="rounded-md border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                    >
                      Elimina
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VehiclesTable;
