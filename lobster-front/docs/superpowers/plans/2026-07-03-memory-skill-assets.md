# Memory And Skill Assets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn memories and Skill Packages into portable AI assets: copyable, exportable, importable, and visible from the existing asset migration page.

**Architecture:** Keep the first release frontend-first and API-compatible with existing endpoints. Shared pure helpers will serialize/validate memory and Skill JSON packages; UI components will call existing create/list/update APIs. Full Agent backup remains the complete migration path, while memory and Skill exports become focused asset-level packages.

**Tech Stack:** React 18, TypeScript, existing request service, node:test via `npx tsx --test`, Vite build.

## Global Constraints

- Do not create a heavy automatic memory engine in v1; build memory asset management: copy, import, export, and cross-Agent reuse.
- Do not invent backend endpoints unless the current frontend cannot complete a usable workflow.
- Skill Package updates are full file-tree replacement; importing a Skill into the editor must replace the current editor workspace, not patch hidden old files.
- Memory import must create new memories through existing `POST /agents/{agentId}/memories` and must not silently delete existing memories.
- Preserve current Agent full backup JSON/ZIP import/export as the complete migration route.
- Use TDD for pure transformation helpers before changing UI.
- Keep untracked `docs/platform-introduction.md` out of commits unless explicitly requested.

---

## File Structure

- Create `src/utils/assetTransfer.ts`: shared pure helpers for JSON download payloads, memory package serialization/validation, Skill package serialization/validation, and prompt text formatting.
- Create `src/utils/assetTransfer.test.ts`: node:test coverage for valid/invalid memory and Skill asset packages.
- Modify `src/pages/agent/Detail/components/MemoryList.tsx`: upgrade to long-term memory library with filtering, copy-as-prompt, JSON export, JSON import, and batch selection.
- Modify `src/pages/agent/Detail/index.tsx`: pass Agent list / import handlers to MemoryList only if needed; keep current create/delete memory behavior intact.
- Modify `src/pages/skill/Editor/components/ImportExportModal.tsx`: wire JSON export/import to current `SkillConfig`; keep ZIP labels out unless implemented.
- Modify `src/pages/skill/Editor/index.tsx`: pass current config and import callbacks into ImportExportModal; mark editor dirty after import.
- Modify `src/pages/transfer/ImportExport/index.tsx`: add clear cards for complete Agent backup, memory package, and Skill package; link users to the right focused modules when the focused import/export happens there.
- Modify tests near changed prompts if user-facing copy introduces required phrases.

---

### Task 1: Shared Asset Package Helpers

**Files:**
- Create: `src/utils/assetTransfer.ts`
- Create: `src/utils/assetTransfer.test.ts`

**Interfaces:**
- Produces `MemoryAssetPackage`, `SkillAssetPackage` types.
- Produces `buildMemoryAssetPackage(memories, meta)`, `parseMemoryAssetPackage(value)`, `formatMemoryPrompt(memory)`.
- Produces `buildSkillAssetPackage(config)`, `parseSkillAssetPackage(value)`.

- [ ] **Step 1: Write failing tests**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMemoryAssetPackage,
  buildSkillAssetPackage,
  formatMemoryPrompt,
  parseMemoryAssetPackage,
  parseSkillAssetPackage,
} from './assetTransfer';

test('builds and parses a memory asset package', () => {
  const pkg = buildMemoryAssetPackage([
    { id: 'm1', title: '项目背景', content: '后端在 lobster-back', memoryType: 'fact', importance: 9, source: 'manual', createdAt: '2026-07-03' },
  ], { agentId: 'a1', agentName: '研发助手' });

  assert.equal(pkg.kind, 'lobster.memory-package');
  assert.equal(parseMemoryAssetPackage(pkg).memories[0].title, '项目背景');
});

test('rejects invalid memory packages', () => {
  assert.throws(() => parseMemoryAssetPackage({ kind: 'bad', memories: [] }), /memory package/i);
});

test('formats memory as a reusable prompt block', () => {
  const prompt = formatMemoryPrompt({ id: 'm1', title: '偏好', content: '用户喜欢直接结论', memoryType: 'preference', importance: 8, createdAt: '2026-07-03' });
  assert.match(prompt, /长期记忆/);
  assert.match(prompt, /用户喜欢直接结论/);
});

test('builds and parses a skill asset package', () => {
  const pkg = buildSkillAssetPackage({ id: 's1', name: 'Repo Skill', description: 'Read repo', files: [{ name: 'SKILL.md', path: 'SKILL.md', language: 'markdown', content: '# Skill' }] });
  assert.equal(pkg.kind, 'lobster.skill-package');
  assert.equal(parseSkillAssetPackage(pkg).skill.files[0].path, 'SKILL.md');
});
```

- [ ] **Step 2: Run tests and confirm RED**

Run: `npx tsx --test src/utils/assetTransfer.test.ts`
Expected: FAIL because `assetTransfer.ts` does not exist.

- [ ] **Step 3: Implement minimal helpers**

Create helpers with runtime validation: package kind, version, arrays, required memory fields, required Skill name/files.

- [ ] **Step 4: Run tests and confirm GREEN**

Run: `npx tsx --test src/utils/assetTransfer.test.ts`
Expected: PASS.

---

### Task 2: Memory Library UI

**Files:**
- Modify: `src/pages/agent/Detail/components/MemoryList.tsx`
- Modify: `src/pages/agent/Detail/index.tsx` if new handler props are required.

**Interfaces:**
- Consumes Task 1 memory helpers.
- Produces UI actions: copy selected memory as prompt, export all/selected memories as JSON package, import JSON package into current Agent by calling existing `onCreateMemory` repeatedly.

- [ ] **Step 1: Add behavior tests where practical**

If the repo does not have React component tests, keep pure helper coverage in Task 1 and use TypeScript build as UI verification.

- [ ] **Step 2: Add state and filters**

Add search + type filter + importance filter. Keep list dense and scannable.

- [ ] **Step 3: Add copy/export/import controls**

Use `writeClipboardText` for copy. Use local `<input type="file">` for JSON import. Export JSON with `Blob` and `URL.createObjectURL`.

- [ ] **Step 4: Add batch selection**

Allow selecting memories from the list. Export selected if any, otherwise export all. Import creates new memories and reports count.

- [ ] **Step 5: Verify**

Run: `npm run lint`.

---

### Task 3: Skill Editor JSON Import/Export

**Files:**
- Modify: `src/pages/skill/Editor/components/ImportExportModal.tsx`
- Modify: `src/pages/skill/Editor/index.tsx`

**Interfaces:**
- Consumes Task 1 Skill helpers.
- Produces real JSON export/import for current editor config.

- [ ] **Step 1: Update modal props**

Add `config`, `onImportConfig`, and `onToast` props.

- [ ] **Step 2: Export current Skill package JSON**

Button downloads `skill-package-{name}.json` from `buildSkillAssetPackage(config)`.

- [ ] **Step 3: Import JSON into editor**

File input parses `parseSkillAssetPackage`, replaces editor config files, marks dirty, and closes modal.

- [ ] **Step 4: Remove unimplemented ZIP/URL claims**

Do not advertise ZIP/URL import until backend/implementation exists. Keep copy honest: JSON import/export now, full Agent ZIP stays in asset migration.

- [ ] **Step 5: Verify**

Run: `npm run lint` and Skill template tests if touched.

---

### Task 4: Asset Migration Page Integration

**Files:**
- Modify: `src/pages/transfer/ImportExport/index.tsx`

**Interfaces:**
- Keeps existing Agent JSON/ZIP full backup behavior.
- Adds explanation and navigation cards for focused memory package and Skill package flows.

- [ ] **Step 1: Clarify full backup completeness**

Update copy: full backup includes Agent identity, memories, goals, mounts, and Skill file contents when backend provides them.

- [ ] **Step 2: Add focused asset cards**

Add cards: “长期记忆包” links to Agent detail memories; “Skill 文件包” links to Skill editor / published skills.

- [ ] **Step 3: Keep imports honest**

Do not add fake upload buttons on transfer page for memory/Skill unless wired. The focused imports live in MemoryList and Skill editor.

- [ ] **Step 4: Verify**

Run: `npm run lint` and `npm run build`.

---

### Task 5: Documentation And Release Verification

**Files:**
- Modify: `public/docs/ai-agent-api.md` if API guidance changes.
- Modify: prompt tests only if copy contracts change.

**Interfaces:**
- Documents the platform positioning: memory assets manage and migrate AI context; Agent backup is complete migration; Skill package JSON is focused editor migration.

- [ ] **Step 1: Update public manual wording if needed**

Mention memory packages and Skill packages as focused frontend asset workflows, separate from `/backup` full Agent export.

- [ ] **Step 2: Run full verification**

Run:
- `npx tsx --test src/utils/assetTransfer.test.ts`
- existing changed prompt tests
- `npm run lint`
- `npm run build`
- `git diff --check`

- [ ] **Step 3: Commit**

Commit message: `feat: add memory and skill asset transfer`

---

## Self-Review

Spec coverage: covers memory enhancement, Skill import/export gap, and integration with existing full Agent import/export. Backend-heavy capabilities are deferred unless existing endpoints cannot support the workflow.

Placeholder scan: no TBD/TODO placeholders; every task has files, interfaces, commands, and acceptance criteria.

Type consistency: memory helpers consume `AgentMemory`; Skill helpers consume `SkillConfig`; UI imports use these same types.
