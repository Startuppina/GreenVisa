import { useState } from "react";
import { createInitialResult, normalizeResult } from "../model";

const OCR_ENDPOINT = "/api/ocr/cdc";

const useQuestionnaire = () => {
  const [result, setResult] = useState(createInitialResult());
  const [blueTicket, setBlueTicket] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState("");

  const updateField = (field, value) => {
    setResult((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    const initial = createInitialResult();
    setResult(initial);
    setBlueTicket(initial.blueTicket);
    setEditingVehicleId(null);
  };

  const handleSaveVehicle = () => {
    if (editingVehicleId) {
      setVehicles((prev) =>
        prev.map((vehicle) =>
          vehicle.id === editingVehicleId
            ? { ...vehicle, ...result, blueTicket }
            : vehicle,
        ),
      );
      resetForm();
      return;
    }

    setVehicles((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        ...result,
        blueTicket,
      },
    ]);
    resetForm();
  };

  const handleEditVehicle = (vehicle) => {
    setEditingVehicleId(vehicle.id);
    setResult({
      registrationYear: Number(vehicle.registrationYear),
      emissionArea: vehicle.emissionArea,
      fuelType: vehicle.fuelType,
      lastRevision: vehicle.lastRevision,
      kmPerYear: Number(vehicle.kmPerYear),
      timeWithPeople: Number(vehicle.timeWithPeople),
      weight: Number(vehicle.weight),
      kmWithLoad: Number(vehicle.kmWithLoad),
      blueTicket: Boolean(vehicle.blueTicket),
      vehicleType: vehicle.vehicleType,
    });
    setBlueTicket(Boolean(vehicle.blueTicket));
  };

  const handleDeleteVehicle = (vehicleId) => {
    setVehicles((prev) => prev.filter((vehicle) => vehicle.id !== vehicleId));
    if (editingVehicleId === vehicleId) {
      resetForm();
    }
  };

  const handleScanPdf = async (file) => {
    setScanError("");
    setIsScanning(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(OCR_ENDPOINT, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`OCR request failed: ${response.status}`);
      }

      const data = await response.json();
      const normalized = normalizeResult(data);
      setResult(normalized);
      setBlueTicket(normalized.blueTicket);
      setIsModalOpen(false);
    } catch {
      setScanError(
        "Errore nella scansione OCR. Verifica endpoint o formato file.",
      );
    } finally {
      setIsScanning(false);
    }
  };

  return {
    result,
    blueTicket,
    vehicles,
    editingVehicleId,
    isModalOpen,
    isScanning,
    scanError,
    setBlueTicket,
    setIsModalOpen,
    updateField,
    resetForm,
    handleSaveVehicle,
    handleEditVehicle,
    handleDeleteVehicle,
    handleScanPdf,
  };
};

export default useQuestionnaire;
