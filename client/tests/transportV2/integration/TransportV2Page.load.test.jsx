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

describe('TransportV2Page load flow', () => {
  beforeEach(() => {
    useTransportV2DraftMock.mockReset();
  });

  it('shows a loading state while the initial GET is pending and then renders the form shell', async () => {
    useTransportV2DraftMock.mockReturnValue({
      transportV2: null,
      isLoading: true,
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
    });

    renderTransportV2Page({ route: '/transport-v2/123' });

    expect(screen.getByText('Caricamento draft Transport V2')).toBeInTheDocument();
  });

  it('renders the form shell when the hook provides a loaded draft state', async () => {
    useTransportV2DraftMock.mockReturnValue({
      transportV2: makeFormModeDraftFixture(),
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
    });

    renderTransportV2Page({ route: '/transport-v2/123' });

    expect(screen.getByText('Questionnaire flags')).toBeInTheDocument();
    expect(screen.getByText('Veicoli')).toBeInTheDocument();
  });

  it('renders explicit load error state and retries successfully', async () => {
    const reload = vi.fn();
    useTransportV2DraftMock.mockReturnValue({
      transportV2: null,
      isLoading: false,
      loadError: 'Errore durante il caricamento del draft.',
      isSaving: false,
      saveError: null,
      hasUnsavedChanges: false,
      reload,
      retrySave: vi.fn(),
      setEntryMode: vi.fn(),
      setQuestionnaireFlag: vi.fn(),
      addVehicleRow: vi.fn(),
      updateVehicleRow: vi.fn(),
      removeVehicleRow: vi.fn(),
    });

    const user = userEvent.setup();
    renderTransportV2Page({ route: '/transport-v2/123' });

    expect(screen.getByText('Errore di caricamento')).toBeInTheDocument();
    expect(screen.getByText('Errore durante il caricamento del draft.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Riprova caricamento' }));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('resolves certificationId from the query string when the route param is absent', async () => {
    useTransportV2DraftMock.mockReturnValue({
      transportV2: makeFreshDraftFixture({
        meta: {
          certification_id: 321,
        },
      }),
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
    });

    renderTransportV2Page({
      route: '/transport-v2?certificationId=321',
      path: '/transport-v2',
    });

    expect(useTransportV2DraftMock).toHaveBeenCalledWith('321', expect.any(Object));
    expect(screen.getByText('Certification ID: 321')).toBeInTheDocument();
    expect(screen.queryByText('Certification ID mancante')).not.toBeInTheDocument();
  });
});
