import request from '../../services/request';
import { ApiResponse, PageResult } from '../../types';
import { SkillPackage } from '../skill/Editor/types';

export interface AdminUser {
  id: string;
  username: string;
  account: string;
  role: string;
  status: string;
  avatar: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface AdminAnnouncementRequest {
  title: string;
  content: string;
}

export const pageAdminUsersApi = (params?: {
  current?: number;
  size?: number;
  keyword?: string;
}): Promise<ApiResponse<PageResult<AdminUser>>> => {
  return request.get('/admin/users', { params });
};

export const updateAdminUserRoleApi = (id: string, role: string): Promise<ApiResponse<AdminUser>> => {
  return request.put(`/admin/users/${id}/role`, { role });
};

export const updateAdminUserStatusApi = (id: string, status: string): Promise<ApiResponse<AdminUser>> => {
  return request.put(`/admin/users/${id}/status`, { status });
};

export const pageAdminSkillsApi = (params?: {
  current?: number;
  size?: number;
  keyword?: string;
  auditStatus?: string;
  publishStatus?: string;
}): Promise<ApiResponse<PageResult<SkillPackage>>> => {
  return request.get('/admin/skills', { params });
};

export const approveAdminSkillApi = (id: string): Promise<ApiResponse<SkillPackage>> => {
  return request.post(`/admin/skills/${id}/approve`);
};

export const rejectAdminSkillApi = (id: string, reason: string): Promise<ApiResponse<SkillPackage>> => {
  return request.post(`/admin/skills/${id}/reject`, { reason });
};

export const publishAdminSkillApi = (id: string): Promise<ApiResponse<SkillPackage>> => {
  return request.post(`/admin/skills/${id}/publish`);
};

export const offlineAdminSkillApi = (id: string): Promise<ApiResponse<SkillPackage>> => {
  return request.post(`/admin/skills/${id}/offline`);
};

export const publishAdminAnnouncementApi = (data: AdminAnnouncementRequest): Promise<ApiResponse<{ deliveredCount: number }>> => {
  return request.post('/admin/notifications/announcements', data);
};
