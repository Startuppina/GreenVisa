import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../msw/server';
import { renderTransportV2Page } from '../helpers/renderTransportV2Page.jsx';
import {
  createTransportV2GetHandler,
  createTransportV2PutHandler,
} from '../helpers/transportV2Msw.js';
import {
  makeOcrVehicleRow,
  makeTransportV2Fixture,
} from '../helpers/transportV2Fixtures.js';

describe('TransportV2Page', () => {
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
    await screen.findByRole('button', { name: /create vehicle/i });
    await user.click(screen.getByRole('button', { name: /create vehicle/i }));

    await waitFor(() => {
      expect(applyPayload).toEqual({
        certificationId: 123,
        transportMode: 'goods',
      });
    });
  });
});
