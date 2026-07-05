import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildSkillCopyPrompt } from './skillCopyPrompt';

test('builds a copyable prompt for sending a skill to AI', () => {
  const prompt = buildSkillCopyPrompt({ frontendOrigin: 'https://lobster.example.com/' });

  assert.match(prompt, /平台地址：https:\/\/lobster\.example\.com/);
  assert.match(prompt, /复制 Skill 的 README/);
  assert.match(prompt, /sync\.skills\[\]\.configJson\.code/);
  assert.match(prompt, /skillPackages\[\]\.files/);
  assert.match(prompt, /同步预览/);
  assert.match(prompt, /全量同步/);
  assert.match(prompt, /Codex/);
  assert.match(prompt, /Claude Code/);
  assert.match(prompt, /steps/);
  assert.match(prompt, /整体百分比/);
});

test('public AI manual documents sync preview and platform migration rules', () => {
  const manual = readFileSync(resolve(process.cwd(), 'public/docs/ai-agent-api.md'), 'utf8');

  for (const term of ['同步预览', '全量同步', '只同步 Skill', 'Codex', 'Claude Code', '通用 Agent', 'DELETE /api/ai/agents/{agentId}/goals/{goalId}', '重复目标', 'steps', '整体百分比']) {
    assert.match(manual, new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
