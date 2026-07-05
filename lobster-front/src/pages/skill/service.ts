import request from '../../services/request';
import { ApiResponse, PageResult } from '../../types';
import { SkillConfig, SkillFile, SkillPackage } from './Editor/types';

export const pageMarketSkillsApi = (params?: {
  current?: number;
  size?: number;
  keyword?: string;
}): Promise<ApiResponse<PageResult<SkillPackage>>> => {
  return request.get('/skills/market', { params });
};

export const listMySkillsApi = (params?: {
  current?: number;
  size?: number;
}): Promise<ApiResponse<PageResult<SkillPackage>>> => {
  return request.get('/skills/mine', { params });
};

export const listInstalledSkillsApi = (params?: {
  current?: number;
  size?: number;
}): Promise<ApiResponse<PageResult<SkillPackage>>> => {
  return request.get('/skills/installed', { params });
};

export const getSkillApi = (id: string): Promise<ApiResponse<SkillPackage>> => {
  return request.get(`/skills/${id}`);
};

export const createSkillApi = (data: SkillConfig): Promise<ApiResponse<SkillPackage>> => {
  return request.post('/skills', toSkillSaveRequest(data));
};

export const updateSkillApi = (id: string, data: SkillConfig): Promise<ApiResponse<SkillPackage>> => {
  return request.put(`/skills/${id}`, toSkillSaveRequest(data));
};

export const publishSkillApi = (id: string): Promise<ApiResponse<SkillPackage>> => {
  return request.post(`/skills/${id}/publish`);
};

export const offlineSkillApi = (id: string): Promise<ApiResponse<SkillPackage>> => {
  return request.post(`/skills/${id}/offline`);
};

export const installSkillApi = (id: string): Promise<ApiResponse<SkillPackage>> => {
  return request.post(`/skills/${id}/install`);
};

export const forkSkillApi = (id: string): Promise<ApiResponse<SkillPackage>> => {
  return request.post(`/skills/${id}/fork`);
};

export const uninstallSkillApi = (id: string): Promise<ApiResponse<void>> => {
  return request.delete(`/skills/${id}/install`);
};

export const deleteSkillApi = (id: string): Promise<ApiResponse<void>> => {
  return request.delete(`/skills/${id}`);
};

export const toEditorConfig = (skill: SkillPackage): SkillConfig => ({
  id: skill.id,
  name: skill.name,
  description: skill.description || '',
  icon: skill.icon || '',
  version: skill.version || '1.0.0',
  visibility: skill.visibility || 'private',
  publishStatus: skill.publishStatus || 'draft',
  runtimeEnvironments: skill.runtimeEnvironments || [],
  coreCapabilities: skill.coreCapabilities || [],
  files: (skill.files || [])
    .filter((file) => file.nodeType !== 'folder')
    .map((file) => ({
      id: file.id,
      nodeType: file.nodeType,
      name: file.path || file.name,
      path: file.path || file.name,
      language: file.language || 'text',
      content: file.content || '',
    })),
});

const toSkillSaveRequest = (config: SkillConfig) => ({
  name: config.name,
  description: config.description,
  icon: config.icon || '',
  version: config.version || '1.0.0',
  visibility: config.visibility || 'private',
  publishStatus: config.publishStatus || 'draft',
  runtimeEnvironments: config.runtimeEnvironments || [],
  coreCapabilities: config.coreCapabilities || [],
  files: config.files.map((file: SkillFile, index) => ({
    id: file.id,
    nodeType: file.nodeType || 'file',
    name: file.name.split('/').pop() || file.name,
    path: file.path || file.name,
    language: file.language,
    content: file.content,
    sortOrder: index,
  })),
});
