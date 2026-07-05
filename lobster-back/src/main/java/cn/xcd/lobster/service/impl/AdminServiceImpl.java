package cn.xcd.lobster.service.impl;

import cn.dev33.satoken.stp.StpUtil;
import cn.xcd.lobster.common.exception.BusinessException;
import cn.xcd.lobster.common.result.PageResult;
import cn.xcd.lobster.mapper.SkillPackageMapper;
import cn.xcd.lobster.mapper.UserFeedbackMapper;
import cn.xcd.lobster.mapper.UserMapper;
import cn.xcd.lobster.model.entity.SkillPackage;
import cn.xcd.lobster.model.entity.User;
import cn.xcd.lobster.model.entity.UserFeedback;
import cn.xcd.lobster.model.vo.AdminFeedbackSummaryVO;
import cn.xcd.lobster.model.vo.AdminFeedbackVO;
import cn.xcd.lobster.model.vo.AdminUserVO;
import cn.xcd.lobster.model.vo.SkillPackageVO;
import cn.xcd.lobster.service.AdminService;
import cn.xcd.lobster.service.NotificationService;
import cn.xcd.lobster.service.support.SkillMetadataSupport;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final String ROLE_ADMIN = "admin";
    private static final String ROLE_USER = "user";
    private static final String STATUS_ACTIVE = "active";
    private static final String STATUS_DISABLED = "disabled";
    private static final String VISIBILITY_PUBLIC = "public";
    private static final String VISIBILITY_PRIVATE = "private";
    private static final String STATUS_DRAFT = "draft";
    private static final String STATUS_PENDING = "pending";
    private static final String STATUS_PUBLISHED = "published";
    private static final String STATUS_OFFLINE = "offline";
    private static final String AUDIT_NONE = "none";
    private static final String AUDIT_APPROVED = "approved";
    private static final String AUDIT_REJECTED = "rejected";
    private static final String FEEDBACK_TYPE_GENERAL = "general";
    private static final String FEEDBACK_TYPE_NPS = "nps";
    private static final String FEEDBACK_STATUS_OPEN = "open";
    private static final String FEEDBACK_STATUS_REVIEWED = "reviewed";
    private static final String FEEDBACK_STATUS_CLOSED = "closed";

    private final SkillPackageMapper skillPackageMapper;
    private final UserMapper userMapper;
    private final NotificationService notificationService;
    private final UserFeedbackMapper userFeedbackMapper;

    @Override
    public PageResult<AdminUserVO> pageUsers(Long current, Long size, String keyword) {
        requireAdmin();
        Page<User> page = new Page<>(normalizeCurrent(current), normalizeSize(size));
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<User>()
                .orderByDesc(User::getCreateTime);
        if (StringUtils.hasText(keyword)) {
            String value = keyword.trim();
            wrapper.and(item -> item.like(User::getName, value)
                    .or()
                    .like(User::getAccount, value)
                    .or()
                    .like(User::getRole, value));
        }
        Page<User> result = userMapper.selectPage(page, wrapper);
        return PageResult.of(result.getRecords().stream().map(this::toUserVO).toList(),
                result.getTotal(), result.getCurrent(), result.getSize());
    }

    @Override
    @Transactional
    public AdminUserVO updateUserRole(Long id, String role) {
        User admin = requireAdmin();
        User user = getUser(id);
        String normalizedRole = ROLE_ADMIN.equals(role) ? ROLE_ADMIN : ROLE_USER;
        if (admin.getId().equals(user.getId()) && !ROLE_ADMIN.equals(normalizedRole)) {
            throw new BusinessException(400, "不能取消自己的管理员权限");
        }
        user.setRole(normalizedRole);
        user.setUpdateTime(LocalDateTime.now());
        userMapper.updateById(user);
        return toUserVO(user);
    }

    @Override
    @Transactional
    public AdminUserVO updateUserStatus(Long id, String status) {
        User admin = requireAdmin();
        User user = getUser(id);
        String normalizedStatus = STATUS_DISABLED.equals(status) ? STATUS_DISABLED : STATUS_ACTIVE;
        if (admin.getId().equals(user.getId()) && STATUS_DISABLED.equals(normalizedStatus)) {
            throw new BusinessException(400, "不能禁用自己的账号");
        }
        user.setStatus(normalizedStatus);
        user.setUpdateTime(LocalDateTime.now());
        userMapper.updateById(user);
        return toUserVO(user);
    }

    @Override
    public PageResult<SkillPackageVO> pageSkills(Long current, Long size, String keyword, String auditStatus, String publishStatus) {
        requireAdmin();
        Page<SkillPackage> page = new Page<>(normalizeCurrent(current), normalizeSize(size));
        LambdaQueryWrapper<SkillPackage> wrapper = new LambdaQueryWrapper<SkillPackage>()
                .isNull(SkillPackage::getDeleteTime)
                .orderByDesc(SkillPackage::getUpdateTime);
        wrapper.and(item -> item.ne(SkillPackage::getPublishStatus, STATUS_DRAFT)
                .or()
                .ne(SkillPackage::getAuditStatus, AUDIT_NONE));
        if (StringUtils.hasText(keyword)) {
            String value = keyword.trim();
            wrapper.and(item -> item.like(SkillPackage::getName, value)
                    .or()
                    .like(SkillPackage::getDescription, value)
                    .or()
                    .like(SkillPackage::getCode, value));
        }
        if (StringUtils.hasText(auditStatus)) {
            wrapper.eq(SkillPackage::getAuditStatus, auditStatus.trim());
        }
        if (StringUtils.hasText(publishStatus)) {
            wrapper.eq(SkillPackage::getPublishStatus, publishStatus.trim());
        }
        Page<SkillPackage> result = skillPackageMapper.selectPage(page, wrapper);
        return PageResult.of(result.getRecords().stream().map(this::toSkillVO).toList(),
                result.getTotal(), result.getCurrent(), result.getSize());
    }

    @Override
    @Transactional
    public SkillPackageVO approveSkill(Long id) {
        User admin = requireAdmin();
        SkillPackage skill = getSkill(id);
        LocalDateTime now = LocalDateTime.now();
        skill.setVisibility(VISIBILITY_PUBLIC);
        skill.setPublishStatus(STATUS_PUBLISHED);
        skill.setAuditStatus(AUDIT_APPROVED);
        skill.setAuditReason("");
        skill.setAuditOperatorId(admin.getId());
        skill.setAuditTime(now);
        skill.setUpdateTime(now);
        skillPackageMapper.updateById(skill);
        notificationService.createForUser(
                skill.getOwnerId(),
                admin.getId(),
                "skill_audit",
                "技能审核通过",
                "你的技能「" + skill.getName() + "」已通过审核并上架到技能市场。",
                "skill",
                skill.getId()
        );
        return toSkillVO(skill);
    }

    @Override
    @Transactional
    public SkillPackageVO rejectSkill(Long id, String reason) {
        User admin = requireAdmin();
        SkillPackage skill = getSkill(id);
        LocalDateTime now = LocalDateTime.now();
        skill.setVisibility(VISIBILITY_PRIVATE);
        skill.setPublishStatus(STATUS_DRAFT);
        skill.setAuditStatus(AUDIT_REJECTED);
        skill.setAuditReason(defaultText(reason, "管理员拒绝上架"));
        skill.setAuditOperatorId(admin.getId());
        skill.setAuditTime(now);
        skill.setUpdateTime(now);
        skillPackageMapper.updateById(skill);
        notificationService.createForUser(
                skill.getOwnerId(),
                admin.getId(),
                "skill_audit",
                "技能审核未通过",
                "你的技能「" + skill.getName() + "」未通过审核，原因：" + skill.getAuditReason(),
                "skill",
                skill.getId()
        );
        return toSkillVO(skill);
    }

    @Override
    @Transactional
    public SkillPackageVO publishSkill(Long id) {
        User admin = requireAdmin();
        SkillPackage skill = getSkill(id);
        LocalDateTime now = LocalDateTime.now();
        skill.setVisibility(VISIBILITY_PUBLIC);
        skill.setPublishStatus(STATUS_PUBLISHED);
        skill.setAuditStatus(AUDIT_APPROVED);
        skill.setAuditReason("");
        skill.setAuditOperatorId(admin.getId());
        skill.setAuditTime(now);
        skill.setUpdateTime(now);
        skillPackageMapper.updateById(skill);
        notificationService.createForUser(
                skill.getOwnerId(),
                admin.getId(),
                "skill_audit",
                "技能已上架",
                "管理员已将你的技能「" + skill.getName() + "」上架到技能市场。",
                "skill",
                skill.getId()
        );
        return toSkillVO(skill);
    }

    @Override
    @Transactional
    public SkillPackageVO offlineSkill(Long id) {
        User admin = requireAdmin();
        SkillPackage skill = getSkill(id);
        LocalDateTime now = LocalDateTime.now();
        skill.setPublishStatus(STATUS_OFFLINE);
        skill.setAuditStatus(AUDIT_NONE);
        skill.setAuditReason("");
        skill.setAuditOperatorId(admin.getId());
        skill.setAuditTime(now);
        skill.setUpdateTime(now);
        skillPackageMapper.updateById(skill);
        notificationService.createForUser(
                skill.getOwnerId(),
                admin.getId(),
                "skill_audit",
                "技能已下架",
                "管理员已将你的技能「" + skill.getName() + "」从技能市场下架。",
                "skill",
                skill.getId()
        );
        return toSkillVO(skill);
    }

    @Override
    public PageResult<AdminFeedbackVO> pageFeedback(Long current, Long size, String feedbackType, String status, String keyword) {
        requireAdmin();
        Page<UserFeedback> page = new Page<>(normalizeCurrent(current), normalizeSize(size));
        LambdaQueryWrapper<UserFeedback> wrapper = new LambdaQueryWrapper<UserFeedback>()
                .isNull(UserFeedback::getDeleteTime)
                .orderByDesc(UserFeedback::getCreateTime);
        if (StringUtils.hasText(feedbackType)) {
            wrapper.eq(UserFeedback::getFeedbackType, feedbackType.trim());
        }
        if (StringUtils.hasText(status)) {
            wrapper.eq(UserFeedback::getStatus, status.trim());
        }
        if (StringUtils.hasText(keyword)) {
            String value = keyword.trim();
            wrapper.and(item -> item.like(UserFeedback::getContent, value)
                    .or()
                    .like(UserFeedback::getCategory, value)
                    .or()
                    .like(UserFeedback::getPageUrl, value));
        }
        Page<UserFeedback> result = userFeedbackMapper.selectPage(page, wrapper);
        return PageResult.of(result.getRecords().stream().map(this::toFeedbackVO).toList(),
                result.getTotal(), result.getCurrent(), result.getSize());
    }

    @Override
    public AdminFeedbackSummaryVO summarizeFeedback() {
        requireAdmin();
        List<UserFeedback> records = userFeedbackMapper.selectList(new LambdaQueryWrapper<UserFeedback>()
                .isNull(UserFeedback::getDeleteTime));
        long totalCount = records.size();
        long generalCount = records.stream().filter(item -> FEEDBACK_TYPE_GENERAL.equals(item.getFeedbackType())).count();
        long npsCount = records.stream().filter(item -> FEEDBACK_TYPE_NPS.equals(item.getFeedbackType())).count();
        List<Integer> npsScores = records.stream()
                .filter(item -> FEEDBACK_TYPE_NPS.equals(item.getFeedbackType()) && item.getScore() != null)
                .map(UserFeedback::getScore)
                .toList();
        double averageScore = npsScores.isEmpty()
                ? 0.0
                : Math.round(npsScores.stream().mapToInt(Integer::intValue).average().orElse(0.0) * 10.0) / 10.0;
        long promoterCount = npsScores.stream().filter(score -> score >= 9).count();
        long passiveCount = npsScores.stream().filter(score -> score >= 7 && score <= 8).count();
        long detractorCount = npsScores.stream().filter(score -> score <= 6).count();
        long openCount = records.stream().filter(item -> FEEDBACK_STATUS_OPEN.equals(item.getStatus())).count();
        return new AdminFeedbackSummaryVO(
                totalCount,
                generalCount,
                npsCount,
                averageScore,
                promoterCount,
                passiveCount,
                detractorCount,
                openCount
        );
    }

    @Override
    @Transactional
    public AdminFeedbackVO updateFeedbackStatus(Long id, String status) {
        requireAdmin();
        UserFeedback feedback = getFeedback(id);
        String normalizedStatus = normalizeFeedbackStatus(status);
        feedback.setStatus(normalizedStatus);
        feedback.setUpdateTime(LocalDateTime.now());
        userFeedbackMapper.updateById(feedback);
        return toFeedbackVO(feedback);
    }
    private User requireAdmin() {
        Object loginId = StpUtil.getLoginId();
        User user = userMapper.selectById(Long.valueOf(String.valueOf(loginId)));
        if (user == null || !ROLE_ADMIN.equals(user.getRole())) {
            throw new BusinessException(403, "需要管理员权限");
        }
        return user;
    }

    private SkillPackage getSkill(Long id) {
        if (id == null) {
            throw new BusinessException(400, "技能ID不能为空");
        }
        SkillPackage skill = skillPackageMapper.selectById(id);
        if (skill == null || skill.getDeleteTime() != null) {
            throw new BusinessException(404, "技能不存在");
        }
        return skill;
    }

    private UserFeedback getFeedback(Long id) {
        if (id == null) {
            throw new BusinessException(400, "反馈ID不能为空");
        }
        UserFeedback feedback = userFeedbackMapper.selectById(id);
        if (feedback == null || feedback.getDeleteTime() != null) {
            throw new BusinessException(404, "反馈不存在");
        }
        return feedback;
    }
    private User getUser(Long id) {
        if (id == null) {
            throw new BusinessException(400, "用户ID不能为空");
        }
        User user = userMapper.selectById(id);
        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }
        return user;
    }

    private AdminUserVO toUserVO(User user) {
        return new AdminUserVO(
                String.valueOf(user.getId()),
                defaultText(user.getName(), user.getAccount()),
                user.getAccount(),
                defaultText(user.getRole(), "user"),
                defaultText(user.getStatus(), STATUS_ACTIVE),
                defaultText(user.getAvatar(), ""),
                formatDate(user.getCreateTime()),
                formatDate(user.getLastLoginTime())
        );
    }

    private SkillPackageVO toSkillVO(SkillPackage skill) {
        User owner = userMapper.selectById(skill.getOwnerId());
        return new SkillPackageVO(
                String.valueOf(skill.getId()),
                skill.getName(),
                skill.getCode(),
                defaultText(skill.getDescription(), ""),
                defaultText(skill.getIcon(), "Sparkles"),
                defaultText(skill.getVersion(), "1.0.0"),
                defaultText(skill.getVisibility(), VISIBILITY_PRIVATE),
                defaultText(skill.getPublishStatus(), STATUS_DRAFT),
                SkillMetadataSupport.runtimeEnvironments(skill.getExtJson()),
                SkillMetadataSupport.coreCapabilities(skill.getExtJson()),
                defaultText(skill.getAuditStatus(), AUDIT_NONE),
                defaultText(skill.getAuditReason(), ""),
                skill.getAuditTime() == null ? "" : skill.getAuditTime().toString(),
                skill.getInstallCount() == null ? 0 : skill.getInstallCount(),
                owner == null ? "未知用户" : defaultText(owner.getName(), owner.getAccount()),
                List.of()
        );
    }

    private AdminFeedbackVO toFeedbackVO(UserFeedback feedback) {
        User submitter = feedback.getUserId() == null ? null : userMapper.selectById(feedback.getUserId());
        String username = submitter == null ? "未知用户" : defaultText(submitter.getName(), submitter.getAccount());
        String account = submitter == null ? "" : defaultText(submitter.getAccount(), "");
        return new AdminFeedbackVO(
                String.valueOf(feedback.getId()),
                feedback.getUserId() == null ? "" : String.valueOf(feedback.getUserId()),
                username,
                account,
                defaultText(feedback.getFeedbackType(), FEEDBACK_TYPE_GENERAL),
                feedback.getScore(),
                defaultText(feedback.getCategory(), ""),
                defaultText(feedback.getContent(), ""),
                defaultText(feedback.getPageUrl(), ""),
                defaultText(feedback.getUserAgent(), ""),
                defaultText(feedback.getStatus(), FEEDBACK_STATUS_OPEN),
                feedback.getCreateTime() == null ? "" : feedback.getCreateTime().toString()
        );
    }
    private Long normalizeCurrent(Long current) {
        return current == null || current < 1 ? 1 : current;
    }

    private Long normalizeSize(Long size) {
        if (size == null || size < 1) {
            return 12L;
        }
        return Math.min(size, 100L);
    }

    private String normalizeFeedbackStatus(String status) {
        if (!StringUtils.hasText(status)) {
            throw new BusinessException(400, "反馈状态不能为空");
        }
        String value = status.trim();
        if (FEEDBACK_STATUS_OPEN.equals(value) || FEEDBACK_STATUS_REVIEWED.equals(value) || FEEDBACK_STATUS_CLOSED.equals(value)) {
            return value;
        }
        throw new BusinessException(400, "反馈状态不合法");
    }
    private String formatDate(LocalDateTime value) {
        return value == null ? "" : DATE_FORMATTER.format(value);
    }

    private String defaultText(String value, String fallback) {
        return StringUtils.hasText(value) ? value.trim() : fallback;
    }
}
