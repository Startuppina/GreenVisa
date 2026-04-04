import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useRecoveryContext } from "../provider/provider";
import BuildingFrom from "./buildingFrom";
import BuildingPlantManager from "./buildingPlantManager";
import BuildingResults from "./buildingResults";

function Building() {
    const [buildingData, setBuildingData] = useState({});
    const { id } = useParams();
    const { setBuildingID, refresh, setBuildingLocked, buildingLocked, setBuildingComplete } = useRecoveryContext();

    const isNewBuilding = id === "new";

    useEffect(() => {
        if (isNewBuilding) {
            setBuildingID(0);
            setBuildingLocked(false);
            setBuildingComplete(false);
            return;
        }

        const fetchBuilding = async () => {
            setBuildingID(Number(id));
            try {
                const response = await axios.get(`/api/fetch-building/${id}`, {
                    withCredentials: true,
                });
                if (response.status === 200) {
                    const fetchedBuilding = response.data.building || {};
                    setBuildingData(fetchedBuilding);
                    setBuildingLocked(Boolean(fetchedBuilding.results_visible));
                    // buildingComplete è aggiornato solo da BuildingFrom (isPayloadComplete).
                    // Non usare is_draft qui: ogni triggerRefresh() azzererebbe il flag per le bozze
                    // e disabiliterebbe "Calcola le emissioni" anche con form già completo.
                }
            } catch (error) {
                console.log(error);
            }
        };

        fetchBuilding();
    }, [id, isNewBuilding, refresh, setBuildingComplete, setBuildingID, setBuildingLocked]);

    if (isNewBuilding) {
        return (
            <div className="space-y-6 text-arial text-xl">
                <div className="text-center">
                    <h1 className="text-3xl font-bold">
                        <span className="uppercase text-[#2d7044]">Nuovo edificio</span>
                    </h1>
                    <p className="mt-2 text-lg text-gray-600">
                        Compila i dati qui sotto. Al primo autosave riuscito potrai gestire impianti e sezioni collegate.
                    </p>
                </div>
                <div className="mx-2 md:mx-14">
                    <BuildingFrom buildingData="empty" isEdit={false} readOnly={false} />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 text-arial text-xl">
            <h1 className="text-center text-3xl font-bold">
                Informazioni su <span className="uppercase text-[#2d7044]">{buildingData.name}</span>
            </h1>

            <BuildingResults />

            <div className="mx-2 md:mx-14">
                <BuildingFrom
                    buildingData={buildingData}
                    isEdit={true}
                    readOnly={buildingLocked}
                />
            </div>

            <div className="mx-2 md:mx-14">
                <BuildingPlantManager readOnly={buildingLocked} />
            </div>
        </div>
    );
}

export default Building;
