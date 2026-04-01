const repository = require('../repositories/surveyResponsesRepository');
const { buildTransportV2Derived } = require('./transportV2DerivedBuilder');
const { calculateTransportV2Results } = require('./transportV2Calculator');
const { sanitizeDraftTransportV2 } = require('./transportV2Normalizer');
const { validateTransportV2Block2SubmitPayload } = require('./validateTransportv2');
const {
  TransportV2HttpError,
  assertTransportCertificationAccess,
  assertTransportV2Editable,
  getTransportV2FromSurveyData,
  parseCertificationId,
} = require('./transportV2DraftService');

async function submitTransportV2({ userId, certificationId }) {
  const normalizedCertificationId = parseCertificationId(certificationId);
  await assertTransportCertificationAccess({
    userId,
    certificationId: normalizedCertificationId,
  });

  return repository.withLockedSurveyResponse(
    { userId, certificationId: normalizedCertificationId },
    async (client, surveyResponse) => {
      const now = new Date().toISOString();
      const currentTransportV2 = getTransportV2FromSurveyData(surveyResponse.survey_data);
      assertTransportV2Editable(currentTransportV2);

      const normalizedTransportV2 = sanitizeDraftTransportV2(currentTransportV2, {
        certificationId: normalizedCertificationId,
        now,
      });

      const validationResult = validateTransportV2Block2SubmitPayload(normalizedTransportV2);
      if (!validationResult.valid) {
        throw new TransportV2HttpError(400, 'Draft transport V2 incompleto o non valido per il submit.', {
          errors: validationResult.errors,
        });
      }

      const derived = buildTransportV2Derived(normalizedTransportV2.draft);
      const results = calculateTransportV2Results(normalizedTransportV2.draft, {
        calculatedAt: now,
      });

      const submittedTransportV2 = {
        ...normalizedTransportV2,
        meta: {
          ...normalizedTransportV2.meta,
          status: 'submitted',
          submitted_at: now,
          updated_at: now,
        },
        derived,
        results,
      };

      await repository.saveTransportV2Submission(client, {
        surveyResponseId: surveyResponse.id,
        transportV2: submittedTransportV2,
        totalScore: results.score.total_score,
        co2emissions: results.co2.total_tons_per_year,
        completed: true,
      });

      return submittedTransportV2;
    },
  );
}

module.exports = {
  submitTransportV2,
};
