import axios from 'axios';

const chatAxios = axios.create({
  baseURL: `${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api`,
  withCredentials: true,
});

chatAxios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function createConversation({ questionnaireType, certificationId, buildingId }) {
  const response = await chatAxios.post('/chatbot/conversations', {
    questionnaireType,
    certificationId: certificationId || undefined,
    buildingId: buildingId || undefined,
  });
  return response.data;
}

export async function sendMessage(conversationId, { content, faqKey }) {
  const response = await chatAxios.post(`/chatbot/conversations/${conversationId}/messages`, {
    content,
    faqKey: faqKey || undefined,
  });
  return response.data.message;
}

export async function requestHandoff(conversationId) {
  const response = await chatAxios.post(`/chatbot/conversations/${conversationId}/handoff`);
  return response.data.emailDraft;
}
