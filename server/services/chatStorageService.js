const pool = require('../db');

async function createConversation({ userId, sessionId, questionnaireType, certificationId, buildingId }) {
  const result = await pool.query(
    `INSERT INTO chat_conversations
       (user_id, session_id, questionnaire_type, certification_id, building_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId || null, sessionId || null, questionnaireType, certificationId || null, buildingId || null]
  );
  return result.rows[0];
}

async function getConversation(id) {
  const result = await pool.query(
    'SELECT * FROM chat_conversations WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

async function addMessage({ conversationId, role, content, faqKey, modelName, tokenUsage, latencyMs }) {
  const result = await pool.query(
    `INSERT INTO chat_messages
       (conversation_id, role, content, faq_key, model_name, token_usage, latency_ms)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [conversationId, role, content, faqKey || null, modelName || null, tokenUsage || null, latencyMs || null]
  );

  await pool.query(
    `UPDATE chat_conversations SET last_message_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [conversationId]
  );

  return result.rows[0];
}

async function getRecentMessages(conversationId, limit = 10) {
  const result = await pool.query(
    `SELECT role, content FROM chat_messages
     WHERE conversation_id = $1 AND role IN ('user', 'assistant')
     ORDER BY created_at DESC
     LIMIT $2`,
    [conversationId, limit]
  );
  return result.rows.reverse();
}

async function updateConversationStatus(id, status) {
  await pool.query(
    `UPDATE chat_conversations SET status = $1, updated_at = NOW() WHERE id = $2`,
    [status, id]
  );
}

async function markHandoffGenerated(id) {
  await pool.query(
    `UPDATE chat_conversations SET handoff_generated = TRUE, status = 'handed_off', updated_at = NOW() WHERE id = $1`,
    [id]
  );
}

module.exports = {
  createConversation,
  getConversation,
  addMessage,
  getRecentMessages,
  updateConversationStatus,
  markHandoffGenerated,
};
