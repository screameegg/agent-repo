export type CaptchaType = 'login' | 'register';

export interface CaptchaRequestParams {
  account: string;
  type: CaptchaType;
}

export interface CaptchaResponse {
  captchaKey: string;
  captchaImage: string;
  expireSeconds: number;
}

export interface LoginFormData {
  username: string;
  password: string;
  captcha?: string;
  captchaKey?: string;
}

export interface RegisterFormData {
  username: string;
  password: string;
  confirmPassword?: string;
  captcha?: string;
  captchaKey?: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    avatar?: string;
    role?: string;
  };
}
