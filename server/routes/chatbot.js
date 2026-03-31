const express = require('express');
const jwt = require('jsonwebtoken');
const { handleMessage } = require('../services/chatbot/chatService');
const storage = require('../services/chatbot/chatStorageService');
const { generateEmailDraft } = require('../services/chatbot/chatHandoffService');

const router = express.Router();

const GREETING = 'Ciao, sono qui per aiutarti a compilare il questionario. Puoi farmi domande su questa sezione.';

function optionalAuth(req, res, next) {
  const token = req.cookies.accessToken || req.cookies.recoveryToken || null;
  if (!token) {
    req.user = null;
    return next();
  }
  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    req.user = err ? null : decoded;
    next();
  });
}

router.post('/chatbot/conversations', optionalAuth, async (req, res) => {
  try {
    const { questionnaireType, certificationId, buildingId } = req.body;

    if (!questionnaireType) {
      return res.status(400).json({ error: 'questionnaireType è obbligatorio' });
    }

    const conversation = await storage.createConversation({
      userId: req.user?.user_id || null,
      sessionId: req.cookies.sessionId || null,
      questionnaireType,
      certificationId,
      buildingId,
    });

    const greetingMessage = await storage.addMessage({
      conversationId: conversation.id,
      role: 'assistant',
      content: GREETING,
    });

    return res.status(201).json({
      conversation: {
        id: conversation.id,
        questionnaireType: conversation.questionnaire_type,
        status: conversation.status,
      },
      greeting: greetingMessage,
    });
  } catch (error) {
    console.error('Errore creazione conversazione chatbot:', error);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});

router.post('/chatbot/conversations/:id/messages', optionalAuth, async (req, res) => {
  try {
    const conversationId = parseInt(req.params.id, 10);
    const { content, faqKey } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Il messaggio non può essere vuoto' });
    }

    const conversation = await storage.getConversation(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversazione non trovata' });
    }

    const message = await handleMessage({
      conversationId,
      content: content.trim(),
      faqKey,
    });

    return res.status(200).json({ message });
  } catch (error) {
    console.error('Errore invio messaggio chatbot:', error);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});

router.post('/chatbot/conversations/:id/handoff', optionalAuth, async (req, res) => {
  try {
    const conversationId = parseInt(req.params.id, 10);

    const conversation = await storage.getConversation(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversazione non trovata' });
    }

    const messages = await storage.getRecentMessages(conversationId, 20);

    const emailDraft = await generateEmailDraft(conversation, messages);

    await storage.markHandoffGenerated(conversationId);

    return res.status(200).json({ emailDraft });
  } catch (error) {
    console.error('Errore generazione email di supporto:', error);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});

module.exports = router;
