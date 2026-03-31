const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const HANDOFF_PROMPT = `Sei un assistente che deve generare una bozza di email di supporto in italiano.
Ti verrà fornita una conversazione tra un utente e un chatbot di assistenza per la compilazione di un questionario GreenVisa.

Genera una email con:
- Oggetto: breve e chiaro, che descriva il problema
- Corpo: in italiano, che includa:
  - Un saluto iniziale
  - Un riassunto chiaro del problema dell'utente basato sulla conversazione
  - Il tipo di questionario (trasporti o edifici)
  - Un elenco puntato delle domande o dubbi irrisolti
  - Una chiusura cortese

NON includere dettagli tecnici di implementazione.
NON inventare informazioni non presenti nella conversazione.

Rispondi SOLO con un JSON valido in questo formato:
{
  "subject": "...",
  "body": "..."
}`;

async function generateEmailDraft(conversation, messages) {
  const conversationSummary = messages
    .map(m => `${m.role === 'user' ? 'Utente' : 'Assistente'}: ${m.content}`)
    .join('\n');

  const questionnaireLabel = conversation.questionnaire_type === 'transport'
    ? 'Trasporti'
    : conversation.questionnaire_type === 'spa'
      ? 'Spa e Resorts'
      : 'Edifici';

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.3,
    messages: [
      { role: 'system', content: HANDOFF_PROMPT },
      {
        role: 'user',
        content: `Tipo di questionario: ${questionnaireLabel}\n\nConversazione:\n${conversationSummary}`,
      },
    ],
  });

  const raw = completion.choices[0].message.content.trim();

  let parsed;
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
  } catch {
    parsed = {
      subject: `Richiesta supporto - Questionario ${questionnaireLabel}`,
      body: raw,
    };
  }

  return {
    to: 'supporto@greenvisa.it',
    subject: parsed.subject,
    body: parsed.body,
  };
}

module.exports = { generateEmailDraft };
