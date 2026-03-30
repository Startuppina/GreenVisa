import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useTransportV2Draft from '../../../src/transportV2/hooks/useTransportV2Draft.js';
import { makeFormModeDraftFixture } from '../../helpers/transportV2Fixtures.js';
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

describe('TransportV2 autosave orchestration', () => {
  beforeEach(() => {
    getTransportV2DraftMock.mockReset();
    saveTransportV2DraftMock.mockReset();
    vi.useRealTimers();
  });

  it('does not autosave before the initial draft load completes', async () => {
    const deferred = createDeferred();
    getTransportV2DraftMock.mockReturnValue(deferred.promise);

    renderHook(() => useTransportV2Draft('123'));

    expect(saveTransportV2DraftMock).not.toHaveBeenCalled();

    deferred.resolve(makeFormModeDraftFixture());
    await waitFor(() => expect(getTransportV2DraftMock).toHaveBeenCalledTimes(1));
    expect(saveTransportV2DraftMock).not.toHaveBeenCalled();
  });

  it('coalesces multiple quick edits into one debounced save with a narrow payload', async () => {
    getTransportV2DraftMock.mockResolvedValue(makeFormModeDraftFixture());
    saveTransportV2DraftMock.mockResolvedValue(makeFormModeDraftFixture());

    const { result } = renderHook(() => useTransportV2Draft('123'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    vi.useFakeTimers();

    act(() => {
      result.current.setQuestionnaireFlag('uses_navigator', true);
      result.current.setQuestionnaireFlag('uses_class_a_tires', false);
    });

    await advanceAutosaveTimers();
    await flushPromises();

    expect(saveTransportV2DraftMock).toHaveBeenCalledTimes(1);
    expect(saveTransportV2DraftMock.mock.calls[0][1]).toEqual({
      entry_mode: 'form',
      draft: {
        questionnaire_flags: expect.objectContaining({
          uses_navigator: true,
          uses_class_a_tires: false,
        }),
        vehicles: expect.any(Array),
      },
    });
    expect(saveTransportV2DraftMock.mock.calls[0][1]).not.toHaveProperty('derived');
    expect(saveTransportV2DraftMock.mock.calls[0][1]).not.toHaveProperty('results');
  });

  it('preserves local edits after save failure and retries on the next edit', async () => {
    getTransportV2DraftMock.mockResolvedValue(makeFormModeDraftFixture());
    saveTransportV2DraftMock
      .mockRejectedValueOnce(new Error('save failed'))
      .mockResolvedValueOnce(makeFormModeDraftFixture());

    const { result } = renderHook(() => useTransportV2Draft('123'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    vi.useFakeTimers();

    act(() => {
      result.current.setQuestionnaireFlag('eco_drive_training', false);
    });
    await advanceAutosaveTimers();
    await flushPromises();

    expect(result.current.saveError).toBe('save failed');
    expect(result.current.transportV2.draft.questionnaire_flags.eco_drive_training).toBe(false);

    act(() => {
      result.current.setQuestionnaireFlag('uses_navigator', true);
    });
    await advanceAutosaveTimers();
    await flushPromises();

    expect(saveTransportV2DraftMock).toHaveBeenCalledTimes(2);
  });
});

function createDeferred() {
  let resolve;
  const promise = new Promise((innerResolve) => {
    resolve = innerResolve;
  });

  return { promise, resolve };
}
