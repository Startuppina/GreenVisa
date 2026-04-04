import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import ConfirmPopUp from "./confirmPopUp";
import MessagePopUp from "./messagePopUp";
import PlantForm from "./plantForm";
import SolarForm from "./solarForm";
import PhotoForm from "./photoForm";
import { useRecoveryContext } from "../provider/provider";
import { getFuelUnit, PLANT_SELECTOR_OPTIONS } from "./plantCatalog";

function BuildingPlantManager() {
  const { buildingID, refresh, triggerRefresh, buildingLocked } = useRecoveryContext();
  const [plants, setPlants] = useState([]);
  const [solars, setSolars] = useState([]);
  const [photovoltaics, setPhotovoltaics] = useState([]);
  const [draftType, setDraftType] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [popupConfirmDelete, setPopupConfirmDelete] = useState(false);
  const [messageConfirm, setMessageConfirm] = useState("");
  const [buttonPopup, setButtonPopup] = useState(false);
  const [messagePopup, setMessagePopup] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      if (!buildingID) {
        setPlants([]);
        setSolars([]);
        setPhotovoltaics([]);
        return;
      }

      try {
        const [plantsResponse, solarsResponse, photosResponse] = await Promise.all([
          axios.get(`/api/buildings/${buildingID}/fetch-plants`, { withCredentials: true }),
          axios.get(`/api/buildings/${buildingID}/fetch-solars`, { withCredentials: true }),
          axios.get(`/api/buildings/${buildingID}/fetch-photovoltaics`, { withCredentials: true }),
        ]);

        setPlants(plantsResponse.data.plants || []);
        setSolars(solarsResponse.data.solars || []);
        setPhotovoltaics(photosResponse.data.photos || []);
      } catch (error) {
        setMessagePopup("Errore durante il recupero degli impianti");
        setButtonPopup(true);
      }
    };

    fetchAll();
  }, [buildingID, refresh]);

  const items = useMemo(
    () => [
      ...plants.map((plant) => ({ ...plant, itemKind: "plant", label: plant.system_type })),
      ...solars.map((solar) => ({ ...solar, itemKind: "solar", label: "Solare termico" })),
      ...photovoltaics.map((photo) => ({ ...photo, itemKind: "photo", label: "Fotovoltaico" })),
    ],
    [photovoltaics, plants, solars],
  );

  const cancelEditing = () => {
    setDraftType("");
    setSelectedType("");
    setEditingItem(null);
  };

  const askDelete = (item) => {
    setItemToDelete(item);
    setMessageConfirm(`Sei sicuro di voler eliminare ${item.label.toLowerCase()}?`);
    setPopupConfirmDelete(true);
  };

  const deleteItem = async () => {
    if (buildingLocked || !itemToDelete) {
      return;
    }

    try {
      if (itemToDelete.itemKind === "plant") {
        await axios.delete(`/api/delete-plant/${itemToDelete.id}`, { withCredentials: true });
      }
      if (itemToDelete.itemKind === "solar") {
        await axios.delete(`/api/delete-solar/${itemToDelete.id}`, { withCredentials: true });
      }
      if (itemToDelete.itemKind === "photo") {
        await axios.delete(`/api/delete-photovoltaic/${itemToDelete.id}`, { withCredentials: true });
      }

      setPopupConfirmDelete(false);
      setItemToDelete(null);
      triggerRefresh();
    } catch (error) {
      setMessagePopup("Errore durante l'eliminazione dell'impianto");
      setButtonPopup(true);
    }
  };

  const renderCreateForm = () => {
    if (!selectedType) {
      return null;
    }

    const option = PLANT_SELECTOR_OPTIONS.find((entry) => entry.id === selectedType);
    if (!option) {
      return null;
    }

    if (option.kind === "solar") {
      return <SolarForm solar="empty" isEdit={false} onButtonClick={cancelEditing} />;
    }
    if (option.kind === "photo") {
      return <PhotoForm photo="empty" isEdit={false} onButtonClick={cancelEditing} />;
    }

    return (
      <PlantForm
        plant="empty"
        isEdit={false}
        onButtonClick={cancelEditing}
        systemType={option.id}
        title={`Aggiungi ${option.label.toLowerCase()}`}
      />
    );
  };

  const renderEditForm = () => {
    if (!editingItem) {
      return null;
    }

    if (editingItem.itemKind === "solar") {
      return <SolarForm solar={editingItem} isEdit onButtonClick={cancelEditing} />;
    }
    if (editingItem.itemKind === "photo") {
      return <PhotoForm photo={editingItem} isEdit onButtonClick={cancelEditing} />;
    }

    return (
      <PlantForm
        plant={editingItem}
        isEdit
        onButtonClick={cancelEditing}
        systemType={editingItem.system_type}
        title={`Modifica ${editingItem.system_type?.toLowerCase() || "impianto"}`}
      />
    );
  };

  const renderPlantSummary = (item) => {
    if (item.itemKind === "solar") {
      return <div><strong>Superficie installata:</strong> {item.installed_area} m²</div>;
    }
    if (item.itemKind === "photo") {
      return <div><strong>Potenza installata:</strong> {item.power} kW</div>;
    }

    return (
      <>
        <div><strong>Categoria:</strong> {item.system_type}</div>
        {item.plant_type && <div><strong>Tipo impianto:</strong> {item.plant_type}</div>}
        {item.generator_type && <div><strong>Generatore:</strong> {item.generator_type}</div>}
        {item.fuel_type && (
          <div>
            <strong>Consumo:</strong> {item.fuel_consumption || "-"} {item.fuel_unit || getFuelUnit(item.fuel_type)} di {item.fuel_type}
          </div>
        )}
        {item.system_type === "Ventilazione meccanica" && (
          <div><strong>Recupero:</strong> {item.has_heat_recovery ? "Si" : "No"}</div>
        )}
        {item.system_type === "Illuminazione" && (
          <>
            <div><strong>Incandescenza:</strong> {item.incandescent_count || 0}</div>
            <div><strong>LED:</strong> {item.led_count || 0}</div>
            <div><strong>Lampade gas:</strong> {item.gas_lamp_count || 0}</div>
            <div><strong>Controllo automatico:</strong> {item.auto_lighting_control ? "Si" : "No"}</div>
          </>
        )}
      </>
    );
  };

  if (!buildingID) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-8 text-center text-base text-gray-600">
        Salva prima i dettagli dell'edificio per aggiungere gli impianti.
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-xl bg-[#D9D9D9] p-4">
      <ConfirmPopUp
        trigger={popupConfirmDelete}
        setTrigger={setPopupConfirmDelete}
        onButtonClick={deleteItem}
      >
        {messageConfirm}
      </ConfirmPopUp>
      <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
        {messagePopup}
      </MessagePopUp>

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Impianti</h2>
          <p className="mt-2 max-w-3xl text-base text-gray-600">
            Aggiungi le sottoschede impianto direttamente dalla scheda edificio. Ogni impianto mantiene il suo consumo associato.
          </p>
        </div>

        {!buildingLocked && (
          <div className="w-full md:w-auto">
            <label className="block text-sm font-semibold text-gray-700">Aggiungi impianto</label>
            <div className="mt-2 flex gap-2">
              <select
                value={draftType}
                onChange={(event) => {
                  setEditingItem(null);
                  setDraftType(event.target.value);
                }}
                className="min-w-[260px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-base"
              >
                <option value="">Seleziona un tipo</option>
                {PLANT_SELECTOR_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  if (!draftType) {
                    setMessagePopup("Seleziona prima il tipo di impianto da aggiungere");
                    setButtonPopup(true);
                    return;
                  }
                  setEditingItem(null);
                  setSelectedType(draftType);
                }}
                className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#2d7044] text-2xl text-white"
              >
                +
              </button>
            </div>
          </div>
        )}
      </div>

      {items.length === 0 && !selectedType ? (
        <div className="py-8 text-center text-base text-gray-700">
          Nessun impianto presente. Usa il pulsante "+" per creare la prima sottoscheda.
        </div>
      ) : null}

      {selectedType && !editingItem && (
        <div className="mt-4">
          {renderCreateForm()}
        </div>
      )}

      <div className="mt-4 space-y-4">
        {items.map((item) => (
          <div key={`${item.itemKind}-${item.id}`} className="rounded-lg bg-white p-4 shadow-md">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <div className="text-lg font-semibold text-[#2d7044]">{item.label}</div>
                {renderPlantSummary(item)}
              </div>

              {!buildingLocked && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedType("");
                      setEditingItem(editingItem?.id === item.id && editingItem?.itemKind === item.itemKind ? null : item);
                    }}
                    className="rounded-lg bg-[#2d7044] px-4 py-2 text-white"
                  >
                    {editingItem?.id === item.id && editingItem?.itemKind === item.itemKind ? "Annulla" : "Modifica"}
                  </button>
                  <button
                    type="button"
                    onClick={() => askDelete(item)}
                    className="rounded-lg bg-red-500 px-4 py-2 text-white"
                  >
                    Elimina
                  </button>
                </div>
              )}
            </div>

            {editingItem?.id === item.id && editingItem?.itemKind === item.itemKind && (
              <div className="mt-4">
                {renderEditForm()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default BuildingPlantManager;
