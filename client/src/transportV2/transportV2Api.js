import axiosInstance from '../axiosInstance';

export async function getTransportV2Draft(certificationId, { signal } = {}) {
  const response = await axiosInstance.get(`/transport-v2/${certificationId}`, {
    signal,
  });

  return response.data.transport_v2;
}

export async function saveTransportV2Draft(certificationId, payload, { signal } = {}) {
  const response = await axiosInstance.put(`/transport-v2/${certificationId}/draft`, payload, {
    signal,
  });

  return response.data.transport_v2;
}

export function getApiErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.msg || error?.message || fallbackMessage;
}
