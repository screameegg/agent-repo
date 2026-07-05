# Skill Full Upload Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the AI-facing Skill handoff and Agent API manual explicitly require a complete Skill file tree whenever a Skill Package is uploaded or updated.

**Architecture:** This is a documentation and prompt-contract hardening task in `lobster-front`. The public manual at `public/docs/ai-agent-api.md` defines the API contract for AI Agents, and `src/pages/Landing/skillCopyPrompt.ts` defines the prompt copied from the landing page. Tests pin the prompt wording so future edits do not remove the full-upload requirement.

**Tech Stack:** React 19, TypeScript, Node test runner via `tsx`, static Markdown manual.

## Global Constraints

- Do not change backend behavior in this task.
- Uploading or updating a Skill Package must be described as a full desired file tree submission, not a partial patch.
- The AI must be told that omitting an existing file from `files` means that file will be absent from the saved Skill Package after update.
- The AI must be told to fetch/read the current Skill detail before updating if it wants to preserve existing files.
- Keep wording concise enough for AI consumption.

---

### Task 1: Pin Skill Handoff Prompt Contract

**Files:**
- Modify: `src/pages/Landing/skillCopyPrompt.test.ts`
- Modify: `src/pages/Landing/skillCopyPrompt.ts`

**Interfaces:**
- Consumes: `buildSkillCopyPrompt({ frontendOrigin }: SkillCopyPromptOptions): string`
- Produces: A prompt that explicitly says Skill uploads/updates require a complete file tree.

- [ ] **Step 1: Write the failing test**

Add these assertions to `src/pages/Landing/skillCopyPrompt.test.ts`:

```ts
  assert.match(prompt, /完整文件树/);
  assert.match(prompt, /不是增量补丁/);
  assert.match(prompt, /缺少的文件会在更新后消失/);
  assert.match(prompt, /更新前先读取当前 Skill 详情/);
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx tsx --test src/pages/Landing/skillCopyPrompt.test.ts
```

Expected: FAIL because the current prompt does not mention the full file tree upload contract.

- [ ] **Step 3: Update the prompt**

In `src/pages/Landing/skillCopyPrompt.ts`, replace the operation steps with wording equivalent to:

```ts
    '1. 打开 Lobster 技能详情或技能编辑器，读取 Skill 的 README / 配置 / 全部文件内容。',
    '2. 上传或更新 Skill Package 时，files 必须是完整文件树，不是增量补丁；缺少的文件会在更新后消失。',
    '3. 如果要保留已有文件，更新前先读取当前 Skill 详情，把旧文件和新文件合并成完整 files 后再提交。',
    '4. 优先阅读 SKILL.md、README.md、manifest/config 这类说明文件。',
    '5. 如果需要和 Agent 同步，把 skill code 写入 sync.skills[].configJson.code。',
    '6. 如果平台已挂载该 Skill，调用 Agent config 接口读取 skillPackages[].files 学习完整能力。',
    '7. 执行任务时只使用 Skill 中明确声明的能力、参数和约束。',
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npx tsx --test src/pages/Landing/skillCopyPrompt.test.ts
```

Expected: PASS.

### Task 2: Harden AI Agent API Manual

**Files:**
- Modify: `public/docs/ai-agent-api.md`

**Interfaces:**
- Consumes: Existing `POST /api/ai/skills` and `PUT /api/ai/skills/{id}` documentation.
- Produces: Manual text that tells AI Agents to upload complete `files` for Skill create/update.

- [ ] **Step 1: Update the Skill upload section**

In `public/docs/ai-agent-api.md`, under `## 上传或更新 Skill 包`, add a short warning before the curl example:

```md
**重要：`files` 必须是完整文件树，不是增量补丁。** 创建或更新 Skill Package 时，AI 必须提交当前期望保存的全部文件。只传新增文件会让未出现在 `files` 里的旧文件在更新后消失。如果要保留已有文件，先调用 `GET /api/ai/skills/<SKILL_ID>` 读取当前 Skill 详情，把旧文件和新文件合并成完整 `files` 后再提交。
```

- [ ] **Step 2: Strengthen file tree rules**

Replace the existing first file tree rule with these bullets:

```md
- `files` 是完整期望文件树，不是增量补丁。后端会按这份列表重建该 Skill 的文件树。
- 更新 Skill 时，只传新增文件会导致未出现在 `files` 里的旧文件在更新后消失。
- 如果需要追加或修改单个文件，先读取当前 Skill 详情，保留所有仍需要的旧文件，再把修改后的完整 `files` 一次性提交。
```

- [ ] **Step 3: Update troubleshooting**

In the troubleshooting section for duplicate or wrong data, ensure the existing empty-files warning is followed by:

```md
更新 Skill 文件时是否只传了新增文件。Skill 更新不是 patch；必须提交完整文件树。
```

- [ ] **Step 4: Verify wording exists**

Run:

```bash
rg -n "完整文件树|不是增量补丁|更新前先读取当前 Skill 详情|只传新增文件" public/docs/ai-agent-api.md src/pages/Landing/skillCopyPrompt.ts
```

Expected: output includes both `public/docs/ai-agent-api.md` and `src/pages/Landing/skillCopyPrompt.ts`.

### Task 3: Final Verification

**Files:**
- Test: `src/pages/Landing/skillCopyPrompt.test.ts`
- Test: `src/pages/agent/Dashboard/aiOnboarding.test.ts`

**Interfaces:**
- Consumes: Landing Skill prompt and Agent onboarding prompt.
- Produces: Verified prompt and TypeScript build health.

- [ ] **Step 1: Run prompt tests**

Run:

```bash
npx tsx --test src/pages/Landing/skillCopyPrompt.test.ts src/pages/agent/Dashboard/aiOnboarding.test.ts
```

Expected: PASS for both tests.

- [ ] **Step 2: Run frontend type check**

Run:

```bash
npm run lint
```

Expected: `tsc --noEmit` exits 0.

- [ ] **Step 3: Review diff**

Run:

```bash
git diff -- public/docs/ai-agent-api.md src/pages/Landing/skillCopyPrompt.ts src/pages/Landing/skillCopyPrompt.test.ts
```

Expected: diff only changes the Skill full-upload contract wording and associated tests.

## Self-Review

- Spec coverage: The plan covers both requested surfaces: `public/docs/ai-agent-api.md` and the copied Skill handoff prompt.
- Placeholder scan: No placeholders or deferred implementation steps remain.
- Type consistency: The only code interface used is the existing `buildSkillCopyPrompt` function.
