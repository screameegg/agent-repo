import request from '../../../services/request';
import { ApiResponse } from '../../../types';

export interface ProfileInfo {
  id: string;
  username: string;
  account: string;
  avatar: string;
  bio: string;
  theme: string;
  notifyEnabled: boolean;
  createdAt: string;
}

export interface ProfileUpdateRequest {
  username: string;
  avatar?: string;
  bio?: string;
  theme?: string;
  notifyEnabled?: boolean;
}

export interface PasswordUpdateRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}

export const getProfileApi = (): Promise<ApiResponse<ProfileInfo>> => {
  return request.get('/profile');
};

export const updateProfileApi = (data: ProfileUpdateRequest): Promise<ApiResponse<ProfileInfo>> => {
  return request.put('/profile', data);
};

export const updatePasswordApi = (data: PasswordUpdateRequest): Promise<ApiResponse<void>> => {
  return request.put('/profile/password', data);
};
