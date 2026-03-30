import { useCallback, useEffect, useRef, useState } from 'react';
import { getApiErrorMessage, getTransportV2Draft, saveTransportV2Draft } from '../transportV2Api';
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const transportV2Ref = useRef(null);
  const currentVersionRef = useRef(0);
  const isSavingRef = useRef(false);
  const debounceTimerRef = useRef(null);
  const loadAbortControllerRef = useRef(null);
  const saveAbortControllerRef = useRef(null);

  const replaceTransportV2 = useCallback((nextTransportV2) => {
    transportV2Ref.current = nextTransportV2;
    setTransportV2(nextTransportV2);
  }, []);

  const handleUnauthorized = useCallback(
    (error) => {
      if (error?.response?.status === 401 && typeof onUnauthorized === 'function') {
        onUnauthorized();
        return true;
      }

      return false;
    },
    [onUnauthorized],
  );

  const saveSnapshot = useCallback(
    async (snapshot, snapshotVersion) => {
      if (!certificationId || !snapshot || isSavingRef.current) {
        return;
      }

      if (saveAbortControllerRef.current) {
        saveAbortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      saveAbortControllerRef.current = abortController;
      isSavingRef.current = true;
      setIsSaving(true);
      setSaveError(null);

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
      } catch (error) {
        if (error?.name === 'CanceledError' || error?.name === 'AbortError') {
          return;
        }

        if (handleUnauthorized(error)) {
          return;
        }

        setSaveError(getApiErrorMessage(error, 'Errore durante il salvataggio del draft Transport V2.'));
        setHasUnsavedChanges(true);
      } finally {
        if (saveAbortControllerRef.current === abortController) {
          saveAbortControllerRef.current = null;
        }

        isSavingRef.current = false;
        setIsSaving(false);
      }
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

        saveSnapshot(nextTransportV2, nextVersion);
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
      saveSnapshot(transportV2Ref.current, currentVersionRef.current);
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
    applyChange((currentTransportV2) => ({
      ...currentTransportV2,
      draft: {
        ...currentTransportV2.draft,
        vehicles: [...(currentTransportV2.draft?.vehicles || []), createEmptyVehicleRow()],
      },
    }));
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

    saveSnapshot(transportV2Ref.current, currentVersionRef.current);
  }, [saveSnapshot]);

  return {
    transportV2,
    isLoading,
    loadError,
    isSaving,
    saveError,
    hasUnsavedChanges,
    reload: loadDraft,
    retrySave,
    setEntryMode,
    setQuestionnaireFlag,
    addVehicleRow,
    updateVehicleRow,
    removeVehicleRow,
  };
}
