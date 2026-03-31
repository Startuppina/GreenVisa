import axios from 'axios';

const transportV2Axios = axios.create({
  baseURL: `${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api`,
  withCredentials: true,
});

export async function fetchTransportV2(certificationId) {
  const response = await transportV2Axios.get(`/transport-v2/${certificationId}`);
  return response.data;
}

export async function saveTransportV2Draft(certificationId, payload) {
  const response = await transportV2Axios.put(`/transport-v2/${certificationId}/draft`, payload);
  return response.data;
}

export async function submitTransportV2(certificationId) {
  const response = await transportV2Axios.post(`/transport-v2/${certificationId}/submit`, {});
  return response.data;
}

export async function uploadTransportV2Documents({ certificationId, files }) {
  const formData = new FormData();
  formData.append('certificationId', String(certificationId));
  formData.append('category', 'transport');

  Array.from(files).forEach((file) => {
    formData.append('files', file);
  });

  const response = await transportV2Axios.post('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

export async function fetchTransportV2DocumentResult(documentId) {
  const response = await transportV2Axios.get(`/documents/${documentId}/result`);
  return response.data;
}

export async function applyTransportV2OcrDocument(documentId, payload) {
  const response = await transportV2Axios.post(`/documents/${documentId}/apply`, payload);
  return response.data;
}
