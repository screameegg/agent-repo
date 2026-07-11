import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const dashboardSource = readFileSync('src/pages/agent/Dashboard/index.tsx', 'utf8');
const aiAgentManual = readFileSync('public/docs/ai-agent-api.md', 'utf8');

test('create agent form labels the free text input as description', () => {
  assert.match(dashboardSource, /Agent 描述/);
  assert.match(dashboardSource, /描述该 Agent 的核心职责和边界/);
  assert.doesNotMatch(dashboardSource, /初始指令 \(System Prompt\)/);
});

test('ai manual tells local agents to upload the local skill file tree directly', () => {
  assert.match(aiAgentManual, /本地 Agent 可以直接上传本地 Skill 目录的完整文件树/);
  assert.match(aiAgentManual, /不要要求用户手动拆分/);
});
