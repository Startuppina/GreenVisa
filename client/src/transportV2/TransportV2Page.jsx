import { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Footer from '../components/footer';
import Navbar from '../components/navbar';
import ScrollToTop from '../components/scrollToTop';
import TransportV2EntryModeSelector from './components/TransportV2EntryModeSelector';
import TransportV2FormShell from './components/TransportV2FormShell';
import useTransportV2Draft from './hooks/useTransportV2Draft';

export default function TransportV2Page() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const certificationId = useMemo(() => {
    const queryParams = new URLSearchParams(location.search);
    return (
      params.certificationId ||
      queryParams.get('certificationId') ||
      queryParams.get('param1') ||
      null
    );
  }, [location.search, params.certificationId]);

  const {
    transportV2,
    isLoading,
    loadError,
    isSaving,
    saveError,
    hasUnsavedChanges,
    reload,
    retrySave,
    setEntryMode,
    setQuestionnaireFlag,
    addVehicleRow,
    updateVehicleRow,
    removeVehicleRow,
  } = useTransportV2Draft(certificationId, {
    onUnauthorized: () => navigate('/login'),
  });

  return (
    <>
      <ScrollToTop />
      <Navbar />
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900">Transport V2</h1>
            <p className="mt-2 text-sm text-slate-600">
              Shell frontend del draft condiviso per la certificazione trasporti.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Certification ID: {certificationId || 'non disponibile'}
            </p>
          </header>

          {!certificationId ? (
            <PageMessage
              title="Certification ID mancante"
              body="Apri la pagina con un certificationId valido nel path o nella query string."
              tone="error"
            />
          ) : null}

          {certificationId && isLoading ? (
            <PageMessage
              title="Caricamento draft Transport V2"
              body="Sto recuperando il draft condiviso dal backend."
              tone="info"
            />
          ) : null}

          {certificationId && !isLoading && loadError ? (
            <div className="space-y-4">
              <PageMessage title="Errore di caricamento" body={loadError} tone="error" />
              <button
                type="button"
                onClick={reload}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Riprova caricamento
              </button>
            </div>
          ) : null}

          {certificationId && !isLoading && !loadError && transportV2?.meta?.entry_mode == null ? (
            <TransportV2EntryModeSelector isSaving={isSaving} onSelectMode={setEntryMode} />
          ) : null}

          {certificationId &&
          !isLoading &&
          !loadError &&
          transportV2 &&
          transportV2.meta?.entry_mode != null ? (
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
    </>
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
