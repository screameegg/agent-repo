package cn.xcd.lobster.service;

import cn.xcd.lobster.model.dto.AiAgentRegisterRequest;
import cn.xcd.lobster.model.dto.AiAgentSyncRequest;
import cn.xcd.lobster.model.entity.AgentToken;
import cn.xcd.lobster.model.vo.AgentConfigEventVO;
import cn.xcd.lobster.model.vo.AgentDetailVO;
import cn.xcd.lobster.model.vo.AgentMemoryVO;
import cn.xcd.lobster.model.vo.AiAgentSyncResponse;

import java.util.List;

public interface AgentSyncService {

    AgentDetailVO registerByToken(AgentToken token, AiAgentRegisterRequest request);

    AiAgentSyncResponse syncByToken(AgentToken token, Long agentId, AiAgentSyncRequest request);

    AgentDetailVO tokenConfig(AgentToken token, Long agentId);

    AgentDetailVO tokenConfig(AgentToken token, Long agentId, boolean brief);

    AgentDetailVO tokenBackup(AgentToken token, Long agentId);

    List<AgentConfigEventVO> listTokenEvents(AgentToken token, Long agentId);

    void deleteMemoryByToken(AgentToken token, Long agentId, Long memoryId);

    AgentMemoryVO getMemoryByToken(AgentToken token, Long agentId, Long memoryId);

    void deleteGoalByToken(AgentToken token, Long agentId, Long goalId);

    void ackTokenEvent(AgentToken token, Long eventId);
}
