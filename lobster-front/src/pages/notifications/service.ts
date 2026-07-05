import request from '../../services/request';
import { ApiResponse, PageResult } from '../../types';

export interface NotificationItem {
  id: string;
  notificationType: string;
  title: string;
  content: string;
  bizType: string;
  bizId: string;
  read: boolean;
  createdAt: string;
  readAt: string;
}

export const pageNotificationsApi = (params?: {
  current?: number;
  size?: number;
  unreadOnly?: boolean;
}): Promise<ApiResponse<PageResult<NotificationItem>>> => {
  return request.get('/notifications', { params });
};

export const unreadNotificationCountApi = (): Promise<ApiResponse<{ count: number }>> => {
  return request.get('/notifications/unread-count');
};

export const markNotificationReadApi = (id: string): Promise<ApiResponse<void>> => {
  return request.post(`/notifications/${id}/read`);
};

export const markAllNotificationsReadApi = (): Promise<ApiResponse<void>> => {
  return request.post('/notifications/read-all');
};
