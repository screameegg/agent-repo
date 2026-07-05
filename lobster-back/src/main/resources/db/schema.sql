CREATE TABLE IF NOT EXISTS sys_user (
    id BIGINT NOT NULL COMMENT '主键ID',
    name VARCHAR(64) NOT NULL COMMENT '用户名称',
    account VARCHAR(64) NOT NULL COMMENT '登录账号',
    password VARCHAR(255) NOT NULL COMMENT '密码哈希',
    role VARCHAR(32) NOT NULL DEFAULT 'user' COMMENT '用户角色：admin管理员，user普通用户',
    status VARCHAR(32) NOT NULL DEFAULT 'active' COMMENT '用户状态：active启用、disabled禁用',
    avatar VARCHAR(512) NULL COMMENT '用户头像地址',
    bio VARCHAR(512) NULL COMMENT '个人简介',
    theme VARCHAR(64) NULL COMMENT '偏好主题',
    notify_enabled TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否开启通知',
    create_time DATETIME NOT NULL COMMENT '创建时间',
    last_login_time DATETIME NULL COMMENT '最后登录时间',
    update_time DATETIME NOT NULL COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_sys_user_account (account)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统用户表';

-- 老库升级时，如果还没有管理员，则把最早创建的用户提升为唯一管理员；后续注册用户保持普通用户
UPDATE sys_user
SET role = 'admin'
WHERE NOT EXISTS (
    SELECT 1 FROM (SELECT id FROM sys_user WHERE role = 'admin' LIMIT 1) admin_user
)
AND id = (
    SELECT id FROM (
        SELECT id FROM sys_user ORDER BY create_time ASC, id ASC LIMIT 1
    ) first_user
);

CREATE TABLE IF NOT EXISTS agent (
    id BIGINT NOT NULL COMMENT '主键ID',
    owner_id BIGINT NOT NULL COMMENT '归属用户ID',
    name VARCHAR(64) NOT NULL COMMENT 'Agent名称',
    code VARCHAR(64) NOT NULL COMMENT 'Agent唯一编码，便于外部系统调用',
    role VARCHAR(64) NOT NULL COMMENT 'Agent角色定位',
    description VARCHAR(512) NOT NULL COMMENT 'Agent简介',
    system_prompt TEXT NULL COMMENT '系统提示词，定义Agent能力边界和行为约束',
    avatar VARCHAR(512) NULL COMMENT '头像地址',
    base_model VARCHAR(64) NULL COMMENT '基座模型名称',
    status VARCHAR(32) NOT NULL DEFAULT 'active' COMMENT '状态：active启用、disabled停用、archived归档',
    association_status VARCHAR(32) NOT NULL DEFAULT 'unbound' COMMENT '外部系统关联状态：bound已关联、unbound未关联',
    skill_count INT NOT NULL DEFAULT 0 COMMENT '技能数量冗余统计',
    memory_count INT NOT NULL DEFAULT 0 COMMENT '记忆数量冗余统计',
    goal_count INT NOT NULL DEFAULT 0 COMMENT '目标数量冗余统计',
    sort_order INT NOT NULL DEFAULT 0 COMMENT '排序值，越大越靠前',
    ext_json JSON NULL COMMENT '扩展字段，后续补充配置时使用',
    create_time DATETIME NOT NULL COMMENT '创建时间',
    update_time DATETIME NOT NULL COMMENT '更新时间',
    delete_time DATETIME NULL COMMENT '删除时间，空表示未删除',
    PRIMARY KEY (id),
    UNIQUE KEY uk_agent_owner_code (owner_id, code),
    KEY idx_agent_owner_status (owner_id, status),
    KEY idx_agent_owner_create_time (owner_id, create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Agent主表';

CREATE TABLE IF NOT EXISTS agent_skill (
    id BIGINT NOT NULL COMMENT '主键ID',
    agent_id BIGINT NOT NULL COMMENT 'Agent ID',
    name VARCHAR(64) NOT NULL COMMENT '技能名称',
    description VARCHAR(512) NOT NULL COMMENT '技能描述',
    icon VARCHAR(128) NULL COMMENT '技能图标标识',
    source_type VARCHAR(32) NOT NULL DEFAULT 'custom' COMMENT '来源类型：system系统、market市场、custom自定义',
    mount_status VARCHAR(32) NOT NULL DEFAULT 'active' COMMENT '挂载状态：active运行中、standby待命、disabled停用',
    config_json JSON NULL COMMENT '技能配置JSON',
    sort_order INT NOT NULL DEFAULT 0 COMMENT '排序值，越大越靠前',
    create_time DATETIME NOT NULL COMMENT '创建时间',
    update_time DATETIME NOT NULL COMMENT '更新时间',
    delete_time DATETIME NULL COMMENT '删除时间，空表示未删除',
    PRIMARY KEY (id),
    KEY idx_agent_skill_agent_status (agent_id, mount_status),
    KEY idx_agent_skill_agent_sort (agent_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Agent技能挂载表';

CREATE TABLE IF NOT EXISTS agent_memory (
    id BIGINT NOT NULL COMMENT '主键ID',
    agent_id BIGINT NOT NULL COMMENT 'Agent ID',
    title VARCHAR(128) NOT NULL COMMENT '记忆标题',
    content TEXT NOT NULL COMMENT '记忆内容',
    memory_type VARCHAR(32) NOT NULL DEFAULT 'note' COMMENT '记忆类型：note笔记、fact事实、preference偏好、workflow流程',
    importance INT NOT NULL DEFAULT 0 COMMENT '重要程度，数值越大越重要',
    source VARCHAR(128) NULL COMMENT '记忆来源',
    ext_json JSON NULL COMMENT '扩展字段，存储向量索引、标签等后续信息',
    create_time DATETIME NOT NULL COMMENT '创建时间',
    update_time DATETIME NOT NULL COMMENT '更新时间',
    delete_time DATETIME NULL COMMENT '删除时间，空表示未删除',
    PRIMARY KEY (id),
    KEY idx_agent_memory_agent_type (agent_id, memory_type),
    KEY idx_agent_memory_agent_importance (agent_id, importance)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Agent记忆表';

CREATE TABLE IF NOT EXISTS agent_goal (
    id BIGINT NOT NULL COMMENT '主键ID',
    agent_id BIGINT NOT NULL COMMENT 'Agent ID',
    title VARCHAR(128) NOT NULL COMMENT '目标标题',
    description VARCHAR(1024) NULL COMMENT '目标描述',
    goal_status VARCHAR(32) NOT NULL DEFAULT 'pending' COMMENT '目标状态：pending待处理、running进行中、completed已完成、paused已暂停、failed失败',
    priority INT NOT NULL DEFAULT 0 COMMENT '优先级，数值越大优先级越高',
    due_time DATETIME NULL COMMENT '截止时间',
    ext_json JSON NULL COMMENT '扩展字段，存储执行计划、上下文等后续信息',
    create_time DATETIME NOT NULL COMMENT '创建时间',
    update_time DATETIME NOT NULL COMMENT '更新时间',
    delete_time DATETIME NULL COMMENT '删除时间，空表示未删除',
    PRIMARY KEY (id),
    KEY idx_agent_goal_agent_status (agent_id, goal_status),
    KEY idx_agent_goal_agent_priority (agent_id, priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Agent目标表';

CREATE TABLE IF NOT EXISTS agent_token (
    id BIGINT NOT NULL COMMENT '主键ID',
    owner_id BIGINT NOT NULL COMMENT '归属用户ID',
    agent_id BIGINT NULL COMMENT '绑定Agent ID，空表示可访问该用户下多个Agent',
    name VARCHAR(64) NOT NULL COMMENT '令牌名称',
    token_prefix VARCHAR(24) NOT NULL COMMENT '令牌前缀，用于列表展示和排查',
    token_hash VARCHAR(128) NOT NULL COMMENT '令牌哈希值，不存储明文令牌',
    permission_json JSON NOT NULL COMMENT '权限配置JSON，例如skills、memories、goals',
    status VARCHAR(32) NOT NULL DEFAULT 'active' COMMENT '状态：active启用、disabled停用、revoked已吊销',
    last_used_time DATETIME NULL COMMENT '最后使用时间',
    expire_time DATETIME NULL COMMENT '过期时间，空表示不过期',
    create_time DATETIME NOT NULL COMMENT '创建时间',
    update_time DATETIME NOT NULL COMMENT '更新时间',
    delete_time DATETIME NULL COMMENT '删除时间，空表示未删除',
    PRIMARY KEY (id),
    UNIQUE KEY uk_agent_token_hash (token_hash),
    KEY idx_agent_token_owner_status (owner_id, status),
    KEY idx_agent_token_agent_status (agent_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Agent访问令牌表';

CREATE TABLE IF NOT EXISTS skill_package (
    id BIGINT NOT NULL COMMENT '主键ID',
    owner_id BIGINT NOT NULL COMMENT '创建用户ID',
    name VARCHAR(128) NOT NULL COMMENT '技能名称',
    code VARCHAR(128) NOT NULL COMMENT '技能唯一编码',
    description VARCHAR(1024) NULL COMMENT '技能描述',
    icon VARCHAR(512) NULL COMMENT '技能图标',
    version VARCHAR(32) NOT NULL DEFAULT '1.0.0' COMMENT '技能版本',
    visibility VARCHAR(32) NOT NULL DEFAULT 'private' COMMENT '可见性：private私有、public公开',
    publish_status VARCHAR(32) NOT NULL DEFAULT 'draft' COMMENT '发布状态：draft草稿、pending待上架、published已发布、offline已下架',
    audit_status VARCHAR(32) NOT NULL DEFAULT 'none' COMMENT '审核状态：none无需审核、pending待审核、approved已通过、rejected已拒绝',
    audit_reason VARCHAR(512) NULL COMMENT '审核原因或拒绝说明，例如敏感词命中详情',
    audit_operator_id BIGINT NULL COMMENT '审核管理员ID',
    audit_time DATETIME NULL COMMENT '审核处理时间',
    install_count INT NOT NULL DEFAULT 0 COMMENT '安装次数',
    ext_json JSON NULL COMMENT '扩展字段，存储入口、参数说明、兼容版本等信息',
    create_time DATETIME NOT NULL COMMENT '创建时间',
    update_time DATETIME NOT NULL COMMENT '更新时间',
    delete_time DATETIME NULL COMMENT '删除时间，空表示未删除',
    PRIMARY KEY (id),
    UNIQUE KEY uk_skill_owner_code (owner_id, code),
    KEY idx_skill_market (visibility, publish_status, install_count),
    KEY idx_skill_owner_status (owner_id, publish_status),
    KEY idx_skill_audit_status (audit_status, update_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='技能包主表';

CREATE TABLE IF NOT EXISTS skill_publish_apply_log (
    id BIGINT PRIMARY KEY COMMENT '发布申请日志ID',
    user_id BIGINT NOT NULL COMMENT '申请用户ID',
    skill_id BIGINT NOT NULL COMMENT '申请发布的技能ID',
    apply_result VARCHAR(32) NOT NULL COMMENT '申请结果：published直接上架、pending进入审核',
    reason VARCHAR(512) NULL COMMENT '申请说明，例如敏感词命中详情',
    create_time DATETIME NOT NULL COMMENT '申请时间',
    KEY idx_publish_apply_user_time (user_id, create_time),
    KEY idx_publish_apply_skill_time (skill_id, create_time)
) COMMENT='技能发布申请日志，用于限制单用户每日发布申请次数';

CREATE TABLE IF NOT EXISTS notification (
    id BIGINT PRIMARY KEY COMMENT '通知ID',
    recipient_user_id BIGINT NOT NULL COMMENT '接收用户ID',
    sender_user_id BIGINT NULL COMMENT '发送用户ID，系统通知可为空',
    notification_type VARCHAR(64) NOT NULL COMMENT '通知类型：system_announcement系统公告、skill_audit技能审核、sync_reminder同步提醒',
    title VARCHAR(128) NOT NULL COMMENT '通知标题',
    content VARCHAR(1024) NOT NULL COMMENT '通知内容',
    biz_type VARCHAR(64) NULL COMMENT '业务类型，例如 skill、agent、announcement',
    biz_id BIGINT NULL COMMENT '关联业务ID',
    read_time DATETIME NULL COMMENT '读取时间',
    create_time DATETIME NOT NULL COMMENT '创建时间',
    delete_time DATETIME NULL COMMENT '删除时间',
    KEY idx_notification_recipient_read (recipient_user_id, read_time, create_time),
    KEY idx_notification_recipient_time (recipient_user_id, create_time)
) COMMENT='站内通知表';


CREATE TABLE IF NOT EXISTS user_feedback (
    id BIGINT NOT NULL COMMENT '反馈ID',
    user_id BIGINT NOT NULL COMMENT '提交用户ID',
    feedback_type VARCHAR(32) NOT NULL DEFAULT 'general' COMMENT '反馈类型：general常规反馈、nps推荐度反馈',
    score INT NULL COMMENT 'NPS推荐分，0到10',
    category VARCHAR(64) NOT NULL DEFAULT 'general' COMMENT '反馈分类',
    content VARCHAR(2048) NOT NULL DEFAULT '' COMMENT '反馈内容',
    page_url VARCHAR(512) NULL COMMENT '提交页面地址',
    user_agent VARCHAR(512) NULL COMMENT '浏览器User-Agent',
    status VARCHAR(32) NOT NULL DEFAULT 'open' COMMENT '处理状态：open待处理、reviewed已查看、closed已关闭',
    create_time DATETIME NOT NULL COMMENT '创建时间',
    update_time DATETIME NOT NULL COMMENT '更新时间',
    delete_time DATETIME NULL COMMENT '删除时间，空表示未删除',
    PRIMARY KEY (id),
    KEY idx_user_feedback_user_type (user_id, feedback_type, create_time),
    KEY idx_user_feedback_status_time (status, create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户反馈表';
CREATE TABLE IF NOT EXISTS skill_file (
    id BIGINT NOT NULL COMMENT '主键ID',
    skill_id BIGINT NOT NULL COMMENT '技能包ID',
    parent_id BIGINT NULL COMMENT '父节点ID，根节点为空',
    node_type VARCHAR(16) NOT NULL COMMENT '节点类型：folder文件夹、file文件',
    name VARCHAR(128) NOT NULL COMMENT '文件或文件夹名称',
    path VARCHAR(512) NOT NULL COMMENT '完整路径，例如 scripts/main.py',
    language VARCHAR(64) NULL COMMENT '文件语言类型',
    content MEDIUMTEXT NULL COMMENT '文件内容，文件夹为空',
    sort_order INT NOT NULL DEFAULT 0 COMMENT '排序值，越小越靠前',
    create_time DATETIME NOT NULL COMMENT '创建时间',
    update_time DATETIME NOT NULL COMMENT '更新时间',
    delete_time DATETIME NULL COMMENT '删除时间，空表示未删除',
    PRIMARY KEY (id),
    UNIQUE KEY uk_skill_file_path (skill_id, path),
    KEY idx_skill_file_parent (skill_id, parent_id),
    KEY idx_skill_file_type (skill_id, node_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='技能文件树表';

CREATE TABLE IF NOT EXISTS user_skill_install (
    id BIGINT NOT NULL COMMENT '主键ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    skill_id BIGINT NOT NULL COMMENT '技能包ID',
    install_version VARCHAR(32) NOT NULL COMMENT '安装版本',
    config_json JSON NULL COMMENT '安装配置JSON',
    create_time DATETIME NOT NULL COMMENT '安装时间',
    update_time DATETIME NOT NULL COMMENT '更新时间',
    delete_time DATETIME NULL COMMENT '删除时间，空表示未删除',
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_skill_install (user_id, skill_id),
    KEY idx_user_skill_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户已安装技能表';

CREATE TABLE IF NOT EXISTS agent_skill_mount (
    id BIGINT NOT NULL COMMENT '主键ID',
    agent_id BIGINT NOT NULL COMMENT 'Agent ID',
    skill_id BIGINT NOT NULL COMMENT '技能包ID',
    mount_status VARCHAR(32) NOT NULL DEFAULT 'active' COMMENT '挂载状态：active运行中、standby待命、disabled停用',
    config_json JSON NULL COMMENT '挂载配置JSON',
    sort_order INT NOT NULL DEFAULT 0 COMMENT '排序值，越大越靠前',
    create_time DATETIME NOT NULL COMMENT '挂载时间',
    update_time DATETIME NOT NULL COMMENT '更新时间',
    delete_time DATETIME NULL COMMENT '删除时间，空表示未删除',
    PRIMARY KEY (id),
    UNIQUE KEY uk_agent_skill_mount (agent_id, skill_id),
    KEY idx_agent_skill_mount_agent (agent_id, mount_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Agent技能搭配关系表';

-- Agent 配置事件是智能体轮询同步的来源，也是后续站内通知、管理员审核提醒等通知机制的事件种子；当前先用于 config_changed 拉取提示
CREATE TABLE IF NOT EXISTS agent_config_event (
    id BIGINT NOT NULL COMMENT '主键ID',
    owner_id BIGINT NOT NULL COMMENT '归属用户ID',
    agent_id BIGINT NOT NULL COMMENT 'Agent ID',
    event_type VARCHAR(32) NOT NULL COMMENT '事件类型：config_changed配置变更、backup_ready备份可用',
    event_status VARCHAR(32) NOT NULL DEFAULT 'pending' COMMENT '事件状态：pending待拉取、read已读取',
    payload_json JSON NULL COMMENT '事件载荷JSON，记录变更来源、技能ID等信息',
    read_time DATETIME NULL COMMENT '读取时间',
    create_time DATETIME NOT NULL COMMENT '创建时间',
    update_time DATETIME NOT NULL COMMENT '更新时间',
    delete_time DATETIME NULL COMMENT '删除时间，空表示未删除',
    PRIMARY KEY (id),
    KEY idx_agent_config_event_agent_status (agent_id, event_status, create_time),
    KEY idx_agent_config_event_owner_agent (owner_id, agent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Agent配置变更通知表';
