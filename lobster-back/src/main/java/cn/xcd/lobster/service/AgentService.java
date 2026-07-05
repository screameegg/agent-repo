package cn.xcd.lobster.service;

import cn.xcd.lobster.common.result.PageResult;
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
import cn.xcd.lobster.model.entity.AgentToken;
import cn.xcd.lobster.model.vo.AgentDetailVO;
import cn.xcd.lobster.model.vo.AgentConfigEventVO;
import cn.xcd.lobster.model.vo.AgentGoalVO;
import cn.xcd.lobster.model.vo.AgentMemoryVO;
import cn.xcd.lobster.model.vo.AgentSkillVO;
import cn.xcd.lobster.model.vo.AgentSkillMountVO;
import cn.xcd.lobster.model.vo.AgentTokenCreateVO;
import cn.xcd.lobster.model.vo.AgentTokenVO;
import cn.xcd.lobster.model.vo.AgentVO;

import java.util.List;

public interface AgentService {

    PageResult<AgentVO> page(Long current, Long size, String keyword);

    AgentVO profile(Long id);

    AgentDetailVO exportBackup(Long id);

    AgentDetailVO importBackup(AgentBackupImportRequest request);

    AgentVO create(AgentCreateRequest request);

    AgentVO update(Long id, AgentUpdateRequest request);

    void delete(Long id);

    List<AgentSkillVO> listSkills(Long agentId);

    AgentSkillVO createSkill(Long agentId, AgentSkillRequest request);

    List<AgentSkillMountVO> listSkillMounts(Long agentId);

    AgentSkillMountVO mountSkill(Long agentId, AgentSkillMountRequest request);

    void unmountSkill(Long agentId, Long skillId);

    List<AgentMemoryVO> listMemories(Long agentId);

    AgentMemoryVO createMemory(Long agentId, AgentMemoryRequest request);

    void deleteMemory(Long agentId, Long memoryId);

    List<AgentGoalVO> listGoals(Long agentId);

    AgentGoalVO createGoal(Long agentId, AgentGoalRequest request);

    AgentGoalVO updateGoal(Long agentId, Long goalId, AgentGoalRequest request);

    void deleteGoal(Long agentId, Long goalId);

    List<AgentTokenVO> listTokens();

    AgentTokenCreateVO createToken(AgentTokenCreateRequest request);

    AgentTokenVO updateToken(Long id, AgentTokenUpdateRequest request);

    void deleteToken(Long id);

    AgentDetailVO registerByToken(AgentToken token, AiAgentRegisterRequest request);

    AgentDetailVO syncByToken(AgentToken token, Long agentId, AiAgentSyncRequest request);

    AgentDetailVO tokenConfig(AgentToken token, Long agentId);

    AgentDetailVO tokenBackup(AgentToken token, Long agentId);

    List<AgentConfigEventVO> listTokenEvents(AgentToken token, Long agentId);

    void ackTokenEvent(AgentToken token, Long eventId);
}
