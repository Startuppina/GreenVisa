import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeFreshDraftFixture,
  makeFormModeDraftFixture,
  makeSubmittedDraftFixture,
} from '../../helpers/transportV2Fixtures.js';
import { advanceAutosaveTimers, flushPromises } from '../../helpers/testUtils.js';

const { getTransportV2DraftMock, saveTransportV2DraftMock } = vi.hoisted(() => ({
  getTransportV2DraftMock: vi.fn(),
  saveTransportV2DraftMock: vi.fn(),
}));

vi.mock('../../../src/transportV2/transportV2Api.js', () => ({
  getTransportV2Draft: getTransportV2DraftMock,
  saveTransportV2Draft: saveTransportV2DraftMock,
  getApiErrorMessage: (error, fallbackMessage) =>
    error?.response?.data?.msg || error?.message || fallbackMessage,
}));

import useTransportV2Draft from '../../../src/transportV2/hooks/useTransportV2Draft.js';

describe('useTransportV2Draft', () => {
  beforeEach(() => {
    getTransportV2DraftMock.mockReset();
    saveTransportV2DraftMock.mockReset();
    vi.useRealTimers();
  });

  it('starts in loading state and hydrates local canonical state after GET resolves', async () => {
    const deferred = createDeferred();
    getTransportV2DraftMock.mockReturnValue(deferred.promise);

    const { result } = renderHook(() => useTransportV2Draft('123'));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.transportV2).toBe(null);

    deferred.resolve(makeFreshDraftFixture());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.transportV2.meta.certification_id).toBe(123);
    expect(result.current.loadError).toBe(null);
  });

  it('sets loadError when initial GET fails', async () => {
    getTransportV2DraftMock.mockRejectedValue(new Error('boom load'));

    const { result } = renderHook(() => useTransportV2Draft('123'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.loadError).toBe('boom load');
    expect(result.current.transportV2).toBe(null);
  });

  it('setEntryMode updates local state immediately and saves through the backend', async () => {
    getTransportV2DraftMock.mockResolvedValue(makeFreshDraftFixture());
    saveTransportV2DraftMock.mockResolvedValue(
      makeFreshDraftFixture({
        meta: {
          entry_mode: 'form',
          updated_at: '2026-03-30T10:20:00.000Z',
        },
      }),
    );

    const { result } = renderHook(() => useTransportV2Draft('123'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.setEntryMode('form');
    });

    expect(result.current.transportV2.meta.entry_mode).toBe('form');

    await waitFor(() => expect(saveTransportV2DraftMock).toHaveBeenCalledTimes(1));
    expect(saveTransportV2DraftMock).toHaveBeenCalledWith(
      '123',
      expect.objectContaining({
        entry_mode: 'form',
        draft: expect.any(Object),
      }),
      expect.any(Object),
    );

    await waitFor(() =>
      expect(result.current.transportV2.meta.updated_at).toBe('2026-03-30T10:20:00.000Z'),
    );
  });

  it('supports mutating flags and vehicle rows locally', async () => {
    getTransportV2DraftMock.mockResolvedValue(makeFormModeDraftFixture());
    saveTransportV2DraftMock.mockResolvedValue(makeFormModeDraftFixture());

    const { result } = renderHook(() => useTransportV2Draft('123'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const originalVehicleId = result.current.transportV2.draft.vehicles[0].vehicle_id;

    act(() => {
      result.current.setQuestionnaireFlag('uses_navigator', true);
      result.current.addVehicleRow();
      result.current.updateVehicleRow(originalVehicleId, (vehicle) => ({
        ...vehicle,
        row_notes: 'Aggiornato nel test',
      }));
    });

    expect(result.current.transportV2.draft.questionnaire_flags.uses_navigator).toBe(true);
    expect(result.current.transportV2.draft.vehicles).toHaveLength(2);
    expect(result.current.transportV2.draft.vehicles[0].row_notes).toBe('Aggiornato nel test');
    expect(result.current.hasUnsavedChanges).toBe(true);

    const addedVehicleId = result.current.transportV2.draft.vehicles[1].vehicle_id;

    act(() => {
      result.current.removeVehicleRow(addedVehicleId);
    });

    expect(result.current.transportV2.draft.vehicles).toHaveLength(1);
  });

  it('coalesces multiple quick edits into one debounced save and sends a narrow payload', async () => {
    getTransportV2DraftMock.mockResolvedValue(makeFormModeDraftFixture());
    saveTransportV2DraftMock.mockResolvedValue(
      makeFormModeDraftFixture({
        meta: {
          updated_at: '2026-03-30T10:30:00.000Z',
        },
      }),
    );

    const { result } = renderHook(() => useTransportV2Draft('123'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    vi.useFakeTimers();

    act(() => {
      result.current.setQuestionnaireFlag('uses_navigator', true);
      result.current.setQuestionnaireFlag('uses_class_a_tires', false);
    });

    expect(result.current.hasUnsavedChanges).toBe(true);
    expect(saveTransportV2DraftMock).not.toHaveBeenCalled();

    await advanceAutosaveTimers(799);
    expect(saveTransportV2DraftMock).not.toHaveBeenCalled();

    await advanceAutosaveTimers(1);
    await flushPromises();

    expect(saveTransportV2DraftMock).toHaveBeenCalledTimes(1);
    const [certificationId, payload] = saveTransportV2DraftMock.mock.calls[0];
    expect(certificationId).toBe('123');
    expect(payload).toEqual({
      entry_mode: 'form',
      draft: {
        questionnaire_flags: expect.objectContaining({
          uses_navigator: true,
          uses_class_a_tires: false,
        }),
        vehicles: expect.any(Array),
      },
    });
    expect(payload).not.toHaveProperty('derived');
    expect(payload).not.toHaveProperty('results');

    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(result.current.transportV2.meta.updated_at).toBe('2026-03-30T10:30:00.000Z');
  });

  it('preserves local edits and dirty state after save failure, then retries on a later edit', async () => {
    getTransportV2DraftMock.mockResolvedValue(makeFormModeDraftFixture());
    saveTransportV2DraftMock
      .mockRejectedValueOnce(new Error('save failed'))
      .mockResolvedValueOnce(
        makeFormModeDraftFixture({
          meta: {
            updated_at: '2026-03-30T10:40:00.000Z',
          },
          draft: {
            questionnaire_flags: {
              compliance_with_vehicle_regulations: true,
              uses_navigator: true,
              uses_class_a_tires: true,
              eco_drive_training: true,
              interested_in_mobility_manager_course: true,
              interested_in_second_level_certification: null,
            },
          },
        }),
      );

    const { result } = renderHook(() => useTransportV2Draft('123'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    vi.useFakeTimers();

    act(() => {
      result.current.setQuestionnaireFlag('interested_in_mobility_manager_course', true);
    });

    await advanceAutosaveTimers();
    await flushPromises();

    expect(saveTransportV2DraftMock).toHaveBeenCalledTimes(1);

    expect(result.current.saveError).toBe('save failed');
    expect(result.current.hasUnsavedChanges).toBe(true);
    expect(
      result.current.transportV2.draft.questionnaire_flags.interested_in_mobility_manager_course,
    ).toBe(true);

    act(() => {
      result.current.setQuestionnaireFlag('uses_navigator', true);
    });

    await advanceAutosaveTimers();
    await flushPromises();

    expect(saveTransportV2DraftMock).toHaveBeenCalledTimes(2);
    expect(result.current.saveError).toBe(null);
    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(result.current.transportV2.meta.updated_at).toBe('2026-03-30T10:40:00.000Z');
  });

  it('does not mutate local draft or autosave when status is submitted', async () => {
    getTransportV2DraftMock.mockResolvedValue(makeSubmittedDraftFixture());

    const { result } = renderHook(() => useTransportV2Draft('123'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const snapshot = result.current.transportV2;
    act(() => {
      result.current.setQuestionnaireFlag('uses_navigator', false);
      result.current.addVehicleRow();
    });

    expect(result.current.transportV2).toBe(snapshot);
    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(saveTransportV2DraftMock).not.toHaveBeenCalled();
  });

  it('retrySave calls PUT after a failed autosave', async () => {
    getTransportV2DraftMock.mockResolvedValue(makeFormModeDraftFixture());
    saveTransportV2DraftMock
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(
        makeFormModeDraftFixture({
          meta: { updated_at: '2026-03-30T15:00:00.000Z' },
        }),
      );

    const { result } = renderHook(() => useTransportV2Draft('123'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    vi.useFakeTimers();

    act(() => {
      result.current.setQuestionnaireFlag('eco_drive_training', false);
    });

    await advanceAutosaveTimers();
    await flushPromises();

    expect(result.current.saveError).toBe('network down');
    expect(saveTransportV2DraftMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.retrySave();
      await flushPromises();
    });

    expect(saveTransportV2DraftMock).toHaveBeenCalledTimes(2);
    expect(result.current.saveError).toBe(null);
    expect(result.current.transportV2.meta.updated_at).toBe('2026-03-30T15:00:00.000Z');
  });

  it('merges server meta when a save completes after newer local edits', async () => {
    getTransportV2DraftMock.mockResolvedValue(makeFormModeDraftFixture());
    let resolveFirstSave;
    const firstSavePromise = new Promise((resolve) => {
      resolveFirstSave = resolve;
    });
    saveTransportV2DraftMock.mockReturnValueOnce(firstSavePromise);

    const { result } = renderHook(() => useTransportV2Draft('123'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    vi.useFakeTimers();

    act(() => {
      result.current.setQuestionnaireFlag('interested_in_second_level_certification', true);
    });

    await advanceAutosaveTimers();
    await flushPromises();

    expect(saveTransportV2DraftMock).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.setQuestionnaireFlag('interested_in_second_level_certification', false);
    });

    const savedFromServer = makeFormModeDraftFixture({
      meta: { updated_at: '2026-03-30T16:00:00.000Z' },
    });

    await act(async () => {
      resolveFirstSave(savedFromServer);
      await flushPromises();
    });

    expect(result.current.transportV2.meta.updated_at).toBe('2026-03-30T16:00:00.000Z');
    expect(
      result.current.transportV2.draft.questionnaire_flags.interested_in_second_level_certification,
    ).toBe(false);
    expect(result.current.hasUnsavedChanges).toBe(true);
  });
});

function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((innerResolve, innerReject) => {
    resolve = innerResolve;
    reject = innerReject;
  });

  return { promise, resolve, reject };
}
