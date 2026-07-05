export interface SkillFile {
  id?: string;
  parentId?: string;
  nodeType?: 'folder' | 'file' | string;
  name: string;
  path?: string;
  content: string;
  language: string;
  sortOrder?: number;
}

export interface SkillConfig {
  id: string;
  name: string;
  description: string;
  icon?: string;
  version?: string;
  visibility?: 'private' | 'public' | string;
  publishStatus?: 'draft' | 'published' | 'offline' | string;
  runtimeEnvironments?: string[];
  coreCapabilities?: string[];
  files: SkillFile[];
  associatedAgents?: string[];
}

export interface SkillPackage extends SkillConfig {
  code: string;
  icon: string;
  installCount: number;
  author: string;
  auditStatus?: string;
  auditReason?: string;
  auditTime?: string;
}
