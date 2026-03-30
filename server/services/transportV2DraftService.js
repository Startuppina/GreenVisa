const repository = require('../repositories/surveyResponsesRepository');
const {
  createDefaultTransportV2,
  normalizeTransportV2,
  applyDraftWritePayload,
} = require('./transportV2Normalizer');
const { validateTransportV2Block1DraftPayload } = require('./validateTransportv2');
const { mergeOcrVehiclePrefill, normalizeTransportMode } = require('./transportV2OcrPrefillService');

class TransportV2HttpError extends Error {
  constructor(statusCode, message, extras = {}) {
    super(message);
    this.name = 'TransportV2HttpError';
    this.statusCode = statusCode;
    this.extras = extras;
  }
}

async function loadTransportV2Draft({ userId, certificationId }) {
  const normalizedCertificationId = parseCertificationId(certificationId);
  await assertTransportCertificationAccess({ userId, certificationId: normalizedCertificationId });

  return repository.withLockedSurveyResponse(
    { userId, certificationId: normalizedCertificationId },
    async (client, surveyResponse) => {
      const now = new Date().toISOString();
      const currentTransportV2 = getTransportV2FromSurveyData(surveyResponse.survey_data);
      const needsInitialization = currentTransportV2 === null;

      const canonicalTransportV2 = needsInitialization
        ? createDefaultTransportV2({ certificationId: normalizedCertificationId, now })
        : normalizeTransportV2(currentTransportV2, {
            certificationId: normalizedCertificationId,
            now,
          });

      const shouldPersist =
        needsInitialization ||
        JSON.stringify(currentTransportV2) !== JSON.stringify(canonicalTransportV2);

      if (shouldPersist) {
        await repository.saveTransportV2(client, {
          surveyResponseId: surveyResponse.id,
          transportV2: canonicalTransportV2,
        });
      }

      return canonicalTransportV2;
    },
  );
}

async function saveTransportV2Draft({ userId, certificationId, payload }) {
  const normalizedCertificationId = parseCertificationId(certificationId);
  await assertTransportCertificationAccess({ userId, certificationId: normalizedCertificationId });

  const validationResult = validateTransportV2Block1DraftPayload(payload);
  if (!validationResult.valid) {
    throw new TransportV2HttpError(400, 'Payload draft non valido.', {
      errors: validationResult.errors,
    });
  }

  return repository.withLockedSurveyResponse(
    { userId, certificationId: normalizedCertificationId },
    async (client, surveyResponse) => {
      const now = new Date().toISOString();
      const currentTransportV2 = getTransportV2FromSurveyData(surveyResponse.survey_data);
      const baseTransportV2 = currentTransportV2
        ? normalizeTransportV2(currentTransportV2, {
            certificationId: normalizedCertificationId,
            now,
          })
        : createDefaultTransportV2({
            certificationId: normalizedCertificationId,
            now,
          });

      const canonicalTransportV2 = applyDraftWritePayload(
        baseTransportV2,
        validationResult.normalizedData,
        {
          certificationId: normalizedCertificationId,
          now,
        },
      );

      await repository.saveTransportV2(client, {
        surveyResponseId: surveyResponse.id,
        transportV2: canonicalTransportV2,
      });

      return canonicalTransportV2;
    },
  );
}

async function resolveTransportSurveyResponse({ userId, certificationId }) {
  const normalizedCertificationId = parseCertificationId(certificationId);
  await assertTransportCertificationAccess({ userId, certificationId: normalizedCertificationId });

  return repository.withLockedSurveyResponse(
    { userId, certificationId: normalizedCertificationId },
    async (_client, surveyResponse) => ({
      certificationId: normalizedCertificationId,
      surveyResponseId: surveyResponse.id,
    }),
  );
}

async function upsertTransportV2OcrVehicle({
  userId,
  certificationId,
  vehiclePrefill,
  transportMode = null,
}) {
  const normalizedCertificationId = parseCertificationId(certificationId);
  await assertTransportCertificationAccess({ userId, certificationId: normalizedCertificationId });

  if (!vehiclePrefill || typeof vehiclePrefill !== 'object') {
    throw new TransportV2HttpError(400, 'Prefill OCR non valido.');
  }

  if (!Number.isInteger(vehiclePrefill.ocr_document_id) || vehiclePrefill.ocr_document_id <= 0) {
    throw new TransportV2HttpError(400, 'ocr_document_id mancante nel prefill OCR.');
  }

  return repository.withLockedSurveyResponse(
    { userId, certificationId: normalizedCertificationId },
    async (client, surveyResponse) => {
      const now = new Date().toISOString();
      const currentTransportV2 = getTransportV2FromSurveyData(surveyResponse.survey_data);
      const baseTransportV2 = currentTransportV2
        ? normalizeTransportV2(currentTransportV2, {
            certificationId: normalizedCertificationId,
            now,
          })
        : createDefaultTransportV2({
            certificationId: normalizedCertificationId,
            now,
          });

      const vehicles = Array.isArray(baseTransportV2.draft?.vehicles)
        ? [...baseTransportV2.draft.vehicles]
        : [];
      const existingIndex = vehicles.findIndex(
        (vehicle) => vehicle?.ocr_document_id === vehiclePrefill.ocr_document_id,
      );
      const mergedVehicle = mergeOcrVehiclePrefill(
        existingIndex >= 0 ? vehicles[existingIndex] : null,
        vehiclePrefill,
        normalizeTransportMode(transportMode),
      );

      if (existingIndex >= 0) {
        vehicles[existingIndex] = mergedVehicle;
      } else {
        vehicles.push(mergedVehicle);
      }

      const canonicalTransportV2 = normalizeTransportV2(
        {
          ...baseTransportV2,
          draft: {
            ...baseTransportV2.draft,
            vehicles,
          },
        },
        {
          certificationId: normalizedCertificationId,
          now,
        },
      );
      canonicalTransportV2.meta.updated_at = now;
      canonicalTransportV2.meta.status = 'draft';

      await repository.saveTransportV2(client, {
        surveyResponseId: surveyResponse.id,
        transportV2: canonicalTransportV2,
      });

      const savedVehicle = canonicalTransportV2.draft.vehicles.find(
        (vehicle) => vehicle.ocr_document_id === vehiclePrefill.ocr_document_id,
      );

      return {
        surveyResponseId: surveyResponse.id,
        transportV2: canonicalTransportV2,
        vehicle: savedVehicle || null,
      };
    },
  );
}

async function assertTransportCertificationAccess({ userId, certificationId }) {
  const certification = await repository.getTransportCertificationAccess({
    userId,
    certificationId,
  });

  if (!certification) {
    throw new TransportV2HttpError(404, 'Certificazione trasporti non trovata.');
  }

  if (!certification.has_access) {
    throw new TransportV2HttpError(403, 'Accesso negato a questa certificazione.');
  }
}

function parseCertificationId(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new TransportV2HttpError(400, 'Certification ID non valido.');
  }

  return parsed;
}

function getTransportV2FromSurveyData(surveyData) {
  if (!surveyData || typeof surveyData !== 'object' || Array.isArray(surveyData)) {
    return null;
  }

  return surveyData.transport_v2 && typeof surveyData.transport_v2 === 'object'
    ? surveyData.transport_v2
    : null;
}

module.exports = {
  TransportV2HttpError,
  loadTransportV2Draft,
  saveTransportV2Draft,
  resolveTransportSurveyResponse,
  upsertTransportV2OcrVehicle,
  assertTransportCertificationAccess,
  parseCertificationId,
  getTransportV2FromSurveyData,
};
