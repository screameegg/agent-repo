-- Skill 市场测试数据
-- 使用方式：把 @owner_id 改成你的 sys_user.id 后执行。本文件不会被应用自动初始化，只用于手动插入测试数据。
SET @owner_id = 1;

INSERT INTO skill_package (
    id, owner_id, name, code, description, icon, version, visibility, publish_status,
    install_count, ext_json, create_time, update_time, delete_time
) VALUES
    (910000000000000001, @owner_id, 'Lobster 项目工作流', 'lobster-project-workflow',
     '指导 Agent 熟悉 Lobster 前后端结构、Skill Package 文件树、同步语义和验证命令。',
     'https://api.dicebear.com/7.x/icons/svg?seed=lobster-workflow', '1.0.0', 'public', 'published',
     128, '{}', NOW(), NOW(), NULL),
    (910000000000000002, @owner_id, '数据库查询助手', 'database-query-helper',
     '提供只读 SQL 查询规范、慢查询分析示例和结果摘要模板。',
     'https://api.dicebear.com/7.x/icons/svg?seed=database-helper', '1.1.0', 'public', 'published',
     86, '{}', NOW(), NOW(), NULL),
    (910000000000000003, @owner_id, '本地文件同步', 'local-file-sync',
     '定义文件读取、写入、目录同步和备份迁移的安全调用边界。',
     'https://api.dicebear.com/7.x/icons/svg?seed=file-sync', '0.9.0', 'public', 'published',
     64, '{}', NOW(), NOW(), NULL),
    (910000000000000004, @owner_id, '记忆整理器', 'memory-organizer',
     '将碎片记忆整理成事实、偏好、流程和长期目标，便于 Agent 迁移和克隆。',
     'https://api.dicebear.com/7.x/icons/svg?seed=memory-organizer', '1.0.2', 'public', 'published',
     42, '{}', NOW(), NOW(), NULL)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    code = VALUES(code),
    description = VALUES(description),
    icon = VALUES(icon),
    version = VALUES(version),
    visibility = VALUES(visibility),
    publish_status = VALUES(publish_status),
    update_time = NOW(),
    delete_time = NULL;

DELETE FROM skill_file WHERE skill_id IN (
    910000000000000001,
    910000000000000002,
    910000000000000003,
    910000000000000004
);

INSERT INTO skill_file (
    id, skill_id, parent_id, node_type, name, path, language, content, sort_order,
    create_time, update_time, delete_time
) VALUES
    (920000000000000001, 910000000000000001, NULL, 'file', 'SKILL.md', 'SKILL.md', 'markdown',
     '---\nname: lobster-project-workflow\ndescription: Use when working in the Lobster Agent and Skill management platform repository\n---\n\n# Lobster Project Workflow\n\n## When to Use\nUse this skill when you need to understand, change, debug, or verify the Lobster project. Lobster is an Agent / Skill backup, sync, review, and management platform.\n\n## Project Map\n| Area | Path | Purpose |\n|---|---|---|\n| Frontend | `lobster-front` | Vite, React, TypeScript UI for agents, skills, profile, admin, and onboarding docs |\n| Backend | `lobster-back` | Spring Boot API, auth, Agent sync, Skill Package storage, audit, and database schema |\n| Public manual | `lobster-front/public/docs/ai-agent-api.md` | AI-facing API contract and Agent Token workflow |\n| Skill editor | `lobster-front/src/pages/skill/Editor` | Browser editor for Skill Package file trees |\n| Skill service | `lobster-back/src/main/java/cn/xcd/lobster/service/impl/SkillServiceImpl.java` | Creates, updates, publishes, forks, and stores Skill files |\n| Agent sync service | `lobster-back/src/main/java/cn/xcd/lobster/service/impl/AgentSyncServiceImpl.java` | Agent Token sync, mounted Skill Packages, memories, and goals |\n\n## Core Domain Rules\n- A Skill Package is stored as `skill_package` plus its complete `skill_file` tree.\n- `sync.skills` is only an Agent self-reported display snapshot. Do not treat it as the Skill Package source of truth.\n- Creating or updating a Skill Package requires a complete file tree, not an incremental patch. Treat `files` as the 完整文件树. Missing files from the request will be absent after update.\n- Mounted skills are represented by `agent_skill_mount`; Agent config exposes mounted Skill Package files through `skillPackages[].files`.\n- If preserving existing files, read the current Skill detail first, merge old and new files, then submit the complete desired file tree.\n\n## Sync Preview and Platform Migration Rules\n- Before syncing `skills`, `memories`, `goals`, or updating a Skill Package, generate a 同步预览 from local data and `GET /api/ai/agents/{agentId}/config`.\n- The 同步预览 must show planned creates, updates, deletes, skipped items, target `baseRevision`, and the exact data categories being written.\n- 目标更新优先复用 config 返回的 `goals[].id`; 没有 id 时平台只会跳过精确重复目标，不会猜测合并。\n- 删除过期或重复目标时调用 `DELETE /api/ai/agents/{agentId}/goals/{goalId}`，需要 `goalWrite` 权限。\n- Ask the user to choose the scope before submitting: 全量同步, 只同步 Skill, 只同步记忆, 只同步目标, 只更新 Agent 身份, or cancel.\n- 平台迁移策略按运行环境区分。Codex can usually read workspace files and write the full Skill file tree directly; Claude Code may use its own skill-loading and project-instruction conventions; 通用 Agent integrations may only support API calls or exported ZIP/JSON backups.\n- If a platform can safely read files and config, write a small program or script to build the preview and payload. If overwrite risk, missing permissions, or user intent is unclear, stop before sync and ask for selection.\n\n## Reading Order\n1. Read `lobster-back/README.md` and `lobster-front/README.md` for deployment shape.\n2. Read `lobster-front/public/docs/ai-agent-api.md` for AI Token behavior, Skill Package upload, sync, and config contracts.\n3. For frontend changes, inspect the target page under `lobster-front/src/pages` and nearby tests before editing.\n4. For backend changes, inspect the controller, DTO, service implementation, mapper, schema, and existing tests for the same feature.\n5. For Skill behavior, follow `SkillServiceImpl`, `SkillSaveRequest`, `SkillFileRequest`, `SkillPackageVO`, and `skill_market_seed.sql` together.\n\n## Change Workflow\n1. Check worktree status in the relevant repo before edits because `lobster-front` and `lobster-back` may have separate git state.\n2. Keep changes scoped to the touched feature. Do not rewrite unrelated UI, schema, or API contracts.\n3. Add or update focused tests before behavior changes when possible.\n4. Preserve the full-upload Skill contract and 同步预览 scope-selection rule whenever changing prompts, docs, editor save behavior, or AI API examples.\n5. Avoid putting secrets, Agent Tokens, user private data, or deployment passwords into Skill files, memories, docs, or logs.\n\n## Verification Commands\n| Change Type | Command | Working Directory |\n|---|---|---|\n| Frontend type check | `npm run lint` | `lobster-front` |\n| Frontend production build | `npm run build` | `lobster-front` |\n| Frontend targeted tests | `npx tsx --test <test-file>` | `lobster-front` |\n| Backend targeted test | `mvn -Dtest=<TestClass> test` | `lobster-back` |\n| Backend full test suite | `mvn test` | `lobster-back` |\n\n## Common Failure Checks\n- Skill update lost files: confirm the request sent a complete `files` array and did not send only changed files.\n- Agent config does not show a Skill: confirm the Skill Package was uploaded, then mounted manually or auto-mounted by matching `sync.skills[].configJson.code`.\n- Market does not show a Skill: confirm visibility, publish status, audit status, owner, and delete time.\n- Agent reads only `skills`: switch to `skillPackages[].files` for complete Skill instructions.\n- Frontend API mismatch: compare TypeScript service payloads with backend DTOs and VO records.\n- Duplicate goals: reuse `goals[].id` when updating, and call `DELETE /api/ai/agents/{agentId}/goals/{goalId}` for stale or duplicate goals.\n\n## Output Contract\nWhen reporting work on this project, include the files changed, the verification commands run, and any command that could not be run. Use exact paths and concrete test names.', 0, NOW(), NOW(), NULL),
    (920000000000000002, 910000000000000001, NULL, 'folder', 'references', 'references', NULL, NULL, 1, NOW(), NOW(), NULL),
    (920000000000000003, 910000000000000001, 920000000000000002, 'file', 'lobster-checklist.md', 'references/lobster-checklist.md', 'markdown',
     '# Lobster workflow checklist\n\nUse this file as a human-readable checklist. It is not an executable integration script.\n\n- Frontend root: lobster-front\n- Backend root: lobster-back\n- Skill Package source tables: skill_package, skill_file\n- Full upload rule: submit the complete files tree on create and update\n- Sync preview rule: show planned data and let the user choose 全量同步, 只同步 Skill, 只同步记忆, or 只同步目标 before writing\n- Goal sync rule: reuse goals[].id for updates; delete stale or duplicate goals with DELETE /api/ai/agents/{agentId}/goals/{goalId}\n- Platform migration strategy: adapt Codex, Claude Code, and 通用 Agent workflows to their file-reading and API capabilities\n- Frontend checks: npm run lint, npm run build, npx tsx --test <test-file>\n- Backend checks: mvn -Dtest=<TestClass> test, mvn test\n', 2, NOW(), NOW(), NULL),

    (920000000000000011, 910000000000000002, NULL, 'file', 'SKILL.md', 'SKILL.md', 'markdown',
     '# 数据库查询助手\n\n## 用途\n提供只读 SQL 查询说明、参数约束和结果摘要模板。\n\n## 安全要求\n禁止 DROP、DELETE、UPDATE 等写操作。', 0, NOW(), NOW(), NULL),
    (920000000000000012, 910000000000000002, NULL, 'folder', 'examples', 'examples', NULL, NULL, 1, NOW(), NOW(), NULL),
    (920000000000000013, 910000000000000002, 920000000000000012, 'file', 'readonly_query.json', 'examples/readonly_query.json', 'json',
     '{\n  "sql": "select * from agent limit 10",\n  "mode": "readonly"\n}\n', 2, NOW(), NOW(), NULL),

    (920000000000000021, 910000000000000003, NULL, 'file', 'SKILL.md', 'SKILL.md', 'markdown',
     '# 本地文件同步\n\n## 用途\n定义目录读取、文件写入和备份导出的调用约束。\n\n## 建议\n迁移 Agent 前先导出完整文件树。', 0, NOW(), NOW(), NULL),
    (920000000000000022, 910000000000000003, NULL, 'folder', 'scripts', 'scripts', NULL, NULL, 1, NOW(), NOW(), NULL),
    (920000000000000023, 910000000000000003, 920000000000000022, 'file', 'sync_files.py', 'scripts/sync_files.py', 'python',
     'def run(params):\n    return {"synced": True, "path": params.get("path")}\n', 2, NOW(), NOW(), NULL),

    (920000000000000031, 910000000000000004, NULL, 'file', 'SKILL.md', 'SKILL.md', 'markdown',
     '# 记忆整理器\n\n## 用途\n把智能体同步上来的记忆拆分为事实、偏好、流程和目标。\n\n## 输出\n返回结构化 memory items。', 0, NOW(), NOW(), NULL),
    (920000000000000032, 910000000000000004, NULL, 'folder', 'examples', 'examples', NULL, NULL, 1, NOW(), NOW(), NULL),
    (920000000000000033, 910000000000000004, 920000000000000032, 'file', 'memory_item.json', 'examples/memory_item.json', 'json',
     '{\n  "type": "preference",\n  "content": "用户喜欢简洁回答",\n  "importance": 8\n}\n', 2, NOW(), NOW(), NULL);
