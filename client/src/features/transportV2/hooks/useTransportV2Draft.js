import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchTransportV2, saveTransportV2Draft, submitTransportV2 } from '../api/transportV2Api.js';
import {
  extractApiErrorMessage,
  extractApiFieldErrors,
  normalizeTransportV2Envelope,
  sanitizeDraftForSave,
} from '../api/transportV2Mappers.js';
import createEmptyTransportV2Draft from '../utils/emptyTransportV2Draft.js';
import createEmptyVehicleRow from '../utils/emptyVehicleRow.js';
import { groupErrorsByField, isDualFuelType, validateTransportV2ForSubmit } from '../utils/validation.js';

const AUTOSAVE_DEBOUNCE_MS = 500;

function clearErrorFields(errorMap, fieldsToClear) {
  if (!fieldsToClear.length) {
    return errorMap;
  }

  const next = { ...errorMap };
  fieldsToClear.forEach((field) => {
    delete next[field];
  });
  return next;
}

function getNextSelectedVehicleId(vehicles, previousSelection, preferredVehicleId = null) {
  if (preferredVehicleId && vehicles.some((vehicle) => vehicle.vehicle_id === preferredVehicleId)) {
    return preferredVehicleId;
  }

  if (previousSelection && vehicles.some((vehicle) => vehicle.vehicle_id === previousSelection)) {
    return previousSelection;
  }

  return vehicles[0]?.vehicle_id || null;
}

export default function useTransportV2Draft(certificationId) {
  const numericCertificationId = Number(certificationId);
  const [transportV2, setTransportV2] = useState(() => createEmptyTransportV2Draft(numericCertificationId));
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [draftRevision, setDraftRevision] = useState(0);
  const [ui, setUi] = useState({
    isLoading: true,
    isSaving: false,
    isSubmitting: false,
    isDirty: false,
    loadError: null,
    saveError: null,
    submitError: null,
    saveSuccessAt: null,
  });

  const transportV2Ref = useRef(transportV2);
  const uiRef = useRef(ui);
  const autosaveTimeoutRef = useRef(null);
  const lastAutosaveAttemptRevisionRef = useRef(0);
  const autosavePausedRef = useRef(false);

  useEffect(() => {
    transportV2Ref.current = transportV2;
  }, [transportV2]);

  useEffect(() => {
    uiRef.current = ui;
  }, [ui]);

  const applyTransportV2 = useCallback((nextValue, options = {}) => {
    const normalized = normalizeTransportV2Envelope(nextValue, numericCertificationId);
    const preferredVehicleId = options.preferredVehicleId || null;

    setTransportV2(normalized);
    setSelectedVehicleId((current) =>
      getNextSelectedVehicleId(normalized.draft.vehicles, current, preferredVehicleId),
    );
    setFieldErrors(options.fieldErrors || {});
    setUi((previous) => ({
      ...previous,
      isDirty: options.markDirty ?? previous.isDirty,
      saveError: options.saveError ?? null,
      submitError: options.submitError ?? null,
      saveSuccessAt: options.saveSuccessAt ?? previous.saveSuccessAt,
    }));

    return normalized;
  }, [numericCertificationId]);

  const loadTransportV2 = useCallback(async () => {
    setUi((previous) => ({
      ...previous,
      isLoading: true,
      loadError: null,
    }));

    try {
      const response = await fetchTransportV2(numericCertificationId);
      const normalized = normalizeTransportV2Envelope(response, numericCertificationId);
      setTransportV2(normalized);
      setSelectedVehicleId(getNextSelectedVehicleId(normalized.draft.vehicles, null));
      setFieldErrors({});
      setUi((previous) => ({
        ...previous,
        isLoading: false,
        isDirty: false,
        loadError: null,
        saveError: null,
        submitError: null,
        saveSuccessAt: null,
      }));
    } catch (error) {
      setUi((previous) => ({
        ...previous,
        isLoading: false,
        loadError: extractApiErrorMessage(error, 'Impossibile caricare la bozza del questionario trasporti.'),
      }));
    }
  }, [numericCertificationId]);

  useEffect(() => {
    if (!Number.isInteger(numericCertificationId) || numericCertificationId <= 0) {
      setUi((previous) => ({
        ...previous,
        isLoading: false,
        loadError: 'È richiesto un identificativo di certificazione valido.',
      }));
      return;
    }

    loadTransportV2();
  }, [loadTransportV2, numericCertificationId]);

  const updateDraft = useCallback((updater, clearedFields = []) => {
    setTransportV2((previous) => updater(previous));
    setFieldErrors((previous) => clearErrorFields(previous, clearedFields));
    autosavePausedRef.current = false;
    setDraftRevision((previous) => previous + 1);
    setUi((previous) => ({
      ...previous,
      isDirty: true,
      saveError: null,
      submitError: null,
      saveSuccessAt: null,
    }));
  }, []);

  const updateQuestionnaireFlag = useCallback((key, value) => {
    updateDraft(
      (previous) => ({
        ...previous,
        draft: {
          ...previous.draft,
          questionnaire_flags: {
            ...previous.draft.questionnaire_flags,
            [key]: value,
          },
        },
      }),
      [`draft.questionnaire_flags.${key}`],
    );
  }, [updateDraft]);

  const addVehicle = useCallback(() => {
    const nextVehicle = createEmptyVehicleRow();

    updateDraft((previous) => ({
      ...previous,
      draft: {
        ...previous.draft,
        vehicles: [...previous.draft.vehicles, nextVehicle],
      },
    }));

    setSelectedVehicleId(nextVehicle.vehicle_id);
    return nextVehicle;
  }, [updateDraft]);

  const deleteVehicle = useCallback((vehicleId) => {
    updateDraft(
      (previous) => ({
        ...previous,
        draft: {
          ...previous.draft,
          vehicles: previous.draft.vehicles.filter((vehicle) => vehicle.vehicle_id !== vehicleId),
        },
      }),
      Object.keys(fieldErrors).filter((field) => field.includes('.vehicles[')),
    );

    setSelectedVehicleId((current) => {
      if (current !== vehicleId) {
        return current;
      }

      const nextVehicles = transportV2Ref.current.draft.vehicles.filter((vehicle) => vehicle.vehicle_id !== vehicleId);
      return nextVehicles[0]?.vehicle_id || null;
    });
  }, [fieldErrors, updateDraft]);

  const updateVehicle = useCallback((vehicleId, updater, clearedFields = []) => {
    updateDraft(
      (previous) => ({
        ...previous,
        draft: {
          ...previous.draft,
          vehicles: previous.draft.vehicles.map((vehicle, index) => {
            if (vehicle.vehicle_id !== vehicleId) {
              return vehicle;
            }

            const nextVehicle = updater(vehicle, index);
            return nextVehicle;
          }),
        },
      }),
      clearedFields,
    );
  }, [updateDraft]);

  const updateVehicleTransportMode = useCallback((vehicleId, transportMode) => {
    updateVehicle(
      vehicleId,
      (vehicle, index) => {
        const basePath = `draft.vehicles[${index}]`;
        const nextFields = { ...vehicle.fields };

        if (transportMode === 'passenger') {
          nextFields.load_profile_code = null;
          nextFields.goods_vehicle_over_3_5_tons = null;
        }

        if (transportMode === 'goods') {
          nextFields.occupancy_profile_code = null;
        }

        return {
          ...vehicle,
          transport_mode: transportMode || null,
          fields: nextFields,
        };
      },
      [
        'draft.vehicles',
        'draft.vehicles.transport_mode',
        'draft.vehicles.fields',
        'draft.vehicles.fields.occupancy_profile_code',
        'draft.vehicles.fields.load_profile_code',
        'draft.vehicles.fields.goods_vehicle_over_3_5_tons',
      ],
    );
  }, [updateVehicle]);

  const updateVehicleField = useCallback((vehicleId, fieldName, value) => {
    updateVehicle(vehicleId, (vehicle, index) => {
      const nextFields = {
        ...vehicle.fields,
        [fieldName]: value,
      };

      if (fieldName === 'fuel_type' && !isDualFuelType(value)) {
        nextFields.wltp_co2_g_km_alt_fuel = null;
      }

      return {
        ...vehicle,
        fields: nextFields,
      };
    }, [`draft.vehicles[0].fields.${fieldName}`]);
  }, [updateVehicle]);

  const updateVehicleNotes = useCallback((vehicleId, value) => {
    updateVehicle(vehicleId, (vehicle, index) => ({
      ...vehicle,
      row_notes: value || null,
    }), [`draft.vehicles[0].row_notes`]);
  }, [updateVehicle]);

  const replaceVehicle = useCallback((vehicleId, nextVehicle) => {
    updateVehicle(vehicleId, () => nextVehicle, []);
  }, [updateVehicle]);

  const saveDraft = useCallback(async ({ silentSuccess = false } = {}) => {
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
      autosaveTimeoutRef.current = null;
    }

    setUi((previous) => ({
      ...previous,
      isSaving: true,
      saveError: null,
    }));

    try {
      const response = await saveTransportV2Draft(
        numericCertificationId,
        sanitizeDraftForSave(transportV2Ref.current),
      );

      const normalized = normalizeTransportV2Envelope(response, numericCertificationId);
      setTransportV2(normalized);
      setSelectedVehicleId((current) => getNextSelectedVehicleId(normalized.draft.vehicles, current));
      setFieldErrors({});
      setUi((previous) => ({
        ...previous,
        isSaving: false,
        isDirty: false,
        saveError: null,
        submitError: null,
        saveSuccessAt: silentSuccess ? previous.saveSuccessAt : new Date().toISOString(),
      }));

      return { ok: true, transportV2: normalized };
    } catch (error) {
      const nextFieldErrors = extractApiFieldErrors(error);
      if (error?.response?.status === 409) {
        autosavePausedRef.current = true;
      }
      setFieldErrors(nextFieldErrors);
      setUi((previous) => ({
        ...previous,
        isSaving: false,
        saveError: extractApiErrorMessage(error, 'Impossibile salvare la bozza del questionario trasporti.'),
      }));
      return { ok: false, fieldErrors: nextFieldErrors };
    }
  }, [numericCertificationId]);

  const isSubmitted = transportV2.meta?.status === 'submitted';

  useEffect(() => {
    if (!ui.isDirty || ui.isLoading || ui.isSubmitting || isSubmitted) {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
        autosaveTimeoutRef.current = null;
      }
      return;
    }

    if (ui.isSaving || autosavePausedRef.current) {
      return;
    }

    if (draftRevision <= lastAutosaveAttemptRevisionRef.current) {
      return;
    }

    autosaveTimeoutRef.current = setTimeout(() => {
      autosaveTimeoutRef.current = null;
      if (!uiRef.current.isDirty || uiRef.current.isLoading || uiRef.current.isSubmitting || uiRef.current.isSaving) {
        return;
      }
      lastAutosaveAttemptRevisionRef.current = draftRevision;
      saveDraft({ silentSuccess: true });
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
        autosaveTimeoutRef.current = null;
      }
    };
  }, [draftRevision, isSubmitted, saveDraft, ui.isDirty, ui.isLoading, ui.isSaving, ui.isSubmitting]);

  const submitDraft = useCallback(async () => {
    const clientErrors = validateTransportV2ForSubmit(transportV2Ref.current);
    if (clientErrors.length) {
      const grouped = groupErrorsByField(clientErrors);
      setFieldErrors(grouped);
      setUi((previous) => ({
        ...previous,
        submitError: 'Compila i campi obbligatori prima di inviare.',
      }));
      return { ok: false, fieldErrors: grouped };
    }

    if (uiRef.current.isDirty) {
      const saveResult = await saveDraft({ silentSuccess: true });
      if (!saveResult.ok) {
        setUi((previous) => ({
          ...previous,
          submitError: 'Salvataggio non riuscito: invio non eseguito.',
        }));
        return { ok: false };
      }
    }

    setUi((previous) => ({
      ...previous,
      isSubmitting: true,
      submitError: null,
    }));

    try {
      const response = await submitTransportV2(numericCertificationId);
      const normalized = normalizeTransportV2Envelope(response, numericCertificationId);
      setTransportV2(normalized);
      setSelectedVehicleId((current) => getNextSelectedVehicleId(normalized.draft.vehicles, current));
      setFieldErrors({});
      setUi((previous) => ({
        ...previous,
        isSubmitting: false,
        isDirty: false,
        saveError: null,
        submitError: null,
        saveSuccessAt: previous.saveSuccessAt || new Date().toISOString(),
      }));
      return { ok: true, transportV2: normalized };
    } catch (error) {
      const nextFieldErrors = extractApiFieldErrors(error);
      setFieldErrors(nextFieldErrors);
      setUi((previous) => ({
        ...previous,
        isSubmitting: false,
        submitError: extractApiErrorMessage(error, 'Impossibile inviare il questionario trasporti.'),
      }));
      return { ok: false, fieldErrors: nextFieldErrors };
    }
  }, [numericCertificationId, saveDraft]);

  const selectedVehicle = useMemo(
    () => transportV2.draft.vehicles.find((vehicle) => vehicle.vehicle_id === selectedVehicleId) || null,
    [selectedVehicleId, transportV2.draft.vehicles],
  );

  const selectedVehicleIndex = useMemo(
    () => transportV2.draft.vehicles.findIndex((vehicle) => vehicle.vehicle_id === selectedVehicleId),
    [selectedVehicleId, transportV2.draft.vehicles],
  );

  return {
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
    replaceVehicle,
    saveDraft,
    submitDraft,
  };
}
