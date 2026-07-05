import { AgentToken } from '../../agent/types';

export type TokenPermissionKey =
  | 'skillRead'
  | 'skillWrite'
  | 'memoryRead'
  | 'memoryWrite'
  | 'goalRead'
  | 'goalWrite'
  | 'agentRegister'
  | 'agentSync'
  | 'configRead'
  | 'backupExport';

export type TokenPermissions = Record<TokenPermissionKey, boolean>;

export const defaultFullSyncPermissions: TokenPermissions = {
  skillRead: true,
  skillWrite: true,
  memoryRead: true,
  memoryWrite: true,
  goalRead: true,
  goalWrite: true,
  agentRegister: true,
  agentSync: true,
  configRead: true,
  backupExport: false,
};

export const defaultReadOnlyPullPermissions: TokenPermissions = {
  skillRead: true,
  skillWrite: false,
  memoryRead: true,
  memoryWrite: false,
  goalRead: true,
  goalWrite: false,
  agentRegister: false,
  agentSync: false,
  configRead: true,
  backupExport: false,
};

export function permissionsFromToken(token: AgentToken): TokenPermissions {
  return {
    skillRead: token.skillRead ?? false,
    skillWrite: token.skillWrite ?? false,
    memoryRead: token.memoryRead ?? false,
    memoryWrite: token.memoryWrite ?? false,
    goalRead: token.goalRead ?? false,
    goalWrite: token.goalWrite ?? false,
    agentRegister: token.agentRegister,
    agentSync: token.agentSync,
    configRead: token.configRead,
    backupExport: token.backupExport,
  };
}
