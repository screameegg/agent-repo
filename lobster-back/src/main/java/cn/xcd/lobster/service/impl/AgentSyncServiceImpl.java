package cn.xcd.lobster.service.impl;

import cn.xcd.lobster.common.exception.BusinessException;
import cn.xcd.lobster.mapper.AgentConfigEventMapper;
import cn.xcd.lobster.mapper.AgentGoalMapper;
import cn.xcd.lobster.mapper.AgentMapper;
import cn.xcd.lobster.mapper.AgentMemoryMapper;
import cn.xcd.lobster.mapper.AgentSkillMapper;
import cn.xcd.lobster.mapper.AgentSkillMountMapper;
import cn.xcd.lobster.mapper.AgentTokenMapper;
import cn.xcd.lobster.mapper.SkillFileMapper;
import cn.xcd.lobster.mapper.SkillPackageMapper;
import cn.xcd.lobster.model.dto.AgentGoalRequest;
import cn.xcd.lobster.model.dto.AgentMemoryRequest;
import cn.xcd.lobster.model.dto.AgentSkillRequest;
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
import cn.xcd.lobster.model.vo.AgentConfigEventVO;
import cn.xcd.lobster.model.vo.AgentDetailVO;
import cn.xcd.lobster.model.vo.AgentGoalVO;
import cn.xcd.lobster.model.vo.AgentMemoryVO;
import cn.xcd.lobster.model.vo.AgentSkillMountVO;
import cn.xcd.lobster.model.vo.AgentSkillVO;
import cn.xcd.lobster.model.vo.AgentVO;
import cn.xcd.lobster.model.vo.SkillFileVO;
import cn.xcd.lobster.model.vo.SkillPackageVO;
import cn.xcd.lobster.service.AgentSyncService;
import cn.xcd.lobster.service.support.AgentGoalStepSupport;
import cn.xcd.lobster.service.support.SkillMetadataSupport;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.DigestUtils;
import org.springframework.util.StringUtils;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AgentSyncServiceImpl implements AgentSyncService {

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
    private final AgentSyncSkillMountService agentSyncSkillMountService;

    @Override
    @Transactional
    public AgentDetailVO registerByToken(AgentToken token, AiAgentRegisterRequest request) {
        requirePermission(token, "agentRegister");
        LocalDateTime now = LocalDateTime.now();
        String name = request.getName().trim();
        Agent agent = new Agent();
        agent.setOwnerId(token.getOwnerId());
        agent.setName(name);
        agent.setCode(uniqueCode(token.getOwnerId(), name));
        agent.setRole(request.getRole().trim());
        agent.setDescription(defaultText(request.getDescription(), "智能体通过令牌自注册。"));
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
        token.setAgentId(agent.getId());
        token.setUpdateTime(now);
        agentTokenMapper.updateById(token);
        refreshAgentAssociation(agent.getId());
        syncChildren(token, agent, request.getSkills(), request.getMemories(), request.getGoals());
        return tokenConfig(token, agent.getId());
    }

    @Override
    @Transactional
    public AgentDetailVO syncByToken(AgentToken token, Long agentId, AiAgentSyncRequest request) {
        requirePermission(token, "agentSync");
        Agent agent = getTokenAgent(token, agentId);
        requireSyncPreflight(token, agent.getId(), request);
        if (StringUtils.hasText(request.getName())) {
            agent.setName(request.getName().trim());
        }
        if (StringUtils.hasText(request.getRole())) {
            agent.setRole(request.getRole().trim());
        }
        if (request.getDescription() != null) {
            agent.setDescription(request.getDescription());
        }
        if (request.getSystemPrompt() != null) {
            agent.setSystemPrompt(request.getSystemPrompt());
        }
        if (StringUtils.hasText(request.getAvatar())) {
            agent.setAvatar(request.getAvatar().trim());
        }
        if (StringUtils.hasText(request.getBaseModel())) {
            agent.setBaseModel(request.getBaseModel().trim());
        }
        agent.setUpdateTime(LocalDateTime.now());
        agentMapper.updateById(agent);
        syncChildren(token, agent, request.getSkills(), request.getMemories(), request.getGoals());
        return tokenConfig(token, agent.getId());
    }

    @Override
    public AgentDetailVO tokenConfig(AgentToken token, Long agentId) {
        requirePermission(token, "configRead");
        Agent agent = getTokenAgent(token, agentId);
        List<AgentSkillVO> skills = listTokenSkills(token, agent.getId());
        List<AgentSkillMountVO> skillMounts = listTokenSkillMounts(token, agent.getId());
        List<SkillPackageVO> skillPackages = listTokenSkillPackages(token, agent.getId());
        List<AgentMemoryVO> memories = listTokenMemories(token, agent.getId());
        List<AgentGoalVO> goals = listTokenGoals(token, agent.getId());
        return new AgentDetailVO(
                syncRevision(agent.getId(), skills, skillMounts, skillPackages, memories, goals),
                toAgentVO(agent),
                skills,
                skillMounts,
                skillPackages,
                memories,
                goals
        );
    }

    @Override
    public AgentDetailVO tokenBackup(AgentToken token, Long agentId) {
        requirePermission(token, "backupExport");
        Agent agent = getTokenAgent(token, agentId);
        return new AgentDetailVO(
                toAgentVO(agent),
                listAgentSkills(agent.getId()),
                listAgentSkillMounts(agent.getId()),
                listMountedSkillPackages(agent.getId()),
                listAgentMemories(agent.getId()),
                listAgentGoals(agent.getId())
        );
    }

    @Override
    public List<AgentConfigEventVO> listTokenEvents(AgentToken token, Long agentId) {
        Agent agent = getTokenAgent(token, agentId);
        return agentConfigEventMapper.selectList(new LambdaQueryWrapper<AgentConfigEvent>()
                        .eq(AgentConfigEvent::getAgentId, agent.getId())
                        .eq(AgentConfigEvent::getOwnerId, token.getOwnerId())
                        .eq(AgentConfigEvent::getEventStatus, "pending")
                        .isNull(AgentConfigEvent::getDeleteTime)
                        .orderByDesc(AgentConfigEvent::getCreateTime))
                .stream()
                .map(this::toConfigEventVO)
                .toList();
    }

    @Override
    @Transactional
    public void ackTokenEvent(AgentToken token, Long eventId) {
        AgentConfigEvent event = agentConfigEventMapper.selectOne(new LambdaQueryWrapper<AgentConfigEvent>()
                .eq(AgentConfigEvent::getId, eventId)
                .eq(AgentConfigEvent::getOwnerId, token.getOwnerId())
                .isNull(AgentConfigEvent::getDeleteTime)
                .last("limit 1"));
        if (event == null) {
            throw new BusinessException(404, "事件不存在");
        }
        getTokenAgent(token, event.getAgentId());
        LocalDateTime now = LocalDateTime.now();
        event.setEventStatus("read");
        event.setReadTime(now);
        event.setUpdateTime(now);
        agentConfigEventMapper.updateById(event);
    }


    @Override
    @Transactional
    public void deleteMemoryByToken(AgentToken token, Long agentId, Long memoryId) {
        requirePermission(token, "memoryWrite");
        Agent agent = getTokenAgent(token, agentId);
        AgentMemory memory = agentMemoryMapper.selectOne(new LambdaQueryWrapper<AgentMemory>()
                .eq(AgentMemory::getId, memoryId)
                .eq(AgentMemory::getAgentId, agent.getId())
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
    }

    @Override
    @Transactional
    public void deleteGoalByToken(AgentToken token, Long agentId, Long goalId) {
        requirePermission(token, "goalWrite");
        Agent agent = getTokenAgent(token, agentId);
        AgentGoal goal = agentGoalMapper.selectOne(new LambdaQueryWrapper<AgentGoal>()
                .eq(AgentGoal::getId, goalId)
                .eq(AgentGoal::getAgentId, agent.getId())
                .isNull(AgentGoal::getDeleteTime)
                .last("limit 1"));
        if (goal == null) {
            throw new BusinessException(404, "目标不存在");
        }
        LocalDateTime now = LocalDateTime.now();
        goal.setDeleteTime(now);
        goal.setUpdateTime(now);
        agentGoalMapper.updateById(goal);
        agent.setGoalCount(Math.max(0, agent.getGoalCount() - 1));
        agent.setUpdateTime(now);
        agentMapper.updateById(agent);
    }
    private void syncChildren(AgentToken token,
                              Agent agent,
                              List<AgentSkillRequest> skills,
                              List<AgentMemoryRequest> memories,
                              List<AgentGoalRequest> goals) {
        if (skills != null && permissionEnabled(token.getPermissionJson(), "skillWrite")) {
            for (AgentSkillRequest skill : skills) {
                createSkillForAgent(agent, skill);
                agentSyncSkillMountService.mountMatchingSkillPackage(token, agent, skill);
            }
        }
        if (memories != null && permissionEnabled(token.getPermissionJson(), "memoryWrite")) {
            for (AgentMemoryRequest memory : memories) {
                createMemoryForAgent(agent, memory);
            }
        }
        if (goals != null && permissionEnabled(token.getPermissionJson(), "goalWrite")) {
            for (AgentGoalRequest goal : goals) {
                createGoalForAgent(agent, goal);
            }
        }
    }

    private void requireSyncPreflight(AgentToken token, Long agentId, AiAgentSyncRequest request) {
        if (!requiresSyncPreflight(token, request)) {
            return;
        }
        requirePreflightReadPermissions(token, request);
        String currentRevision = currentSyncRevision(token, agentId);
        if (!Boolean.TRUE.equals(request.getConfirmSync())
                || !StringUtils.hasText(request.getBaseRevision())
                || !currentRevision.equals(request.getBaseRevision().trim())) {
            throw new BusinessException(409, "同步前请先拉取平台配置并确认技能、记忆和目标差异");
        }
    }

    private boolean requiresSyncPreflight(AgentToken token, AiAgentSyncRequest request) {
        if (request == null) {
            return false;
        }
        return hasWritablePayload(request.getSkills(), token.getPermissionJson(), "skillWrite")
                || hasWritablePayload(request.getMemories(), token.getPermissionJson(), "memoryWrite")
                || hasWritablePayload(request.getGoals(), token.getPermissionJson(), "goalWrite");
    }

    private void requirePreflightReadPermissions(AgentToken token, AiAgentSyncRequest request) {
        requirePermission(token, "configRead");
        if (hasWritablePayload(request.getSkills(), token.getPermissionJson(), "skillWrite")) {
            requirePermission(token, "skillRead");
        }
        if (hasWritablePayload(request.getMemories(), token.getPermissionJson(), "memoryWrite")) {
            requirePermission(token, "memoryRead");
        }
        if (hasWritablePayload(request.getGoals(), token.getPermissionJson(), "goalWrite")) {
            requirePermission(token, "goalRead");
        }
    }

    private boolean hasWritablePayload(List<?> payload, String permissions, String permission) {
        return payload != null && !payload.isEmpty() && permissionEnabled(permissions, permission);
    }

    private String currentSyncRevision(AgentToken token, Long agentId) {
        return syncRevision(
                agentId,
                listTokenSkills(token, agentId),
                listTokenSkillMounts(token, agentId),
                listTokenSkillPackages(token, agentId),
                listTokenMemories(token, agentId),
                listTokenGoals(token, agentId)
        );
    }

    private String syncRevision(Long agentId,
                                List<AgentSkillVO> skills,
                                List<AgentSkillMountVO> skillMounts,
                                List<SkillPackageVO> skillPackages,
                                List<AgentMemoryVO> memories,
                                List<AgentGoalVO> goals) {
        String payload = "agent=" + agentId
                + "|skills=" + OBJECT_MAPPER.valueToTree(skills == null ? List.of() : skills)
                + "|skillMounts=" + OBJECT_MAPPER.valueToTree(skillMounts == null ? List.of() : skillMounts)
                + "|skillPackages=" + OBJECT_MAPPER.valueToTree(skillPackages == null ? List.of() : skillPackages)
                + "|memories=" + OBJECT_MAPPER.valueToTree(memories == null ? List.of() : memories)
                + "|goals=" + OBJECT_MAPPER.valueToTree(goals == null ? List.of() : goals);
        return DigestUtils.md5DigestAsHex(payload.getBytes(StandardCharsets.UTF_8));
    }

    private void createSkillForAgent(Agent agent, AgentSkillRequest request) {
        if (request == null || !StringUtils.hasText(request.getName())) {
            return;
        }
        LocalDateTime now = LocalDateTime.now();
        AgentSkill skill = findSyncedSkill(agent.getId(), request);
        boolean created = skill == null;
        if (created) {
            skill = new AgentSkill();
            skill.setAgentId(agent.getId());
            skill.setCreateTime(now);
        }
        skill.setName(request.getName().trim());
        skill.setDescription(defaultText(request.getDescription(), ""));
        skill.setIcon(defaultText(request.getIcon(), "Network"));
        skill.setSourceType(defaultText(request.getSourceType(), "custom"));
        skill.setMountStatus(defaultText(request.getMountStatus(), "active"));
        skill.setConfigJson(defaultText(request.getConfigJson(), "{}"));
        skill.setSortOrder(0);
        skill.setUpdateTime(now);
        if (created) {
            agentSkillMapper.insert(skill);
            agent.setSkillCount(agent.getSkillCount() + 1);
        } else {
            agentSkillMapper.updateById(skill);
        }
        agent.setUpdateTime(now);
        agentMapper.updateById(agent);
    }

    private void createMemoryForAgent(Agent agent, AgentMemoryRequest request) {
        if (request == null || !StringUtils.hasText(request.getTitle()) || !StringUtils.hasText(request.getContent())) {
            return;
        }
        if (hasExactMemory(agent.getId(), request)) {
            return;
        }
        LocalDateTime now = LocalDateTime.now();
        AgentMemory memory = new AgentMemory();
        memory.setAgentId(agent.getId());
        memory.setTitle(request.getTitle().trim());
        memory.setContent(request.getContent().trim());
        memory.setMemoryType(defaultText(request.getMemoryType(), "note"));
        memory.setImportance(request.getImportance() == null ? 0 : request.getImportance());
        memory.setSource(defaultText(request.getSource(), "agent-sync"));
        memory.setExtJson("{}");
        memory.setCreateTime(now);
        memory.setUpdateTime(now);
        agentMemoryMapper.insert(memory);
        agent.setMemoryCount(agent.getMemoryCount() + 1);
        agent.setUpdateTime(now);
        agentMapper.updateById(agent);
    }

    private boolean hasExactMemory(Long agentId, AgentMemoryRequest request) {
        Long count = agentMemoryMapper.selectCount(new LambdaQueryWrapper<AgentMemory>()
                .eq(AgentMemory::getAgentId, agentId)
                .eq(AgentMemory::getTitle, request.getTitle().trim())
                .eq(AgentMemory::getContent, request.getContent().trim())
                .eq(AgentMemory::getMemoryType, defaultText(request.getMemoryType(), "note"))
                .eq(AgentMemory::getSource, defaultText(request.getSource(), "agent-sync"))
                .isNull(AgentMemory::getDeleteTime));
        return count != null && count > 0;
    }

    private void createGoalForAgent(Agent agent, AgentGoalRequest request) {
        if (request == null || !StringUtils.hasText(request.getTitle())) {
            return;
        }
        LocalDateTime now = LocalDateTime.now();
        AgentGoal goal = findGoalForUpdate(agent.getId(), request.getId());
        boolean created = goal == null;
        if (created && hasExactGoal(agent.getId(), request)) {
            return;
        }
        if (created) {
            goal = new AgentGoal();
            goal.setAgentId(agent.getId());
            goal.setCreateTime(now);
        }
        goal.setTitle(request.getTitle().trim());
        goal.setDescription(defaultText(request.getDescription(), ""));
        goal.setGoalStatus(defaultText(request.getGoalStatus(), "pending"));
        goal.setPriority(request.getPriority() == null ? 0 : request.getPriority());
        goal.setDueTime(request.getDueTime());
        goal.setExtJson(AgentGoalStepSupport.mergeSteps(goal.getExtJson(), request.getSteps(), now));
        goal.setUpdateTime(now);
        if (created) {
            agentGoalMapper.insert(goal);
            agent.setGoalCount(agent.getGoalCount() + 1);
        } else {
            agentGoalMapper.updateById(goal);
        }
        agent.setUpdateTime(now);
        agentMapper.updateById(agent);
    }

    private boolean hasExactGoal(Long agentId, AgentGoalRequest request) {
        LambdaQueryWrapper<AgentGoal> wrapper = new LambdaQueryWrapper<AgentGoal>()
                .eq(AgentGoal::getAgentId, agentId)
                .eq(AgentGoal::getTitle, request.getTitle().trim())
                .eq(AgentGoal::getDescription, defaultText(request.getDescription(), ""))
                .eq(AgentGoal::getGoalStatus, defaultText(request.getGoalStatus(), "pending"))
                .eq(AgentGoal::getPriority, request.getPriority() == null ? 0 : request.getPriority())
                .isNull(AgentGoal::getDeleteTime);
        if (request.getDueTime() == null) {
            wrapper.isNull(AgentGoal::getDueTime);
        } else {
            wrapper.eq(AgentGoal::getDueTime, request.getDueTime());
        }
        Long count = agentGoalMapper.selectCount(wrapper);
        return count != null && count > 0;
    }
    private AgentGoal findGoalForUpdate(Long agentId, String goalId) {
        if (!StringUtils.hasText(goalId)) {
            return null;
        }
        try {
            return agentGoalMapper.selectOne(new LambdaQueryWrapper<AgentGoal>()
                    .eq(AgentGoal::getId, Long.valueOf(goalId.trim()))
                    .eq(AgentGoal::getAgentId, agentId)
                    .isNull(AgentGoal::getDeleteTime)
                    .last("limit 1"));
        } catch (NumberFormatException ignored) {
            return null;
        }
    }


    private void createConfigChangedEvent(Agent agent, String reason, String payloadJson) {
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

    private Agent getTokenAgent(AgentToken token, Long agentId) {
        Long resolvedAgentId = agentId != null ? agentId : token.getAgentId();
        if (resolvedAgentId == null) {
            throw new BusinessException(400, "令牌未绑定智能体");
        }
        if (token.getAgentId() != null && !token.getAgentId().equals(resolvedAgentId)) {
            throw new BusinessException(403, "令牌无权访问该智能体");
        }
        Agent agent = agentMapper.selectOne(new LambdaQueryWrapper<Agent>()
                .eq(Agent::getId, resolvedAgentId)
                .eq(Agent::getOwnerId, token.getOwnerId())
                .isNull(Agent::getDeleteTime)
                .ne(Agent::getStatus, STATUS_DELETED)
                .last("limit 1"));
        if (agent == null) {
            throw new BusinessException(404, "智能体不存在");
        }
        return agent;
    }

    private AgentSkill findSyncedSkill(Long agentId, AgentSkillRequest request) {
        LambdaQueryWrapper<AgentSkill> wrapper = new LambdaQueryWrapper<AgentSkill>()
                .eq(AgentSkill::getAgentId, agentId)
                .eq(AgentSkill::getName, request.getName().trim())
                .eq(AgentSkill::getSourceType, defaultText(request.getSourceType(), "custom"))
                .isNull(AgentSkill::getDeleteTime)
                .last("limit 1");
        if (StringUtils.hasText(request.getConfigJson())) {
            wrapper.eq(AgentSkill::getConfigJson, request.getConfigJson().trim());
        }
        return agentSkillMapper.selectOne(wrapper);
    }

    private List<AgentSkillVO> listTokenSkills(AgentToken token, Long agentId) {
        if (!permissionEnabled(token.getPermissionJson(), "skillRead")) {
            return List.of();
        }
        return listAgentSkills(agentId);
    }

    private List<AgentSkillMountVO> listTokenSkillMounts(AgentToken token, Long agentId) {
        if (!permissionEnabled(token.getPermissionJson(), "skillRead")) {
            return List.of();
        }
        return listAgentSkillMounts(agentId);
    }

    private List<SkillPackageVO> listTokenSkillPackages(AgentToken token, Long agentId) {
        if (!permissionEnabled(token.getPermissionJson(), "skillRead")) {
            return List.of();
        }
        return listMountedSkillPackages(agentId);
    }

    private List<AgentMemoryVO> listTokenMemories(AgentToken token, Long agentId) {
        if (!permissionEnabled(token.getPermissionJson(), "memoryRead")) {
            return List.of();
        }
        return listAgentMemories(agentId);
    }

    private List<AgentGoalVO> listTokenGoals(AgentToken token, Long agentId) {
        if (!permissionEnabled(token.getPermissionJson(), "goalRead")) {
            return List.of();
        }
        return listAgentGoals(agentId);
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
                .map(skill -> toSkillPackageVO(skill, true))
                .toList();
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

    private AgentVO toAgentVO(Agent agent) {
        boolean associated = ASSOCIATION_BOUND.equals(agent.getAssociationStatus()) || hasActiveAgentToken(agent.getId());
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
                associated ? "associated" : "unassociated",
                0,
                ""
        );
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
                        file.getSortOrder()
                ))
                .toList();
    }

    private AgentConfigEventVO toConfigEventVO(AgentConfigEvent event) {
        return new AgentConfigEventVO(
                String.valueOf(event.getId()),
                String.valueOf(event.getAgentId()),
                event.getEventType(),
                event.getEventStatus(),
                event.getPayloadJson(),
                formatDate(event.getCreateTime())
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

    private boolean hasActiveAgentToken(Long agentId) {
        Long count = agentTokenMapper.selectCount(new LambdaQueryWrapper<AgentToken>()
                .eq(AgentToken::getAgentId, agentId)
                .eq(AgentToken::getStatus, STATUS_ACTIVE)
                .isNull(AgentToken::getDeleteTime));
        return count != null && count > 0;
    }

    private Integer countMountedSkills(Long agentId) {
        Long count = agentSkillMountMapper.selectCount(new LambdaQueryWrapper<AgentSkillMount>()
                .eq(AgentSkillMount::getAgentId, agentId)
                .isNull(AgentSkillMount::getDeleteTime));
        return count == null ? 0 : count.intValue();
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

    private String uniqueCode(Long ownerId, String name) {
        String base = name.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9\\u4e00-\\u9fa5]+", "-")
                .replaceAll("^-|-$", "");
        if (!StringUtils.hasText(base)) {
            base = "agent";
        }
        String code = base;
        int index = 1;
        while (agentMapper.selectCount(new LambdaQueryWrapper<Agent>()
                .eq(Agent::getOwnerId, ownerId)
                .eq(Agent::getCode, code)) > 0) {
            code = base + "-" + index++;
        }
        return code;
    }

    private String avatarFor(String name) {
        return "https://api.dicebear.com/7.x/bottts/svg?seed=" + URLEncoder.encode(name, StandardCharsets.UTF_8);
    }

    private String formatDate(LocalDateTime value) {
        return value == null ? "" : value.format(DATE_FORMATTER);
    }

    private void requirePermission(AgentToken token, String permission) {
        if (token == null || !permissionEnabled(token.getPermissionJson(), permission)) {
            throw new BusinessException(403, "令牌缺少权限：" + permission);
        }
    }

    private boolean permissionEnabled(String permissions, String permission) {
        return permissions != null
                && Pattern.compile("\"" + permission + "\"\\s*:\\s*true").matcher(permissions).find();
    }


    private String defaultText(String value, String fallback) {
        return StringUtils.hasText(value) ? value.trim() : fallback;
    }
}
