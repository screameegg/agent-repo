import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { ENV } from '../config/env';
import { useUserStore } from '../store/userStore';
import logger from '../utils/logger';
import { createDedupeAdapter } from './requestDedupe';

const request = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 10000,
  adapter: createDedupeAdapter(),
});

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useUserStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    logger.error('Request Error:', error);
    return Promise.reject(error);
  }
);

request.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  (error: AxiosError) => {
    logger.error('Response Error:', error);
    if (error.response?.status === 401) {
      useUserStore.getState().clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default request;
