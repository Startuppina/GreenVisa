import { useCallback } from 'react';
import { useBeforeUnload, useParams, unstable_usePrompt as usePrompt } from 'react-router-dom';
import ChatWidget from '../chatbot/ChatWidget.jsx';
import Footer from '../components/footer';
import Navbar from '../components/navbar';
import ScrollToTop from '../components/scrollToTop.jsx';
import OcrUploadPanel from '../features/transportV2/components/OcrUploadPanel.jsx';
import QuestionnaireFlagsSection from '../features/transportV2/components/QuestionnaireFlagsSection.jsx';
import TransportResultsPanel from '../features/transportV2/components/TransportResultsPanel.jsx';
import TransportSubmitBar from '../features/transportV2/components/TransportSubmitBar.jsx';
import TransportV2Header from '../features/transportV2/components/TransportV2Header.jsx';
import VehicleEditorPanel from '../features/transportV2/components/VehicleEditorPanel.jsx';
import VehicleListPanel from '../features/transportV2/components/VehicleListPanel.jsx';
import useTransportV2Draft from '../features/transportV2/hooks/useTransportV2Draft.js';
import useTransportV2Ocr from '../features/transportV2/hooks/useTransportV2Ocr.js';

export default function TransportV2Page({ certificationIdOverride = null }) {
  const params = useParams();
  const certificationId = certificationIdOverride || params.certificationId || null;
  const {
    transportV2,
    selectedVehicle,
    selectedVehicleId,
    selectedVehicleIndex,
    fieldErrors,
    ui,
    setSelectedVehicleId,
    loadTransportV2,
    applyTransportV2,
    updateQuestionnaireFlag,
    addVehicle,
    deleteVehicle,
    updateVehicleTransportMode,
    updateVehicleField,
    updateVehicleNotes,
    saveDraft,
    submitDraft,
  } = useTransportV2Draft(certificationId);

  const isSubmitted = transportV2.meta?.status === 'submitted';

  const handleAppliedOcrVehicle = useCallback((response) => {
    if (response?.transport_v2) {
      applyTransportV2(response.transport_v2, {
        preferredVehicleId: response.vehicle?.vehicle_id || null,
        markDirty: false,
        saveSuccessAt: new Date().toISOString(),
      });
      return;
    }

    loadTransportV2();
  }, [applyTransportV2, loadTransportV2]);

  const ocr = useTransportV2Ocr({
    certificationId: Number(certificationId),
    onApplied: handleAppliedOcrVehicle,
    isSubmitted,
  });

  useBeforeUnload(
    useCallback(
      (event) => {
        if (!ui.isDirty) {
          return;
        }

        event.preventDefault();
        event.returnValue = '';
      },
      [ui.isDirty],
    ),
  );

  usePrompt({
    when: ui.isDirty,
    message: 'You have unsaved Transport V2 changes. Leave this page?',
  });

  const handleFileSelection = async (event) => {
    const files = event.target.files;
    if (files?.length) {
      await ocr.uploadFiles(files);
    }
    event.target.value = '';
  };

  const withSiteChrome = (content) => (
    <>
      <ScrollToTop />
      <Navbar />
      {content}
      <Footer />
    </>
  );

  if (ui.isLoading) {
    return withSiteChrome(
      <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900">
        <div className="mx-auto max-w-7xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          Loading Transport V2 draft...
        </div>
      </main>,
    );
  }

  if (ui.loadError) {
    return withSiteChrome(
      <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900">
        <div className="mx-auto max-w-3xl rounded-2xl border border-rose-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Transport V2 unavailable</h1>
          <p className="mt-3 text-sm text-rose-700">{ui.loadError}</p>
          <button
            className="mt-5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            type="button"
            onClick={loadTransportV2}
          >
            Retry
          </button>
        </div>
      </main>,
    );
  }

  return withSiteChrome(
    <>
      <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900">
        <div className="mx-auto max-w-7xl space-y-6">
          <TransportV2Header meta={transportV2.meta} certificationId={certificationId} />

          <TransportSubmitBar
            isDirty={ui.isDirty}
            isSaving={ui.isSaving}
            isSubmitting={ui.isSubmitting}
            isSubmitted={isSubmitted}
            submittedAt={transportV2.meta?.submitted_at}
            saveError={ui.saveError}
            submitError={ui.submitError}
            saveSuccessAt={ui.saveSuccessAt}
            onSave={() => saveDraft()}
            onSubmit={() => submitDraft()}
          />

          <QuestionnaireFlagsSection
            questionnaireFlags={transportV2.draft.questionnaire_flags}
            fieldErrors={fieldErrors}
            onChange={updateQuestionnaireFlag}
            readOnly={isSubmitted}
          />

          <div className="grid gap-6 xl:grid-cols-[360px,minmax(0,1fr)]">
            <VehicleListPanel
              vehicles={transportV2.draft.vehicles}
              selectedVehicleId={selectedVehicleId}
              fieldErrors={fieldErrors}
              onAddVehicle={addVehicle}
              onDeleteVehicle={deleteVehicle}
              onSelectVehicle={setSelectedVehicleId}
              readOnly={isSubmitted}
            />

            <VehicleEditorPanel
              vehicle={selectedVehicle}
              vehicleIndex={selectedVehicleIndex}
              fieldErrors={fieldErrors}
              onTransportModeChange={(value) => updateVehicleTransportMode(selectedVehicleId, value)}
              onFieldChange={(fieldName, value) => updateVehicleField(selectedVehicleId, fieldName, value)}
              onNotesChange={(value) => updateVehicleNotes(selectedVehicleId, value)}
              readOnly={isSubmitted}
            />
          </div>

          {!isSubmitted && (
            <OcrUploadPanel
              uploads={ocr.uploads}
              isUploading={ocr.isUploading}
              uploadError={ocr.uploadError}
              onFileSelection={handleFileSelection}
              onTransportModeChange={ocr.setUploadTransportMode}
              onApplyUpload={ocr.applyUpload}
              onRefreshUpload={ocr.refreshUploadResult}
            />
          )}

          <TransportResultsPanel derived={transportV2.derived} results={transportV2.results} />
        </div>
      </main>

      <ChatWidget questionnaireType="transport" certificationId={certificationId} />
    </>,
  );
}
