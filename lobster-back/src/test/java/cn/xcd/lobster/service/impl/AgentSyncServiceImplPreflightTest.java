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
import cn.xcd.lobster.model.entity.AgentGoal;
import cn.xcd.lobster.model.entity.AgentMemory;
import cn.xcd.lobster.model.entity.AgentSkill;
import cn.xcd.lobster.model.entity.AgentToken;
import cn.xcd.lobster.model.dto.AgentGoalRequest;
import cn.xcd.lobster.model.dto.AgentGoalStepRequest;
import cn.xcd.lobster.model.dto.AgentMemoryRequest;
import cn.xcd.lobster.model.dto.AgentSkillRequest;
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

class AgentSyncServiceImplPreflightTest {

    @Test
    void tokenConfigIncludesChildrenWithReadOnlyPermissions() {
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
        agent.setName("Source Agent");
        agent.setCode("source-agent");
        agent.setDescription("Provides shared config");
        agent.setRole("研发专家");
        agent.setSkillCount(1);
        agent.setMemoryCount(1);
        agent.setGoalCount(1);
        agent.setAvatar("");
        agent.setBaseModel("Claude 3");
        agent.setStatus("active");
        agent.setAssociationStatus("bound");
        agent.setCreateTime(LocalDateTime.now());

        AgentSkill skill = new AgentSkill();
        skill.setId(20L);
        skill.setAgentId(10L);
        skill.setName("Repository Reader");
        skill.setDescription("Reads repositories");
        skill.setIcon("Network");
        skill.setSourceType("custom");
        skill.setMountStatus("active");

        AgentMemory memory = new AgentMemory();
        memory.setId(30L);
        memory.setAgentId(10L);
        memory.setTitle("Project rule");
        memory.setContent("Keep permissions read-only");
        memory.setMemoryType("fact");
        memory.setImportance(8);
        memory.setSource("platform");
        memory.setCreateTime(LocalDateTime.now());

        AgentGoal goal = new AgentGoal();
        goal.setId(40L);
        goal.setAgentId(10L);
        goal.setTitle("Review pull config");
        goal.setDescription("Pull source config without writing");
        goal.setGoalStatus("pending");
        goal.setPriority(5);

        AgentToken token = new AgentToken();
        token.setOwnerId(1L);
        token.setAgentId(10L);
        token.setPermissionJson("""
                {"configRead":true,"skillRead":true,"memoryRead":true,"goalRead":true,
                "skillWrite":false,"memoryWrite":false,"goalWrite":false,"agentSync":false}
                """);

        when(agentMapper.selectOne(any(Wrapper.class))).thenReturn(agent);
        when(agentTokenMapper.selectCount(any(Wrapper.class))).thenReturn(1L);
        when(agentSkillMountMapper.selectCount(any(Wrapper.class))).thenReturn(0L);
        when(agentSkillMapper.selectList(any(Wrapper.class))).thenReturn(List.of(skill));
        when(agentSkillMountMapper.selectList(any(Wrapper.class))).thenReturn(List.of());
        when(agentMemoryMapper.selectList(any(Wrapper.class))).thenReturn(List.of(memory));
        when(agentGoalMapper.selectList(any(Wrapper.class))).thenReturn(List.of(goal));

        AgentDetailVO config = service.tokenConfig(token, 10L);

        assertEquals(1, config.getSkills().size());
        assertEquals(1, config.getMemories().size());
        assertEquals(1, config.getGoals().size());
    }

    @Test
    void agentSyncRejectsWritableMemoryWithoutPreflightConfirmation() {
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

        AgentMemoryRequest memoryRequest = new AgentMemoryRequest();
        memoryRequest.setTitle("Project rule");
        memoryRequest.setContent("Do not duplicate platform memories");
        AiAgentSyncRequest request = new AiAgentSyncRequest();
        request.setMemories(List.of(memoryRequest));

        when(agentMapper.selectOne(any(Wrapper.class))).thenReturn(agent);
        when(agentTokenMapper.selectCount(any(Wrapper.class))).thenReturn(1L);
        when(agentSkillMountMapper.selectCount(any(Wrapper.class))).thenReturn(0L);
        when(agentSkillMapper.selectList(any(Wrapper.class))).thenReturn(List.of());
        when(agentSkillMountMapper.selectList(any(Wrapper.class))).thenReturn(List.of());
        when(agentMemoryMapper.selectList(any(Wrapper.class))).thenReturn(List.of());
        when(agentGoalMapper.selectList(any(Wrapper.class))).thenReturn(List.of());

        BusinessException error = assertThrows(
                BusinessException.class,
                () -> service.syncByToken(token, 10L, request)
        );

        assertEquals(409, error.getCode());
        verify(agentMemoryMapper, never()).insert(any(AgentMemory.class));
    }

    @Test
    void agentSyncRejectsWritableSkillWithoutPreflightConfirmation() {
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
        agent.setDescription("Requires skill sync preflight");
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
                "skillWrite":true,"skillRead":true}
                """);

        AgentSkillRequest skillRequest = new AgentSkillRequest();
        skillRequest.setName("Repository Reader");
        skillRequest.setSourceType("agent-sync");
        AiAgentSyncRequest request = new AiAgentSyncRequest();
        request.setSkills(List.of(skillRequest));

        when(agentMapper.selectOne(any(Wrapper.class))).thenReturn(agent);
        when(agentTokenMapper.selectCount(any(Wrapper.class))).thenReturn(1L);
        when(agentSkillMountMapper.selectCount(any(Wrapper.class))).thenReturn(0L);
        when(agentSkillMapper.selectList(any(Wrapper.class))).thenReturn(List.of());
        when(agentSkillMountMapper.selectList(any(Wrapper.class))).thenReturn(List.of());
        when(agentMemoryMapper.selectList(any(Wrapper.class))).thenReturn(List.of());
        when(agentGoalMapper.selectList(any(Wrapper.class))).thenReturn(List.of());

        BusinessException error = assertThrows(
                BusinessException.class,
                () -> service.syncByToken(token, 10L, request)
        );

        assertEquals(409, error.getCode());
        verify(agentSkillMapper, never()).insert(any(AgentSkill.class));
    }

    @Test
    void agentSyncRequiresReadPermissionForWritableMemoryPreflight() {
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
        agent.setDescription("Requires readable preflight");
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
                {"agentSync":true,"memoryWrite":true,
                "configRead":false,"memoryRead":false}
                """);

        AgentMemoryRequest memoryRequest = new AgentMemoryRequest();
        memoryRequest.setTitle("Project rule");
        memoryRequest.setContent("Do not write without reading first");
        AiAgentSyncRequest request = new AiAgentSyncRequest();
        request.setBaseRevision("previous-config");
        request.setConfirmSync(true);
        request.setMemories(List.of(memoryRequest));

        when(agentMapper.selectOne(any(Wrapper.class))).thenReturn(agent);

        BusinessException error = assertThrows(
                BusinessException.class,
                () -> service.syncByToken(token, 10L, request)
        );

        assertEquals(403, error.getCode());
        verify(agentMemoryMapper, never()).insert(any(AgentMemory.class));
    }

    @Test
    void agentSyncRequiresReadPermissionForWritableGoalPreflight() {
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
        agent.setDescription("Requires readable goal preflight");
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
        token.setPermissionJson("{\"agentSync\":true,\"configRead\":true,\"goalWrite\":true,\"goalRead\":false}");

        AgentGoalRequest goalRequest = new AgentGoalRequest();
        goalRequest.setTitle("Ship goal sync");
        goalRequest.setGoalStatus("running");
        AiAgentSyncRequest request = new AiAgentSyncRequest();
        request.setBaseRevision("previous-config");
        request.setConfirmSync(true);
        request.setGoals(List.of(goalRequest));

        when(agentMapper.selectOne(any(Wrapper.class))).thenReturn(agent);

        BusinessException error = assertThrows(
                BusinessException.class,
                () -> service.syncByToken(token, 10L, request)
        );

        assertEquals(403, error.getCode());
        verify(agentGoalMapper, never()).insert(any(AgentGoal.class));
    }
}

