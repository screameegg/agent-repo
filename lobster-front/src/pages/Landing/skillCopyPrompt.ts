export interface SkillCopyPromptOptions {
  frontendOrigin: string;
}

const normalizeOrigin = (origin: string) => origin.trim().replace(/\/+$/, '');

export function buildSkillCopyPrompt({ frontendOrigin }: SkillCopyPromptOptions) {
  const origin = normalizeOrigin(frontendOrigin);
  const baseUrl = origin || '<知栈前端站点地址>';

  return [
    '请把下面这个知栈 Skill 接入你的 AI 工作流。',
    '',
    `平台地址：${baseUrl}`,
    '目标：读取 Skill 文件树，理解说明、输入输出和调用方式，然后在合适任务中使用它。',
    '',
    '操作步骤：',
    '1. 打开知栈技能详情或技能编辑器，复制 Skill 的 README / 配置 / 文件内容。',
    '2. 优先阅读 SKILL.md、README.md、manifest/config 这类说明文件。',
    '3. 如果需要和 Agent 同步，把 skill code 写入 sync.skills[].configJson.code。',
    '4. 提交同步前先生成同步预览，展示将新增、更新、删除、跳过的数据，并让用户选择全量同步、只同步 Skill、只同步记忆、只同步目标或取消；更新已有目标要复用 goals[].id，长任务进展写入同一目标的 steps，不维护整体百分比，删除重复目标调用 DELETE /api/ai/agents/{agentId}/goals/{goalId}。',
    '5. 迁移到 Codex、Claude Code 或通用 Agent 时按平台能力适配；能安全读取文件树和 config 的就写程序生成预览，无法确认覆盖风险时先询问用户。',
    '6. 如果平台已挂载该 Skill，调用 Agent config 接口读取 skillPackages[].files 学习完整能力。',
    '7. 执行任务时只使用 Skill 中明确声明的能力、参数和约束。',
    '',
    '注意：不要猜测不存在的工具；缺少 Token、权限或文件时先向用户说明需要补齐。'
  ].join('\n');
}
