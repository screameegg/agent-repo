package cn.xcd.lobster.service.impl;

import cn.dev33.satoken.stp.StpUtil;
import cn.xcd.lobster.common.exception.BusinessException;
import cn.xcd.lobster.mapper.AgentConfigEventMapper;
import cn.xcd.lobster.mapper.AgentMapper;
import cn.xcd.lobster.mapper.AgentSkillMapper;
import cn.xcd.lobster.mapper.AgentSkillMountMapper;
import cn.xcd.lobster.mapper.SkillPackageMapper;
import cn.xcd.lobster.model.dto.AgentSkillMountRequest;
import cn.xcd.lobster.model.entity.Agent;
import cn.xcd.lobster.model.entity.AgentConfigEvent;
import cn.xcd.lobster.model.entity.AgentSkill;
import cn.xcd.lobster.model.entity.AgentSkillMount;
import cn.xcd.lobster.model.entity.SkillPackage;
import cn.xcd.lobster.model.vo.AgentSkillMountVO;
import cn.xcd.lobster.service.AgentSkillMountService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class AgentSkillMountServiceImpl implements AgentSkillMountService {

    private static final String STATUS_DELETED = "deleted";

    private final AgentMapper agentMapper;
    private final AgentSkillMapper agentSkillMapper;
    private final AgentSkillMountMapper agentSkillMountMapper;
    private final SkillPackageMapper skillPackageMapper;
    private final AgentConfigEventMapper agentConfigEventMapper;

    @Override
    @Transactional
    public AgentSkillMountVO mountSkill(Long agentId, AgentSkillMountRequest request) {
        return mountSkillForOwner(currentOwnerId(), agentId, request);
    }

    @Override
    @Transactional
    public AgentSkillMountVO mountSkillForOwner(Long ownerId, Long agentId, AgentSkillMountRequest request) {
        return mountSkillForOwner(ownerId, agentId, request, true);
    }

    @Override
    @Transactional
    public AgentSkillMountVO mountSkillForOwner(Long ownerId, Long agentId, AgentSkillMountRequest request, boolean notifyAgent) {
        Agent agent = getOwnedAgent(ownerId, agentId);
        SkillPackage skill = getMountableSkill(ownerId, request.getSkillId());
        LocalDateTime now = LocalDateTime.now();
        AgentSkillMount mount = agentSkillMountMapper.selectOne(new LambdaQueryWrapper<AgentSkillMount>()
                .eq(AgentSkillMount::getAgentId, agentId)
                .eq(AgentSkillMount::getSkillId, skill.getId())
                .last("limit 1"));
        String nextStatus = defaultText(request.getMountStatus(), "active");
        String nextConfig = defaultText(request.getConfigJson(), "{}");
        boolean changed = mount == null
                || mount.getDeleteTime() != null
                || !Objects.equals(mount.getMountStatus(), nextStatus)
                || !Objects.equals(mount.getConfigJson(), nextConfig);
        if (mount == null) {
            mount = new AgentSkillMount();
            mount.setAgentId(agentId);
            mount.setSkillId(skill.getId());
            mount.setCreateTime(now);
        }
        mount.setMountStatus(nextStatus);
        mount.setConfigJson(nextConfig);
        mount.setSortOrder(0);
        mount.setDeleteTime(null);
        mount.setUpdateTime(now);
        if (mount.getId() == null) {
            agentSkillMountMapper.insert(mount);
        } else {
            agentSkillMountMapper.updateById(mount);
        }

        createMountedSkillSnapshot(agent, skill, mount);
        if (changed && notifyAgent) {
            createConfigChangedEvent(agent, "skill_mounted", "{\"skillId\":\"" + skill.getId() + "\"}");
        }
        return toSkillMountVO(mount);
    }

    @Override
    @Transactional
    public void unmountSkill(Long agentId, Long skillId) {
        Agent agent = getOwnedAgent(currentOwnerId(), agentId);
        AgentSkillMount mount = agentSkillMountMapper.selectOne(new LambdaQueryWrapper<AgentSkillMount>()
                .eq(AgentSkillMount::getAgentId, agentId)
                .eq(AgentSkillMount::getSkillId, skillId)
                .isNull(AgentSkillMount::getDeleteTime)
                .last("limit 1"));
        if (mount == null) {
            throw new BusinessException(404, "Agent未挂载该技能");
        }
        LocalDateTime now = LocalDateTime.now();
        mount.setMountStatus("disabled");
        mount.setDeleteTime(now);
        mount.setUpdateTime(now);
        agentSkillMountMapper.updateById(mount);
        AgentSkill snapshot = findMountedSkillSnapshot(agentId, skillId);
        if (snapshot != null) {
            snapshot.setMountStatus("disabled");
            snapshot.setDeleteTime(now);
            snapshot.setUpdateTime(now);
            agentSkillMapper.updateById(snapshot);
            agent.setSkillCount(Math.max(0, agent.getSkillCount() - 1));
        }
        agent.setUpdateTime(now);
        agentMapper.updateById(agent);
        createConfigChangedEvent(agent, "skill_unmounted", "{\"skillId\":\"" + skillId + "\"}");
    }

    private Agent getOwnedAgent(Long ownerId, Long id) {
        Agent agent = agentMapper.selectOne(new LambdaQueryWrapper<Agent>()
                .eq(Agent::getId, id)
                .eq(Agent::getOwnerId, ownerId)
                .isNull(Agent::getDeleteTime)
                .ne(Agent::getStatus, STATUS_DELETED)
                .last("limit 1"));
        if (agent == null) {
            throw new BusinessException(404, "Agent不存在");
        }
        return agent;
    }

    private SkillPackage getMountableSkill(Long ownerId, Long skillId) {
        if (skillId == null) {
            throw new BusinessException(400, "技能ID不能为空");
        }
        SkillPackage skill = skillPackageMapper.selectById(skillId);
        if (skill == null || skill.getDeleteTime() != null) {
            throw new BusinessException(404, "技能不存在");
        }
        boolean own = ownerId.equals(skill.getOwnerId());
        boolean publicPublished = "public".equals(skill.getVisibility()) && "published".equals(skill.getPublishStatus());
        if (!own && !publicPublished) {
            throw new BusinessException(403, "无权挂载该技能");
        }
        return skill;
    }

    private void createMountedSkillSnapshot(Agent agent, SkillPackage skill, AgentSkillMount mount) {
        AgentSkill existing = findMountedSkillSnapshot(agent.getId(), skill.getId());
        LocalDateTime now = LocalDateTime.now();
        AgentSkill snapshot = existing == null ? new AgentSkill() : existing;
        snapshot.setAgentId(agent.getId());
        snapshot.setName(skill.getName());
        snapshot.setDescription(defaultText(skill.getDescription(), ""));
        snapshot.setIcon(defaultText(skill.getIcon(), "Network"));
        snapshot.setSourceType("skill_package");
        snapshot.setMountStatus(mount.getMountStatus());
        snapshot.setConfigJson(defaultText(mount.getConfigJson(), "{\"skillId\":\"" + skill.getId() + "\"}"));
        snapshot.setSortOrder(mount.getSortOrder());
        snapshot.setDeleteTime(null);
        snapshot.setUpdateTime(now);
        if (snapshot.getId() == null) {
            snapshot.setCreateTime(now);
            agentSkillMapper.insert(snapshot);
            agent.setSkillCount(agent.getSkillCount() + 1);
            agent.setUpdateTime(now);
            agentMapper.updateById(agent);
        } else {
            agentSkillMapper.updateById(snapshot);
        }
    }

    private AgentSkill findMountedSkillSnapshot(Long agentId, Long skillId) {
        return agentSkillMapper.selectOne(new LambdaQueryWrapper<AgentSkill>()
                .eq(AgentSkill::getAgentId, agentId)
                .eq(AgentSkill::getSourceType, "skill_package")
                .like(AgentSkill::getConfigJson, "\"skillId\":\"" + skillId + "\"")
                .isNull(AgentSkill::getDeleteTime)
                .last("limit 1"));
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

    private Long currentOwnerId() {
        Object loginId = StpUtil.getLoginId();
        return Long.valueOf(String.valueOf(loginId));
    }

    private String defaultText(String value, String fallback) {
        return StringUtils.hasText(value) ? value.trim() : fallback;
    }
}
