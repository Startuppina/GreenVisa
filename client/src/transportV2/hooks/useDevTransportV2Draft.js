import { useCallback, useEffect, useRef, useState } from 'react';
import { createEmptyVehicleRow } from '../transportV2Model';
import {
  DEV_TRANSPORT_V2_STORAGE_KEY,
  cloneTransportV2Draft,
  createCompleteishDraftSeed,
  createEmptyDraftSeed,
  createGoodsOcrDraftSeed,
  createPassengerOcrDraftSeed,
  createSubmittedDraftSeed,
  normalizeDevTransportV2,
} from '../devTransportV2Seeds';

const AUTOSAVE_DELAY_MS = 250;

export default function useDevTransportV2Draft() {
  const [transportV2, setTransportV2] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const transportV2Ref = useRef(null);
  const currentVersionRef = useRef(0);
  const debounceTimerRef = useRef(null);

  const replaceTransportV2 = useCallback((nextTransportV2) => {
    transportV2Ref.current = nextTransportV2;
    setTransportV2(nextTransportV2);
  }, []);

  const persistSnapshot = useCallback(
    (snapshot, snapshotVersion) => {
      if (!snapshot) {
        return;
      }

      setIsSaving(true);
      setSaveError(null);

      try {
        const normalizedSnapshot = normalizeDevTransportV2({
          ...cloneTransportV2Draft(snapshot),
          meta: {
            ...snapshot.meta,
            updated_at: new Date().toISOString(),
          },
        });

        window.localStorage.setItem(
          DEV_TRANSPORT_V2_STORAGE_KEY,
          JSON.stringify(normalizedSnapshot),
        );

        if (snapshotVersion === currentVersionRef.current) {
          replaceTransportV2(normalizedSnapshot);
          setHasUnsavedChanges(false);
        } else {
          replaceTransportV2({
            ...transportV2Ref.current,
            meta: {
              ...transportV2Ref.current?.meta,
              updated_at: normalizedSnapshot.meta.updated_at,
            },
          });
        }
      } catch (error) {
        setSaveError(
          error?.message || 'Errore durante il salvataggio locale del draft Transport V2.',
        );
        setHasUnsavedChanges(true);
      } finally {
        setIsSaving(false);
      }
    },
    [replaceTransportV2],
  );

  const loadDraft = useCallback(() => {
    setIsLoading(true);
    setLoadError(null);
    setSaveError(null);
    setHasUnsavedChanges(false);

    try {
      const rawValue = window.localStorage.getItem(DEV_TRANSPORT_V2_STORAGE_KEY);
      const nextTransportV2 = rawValue
        ? normalizeDevTransportV2(JSON.parse(rawValue))
        : createEmptyDraftSeed();

      currentVersionRef.current = 0;
      replaceTransportV2(nextTransportV2);
    } catch (error) {
      const fallbackDraft = createEmptyDraftSeed();
      window.localStorage.setItem(DEV_TRANSPORT_V2_STORAGE_KEY, JSON.stringify(fallbackDraft));
      currentVersionRef.current = 0;
      replaceTransportV2(fallbackDraft);
      setLoadError(
        'Il draft locale era corrotto o non leggibile. Ho caricato un nuovo draft vuoto.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [replaceTransportV2]);

  useEffect(() => {
    loadDraft();

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
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

        persistSnapshot(nextTransportV2, nextVersion);
      }
    },
    [persistSnapshot, replaceTransportV2],
  );

  useEffect(() => {
    if (!transportV2 || isLoading || !hasUnsavedChanges) {
      return undefined;
    }

    debounceTimerRef.current = setTimeout(() => {
      persistSnapshot(transportV2Ref.current, currentVersionRef.current);
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [hasUnsavedChanges, isLoading, persistSnapshot, transportV2]);

  const overwriteDraft = useCallback(
    (nextTransportV2) => {
      const nextVersion = currentVersionRef.current + 1;
      currentVersionRef.current = nextVersion;
      const clonedDraft = cloneTransportV2Draft(nextTransportV2);

      replaceTransportV2(clonedDraft);
      setHasUnsavedChanges(true);
      setSaveError(null);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      persistSnapshot(clonedDraft, nextVersion);
    },
    [persistSnapshot, replaceTransportV2],
  );

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

    persistSnapshot(transportV2Ref.current, currentVersionRef.current);
  }, [persistSnapshot]);

  const resetDraft = useCallback(() => {
    window.localStorage.removeItem(DEV_TRANSPORT_V2_STORAGE_KEY);
    overwriteDraft(createEmptyDraftSeed());
    setLoadError(null);
  }, [overwriteDraft]);

  const seedEmptyDraft = useCallback(() => {
    overwriteDraft(createEmptyDraftSeed());
    setLoadError(null);
  }, [overwriteDraft]);

  const seedPassengerOcrDraft = useCallback(() => {
    overwriteDraft(createPassengerOcrDraftSeed());
    setLoadError(null);
  }, [overwriteDraft]);

  const seedGoodsOcrDraft = useCallback(() => {
    overwriteDraft(createGoodsOcrDraftSeed());
    setLoadError(null);
  }, [overwriteDraft]);

  const seedCompleteishDraft = useCallback(() => {
    overwriteDraft(createCompleteishDraftSeed());
    setLoadError(null);
  }, [overwriteDraft]);

  const seedSubmittedDraft = useCallback(() => {
    overwriteDraft(createSubmittedDraftSeed());
    setLoadError(null);
  }, [overwriteDraft]);

  const toggleSubmittedState = useCallback(() => {
    const currentTransportV2 = transportV2Ref.current;
    if (!currentTransportV2) {
      return;
    }

    overwriteDraft({
      ...currentTransportV2,
      meta: {
        ...currentTransportV2.meta,
        status: currentTransportV2.meta?.status === 'submitted' ? 'draft' : 'submitted',
        submitted_at:
          currentTransportV2.meta?.status === 'submitted' ? null : new Date().toISOString(),
      },
    });
  }, [overwriteDraft]);

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
    resetDraft,
    seedEmptyDraft,
    seedPassengerOcrDraft,
    seedGoodsOcrDraft,
    seedCompleteishDraft,
    seedSubmittedDraft,
    toggleSubmittedState,
    storageKey: DEV_TRANSPORT_V2_STORAGE_KEY,
  };
}
