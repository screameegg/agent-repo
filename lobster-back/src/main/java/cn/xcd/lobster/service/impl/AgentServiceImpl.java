package cn.xcd.lobster.service.impl;

import cn.xcd.lobster.common.exception.BusinessException;
import cn.xcd.lobster.common.result.PageResult;
import cn.xcd.lobster.mapper.AgentConfigEventMapper;
import cn.xcd.lobster.mapper.AgentGoalMapper;
import cn.xcd.lobster.mapper.AgentMapper;
import cn.xcd.lobster.mapper.AgentMemoryMapper;
import cn.xcd.lobster.mapper.AgentSkillMapper;
import cn.xcd.lobster.mapper.AgentSkillMountMapper;
import cn.xcd.lobster.mapper.AgentTokenMapper;
import cn.xcd.lobster.mapper.SkillFileMapper;
import cn.xcd.lobster.mapper.SkillPackageMapper;
import cn.xcd.lobster.model.dto.AgentBackupImportRequest;
import cn.xcd.lobster.model.dto.AgentCreateRequest;
import cn.xcd.lobster.model.dto.AgentGoalRequest;
import cn.xcd.lobster.model.dto.AgentMemoryRequest;
import cn.xcd.lobster.model.dto.AgentSkillMountRequest;
import cn.xcd.lobster.model.dto.AgentSkillRequest;
import cn.xcd.lobster.model.dto.AgentTokenCreateRequest;
import cn.xcd.lobster.model.dto.AgentTokenUpdateRequest;
import cn.xcd.lobster.model.dto.AgentUpdateRequest;
import cn.xcd.lobster.model.dto.AiAgentRegisterRequest;
import cn.xcd.lobster.model.dto.AiAgentSyncRequest;
import cn.xcd.lobster.model.entity.Agent;
import cn.xcd.lobster.model.entity.AgentConfigEvent;
import cn.xcd.lobster.model.entity.AgentGoal;
import cn.xcd.lobster.model.entity.AgentMemory;
import cn.xcd.lobster.model.entity.AgentSkill;
import cn.xcd.lobster.model.entity.AgentSkillMount;
import cn.xcd.lobster.model.entity.AgentToken;
import cn.xcd.lobster.model.entity.SkillFile;
import cn.xcd.lobster.model.entity.SkillPackage;
import cn.xcd.lobster.model.vo.AgentDetailVO;
import cn.xcd.lobster.model.vo.AgentConfigEventVO;
import cn.xcd.lobster.model.vo.AgentGoalVO;
import cn.xcd.lobster.model.vo.AgentMemoryVO;
import cn.xcd.lobster.model.vo.AgentSkillVO;
import cn.xcd.lobster.model.vo.AgentSkillMountVO;
import cn.xcd.lobster.model.vo.AgentTokenCreateVO;
import cn.xcd.lobster.model.vo.AgentTokenVO;
import cn.xcd.lobster.model.vo.AgentVO;
import cn.xcd.lobster.model.vo.AiAgentSyncResponse;
import cn.xcd.lobster.model.vo.SkillFileVO;
import cn.xcd.lobster.model.vo.SkillPackageVO;
import cn.xcd.lobster.service.AgentSkillMountService;
import cn.xcd.lobster.service.AgentService;
import cn.xcd.lobster.service.AgentSyncService;
import cn.xcd.lobster.service.support.AgentGoalStepSupport;
import cn.xcd.lobster.service.support.SkillMetadataSupport;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.DigestUtils;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.net.URLEncoder;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AgentServiceImpl implements AgentService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final String DEFAULT_MODEL = "Claude 3";
    private static final String STATUS_ACTIVE = "active";
    private static final String STATUS_DELETED = "deleted";
    private static final String ASSOCIATION_BOUND = "bound";
    private static final String ASSOCIATION_UNBOUND = "unbound";

    private final AgentMapper agentMapper;
    private final AgentSkillMapper agentSkillMapper;
    private final AgentMemoryMapper agentMemoryMapper;
    private final AgentGoalMapper agentGoalMapper;
    private final AgentTokenMapper agentTokenMapper;
    private final AgentSkillMountMapper agentSkillMountMapper;
    private final SkillPackageMapper skillPackageMapper;
    private final SkillFileMapper skillFileMapper;
    private final AgentConfigEventMapper agentConfigEventMapper;
    private final AgentSkillMountService agentSkillMountService;
    private final AgentSyncService agentSyncService;

    @Override
    public PageResult<AgentVO> page(Long current, Long size, String keyword) {
        Long ownerId = currentOwnerId();
        Page<Agent> page = new Page<>(normalizeCurrent(current), normalizeSize(size));
        LambdaQueryWrapper<Agent> wrapper = new LambdaQueryWrapper<Agent>()
                .eq(Agent::getOwnerId, ownerId)
                .isNull(Agent::getDeleteTime)
                .ne(Agent::getStatus, STATUS_DELETED)
                .orderByDesc(Agent::getSortOrder)
                .orderByDesc(Agent::getCreateTime);
        if (StringUtils.hasText(keyword)) {
            String value = keyword.trim();
            wrapper.and(item -> item.like(Agent::getName, value)
                    .or()
                    .like(Agent::getRole, value)
                    .or()
                    .like(Agent::getDescription, value));
        }
        Page<Agent> result = agentMapper.selectPage(page, wrapper);
        return PageResult.of(result.getRecords().stream().map(this::toAgentVO).toList(),
                result.getTotal(), result.getCurrent(), result.getSize());
    }

    @Override
    public AgentVO profile(Long id) {
        return toAgentVO(getOwnedAgent(id));
    }

    @Override
    public AgentDetailVO exportBackup(Long id) {
        return buildFullBackup(getOwnedAgent(id));
    }

    @Override
    @Transactional
    public AgentDetailVO importBackup(AgentBackupImportRequest request) {
        AgentDetailVO backup = request.getBackup();
        if (backup == null || backup.getAgent() == null) {
            throw new BusinessException(400, "备份数据不完整");
        }
        AgentCreateRequest createRequest = new AgentCreateRequest();
        createRequest.setName(defaultText(request.getName(), backup.getAgent().getName() + " (导入)"));
        createRequest.setRole(defaultText(backup.getAgent().getRole(), "导入Agent"));
        createRequest.setDescription(defaultText(backup.getAgent().getDescription(), ""));
        createRequest.setBaseModel(defaultText(backup.getAgent().getBaseModel(), DEFAULT_MODEL));
        createRequest.setAvatar(backup.getAgent().getAvatar());
        AgentVO created = create(createRequest);
        Long agentId = Long.valueOf(created.getId());
        Map<String, Long> importedSkillIds = importSkillPackages(backup);
        if (backup.getSkillMounts() != null) {
            for (AgentSkillMountVO mount : backup.getSkillMounts()) {
                Long importedSkillId = importedSkillIds.get(mount.getSkillId());
                if (importedSkillId == null) {
                    continue;
                }
                AgentSkillMountRequest mountRequest = new AgentSkillMountRequest();
                mountRequest.setSkillId(importedSkillId);
                mountRequest.setMountStatus(defaultText(mount.getMountStatus(), "active"));
                mountRequest.setConfigJson(rewriteImportedSkillConfig(mount.getConfigJson(), mount.getSkillId(), importedSkillId));
                mountSkill(agentId, mountRequest);
            }
        }
        if (backup.getSkills() != null) {
            for (AgentSkillVO skill : backup.getSkills()) {
                if ("skill_package".equals(skill.getSourceType())) {
                    continue;
                }
                AgentSkillRequest skillRequest = new AgentSkillRequest();
                skillRequest.setName(skill.getName());
                skillRequest.setDescription(skill.getDescription());
                skillRequest.setIcon(skill.getIcon());
                skillRequest.setSourceType(skill.getSourceType());
                skillRequest.setMountStatus(skill.getStatus());
                createSkill(agentId, skillRequest);
            }
        }
        if (backup.getMemories() != null) {
            for (AgentMemoryVO memory : backup.getMemories()) {
                AgentMemoryRequest memoryRequest = new AgentMemoryRequest();
                memoryRequest.setTitle(memory.getTitle());
                memoryRequest.setContent(memory.getContent());
                memoryRequest.setMemoryType(memory.getMemoryType());
                memoryRequest.setImportance(memory.getImportance());
                memoryRequest.setSource(defaultText(memory.getSource(), "backup-import"));
                createMemory(agentId, memoryRequest);
            }
        }
        if (backup.getGoals() != null) {
            for (AgentGoalVO goal : backup.getGoals()) {
                AgentGoalRequest goalRequest = new AgentGoalRequest();
                goalRequest.setTitle(goal.getTitle());
                goalRequest.setDescription(goal.getDescription());
                goalRequest.setGoalStatus(goal.getStatus());
                goalRequest.setPriority(goal.getPriority());
                createGoal(agentId, goalRequest);
            }
        }
        return profileBackup(agentId);
    }

    private AgentDetailVO profileBackup(Long agentId) {
        return new AgentDetailVO(
                toAgentVO(getOwnedAgent(agentId)),
                listAgentSkills(agentId),
                listAgentSkillMounts(agentId),
                listMountedSkillPackages(agentId),
                listAgentMemories(agentId),
                listAgentGoals(agentId)
        );
    }

    @Override
    @Transactional
    public AgentVO create(AgentCreateRequest request) {
        Long ownerId = currentOwnerId();
        LocalDateTime now = LocalDateTime.now();
        String name = request.getName().trim();
        Agent agent = new Agent();
        agent.setOwnerId(ownerId);
        agent.setName(name);
        agent.setCode(uniqueCode(ownerId, name));
        agent.setRole(request.getRole().trim());
        agent.setDescription(defaultText(request.getDescription(), "这个Agent还没有填写详细介绍。"));
        agent.setSystemPrompt(defaultText(request.getSystemPrompt(), ""));
        agent.setAvatar(defaultText(request.getAvatar(), avatarFor(name)));
        agent.setBaseModel(defaultText(request.getBaseModel(), DEFAULT_MODEL));
        agent.setStatus(STATUS_ACTIVE);
        agent.setAssociationStatus(ASSOCIATION_UNBOUND);
        agent.setSkillCount(0);
        agent.setMemoryCount(0);
        agent.setGoalCount(0);
        agent.setSortOrder(0);
        agent.setCreateTime(now);
        agent.setUpdateTime(now);
        agentMapper.insert(agent);
        return toAgentVO(agent);
    }

    @Override
    @Transactional
    public AgentVO update(Long id, AgentUpdateRequest request) {
        Agent agent = getOwnedAgent(id);
        agent.setName(request.getName().trim());
        agent.setRole(request.getRole().trim());
        agent.setDescription(defaultText(request.getDescription(), ""));
        agent.setSystemPrompt(defaultText(request.getSystemPrompt(), ""));
        agent.setAvatar(defaultText(request.getAvatar(), avatarFor(agent.getName())));
        agent.setBaseModel(defaultText(request.getBaseModel(), DEFAULT_MODEL));
        if (StringUtils.hasText(request.getStatus())) {
            agent.setStatus(request.getStatus().trim());
        }
        if (StringUtils.hasText(request.getAssociationStatus())) {
            agent.setAssociationStatus(request.getAssociationStatus().trim());
        }
        agent.setUpdateTime(LocalDateTime.now());
        agentMapper.updateById(agent);
        createConfigChangedEvent(agent, "agent_updated", "{\"agentId\":\"" + agent.getId() + "\"}");
        return toAgentVO(agent);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Agent agent = getOwnedAgent(id);
        LocalDateTime now = LocalDateTime.now();
        agent.setStatus(STATUS_DELETED);
        agent.setDeleteTime(now);
        agent.setUpdateTime(agent.getDeleteTime());
        agentMapper.updateById(agent);
        unbindTokensForDeletedAgent(agent, now);
    }

    private void unbindTokensForDeletedAgent(Agent agent, LocalDateTime now) {
        List<AgentToken> tokens = agentTokenMapper.selectList(new LambdaQueryWrapper<AgentToken>()
                .eq(AgentToken::getOwnerId, agent.getOwnerId())
                .eq(AgentToken::getAgentId, agent.getId())
                .isNull(AgentToken::getDeleteTime));
        for (AgentToken token : tokens) {
            token.setAgentId(null);
            token.setUpdateTime(now);
            agentTokenMapper.updateById(token);
        }
    }

    @Override
    public List<AgentSkillVO> listSkills(Long agentId) {
        getOwnedAgent(agentId);
        return listAgentSkills(agentId);
    }

    private List<AgentSkillVO> listAgentSkills(Long agentId) {
        return agentSkillMapper.selectList(new LambdaQueryWrapper<AgentSkill>()
                        .eq(AgentSkill::getAgentId, agentId)
                        .isNull(AgentSkill::getDeleteTime)
                        .orderByDesc(AgentSkill::getSortOrder)
                        .orderByDesc(AgentSkill::getCreateTime))
                .stream()
                .map(this::toSkillVO)
                .toList();
    }

    @Override
    @Transactional
    public AgentSkillVO createSkill(Long agentId, AgentSkillRequest request) {
        Agent agent = getOwnedAgent(agentId);
        LocalDateTime now = LocalDateTime.now();
        AgentSkill skill = new AgentSkill();
        skill.setAgentId(agentId);
        skill.setName(request.getName().trim());
        skill.setDescription(defaultText(request.getDescription(), ""));
        skill.setIcon(defaultText(request.getIcon(), "Network"));
        skill.setSourceType(defaultText(request.getSourceType(), "custom"));
        skill.setMountStatus(defaultText(request.getMountStatus(), "active"));
        skill.setConfigJson(defaultText(request.getConfigJson(), "{}"));
        skill.setSortOrder(0);
        skill.setCreateTime(now);
        skill.setUpdateTime(now);
        agentSkillMapper.insert(skill);
        agent.setSkillCount(agent.getSkillCount() + 1);
        agent.setUpdateTime(now);
        agentMapper.updateById(agent);
        createConfigChangedEvent(agent, "skill_created", "{\"skillId\":\"" + skill.getId() + "\"}");
        return toSkillVO(skill);
    }

    @Override
    public List<AgentSkillMountVO> listSkillMounts(Long agentId) {
        getOwnedAgent(agentId);
        return listAgentSkillMounts(agentId);
    }

    private List<AgentSkillMountVO> listAgentSkillMounts(Long agentId) {
        return agentSkillMountMapper.selectList(new LambdaQueryWrapper<AgentSkillMount>()
                        .eq(AgentSkillMount::getAgentId, agentId)
                        .isNull(AgentSkillMount::getDeleteTime)
                        .orderByDesc(AgentSkillMount::getSortOrder)
                        .orderByDesc(AgentSkillMount::getCreateTime))
                .stream()
                .map(this::toSkillMountVO)
                .toList();
    }

    private List<SkillPackageVO> listMountedSkillPackages(Long agentId) {
        return listMountedSkillPackages(agentId, true);
    }

    private List<SkillPackageVO> listMountedSkillPackages(Long agentId, boolean withFiles) {
        List<AgentSkillMount> mounts = agentSkillMountMapper.selectList(new LambdaQueryWrapper<AgentSkillMount>()
                .eq(AgentSkillMount::getAgentId, agentId)
                .isNull(AgentSkillMount::getDeleteTime)
                .orderByDesc(AgentSkillMount::getSortOrder)
                .orderByDesc(AgentSkillMount::getCreateTime));
        return mounts.stream()
                .map(AgentSkillMount::getSkillId)
                .distinct()
                .map(skillPackageMapper::selectById)
                .filter(skill -> skill != null && skill.getDeleteTime() == null)
                .map(skill -> toSkillPackageVO(skill, withFiles))
                .toList();
    }

    private AgentDetailVO buildFullBackup(Agent agent) {
        Long agentId = agent.getId();
        return new AgentDetailVO(
                toAgentVO(agent),
                listAgentSkills(agentId),
                listAgentSkillMounts(agentId),
                listMountedSkillPackages(agentId),
                listAgentMemories(agentId),
                listAgentGoals(agentId)
        );
    }

    private Map<String, Long> importSkillPackages(AgentDetailVO backup) {
        Map<String, Long> importedIds = new HashMap<>();
        if (backup.getSkillPackages() == null || backup.getSkillPackages().isEmpty()) {
            return importedIds;
        }
        Long ownerId = currentOwnerId();
        LocalDateTime now = LocalDateTime.now();
        for (SkillPackageVO source : backup.getSkillPackages()) {
            if (source == null || !StringUtils.hasText(source.getName())) {
                continue;
            }
            SkillPackage target = new SkillPackage();
            target.setOwnerId(ownerId);
            target.setName(source.getName().trim());
            target.setCode(uniqueSkillCode(ownerId, StringUtils.hasText(source.getCode()) ? source.getCode() : source.getName()));
            target.setDescription(defaultText(source.getDescription(), ""));
            target.setIcon(defaultText(source.getIcon(), "Sparkles"));
            target.setVersion(defaultText(source.getVersion(), "1.0.0"));
            target.setVisibility("private");
            target.setPublishStatus("draft");
            target.setInstallCount(0);
            target.setExtJson(SkillMetadataSupport.merge(
                    "{\"source\":\"agent-backup-import\",\"originalSkillId\":\"" + source.getId() + "\"}",
                    source.getRuntimeEnvironments(),
                    source.getCoreCapabilities()
            ));
            target.setCreateTime(now);
            target.setUpdateTime(now);
            skillPackageMapper.insert(target);
            importSkillFiles(target.getId(), source.getFiles(), now);
            if (StringUtils.hasText(source.getId())) {
                importedIds.put(source.getId(), target.getId());
            }
        }
        return importedIds;
    }

    private void importSkillFiles(Long skillId, List<SkillFileVO> sourceFiles, LocalDateTime now) {
        if (sourceFiles == null || sourceFiles.isEmpty()) {
            return;
        }
        Map<String, Long> oldIdMap = new HashMap<>();
        List<SkillFileVO> ordered = sourceFiles.stream()
                .filter(file -> file != null && StringUtils.hasText(file.getPath()) && StringUtils.hasText(file.getName()))
                .sorted((left, right) -> {
                    int leftDepth = left.getPath().split("/").length;
                    int rightDepth = right.getPath().split("/").length;
                    if (leftDepth != rightDepth) {
                        return Integer.compare(leftDepth, rightDepth);
                    }
                    return left.getPath().compareTo(right.getPath());
                })
                .toList();
        for (SkillFileVO source : ordered) {
            SkillFile target = new SkillFile();
            target.setSkillId(skillId);
            target.setParentId(StringUtils.hasText(source.getParentId()) ? oldIdMap.get(source.getParentId()) : null);
            target.setNodeType(defaultText(source.getNodeType(), "file"));
            target.setName(source.getName().trim());
            target.setPath(source.getPath().trim().replace("\\", "/"));
            target.setLanguage(defaultText(source.getLanguage(), "markdown"));
            target.setContent(defaultText(source.getContent(), ""));
            target.setSortOrder(source.getSortOrder() == null ? 0 : source.getSortOrder());
            target.setCreateTime(now);
            target.setUpdateTime(now);
            skillFileMapper.insert(target);
            if (StringUtils.hasText(source.getId())) {
                oldIdMap.put(source.getId(), target.getId());
            }
        }
    }

    private String rewriteImportedSkillConfig(String configJson, String originalSkillId, Long importedSkillId) {
        String value = defaultText(configJson, "{}");
        if (StringUtils.hasText(originalSkillId)) {
            value = value.replace("\"skillId\":\"" + originalSkillId + "\"", "\"skillId\":\"" + importedSkillId + "\"")
                    .replace("\"skillPackageId\":\"" + originalSkillId + "\"", "\"skillPackageId\":\"" + importedSkillId + "\"");
        }
        return value;
    }

    private SkillPackageVO toSkillPackageVO(SkillPackage skill, boolean withFiles) {
        return new SkillPackageVO(
                String.valueOf(skill.getId()),
                skill.getName(),
                skill.getCode(),
                defaultText(skill.getDescription(), ""),
                defaultText(skill.getIcon(), "Sparkles"),
                defaultText(skill.getVersion(), "1.0.0"),
                defaultText(skill.getVisibility(), "private"),
                defaultText(skill.getPublishStatus(), "draft"),
                SkillMetadataSupport.runtimeEnvironments(skill.getExtJson()),
                SkillMetadataSupport.coreCapabilities(skill.getExtJson()),
                defaultText(skill.getAuditStatus(), "none"),
                defaultText(skill.getAuditReason(), ""),
                skill.getAuditTime() == null ? "" : skill.getAuditTime().toString(),
                skill.getInstallCount() == null ? 0 : skill.getInstallCount(),
                "",
                withFiles ? listSkillFileVOs(skill.getId()) : List.of()
        );
    }

    private List<SkillFileVO> listSkillFileVOs(Long skillId) {
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

    @Override
    @Transactional
    public AgentSkillMountVO mountSkill(Long agentId, AgentSkillMountRequest request) {
        return agentSkillMountService.mountSkill(agentId, request);
    }

    @Override
    @Transactional
    public void unmountSkill(Long agentId, Long skillId) {
        agentSkillMountService.unmountSkill(agentId, skillId);
    }

    @Override
    public List<AgentMemoryVO> listMemories(Long agentId) {
        getOwnedAgent(agentId);
        return listAgentMemories(agentId);
    }

    private List<AgentMemoryVO> listAgentMemories(Long agentId) {
        return agentMemoryMapper.selectList(new LambdaQueryWrapper<AgentMemory>()
                        .eq(AgentMemory::getAgentId, agentId)
                        .isNull(AgentMemory::getDeleteTime)
                        .orderByDesc(AgentMemory::getImportance)
                        .orderByDesc(AgentMemory::getCreateTime))
                .stream()
                .map(this::toMemoryVO)
                .toList();
    }

    @Override
    @Transactional
    public AgentMemoryVO createMemory(Long agentId, AgentMemoryRequest request) {
        Agent agent = getOwnedAgent(agentId);
        LocalDateTime now = LocalDateTime.now();
        AgentMemory memory = new AgentMemory();
        memory.setAgentId(agentId);
        memory.setTitle(request.getTitle().trim());
        memory.setContent(request.getContent().trim());
        memory.setMemoryType(defaultText(request.getMemoryType(), "note"));
        memory.setImportance(request.getImportance() == null ? 0 : request.getImportance());
        memory.setSource(defaultText(request.getSource(), "manual"));
        memory.setExtJson("{}");
        memory.setCreateTime(now);
        memory.setUpdateTime(now);
        agentMemoryMapper.insert(memory);
        agent.setMemoryCount(agent.getMemoryCount() + 1);
        agent.setUpdateTime(now);
        agentMapper.updateById(agent);
        createConfigChangedEvent(agent, "memory_created", Map.of(
                "memoryId", String.valueOf(memory.getId()),
                "memory", toMemoryVO(memory)
        ));
        return toMemoryVO(memory);
    }

    @Override
    @Transactional
    public void deleteMemory(Long agentId, Long memoryId) {
        Agent agent = getOwnedAgent(agentId);
        AgentMemory memory = agentMemoryMapper.selectOne(new LambdaQueryWrapper<AgentMemory>()
                .eq(AgentMemory::getId, memoryId)
                .eq(AgentMemory::getAgentId, agentId)
                .isNull(AgentMemory::getDeleteTime)
                .last("limit 1"));
        if (memory == null) {
            throw new BusinessException(404, "记忆不存在");
        }
        LocalDateTime now = LocalDateTime.now();
        memory.setDeleteTime(now);
        memory.setUpdateTime(now);
        agentMemoryMapper.updateById(memory);
        agent.setMemoryCount(Math.max(0, agent.getMemoryCount() - 1));
        agent.setUpdateTime(now);
        agentMapper.updateById(agent);
        createConfigChangedEvent(agent, "memory_deleted", Map.of("memoryId", String.valueOf(memoryId)));
    }
    @Override
    public List<AgentGoalVO> listGoals(Long agentId) {
        getOwnedAgent(agentId);
        return listAgentGoals(agentId);
    }

    private List<AgentGoalVO> listAgentGoals(Long agentId) {
        return agentGoalMapper.selectList(new LambdaQueryWrapper<AgentGoal>()
                        .eq(AgentGoal::getAgentId, agentId)
                        .isNull(AgentGoal::getDeleteTime)
                        .orderByDesc(AgentGoal::getPriority)
                        .orderByDesc(AgentGoal::getCreateTime))
                .stream()
                .map(this::toGoalVO)
                .toList();
    }

    @Override
    @Transactional
    public AgentGoalVO createGoal(Long agentId, AgentGoalRequest request) {
        Agent agent = getOwnedAgent(agentId);
        LocalDateTime now = LocalDateTime.now();
        AgentGoal goal = new AgentGoal();
        goal.setAgentId(agentId);
        goal.setTitle(request.getTitle().trim());
        goal.setDescription(defaultText(request.getDescription(), ""));
        goal.setGoalStatus(defaultText(request.getGoalStatus(), "pending"));
        goal.setPriority(request.getPriority() == null ? 0 : request.getPriority());
        goal.setDueTime(request.getDueTime());
        goal.setExtJson(AgentGoalStepSupport.mergeSteps("{}", request.getSteps(), now));
        goal.setCreateTime(now);
        goal.setUpdateTime(now);
        agentGoalMapper.insert(goal);
        agent.setGoalCount(agent.getGoalCount() + 1);
        agent.setUpdateTime(now);
        agentMapper.updateById(agent);
        createConfigChangedEvent(agent, "goal_created", Map.of(
                "goalId", String.valueOf(goal.getId()),
                "goal", toGoalVO(goal)
        ));
        return toGoalVO(goal);
    }

    @Override
    @Transactional
    public AgentGoalVO updateGoal(Long agentId, Long goalId, AgentGoalRequest request) {
        Agent agent = getOwnedAgent(agentId);
        AgentGoal goal = getOwnedGoal(agent.getId(), goalId);
        LocalDateTime now = LocalDateTime.now();
        goal.setTitle(request.getTitle().trim());
        goal.setDescription(defaultText(request.getDescription(), ""));
        goal.setGoalStatus(defaultText(request.getGoalStatus(), "pending"));
        goal.setPriority(request.getPriority() == null ? 0 : request.getPriority());
        goal.setDueTime(request.getDueTime());
        goal.setExtJson(AgentGoalStepSupport.mergeSteps(goal.getExtJson(), request.getSteps(), now));
        goal.setUpdateTime(now);
        agentGoalMapper.updateById(goal);
        agent.setUpdateTime(now);
        agentMapper.updateById(agent);
        createConfigChangedEvent(agent, "goal_updated", Map.of(
                "goalId", String.valueOf(goal.getId()),
                "goal", toGoalVO(goal)
        ));
        return toGoalVO(goal);
    }

    @Override
    @Transactional
    public void deleteGoal(Long agentId, Long goalId) {
        Agent agent = getOwnedAgent(agentId);
        AgentGoal goal = getOwnedGoal(agent.getId(), goalId);
        LocalDateTime now = LocalDateTime.now();
        goal.setDeleteTime(now);
        goal.setUpdateTime(now);
        agentGoalMapper.updateById(goal);
        agent.setGoalCount(Math.max(0, agent.getGoalCount() - 1));
        agent.setUpdateTime(now);
        agentMapper.updateById(agent);
        createConfigChangedEvent(agent, "goal_deleted", Map.of("goalId", String.valueOf(goal.getId())));
    }
    @Override
    public List<AgentTokenVO> listTokens() {
        Long ownerId = currentOwnerId();
        return agentTokenMapper.selectList(new LambdaQueryWrapper<AgentToken>()
                        .eq(AgentToken::getOwnerId, ownerId)
                        .isNull(AgentToken::getDeleteTime)
                        .orderByDesc(AgentToken::getCreateTime))
                .stream()
                .map(this::toTokenVO)
                .toList();
    }

    @Override
    @Transactional
    public AgentTokenCreateVO createToken(AgentTokenCreateRequest request) {
        Long ownerId = currentOwnerId();
        if (request.getAgentId() != null) {
            getOwnedAgent(request.getAgentId());
        }
        LocalDateTime now = LocalDateTime.now();
        String plainToken = "lobster_" + UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
        AgentToken token = new AgentToken();
        token.setOwnerId(ownerId);
        token.setAgentId(request.getAgentId());
        token.setName(request.getName().trim());
        token.setTokenPrefix(plainToken.substring(0, 16));
        token.setTokenHash(hashToken(plainToken));
        token.setPermissionJson(permissionJson(request));
        token.setStatus(STATUS_ACTIVE);
        token.setCreateTime(now);
        token.setUpdateTime(now);
        agentTokenMapper.insert(token);
        if (token.getAgentId() != null) {
            refreshAgentAssociation(token.getAgentId());
        }
        AgentTokenVO vo = toTokenVO(token);
        vo.setKey(plainToken);
        return new AgentTokenCreateVO(vo, plainToken);
    }

    @Override
    @Transactional
    public AgentTokenVO updateToken(Long id, AgentTokenUpdateRequest request) {
        Long ownerId = currentOwnerId();
        AgentToken token = agentTokenMapper.selectOne(new LambdaQueryWrapper<AgentToken>()
                .eq(AgentToken::getId, id)
                .eq(AgentToken::getOwnerId, ownerId)
                .isNull(AgentToken::getDeleteTime)
                .last("limit 1"));
        if (token == null) {
            throw new BusinessException(404, "令牌不存在");
        }
        if (request.getAgentId() != null) {
            getOwnedAgent(request.getAgentId());
        }
        Long oldAgentId = token.getAgentId();
        token.setAgentId(request.getAgentId());
        token.setName(request.getName().trim());
        token.setPermissionJson(permissionJson(request));
        token.setUpdateTime(LocalDateTime.now());
        agentTokenMapper.updateById(token);
        if (oldAgentId != null) {
            refreshAgentAssociation(oldAgentId);
        }
        if (token.getAgentId() != null) {
            refreshAgentAssociation(token.getAgentId());
        }
        return toTokenVO(token);
    }

    @Override
    @Transactional
    public void deleteToken(Long id) {
        Long ownerId = currentOwnerId();
        AgentToken token = agentTokenMapper.selectOne(new LambdaQueryWrapper<AgentToken>()
                .eq(AgentToken::getId, id)
                .eq(AgentToken::getOwnerId, ownerId)
                .isNull(AgentToken::getDeleteTime)
                .last("limit 1"));
        if (token == null) {
            throw new BusinessException(404, "令牌不存在");
        }
        token.setStatus("revoked");
        token.setDeleteTime(LocalDateTime.now());
        token.setUpdateTime(token.getDeleteTime());
        agentTokenMapper.updateById(token);
        if (token.getAgentId() != null) {
            refreshAgentAssociation(token.getAgentId());
        }
    }

    private AgentGoal getOwnedGoal(Long agentId, Long goalId) {
        AgentGoal goal = agentGoalMapper.selectOne(new LambdaQueryWrapper<AgentGoal>()
                .eq(AgentGoal::getId, goalId)
                .eq(AgentGoal::getAgentId, agentId)
                .isNull(AgentGoal::getDeleteTime)
                .last("limit 1"));
        if (goal == null) {
            throw new BusinessException(404, "目标不存在");
        }
        return goal;
    }
    private Agent getOwnedAgent(Long id) {
        if (id == null) {
            throw new BusinessException(400, "Agent ID不能为空");
        }
        Agent agent = agentMapper.selectOne(new LambdaQueryWrapper<Agent>()
                .eq(Agent::getId, id)
                .eq(Agent::getOwnerId, currentOwnerId())
                .isNull(Agent::getDeleteTime)
                .ne(Agent::getStatus, STATUS_DELETED)
                .last("limit 1"));
        if (agent == null) {
            throw new BusinessException(404, "Agent不存在");
        }
        return agent;
    }

    private Long currentOwnerId() {
        Object loginId = cn.dev33.satoken.stp.StpUtil.getLoginId();
        return Long.valueOf(String.valueOf(loginId));
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
        String base = name.trim().toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9\\u4e00-\\u9fa5]+", "-")
                .replaceAll("(^-+|-+$)", "");
        if (!StringUtils.hasText(base)) {
            base = "agent";
        }
        String candidate = base;
        int index = 1;
        while (agentMapper.selectCount(new LambdaQueryWrapper<Agent>()
                .eq(Agent::getOwnerId, ownerId)
                .eq(Agent::getCode, candidate)) > 0) {
            candidate = base + "-" + index++;
        }
        return candidate;
    }

    private String uniqueSkillCode(Long ownerId, String name) {
        String base = defaultText(name, "skill").toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9\\u4e00-\\u9fa5]+", "-")
                .replaceAll("(^-+|-+$)", "");
        if (!StringUtils.hasText(base)) {
            base = "skill";
        }
        String candidate = base;
        int index = 1;
        while (skillPackageMapper.selectCount(new LambdaQueryWrapper<SkillPackage>()
                .eq(SkillPackage::getOwnerId, ownerId)
                .eq(SkillPackage::getCode, candidate)) > 0) {
            candidate = base + "-" + index++;
        }
        return candidate;
    }

    private String defaultText(String value, String fallback) {
        return StringUtils.hasText(value) ? value.trim() : fallback;
    }

    private String avatarFor(String name) {
        String seed = URLEncoder.encode(name, StandardCharsets.UTF_8);
        return "https://api.dicebear.com/7.x/bottts/svg?seed=" + seed;
    }

    private String formatDate(LocalDateTime value) {
        return value == null ? "" : DATE_FORMATTER.format(value);
    }

    private String hashToken(String token) {
        return DigestUtils.md5DigestAsHex(token.getBytes(StandardCharsets.UTF_8));
    }

    private String permissionJson(AgentTokenCreateRequest request) {
        return permissionJson(
                request.getSkillRead(),
                request.getSkillWrite(),
                request.getMemoryRead(),
                request.getMemoryWrite(),
                request.getGoalRead(),
                request.getGoalWrite(),
                request.getAgentRegister(),
                request.getAgentSync(),
                request.getConfigRead(),
                request.getBackupExport()
        );
    }

    private String permissionJson(AgentTokenUpdateRequest request) {
        return permissionJson(
                request.getSkillRead(),
                request.getSkillWrite(),
                request.getMemoryRead(),
                request.getMemoryWrite(),
                request.getGoalRead(),
                request.getGoalWrite(),
                request.getAgentRegister(),
                request.getAgentSync(),
                request.getConfigRead(),
                request.getBackupExport()
        );
    }

    private String permissionJson(Boolean skillRead,
                                  Boolean skillWrite,
                                  Boolean memoryRead,
                                  Boolean memoryWrite,
                                  Boolean goalRead,
                                  Boolean goalWrite,
                                  Boolean agentRegister,
                                  Boolean agentSync,
                                  Boolean configRead,
                                  Boolean backupExport) {
        return String.format(
                "{\"skillRead\":%s,\"skillWrite\":%s,"
                        + "\"memoryRead\":%s,\"memoryWrite\":%s,"
                        + "\"goalRead\":%s,\"goalWrite\":%s,"
                        + "\"agentRegister\":%s,\"agentSync\":%s,\"configRead\":%s,\"backupExport\":%s}",
                Boolean.TRUE.equals(skillRead),
                Boolean.TRUE.equals(skillWrite),
                Boolean.TRUE.equals(memoryRead),
                Boolean.TRUE.equals(memoryWrite),
                Boolean.TRUE.equals(goalRead),
                Boolean.TRUE.equals(goalWrite),
                Boolean.TRUE.equals(agentRegister),
                Boolean.TRUE.equals(agentSync),
                Boolean.TRUE.equals(configRead),
                Boolean.TRUE.equals(backupExport)
        );
    }

    private AgentVO toAgentVO(Agent agent) {
        boolean associated = hasActiveAgentToken(agent.getId());
        SyncStatus syncStatus = resolveSyncStatus(agent.getId(), associated);
        return new AgentVO(
                String.valueOf(agent.getId()),
                agent.getName(),
                agent.getCode(),
                agent.getDescription(),
                formatDate(agent.getCreateTime()),
                agent.getRole(),
                agent.getSkillCount(),
                countMountedSkills(agent.getId()),
                agent.getMemoryCount(),
                agent.getGoalCount(),
                agent.getAvatar(),
                agent.getBaseModel(),
                agent.getStatus(),
                associated,
                syncStatus.status(),
                syncStatus.pendingCount(),
                syncStatus.lastEventAt()
        );
    }

    private SyncStatus resolveSyncStatus(Long agentId, boolean associated) {
        if (!associated) {
            return new SyncStatus("unassociated", 0, "");
        }
        Long pendingCountValue = agentConfigEventMapper.selectCount(new LambdaQueryWrapper<AgentConfigEvent>()
                .eq(AgentConfigEvent::getAgentId, agentId)
                .eq(AgentConfigEvent::getEventType, "config_changed")
                .eq(AgentConfigEvent::getEventStatus, "pending")
                .isNull(AgentConfigEvent::getDeleteTime));
        int pendingCount = pendingCountValue == null ? 0 : pendingCountValue.intValue();
        AgentConfigEvent lastEvent = agentConfigEventMapper.selectOne(new LambdaQueryWrapper<AgentConfigEvent>()
                .eq(AgentConfigEvent::getAgentId, agentId)
                .eq(AgentConfigEvent::getEventType, "config_changed")
                .isNull(AgentConfigEvent::getDeleteTime)
                .orderByDesc(AgentConfigEvent::getCreateTime)
                .last("limit 1"));
        if (pendingCount == 0) {
            return new SyncStatus("synced", 0, lastEvent == null ? "" : formatDate(lastEvent.getCreateTime()));
        }
        AgentConfigEvent oldestPending = agentConfigEventMapper.selectOne(new LambdaQueryWrapper<AgentConfigEvent>()
                .eq(AgentConfigEvent::getAgentId, agentId)
                .eq(AgentConfigEvent::getEventType, "config_changed")
                .eq(AgentConfigEvent::getEventStatus, "pending")
                .isNull(AgentConfigEvent::getDeleteTime)
                .orderByAsc(AgentConfigEvent::getCreateTime)
                .last("limit 1"));
        String status = oldestPending != null && oldestPending.getCreateTime().isBefore(LocalDateTime.now().minusMinutes(30))
                ? "timeout"
                : "pending";
        return new SyncStatus(status, pendingCount, lastEvent == null ? "" : formatDate(lastEvent.getCreateTime()));
    }

    private record SyncStatus(String status, Integer pendingCount, String lastEventAt) {
    }

    private AgentSkillVO toSkillVO(AgentSkill skill) {
        return new AgentSkillVO(
                String.valueOf(skill.getId()),
                skill.getName(),
                skill.getDescription(),
                skill.getIcon(),
                skill.getSourceType(),
                skill.getMountStatus()
        );
    }

    private boolean hasActiveAgentToken(Long agentId) {
        return agentTokenMapper.selectCount(new LambdaQueryWrapper<AgentToken>()
                .eq(AgentToken::getAgentId, agentId)
                .eq(AgentToken::getStatus, STATUS_ACTIVE)
                .isNull(AgentToken::getDeleteTime)) > 0;
    }

    private Integer countMountedSkills(Long agentId) {
        Long count = agentSkillMountMapper.selectCount(new LambdaQueryWrapper<AgentSkillMount>()
                .eq(AgentSkillMount::getAgentId, agentId)
                .isNull(AgentSkillMount::getDeleteTime));
        return count == null ? 0 : count.intValue();
    }

    private void createConfigChangedEvent(Agent agent, String reason, String payloadJson) {
        createConfigChangedEventJson(agent, reason, defaultText(payloadJson, "{}"));
    }

    private void createConfigChangedEvent(Agent agent, String reason, Map<String, Object> payload) {
        createConfigChangedEventJson(agent, reason, toJson(payload == null ? Map.of() : payload));
    }

    private void createConfigChangedEventJson(Agent agent, String reason, String payloadJson) {
        LocalDateTime now = LocalDateTime.now();
        AgentConfigEvent event = new AgentConfigEvent();
        event.setOwnerId(agent.getOwnerId());
        event.setAgentId(agent.getId());
        event.setEventType("config_changed");
        event.setEventStatus("pending");
        event.setPayloadJson("{\"reason\":\"" + reason + "\",\"payload\":" + defaultText(payloadJson, "{}") + "}");
        event.setCreateTime(now);
        event.setUpdateTime(now);
        agentConfigEventMapper.insert(event);
    }

    private String toJson(Object value) {
        try {
            return OBJECT_MAPPER.writeValueAsString(value);
        } catch (Exception exception) {
            throw new BusinessException(500, "事件载荷序列化失败");
        }
    }

    private void refreshAgentAssociation(Long agentId) {
        Agent agent = agentMapper.selectById(agentId);
        if (agent == null || agent.getDeleteTime() != null) {
            return;
        }
        agent.setAssociationStatus(hasActiveAgentToken(agentId) ? ASSOCIATION_BOUND : ASSOCIATION_UNBOUND);
        agent.setUpdateTime(LocalDateTime.now());
        agentMapper.updateById(agent);
    }

    private AgentSkillMountVO toSkillMountVO(AgentSkillMount mount) {
        SkillPackage skill = skillPackageMapper.selectById(mount.getSkillId());
        return new AgentSkillMountVO(
                String.valueOf(mount.getId()),
                String.valueOf(mount.getAgentId()),
                String.valueOf(mount.getSkillId()),
                skill == null ? "未知技能" : skill.getName(),
                skill == null ? "" : defaultText(skill.getDescription(), ""),
                skill == null ? "Network" : defaultText(skill.getIcon(), "Network"),
                skill == null ? "1.0.0" : defaultText(skill.getVersion(), "1.0.0"),
                mount.getMountStatus(),
                mount.getConfigJson()
        );
    }

    private AgentMemoryVO toMemoryVO(AgentMemory memory) {
        return new AgentMemoryVO(
                String.valueOf(memory.getId()),
                memory.getTitle(),
                memory.getContent(),
                memory.getMemoryType(),
                memory.getImportance(),
                memory.getSource(),
                formatDate(memory.getCreateTime())
        );
    }

    private AgentGoalVO toGoalVO(AgentGoal goal) {
        return new AgentGoalVO(
                String.valueOf(goal.getId()),
                goal.getTitle(),
                goal.getDescription(),
                goal.getGoalStatus(),
                goal.getPriority(),
                goal.getDueTime() == null ? "" : goal.getDueTime().toString(),
                AgentGoalStepSupport.readSteps(goal.getExtJson())
        );
    }

    private AgentTokenVO toTokenVO(AgentToken token) {
        String permissions = token.getPermissionJson();
        return new AgentTokenVO(
                String.valueOf(token.getId()),
                token.getAgentId() == null ? null : String.valueOf(token.getAgentId()),
                token.getName(),
                token.getTokenPrefix() + "...",
                formatDate(token.getCreateTime()),
                token.getLastUsedTime() == null ? "Never" : formatDate(token.getLastUsedTime()),
                permissionEnabled(permissions, "skillRead"),
                permissionEnabled(permissions, "skillWrite"),
                permissionEnabled(permissions, "memoryRead"),
                permissionEnabled(permissions, "memoryWrite"),
                permissionEnabled(permissions, "goalRead"),
                permissionEnabled(permissions, "goalWrite"),
                permissionEnabled(permissions, "agentRegister"),
                permissionEnabled(permissions, "agentSync"),
                permissionEnabled(permissions, "configRead"),
                permissionEnabled(permissions, "backupExport")
        );
    }

    @Override
    @Transactional
    public AgentDetailVO registerByToken(AgentToken token, AiAgentRegisterRequest request) {
        return agentSyncService.registerByToken(token, request);
    }

    @Override
    @Transactional
    public AiAgentSyncResponse syncByToken(AgentToken token, Long agentId, AiAgentSyncRequest request) {
        return agentSyncService.syncByToken(token, agentId, request);
    }

    @Override
    public AgentDetailVO tokenConfig(AgentToken token, Long agentId) {
        return agentSyncService.tokenConfig(token, agentId);
    }

    @Override
    public AgentDetailVO tokenBackup(AgentToken token, Long agentId) {
        return agentSyncService.tokenBackup(token, agentId);
    }

    @Override
    public List<AgentConfigEventVO> listTokenEvents(AgentToken token, Long agentId) {
        return agentSyncService.listTokenEvents(token, agentId);
    }

    @Override
    @Transactional
    public void ackTokenEvent(AgentToken token, Long eventId) {
        agentSyncService.ackTokenEvent(token, eventId);
    }

    private Integer contentSize(String content) {
        return content == null ? 0 : content.getBytes(java.nio.charset.StandardCharsets.UTF_8).length;
    }

    private boolean permissionEnabled(String permissions, String permission) {
        return permissions != null
                && Pattern.compile("\"" + permission + "\"\\s*:\\s*true").matcher(permissions).find();
    }

}
