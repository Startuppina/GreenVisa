const pool = require('../db');

const TRANSPORT_CERTIFICATION_CATEGORY = 'Certificazione trasporti';

async function getTransportCertificationAccess({ userId, certificationId }) {
  const { rows } = await pool.query(
    `SELECT
        p.id,
        p.category,
        EXISTS (
          SELECT 1
          FROM orders o
          WHERE o.user_id = $1 AND o.product_id = p.id
        ) AS has_access
      FROM products p
      WHERE p.id = $2
      LIMIT 1`,
    [userId, certificationId],
  );

  if (rows.length === 0) {
    return null;
  }

  const certification = rows[0];
  if (certification.category !== TRANSPORT_CERTIFICATION_CATEGORY) {
    return null;
  }

  return certification;
}

async function withLockedSurveyResponse({ userId, certificationId }, callback) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO survey_responses (user_id, certification_id, survey_data, created_at)
       VALUES ($1, $2, '{}'::jsonb, NOW())
       ON CONFLICT (user_id, certification_id) DO NOTHING`,
      [userId, certificationId],
    );

    const { rows } = await client.query(
      `SELECT *
       FROM survey_responses
       WHERE user_id = $1 AND certification_id = $2
       FOR UPDATE`,
      [userId, certificationId],
    );

    if (rows.length === 0) {
      throw new Error('Survey response row not found after initialization.');
    }

    const result = await callback(client, rows[0]);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function saveTransportV2(client, { surveyResponseId, transportV2 }) {
  const { rows } = await client.query(
    `UPDATE survey_responses
     SET survey_data = jsonb_set(COALESCE(survey_data, '{}'::jsonb), '{transport_v2}', $2::jsonb, true)
     WHERE id = $1
     RETURNING *`,
    [surveyResponseId, JSON.stringify(transportV2)],
  );

  return rows[0] || null;
}

async function saveTransportV2Submission(
  client,
  {
    surveyResponseId,
    transportV2,
    totalScore,
    co2emissions,
    completed,
  },
) {
  const { rows } = await client.query(
    `UPDATE survey_responses
     SET survey_data = jsonb_set(COALESCE(survey_data, '{}'::jsonb), '{transport_v2}', $2::jsonb, true),
         total_score = $3,
         co2emissions = $4,
         completed = $5
     WHERE id = $1
     RETURNING *`,
    [
      surveyResponseId,
      JSON.stringify(transportV2),
      totalScore,
      co2emissions,
      completed,
    ],
  );

  return rows[0] || null;
}

module.exports = {
  getTransportCertificationAccess,
  withLockedSurveyResponse,
  saveTransportV2,
  saveTransportV2Submission,
};
