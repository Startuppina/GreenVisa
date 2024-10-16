// axiosInstance.js
import axios from 'axios';

console.log(import.meta.env.VITE_REACT_SERVER_ADDRESS);

const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api`,
});

// Interceptor per aggiungere token
axiosInstance.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401 && error.response.data.msg === "Token scaduto") {
      // Rimuovi il token scaduto dal localStorage
      localStorage.removeItem('token');

      // Reindirizza alla pagina di login
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
