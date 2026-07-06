package cn.xcd.lobster.service.impl;

import cn.dev33.satoken.stp.StpUtil;
import cn.xcd.lobster.common.exception.BusinessException;
import cn.xcd.lobster.common.result.PageResult;
import cn.xcd.lobster.mapper.SkillFileMapper;
import cn.xcd.lobster.mapper.SkillPackageMapper;
import cn.xcd.lobster.mapper.SkillPublishApplyLogMapper;
import cn.xcd.lobster.mapper.UserMapper;
import cn.xcd.lobster.mapper.UserSkillInstallMapper;
import cn.xcd.lobster.model.dto.SkillFileRequest;
import cn.xcd.lobster.model.dto.SkillSaveRequest;
import cn.xcd.lobster.model.entity.AgentToken;
import cn.xcd.lobster.model.entity.SkillFile;
import cn.xcd.lobster.model.entity.SkillPackage;
import cn.xcd.lobster.model.entity.SkillPublishApplyLog;
import cn.xcd.lobster.model.entity.User;
import cn.xcd.lobster.model.entity.UserSkillInstall;
import cn.xcd.lobster.model.vo.SkillFileVO;
import cn.xcd.lobster.model.vo.SkillPackageVO;
import cn.xcd.lobster.service.NotificationService;
import cn.xcd.lobster.service.SkillService;
import cn.xcd.lobster.service.support.SkillMetadataSupport;
import com.github.houbb.sensitive.word.bs.SensitiveWordBs;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SkillServiceImpl implements SkillService {

    private static final String VISIBILITY_PRIVATE = "private";
    private static final String VISIBILITY_PUBLIC = "public";
    private static final String STATUS_DRAFT = "draft";
    private static final String STATUS_PENDING = "pending";
    private static final String STATUS_PUBLISHED = "published";
    private static final String STATUS_OFFLINE = "offline";
    private static final String AUDIT_NONE = "none";
    private static final String AUDIT_PENDING = "pending";
    private static final String AUDIT_APPROVED = "approved";
    private static final int DAILY_PUBLISH_APPLY_LIMIT = 5;
    private static final String NODE_FOLDER = "folder";
    private static final String NODE_FILE = "file";

    private final SkillPackageMapper skillPackageMapper;
    private final SkillFileMapper skillFileMapper;
    private final SkillPublishApplyLogMapper skillPublishApplyLogMapper;
    private final UserSkillInstallMapper userSkillInstallMapper;
    private final UserMapper userMapper;
    private final SensitiveWordBs sensitiveWordBs;
    private final NotificationService notificationService;

    @Override
    public PageResult<SkillPackageVO> market(Long current, Long size, String keyword) {
        Page<SkillPackage> page = new Page<>(normalizeCurrent(current), normalizeSize(size));
        LambdaQueryWrapper<SkillPackage> wrapper = new LambdaQueryWrapper<SkillPackage>()
                .eq(SkillPackage::getVisibility, VISIBILITY_PUBLIC)
                .eq(SkillPackage::getPublishStatus, STATUS_PUBLISHED)
                .isNull(SkillPackage::getDeleteTime)
                .orderByDesc(SkillPackage::getInstallCount)
                .orderByDesc(SkillPackage::getUpdateTime);
        if (StringUtils.hasText(keyword)) {
            String value = keyword.trim();
            wrapper.and(item -> item.like(SkillPackage::getName, value)
                    .or()
                    .like(SkillPackage::getDescription, value)
                    .or()
                    .like(SkillPackage::getCode, value));
        }
        Page<SkillPackage> result = skillPackageMapper.selectPage(page, wrapper);
        return PageResult.of(result.getRecords().stream().map(skill -> toSkillVO(skill, false)).toList(),
                result.getTotal(), result.getCurrent(), result.getSize());
    }

    @Override
    public PageResult<SkillPackageVO> mine(Long current, Long size) {
        Long ownerId = currentUserId();
        Page<SkillPackage> page = new Page<>(normalizeCurrent(current), normalizeSize(size));
        Page<SkillPackage> result = skillPackageMapper.selectPage(page, new LambdaQueryWrapper<SkillPackage>()
                .eq(SkillPackage::getOwnerId, ownerId)
                .isNull(SkillPackage::getDeleteTime)
                .orderByDesc(SkillPackage::getUpdateTime));
        return PageResult.of(result.getRecords().stream().map(skill -> toSkillVO(skill, false)).toList(),
                result.getTotal(), result.getCurrent(), result.getSize());
    }

    @Override
    public List<SkillPackageVO> mineByToken(AgentToken token) {
        return listOwnedSkills(token.getOwnerId());
    }

    private List<SkillPackageVO> listOwnedSkills(Long ownerId) {
        return skillPackageMapper.selectList(new LambdaQueryWrapper<SkillPackage>()
                        .eq(SkillPackage::getOwnerId, ownerId)
                        .isNull(SkillPackage::getDeleteTime)
                        .orderByDesc(SkillPackage::getUpdateTime))
                .stream()
                .map(skill -> toSkillVO(skill, false))
                .toList();
    }

    @Override
    public PageResult<SkillPackageVO> installed(Long current, Long size) {
        Long userId = currentUserId();
        Page<UserSkillInstall> page = new Page<>(normalizeCurrent(current), normalizeSize(size));
        Page<UserSkillInstall> result = userSkillInstallMapper.selectPage(page, new LambdaQueryWrapper<UserSkillInstall>()
                .eq(UserSkillInstall::getUserId, userId)
                .isNull(UserSkillInstall::getDeleteTime)
                .orderByDesc(UserSkillInstall::getCreateTime));
        List<SkillPackageVO> records = result.getRecords().stream()
                .map(UserSkillInstall::getSkillId)
                .map(skillPackageMapper::selectById)
                .filter(skill -> skill != null && skill.getDeleteTime() == null)
                .map(skill -> toSkillVO(skill, false))
                .toList();
        return PageResult.of(records, result.getTotal(), result.getCurrent(), result.getSize());
    }

    @Override
    public SkillPackageVO detail(Long id) {
        SkillPackage skill = getReadableSkill(id);
        return toSkillVO(skill, true);
    }

    @Override
    public SkillPackageVO detailByToken(AgentToken token, String idOrCode) {
        SkillPackage skill = getReadableSkill(idOrCode, token.getOwnerId());
        return toSkillVO(skill, true);
    }

    @Override
    @Transactional
    public SkillPackageVO create(SkillSaveRequest request) {
        return createForOwner(currentUserId(), request, "{}");
    }

    @Override
    @Transactional
    public SkillPackageVO createByToken(AgentToken token, SkillSaveRequest request) {
        String extJson = token.getAgentId() == null
                ? "{\"source\":\"agent-token\"}"
                : "{\"source\":\"agent-token\",\"agentId\":\"" + token.getAgentId() + "\"}";
        SkillPackage existing = findOwnedSkillByCode(token.getOwnerId(), request);
        if (existing != null) {
            return updateForOwner(token.getOwnerId(), existing.getId(), request);
        }
        return createForOwner(token.getOwnerId(), request, extJson);
    }

    private SkillPackageVO createForOwner(Long ownerId, SkillSaveRequest request, String extJson) {
        LocalDateTime now = LocalDateTime.now();
        SkillPackage skill = new SkillPackage();
        skill.setOwnerId(ownerId);
        skill.setName(request.getName().trim());
        skill.setCode(uniqueCode(ownerId, StringUtils.hasText(request.getCode()) ? request.getCode() : request.getName()));
        skill.setDescription(defaultText(request.getDescription(), ""));
        skill.setIcon(defaultText(request.getIcon(), "Sparkles"));
        skill.setVersion(defaultText(request.getVersion(), "1.0.0"));
        skill.setVisibility(normalizeVisibility(request.getVisibility()));
        skill.setPublishStatus(normalizeStatus(request.getPublishStatus(), STATUS_DRAFT));
        skill.setAuditStatus(AUDIT_NONE);
        skill.setInstallCount(0);
        skill.setExtJson(SkillMetadataSupport.merge(extJson, request.getRuntimeEnvironments(), request.getCoreCapabilities()));
        skill.setCreateTime(now);
        skill.setUpdateTime(now);
        skillPackageMapper.insert(skill);
        replaceFiles(skill.getId(), request.getFiles());
        return toSkillVO(skill, true);
    }

    @Override
    @Transactional
    public SkillPackageVO update(Long id, SkillSaveRequest request) {
        return updateForOwner(currentUserId(), id, request);
    }

    @Override
    @Transactional
    public SkillPackageVO updateByToken(AgentToken token, Long id, SkillSaveRequest request) {
        return updateForOwner(token.getOwnerId(), id, request);
    }

    private SkillPackageVO updateForOwner(Long ownerId, Long id, SkillSaveRequest request) {
        SkillPackage skill = getOwnedSkill(id, ownerId);
        boolean wasPublished = STATUS_PUBLISHED.equals(skill.getPublishStatus());
        skill.setName(request.getName().trim());
        skill.setDescription(defaultText(request.getDescription(), ""));
        skill.setIcon(defaultText(request.getIcon(), "Sparkles"));
        skill.setVersion(defaultText(request.getVersion(), skill.getVersion()));
        skill.setVisibility(normalizeVisibility(request.getVisibility()));
        skill.setPublishStatus(normalizeStatus(request.getPublishStatus(), skill.getPublishStatus()));
        skill.setExtJson(SkillMetadataSupport.merge(skill.getExtJson(), request.getRuntimeEnvironments(), request.getCoreCapabilities()));
        if (!AUDIT_PENDING.equals(skill.getAuditStatus())) {
            skill.setAuditStatus(AUDIT_NONE);
            skill.setAuditReason(null);
            skill.setAuditOperatorId(null);
            skill.setAuditTime(null);
        }
        skill.setUpdateTime(LocalDateTime.now());
        replaceFiles(skill.getId(), request.getFiles());
        if (wasPublished && STATUS_PUBLISHED.equals(skill.getPublishStatus())) {
            reviewPublishedUpdate(skill);
        }
        skillPackageMapper.updateById(skill);
        return toSkillVO(skill, true);
    }

    @Override
    @Transactional
    public SkillPackageVO publish(Long id) {
        SkillPackage skill = getOwnedSkill(id);
        if (AUDIT_PENDING.equals(skill.getAuditStatus()) && STATUS_PENDING.equals(skill.getPublishStatus())) {
            throw new BusinessException(400, "该技能已提交审核，请等待管理员处理");
        }
        assertPublishApplyQuota(skill.getOwnerId());
        List<String> sensitiveWords = findSensitiveWords(skill);
        String applyResult;
        String applyReason;
        if (sensitiveWords.isEmpty()) {
            skill.setVisibility(VISIBILITY_PUBLIC);
            skill.setPublishStatus(STATUS_PUBLISHED);
            skill.setAuditStatus(AUDIT_APPROVED);
            skill.setAuditReason("");
            skill.setAuditOperatorId(null);
            skill.setAuditTime(LocalDateTime.now());
            applyResult = "published";
            applyReason = "";
        } else {
            skill.setVisibility(VISIBILITY_PRIVATE);
            skill.setPublishStatus(STATUS_PENDING);
            skill.setAuditStatus(AUDIT_PENDING);
            skill.setAuditReason("命中敏感词：" + String.join("、", sensitiveWords));
            skill.setAuditOperatorId(null);
            skill.setAuditTime(null);
            applyResult = "pending";
            applyReason = skill.getAuditReason();
        }
        skill.setUpdateTime(LocalDateTime.now());
        skillPackageMapper.updateById(skill);
        recordPublishApply(skill, applyResult, applyReason);
        notifyPublishResult(skill, sensitiveWords.isEmpty());
        return toSkillVO(skill, true);
    }

    @Override
    @Transactional
    public SkillPackageVO offline(Long id) {
        SkillPackage skill = getOwnedSkill(id);
        skill.setPublishStatus(STATUS_OFFLINE);
        skill.setAuditStatus(AUDIT_NONE);
        skill.setUpdateTime(LocalDateTime.now());
        skillPackageMapper.updateById(skill);
        return toSkillVO(skill, true);
    }

    @Override
    @Transactional
    public SkillPackageVO install(Long id) {
        SkillPackage skill = getReadableSkill(id);
        Long userId = currentUserId();
        UserSkillInstall existing = userSkillInstallMapper.selectOne(new LambdaQueryWrapper<UserSkillInstall>()
                .eq(UserSkillInstall::getUserId, userId)
                .eq(UserSkillInstall::getSkillId, id)
                .last("limit 1"));
        LocalDateTime now = LocalDateTime.now();
        if (existing == null) {
            UserSkillInstall install = new UserSkillInstall();
            install.setUserId(userId);
            install.setSkillId(id);
            install.setInstallVersion(skill.getVersion());
            install.setConfigJson("{}");
            install.setCreateTime(now);
            install.setUpdateTime(now);
            userSkillInstallMapper.insert(install);
            skill.setInstallCount((skill.getInstallCount() == null ? 0 : skill.getInstallCount()) + 1);
            skill.setUpdateTime(now);
            skillPackageMapper.updateById(skill);
        } else if (existing.getDeleteTime() != null) {
            existing.setDeleteTime(null);
            existing.setInstallVersion(skill.getVersion());
            existing.setUpdateTime(now);
            userSkillInstallMapper.updateById(existing);
            skill.setInstallCount((skill.getInstallCount() == null ? 0 : skill.getInstallCount()) + 1);
            skill.setUpdateTime(now);
            skillPackageMapper.updateById(skill);
        }
        return toSkillVO(skill, true);
    }

    @Override
    @Transactional
    public SkillPackageVO fork(Long id) {
        SkillPackage source = getReadableSkill(id);
        Long ownerId = currentUserId();
        LocalDateTime now = LocalDateTime.now();

        SkillPackage target = new SkillPackage();
        target.setOwnerId(ownerId);
        target.setName(source.getName() + " (副本)");
        target.setCode(uniqueCode(ownerId, source.getName() + "-copy"));
        target.setDescription(defaultText(source.getDescription(), ""));
        target.setIcon(defaultText(source.getIcon(), "Sparkles"));
        target.setVersion(defaultText(source.getVersion(), "1.0.0"));
        target.setVisibility(VISIBILITY_PRIVATE);
        target.setPublishStatus(STATUS_DRAFT);
        target.setAuditStatus(AUDIT_NONE);
        target.setInstallCount(0);
        target.setExtJson(SkillMetadataSupport.merge(
                "{\"sourceSkillId\":\"" + source.getId() + "\"}",
                SkillMetadataSupport.runtimeEnvironments(source.getExtJson()),
                SkillMetadataSupport.coreCapabilities(source.getExtJson())
        ));
        target.setCreateTime(now);
        target.setUpdateTime(now);
        skillPackageMapper.insert(target);

        copyFiles(source.getId(), target.getId(), now);
        return toSkillVO(target, true);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        SkillPackage skill = getOwnedSkill(id);
        LocalDateTime now = LocalDateTime.now();
        skill.setDeleteTime(now);
        skill.setUpdateTime(now);
        skillPackageMapper.updateById(skill);

        List<UserSkillInstall> installs = userSkillInstallMapper.selectList(new LambdaQueryWrapper<UserSkillInstall>()
                .eq(UserSkillInstall::getSkillId, id)
                .isNull(UserSkillInstall::getDeleteTime));
        for (UserSkillInstall install : installs) {
            install.setDeleteTime(now);
            install.setUpdateTime(now);
            userSkillInstallMapper.updateById(install);
        }
    }

    @Override
    @Transactional
    public void uninstall(Long id) {
        Long userId = currentUserId();
        UserSkillInstall install = userSkillInstallMapper.selectOne(new LambdaQueryWrapper<UserSkillInstall>()
                .eq(UserSkillInstall::getUserId, userId)
                .eq(UserSkillInstall::getSkillId, id)
                .isNull(UserSkillInstall::getDeleteTime)
                .last("limit 1"));
        if (install == null) {
            return;
        }
        install.setDeleteTime(LocalDateTime.now());
        install.setUpdateTime(install.getDeleteTime());
        userSkillInstallMapper.updateById(install);

        SkillPackage skill = skillPackageMapper.selectById(id);
        if (skill != null && skill.getInstallCount() != null && skill.getInstallCount() > 0) {
            skill.setInstallCount(skill.getInstallCount() - 1);
            skill.setUpdateTime(LocalDateTime.now());
            skillPackageMapper.updateById(skill);
        }
    }

    private void replaceFiles(Long skillId, List<SkillFileRequest> requests) {
        skillFileMapper.delete(new LambdaQueryWrapper<SkillFile>()
                .eq(SkillFile::getSkillId, skillId));

        List<SkillFileRequest> normalized = normalizeFiles(requests);
        Map<String, Long> pathIdMap = new LinkedHashMap<>();
        LocalDateTime now = LocalDateTime.now();
        int index = 0;
        for (SkillFileRequest request : normalized) {
            SkillFile file = new SkillFile();
            file.setSkillId(skillId);
            file.setParentId(parentIdFor(pathIdMap, request.getPath()));
            file.setNodeType(request.getNodeType());
            file.setName(request.getName());
            file.setPath(request.getPath());
            file.setLanguage(request.getLanguage());
            file.setContent(NODE_FILE.equals(request.getNodeType()) ? defaultText(request.getContent(), "") : null);
            file.setSortOrder(request.getSortOrder() == null ? index : request.getSortOrder());
            file.setCreateTime(now);
            file.setUpdateTime(now);
            skillFileMapper.insert(file);
            pathIdMap.put(file.getPath(), file.getId());
            index++;
        }
    }

    private void copyFiles(Long sourceSkillId, Long targetSkillId, LocalDateTime now) {
        List<SkillFile> sourceFiles = skillFileMapper.selectList(new LambdaQueryWrapper<SkillFile>()
                        .eq(SkillFile::getSkillId, sourceSkillId)
                        .isNull(SkillFile::getDeleteTime))
                .stream()
                .sorted(Comparator.comparingInt((SkillFile file) -> file.getPath().split("/").length)
                        .thenComparing(SkillFile::getPath))
                .toList();
        Map<Long, Long> copiedIdMap = new LinkedHashMap<>();
        for (SkillFile source : sourceFiles) {
            SkillFile target = new SkillFile();
            target.setSkillId(targetSkillId);
            target.setParentId(source.getParentId() == null ? null : copiedIdMap.get(source.getParentId()));
            target.setNodeType(source.getNodeType());
            target.setName(source.getName());
            target.setPath(source.getPath());
            target.setLanguage(source.getLanguage());
            target.setContent(source.getContent());
            target.setSortOrder(source.getSortOrder());
            target.setCreateTime(now);
            target.setUpdateTime(now);
            skillFileMapper.insert(target);
            copiedIdMap.put(source.getId(), target.getId());
        }
    }

    private List<SkillFileRequest> normalizeFiles(List<SkillFileRequest> requests) {
        Map<String, SkillFileRequest> result = new LinkedHashMap<>();
        if (requests == null || requests.isEmpty()) {
            SkillFileRequest readme = new SkillFileRequest();
            readme.setNodeType(NODE_FILE);
            readme.setName("SKILL.md");
            readme.setPath("SKILL.md");
            readme.setLanguage("markdown");
            readme.setContent("# Skill\n\n请在这里描述技能用途、接口说明和调用示例。\n");
            result.put(readme.getPath(), readme);
            return new ArrayList<>(result.values());
        }

        int index = 0;
        for (SkillFileRequest item : requests) {
            if (item == null || !StringUtils.hasText(item.getPath())) {
                continue;
            }
            String path = normalizePath(item.getPath());
            String[] segments = path.split("/");
            StringBuilder folderPath = new StringBuilder();
            for (int i = 0; i < segments.length - 1; i++) {
                String segment = segments[i];
                if (folderPath.length() > 0) {
                    folderPath.append("/");
                }
                folderPath.append(segment);
                String currentPath = folderPath.toString();
                result.computeIfAbsent(currentPath, ignored -> {
                    SkillFileRequest folder = new SkillFileRequest();
                    folder.setNodeType(NODE_FOLDER);
                    folder.setName(segment);
                    folder.setPath(currentPath);
                    folder.setSortOrder(0);
                    return folder;
                });
            }
            SkillFileRequest file = new SkillFileRequest();
            file.setNodeType(NODE_FILE);
            file.setName(StringUtils.hasText(item.getName()) ? item.getName().trim() : segments[segments.length - 1]);
            file.setPath(path);
            file.setLanguage(defaultText(item.getLanguage(), languageFromPath(path)));
            file.setContent(defaultText(item.getContent(), ""));
            file.setSortOrder(item.getSortOrder() == null ? index : item.getSortOrder());
            result.put(path, file);
            index++;
        }
        return result.values().stream()
                .sorted(Comparator.comparingInt((SkillFileRequest item) -> item.getPath().split("/").length)
                        .thenComparing(SkillFileRequest::getPath))
                .toList();
    }

    private Long parentIdFor(Map<String, Long> pathIdMap, String path) {
        int index = path.lastIndexOf('/');
        if (index < 0) {
            return null;
        }
        return pathIdMap.get(path.substring(0, index));
    }

    private SkillPackage getOwnedSkill(Long id) {
        return getOwnedSkill(id, currentUserId());
    }

    private SkillPackage getOwnedSkill(Long id, Long ownerId) {
        SkillPackage skill = skillPackageMapper.selectOne(new LambdaQueryWrapper<SkillPackage>()
                .eq(SkillPackage::getId, id)
                .eq(SkillPackage::getOwnerId, ownerId)
                .isNull(SkillPackage::getDeleteTime)
                .last("limit 1"));
        if (skill == null) {
            throw new BusinessException(404, "技能不存在");
        }
        return skill;
    }

    private SkillPackage getReadableSkill(Long id) {
        return getReadableSkill(id, currentUserId());
    }

    private SkillPackage getReadableSkill(Long id, Long userId) {
        SkillPackage skill = skillPackageMapper.selectById(id);
        if (skill == null || skill.getDeleteTime() != null) {
            throw new BusinessException(404, "技能不存在");
        }
        boolean own = userId.equals(skill.getOwnerId());
        boolean publicPublished = VISIBILITY_PUBLIC.equals(skill.getVisibility())
                && STATUS_PUBLISHED.equals(skill.getPublishStatus());
        if (!own && !publicPublished) {
            throw new BusinessException(403, "无权查看该技能");
        }
        return skill;
    }

    private SkillPackage getReadableSkill(String idOrCode, Long userId) {
        if (!StringUtils.hasText(idOrCode)) {
            throw new BusinessException(400, "技能标识不能为空");
        }
        String value = idOrCode.trim();
        SkillPackage skill = null;
        try {
            skill = skillPackageMapper.selectById(Long.valueOf(value));
        } catch (NumberFormatException ignored) {
            // Non-numeric identifiers are stable Skill Package codes.
        }
        if (skill == null || skill.getDeleteTime() != null) {
            skill = skillPackageMapper.selectOne(new LambdaQueryWrapper<SkillPackage>()
                    .eq(SkillPackage::getOwnerId, userId)
                    .eq(SkillPackage::getCode, value)
                    .isNull(SkillPackage::getDeleteTime)
                    .last("limit 1"));
        }
        if (skill == null) {
            skill = skillPackageMapper.selectOne(new LambdaQueryWrapper<SkillPackage>()
                    .eq(SkillPackage::getCode, value)
                    .eq(SkillPackage::getVisibility, VISIBILITY_PUBLIC)
                    .eq(SkillPackage::getPublishStatus, STATUS_PUBLISHED)
                    .isNull(SkillPackage::getDeleteTime)
                    .last("limit 1"));
        }
        if (skill == null || skill.getDeleteTime() != null) {
            throw new BusinessException(404, "技能不存在");
        }
        boolean own = userId.equals(skill.getOwnerId());
        boolean publicPublished = VISIBILITY_PUBLIC.equals(skill.getVisibility())
                && STATUS_PUBLISHED.equals(skill.getPublishStatus());
        if (!own && !publicPublished) {
            throw new BusinessException(403, "无权查看该技能");
        }
        return skill;
    }

    private SkillPackageVO toSkillVO(SkillPackage skill, boolean withFiles) {
        User owner = userMapper.selectById(skill.getOwnerId());
        List<SkillFileVO> files = withFiles ? listFileVOs(skill.getId()) : List.of();
        Integer fileCount = withFiles ? files.size() : countSkillFiles(skill.getId());
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
                fileCount,
                owner == null ? "未知用户" : defaultText(owner.getName(), owner.getAccount()),
                files
        );
    }

    private Integer countSkillFiles(Long skillId) {
        Long count = skillFileMapper.selectCount(new LambdaQueryWrapper<SkillFile>()
                .eq(SkillFile::getSkillId, skillId)
                .isNull(SkillFile::getDeleteTime));
        return count == null ? 0 : count.intValue();
    }

    private List<String> findSensitiveWords(SkillPackage skill) {
        String content = String.join("\n",
                defaultText(skill.getName(), ""),
                defaultText(skill.getDescription(), ""),
                defaultText(skill.getCode(), ""),
                SkillMetadataSupport.searchableText(skill.getExtJson()),
                String.join("\n", listFileVOs(skill.getId()).stream()
                        .filter(file -> NODE_FILE.equals(file.getNodeType()))
                        .map(file -> defaultText(file.getContent(), ""))
                        .toList()));
        if (!sensitiveWordBs.contains(content)) {
            return List.of();
        }
        return sensitiveWordBs.findAll(content).stream()
                .filter(StringUtils::hasText)
                .distinct()
                .limit(20)
                .toList();
    }

    private void reviewPublishedUpdate(SkillPackage skill) {
        List<String> sensitiveWords = findSensitiveWords(skill);
        if (sensitiveWords.isEmpty()) {
            skill.setVisibility(VISIBILITY_PUBLIC);
            skill.setPublishStatus(STATUS_PUBLISHED);
            skill.setAuditStatus(AUDIT_APPROVED);
            skill.setAuditReason("");
            skill.setAuditOperatorId(null);
            skill.setAuditTime(LocalDateTime.now());
            return;
        }
        skill.setVisibility(VISIBILITY_PRIVATE);
        skill.setPublishStatus(STATUS_PENDING);
        skill.setAuditStatus(AUDIT_PENDING);
        skill.setAuditReason("命中敏感词：" + String.join("、", sensitiveWords));
        skill.setAuditOperatorId(null);
        skill.setAuditTime(null);
        notificationService.createForUser(
                skill.getOwnerId(),
                null,
                "skill_audit",
                "技能进入审核",
                "你的技能「" + skill.getName() + "」编辑后命中敏感词检测，已重新提交管理员审核，审核通过后会恢复上架到技能市场。",
                "skill",
                skill.getId()
        );
    }

    private List<SkillFileVO> listFileVOs(Long skillId) {
        return skillFileMapper.selectList(new LambdaQueryWrapper<SkillFile>()
                        .eq(SkillFile::getSkillId, skillId)
                        .isNull(SkillFile::getDeleteTime)
                        .orderByAsc(SkillFile::getSortOrder)
                        .orderByAsc(SkillFile::getPath))
                .stream()
                .map(file -> new SkillFileVO(
                        String.valueOf(file.getId()),
                        file.getParentId() == null ? null : String.valueOf(file.getParentId()),
                        file.getNodeType(),
                        file.getName(),
                        file.getPath(),
                        file.getLanguage(),
                        file.getContent(),
                        contentSize(file.getContent()),
                        file.getSortOrder()
                ))
                .toList();
    }

    private Long currentUserId() {
        return Long.valueOf(String.valueOf(StpUtil.getLoginId()));
    }

    private void assertPublishApplyQuota(Long userId) {
        LocalDate today = LocalDate.now();
        Long count = skillPublishApplyLogMapper.selectCount(new LambdaQueryWrapper<SkillPublishApplyLog>()
                .eq(SkillPublishApplyLog::getUserId, userId)
                .ge(SkillPublishApplyLog::getCreateTime, today.atStartOfDay())
                .lt(SkillPublishApplyLog::getCreateTime, today.plusDays(1).atStartOfDay()));
        if (count != null && count >= DAILY_PUBLISH_APPLY_LIMIT) {
            throw new BusinessException(429, "今日发布申请次数已达上限，请明天再试");
        }
    }

    private void recordPublishApply(SkillPackage skill, String applyResult, String reason) {
        SkillPublishApplyLog log = new SkillPublishApplyLog();
        log.setUserId(skill.getOwnerId());
        log.setSkillId(skill.getId());
        log.setApplyResult(applyResult);
        log.setReason(reason);
        log.setCreateTime(LocalDateTime.now());
        skillPublishApplyLogMapper.insert(log);
    }

    private void notifyPublishResult(SkillPackage skill, boolean published) {
        if (published) {
            notificationService.createForUser(
                    skill.getOwnerId(),
                    null,
                    "skill_audit",
                    "技能已发布",
                    "你的技能「" + skill.getName() + "」已通过自动检测并上架到技能市场。",
                    "skill",
                    skill.getId()
            );
            return;
        }
        notificationService.createForUser(
                skill.getOwnerId(),
                null,
                "skill_audit",
                "技能进入审核",
                "你的技能「" + skill.getName() + "」命中敏感词检测，已提交管理员审核，审核通过后会上架到技能市场。",
                "skill",
                skill.getId()
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

    private String uniqueCode(Long ownerId, String name) {
        String base = normalizeCode(name);
        String candidate = base;
        int index = 1;
        while (skillPackageMapper.selectCount(new LambdaQueryWrapper<SkillPackage>()
                .eq(SkillPackage::getOwnerId, ownerId)
                .eq(SkillPackage::getCode, candidate)) > 0) {
            candidate = base + "-" + index++;
        }
        return candidate;
    }

    private String normalizeCode(String value) {
        String base = defaultText(value, "skill").toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9\\u4e00-\\u9fa5]+", "-")
                .replaceAll("(^-+|-+$)", "");
        return StringUtils.hasText(base) ? base : "skill";
    }

    private SkillPackage findOwnedSkillByCode(Long ownerId, SkillSaveRequest request) {
        String code = normalizeCode(StringUtils.hasText(request.getCode()) ? request.getCode() : request.getName());
        return skillPackageMapper.selectOne(new LambdaQueryWrapper<SkillPackage>()
                .eq(SkillPackage::getOwnerId, ownerId)
                .eq(SkillPackage::getCode, code)
                .isNull(SkillPackage::getDeleteTime)
                .last("limit 1"));
    }

    private String normalizePath(String path) {
        String value = path.trim().replace("\\", "/").replaceAll("/+", "/");
        value = value.replaceAll("^/+", "").replaceAll("/+$", "");
        if (!StringUtils.hasText(value) || value.contains("..")) {
            throw new BusinessException(400, "文件路径不合法");
        }
        return value;
    }

    private String normalizeVisibility(String visibility) {
        return VISIBILITY_PUBLIC.equals(visibility) ? VISIBILITY_PUBLIC : VISIBILITY_PRIVATE;
    }

    private String normalizeStatus(String status, String fallback) {
        if (STATUS_PUBLISHED.equals(status) || STATUS_OFFLINE.equals(status) || STATUS_DRAFT.equals(status) || STATUS_PENDING.equals(status)) {
            return status;
        }
        return defaultText(fallback, STATUS_DRAFT);
    }

    private String languageFromPath(String path) {
        String lower = path.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".md")) {
            return "markdown";
        }
        if (lower.endsWith(".json")) {
            return "json";
        }
        if (lower.endsWith(".py")) {
            return "python";
        }
        if (lower.endsWith(".ts") || lower.endsWith(".tsx")) {
            return "typescript";
        }
        if (lower.endsWith(".js") || lower.endsWith(".jsx")) {
            return "javascript";
        }
        return "text";
    }

    private String defaultText(String value, String fallback) {
        return StringUtils.hasText(value) ? value.trim() : fallback;
    }

    private Integer contentSize(String content) {
        return content == null ? 0 : content.getBytes(java.nio.charset.StandardCharsets.UTF_8).length;
    }
}
