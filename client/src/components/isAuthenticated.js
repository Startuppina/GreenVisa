import axiosInstance from '../axiosInstance';

export async function isAuthenticated() {
  try {
    const response = await axiosInstance.get('/authenticated');
    return response.status === 200;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      return false;
    }
    return false;
  }
}
