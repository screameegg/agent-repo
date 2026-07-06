package cn.xcd.lobster.service.impl;

import cn.xcd.lobster.mapper.AgentConfigEventMapper;
import cn.xcd.lobster.mapper.AgentGoalMapper;
import cn.xcd.lobster.mapper.AgentMapper;
import cn.xcd.lobster.mapper.AgentMemoryMapper;
import cn.xcd.lobster.mapper.AgentSkillMapper;
import cn.xcd.lobster.mapper.AgentSkillMountMapper;
import cn.xcd.lobster.mapper.AgentTokenMapper;
import cn.xcd.lobster.mapper.SkillFileMapper;
import cn.xcd.lobster.mapper.SkillPackageMapper;
import cn.xcd.lobster.common.exception.BusinessException;
import cn.xcd.lobster.model.entity.Agent;
import cn.xcd.lobster.model.entity.AgentConfigEvent;
import cn.xcd.lobster.model.entity.AgentGoal;
import cn.xcd.lobster.model.entity.AgentMemory;
import cn.xcd.lobster.model.entity.AgentSkill;
import cn.xcd.lobster.model.entity.AgentToken;
import cn.xcd.lobster.model.dto.AgentGoalRequest;
import cn.xcd.lobster.model.dto.AgentGoalStepRequest;
import cn.xcd.lobster.model.dto.AgentMemoryRequest;
import cn.xcd.lobster.model.dto.AgentSkillRequest;
import cn.xcd.lobster.model.dto.AiAgentRegisterRequest;
import cn.xcd.lobster.model.dto.AiAgentSyncRequest;
import cn.xcd.lobster.model.vo.AgentDetailVO;
import com.baomidou.mybatisplus.core.conditions.Wrapper;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AgentSyncServiceImplPermissionTest {

    @Test
    void agentSyncDoesNotWriteChildrenWithoutWritePermissions() {
        AgentMapper agentMapper = mock(AgentMapper.class);
        AgentSkillMapper agentSkillMapper = mock(AgentSkillMapper.class);
        AgentMemoryMapper agentMemoryMapper = mock(AgentMemoryMapper.class);
        AgentGoalMapper agentGoalMapper = mock(AgentGoalMapper.class);
        AgentTokenMapper agentTokenMapper = mock(AgentTokenMapper.class);
        AgentSkillMountMapper agentSkillMountMapper = mock(AgentSkillMountMapper.class);
        SkillPackageMapper skillPackageMapper = mock(SkillPackageMapper.class);
        SkillFileMapper skillFileMapper = mock(SkillFileMapper.class);
        AgentConfigEventMapper agentConfigEventMapper = mock(AgentConfigEventMapper.class);

        AgentSyncServiceImpl service = new AgentSyncServiceImpl(
                agentMapper,
                agentSkillMapper,
                agentMemoryMapper,
                agentGoalMapper,
                agentTokenMapper,
                agentSkillMountMapper,
                skillPackageMapper,
                skillFileMapper,
                agentConfigEventMapper,
                mock(AgentSyncSkillMountService.class)
        );

        Agent agent = new Agent();
        agent.setId(10L);
        agent.setOwnerId(1L);
        agent.setName("Read Mostly Agent");
        agent.setCode("read-mostly-agent");
        agent.setDescription("Syncs metadata only");
        agent.setRole("研发专家");
        agent.setSkillCount(0);
        agent.setMemoryCount(0);
        agent.setGoalCount(0);
        agent.setAvatar("");
        agent.setBaseModel("Claude 3");
        agent.setStatus("active");
        agent.setAssociationStatus("bound");
        agent.setCreateTime(LocalDateTime.now());

        AgentToken token = new AgentToken();
        token.setOwnerId(1L);
        token.setAgentId(10L);
        token.setPermissionJson("""
                {"agentSync":true,"configRead":true,
                "skillWrite":false,"memoryWrite":false,"goalWrite":false}
                """);

        AgentSkillRequest skillRequest = new AgentSkillRequest();
        skillRequest.setName("Writer");
        AgentMemoryRequest memoryRequest = new AgentMemoryRequest();
        memoryRequest.setTitle("Rule");
        memoryRequest.setContent("Do not write");
        AgentGoalRequest goalRequest = new AgentGoalRequest();
        goalRequest.setTitle("Stay read-only");
        AiAgentSyncRequest request = new AiAgentSyncRequest();
        request.setName("Read Mostly Agent");
        request.setSkills(List.of(skillRequest));
        request.setMemories(List.of(memoryRequest));
        request.setGoals(List.of(goalRequest));

        when(agentMapper.selectOne(any(Wrapper.class))).thenReturn(agent);
        when(agentTokenMapper.selectCount(any(Wrapper.class))).thenReturn(1L);
        when(agentSkillMountMapper.selectCount(any(Wrapper.class))).thenReturn(0L);
        when(agentSkillMapper.selectList(any(Wrapper.class))).thenReturn(List.of());
        when(agentSkillMountMapper.selectList(any(Wrapper.class))).thenReturn(List.of());
        when(agentMemoryMapper.selectList(any(Wrapper.class))).thenReturn(List.of());
        when(agentGoalMapper.selectList(any(Wrapper.class))).thenReturn(List.of());

        service.syncByToken(token, 10L, request);

        verify(agentSkillMapper, never()).insert(any(AgentSkill.class));
        verify(agentMemoryMapper, never()).insert(any(AgentMemory.class));
        verify(agentGoalMapper, never()).insert(any(AgentGoal.class));
    }

    @Test
    void agentSyncWritesMemoryAfterConfigPreflightConfirmation() {
        AgentMapper agentMapper = mock(AgentMapper.class);
        AgentSkillMapper agentSkillMapper = mock(AgentSkillMapper.class);
        AgentMemoryMapper agentMemoryMapper = mock(AgentMemoryMapper.class);
        AgentGoalMapper agentGoalMapper = mock(AgentGoalMapper.class);
        AgentTokenMapper agentTokenMapper = mock(AgentTokenMapper.class);
        AgentSkillMountMapper agentSkillMountMapper = mock(AgentSkillMountMapper.class);
        SkillPackageMapper skillPackageMapper = mock(SkillPackageMapper.class);
        SkillFileMapper skillFileMapper = mock(SkillFileMapper.class);
        AgentConfigEventMapper agentConfigEventMapper = mock(AgentConfigEventMapper.class);

        AgentSyncServiceImpl service = new AgentSyncServiceImpl(
                agentMapper,
                agentSkillMapper,
                agentMemoryMapper,
                agentGoalMapper,
                agentTokenMapper,
                agentSkillMountMapper,
                skillPackageMapper,
                skillFileMapper,
                agentConfigEventMapper,
                mock(AgentSyncSkillMountService.class)
        );

        Agent agent = new Agent();
        agent.setId(10L);
        agent.setOwnerId(1L);
        agent.setName("Protected Agent");
        agent.setCode("protected-agent");
        agent.setDescription("Requires sync preflight");
        agent.setRole("研发专家");
        agent.setSkillCount(0);
        agent.setMemoryCount(0);
        agent.setGoalCount(0);
        agent.setAvatar("");
        agent.setBaseModel("Claude 3");
        agent.setStatus("active");
        agent.setAssociationStatus("bound");
        agent.setCreateTime(LocalDateTime.now());
        agent.setUpdateTime(LocalDateTime.now());

        AgentToken token = new AgentToken();
        token.setOwnerId(1L);
        token.setAgentId(10L);
        token.setPermissionJson("""
                {"agentSync":true,"configRead":true,
                "memoryWrite":true,"memoryRead":true}
                """);

        when(agentMapper.selectOne(any(Wrapper.class))).thenReturn(agent);
        when(agentTokenMapper.selectCount(any(Wrapper.class))).thenReturn(1L);
        when(agentSkillMountMapper.selectCount(any(Wrapper.class))).thenReturn(0L);
        when(agentSkillMapper.selectList(any(Wrapper.class))).thenReturn(List.of());
        when(agentSkillMountMapper.selectList(any(Wrapper.class))).thenReturn(List.of());
        when(agentMemoryMapper.selectList(any(Wrapper.class))).thenReturn(List.of());
        when(agentGoalMapper.selectList(any(Wrapper.class))).thenReturn(List.of());

        AgentDetailVO config = service.tokenConfig(token, 10L);
        assertNotNull(config.getSyncRevision());
        assertNotEquals("", config.getSyncRevision());

        AgentMemoryRequest memoryRequest = new AgentMemoryRequest();
        memoryRequest.setTitle("Project rule");
        memoryRequest.setContent("Do not duplicate platform memories");
        AiAgentSyncRequest request = new AiAgentSyncRequest();
        request.setBaseRevision(config.getSyncRevision());
        request.setConfirmSync(true);
        request.setMemories(List.of(memoryRequest));

        service.syncByToken(token, 10L, request);

        verify(agentMemoryMapper).insert(any(AgentMemory.class));
    }

    @Test
    void agentSyncSkipsExactDuplicateMemoryAfterPreflightConfirmation() {
        AgentMapper agentMapper = mock(AgentMapper.class);
        AgentSkillMapper agentSkillMapper = mock(AgentSkillMapper.class);
        AgentMemoryMapper agentMemoryMapper = mock(AgentMemoryMapper.class);
        AgentGoalMapper agentGoalMapper = mock(AgentGoalMapper.class);
        AgentTokenMapper agentTokenMapper = mock(AgentTokenMapper.class);
        AgentSkillMountMapper agentSkillMountMapper = mock(AgentSkillMountMapper.class);
        SkillPackageMapper skillPackageMapper = mock(SkillPackageMapper.class);
        SkillFileMapper skillFileMapper = mock(SkillFileMapper.class);
        AgentConfigEventMapper agentConfigEventMapper = mock(AgentConfigEventMapper.class);

        AgentSyncServiceImpl service = new AgentSyncServiceImpl(
                agentMapper,
                agentSkillMapper,
                agentMemoryMapper,
                agentGoalMapper,
                agentTokenMapper,
                agentSkillMountMapper,
                skillPackageMapper,
                skillFileMapper,
                agentConfigEventMapper,
                mock(AgentSyncSkillMountService.class)
        );

        Agent agent = new Agent();
        agent.setId(10L);
        agent.setOwnerId(1L);
        agent.setName("Protected Agent");
        agent.setCode("protected-agent");
        agent.setDescription("Skips duplicate memories");
        agent.setRole("研发专家");
        agent.setSkillCount(0);
        agent.setMemoryCount(1);
        agent.setGoalCount(0);
        agent.setAvatar("");
        agent.setBaseModel("Claude 3");
        agent.setStatus("active");
        agent.setAssociationStatus("bound");
        agent.setCreateTime(LocalDateTime.now());
        agent.setUpdateTime(LocalDateTime.now());

        AgentMemory existing = new AgentMemory();
        existing.setId(30L);
        existing.setAgentId(10L);
        existing.setTitle("Project rule");
        existing.setContent("Do not duplicate platform memories");
        existing.setMemoryType("fact");
        existing.setImportance(8);
        existing.setSource("agent-sync");
        existing.setCreateTime(LocalDateTime.now());

        AgentToken token = new AgentToken();
        token.setOwnerId(1L);
        token.setAgentId(10L);
        token.setPermissionJson("""
                {"agentSync":true,"configRead":true,
                "memoryWrite":true,"memoryRead":true}
                """);

        when(agentMapper.selectOne(any(Wrapper.class))).thenReturn(agent);
        when(agentTokenMapper.selectCount(any(Wrapper.class))).thenReturn(1L);
        when(agentSkillMountMapper.selectCount(any(Wrapper.class))).thenReturn(0L);
        when(agentSkillMapper.selectList(any(Wrapper.class))).thenReturn(List.of());
        when(agentSkillMountMapper.selectList(any(Wrapper.class))).thenReturn(List.of());
        when(agentMemoryMapper.selectList(any(Wrapper.class))).thenReturn(List.of(existing));
        when(agentMemoryMapper.selectCount(any(Wrapper.class))).thenReturn(1L);
        when(agentGoalMapper.selectList(any(Wrapper.class))).thenReturn(List.of());

        AgentDetailVO config = service.tokenConfig(token, 10L);

        AgentMemoryRequest memoryRequest = new AgentMemoryRequest();
        memoryRequest.setTitle("Project rule");
        memoryRequest.setContent("Do not duplicate platform memories");
        memoryRequest.setMemoryType("fact");
        memoryRequest.setImportance(8);
        memoryRequest.setSource("agent-sync");
        AiAgentSyncRequest request = new AiAgentSyncRequest();
        request.setBaseRevision(config.getSyncRevision());
        request.setConfirmSync(true);
        request.setMemories(List.of(memoryRequest));

        service.syncByToken(token, 10L, request);

        verify(agentMemoryMapper, never()).insert(any(AgentMemory.class));
    }

    @Test
    void agentSyncUpdatesExistingGoalStepsAfterConfigPreflightConfirmation() {
        AgentMapper agentMapper = mock(AgentMapper.class);
        AgentSkillMapper agentSkillMapper = mock(AgentSkillMapper.class);
        AgentMemoryMapper agentMemoryMapper = mock(AgentMemoryMapper.class);
        AgentGoalMapper agentGoalMapper = mock(AgentGoalMapper.class);
        AgentTokenMapper agentTokenMapper = mock(AgentTokenMapper.class);
        AgentSkillMountMapper agentSkillMountMapper = mock(AgentSkillMountMapper.class);
        SkillPackageMapper skillPackageMapper = mock(SkillPackageMapper.class);
        SkillFileMapper skillFileMapper = mock(SkillFileMapper.class);
        AgentConfigEventMapper agentConfigEventMapper = mock(AgentConfigEventMapper.class);

        AgentSyncServiceImpl service = new AgentSyncServiceImpl(
                agentMapper,
                agentSkillMapper,
                agentMemoryMapper,
                agentGoalMapper,
                agentTokenMapper,
                agentSkillMountMapper,
                skillPackageMapper,
                skillFileMapper,
                agentConfigEventMapper,
                mock(AgentSyncSkillMountService.class)
        );

        Agent agent = new Agent();
        agent.setId(10L);
        agent.setOwnerId(1L);
        agent.setName("Goal Agent");
        agent.setCode("goal-agent");
        agent.setDescription("Updates goals");
        agent.setRole("研发专家");
        agent.setSkillCount(0);
        agent.setMemoryCount(0);
        agent.setGoalCount(1);
        agent.setAvatar("");
        agent.setBaseModel("Claude 3");
        agent.setStatus("active");
        agent.setAssociationStatus("bound");
        agent.setCreateTime(LocalDateTime.now());
        agent.setUpdateTime(LocalDateTime.now());

        AgentGoal existing = new AgentGoal();
        existing.setId(40L);
        existing.setAgentId(10L);
        existing.setTitle("Ship goals");
        existing.setDescription("Existing goal");
        existing.setGoalStatus("running");
        existing.setPriority(5);
        existing.setExtJson("{\"source\":\"platform\"}");
        existing.setCreateTime(LocalDateTime.now());

        AgentToken token = new AgentToken();
        token.setOwnerId(1L);
        token.setAgentId(10L);
        token.setPermissionJson("{\"agentSync\":true,\"configRead\":true,\"goalRead\":true,\"goalWrite\":true}");

        when(agentMapper.selectOne(any(Wrapper.class))).thenReturn(agent);
        when(agentTokenMapper.selectCount(any(Wrapper.class))).thenReturn(1L);
        when(agentSkillMountMapper.selectCount(any(Wrapper.class))).thenReturn(0L);
        when(agentSkillMapper.selectList(any(Wrapper.class))).thenReturn(List.of());
        when(agentSkillMountMapper.selectList(any(Wrapper.class))).thenReturn(List.of());
        when(agentMemoryMapper.selectList(any(Wrapper.class))).thenReturn(List.of());
        when(agentGoalMapper.selectList(any(Wrapper.class))).thenReturn(List.of(existing));
        when(agentGoalMapper.selectOne(any(Wrapper.class))).thenReturn(existing);

        AgentDetailVO config = service.tokenConfig(token, 10L);

        AgentGoalStepRequest step = new AgentGoalStepRequest();
        step.setId("step-1");
        step.setTitle("智能体推进目标");
        step.setStatus("completed");
        AgentGoalRequest goalRequest = new AgentGoalRequest();
        goalRequest.setId("40");
        goalRequest.setTitle("Ship goals");
        goalRequest.setDescription("Updated by agent");
        goalRequest.setGoalStatus("running");
        goalRequest.setPriority(7);
        goalRequest.setSteps(List.of(step));
        AiAgentSyncRequest request = new AiAgentSyncRequest();
        request.setBaseRevision(config.getSyncRevision());
        request.setConfirmSync(true);
        request.setGoals(List.of(goalRequest));

        service.syncByToken(token, 10L, request);

        verify(agentGoalMapper).updateById(existing);
        verify(agentGoalMapper, never()).insert(any(AgentGoal.class));
        assertEquals("Updated by agent", existing.getDescription());
        assertTrue(existing.getExtJson().contains("智能体推进目标"));
        assertTrue(existing.getExtJson().contains("\"source\":\"platform\""));
    }

    @Test
    void registerReportsDuplicateNameBeforeMissingRole() {
        AgentMapper agentMapper = mock(AgentMapper.class);
        AgentSkillMapper agentSkillMapper = mock(AgentSkillMapper.class);
        AgentMemoryMapper agentMemoryMapper = mock(AgentMemoryMapper.class);
        AgentGoalMapper agentGoalMapper = mock(AgentGoalMapper.class);
        AgentTokenMapper agentTokenMapper = mock(AgentTokenMapper.class);
        AgentSkillMountMapper agentSkillMountMapper = mock(AgentSkillMountMapper.class);
        SkillPackageMapper skillPackageMapper = mock(SkillPackageMapper.class);
        SkillFileMapper skillFileMapper = mock(SkillFileMapper.class);
        AgentConfigEventMapper agentConfigEventMapper = mock(AgentConfigEventMapper.class);

        AgentSyncServiceImpl service = new AgentSyncServiceImpl(
                agentMapper,
                agentSkillMapper,
                agentMemoryMapper,
                agentGoalMapper,
                agentTokenMapper,
                agentSkillMountMapper,
                skillPackageMapper,
                skillFileMapper,
                agentConfigEventMapper,
                mock(AgentSyncSkillMountService.class)
        );
        AgentToken token = new AgentToken();
        token.setOwnerId(1L);
        token.setPermissionJson("{\"agentRegister\":true}");
        AiAgentRegisterRequest request = new AiAgentRegisterRequest();
        request.setName("Existing Agent");

        when(agentMapper.selectCount(any(Wrapper.class))).thenReturn(1L);

        BusinessException error = assertThrows(BusinessException.class, () -> service.registerByToken(token, request));

        assertEquals(409, error.getCode());
        assertEquals("名称已存在", error.getMessage());
    }

    @Test
    void agentSyncSkipsExactDuplicateGoalAfterPreflightConfirmation() {
        AgentMapper agentMapper = mock(AgentMapper.class);
        AgentSkillMapper agentSkillMapper = mock(AgentSkillMapper.class);
        AgentMemoryMapper agentMemoryMapper = mock(AgentMemoryMapper.class);
        AgentGoalMapper agentGoalMapper = mock(AgentGoalMapper.class);
        AgentTokenMapper agentTokenMapper = mock(AgentTokenMapper.class);
        AgentSkillMountMapper agentSkillMountMapper = mock(AgentSkillMountMapper.class);
        SkillPackageMapper skillPackageMapper = mock(SkillPackageMapper.class);
        SkillFileMapper skillFileMapper = mock(SkillFileMapper.class);
        AgentConfigEventMapper agentConfigEventMapper = mock(AgentConfigEventMapper.class);

        AgentSyncServiceImpl service = new AgentSyncServiceImpl(
                agentMapper,
                agentSkillMapper,
                agentMemoryMapper,
                agentGoalMapper,
                agentTokenMapper,
                agentSkillMountMapper,
                skillPackageMapper,
                skillFileMapper,
                agentConfigEventMapper,
                mock(AgentSyncSkillMountService.class)
        );

        Agent agent = new Agent();
        agent.setId(10L);
        agent.setOwnerId(1L);
        agent.setName("Goal Agent");
        agent.setCode("goal-agent");
        agent.setDescription("Skips duplicate goals");
        agent.setRole("研发专家");
        agent.setSkillCount(0);
        agent.setMemoryCount(0);
        agent.setGoalCount(1);
        agent.setAvatar("");
        agent.setBaseModel("Claude 3");
        agent.setStatus("active");
        agent.setAssociationStatus("bound");
        agent.setCreateTime(LocalDateTime.now());
        agent.setUpdateTime(LocalDateTime.now());

        AgentGoal existing = new AgentGoal();
        existing.setId(40L);
        existing.setAgentId(10L);
        existing.setTitle("保持平台配置同步");
        existing.setDescription("轮询 events，拉取 config，应用后 ack。");
        existing.setGoalStatus("running");
        existing.setPriority(9);
        existing.setCreateTime(LocalDateTime.now());

        AgentToken token = new AgentToken();
        token.setOwnerId(1L);
        token.setAgentId(10L);
        token.setPermissionJson("{\"agentSync\":true,\"configRead\":true,\"goalRead\":true,\"goalWrite\":true}");

        when(agentMapper.selectOne(any(Wrapper.class))).thenReturn(agent);
        when(agentTokenMapper.selectCount(any(Wrapper.class))).thenReturn(1L);
        when(agentSkillMountMapper.selectCount(any(Wrapper.class))).thenReturn(0L);
        when(agentSkillMapper.selectList(any(Wrapper.class))).thenReturn(List.of());
        when(agentSkillMountMapper.selectList(any(Wrapper.class))).thenReturn(List.of());
        when(agentMemoryMapper.selectList(any(Wrapper.class))).thenReturn(List.of());
        when(agentGoalMapper.selectList(any(Wrapper.class))).thenReturn(List.of(existing));
        when(agentGoalMapper.selectCount(any(Wrapper.class))).thenReturn(1L);

        AgentDetailVO config = service.tokenConfig(token, 10L);

        AgentGoalRequest goalRequest = new AgentGoalRequest();
        goalRequest.setTitle("保持平台配置同步");
        goalRequest.setDescription("轮询 events，拉取 config，应用后 ack。");
        goalRequest.setGoalStatus("running");
        goalRequest.setPriority(9);
        AiAgentSyncRequest request = new AiAgentSyncRequest();
        request.setBaseRevision(config.getSyncRevision());
        request.setConfirmSync(true);
        request.setGoals(List.of(goalRequest));

        service.syncByToken(token, 10L, request);

        verify(agentGoalMapper, never()).insert(any(AgentGoal.class));
        verify(agentConfigEventMapper, never()).insert(any(AgentConfigEvent.class));
    }

}
