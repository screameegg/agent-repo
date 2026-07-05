import test from 'node:test';
import assert from 'node:assert/strict';
import { copyableTokenKey } from './tokenClipboard';
import { AgentToken } from '../../agent/types';

test('uses the full key on the selected token when the plain token map is not populated yet', () => {
  const token = {
    id: 'token-1',
    key: 'lobster_full_token_value',
  } as AgentToken;

  assert.equal(copyableTokenKey(token, {}), 'lobster_full_token_value');
});

test('does not treat masked token prefixes as copyable full keys', () => {
  const token = {
    id: 'token-1',
    key: 'lobster_masked...',
  } as AgentToken;

  assert.equal(copyableTokenKey(token, {}), '');
});
