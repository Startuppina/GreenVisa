import { beforeEach, describe, expect, it, vi } from 'vitest';

const { axiosGetMock, axiosPutMock } = vi.hoisted(() => ({
  axiosGetMock: vi.fn(),
  axiosPutMock: vi.fn(),
}));

vi.mock('../../../src/axiosInstance.js', () => ({
  default: {
    get: axiosGetMock,
    put: axiosPutMock,
  },
}));

import {
  getApiErrorMessage,
  getTransportV2Draft,
  saveTransportV2Draft,
} from '../../../src/transportV2/transportV2Api.js';

describe('transportV2Api', () => {
  beforeEach(() => {
    axiosGetMock.mockReset();
    axiosPutMock.mockReset();
  });

  it('getTransportV2Draft calls the correct GET endpoint and returns canonical transport_v2', async () => {
    const transportV2 = { meta: { certification_id: 123 } };
    const signal = new AbortController().signal;

    axiosGetMock.mockResolvedValue({
      data: {
        transport_v2: transportV2,
      },
    });

    const result = await getTransportV2Draft(123, { signal });

    expect(axiosGetMock).toHaveBeenCalledWith('/transport-v2/123', { signal });
    expect(result).toEqual(transportV2);
  });

  it('saveTransportV2Draft calls the correct PUT endpoint with the provided narrow payload', async () => {
    const payload = {
      entry_mode: 'form',
      draft: {
        questionnaire_flags: {
          uses_navigator: true,
        },
        vehicles: [],
      },
    };
    const signal = new AbortController().signal;

    axiosPutMock.mockResolvedValue({
      data: {
        transport_v2: {
          meta: {
            updated_at: '2026-03-30T10:20:00.000Z',
          },
        },
      },
    });

    const result = await saveTransportV2Draft(987, payload, { signal });

    expect(axiosPutMock).toHaveBeenCalledWith('/transport-v2/987/draft', payload, { signal });
    expect(axiosPutMock.mock.calls[0][1]).toEqual({
      entry_mode: 'form',
      draft: {
        questionnaire_flags: {
          uses_navigator: true,
        },
        vehicles: [],
      },
    });
    expect(axiosPutMock.mock.calls[0][1]).not.toHaveProperty('derived');
    expect(axiosPutMock.mock.calls[0][1]).not.toHaveProperty('results');
    expect(result).toEqual({
      meta: {
        updated_at: '2026-03-30T10:20:00.000Z',
      },
    });
  });

  it('surfaces API errors to the caller instead of swallowing them', async () => {
    const error = new Error('network exploded');
    axiosPutMock.mockRejectedValue(error);

    await expect(
      saveTransportV2Draft(123, {
        entry_mode: 'chatbot',
        draft: {
          questionnaire_flags: {},
          vehicles: [],
        },
      }),
    ).rejects.toThrow('network exploded');
  });

  it('extracts nested backend error messages when available', () => {
    expect(
      getApiErrorMessage(
        {
          response: {
            data: {
              msg: 'Errore backend esplicito',
            },
          },
        },
        'fallback',
      ),
    ).toBe('Errore backend esplicito');

    expect(getApiErrorMessage(new Error('fallback native'), 'fallback')).toBe('fallback native');
  });
});
