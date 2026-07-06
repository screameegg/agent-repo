import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildSkillStarterFiles, DEFAULT_SKILL_FILES } from './defaultSkillTemplate';

const requiredSkillTerms = [
  'lobster-front',
  'lobster-back',
  'Skill Package',
  'skill_package',
  'skill_file',
  'npm run lint',
  'npm run build',
  'mvn test',
  '完整文件树',
];
const syncMigrationTerms = [
  '同步预览',
  '全量同步',
  '只同步 Skill',
  '只同步记忆',
  '只同步目标',
  'DELETE /api/ai/agents/{agentId}/goals/{goalId}',
  '重复目标',
  '整体百分比',
  'steps',
  '平台迁移策略',
  'Codex',
  'Claude Code',
  '通用 Agent',
  'config?brief=true',
  'GET /api/ai/agents/{agentId}/memories/{memoryId}',
  'GET /api/ai/skills/{idOrCode}',
];
test('default editor skill template teaches the Lobster project workflow', () => {
  const skillFile = DEFAULT_SKILL_FILES.find((file) => file.path === 'SKILL.md');
  const allContent = DEFAULT_SKILL_FILES.map((file) => file.content).join('\n');

  assert.ok(skillFile, 'SKILL.md should be present');
  for (const term of [...requiredSkillTerms, ...syncMigrationTerms]) {
    assert.match(allContent, new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
test('market seed repository skill is useful for Lobster agents', () => {
  const seedSql = readFileSync(
    resolve(process.cwd(), '../lobster-back/src/main/resources/db/skill_market_seed.sql'),
    'utf8',
  );

  for (const term of requiredSkillTerms) {
    assert.match(seedSql, new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
test('default editor skill template uses progressive disclosure files', () => {
  const filesByPath = new Map(DEFAULT_SKILL_FILES.map((file) => [file.path, file]));
  const expectedPaths = [
    'SKILL.md',
    'workflows/project-change.md',
    'workflows/skill-package-upload.md',
    'workflows/agent-sync-preview.md',
    'workflows/config-event-listening.md',
    'workflows/release-verification.md',
    'references/domain-rules.md',
    'references/api-endpoints.md',
    'references/troubleshooting.md',
    'checklists/lobster-checklist.md',
  ];

  assert.deepEqual([...filesByPath.keys()].sort(), expectedPaths.sort());

  const skillFile = filesByPath.get('SKILL.md');
  assert.ok(skillFile, 'SKILL.md should be present');
  assert.ok(skillFile.content.length < 2500, 'SKILL.md should stay concise and route to supporting files');
  assert.match(skillFile.content, /workflows\/config-event-listening\.md/);
  assert.doesNotMatch(skillFile.content, /## Common Failure Checks/);
  assert.doesNotMatch(skillFile.content, /## Verification Commands/);

  assert.match(filesByPath.get('workflows/config-event-listening.md')?.content || '', /events/);
  assert.match(filesByPath.get('workflows/config-event-listening.md')?.content || '', /ack/);
  assert.match(filesByPath.get('workflows/config-event-listening.md')?.content || '', /config\?brief=true/);
  assert.match(filesByPath.get('workflows/agent-sync-preview.md')?.content || '', /baseRevision/);
  assert.match(filesByPath.get('workflows/agent-sync-preview.md')?.content || '', /confirmSync=true/);
  assert.match(filesByPath.get('references/domain-rules.md')?.content || '', /完整文件树/);
  assert.match(filesByPath.get('references/troubleshooting.md')?.content || '', /Agent reads only `skills`/);
});
test('starter skill template creates a concise AI-readable file tree', () => {
  const files = buildSkillStarterFiles('网络抓取大师', '抓取网页并提取结构化信息。');
  const filesByPath = new Map(files.map((file) => [file.path, file]));

  assert.deepEqual(
    [...filesByPath.keys()].sort(),
    [
      'SKILL.md',
      'workflows/usage.md',
      'references/interface.md',
      'examples/request.md',
      'checklists/quality.md',
    ].sort(),
  );

  const skillFile = filesByPath.get('SKILL.md');
  assert.ok(skillFile);
  assert.match(skillFile.content, /name: 网络抓取大师/);
  assert.match(skillFile.content, /workflows\/usage\.md/);
  assert.ok(skillFile.content.length < 1600, 'starter SKILL.md should stay concise');
  assert.match(filesByPath.get('workflows/usage.md')?.content || '', /触发条件/);
  assert.match(filesByPath.get('references/interface.md')?.content || '', /输入/);
  assert.match(filesByPath.get('examples/request.md')?.content || '', /示例/);
  assert.match(filesByPath.get('checklists/quality.md')?.content || '', /验证/);
});
