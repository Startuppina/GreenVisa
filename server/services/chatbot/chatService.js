const OpenAI = require('openai');
const { getSystemPrompt } = require('./chatPromptService');
const storage = require('./chatStorageService');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MODEL = 'gpt-5.4-mini';

async function handleMessage({ conversationId, content, faqKey }) {
  const conversation = await storage.getConversation(conversationId);
  if (!conversation) {
    throw new Error('Conversazione non trovata');
  }

  await storage.addMessage({
    conversationId,
    role: 'user',
    content,
    faqKey: faqKey || null,
  });

  const systemPrompt = getSystemPrompt(conversation.questionnaire_type);
  const recentMessages = await storage.getRecentMessages(conversationId, 10);

  const openaiMessages = [
    { role: 'system', content: systemPrompt },
    ...recentMessages.map(m => ({ role: m.role, content: m.content })),
  ];

  const start = Date.now();

  const completion = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.3,
    max_completion_tokens: 800,
    messages: openaiMessages,
  });

  const latencyMs = Date.now() - start;
  const assistantContent = completion.choices[0].message.content.trim();
  const usage = completion.usage || null;

  const assistantMessage = await storage.addMessage({
    conversationId,
    role: 'assistant',
    content: assistantContent,
    modelName: MODEL,
    tokenUsage: usage ? { prompt: usage.prompt_tokens, completion: usage.completion_tokens, total: usage.total_tokens } : null,
    latencyMs,
  });

  return assistantMessage;
}

module.exports = { handleMessage };
