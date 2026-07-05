import test from 'node:test';
import assert from 'node:assert/strict';
import {
  defaultReadOnlyPullPermissions,
  permissionsFromToken,
} from './tokenPermissions';
import { AgentToken } from '../../agent/types';

test('read-only pull preset enables config and read permissions without write permissions', () => {
  assert.equal(defaultReadOnlyPullPermissions.configRead, true);
  assert.equal(defaultReadOnlyPullPermissions.skillRead, true);
  assert.equal(defaultReadOnlyPullPermissions.skillWrite, false);
  assert.equal(defaultReadOnlyPullPermissions.memoryRead, true);
  assert.equal(defaultReadOnlyPullPermissions.memoryWrite, false);
  assert.equal(defaultReadOnlyPullPermissions.goalRead, true);
  assert.equal(defaultReadOnlyPullPermissions.goalWrite, false);
  assert.equal(defaultReadOnlyPullPermissions.agentSync, false);
  assert.equal(defaultReadOnlyPullPermissions.agentRegister, false);
});

test('permissionsFromToken does not infer read-write access from legacy permissions', () => {
  const token = {
    agentRegister: false,
    agentSync: true,
    configRead: true,
    backupExport: false,
  } as AgentToken;

  assert.equal(permissionsFromToken(token).skillRead, false);
  assert.equal(permissionsFromToken(token).skillWrite, false);
  assert.equal(permissionsFromToken(token).memoryRead, false);
  assert.equal(permissionsFromToken(token).memoryWrite, false);
  assert.equal(permissionsFromToken(token).goalRead, false);
  assert.equal(permissionsFromToken(token).goalWrite, false);
});
