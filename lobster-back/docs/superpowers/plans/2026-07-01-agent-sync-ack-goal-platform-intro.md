# Agent Sync Ack Goal Platform Intro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 验证并修复 Agent 同步后 ack 状态无效、AI 自同步误触发待 ack、目标编辑体验不清晰的问题，并输出可用于宣传的 Lobster 平台功能介绍。

**Architecture:** 后端把“平台给 Agent 的配置变更”和“Agent 自己向平台同步状态”区分开：只有用户/平台侧修改才创建 pending `config_changed`，Agent 自同步只更新自身状态和目标进度。前端确认目标创建、编辑、步骤维护入口可用，并补充同步说明文案；平台介绍文案独立沉淀，不改变运行逻辑。

**Tech Stack:** Spring Boot + MyBatis-Plus + JUnit 5 + Mockito；Vite + React + TypeScript；公开文档为 Markdown。

## Global Constraints

- 不引入新依赖。
- 保持现有 API 路径兼容：`/api/ai/agents/{id}/sync`、`/api/ai/agents/{id}/events`、`/api/ai/events/{eventId}/ack`、`/api/agents/{agentId}/goals/{goalId}`。
- `sync.skills` 仍只是 Agent 自报展示快照，不替代 Skill Package。
- 目标更新优先复用 config 返回的 `goals[].id`。
- 只有用户/平台侧配置变更需要 Agent 轮询并 ack；AI 自己同步上来的状态不应制造“等待自己 ack 自己”的 pending 事件。
- 计划完成后第二步先验证现状，不直接改代码；第三步再做优化场景和宣传介绍输出。

---

## File Structure

- Backend validation and behavior:
  - Modify: `lobster-back/src/main/java/cn/xcd/lobster/service/impl/AgentSyncServiceImpl.java`
  - Test: `lobster-back/src/test/java/cn/xcd/lobster/service/impl/AgentSyncServiceImplPermissionTest.java`
- Frontend validation and UX:
  - Inspect/possibly modify: `lobster-front/src/pages/agent/Detail/components/GoalList.tsx`
  - Inspect/possibly modify: `lobster-front/src/pages/agent/Detail/components/IdentityCard.tsx`
  - Inspect/possibly modify: `lobster-front/src/pages/agent/service.ts`
  - Inspect/possibly modify: `lobster-front/src/pages/agent/types.ts`
- Public docs and promotional copy:
  - Modify: `lobster-front/public/docs/ai-agent-api.md`
  - Create: `lobster-front/docs/platform-introduction.md`

---

### Task 1: Verify Current Problems

**Files:**
- Read: `lobster-back/src/main/java/cn/xcd/lobster/service/impl/AgentSyncServiceImpl.java`
- Read: `lobster-back/src/test/java/cn/xcd/lobster/service/impl/AgentSyncServiceImplPermissionTest.java`
- Read: `lobster-front/src/pages/agent/Detail/components/GoalList.tsx`
- Read: `lobster-front/src/pages/agent/Detail/components/IdentityCard.tsx`
- Read: `lobster-front/public/docs/ai-agent-api.md`

**Interfaces:**
- Consumes: existing code only.
- Produces: verification notes with exact issue status: `ack self-sync issue`, `goal edit issue`, `sync guidance issue`.

- [ ] **Step 1: Verify AI goal sync currently creates a pending config event**

Check `AgentSyncServiceImpl#createGoalForAgent`. Confirm whether this line exists after `agentMapper.updateById(agent)`:

```java
createConfigChangedEvent(agent, created ? "goal_created_by_agent" : "goal_updated_by_agent", "{\"goalId\":\"" + goal.getId() + "\"}");
```

Expected current finding: issue exists. AI-side goal create/update creates pending `config_changed`, so the Agent can be asked to ack an event caused by its own sync.

- [ ] **Step 2: Verify AI memory deletion and goal deletion behavior**

Check `deleteMemoryByToken` and `deleteGoalByToken`. Confirm whether they call:

```java
createConfigChangedEvent(agent, "memory_deleted_by_agent", "{\"memoryId\":\"" + memoryId + "\"}");
createConfigChangedEvent(agent, "goal_deleted_by_agent", "{\"goalId\":\"" + goalId + "\"}");
```

Expected current finding: issue exists if these are still present. Agent-side cleanup should not create pending config events for the same Agent unless product explicitly needs another runtime to re-pull.

- [ ] **Step 3: Verify frontend goal editing exists and whether it is discoverable**

Check `GoalList.tsx` for these props and API calls:

```tsx
onUpdateGoal: (goalId: string, data: AgentGoalCreateRequest) => Promise<void>;
await onUpdateGoal(selectedGoal.id, { ... });
```

Expected current finding: edit support likely exists in code. If users still perceive “只能删除新增”, the problem is discoverability/copy/interaction feedback, not missing backend endpoint.

- [ ] **Step 4: Verify public manual currently says AI deletion creates pending config events**

Search `public/docs/ai-agent-api.md` for:

```text
删除后生成 pending 的 `config_changed` 事件
删除后仍会产生 `config_changed`
```

Expected current finding: docs need update to reflect new semantics after fix.

- [ ] **Step 5: Run targeted verification command**

Run from `lobster-back`:

```bash
mvn -Dtest=AgentSyncServiceImplPermissionTest test
```

Expected before implementation: existing tests pass, but they encode the wrong behavior for by-agent delete events and do not test the no-self-ack requirement for goal sync.

---

### Task 2: Backend Ack Semantics

**Files:**
- Modify: `lobster-back/src/main/java/cn/xcd/lobster/service/impl/AgentSyncServiceImpl.java`
- Test: `lobster-back/src/test/java/cn/xcd/lobster/service/impl/AgentSyncServiceImplPermissionTest.java`

**Interfaces:**
- Consumes: `syncByToken(AgentToken token, Long agentId, AiAgentSyncRequest request)`.
- Produces: Agent-side sync/write/delete no longer creates pending `agent_config_event`; user/platform-side methods in `AgentServiceImpl` still create pending events.

- [ ] **Step 1: Write failing test for AI goal update not creating an ack event**

Add this test to `AgentSyncServiceImplPermissionTest`:

```java
@Test
void agentSyncUpdatesGoalWithoutCreatingSelfAckEvent() {
    AgentMapper agentMapper = mock(AgentMapper.class);
    AgentSkillMapper agentSkillMapper = mock(AgentSkillMapper.class);
    AgentMemoryMapper agentMemoryMapper = mock(AgentMemoryMapper.class);
    AgentGoalMapper agentGoalMapper = mock(AgentGoalMapper.class);
    AgentTokenMapper agentTokenMapper = mock(AgentTokenMapper.class);
    AgentSkillMountMapper agentSkillMountMapper = mock(AgentSkillMountMapper.class);
    SkillPackageMapper skillPackageMapper = mock(SkillPackageMapper.class);
    SkillFileMapper skillFileMapper = mock(SkillFileMapper.class);
    AgentConfigEventMapper agentConfigEventMapper = mock(AgentConfigEventMapper.class);

    AgentSyncServiceImpl service = new AgentSyncServiceImpl(
            agentMapper,
            agentSkillMapper,
            agentMemoryMapper,
            agentGoalMapper,
            agentTokenMapper,
            agentSkillMountMapper,
            skillPackageMapper,
            skillFileMapper,
            agentConfigEventMapper,
            mock(AgentSkillMountService.class)
    );

    Agent agent = new Agent();
    agent.setId(10L);
    agent.setOwnerId(1L);
    agent.setName("Goal Agent");
    agent.setCode("goal-agent");
    agent.setDescription("Updates goals");
    agent.setRole("研发专家");
    agent.setSkillCount(0);
    agent.setMemoryCount(0);
    agent.setGoalCount(1);
    agent.setAvatar("");
    agent.setBaseModel("Claude 3");
    agent.setStatus("active");
    agent.setAssociationStatus("bound");
    agent.setCreateTime(LocalDateTime.now());
    agent.setUpdateTime(LocalDateTime.now());

    AgentGoal existing = new AgentGoal();
    existing.setId(40L);
    existing.setAgentId(10L);
    existing.setTitle("Ship goals");
    existing.setDescription("Existing goal");
    existing.setGoalStatus("running");
    existing.setPriority(5);
    existing.setExtJson("{\"source\":\"platform\"}");
    existing.setCreateTime(LocalDateTime.now());

    AgentToken token = new AgentToken();
    token.setOwnerId(1L);
    token.setAgentId(10L);
    token.setPermissionJson("{\"agentSync\":true,\"configRead\":true,\"goalRead\":true,\"goalWrite\":true}");

    when(agentMapper.selectOne(any(Wrapper.class))).thenReturn(agent);
    when(agentTokenMapper.selectCount(any(Wrapper.class))).thenReturn(1L);
    when(agentSkillMountMapper.selectCount(any(Wrapper.class))).thenReturn(0L);
    when(agentSkillMapper.selectList(any(Wrapper.class))).thenReturn(List.of());
    when(agentSkillMountMapper.selectList(any(Wrapper.class))).thenReturn(List.of());
    when(agentMemoryMapper.selectList(any(Wrapper.class))).thenReturn(List.of());
    when(agentGoalMapper.selectList(any(Wrapper.class))).thenReturn(List.of(existing));
    when(agentGoalMapper.selectOne(any(Wrapper.class))).thenReturn(existing);

    AgentDetailVO config = service.tokenConfig(token, 10L);

    AgentGoalRequest goalRequest = new AgentGoalRequest();
    goalRequest.setId("40");
    goalRequest.setTitle("Ship goals");
    goalRequest.setDescription("Updated by agent");
    goalRequest.setGoalStatus("running");
    goalRequest.setPriority(7);
    AiAgentSyncRequest request = new AiAgentSyncRequest();
    request.setBaseRevision(config.getSyncRevision());
    request.setConfirmSync(true);
    request.setGoals(List.of(goalRequest));

    service.syncByToken(token, 10L, request);

    verify(agentGoalMapper).updateById(existing);
    verify(agentConfigEventMapper, never()).insert(any(AgentConfigEvent.class));
}
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
mvn -Dtest=AgentSyncServiceImplPermissionTest#agentSyncUpdatesGoalWithoutCreatingSelfAckEvent test
```

Expected: FAIL because `createGoalForAgent` inserts an `AgentConfigEvent`.

- [ ] **Step 3: Remove self-generated config events from AI-side sync**

In `AgentSyncServiceImpl#createGoalForAgent`, remove:

```java
createConfigChangedEvent(agent, created ? "goal_created_by_agent" : "goal_updated_by_agent", "{\"goalId\":\"" + goal.getId() + "\"}");
```

Keep `AgentServiceImpl#createGoal`, `AgentServiceImpl#updateGoal`, and `AgentServiceImpl#deleteGoal` unchanged because those are user/platform-side edits and should still notify Agent.

- [ ] **Step 4: Update deletion tests to encode no self ack**

Change `agentTokenDeletesMemoryWithMemoryWritePermission` and `agentTokenDeletesGoalWithGoalWritePermission` expected verification from:

```java
ArgumentCaptor<AgentConfigEvent> eventCaptor = ArgumentCaptor.forClass(AgentConfigEvent.class);
verify(agentConfigEventMapper).insert(eventCaptor.capture());
assertEquals("config_changed", eventCaptor.getValue().getEventType());
assertEquals("pending", eventCaptor.getValue().getEventStatus());
assertNotNull(eventCaptor.getValue().getPayloadJson());
```

to:

```java
verify(agentConfigEventMapper, never()).insert(any(AgentConfigEvent.class));
```

- [ ] **Step 5: Remove self-generated events from AI-side deletes**

In `AgentSyncServiceImpl#deleteMemoryByToken`, remove:

```java
createConfigChangedEvent(agent, "memory_deleted_by_agent", "{\"memoryId\":\"" + memoryId + "\"}");
```

In `AgentSyncServiceImpl#deleteGoalByToken`, remove:

```java
createConfigChangedEvent(agent, "goal_deleted_by_agent", "{\"goalId\":\"" + goalId + "\"}");
```

- [ ] **Step 6: Run backend targeted tests**

Run:

```bash
mvn -Dtest=AgentSyncServiceImplPermissionTest test
```

Expected: PASS.

---

### Task 3: Frontend Goal Edit Discoverability

**Files:**
- Modify if needed: `lobster-front/src/pages/agent/Detail/components/GoalList.tsx`
- Read: `lobster-front/src/pages/agent/Detail/index.tsx`
- Read: `lobster-front/src/pages/agent/service.ts`

**Interfaces:**
- Consumes: `updateAgentGoalApi(agentId, goalId, data)`.
- Produces: visible and unambiguous target edit flow: selecting a goal opens editable detail, save updates in place, steps are editable.

- [ ] **Step 1: Verify page wires update handler**

Check `Detail/index.tsx` for:

```tsx
<GoalList
  goals={goals}
  onCreateGoal={handleCreateGoal}
  onUpdateGoal={handleUpdateGoal}
  onDeleteGoal={handleDeleteGoal}
/>
```

Expected: if `onUpdateGoal` is not wired, wire it to `updateAgentGoalApi` and reload goals/profile after success.

- [ ] **Step 2: If edit is wired, improve discoverability copy only**

In `GoalList.tsx`, add an edit affordance to each goal card. Keep the card click behavior, but show a small icon and text:

```tsx
<span className="text-[10px] font-black text-[#888] group-hover:text-[#1A1A1A]">点击编辑</span>
```

Place it near the status label so users understand it is not read-only.

- [ ] **Step 3: Ensure save action gives clear feedback**

After successful `saveSelectedGoal`, keep selected goal open and clear error:

```tsx
await onUpdateGoal(selectedGoal.id, { ... });
setError('');
```

If parent reload temporarily changes selected data, preserve `selectedGoalId`.

- [ ] **Step 4: Run frontend build**

Run from `lobster-front`:

```bash
npm run build
```

Expected: PASS.

---

### Task 4: Sync Manual and UI Copy

**Files:**
- Modify: `lobster-front/public/docs/ai-agent-api.md`
- Modify if needed: `lobster-front/src/pages/agent/Detail/components/IdentityCard.tsx`

**Interfaces:**
- Consumes: backend event semantics from Task 2.
- Produces: docs and UI clearly state `ack` is for platform/user-side config changes, not AI self-sync completion.

- [ ] **Step 1: Update docs summary bullets**

Replace AI delete descriptions:

```text
删除后生成 pending 的 `config_changed` 事件。
```

with:

```text
删除后不会生成给当前 Agent 自己 ack 的 `config_changed` 事件；这是 Agent 自己提交的状态清理。
```

- [ ] **Step 2: Update recommended flow**

Add this paragraph after the sync step:

```markdown
AI 通过 `/sync` 上传自己的状态、记忆、目标进度后，不需要再等待或确认由这次上传产生的 ack。`ack` 只用于处理平台侧或人类用户修改造成的 pending `config_changed`：例如用户在前端挂载/卸载 Skill、编辑 Agent 身份、编辑记忆或目标。
```

- [ ] **Step 3: Update polling section**

Change:

```markdown
Agent 确认自己已经学习 `skillPackages[].files` 后再 ack
```

to:

```markdown
Agent 确认自己已经应用平台侧配置变更后再 ack；不要把自己的 `/sync` 上传结果当成需要 ack 的配置事件。
```

- [ ] **Step 4: Update IdentityCard sync help if needed**

Keep this meaning:

```tsx
help: '平台配置已变更，等待 Agent 轮询 events 后拉取 config 并 ack。'
```

If changing, use:

```tsx
help: '人类用户或平台配置已变更，等待 Agent 轮询 events、拉取 config、应用后 ack。'
```

- [ ] **Step 5: Run docs grep verification**

Run:

```bash
rg -n "by_agent|自己.*ack|删除后生成 pending|删除后仍会产生|sync.*ack" public/docs/ai-agent-api.md
```

Expected: no stale statement says AI self-sync/delete creates a pending event that the same Agent must ack.

---

### Task 5: Platform Optimization Scenarios and Promotional Introduction

**Files:**
- Create: `lobster-front/docs/platform-introduction.md`

**Interfaces:**
- Consumes: current product capabilities from README, public manual, Agent pages, Skill editor/market, backup import/export.
- Produces: a complete Chinese promotional feature introduction and next-step optimization scenario list.

- [ ] **Step 1: Create platform introduction doc**

Create `lobster-front/docs/platform-introduction.md` with this structure:

```markdown
# Lobster 平台功能介绍

## 一句话定位

Lobster 是面向 AI Agent 的资产管理、技能同步、长期记忆、目标协作和迁移备份平台，让不同 Agent 能以统一方式沉淀能力、读取平台配置，并在用户可控的范围内持续演进。

## 核心能力

### Agent 管理

- 创建和管理多个 Agent 身份，维护名称、角色、描述、模型偏好和头像。
- 通过 Agent Token 让外部 AI 自注册、自同步、自拉取配置。
- 在 Agent 详情页集中查看技能、记忆、目标、同步状态和平台关联状态。

### Skill 能力库

- 支持创建 Skill Package，维护 `SKILL.md`、`references/`、`examples/` 等完整文件树。
- Skill 可以设为私有、公开、草稿、发布或进入审核流程。
- Agent 挂载 Skill 后，外部 AI 可通过 config 读取完整文件树，而不是只拿到展示快照。

### 记忆与目标

- 为 Agent 沉淀长期记忆，按事实、偏好、流程、经验等类型管理。
- 为 Agent 维护执行目标、目标状态、优先级、截止时间和任务步骤。
- 支持用户在前端编辑目标，也支持 AI 通过安全同步协议更新目标进度。

### 同步与 ack

- 平台侧配置变更会生成 pending 事件，Agent 轮询 events、拉取 config、应用后 ack。
- AI 自己上传状态不会制造“自己确认自己”的 ack 循环。
- 同步写入前要求拉取线上配置并携带 `baseRevision`，降低重复、误覆盖和并发冲突。

### 迁移与备份

- 支持 Agent 资产 JSON/ZIP 导出导入。
- 备份包含 Agent 身份、技能挂载、Skill 文件树、记忆和目标。
- 适合跨环境迁移、团队共享、回滚和长期归档。

## 典型使用场景

### 研发 Agent 团队

把项目规范、调试流程、代码审查标准沉淀成 Skill；把长期项目事实沉淀成记忆；把阶段性开发目标拆成可同步的执行步骤。

### 企业内部 AI 能力中台

管理员统一发布审核后的 Skill，团队成员按需挂载到不同 Agent；每个 Agent 通过 Token 读取自己的配置，权限边界清晰。

### 多平台 Agent 迁移

将一个 Agent 的技能、记忆、目标导出为备份，再导入到新环境，避免每个平台从零配置。

### 人机协作执行计划

用户在平台创建或调整目标，Agent 轮询到配置变更后执行；Agent 再通过 sync 回传进度和步骤状态。

## 下一步优化场景

1. 同步预览 UI：把 AI 计划写入的 Skill、记忆、目标差异在前端可视化展示，用户选择同步范围后再提交。
2. 目标小任务工作台：把目标步骤提升为更明显的任务列表，支持状态筛选、负责人、历史记录和执行日志。
3. 配置变更审计：展示每一次 pending event 的来源、原因、影响范围、ack 时间和处理 Agent。
4. Skill 版本治理：增加版本比较、变更日志、回滚和按 Agent 批量升级。
5. Agent 运行健康度：基于最近轮询时间、pending 时长、同步失败次数展示健康状态。
6. 宣传落地页：用“Agent 资产管理平台”作为第一屏定位，展示同步闭环、技能库、记忆目标、迁移备份四个核心场景。

## 对外宣传短文案

Lobster 帮团队把 AI Agent 从一次性对话变成可管理、可迁移、可协作的数字资产。你可以为每个 Agent 配置专属技能、长期记忆和执行目标；Agent 通过 Token 安全读取平台配置，应用后确认变更，并把执行进度同步回平台。无论是研发助手、知识库助手，还是企业内部的多 Agent 协作网络，Lobster 都提供统一的技能库、目标管理、同步协议和备份迁移能力。
```

- [ ] **Step 2: Run markdown smoke check**

Run:

```bash
Get-Content docs\platform-introduction.md
```

Expected: file exists and contains no unfinished placeholder markers.

---

### Task 6: Final Verification

**Files:**
- Read: modified files from Tasks 2-5.

**Interfaces:**
- Consumes: implemented code and docs.
- Produces: final verification result.

- [ ] **Step 1: Run backend targeted tests**

Run from `lobster-back`:

```bash
mvn -Dtest=AgentSyncServiceImplPermissionTest test
```

Expected: PASS.

- [ ] **Step 2: Run backend compile**

Run from `lobster-back`:

```bash
mvn -DskipTests compile
```

Expected: PASS.

- [ ] **Step 3: Run frontend build**

Run from `lobster-front`:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Summarize results**

Report:

```text
问题验证：
- AI 自同步误触发 ack：原来存在，已修复/或无需修复，依据是...
- 目标只能删新增：原来是入口不清晰/或缺少 wiring，已修复/或确认可用，依据是...

改动文件：
- ...

验证命令：
- ...

平台介绍：
- lobster-front/docs/platform-introduction.md
```

---

## Self-Review

- Spec coverage: 覆盖验证、ack 语义、目标编辑、同步手册、优化场景、宣传介绍、最终编译测试。
- Placeholder scan: 本计划不包含未完成占位标记或未定义步骤。
- Type consistency: 使用现有 `AgentGoalRequest`、`AiAgentSyncRequest`、`AgentGoalCreateRequest`、`AgentConfigEvent`、`AgentSyncServiceImpl` 命名，和当前代码一致。
