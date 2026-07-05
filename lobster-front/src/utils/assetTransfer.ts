import { AgentMemory } from '../pages/agent/types';
import { SkillConfig, SkillFile } from '../pages/skill/Editor/types';

export interface MemoryAssetPackage {
  kind: 'lobster.memory-package';
  version: 1;
  exportedAt: string;
  sourceAgent?: {
    agentId?: string;
    agentName?: string;
  };
  memories: AgentMemory[];
}

export interface SkillAssetPackage {
  kind: 'lobster.skill-package';
  version: 1;
  exportedAt: string;
  skill: SkillConfig;
}

export function buildMemoryAssetPackage(
  memories: AgentMemory[],
  sourceAgent?: { agentId?: string; agentName?: string },
): MemoryAssetPackage {
  return {
    kind: 'lobster.memory-package',
    version: 1,
    exportedAt: new Date().toISOString(),
    sourceAgent,
    memories: memories.map((memory) => ({ ...memory })),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function assertString(value: unknown, message: string): asserts value is string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(message);
  }
}

function normalizeMemory(value: unknown): AgentMemory {
  if (!isRecord(value)) {
    throw new Error('Invalid memory item');
  }
  assertString(value.title, 'Invalid memory item title');
  assertString(value.content, 'Invalid memory item content');

  return {
    id: typeof value.id === 'string' ? value.id : '',
    title: value.title,
    content: value.content,
    memoryType: typeof value.memoryType === 'string' && value.memoryType ? value.memoryType : 'note',
    importance: typeof value.importance === 'number' ? value.importance : 5,
    source: typeof value.source === 'string' ? value.source : 'import',
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : '',
  };
}

export function parseMemoryAssetPackage(value: unknown): MemoryAssetPackage {
  if (!isRecord(value) || value.kind !== 'lobster.memory-package' || value.version !== 1 || !Array.isArray(value.memories)) {
    throw new Error('Invalid memory package');
  }

  const sourceAgent = isRecord(value.sourceAgent) ? {
    agentId: typeof value.sourceAgent.agentId === 'string' ? value.sourceAgent.agentId : undefined,
    agentName: typeof value.sourceAgent.agentName === 'string' ? value.sourceAgent.agentName : undefined,
  } : undefined;

  return {
    kind: 'lobster.memory-package',
    version: 1,
    exportedAt: typeof value.exportedAt === 'string' ? value.exportedAt : '',
    sourceAgent,
    memories: value.memories.map(normalizeMemory),
  };
}

export function formatMemoryPrompt(memory: Pick<AgentMemory, 'title' | 'content' | 'memoryType' | 'importance' | 'source' | 'createdAt'>): string {
  return [
    '## 长期记忆',
    `标题：${memory.title}`,
    `类型：${memory.memoryType || 'note'}`,
    `重要度：${memory.importance ?? 5}`,
    memory.source ? `来源：${memory.source}` : '',
    memory.createdAt ? `记录时间：${memory.createdAt}` : '',
    '',
    memory.content,
  ].filter(Boolean).join('\n');
}

export function buildSkillAssetPackage(skill: SkillConfig): SkillAssetPackage {
  return {
    kind: 'lobster.skill-package',
    version: 1,
    exportedAt: new Date().toISOString(),
    skill: {
      ...skill,
      files: skill.files.map((file) => ({ ...file })),
    },
  };
}

function normalizeSkillFile(value: unknown): SkillFile {
  if (!isRecord(value)) {
    throw new Error('Invalid skill file');
  }
  const path = typeof value.path === 'string' && value.path.trim()
    ? value.path
    : typeof value.name === 'string'
      ? value.name
      : '';
  assertString(path, 'Invalid skill file path');

  return {
    id: typeof value.id === 'string' ? value.id : undefined,
    parentId: typeof value.parentId === 'string' ? value.parentId : undefined,
    nodeType: typeof value.nodeType === 'string' ? value.nodeType : 'file',
    name: path,
    path,
    language: typeof value.language === 'string' && value.language ? value.language : 'text',
    content: typeof value.content === 'string' ? value.content : '',
    sortOrder: typeof value.sortOrder === 'number' ? value.sortOrder : undefined,
  };
}

export function parseSkillAssetPackage(value: unknown): SkillAssetPackage {
  if (!isRecord(value) || value.kind !== 'lobster.skill-package' || value.version !== 1 || !isRecord(value.skill)) {
    throw new Error('Invalid skill package');
  }
  assertString(value.skill.name, 'Invalid skill package name');
  if (!Array.isArray(value.skill.files) || value.skill.files.length === 0) {
    throw new Error('Invalid skill package files');
  }

  return {
    kind: 'lobster.skill-package',
    version: 1,
    exportedAt: typeof value.exportedAt === 'string' ? value.exportedAt : '',
    skill: {
      id: typeof value.skill.id === 'string' ? value.skill.id : '',
      name: value.skill.name,
      description: typeof value.skill.description === 'string' ? value.skill.description : '',
      icon: typeof value.skill.icon === 'string' ? value.skill.icon : '',
      version: typeof value.skill.version === 'string' ? value.skill.version : '1.0.0',
      visibility: typeof value.skill.visibility === 'string' ? value.skill.visibility : 'private',
      publishStatus: typeof value.skill.publishStatus === 'string' ? value.skill.publishStatus : 'draft',
      runtimeEnvironments: Array.isArray(value.skill.runtimeEnvironments) ? value.skill.runtimeEnvironments.filter((item): item is string => typeof item === 'string') : [],
      coreCapabilities: Array.isArray(value.skill.coreCapabilities) ? value.skill.coreCapabilities.filter((item): item is string => typeof item === 'string') : [],
      files: value.skill.files.map(normalizeSkillFile),
    },
  };
}
