# 知栈 Lobster 完整截图清单

README 中只放主线截图，完整截图可以按下面的命名放入 `docs/images/`。

截图建议：桌面端统一使用 `1440 x 900` 左右，移动端使用 `390 x 844` 左右。所有 Token、邮箱、服务器 IP、密钥、真实项目记忆都需要打码。

## 系统总览

| 文件名 | 内容 |
| --- | --- |
| `01-hero.png` | 首页或登录后主界面，用作 README 顶部大图 |
| `02-system-overview.png` | 系统总览图：用户、平台、AI Agent、MySQL、Redis、Skill、Memory、Goal |
| `36-sync-flow.png` | AI Agent 接入流程：Token、自注册、拉配置、同步、ack、备份 |
| `37-architecture.png` | 技术架构图：前端、后端、数据库、Redis、上传文件、AI Agent |

## 入口与账号体系

| 文件名 | 内容 |
| --- | --- |
| `03-landing.png` | 首页完整首屏 |
| `04-login.png` | 登录页 |
| `38-register.png` | 注册页 |
| `39-profile.png` | 用户个人资料页 |
| `29-notifications.png` | 通知中心 |

## Agent 管理

| 文件名 | 内容 |
| --- | --- |
| `05-agent-dashboard.png` | Agent 仓库 / 控制台 |
| `06-agent-create.png` | 创建 Agent 弹窗 |
| `40-agent-card.png` | Agent 卡片状态展示 |
| `07-agent-detail-overview.png` | Agent 详情总览 |
| `08-agent-identity.png` | Agent 身份信息和系统提示词 |
| `09-agent-skills.png` | Agent 已挂载 Skill |
| `10-agent-memories.png` | Agent 长期记忆 |
| `11-agent-goals.png` | Agent 目标和步骤 |
| `12-agent-sync-status.png` | Agent 同步状态和配置事件 |

## Skill 市场与 Skill 管理

| 文件名 | 内容 |
| --- | --- |
| `13-skill-market.png` | Skill 市场列表 |
| `41-skill-search.png` | Skill 搜索和筛选 |
| `14-skill-detail.png` | Skill 详情页 |
| `42-skill-install.png` | 安装 Skill |
| `43-skill-fork.png` | Fork Skill |
| `44-my-published-skills.png` | 我发布的 Skill |
| `45-my-installed-skills.png` | 我安装的 Skill |

## Skill 编辑器

| 文件名 | 内容 |
| --- | --- |
| `15-skill-editor-overview.png` | Skill 编辑器整体界面 |
| `16-skill-editor-metadata.png` | Skill 元数据配置 |
| `17-skill-editor-file-tree.png` | Skill 文件树 |
| `18-skill-editor-skill-md.png` | 编辑 `SKILL.md` |
| `19-skill-editor-workflows.png` | 编辑 `workflows/` |
| `20-skill-editor-references.png` | 编辑 `references/` |
| `21-skill-editor-examples.png` | 编辑 `examples/` |
| `46-skill-editor-checklists.png` | 编辑 `checklists/` |
| `22-skill-editor-import-export.png` | Skill 导入导出 |
| `23-skill-editor-publish.png` | Skill 发布 / 提交审核 |

## Agent Token 与 AI 接入

| 文件名 | 内容 |
| --- | --- |
| `24-token-list.png` | Agent Token 列表 |
| `47-token-create.png` | 创建 Token |
| `25-token-permissions.png` | Token 权限配置 |
| `48-token-created.png` | Token 创建成功，只展示一次明文，必须打码 |
| `49-ai-api-doc.png` | AI Agent API 文档页面 |

## 资产迁移与备份

| 文件名 | 内容 |
| --- | --- |
| `26-transfer-overview.png` | 资产迁移页面 |
| `50-agent-backup-json.png` | Agent JSON 导出 |
| `27-agent-backup-zip.png` | Agent ZIP 导出 |
| `28-agent-import.png` | Agent 导入 |
| `51-memory-package.png` | 长期记忆包 |
| `52-skill-package-transfer.png` | Skill 文件包导入导出 |

## 管理后台

| 文件名 | 内容 |
| --- | --- |
| `30-admin-users.png` | 用户管理 |
| `31-admin-skills.png` | Skill 审核列表 |
| `53-admin-skill-review.png` | Skill 审核详情 / 通过 / 拒绝 |
| `32-admin-feedback.png` | 反馈管理 |
| `33-admin-announcements.png` | 公告管理 |

## 移动端适配

| 文件名 | 内容 |
| --- | --- |
| `34-mobile-home.png` | 移动端首页 |
| `35-mobile-agent-dashboard.png` | 移动端 Agent 列表 |
| `54-mobile-agent-detail.png` | 移动端 Agent 详情 |
| `55-mobile-skill-market.png` | 移动端 Skill 市场 |
| `56-mobile-skill-editor.png` | 移动端 Skill 编辑器或文件树 |

## 演示数据建议

截图前建议准备一套演示数据，避免出现真实敏感内容。

Agent 名称可以使用：

- 研发助手
- 写作助手
- 运营助手
- 数据分析助手

Skill 名称可以使用：

- 代码审查 Skill
- 需求分析 Skill
- 文档写作 Skill
- 接口联调 Skill
- 发布检查 Skill

记忆内容可以使用：

- 项目统一使用 Spring Boot 3 和 React。
- 提交前需要运行前端构建和后端测试。
- API 文档变更后需要同步更新接入手册。

目标内容可以使用：

- 完成 Agent 迁移流程验证。
- 整理团队通用 Skill 模板。
- 优化 AI 同步时的 Token 消耗。

注意不要截图真实 Token、真实用户邮箱、真实服务器 IP、数据库密码、业务密钥或私有项目内容。
