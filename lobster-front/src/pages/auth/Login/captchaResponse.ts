import { ApiResponse } from '../../../types';
import { CaptchaResponse } from './types';

export interface BackendCaptchaResponse {
  captchaKey: string;
  image: string;
  expireSeconds: number;
}

export const normalizeCaptchaResponse = (data: BackendCaptchaResponse): CaptchaResponse => ({
  captchaKey: data.captchaKey,
  captchaImage: data.image,
  expireSeconds: data.expireSeconds,
});

export const normalizeCaptchaApiResponse = (
  response: ApiResponse<BackendCaptchaResponse>
): ApiResponse<CaptchaResponse> => ({
  ...response,
  data: normalizeCaptchaResponse(response.data),
});
