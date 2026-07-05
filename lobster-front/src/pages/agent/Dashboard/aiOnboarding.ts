export const AGENT_MANUAL_PATH = '/docs/ai-agent-api.md';

export interface AiAgentOnboardingOptions {
  frontendOrigin: string;
  agentName?: string;
  role?: string;
}

const normalizeOrigin = (origin: string) => origin.trim().replace(/\/+$/, '');

export const buildAgentManualUrl = (frontendOrigin: string) => {
  const origin = normalizeOrigin(frontendOrigin);
  return origin ? `${origin}${AGENT_MANUAL_PATH}` : AGENT_MANUAL_PATH;
};

export const buildAiAgentOnboardingPrompt = ({
  frontendOrigin,
  agentName,
  role,
}: AiAgentOnboardingOptions) => {
  const origin = normalizeOrigin(frontendOrigin);
  const manualUrl = buildAgentManualUrl(origin);
  const displayName = agentName?.trim() || '<Agent 名称>';
  const displayRole = role?.trim() || '<Agent 角色>';

  return [
    '请按知栈 AI Agent 接入流程完成对接。',
    '',
    `Agent 名称：${displayName}`,
    `Agent 角色：${displayRole}`,
    `接口手册下载地址：${manualUrl}`,
    '',
    '运行前设置环境变量：',
    `LOBSTER_API_BASE_URL=${origin || '<前端站点地址>'}`,
    'LOBSTER_AGENT_TOKEN=<预留 Token：在知栈前端「个人中心-访问令牌」创建后填入>',
    'LOBSTER_AGENT_ID=<注册成功后使用 data.agent.id 填入>',
    '',
    '对接步骤：',
    '1. 先读取接口手册下载地址，确认权限、字段和错误处理。',
    '2. 用 Agent Token 自检：GET $LOBSTER_API_BASE_URL/api/ai/token/me，Header 使用 Authorization: Bearer $LOBSTER_AGENT_TOKEN 或 X-Agent-Token: $LOBSTER_AGENT_TOKEN。',
    '3. 如果 token/me 返回的 agentId 为空，并且有 agentRegister 权限，调用 POST $LOBSTER_API_BASE_URL/api/ai/agents/register 注册当前 Agent。',
    '4. 如果需要让平台挂载你的技能，调用 POST $LOBSTER_API_BASE_URL/api/ai/skills 上传完整 Skill 文件树，并保持稳定 code。',
    '5. 同步技能快照、记忆或目标前，先调用 GET $LOBSTER_API_BASE_URL/api/ai/agents/{agentId}/config 拉取平台现有配置，读取 data.syncRevision，对比已有 skills、memories、goals 和 skillPackages。',
    '6. 调用 POST $LOBSTER_API_BASE_URL/api/ai/agents/{agentId}/sync 时，如果请求体包含 skills、memories 或 goals，必须带 baseRevision=data.syncRevision 且 confirmSync=true；更新已有目标要复用 config 返回的 goals[].id，长任务进展写入同一目标的 steps，不要维护整体百分比；需要自动挂载 Skill Package 时，在 sync.skills[].configJson 里带同一个 code。',
    '7. 如需删除过期或重复记忆，调用 DELETE $LOBSTER_API_BASE_URL/api/ai/agents/{agentId}/memories/{memoryId}，需要 memoryWrite 权限；如需删除过期或重复目标，调用 DELETE $LOBSTER_API_BASE_URL/api/ai/agents/{agentId}/goals/{goalId}，需要 goalWrite 权限。',
    '8. 周期性调用 GET $LOBSTER_API_BASE_URL/api/ai/agents/{agentId}/events 轮询 config_changed。',
    '9. 有 pending 事件时，调用 GET $LOBSTER_API_BASE_URL/api/ai/agents/{agentId}/config，并读取 skillPackages[].files 学习已挂载 Skill。',
    '10. 确认配置已应用后，再调用 POST $LOBSTER_API_BASE_URL/api/ai/events/{eventId}/ack。',
    '',
    '注意：生产部署由前端 nginx 提供同源 /docs/ai-agent-api.md 静态手册，并代理 /api 到后端；BASE_URL 使用当前前端站点 origin。',
  ].join('\n');
};
