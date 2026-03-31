import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getApiErrorMessage,
  getTransportV2Draft,
  saveTransportV2Draft,
  submitTransportV2,
} from '../transportV2Api';
import { createEmptyVehicleRow } from '../transportV2Model';

const AUTOSAVE_DELAY_MS = 800;

function buildSavePayload(transportV2) {
  return {
    entry_mode: transportV2?.meta?.entry_mode ?? null,
    draft: {
      questionnaire_flags: transportV2?.draft?.questionnaire_flags ?? {},
      vehicles: transportV2?.draft?.vehicles ?? [],
    },
  };
}

function mergeSavedMeta(currentTransportV2, savedTransportV2) {
  if (!currentTransportV2) {
    return savedTransportV2;
  }

  return {
    ...currentTransportV2,
    meta: {
      ...currentTransportV2.meta,
      ...savedTransportV2.meta,
    },
  };
}

export default function useTransportV2Draft(certificationId, { onUnauthorized } = {}) {
  const [transportV2, setTransportV2] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const transportV2Ref = useRef(null);
  const currentVersionRef = useRef(0);
  const isSavingRef = useRef(false);
  const activeSavePromiseRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const loadAbortControllerRef = useRef(null);
  const saveAbortControllerRef = useRef(null);
  const submitAbortControllerRef = useRef(null);
  const onUnauthorizedRef = useRef(onUnauthorized);

  useEffect(() => {
    onUnauthorizedRef.current = onUnauthorized;
  }, [onUnauthorized]);

  const replaceTransportV2 = useCallback((nextTransportV2) => {
    transportV2Ref.current = nextTransportV2;
    setTransportV2(nextTransportV2);
  }, []);

  const handleUnauthorized = useCallback((error) => {
    if (error?.response?.status === 401 && typeof onUnauthorizedRef.current === 'function') {
      onUnauthorizedRef.current();
      return true;
    }

    return false;
  }, []);

  const saveSnapshot = useCallback(
    async (snapshot, snapshotVersion) => {
      if (!certificationId || !snapshot) {
        return null;
      }

      if (isSavingRef.current && activeSavePromiseRef.current) {
        return activeSavePromiseRef.current;
      }

      if (saveAbortControllerRef.current) {
        saveAbortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      saveAbortControllerRef.current = abortController;
      isSavingRef.current = true;
      setIsSaving(true);
      setSaveError(null);

      const savePromise = (async () => {
        try {
          const savedTransportV2 = await saveTransportV2Draft(
            certificationId,
            buildSavePayload(snapshot),
            { signal: abortController.signal },
          );

          if (snapshotVersion === currentVersionRef.current) {
            replaceTransportV2(savedTransportV2);
            setHasUnsavedChanges(false);
            setSaveError(null);
          } else {
            replaceTransportV2(mergeSavedMeta(transportV2Ref.current, savedTransportV2));
            setHasUnsavedChanges(true);
          }

          return savedTransportV2;
        } catch (error) {
          if (error?.name === 'CanceledError' || error?.name === 'AbortError') {
            return null;
          }

          if (handleUnauthorized(error)) {
            return null;
          }

          setSaveError(
            getApiErrorMessage(error, 'Errore durante il salvataggio del draft Transport V2.'),
          );
          setHasUnsavedChanges(true);
          throw error;
        } finally {
          if (saveAbortControllerRef.current === abortController) {
            saveAbortControllerRef.current = null;
          }

          if (activeSavePromiseRef.current === savePromise) {
            activeSavePromiseRef.current = null;
          }

          isSavingRef.current = false;
          setIsSaving(false);
        }
      })();

      activeSavePromiseRef.current = savePromise;
      return savePromise;
    },
    [certificationId, handleUnauthorized, replaceTransportV2],
  );

  const loadDraft = useCallback(async () => {
    if (!certificationId) {
      replaceTransportV2(null);
      setIsLoading(false);
      setLoadError('Certification ID mancante.');
      return;
    }

    if (loadAbortControllerRef.current) {
      loadAbortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    loadAbortControllerRef.current = abortController;

    setIsLoading(true);
    setLoadError(null);
    setSaveError(null);
    setSubmitError(null);
    setHasUnsavedChanges(false);

    try {
      const nextTransportV2 = await getTransportV2Draft(certificationId, {
        signal: abortController.signal,
      });

      currentVersionRef.current = 0;
      replaceTransportV2(nextTransportV2);
    } catch (error) {
      if (error?.name === 'CanceledError' || error?.name === 'AbortError') {
        return;
      }

      if (handleUnauthorized(error)) {
        return;
      }

      replaceTransportV2(null);
      setLoadError(getApiErrorMessage(error, 'Errore durante il caricamento del draft Transport V2.'));
    } finally {
      if (loadAbortControllerRef.current === abortController) {
        loadAbortControllerRef.current = null;
      }

      setIsLoading(false);
    }
  }, [certificationId, handleUnauthorized, replaceTransportV2]);

  useEffect(() => {
    loadDraft();

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      if (loadAbortControllerRef.current) {
        loadAbortControllerRef.current.abort();
      }

      if (saveAbortControllerRef.current) {
        saveAbortControllerRef.current.abort();
      }

      if (submitAbortControllerRef.current) {
        submitAbortControllerRef.current.abort();
      }
    };
  }, [loadDraft]);

  const applyChange = useCallback(
    (updater, { immediateSave = false } = {}) => {
      const currentTransportV2 = transportV2Ref.current;
      if (!currentTransportV2) {
        return;
      }

      if (currentTransportV2.meta?.status === 'submitted') {
        return;
      }

      const nextTransportV2 = updater(currentTransportV2);
      if (!nextTransportV2 || nextTransportV2 === currentTransportV2) {
        return;
      }

      const nextVersion = currentVersionRef.current + 1;
      currentVersionRef.current = nextVersion;

      replaceTransportV2(nextTransportV2);
      setHasUnsavedChanges(true);
      setSaveError(null);

      if (immediateSave) {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        void saveSnapshot(nextTransportV2, nextVersion).catch(() => {});
      }
    },
    [replaceTransportV2, saveSnapshot],
  );

  useEffect(() => {
    if (!transportV2 || isLoading || isSaving || !hasUnsavedChanges) {
      return undefined;
    }

    if (transportV2.meta?.status === 'submitted') {
      return undefined;
    }

    debounceTimerRef.current = setTimeout(() => {
      void saveSnapshot(transportV2Ref.current, currentVersionRef.current).catch(() => {});
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [transportV2, isLoading, isSaving, hasUnsavedChanges, saveSnapshot]);

  const setEntryMode = useCallback(
    (mode) => {
      applyChange(
        (currentTransportV2) => ({
          ...currentTransportV2,
          meta: {
            ...currentTransportV2.meta,
            entry_mode: mode,
          },
        }),
        { immediateSave: true },
      );
    },
    [applyChange],
  );

  const setQuestionnaireFlag = useCallback(
    (flagKey, value) => {
      applyChange((currentTransportV2) => ({
        ...currentTransportV2,
        draft: {
          ...currentTransportV2.draft,
          questionnaire_flags: {
            ...(currentTransportV2.draft?.questionnaire_flags || {}),
            [flagKey]: value,
          },
        },
      }));
    },
    [applyChange],
  );

  const addVehicleRow = useCallback(() => {
    const nextVehicle = createEmptyVehicleRow();

    applyChange((currentTransportV2) => ({
      ...currentTransportV2,
      draft: {
        ...currentTransportV2.draft,
        vehicles: [...(currentTransportV2.draft?.vehicles || []), nextVehicle],
      },
    }));

    return nextVehicle.vehicle_id;
  }, [applyChange]);

  const updateVehicleRow = useCallback(
    (vehicleId, updater) => {
      applyChange((currentTransportV2) => ({
        ...currentTransportV2,
        draft: {
          ...currentTransportV2.draft,
          vehicles: (currentTransportV2.draft?.vehicles || []).map((vehicle) => {
            if (vehicle?.vehicle_id !== vehicleId) {
              return vehicle;
            }

            return updater(vehicle);
          }),
        },
      }));
    },
    [applyChange],
  );

  const removeVehicleRow = useCallback(
    (vehicleId) => {
      applyChange((currentTransportV2) => ({
        ...currentTransportV2,
        draft: {
          ...currentTransportV2.draft,
          vehicles: (currentTransportV2.draft?.vehicles || []).filter(
            (vehicle) => vehicle?.vehicle_id !== vehicleId,
          ),
        },
      }));
    },
    [applyChange],
  );

  const retrySave = useCallback(() => {
    if (!transportV2Ref.current) {
      return;
    }

    void saveSnapshot(transportV2Ref.current, currentVersionRef.current).catch(() => {});
  }, [saveSnapshot]);

  const saveNow = useCallback(async () => {
    if (!transportV2Ref.current) {
      return null;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    try {
      return await saveSnapshot(transportV2Ref.current, currentVersionRef.current);
    } catch {
      return null;
    }
  }, [saveSnapshot]);

  const submitDraft = useCallback(async () => {
    if (!certificationId || !transportV2Ref.current) {
      return null;
    }

    if (transportV2Ref.current.meta?.status === 'submitted') {
      return transportV2Ref.current;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (submitAbortControllerRef.current) {
      submitAbortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    submitAbortControllerRef.current = abortController;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (hasUnsavedChanges || saveError) {
        const savedDraft = await saveSnapshot(transportV2Ref.current, currentVersionRef.current);
        if (savedDraft) {
          replaceTransportV2(savedDraft);
        }
      }

      const submittedTransportV2 = await submitTransportV2(certificationId, {
        signal: abortController.signal,
      });

      replaceTransportV2(submittedTransportV2);
      setHasUnsavedChanges(false);
      setSaveError(null);
      setSubmitError(null);

      return submittedTransportV2;
    } catch (error) {
      if (error?.name === 'CanceledError' || error?.name === 'AbortError') {
        return null;
      }

      if (handleUnauthorized(error)) {
        return null;
      }

      setSubmitError(
        getApiErrorMessage(error, 'Errore durante l\'invio del questionario Transport V2.'),
      );
      return null;
    } finally {
      if (submitAbortControllerRef.current === abortController) {
        submitAbortControllerRef.current = null;
      }

      setIsSubmitting(false);
    }
  }, [
    certificationId,
    handleUnauthorized,
    hasUnsavedChanges,
    replaceTransportV2,
    saveError,
    saveSnapshot,
  ]);

  return {
    transportV2,
    isLoading,
    loadError,
    isSaving,
    saveError,
    isSubmitting,
    submitError,
    hasUnsavedChanges,
    reload: loadDraft,
    retrySave,
    saveNow,
    submitDraft,
    setEntryMode,
    setQuestionnaireFlag,
    addVehicleRow,
    updateVehicleRow,
    removeVehicleRow,
  };
}
