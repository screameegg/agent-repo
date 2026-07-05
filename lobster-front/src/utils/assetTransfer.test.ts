import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMemoryAssetPackage,
  buildSkillAssetPackage,
  formatMemoryPrompt,
  parseMemoryAssetPackage,
  parseSkillAssetPackage,
} from './assetTransfer';
import { AgentMemory } from '../pages/agent/types';
import { SkillConfig } from '../pages/skill/Editor/types';
import { buildSkillZipPackage, parseSkillZipPackage } from './skillZipTransfer';

const memory: AgentMemory = {
  id: 'm1',
  title: '项目背景',
  content: '后端在 lobster-back，前端在 lobster-front。',
  memoryType: 'fact',
  importance: 9,
  source: 'manual',
  createdAt: '2026-07-03T10:00:00',
};

test('builds and parses a memory asset package', () => {
  const pkg = buildMemoryAssetPackage([memory], { agentId: 'a1', agentName: '研发助手' });

  assert.equal(pkg.kind, 'lobster.memory-package');
  assert.equal(pkg.version, 1);
  assert.equal(pkg.sourceAgent?.agentName, '研发助手');
  assert.equal(parseMemoryAssetPackage(pkg).memories[0].title, '项目背景');
});

test('rejects invalid memory packages', () => {
  assert.throws(() => parseMemoryAssetPackage({ kind: 'bad', memories: [] }), /memory package/i);
  assert.throws(() => parseMemoryAssetPackage({ kind: 'lobster.memory-package', version: 1, memories: [{ title: '', content: '' }] }), /memory item/i);
});

test('formats memory as a reusable prompt block', () => {
  const prompt = formatMemoryPrompt(memory);

  assert.match(prompt, /长期记忆/);
  assert.match(prompt, /项目背景/);
  assert.match(prompt, /后端在 lobster-back/);
  assert.match(prompt, /重要度：9/);
});

test('builds and parses a skill asset package', () => {
  const skill: SkillConfig = {
    id: 's1',
    name: 'Repo Skill',
    description: 'Read repo',
    version: '1.0.0',
    files: [{ name: 'SKILL.md', path: 'SKILL.md', language: 'markdown', content: '# Skill' }],
  };

  const pkg = buildSkillAssetPackage(skill);

  assert.equal(pkg.kind, 'lobster.skill-package');
  assert.equal(pkg.version, 1);
  assert.equal(parseSkillAssetPackage(pkg).skill.files[0].path, 'SKILL.md');
});

test('rejects invalid skill packages', () => {
  assert.throws(() => parseSkillAssetPackage({ kind: 'lobster.skill-package', version: 1, skill: { name: '', files: [] } }), /skill package/i);
});
test('builds and parses a skill zip package with metadata and files', async () => {
  const skill: SkillConfig = {
    id: 's1',
    name: 'Repo Skill',
    description: 'Read repo',
    version: '1.0.0',
    runtimeEnvironments: ['codex'],
    coreCapabilities: ['repo'],
    files: [
      { name: 'SKILL.md', path: 'SKILL.md', language: 'markdown', content: '# Skill' },
      { name: 'workflow.md', path: 'workflows/workflow.md', language: 'markdown', content: '# Workflow' },
    ],
  };

  const zip = buildSkillZipPackage(skill);
  const pkg = await parseSkillZipPackage(zip);

  assert.equal(pkg.kind, 'lobster.skill-package');
  assert.equal(pkg.skill.name, 'Repo Skill');
  assert.deepEqual(pkg.skill.runtimeEnvironments, ['codex']);
  assert.equal(pkg.skill.files.length, 2);
  assert.equal(pkg.skill.files.find((file) => file.path === 'workflows/workflow.md')?.content, '# Workflow');
});
