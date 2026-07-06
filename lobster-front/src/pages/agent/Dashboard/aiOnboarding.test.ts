import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAiAgentOnboardingPrompt } from './aiOnboarding';

test('builds a concrete AI onboarding prompt from the frontend origin', () => {
  const prompt = buildAiAgentOnboardingPrompt({
    frontendOrigin: 'https://lobster.example.com/',
    agentName: 'CodeReviewer',
    role: '研发专家',
  });

  assert.match(prompt, /https:\/\/lobster\.example\.com\/docs\/ai-agent-api\.md/);
  assert.match(prompt, /LOBSTER_API_BASE_URL=https:\/\/lobster\.example\.com/);
  assert.match(prompt, /GET \$LOBSTER_API_BASE_URL\/api\/ai\/token\/me/);
  assert.match(prompt, /GET \$LOBSTER_API_BASE_URL\/api\/ai\/agents\/\{agentId\}\/config\?brief=true/);
  assert.match(prompt, /platformSkillCount/);
  assert.match(prompt, /mountedSkillPackageCount/);
  assert.match(prompt, /baseRevision/);
  assert.match(prompt, /confirmSync/);
  assert.match(prompt, /DELETE \$LOBSTER_API_BASE_URL\/api\/ai\/agents\/\{agentId\}\/goals\/\{goalId\}/);
  assert.match(prompt, /重复目标/);
  assert.match(prompt, /steps/);
  assert.match(prompt, /整体百分比/);
  assert.match(prompt, /Authorization: Bearer \$LOBSTER_AGENT_TOKEN/);
  assert.match(prompt, /预留 Token/);
  assert.doesNotMatch(prompt, /伪代码|pseudo/i);
  assert.doesNotMatch(prompt, /localhost/i);
});
