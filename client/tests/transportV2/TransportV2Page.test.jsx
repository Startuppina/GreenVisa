import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../msw/server';
import { renderTransportV2Page } from '../helpers/renderTransportV2Page.jsx';
import {
  createTransportV2GetHandler,
  createTransportV2PutHandler,
  createTransportV2SubmitHandler,
} from '../helpers/transportV2Msw.js';
import {
  makeOcrVehicleRow,
  makeSubmittedDraftFixture,
  makeTransportV2Fixture,
  makeManualVehicleRow,
} from '../helpers/transportV2Fixtures.js';

describe('TransportV2Page', () => {
  it('autosaves draft when a field changes', async () => {
    const user = userEvent.setup();
    const fixture = makeTransportV2Fixture();
    const savedPayloads = [];

    server.use(
      createTransportV2GetHandler(() => HttpResponse.json({ transport_v2: fixture })),
      createTransportV2PutHandler(async ({ request }) => {
        const payload = await request.json();
        savedPayloads.push(payload);
        return HttpResponse.json({
          transport_v2: makeTransportV2Fixture({
            draft: {
              questionnaire_flags: {
                ...fixture.draft.questionnaire_flags,
                ...payload.draft?.questionnaire_flags,
              },
              vehicles: fixture.draft.vehicles,
            },
          }),
        });
      }),
    );

    renderTransportV2Page();
    await screen.findByText('Certification #123');

    await user.selectOptions(
      screen.getByRole('combobox', { name: /Eco-drive training coverage/i }),
      'all',
    );

    await waitFor(() => {
      expect(savedPayloads.length).toBeGreaterThan(0);
      expect(savedPayloads.at(-1)).toEqual({
        draft: expect.objectContaining({
          questionnaire_flags: expect.objectContaining({
            eco_drive_training: 'all',
          }),
        }),
      });
    }, { timeout: 2500 });
  });

  it('saves only the draft payload', async () => {
    const user = userEvent.setup();
    const fixture = makeTransportV2Fixture({
      draft: {
        questionnaire_flags: {
          compliance_with_vehicle_regulations: true,
        },
        vehicles: [],
      },
    });
    let savedPayload = null;

    server.use(
      createTransportV2GetHandler(() => HttpResponse.json({ transport_v2: fixture })),
      createTransportV2PutHandler(async ({ request }) => {
        savedPayload = await request.json();
        return HttpResponse.json({
          transport_v2: {
            ...fixture,
            meta: {
              ...fixture.meta,
              updated_at: '2026-03-30T11:15:00.000Z',
            },
          },
        });
      }),
    );

    renderTransportV2Page();

    await screen.findByText('Certification #123');
    await user.click(screen.getByRole('button', { name: /save draft/i }));

    await waitFor(() => {
      expect(savedPayload).toEqual({
        draft: fixture.draft,
      });
    });
  });

  it('does not loop autosave after a 409 response', async () => {
    const user = userEvent.setup();
    const fixture = makeTransportV2Fixture();
    let saveAttempts = 0;

    server.use(
      createTransportV2GetHandler(() => HttpResponse.json({ transport_v2: fixture })),
      createTransportV2PutHandler(async () => {
        saveAttempts += 1;
        return HttpResponse.json(
          { msg: 'Transport V2 questionnaire has already been submitted and is no longer editable.' },
          { status: 409 },
        );
      }),
    );

    renderTransportV2Page();
    await screen.findByText('Certification #123');

    await user.selectOptions(
      screen.getByRole('combobox', { name: /Eco-drive training coverage/i }),
      'all',
    );

    await waitFor(() => {
      expect(saveAttempts).toBe(1);
    }, { timeout: 2500 });

    await new Promise((resolve) => {
      setTimeout(resolve, 1500);
    });
    expect(saveAttempts).toBe(1);
  });

  it('resumes autosave after the next edit following a 409 response', async () => {
    const user = userEvent.setup();
    const fixture = makeTransportV2Fixture();
    let saveAttempts = 0;

    server.use(
      createTransportV2GetHandler(() => HttpResponse.json({ transport_v2: fixture })),
      createTransportV2PutHandler(async ({ request }) => {
        saveAttempts += 1;
        if (saveAttempts === 1) {
          return HttpResponse.json(
            { msg: 'Transport V2 questionnaire has already been submitted and is no longer editable.' },
            { status: 409 },
          );
        }

        const payload = await request.json();
        return HttpResponse.json({
          transport_v2: makeTransportV2Fixture({
            draft: {
              questionnaire_flags: {
                ...fixture.draft.questionnaire_flags,
                ...payload.draft?.questionnaire_flags,
              },
              vehicles: fixture.draft.vehicles,
            },
          }),
        });
      }),
    );

    renderTransportV2Page();
    await screen.findByText('Certification #123');

    const ecoDriveSelect = screen.getByRole('combobox', { name: /Eco-drive training coverage/i });
    const classATiresSelect = screen.getByRole('combobox', { name: /Class A tire adoption/i });

    await user.selectOptions(ecoDriveSelect, 'all');

    await waitFor(() => {
      expect(saveAttempts).toBe(1);
    }, { timeout: 2500 });

    await user.selectOptions(classATiresSelect, 'some');

    await waitFor(() => {
      expect(saveAttempts).toBe(2);
    }, { timeout: 2500 });
  });

  it('applies OCR output into the normal vehicle workflow', async () => {
    const user = userEvent.setup();
    const ocrVehicle = makeOcrVehicleRow();
    let applyPayload = null;

    server.use(
      createTransportV2GetHandler(() =>
        HttpResponse.json({
          transport_v2: makeTransportV2Fixture(),
        }),
      ),
      http.post('*/documents/upload', () =>
        HttpResponse.json({
          documents: [
            {
              documentId: 77,
              fileName: 'vehicle.pdf',
              status: 'needs_review',
            },
          ],
        }),
      ),
      http.get('*/documents/77/result', () =>
        HttpResponse.json({
          documentId: 77,
          fileName: 'vehicle.pdf',
          status: 'needs_review',
          transportV2VehiclePrefill: {
            vehicle_id: 'ocr-doc-77',
            transport_mode: 'goods',
            fields: {
              registration_year: 2018,
              euro_class: 'EURO_5',
              fuel_type: 'diesel',
              co2_emissions_g_km: 143,
            },
          },
          validationIssues: [],
        }),
      ),
      http.post('*/documents/77/apply', async ({ request }) => {
        applyPayload = await request.json();

        return HttpResponse.json({
          status: 'applied',
          vehicle: ocrVehicle,
          transport_v2: makeTransportV2Fixture({
            draft: {
              questionnaire_flags: {},
              vehicles: [ocrVehicle],
            },
          }),
        });
      }),
    );

    renderTransportV2Page();

    await screen.findByText('Certification #123');

    const fileInput = screen.getByLabelText(/upload one or more documents/i);
    await user.upload(fileInput, new File(['test-pdf'], 'vehicle.pdf', { type: 'application/pdf' }));

    await screen.findByText('vehicle.pdf');
    await screen.findByText('143');
    await screen.findByRole('button', { name: /create vehicle/i });
    await user.click(screen.getByRole('button', { name: /create vehicle/i }));

    await waitFor(() => {
      expect(applyPayload).toEqual({
        certificationId: 123,
        transportMode: 'goods',
      });
    });

    await waitFor(() => {
      const co2Input = screen.getByRole('spinbutton', { name: /CO₂ emissions \(g\/km\)/i });
      expect(co2Input).toHaveValue(143);
    });

    await screen.findByText(/Last successful save:/i);
  });

  describe('submit confirmation dialog', () => {
    it('shows confirmation dialog when Submit is clicked and cancelling does not submit', async () => {
      const user = userEvent.setup();
      let submitCalled = false;

      server.use(
        createTransportV2GetHandler(() =>
          HttpResponse.json({ transport_v2: makeTransportV2Fixture() }),
        ),
        createTransportV2SubmitHandler(() => {
          submitCalled = true;
          return HttpResponse.json({ transport_v2: makeSubmittedDraftFixture() });
        }),
      );

      renderTransportV2Page();
      await screen.findByText('Certification #123');

      await user.click(screen.getByRole('button', { name: /^Submit$/i }));

      expect(screen.getByText(/Conferma invio questionario/i)).toBeInTheDocument();
      expect(screen.getByText(/non sarà più possibile modificare/i)).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /Annulla/i }));

      expect(screen.queryByText(/Conferma invio questionario/i)).not.toBeInTheDocument();
      expect(submitCalled).toBe(false);
    });

    it('confirming the dialog triggers submit and transitions to read-only', async () => {
      const user = userEvent.setup();
      const submittedFixture = makeSubmittedDraftFixture();

      server.use(
        createTransportV2GetHandler(() =>
          HttpResponse.json({ transport_v2: makeTransportV2Fixture({
            draft: {
              questionnaire_flags: {
                compliance_with_vehicle_regulations: true,
                uses_navigator: true,
                uses_class_a_tires: false,
                eco_drive_training: 'all',
                interested_in_mobility_manager_course: false,
                interested_in_second_level_certification: true,
              },
              vehicles: [makeManualVehicleRow()],
            },
          }) }),
        ),
        createTransportV2PutHandler(async ({ request }) => {
          const payload = await request.json();
          return HttpResponse.json({
            transport_v2: makeTransportV2Fixture({ draft: payload.draft }),
          });
        }),
        createTransportV2SubmitHandler(() =>
          HttpResponse.json({ transport_v2: submittedFixture }),
        ),
      );

      renderTransportV2Page();
      await screen.findByText('Certification #123');

      await user.click(screen.getByRole('button', { name: /^Submit$/i }));
      await user.click(screen.getByRole('button', { name: /Conferma invio/i }));

      await screen.findByText(/Questionario inviato/i);

      expect(screen.queryByRole('button', { name: /Save draft/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^Submit$/i })).not.toBeInTheDocument();
    });
  });

  describe('post-submit read-only state', () => {
    function setupSubmittedPage() {
      const fixture = makeSubmittedDraftFixture();

      server.use(
        createTransportV2GetHandler(() =>
          HttpResponse.json({ transport_v2: fixture }),
        ),
      );

      renderTransportV2Page();
      return fixture;
    }

    it('shows submitted banner instead of save/submit buttons', async () => {
      setupSubmittedPage();

      await screen.findByText(/Questionario inviato/i);

      expect(screen.queryByRole('button', { name: /Save draft/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^Submit$/i })).not.toBeInTheDocument();
    });

    it('disables questionnaire flag controls', async () => {
      setupSubmittedPage();

      await screen.findByText(/Questionario inviato/i);

      const radios = screen.getAllByRole('radio');
      for (const radio of radios) {
        expect(radio).toBeDisabled();
      }

      const comboboxes = screen.getAllByRole('combobox');
      for (const combobox of comboboxes) {
        expect(combobox).toBeDisabled();
      }
    });

    it('hides add vehicle and delete buttons', async () => {
      setupSubmittedPage();

      await screen.findByText(/Questionario inviato/i);

      expect(screen.queryByRole('button', { name: /Add vehicle/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Delete/i })).not.toBeInTheDocument();
    });

    it('hides the OCR upload panel entirely', async () => {
      setupSubmittedPage();

      await screen.findByText(/Questionario inviato/i);

      expect(screen.queryByText(/OCR assist/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/upload one or more documents/i)).not.toBeInTheDocument();
    });

    it('still shows results panel', async () => {
      setupSubmittedPage();

      await screen.findByText(/Questionario inviato/i);

      expect(screen.getByText('87')).toBeInTheDocument();
    });
  });
});
