const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const {
  TransportV2HttpError,
  loadTransportV2Draft,
  saveTransportV2Draft,
} = require('../services/transportV2DraftService');
const { submitTransportV2 } = require('../services/transportV2SubmitService');

const router = express.Router();

router.get('/transport-v2/:certificationId', authenticateJWT, async (req, res) => {
  try {
    const transportV2 = await loadTransportV2Draft({
      userId: req.user.user_id,
      certificationId: req.params.certificationId,
    });

    return res.status(200).json({ transport_v2: transportV2 });
  } catch (error) {
    return handleTransportV2Error(res, error, 'Errore durante il caricamento del draft transport V2.');
  }
});

router.put('/transport-v2/:certificationId/draft', authenticateJWT, async (req, res) => {
  try {
    const transportV2 = await saveTransportV2Draft({
      userId: req.user.user_id,
      certificationId: req.params.certificationId,
      payload: req.body,
    });

    return res.status(200).json({ transport_v2: transportV2 });
  } catch (error) {
    return handleTransportV2Error(res, error, 'Errore durante il salvataggio del draft transport V2.');
  }
});

router.post('/transport-v2/:certificationId/submit', authenticateJWT, async (req, res) => {
  try {
    const transportV2 = await submitTransportV2({
      userId: req.user.user_id,
      certificationId: req.params.certificationId,
    });

    return res.status(200).json({ transport_v2: transportV2 });
  } catch (error) {
    return handleTransportV2Error(res, error, 'Errore durante il submit di transport V2.');
  }
});

function handleTransportV2Error(res, error, fallbackMessage) {
  if (error instanceof TransportV2HttpError) {
    return res.status(error.statusCode).json({
      msg: error.message,
      ...(error.extras.errors ? { errors: error.extras.errors } : {}),
    });
  }

  console.error(fallbackMessage, error);
  return res.status(500).json({ msg: fallbackMessage });
}

module.exports = router;
