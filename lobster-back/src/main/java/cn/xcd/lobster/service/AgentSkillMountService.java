package cn.xcd.lobster.service;

import cn.xcd.lobster.model.dto.AgentSkillMountRequest;
import cn.xcd.lobster.model.vo.AgentSkillMountVO;

public interface AgentSkillMountService {

    AgentSkillMountVO mountSkill(Long agentId, AgentSkillMountRequest request);

    AgentSkillMountVO mountSkillForOwner(Long ownerId, Long agentId, AgentSkillMountRequest request);

    AgentSkillMountVO mountSkillForOwner(Long ownerId, Long agentId, AgentSkillMountRequest request, boolean notifyAgent);

    void unmountSkill(Long agentId, Long skillId);
}
