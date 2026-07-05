import test from 'node:test';
import assert from 'node:assert/strict';
import { removeAgentById } from './repository';
import { Agent } from './types';

test('removes a deleted agent from repository list', () => {
  const agents = [
    { id: 'agent-1', name: 'Keep' },
    { id: 'agent-2', name: 'Delete' },
  ] as Agent[];

  const nextAgents = removeAgentById(agents, 'agent-2');

  assert.deepEqual(nextAgents.map((agent) => agent.id), ['agent-1']);
});
