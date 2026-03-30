import PropTypes from 'prop-types';
import Footer from '../components/footer';
import Navbar from '../components/navbar';
import ScrollToTop from '../components/scrollToTop';
import TransportV2DevToolbar from './components/TransportV2DevToolbar';
import TransportV2EntryModeSelector from './components/TransportV2EntryModeSelector';
import TransportV2FormShell from './components/TransportV2FormShell';
import useDevTransportV2Draft from './hooks/useDevTransportV2Draft';
import ChatWidget from '../chatbot/ChatWidget';

export default function DevTransportV2Page() {
  const {
    transportV2,
    isLoading,
    loadError,
    isSaving,
    saveError,
    hasUnsavedChanges,
    retrySave,
    setEntryMode,
    setQuestionnaireFlag,
    addVehicleRow,
    updateVehicleRow,
    removeVehicleRow,
    resetDraft,
    seedEmptyDraft,
    seedPassengerOcrDraft,
    seedGoodsOcrDraft,
    seedCompleteishDraft,
    seedSubmittedDraft,
    toggleSubmittedState,
    storageKey,
  } = useDevTransportV2Draft();

  const vehicleCount = transportV2?.draft?.vehicles?.length || 0;

  return (
    <>
      <ScrollToTop />
      <Navbar />
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900">Transport V2 Sandbox</h1>
              <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-900">
                Frontend only
              </span>
            </div>
            <p className="mt-3 max-w-4xl text-sm text-slate-600">
              Pagina di sviluppo per provare il form reale di Transport V2 con un draft locale in
              <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5">{storageKey}</code>
              senza dipendere da certification, prodotti, carrello, pagamento o entitlement.
            </p>
          </header>

          <TransportV2DevToolbar
            isSaving={isSaving}
            transportV2={transportV2}
            storageKey={storageKey}
            onResetDraft={resetDraft}
            onSeedEmptyDraft={seedEmptyDraft}
            onSeedPassengerOcrDraft={seedPassengerOcrDraft}
            onSeedGoodsOcrDraft={seedGoodsOcrDraft}
            onSeedCompleteishDraft={seedCompleteishDraft}
            onSeedSubmittedDraft={seedSubmittedDraft}
            onToggleSubmittedState={toggleSubmittedState}
          />

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 text-sm text-slate-700 md:grid-cols-4">
              <DiagnosticItem label="Meta status" value={transportV2?.meta?.status || 'n/d'} />
              <DiagnosticItem label="Entry mode" value={transportV2?.meta?.entry_mode || 'n/d'} />
              <DiagnosticItem label="Vehicle count" value={String(vehicleCount)} />
              <DiagnosticItem
                label="Save status"
                value={
                  saveError
                    ? 'save_error'
                    : isSaving
                      ? 'saving'
                      : hasUnsavedChanges
                        ? 'dirty'
                        : 'saved'
                }
              />
            </div>

            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-semibold text-slate-900">
                Debug JSON preview
              </summary>
              <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-50 p-4 text-xs text-slate-700">
                {JSON.stringify(transportV2 || {}, null, 2)}
              </pre>
            </details>
          </section>

          {isLoading ? (
            <PageMessage
              title="Caricamento draft locale"
              body="Sto inizializzando il draft Transport V2 dalla persistenza browser."
              tone="info"
            />
          ) : null}

          {loadError ? (
            <PageMessage title="Avviso sul draft locale" body={loadError} tone="warning" />
          ) : null}

          {!isLoading && transportV2?.meta?.entry_mode == null ? (
            <TransportV2EntryModeSelector isSaving={isSaving} onSelectMode={setEntryMode} />
          ) : null}

          {!isLoading && transportV2 && transportV2.meta?.entry_mode != null ? (
            <TransportV2FormShell
              transportV2={transportV2}
              isSaving={isSaving}
              saveError={saveError}
              hasUnsavedChanges={hasUnsavedChanges}
              onRetrySave={retrySave}
              onChangeFlag={setQuestionnaireFlag}
              onAddVehicle={addVehicleRow}
              onUpdateVehicle={updateVehicleRow}
              onRemoveVehicle={removeVehicleRow}
            />
          ) : null}
        </div>
      </main>
      <Footer />
      <ChatWidget questionnaireType="transport" />
    </>
  );
}

function DiagnosticItem({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  );
}

DiagnosticItem.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};

function PageMessage({ title, body, tone }) {
  const toneClasses =
    tone === 'warning'
      ? 'border-amber-200 bg-amber-50 text-amber-900'
      : 'border-slate-200 bg-white text-slate-900';

  return (
    <section className={`rounded-xl border p-5 shadow-sm ${toneClasses}`}>
      <p className="text-lg font-semibold">{title}</p>
      <p className="mt-2 text-sm">{body}</p>
    </section>
  );
}

PageMessage.propTypes = {
  title: PropTypes.string.isRequired,
  body: PropTypes.string.isRequired,
  tone: PropTypes.string.isRequired,
};
