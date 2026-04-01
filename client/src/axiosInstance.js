import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api`,
  withCredentials: true,
});

axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname.toLowerCase();
      const isRecoveryPath = currentPath.includes('/verification') || currentPath.includes('/reset');
      if (!isRecoveryPath) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
