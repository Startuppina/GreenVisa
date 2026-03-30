import TransportV2QuestionnaireFlagsSection from './TransportV2QuestionnaireFlagsSection';
import TransportV2StatusBar from './TransportV2StatusBar';
import TransportV2VehicleList from './TransportV2VehicleList';

export default function TransportV2FormShell({
  transportV2,
  isSaving,
  saveError,
  hasUnsavedChanges,
  onRetrySave,
  onChangeFlag,
  onAddVehicle,
  onUpdateVehicle,
  onRemoveVehicle,
}) {
  const isSubmitted = transportV2?.meta?.status === 'submitted';
  const isChatbotMode = transportV2?.meta?.entry_mode === 'chatbot';

  return (
    <div className="space-y-6">
      <TransportV2StatusBar
        meta={transportV2?.meta}
        isSaving={isSaving}
        saveError={saveError}
        hasUnsavedChanges={hasUnsavedChanges}
        onRetrySave={onRetrySave}
      />

      {isSubmitted ? (
        <section className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 text-sm text-indigo-900">
          <p className="font-semibold">Questionario gia inviato</p>
          <p className="mt-1">
            Il backend ha marcato questo Transport V2 come submitted. La pagina viene resa in
            sola lettura e non tenta ricalcoli lato browser.
          </p>
        </section>
      ) : null}

      {isChatbotMode ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <p className="font-semibold">Entry mode chatbot registrato</p>
          <p className="mt-1">
            Il flusso chatbot non e ancora implementato in questo blocco. Per evitare un vicolo
            cieco, mostriamo comunque il form shell che lavora sullo stesso draft condiviso.
          </p>
        </section>
      ) : null}

      <TransportV2QuestionnaireFlagsSection
        questionnaireFlags={transportV2?.draft?.questionnaire_flags}
        disabled={isSubmitted}
        onChangeFlag={onChangeFlag}
      />

      <TransportV2VehicleList
        vehicles={transportV2?.draft?.vehicles || []}
        disabled={isSubmitted}
        onAddVehicle={onAddVehicle}
        onUpdateVehicle={onUpdateVehicle}
        onRemoveVehicle={onRemoveVehicle}
      />

      {(hasDisplayData(transportV2?.derived) || hasDisplayData(transportV2?.results)) ? (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Derived e results</h2>
          <p className="mt-1 text-sm text-slate-600">
            Valori letti dal backend senza ricalcolo client-side.
          </p>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <DisplayObjectCard title="Derived" value={transportV2?.derived} />
            <DisplayObjectCard title="Results" value={transportV2?.results} />
          </div>
        </section>
      ) : null}
    </div>
  );
}

function DisplayObjectCard({ title, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-xs text-slate-700">
        {JSON.stringify(value || {}, null, 2)}
      </pre>
    </div>
  );
}

function hasDisplayData(value) {
  return value && typeof value === 'object' && Object.keys(value).length > 0;
}
