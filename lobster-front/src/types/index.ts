export interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  message: string;
}

export interface PageResult<T = unknown> {
  records: T[];
  total: number;
  current: number;
  size: number;
}

export type { Agent } from '../pages/agent/types';

export interface Skill {
  id: string;
  name: string;
  description: string;
  author: string;
  installs: number;
  icon: string;
  version?: string;
  visibility?: string;
  publishStatus?: string;
  runtimeEnvironments?: string[];
  coreCapabilities?: string[];
}
