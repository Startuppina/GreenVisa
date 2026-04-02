import { useState, useCallback, useRef } from 'react';
import * as chatApi from './chatApi';
import { getFaqAnswer } from './faqContent';

const GREETING_TEXT = 'Ciao, sono qui per aiutarti a compilare il questionario. Puoi farmi domande su questa sezione.';

export default function useChatWidget({ questionnaireType, certificationId, buildingId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: GREETING_TEXT, id: 'greeting' },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [emailDraft, setEmailDraft] = useState(null);

  const conversationIdRef = useRef(null);
  const initializingRef = useRef(false);

  const ensureConversation = useCallback(async () => {
    if (conversationIdRef.current) return conversationIdRef.current;
    if (initializingRef.current) return null;

    initializingRef.current = true;
    try {
      const data = await chatApi.createConversation({
        questionnaireType,
        certificationId,
        buildingId,
      });
      conversationIdRef.current = data.conversation.id;
      return data.conversation.id;
    } catch (err) {
      setError('Impossibile avviare la conversazione. Riprova.');
      return null;
    } finally {
      initializingRef.current = false;
    }
  }, [questionnaireType, certificationId, buildingId]);

  const open = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
  }, []);

  const minimize = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(true);
  }, []);

  const sendMessage = useCallback(async (text, faqKey) => {
    if (!text.trim() || isLoading) return;

    const userMsg = { role: 'user', content: text.trim(), id: Date.now().toString() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    try {
      const convId = await ensureConversation();
      if (!convId) {
        setIsLoading(false);
        return;
      }

      const assistantMsg = await chatApi.sendMessage(convId, {
        content: text.trim(),
        faqKey,
      });

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: assistantMsg.content,
        id: assistantMsg.id?.toString() || Date.now().toString(),
      }]);
    } catch (err) {
      setError('Errore nell\'invio del messaggio. Riprova.');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, ensureConversation]);

  const answerFaq = useCallback((text, faqKey) => {
    const trimmedText = text.trim();
    const faqAnswer = getFaqAnswer(questionnaireType, faqKey);

    if (!trimmedText || !faqAnswer || isLoading) return;

    setError(null);
    setMessages(prev => [
      ...prev,
      { role: 'user', content: trimmedText, id: `${Date.now()}-faq-user` },
      { role: 'assistant', content: faqAnswer, id: `${Date.now()}-faq-assistant` },
    ]);
  }, [isLoading, questionnaireType]);

  const handleRequestHandoff = useCallback(async () => {
    if (!conversationIdRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const draft = await chatApi.requestHandoff(conversationIdRef.current);
      setEmailDraft(draft);
    } catch (err) {
      setError('Errore nella generazione dell\'email. Riprova.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const dismissError = useCallback(() => setError(null), []);
  const dismissEmailDraft = useCallback(() => setEmailDraft(null), []);

  return {
    isOpen,
    isMinimized,
    messages,
    isLoading,
    error,
    emailDraft,
    open,
    close,
    minimize,
    sendMessage,
    answerFaq,
    requestHandoff: handleRequestHandoff,
    dismissError,
    dismissEmailDraft,
  };
}
