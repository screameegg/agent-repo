import request from '../../services/request';
import { ApiResponse, PageResult } from '../../types';
import {
  AgentCreateRequest,
  AgentDetailResponse,
  AgentGoal,
  AgentGoalCreateRequest,
  AgentMemory,
  AgentMemoryCreateRequest,
  AgentSkill,
  AgentSkillCreateRequest,
  AgentSkillMount,
  AgentSkillMountRequest,
  AgentToken,
  AgentTokenCreateResponse,
  AgentTokenCreateRequest,
  AgentTokenUpdateRequest,
  AgentUpdateRequest,
  Agent,
} from './types';

export const pageAgentsApi = (params?: {
  current?: number;
  size?: number;
  keyword?: string;
}): Promise<ApiResponse<PageResult<Agent>>> => {
  return request.get('/agents', { params });
};

export const getAgentProfileApi = (id: string): Promise<ApiResponse<Agent>> => {
  return request.get(`/agents/${id}/profile`);
};

export const exportAgentBackupApi = (id: string): Promise<ApiResponse<AgentDetailResponse>> => {
  return request.get(`/agents/${id}/backup`);
};

export const exportAgentBackupZipApi = (id: string): Promise<Blob> => {
  return request.get(`/agents/${id}/backup.zip`, { responseType: 'blob' });
};

export const importAgentBackupApi = (data: {
  backup: AgentDetailResponse;
  name?: string;
}): Promise<ApiResponse<AgentDetailResponse>> => {
  return request.post('/agents/import', data);
};

export const importAgentBackupZipApi = (file: File): Promise<ApiResponse<AgentDetailResponse>> => {
  const formData = new FormData();
  formData.append('file', file);
  return request.post('/agents/import.zip', formData);
};

export const createAgentApi = (data: AgentCreateRequest): Promise<ApiResponse<Agent>> => {
  return request.post('/agents', data);
};

export const updateAgentApi = (id: string, data: AgentUpdateRequest): Promise<ApiResponse<Agent>> => {
  return request.put(`/agents/${id}`, data);
};

export const deleteAgentApi = (id: string): Promise<ApiResponse<void>> => {
  return request.delete(`/agents/${id}`);
};

export const createAgentSkillApi = (agentId: string, data: AgentSkillCreateRequest): Promise<ApiResponse<AgentSkill>> => {
  return request.post(`/agents/${agentId}/skills`, data);
};

export const listAgentSkillsApi = (agentId: string): Promise<ApiResponse<AgentSkill[]>> => {
  return request.get(`/agents/${agentId}/skills`);
};

export const listAgentSkillMountsApi = (agentId: string): Promise<ApiResponse<AgentSkillMount[]>> => {
  return request.get(`/agents/${agentId}/skill-mounts`);
};

export const mountAgentSkillApi = (
  agentId: string,
  data: AgentSkillMountRequest
): Promise<ApiResponse<AgentSkillMount>> => {
  return request.post(`/agents/${agentId}/skill-mounts`, data);
};

export const unmountAgentSkillApi = (agentId: string, skillId: string): Promise<ApiResponse<void>> => {
  return request.delete(`/agents/${agentId}/skill-mounts/${skillId}`);
};

export const createAgentMemoryApi = (agentId: string, data: AgentMemoryCreateRequest): Promise<ApiResponse<AgentMemory>> => {
  return request.post(`/agents/${agentId}/memories`, data);
};

export const listAgentMemoriesApi = (agentId: string): Promise<ApiResponse<AgentMemory[]>> => {
  return request.get(`/agents/${agentId}/memories`);
};

export const deleteAgentMemoryApi = (agentId: string, memoryId: string): Promise<ApiResponse<void>> => {
  return request.delete(`/agents/${agentId}/memories/${memoryId}`);
};

export const createAgentGoalApi = (agentId: string, data: AgentGoalCreateRequest): Promise<ApiResponse<AgentGoal>> => {
  return request.post(`/agents/${agentId}/goals`, data);
};

export const listAgentGoalsApi = (agentId: string): Promise<ApiResponse<AgentGoal[]>> => {
  return request.get(`/agents/${agentId}/goals`);
};

export const updateAgentGoalApi = (agentId: string, goalId: string, data: AgentGoalCreateRequest): Promise<ApiResponse<AgentGoal>> => {
  return request.put(`/agents/${agentId}/goals/${goalId}`, data);
};

export const deleteAgentGoalApi = (agentId: string, goalId: string): Promise<ApiResponse<void>> => {
  return request.delete(`/agents/${agentId}/goals/${goalId}`);
};

export const listAgentTokensApi = (): Promise<ApiResponse<AgentToken[]>> => {
  return request.get('/agent-tokens');
};

export const createAgentTokenApi = (
  data: AgentTokenCreateRequest
): Promise<ApiResponse<AgentTokenCreateResponse>> => {
  return request.post('/agent-tokens', data);
};

export const updateAgentTokenApi = (
  id: string,
  data: AgentTokenUpdateRequest
): Promise<ApiResponse<AgentToken>> => {
  return request.put(`/agent-tokens/${id}`, data);
};

export const deleteAgentTokenApi = (id: string): Promise<ApiResponse<void>> => {
  return request.delete(`/agent-tokens/${id}`);
};
