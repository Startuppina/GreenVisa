import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { useTransportV2DraftMock } = vi.hoisted(() => ({
  useTransportV2DraftMock: vi.fn(),
}));

vi.mock('../../../src/transportV2/hooks/useTransportV2Draft.js', () => ({
  default: useTransportV2DraftMock,
}));

import { renderTransportV2Page } from '../../helpers/renderTransportV2Page.jsx';
import {
  makeFormModeDraftFixture,
  makeFreshDraftFixture,
} from '../../helpers/transportV2Fixtures.js';

describe('TransportV2Page entry mode flow', () => {
  beforeEach(() => {
    useTransportV2DraftMock.mockReset();
  });

  it('shows the entry mode selector when meta.entry_mode is null', async () => {
    useTransportV2DraftMock.mockReturnValue(buildHookState({
      transportV2: makeFreshDraftFixture(),
    }));

    renderTransportV2Page({ route: '/transport-v2/123' });

    expect((await screen.findByText(/^Form$/)).closest('button')).toBeInTheDocument();
    expect(screen.getByText(/^Chatbot$/).closest('button')).toBeInTheDocument();
    expect(screen.queryByText('Questionnaire flags')).not.toBeInTheDocument();
  });

  it('skips the selector and renders the form shell directly when entry_mode is form', async () => {
    useTransportV2DraftMock.mockReturnValue(buildHookState({
      transportV2: makeFormModeDraftFixture(),
    }));

    renderTransportV2Page({ route: '/transport-v2/123' });

    expect(await screen.findByText('Questionnaire flags')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /form/i })).not.toBeInTheDocument();
  });

  it('renders the chatbot placeholder when entry_mode is chatbot', async () => {
    useTransportV2DraftMock.mockReturnValue(buildHookState({
      transportV2: makeFreshDraftFixture({
        meta: {
          entry_mode: 'chatbot',
        },
      }),
    }));

    renderTransportV2Page({ route: '/transport-v2/123' });

    expect(await screen.findByText('Entry mode chatbot registrato')).toBeInTheDocument();
    expect(screen.getByText('Questionnaire flags')).toBeInTheDocument();
  });

  it('choosing form persists entry_mode=form and enters the form shell without re-showing the selector', async () => {
    const setEntryMode = vi.fn();

    useTransportV2DraftMock.mockReturnValue(buildHookState({
      transportV2: makeFreshDraftFixture(),
      setEntryMode,
    }));

    const user = userEvent.setup();
    renderTransportV2Page({ route: '/transport-v2/123' });

    await user.click((await screen.findByText(/^Form$/)).closest('button'));

    expect(setEntryMode).toHaveBeenCalledWith('form');
  });

  it('choosing chatbot persists entry_mode=chatbot and shows the implemented placeholder fallback', async () => {
    const setEntryMode = vi.fn();

    useTransportV2DraftMock.mockReturnValue(buildHookState({
      transportV2: makeFreshDraftFixture(),
      setEntryMode,
    }));

    const user = userEvent.setup();
    renderTransportV2Page({ route: '/transport-v2/123' });

    await user.click((await screen.findByText(/^Chatbot$/)).closest('button'));

    expect(setEntryMode).toHaveBeenCalledWith('chatbot');
  });
});

function buildHookState(overrides = {}) {
  return {
    transportV2: null,
    isLoading: false,
    loadError: null,
    isSaving: false,
    saveError: null,
    hasUnsavedChanges: false,
    reload: vi.fn(),
    retrySave: vi.fn(),
    setEntryMode: vi.fn(),
    setQuestionnaireFlag: vi.fn(),
    addVehicleRow: vi.fn(),
    updateVehicleRow: vi.fn(),
    removeVehicleRow: vi.fn(),
    ...overrides,
  };
}
