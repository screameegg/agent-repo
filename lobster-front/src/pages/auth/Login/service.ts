import request from '../../../services/request';
import { ApiResponse } from '../../../types';
import { BackendCaptchaResponse, normalizeCaptchaApiResponse } from './captchaResponse';
import {
  CaptchaRequestParams,
  CaptchaResponse,
  LoginFormData,
  LoginResponse,
  RegisterFormData,
} from './types';

export const getCaptchaApi = async (params: CaptchaRequestParams): Promise<ApiResponse<CaptchaResponse>> => {
  const response = await request.get<unknown, ApiResponse<BackendCaptchaResponse>>('/captcha', { params });
  return normalizeCaptchaApiResponse(response);
};

export const loginApi = (data: LoginFormData): Promise<ApiResponse<LoginResponse>> => {
  return request.post('/auth/login', data);
};

export const registerApi = (data: RegisterFormData): Promise<ApiResponse<LoginResponse>> => {
  return request.post('/auth/register', data);
};

export const logoutApi = (): Promise<ApiResponse<void>> => {
  return request.post('/auth/logout');
};
