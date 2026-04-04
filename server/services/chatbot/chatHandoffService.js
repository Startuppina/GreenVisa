const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const EMAIL_DRAFT_SCHEMA = {
  type: 'object',
  properties: {
    subject: {
      type: 'string',
      description: 'Oggetto breve e chiaro che descrive il problema dell’utente.',
    },
    body: {
      type: 'string',
      description: 'Corpo email completo in italiano.',
    },
  },
  required: ['subject', 'body'],
  additionalProperties: false,
};

const HANDOFF_PROMPT = `Sei un assistente che deve generare una bozza di email di supporto in italiano.

Ti verrà fornita una conversazione tra un utente e un chatbot di assistenza per la compilazione di un questionario GreenVisa.

Il tuo compito è:
1. leggere l’intera conversazione;
2. individuare esclusivamente le domande dell’utente che sono rimaste senza risposta;
3. considerare una domanda "irrisolta" solo se il chatbot ha risposto con questo messaggio di default, o con una sua variante chiaramente equivalente:
   "La risposta alla tua domanda non è contenuta nel materiale che mi è stato fornito. Vuoi che ti scriva una bozza di email da mandare al servizio clienti?"
4. generare una email che chieda soltanto chiarimenti su queste domande irrisolte.

Regole fondamentali:
- Includi nell’email solo le domande irrisolte.
- NON includere domande a cui il chatbot ha già dato una risposta utile o completa.
- NON includere informazioni inventate o dedotte oltre quanto presente nella conversazione.
- Se una domanda compare più volte, evita duplicati e sintetizzala una sola volta in modo fedele.
- Se dalla conversazione emerge il tipo di questionario, specifica se si tratta di "trasporti" o "edifici".
- Se il tipo di questionario non è esplicitamente chiaro, non inventarlo.
- NON includere dettagli tecnici di implementazione.
- Se non ci sono domande irrisolte, rispondi esattamente con:
  NESSUNA_EMAIL_NECESSARIA

Genera l’output in questo formato:

Oggetto: breve e chiaro, coerente con le richieste irrisolte

Corpo:
- breve saluto iniziale
- una frase sintetica che riassuma il contesto dell’utente
- il tipo di questionario, solo se presente nella conversazione
- un elenco puntato contenente esclusivamente le domande irrisolte
- una chiusura cortese e breve con placeholder finale, ad esempio:
  "Grazie per il supporto.
  Cordiali saluti,
  [Nome]"

Importante:
Per capire quali domande inserire, devi basarti sul legame tra la domanda dell’utente e la risposta del chatbot. Una domanda va inserita nell’email solo se la risposta del chatbot a quella specifica domanda è il messaggio di default sopra indicato.`;

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
    model: 'gpt-5.4-mini',
    temperature: 0.3,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'support_email_draft',
        strict: true,
        schema: EMAIL_DRAFT_SCHEMA,
      },
    },
    messages: [
      { role: 'system', content: HANDOFF_PROMPT },
      {
        role: 'user',
        content: `Tipo di questionario: ${questionnaireLabel}\n\nConversazione:\n${conversationSummary}`,
      },
    ],
  });

  const message = completion.choices[0]?.message;

  let parsed = {
    subject: `Richiesta supporto - Questionario ${questionnaireLabel}`,
    body: 'Non e stato possibile generare automaticamente la bozza email.',
  };

  if (message?.refusal) {
    parsed.body = message.refusal;
  } else if (message?.content) {
    parsed = JSON.parse(message.content);
  }

  return {
    to: 'supporto@greenvisa.it',
    subject: parsed.subject,
    body: parsed.body,
  };
}

module.exports = { generateEmailDraft };
