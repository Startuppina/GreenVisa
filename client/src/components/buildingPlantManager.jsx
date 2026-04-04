import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import ConfirmPopUp from "./confirmPopUp";
import MessagePopUp from "./messagePopUp";
import PlantForm from "./plantForm";
import SolarForm from "./solarForm";
import PhotoForm from "./photoForm";
import { useRecoveryContext } from "../provider/provider";
import { PLANT_SELECTOR_OPTIONS } from "./plantCatalog";

function BuildingPlantManager({ readOnly = false }) {
  const { buildingID, refresh, triggerRefresh, buildingLocked } = useRecoveryContext();
  const [plants, setPlants] = useState([]);
  const [solars, setSolars] = useState([]);
  const [photovoltaics, setPhotovoltaics] = useState([]);
  const [gases, setGases] = useState([]);
  const [draftType, setDraftType] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");
  const [buttonPopup, setButtonPopup] = useState(false);
  const [messagePopup, setMessagePopup] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      if (!buildingID) {
        setPlants([]);
        setSolars([]);
        setPhotovoltaics([]);
        setGases([]);
        return;
      }

      try {
        const [plantsResponse, solarsResponse, photosResponse, gasesResponse] = await Promise.all([
          axios.get(`/api/buildings/${buildingID}/fetch-plants`, { withCredentials: true }),
          axios.get(`/api/buildings/${buildingID}/fetch-solars`, { withCredentials: true }),
          axios.get(`/api/buildings/${buildingID}/fetch-photovoltaics`, { withCredentials: true }),
          axios.get(`/api/buildings/${buildingID}/fetch-gases`, { withCredentials: true }),
        ]);

        setPlants(plantsResponse.data.plants || []);
        setSolars(solarsResponse.data.solars || []);
        setPhotovoltaics(photosResponse.data.photos || []);
        setGases(gasesResponse.data.gases || []);
      } catch (error) {
        setMessagePopup("Errore durante il recupero degli impianti");
        setButtonPopup(true);
      }
    };

    fetchAll();
  }, [buildingID, refresh]);

  const effectiveReadOnly = readOnly || buildingLocked;

  const items = useMemo(
    () => [
      ...plants.map((plant) => ({
        ...plant,
        itemKind: "plant",
        title: plant.system_type || "Scheda impianto",
        refrigerantGases: gases.filter((gas) => gas.plant_id === plant.id),
      })),
      ...solars.map((solar) => ({
        ...solar,
        itemKind: "solar",
        title: "Impianto solare termico",
      })),
      ...photovoltaics.map((photo) => ({
        ...photo,
        itemKind: "photo",
        title: "Impianto fotovoltaico",
      })),
    ],
    [gases, photovoltaics, plants, solars],
  );

  const resetDraft = () => {
    setDraftType("");
    setSelectedType("");
  };

  const askDelete = (item) => {
    setItemToDelete(item);
    setDeleteMessage(`Sei sicuro di voler eliminare ${item.title.toLowerCase()}?`);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete || effectiveReadOnly) {
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

      setShowDeleteConfirm(false);
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
      return (
        <SolarForm
          solar="empty"
          isEdit={false}
          onButtonClick={resetDraft}
          onSubmitSuccess={resetDraft}
          readOnly={false}
        />
      );
    }

    if (option.kind === "photo") {
      return (
        <PhotoForm
          photo="empty"
          isEdit={false}
          onButtonClick={resetDraft}
          onSubmitSuccess={resetDraft}
          readOnly={false}
        />
      );
    }

    return (
      <PlantForm
        plant="empty"
        isEdit={false}
        onButtonClick={resetDraft}
        onSubmitSuccess={resetDraft}
        systemType={option.id}
        title={`Nuova scheda ${option.label.toLowerCase()}`}
        readOnly={false}
      />
    );
  };

  const renderSavedForm = (item) => {
    const deleteProps =
      !effectiveReadOnly ? { onDeletePlant: () => askDelete(item) } : {};

    if (item.itemKind === "solar") {
      return <SolarForm solar={item} isEdit readOnly={effectiveReadOnly} {...deleteProps} />;
    }

    if (item.itemKind === "photo") {
      return <PhotoForm photo={item} isEdit readOnly={effectiveReadOnly} {...deleteProps} />;
    }

    return (
      <PlantForm
        plant={item}
        isEdit
        systemType={item.system_type}
        title={item.title}
        readOnly={effectiveReadOnly}
        {...deleteProps}
      />
    );
  };

  if (!buildingID) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center text-sm text-slate-600">
        Completa i dettagli dell'edificio e attendi il primo salvataggio automatico per aggiungere gli impianti.
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <ConfirmPopUp
        trigger={showDeleteConfirm}
        setTrigger={setShowDeleteConfirm}
        onButtonClick={handleDelete}
      >
        {deleteMessage}
      </ConfirmPopUp>
      <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
        {messagePopup}
      </MessagePopUp>

      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Schede impianto</h2>
          <p className="mt-1 text-sm text-slate-600">
            Ogni scheda usa l'autosave come il questionario trasporti e resta modificabile finché l'edificio non viene finalizzato.
          </p>
        </div>

        {!effectiveReadOnly ? (
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-medium text-slate-800">Aggiungi una nuova scheda</div>
            <div className="mt-3 flex gap-2">
              <select
                value={draftType}
                onChange={(event) => setDraftType(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500"
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
                  setSelectedType(draftType);
                }}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                +
              </button>
            </div>
          </div>
        ) : (
          <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            Schede in sola lettura
          </div>
        )}
      </div>

      {selectedType ? <div className="mb-6">{renderCreateForm()}</div> : null}

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
          Nessuna scheda impianto presente. Usa il selettore in alto per aggiungerne una.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={`${item.itemKind}-${item.id}`}>{renderSavedForm(item)}</div>
          ))}
        </div>
      )}
    </section>
  );
}

export default BuildingPlantManager;
