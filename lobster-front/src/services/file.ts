import request from './request';
import { ApiResponse } from '../types';

export interface FileUploadResponse {
  url: string;
  path: string;
  originalName: string;
  contentType: string;
  size: number;
}

export const uploadImageApi = (file: File): Promise<ApiResponse<FileUploadResponse>> => {
  const formData = new FormData();
  formData.append('file', file);

  return request.post('/files/images', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
