import CdcScannerModal from "./components/CdcScannerModal";
import VehicleForm from "./components/VehicleForm";
import VehiclesTable from "./components/VehiclesTable";
import useQuestionnaire from "./hooks/useQuestionnaire";

const Questionnaire = () => {
  const {
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
  } = useQuestionnaire();

  return (
    <div className="w-full rounded-2xl border border-emerald-100 bg-white shadow-sm">
      <div className="border-b border-emerald-100 px-5 py-4 sm:px-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Questionario veicoli
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Compila il form, aggiungi veicoli alla lista o usa Scannerizza CDC.
        </p>
      </div>
      <VehicleForm
        result={result}
        onFieldChange={updateField}
        blueTicket={blueTicket}
        setBlueTicket={setBlueTicket}
      />

      <div className="border-t border-emerald-100 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto rounded-md border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            Carica CDC
          </button>

          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <button
              type="button"
              onClick={resetForm}
              className="w-full sm:w-auto rounded-md border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              Resetta
            </button>
            <button
              type="button"
              onClick={handleSaveVehicle}
              className="w-full sm:w-auto rounded-md bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100"
            >
              {editingVehicleId ? "Salva modifica" : "Aggiungi"}
            </button>
          </div>
        </div>

        <VehiclesTable
          vehicles={vehicles}
          onEdit={handleEditVehicle}
          onDelete={handleDeleteVehicle}
        />
      </div>

      <CdcScannerModal
        isOpen={isModalOpen}
        isLoading={isScanning}
        error={scanError}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleScanPdf}
      />

      <div className="border-t border-emerald-100 px-5 py-4 sm:px-6">
        <p>Ciao</p>
      </div>
    </div>
  );
};

export default Questionnaire;
