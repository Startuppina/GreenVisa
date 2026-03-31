const { getSystemPrompt } = require('../../services/chatbot/chatPromptService');

describe('chatPromptService', () => {
  it('returns a spa-specific prompt when questionnaire type is spa', () => {
    const prompt = getSystemPrompt('spa');

    expect(prompt).toContain('questionario spa e resorts');
    expect(prompt).toContain('raccolta differenziata');
  });

  it('falls back to transport template for unsupported types', () => {
    const prompt = getSystemPrompt('unknown_type');

    expect(prompt).toContain('questionario trasporti');
  });
});
