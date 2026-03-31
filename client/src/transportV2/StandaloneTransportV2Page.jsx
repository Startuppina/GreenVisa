import { useEffect, useState } from 'react';
import TransportV2BottomActions from './components/TransportV2BottomActions';
import TransportV2FleetCard from './components/TransportV2FleetCard';
import TransportV2GlobalQuestionsCard from './components/TransportV2GlobalQuestionsCard';
import TransportV2Header from './components/TransportV2Header';
import useTransportV2Draft from './hooks/useTransportV2Draft';

export default function StandaloneTransportV2Page({ certificationId, onUnauthorized }) {
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const {
    transportV2,
    isLoading,
    loadError,
    isSaving,
    saveError,
    isSubmitting,
    submitError,
    hasUnsavedChanges,
    reload,
    saveNow,
    submitDraft,
    setQuestionnaireFlag,
    addVehicleRow,
    updateVehicleRow,
    removeVehicleRow,
  } = useTransportV2Draft(certificationId, {
    onUnauthorized,
  });

  const vehicles = transportV2?.draft?.vehicles || [];
  const isSubmitted = transportV2?.meta?.status === 'submitted';

  useEffect(() => {
    if (!vehicles.length) {
      setSelectedVehicleId(null);
      return;
    }

    const selectedStillExists = vehicles.some((vehicle) => vehicle?.vehicle_id === selectedVehicleId);
    if (!selectedStillExists) {
      setSelectedVehicleId(vehicles[0]?.vehicle_id || null);
    }
  }, [vehicles, selectedVehicleId]);

  const handleAddVehicle = () => {
    const nextVehicleId = addVehicleRow();
    if (nextVehicleId) {
      setSelectedVehicleId(nextVehicleId);
    }
  };

  const handleRemoveVehicle = (vehicleId) => {
    removeVehicleRow(vehicleId);
    if (vehicleId === selectedVehicleId) {
      const nextVehicle = vehicles.find((vehicle) => vehicle?.vehicle_id !== vehicleId);
      setSelectedVehicleId(nextVehicle?.vehicle_id || null);
    }
  };

  if (!certificationId) {
    return (
      <div className="space-y-6">
        <TransportV2Header certificationId={null} />
        <PageMessage
          title="Certification ID mancante"
          body="Apri la pagina standalone con un certificationId valido per caricare il draft Transport V2 dal backend."
          tone="error"
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <TransportV2Header certificationId={certificationId} />
        <PageMessage
          title="Caricamento draft"
          body="Sto recuperando il draft condiviso Transport V2 dal backend."
          tone="info"
        />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <TransportV2Header certificationId={certificationId} />
        <PageMessage title="Errore di caricamento" body={loadError} tone="error" />
        <div>
          <button
            type="button"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            onClick={reload}
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TransportV2Header certificationId={certificationId} />

      {isSubmitted ? (
        <PageMessage
          title="Questionario gia inviato"
          body="Il backend ha restituito lo stato submitted. La bozza resta visibile in sola lettura."
          tone="info"
        />
      ) : null}

      <TransportV2GlobalQuestionsCard
        questionnaireFlags={transportV2?.draft?.questionnaire_flags}
        disabled={isSubmitted}
        onChangeFlag={setQuestionnaireFlag}
      />

      <TransportV2FleetCard
        certificationId={certificationId}
        vehicles={vehicles}
        selectedVehicleId={selectedVehicleId}
        disabled={isSubmitted}
        onAddVehicle={handleAddVehicle}
        onSelectVehicle={setSelectedVehicleId}
        onUpdateVehicle={updateVehicleRow}
        onRemoveVehicle={handleRemoveVehicle}
      />

      <TransportV2BottomActions
        isSaving={isSaving}
        isSubmitting={isSubmitting}
        hasUnsavedChanges={hasUnsavedChanges}
        saveError={saveError}
        submitError={submitError}
        isSubmitted={isSubmitted}
        onSave={saveNow}
        onSubmit={submitDraft}
      />
    </div>
  );
}

function PageMessage({ title, body, tone }) {
  const toneClasses =
    tone === 'error'
      ? 'border-rose-200 bg-rose-50 text-rose-900'
      : 'border-slate-200 bg-white text-slate-900';

  return (
    <section className={`rounded-xl border p-5 shadow-sm ${toneClasses}`}>
      <p className="text-lg font-semibold">{title}</p>
      <p className="mt-2 text-sm">{body}</p>
    </section>
  );
}
