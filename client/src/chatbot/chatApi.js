import axiosInstance from '../axiosInstance';

export async function createConversation({ questionnaireType, certificationId, buildingId }) {
  const response = await axiosInstance.post('/chatbot/conversations', {
    questionnaireType,
    certificationId: certificationId || undefined,
    buildingId: buildingId || undefined,
  });
  return response.data;
}

export async function sendMessage(conversationId, { content, faqKey }) {
  const response = await axiosInstance.post(`/chatbot/conversations/${conversationId}/messages`, {
    content,
    faqKey: faqKey || undefined,
  });
  return response.data.message;
}

export async function requestHandoff(conversationId) {
  const response = await axiosInstance.post(`/chatbot/conversations/${conversationId}/handoff`);
  return response.data.emailDraft;
}
