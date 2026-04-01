const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const {
  TransportV2HttpError,
  loadTransportV2Draft,
  saveTransportV2Draft,
} = require('../services/transportV2/transportV2DraftService');
const { submitTransportV2 } = require('../services/transportV2/transportV2SubmitService');
const { logQuestionnaireEvent, logUnexpectedError } = require('../lib/businessEvents');

const router = express.Router();

router.get('/transport-v2/:certificationId', authenticateJWT, async (req, res) => {
  try {
    const transportV2 = await loadTransportV2Draft({
      userId: req.user.user_id,
      certificationId: req.params.certificationId,
    });

    return res.status(200).json({ transport_v2: transportV2 });
  } catch (error) {
    return handleTransportV2Error(req, res, error, 'Errore durante il caricamento del draft transport V2.');
  }
});

router.put('/transport-v2/:certificationId/draft', authenticateJWT, async (req, res) => {
  try {
    const transportV2 = await saveTransportV2Draft({
      userId: req.user.user_id,
      certificationId: req.params.certificationId,
      payload: req.body,
    });

    logQuestionnaireEvent(req, 'questionnaire_draft_saved', {
      flow: 'transport_v2',
      certification_id: req.params.certificationId,
      user_id: req.user.user_id,
    });

    return res.status(200).json({ transport_v2: transportV2 });
  } catch (error) {
    return handleTransportV2Error(req, res, error, 'Errore durante il salvataggio del draft transport V2.');
  }
});

router.post('/transport-v2/:certificationId/submit', authenticateJWT, async (req, res) => {
  try {
    const transportV2 = await submitTransportV2({
      userId: req.user.user_id,
      certificationId: req.params.certificationId,
    });

    logQuestionnaireEvent(req, 'questionnaire_submitted', {
      flow: 'transport_v2',
      certification_id: req.params.certificationId,
      user_id: req.user.user_id,
    });

    return res.status(200).json({ transport_v2: transportV2 });
  } catch (error) {
    return handleTransportV2Error(req, res, error, 'Errore durante il submit di transport V2.');
  }
});

function handleTransportV2Error(req, res, error, fallbackMessage) {
  if (error instanceof TransportV2HttpError) {
    if (req.log) {
      req.log.warn({
        event: 'validation_failed',
        flow: 'transport_v2',
        status_code: error.statusCode,
      });
    }
    return res.status(error.statusCode).json({
      msg: error.message,
      ...(error.extras.errors ? { errors: error.extras.errors } : {}),
    });
  }

  logUnexpectedError(req, error, { flow: 'transport_v2' });
  return res.status(500).json({ msg: fallbackMessage });
}

module.exports = router;
