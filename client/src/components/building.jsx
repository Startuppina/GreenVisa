import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useRecoveryContext } from "../provider/provider";
import BuildingFrom from "./buildingFrom";
import BuildingPlantManager from "./buildingPlantManager";
import BuildingResults from "./buildingResults";

function mergeSavedBuildingData(previous, payload) {
    return {
        ...previous,
        name: payload.name,
        address: payload.address,
        usage: payload.usage,
        location: payload.location,
        region: payload.region ?? payload.location,
        construction_year: payload.year,
        area: payload.area,
        renovation: payload.renovation,
        heat_distribution: payload.heating,
        ventilation: payload.ventilation,
        energy_control: payload.energyControl,
        maintenance: payload.maintenance,
        water_recovery: payload.waterRecovery,
        electricity_meter: payload.contractPowerClass || payload.electricityCounter,
        analyzers: payload.electricityAnalyzer,
        electricity_forniture: payload.electricForniture,
        incandescent: payload.lighting,
        led: payload.led,
        gas_lamp: payload.gasLamp,
        autolightingcontrolsystem: payload.autoLightingControlSystem,
        ateco: payload.ateco,
        activity_description: payload.activityDescription,
        annual_turnover: payload.annualTurnover,
        num_employees: payload.employees,
        prodprocessdesc: payload.prodProcessDescription,
        country: payload.country,
        cap: payload.cap,
        municipality: payload.municipality,
        street: payload.street,
        street_number: payload.streetNumber,
        climate_zone: payload.climateZone,
        construction_year_value: payload.constructionYearValue,
        contract_power_class: payload.contractPowerClass,
    };
}

function Building() {
    const [buildingData, setBuildingData] = useState({});
    const { id } = useParams();
    const { setBuildingID, setBuildingLocked, buildingLocked, setBuildingComplete } = useRecoveryContext();

    const isNewBuilding = id === "new";

    const handleBuildingEditSuccess = useCallback((savedPayload) => {
        setBuildingData((previous) => mergeSavedBuildingData(previous, savedPayload));
    }, []);

    useEffect(() => {
        if (isNewBuilding) {
            setBuildingID(0);
            setBuildingLocked(false);
            setBuildingComplete(false);
            return;
        }

        let isCancelled = false;

        const fetchBuilding = async () => {
            setBuildingID(Number(id));
            try {
                const response = await axios.get(`/api/fetch-building/${id}`, {
                    withCredentials: true,
                });
                if (!isCancelled && response.status === 200) {
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
        return () => {
            isCancelled = true;
        };
    }, [id, isNewBuilding, setBuildingComplete, setBuildingID, setBuildingLocked]);

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
                    onEditSuccess={handleBuildingEditSuccess}
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
