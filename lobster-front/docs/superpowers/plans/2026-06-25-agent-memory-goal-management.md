# Agent Memory And Goal Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Agent memory deletion and goal lifecycle management with editable goal steps for human users and AI Agents.

**Architecture:** Backend exposes typed goal steps through DTO/VO fields while storing them in `agent_goal.ext_json.steps`. Login APIs update/delete goals directly; AI Token sync updates an existing goal when a goal id is supplied. Frontend adds service calls, typed progress helpers, memory delete controls, and a goal detail editor that saves the full normalized step list.

**Tech Stack:** Spring Boot 3.5, Java 17, MyBatis Plus, Jackson, React 18, TypeScript, Tailwind, Node `node:test`.

## Global Constraints

- Store goal steps in existing `agent_goal.ext_json`; do not create a new table.
- Preserve unknown fields in `ext_json` when updating steps.
- Step status values are `pending`, `running`, `completed`, and `failed`.
- Missing `steps` becomes an empty list.
- Missing step `id` is generated.
- Blank step titles are rejected for explicit create/update requests.
- Missing step status defaults to `pending`.
- Missing `sortOrder` is assigned by list order.
- Login goal update/delete and AI goal update must create pending `config_changed` events for bound Agents.
- The memory create form must label `memoryType` as `记忆分类` and `importance` as `重要等级`.

---

### Task 1: Backend Goal Step Contract

**Files:**
- Create: `lobster-back/src/main/java/cn/xcd/lobster/model/dto/AgentGoalStepRequest.java`
- Create: `lobster-back/src/main/java/cn/xcd/lobster/model/vo/AgentGoalStepVO.java`
- Modify: `lobster-back/src/main/java/cn/xcd/lobster/model/dto/AgentGoalRequest.java`
- Modify: `lobster-back/src/main/java/cn/xcd/lobster/model/vo/AgentGoalVO.java`
- Modify: `lobster-back/src/main/java/cn/xcd/lobster/service/impl/AgentServiceImpl.java`
- Modify: `lobster-back/src/main/java/cn/xcd/lobster/service/impl/AgentSyncServiceImpl.java`
- Test: `lobster-back/src/test/java/cn/xcd/lobster/service/impl/AgentServiceImplDetailTest.java`

**Interfaces:**
- Produces: `AgentGoalRequest.getId()`, `AgentGoalRequest.getSteps()`, `AgentGoalVO.getSteps()`.
- Produces: JSON storage shape `{"steps":[...]}` in `AgentGoal.extJson`.

- [ ] Write failing tests for creating/listing goal steps.
- [ ] Run `mvn -Dtest=AgentServiceImplDetailTest test` and confirm compile/test failure references missing step types or fields.
- [ ] Add step DTO/VO and map goal `extJson` to/from typed steps.
- [ ] Re-run `mvn -Dtest=AgentServiceImplDetailTest test` and confirm these tests pass.

### Task 2: Backend Login Goal Update And Delete

**Files:**
- Modify: `lobster-back/src/main/java/cn/xcd/lobster/controller/AgentController.java`
- Modify: `lobster-back/src/main/java/cn/xcd/lobster/service/AgentService.java`
- Modify: `lobster-back/src/main/java/cn/xcd/lobster/service/impl/AgentServiceImpl.java`
- Test: `lobster-back/src/test/java/cn/xcd/lobster/service/impl/AgentServiceImplDetailTest.java`

**Interfaces:**
- Produces: `PUT /api/agents/{id}/goals/{goalId}`.
- Produces: `DELETE /api/agents/{id}/goals/{goalId}`.
- Produces: `AgentService.updateGoal(Long agentId, Long goalId, AgentGoalRequest request)`.
- Produces: `AgentService.deleteGoal(Long agentId, Long goalId)`.

- [ ] Write failing service tests for goal update and soft delete.
- [ ] Run `mvn -Dtest=AgentServiceImplDetailTest test` and confirm failure.
- [ ] Add service and controller methods.
- [ ] Re-run `mvn -Dtest=AgentServiceImplDetailTest test`.

### Task 3: AI Token Goal Update

**Files:**
- Modify: `lobster-back/src/main/java/cn/xcd/lobster/service/AgentSyncService.java`
- Modify: `lobster-back/src/main/java/cn/xcd/lobster/service/impl/AgentSyncServiceImpl.java`
- Test: `lobster-back/src/test/java/cn/xcd/lobster/service/impl/AgentSyncServiceImplPermissionTest.java`

**Interfaces:**
- Consumes: `AgentGoalRequest.id` and `AgentGoalRequest.steps`.
- Produces: AI sync updates an existing accessible goal when `id` is present.

- [ ] Write failing sync test for updating an existing goal and steps through `POST /api/ai/agents/{id}/sync`.
- [ ] Run `mvn -Dtest=AgentSyncServiceImplPermissionTest test` and confirm failure.
- [ ] Extend sync preflight to include goal payloads and update existing goals by id.
- [ ] Re-run `mvn -Dtest=AgentSyncServiceImplPermissionTest test`.

### Task 4: Frontend Services And Progress Helpers

**Files:**
- Modify: `lobster-front/src/pages/agent/types.ts`
- Modify: `lobster-front/src/pages/agent/service.ts`
- Modify: `lobster-front/src/pages/agent/display.ts`
- Modify: `lobster-front/src/pages/agent/display.test.ts`

**Interfaces:**
- Produces: `AgentGoalStep`, `AgentGoal.steps`.
- Produces: `deleteAgentMemoryApi`, `updateAgentGoalApi`, `deleteAgentGoalApi`.
- Produces: `getGoalProgress(goal: AgentGoal): number` and `getCurrentGoalStep(goal: AgentGoal)`.

- [ ] Write failing frontend tests for step progress and endpoint helpers where practical.
- [ ] Run `npx tsx --test src/pages/agent/display.test.ts src/pages/agent/repository.test.ts`.
- [ ] Add types, services, and display helpers.
- [ ] Re-run the targeted frontend tests.

### Task 5: Frontend Memory And Goal UI

**Files:**
- Modify: `lobster-front/src/pages/agent/Detail/index.tsx`
- Modify: `lobster-front/src/pages/agent/Detail/components/MemoryList.tsx`
- Modify: `lobster-front/src/pages/agent/Detail/components/GoalList.tsx`

**Interfaces:**
- Consumes: service methods from Task 4.
- Produces: manual memory delete, goal edit/delete, step edit controls, corrected memory labels.

- [ ] Wire memory delete handler through Agent detail.
- [ ] Add memory delete UI with confirmation and selected-detail reset.
- [ ] Wire goal update/delete handlers through Agent detail.
- [ ] Replace fixed goal progress with `getGoalProgress`.
- [ ] Add editable goal detail fields and ordered step controls.
- [ ] Keep mobile layouts constrained and avoid nested cards.

### Task 6: Verification

**Files:**
- Verify only.

**Commands:**
- `mvn -Dtest=AgentServiceImplDetailTest,AgentSyncServiceImplPermissionTest,AiAgentControllerPermissionTest test`
- `npx tsx --test src/pages/agent/display.test.ts src/pages/agent/repository.test.ts`
- `npm run build`
- `mvn -DskipTests compile`

- [ ] Run backend targeted tests.
- [ ] Run frontend targeted tests.
- [ ] Run frontend build.
- [ ] Run backend compile.
- [ ] Review `git diff` for unrelated changes.
