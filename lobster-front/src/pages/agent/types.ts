import { SkillPackage } from '../skill/Editor/types';

export interface Agent {
  id: string;
  name: string;
  code: string;
  description: string;
  createdAt: string;
  role: string;
  skillCount: number;
  mountedSkillCount?: number;
  memoryCount: number;
  goalCount: number;
  avatar: string;
  baseModel?: string;
  status?: string;
  isAssociated?: boolean;
  syncStatus?: 'unassociated' | 'associated' | 'pending' | 'synced' | 'timeout' | string;
  pendingConfigEvents?: number;
  lastConfigEventAt?: string;
}

export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  icon?: string;
  sourceType?: string;
  status: string;
}

export interface AgentSkillCreateRequest {
  name: string;
  description?: string;
  icon?: string;
  sourceType?: string;
  mountStatus?: string;
  configJson?: string;
}

export interface AgentSkillMount {
  id: string;
  agentId: string;
  skillId: string;
  name: string;
  description: string;
  icon?: string;
  version?: string;
  mountStatus: string;
  configJson?: string;
}

export interface AgentSkillMountRequest {
  skillId: string;
  mountStatus?: string;
  configJson?: string;
}

export interface AgentConfigEvent {
  id: string;
  agentId: string;
  eventType: string;
  eventStatus: string;
  payloadJson?: string;
  createdAt: string;
}

export interface AgentMemory {
  id: string;
  title: string;
  content: string;
  memoryType: string;
  importance: number;
  source?: string;
  createdAt: string;
}

export interface AgentGoalStep {
  id: string;
  title: string;
  description?: string;
  status: string;
  sortOrder?: number;
  updatedAt?: string;
}

export interface AgentGoal {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: number;
  dueTime?: string;
  steps?: AgentGoalStep[];
}

export interface AgentDetailResponse {
  agent: Agent;
  skills: AgentSkill[];
  skillMounts?: AgentSkillMount[];
  skillPackages?: SkillPackage[];
  platformSkillCount?: number;
  mountedSkillPackageCount?: number;
  unmountedSkillPackageCount?: number;
  skillPackageScope?: 'mounted_only' | string;
  memories: AgentMemory[];
  goals: AgentGoal[];
}

export interface AgentCreateRequest {
  name: string;
  role: string;
  description?: string;
  systemPrompt?: string;
  avatar?: string;
  baseModel?: string;
}

export interface AgentUpdateRequest extends AgentCreateRequest {
  status?: string;
  associationStatus?: string;
}

export interface AgentMemoryCreateRequest {
  title: string;
  content: string;
  memoryType?: string;
  importance?: number;
  source?: string;
}

export interface AgentGoalCreateRequest {
  title: string;
  description?: string;
  goalStatus?: string;
  priority?: number;
  dueTime?: string;
  steps?: AgentGoalStep[];
}

export interface AgentToken {
  id: string;
  agentId?: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string;
  skillRead?: boolean;
  skillWrite?: boolean;
  memoryRead?: boolean;
  memoryWrite?: boolean;
  goalRead?: boolean;
  goalWrite?: boolean;
  agentRegister: boolean;
  agentSync: boolean;
  configRead: boolean;
  backupExport: boolean;
}

export interface AgentTokenCreateRequest {
  agentId?: string;
  name: string;
  skillRead?: boolean;
  skillWrite?: boolean;
  memoryRead?: boolean;
  memoryWrite?: boolean;
  goalRead?: boolean;
  goalWrite?: boolean;
  agentRegister: boolean;
  agentSync: boolean;
  configRead: boolean;
  backupExport: boolean;
}

export interface AgentTokenUpdateRequest extends AgentTokenCreateRequest {}

export interface AgentTokenCreateResponse {
  token: AgentToken;
  plainToken: string;
}
