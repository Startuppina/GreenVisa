import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_DEBOUNCE_MS = 800;

export default function useAutosave({
    valueSignature,
    enabled = true,
    canSave = true,
    onSave,
    debounceMs = DEFAULT_DEBOUNCE_MS,
}) {
    const [ui, setUi] = useState({
        isDirty: false,
        isSaving: false,
        saveError: null,
        saveSuccessAt: null,
    });

    const initializedRef = useRef(false);
    const timeoutRef = useRef(null);
    const lastSavedSignatureRef = useRef(valueSignature);
    const lastAttemptedSignatureRef = useRef(valueSignature);
    const latestSignatureRef = useRef(valueSignature);

    useEffect(() => {
        latestSignatureRef.current = valueSignature;
    }, [valueSignature]);

    const clearPendingSave = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const saveNow = useCallback(async () => {
        const signatureAtSave = latestSignatureRef.current;
        lastAttemptedSignatureRef.current = signatureAtSave;

        setUi((previous) => ({
            ...previous,
            isSaving: true,
            saveError: null,
        }));

        try {
            await onSave();
            lastSavedSignatureRef.current = signatureAtSave;
            setUi((previous) => ({
                ...previous,
                isSaving: false,
                isDirty: latestSignatureRef.current !== lastSavedSignatureRef.current,
                saveError: null,
                saveSuccessAt: new Date().toISOString(),
            }));
            return true;
        } catch (error) {
            setUi((previous) => ({
                ...previous,
                isSaving: false,
                isDirty: latestSignatureRef.current !== lastSavedSignatureRef.current,
                saveError: error?.response?.data?.msg || error?.message || "Salvataggio automatico non riuscito.",
            }));
            return false;
        }
    }, [onSave]);

    useEffect(() => {
        if (!initializedRef.current) {
            initializedRef.current = true;
            lastSavedSignatureRef.current = valueSignature;
            lastAttemptedSignatureRef.current = valueSignature;
            return undefined;
        }

        if (!enabled) {
            clearPendingSave();
            setUi((previous) => ({
                ...previous,
                isDirty: false,
                isSaving: false,
            }));
            return undefined;
        }

        const isDirty = valueSignature !== lastSavedSignatureRef.current;
        const alreadyAttemptedCurrentValue = valueSignature === lastAttemptedSignatureRef.current;
        setUi((previous) => ({
            ...previous,
            isDirty,
            saveError: isDirty ? previous.saveError : null,
        }));

        if (!isDirty || !canSave || ui.isSaving || (ui.saveError && alreadyAttemptedCurrentValue)) {
            clearPendingSave();
            return undefined;
        }

        timeoutRef.current = setTimeout(() => {
            timeoutRef.current = null;
            saveNow();
        }, debounceMs);

        return () => {
            clearPendingSave();
        };
    }, [canSave, clearPendingSave, debounceMs, enabled, saveNow, ui.isSaving, valueSignature]);

    useEffect(() => () => clearPendingSave(), [clearPendingSave]);

    return {
        ...ui,
        saveNow,
    };
}
