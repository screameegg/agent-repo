package cn.xcd.lobster.service.impl;

import cn.dev33.satoken.stp.StpUtil;
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
import cn.xcd.lobster.model.dto.AgentGoalStepRequest;
import cn.xcd.lobster.model.dto.AgentMemoryRequest;
import cn.xcd.lobster.model.dto.AgentUpdateRequest;
import cn.xcd.lobster.model.entity.Agent;
import cn.xcd.lobster.model.entity.AgentConfigEvent;
import cn.xcd.lobster.model.entity.AgentGoal;
import cn.xcd.lobster.model.entity.AgentMemory;
import cn.xcd.lobster.model.vo.AgentGoalVO;
import cn.xcd.lobster.model.vo.AgentVO;
import cn.xcd.lobster.service.AgentSkillMountService;
import cn.xcd.lobster.service.AgentSyncService;
import com.baomidou.mybatisplus.core.conditions.Wrapper;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.MockedStatic;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AgentServiceImplDetailTest {

    @Test
    void profileReturnsAgentOnlyWithoutLoadingTabDataOrFileTree() {
        AgentMapper agentMapper = mock(AgentMapper.class);
        AgentSkillMapper agentSkillMapper = mock(AgentSkillMapper.class);
        AgentMemoryMapper agentMemoryMapper = mock(AgentMemoryMapper.class);
        AgentGoalMapper agentGoalMapper = mock(AgentGoalMapper.class);
        AgentTokenMapper agentTokenMapper = mock(AgentTokenMapper.class);
        AgentSkillMountMapper agentSkillMountMapper = mock(AgentSkillMountMapper.class);
        SkillPackageMapper skillPackageMapper = mock(SkillPackageMapper.class);
        SkillFileMapper skillFileMapper = mock(SkillFileMapper.class);
        AgentConfigEventMapper agentConfigEventMapper = mock(AgentConfigEventMapper.class);

        AgentServiceImpl service = new AgentServiceImpl(
                agentMapper,
                agentSkillMapper,
                agentMemoryMapper,
                agentGoalMapper,
                agentTokenMapper,
                agentSkillMountMapper,
                skillPackageMapper,
                skillFileMapper,
                agentConfigEventMapper,
                mock(AgentSkillMountService.class),
                mock(AgentSyncService.class)
        );

        Agent agent = boundAgent();
        agent.setSkillCount(1);
        agent.setMemoryCount(0);
        when(agentMapper.selectOne(any(Wrapper.class))).thenReturn(agent);
        when(agentTokenMapper.selectCount(any(Wrapper.class))).thenReturn(0L);
        when(agentSkillMountMapper.selectCount(any(Wrapper.class))).thenReturn(1L);

        try (MockedStatic<StpUtil> stp = mockStatic(StpUtil.class)) {
            stp.when(StpUtil::getLoginId).thenReturn(1L);

            AgentVO profile = service.profile(10L);

            assertTrue("10".equals(profile.getId()));
            verify(agentSkillMapper, never()).selectList(any(Wrapper.class));
            verify(agentSkillMountMapper, never()).selectList(any(Wrapper.class));
            verify(skillFileMapper, never()).selectList(any(Wrapper.class));
            verify(agentMemoryMapper, never()).selectList(any(Wrapper.class));
            verify(agentGoalMapper, never()).selectList(any(Wrapper.class));
        }
    }

    @Test
    void updateCreatesPendingConfigChangedEventForBoundAgent() {
        Fixture fixture = fixture();
        AgentServiceImpl service = fixture.service();
        when(fixture.agentMapper().selectOne(any(Wrapper.class))).thenReturn(boundAgent());
        when(fixture.agentTokenMapper().selectCount(any(Wrapper.class))).thenReturn(1L);
        when(fixture.agentSkillMountMapper().selectCount(any(Wrapper.class))).thenReturn(0L);

        AgentUpdateRequest request = new AgentUpdateRequest();
        request.setName("CodeReviewer");
        request.setRole("架构专家");
        request.setDescription("Review platform changes");
        request.setBaseModel("Claude 3");

        try (MockedStatic<StpUtil> stp = mockStatic(StpUtil.class)) {
            stp.when(StpUtil::getLoginId).thenReturn(1L);

            service.update(10L, request);
        }

        AgentConfigEvent event = capturedEvent(fixture.agentConfigEventMapper());
        assertEquals("config_changed", event.getEventType());
        assertEquals("pending", event.getEventStatus());
        assertTrue(event.getPayloadJson().contains("agent_updated"));
    }

    @Test
    void createMemoryCreatesPendingConfigChangedEventForBoundAgent() {
        Fixture fixture = fixture();
        AgentServiceImpl service = fixture.service();
        when(fixture.agentMapper().selectOne(any(Wrapper.class))).thenReturn(boundAgent());
        when(fixture.agentTokenMapper().selectCount(any(Wrapper.class))).thenReturn(1L);

        AgentMemoryRequest request = new AgentMemoryRequest();
        request.setTitle("Project rule");
        request.setContent("Always pull config before sync");

        try (MockedStatic<StpUtil> stp = mockStatic(StpUtil.class)) {
            stp.when(StpUtil::getLoginId).thenReturn(1L);

            service.createMemory(10L, request);
        }

        AgentConfigEvent event = capturedEvent(fixture.agentConfigEventMapper());
        assertEquals("config_changed", event.getEventType());
        assertEquals("pending", event.getEventStatus());
        assertTrue(event.getPayloadJson().contains("memory_created"));
    }

    @Test
    void createGoalCreatesPendingConfigChangedEventForBoundAgent() {
        Fixture fixture = fixture();
        AgentServiceImpl service = fixture.service();
        when(fixture.agentMapper().selectOne(any(Wrapper.class))).thenReturn(boundAgent());
        when(fixture.agentTokenMapper().selectCount(any(Wrapper.class))).thenReturn(1L);

        AgentGoalRequest request = new AgentGoalRequest();
        request.setTitle("Ship agent sync");

        try (MockedStatic<StpUtil> stp = mockStatic(StpUtil.class)) {
            stp.when(StpUtil::getLoginId).thenReturn(1L);

            service.createGoal(10L, request);
        }

        AgentConfigEvent event = capturedEvent(fixture.agentConfigEventMapper());
        assertEquals("config_changed", event.getEventType());
        assertEquals("pending", event.getEventStatus());
        assertTrue(event.getPayloadJson().contains("goal_created"));
    }


    @Test
    void createGoalPersistsStepsInExtJsonAndReturnsThem() {
        Fixture fixture = fixture();
        AgentServiceImpl service = fixture.service();
        when(fixture.agentMapper().selectOne(any(Wrapper.class))).thenReturn(boundAgent());
        when(fixture.agentTokenMapper().selectCount(any(Wrapper.class))).thenReturn(1L);

        AgentGoalStepRequest step = new AgentGoalStepRequest();
        step.setTitle("梳理现状");
        step.setDescription("确认记忆和目标接口");
        step.setStatus("running");
        AgentGoalRequest request = new AgentGoalRequest();
        request.setTitle("完善目标管理");
        request.setSteps(List.of(step));

        try (MockedStatic<StpUtil> stp = mockStatic(StpUtil.class)) {
            stp.when(StpUtil::getLoginId).thenReturn(1L);

            AgentGoalVO created = service.createGoal(10L, request);

            assertEquals(1, created.getSteps().size());
            assertEquals("梳理现状", created.getSteps().get(0).getTitle());
            assertEquals("running", created.getSteps().get(0).getStatus());
            assertNotNull(created.getSteps().get(0).getId());
        }

        ArgumentCaptor<AgentGoal> goalCaptor = ArgumentCaptor.forClass(AgentGoal.class);
        verify(fixture.agentGoalMapper()).insert(goalCaptor.capture());
        assertTrue(goalCaptor.getValue().getExtJson().contains("\"steps\""));
        assertTrue(goalCaptor.getValue().getExtJson().contains("梳理现状"));
    }

    @Test
    void updateGoalUpdatesFieldsStepsAndCreatesPendingConfigChangedEvent() {
        Fixture fixture = fixture();
        AgentServiceImpl service = fixture.service();
        Agent agent = boundAgent();
        AgentGoal goal = new AgentGoal();
        goal.setId(40L);
        goal.setAgentId(10L);
        goal.setTitle("旧目标");
        goal.setDescription("旧描述");
        goal.setGoalStatus("pending");
        goal.setPriority(1);
        goal.setExtJson("{\"context\":\"keep-me\"}");
        goal.setCreateTime(LocalDateTime.now());

        when(fixture.agentMapper().selectOne(any(Wrapper.class))).thenReturn(agent);
        when(fixture.agentGoalMapper().selectOne(any(Wrapper.class))).thenReturn(goal);
        when(fixture.agentTokenMapper().selectCount(any(Wrapper.class))).thenReturn(1L);

        AgentGoalStepRequest step = new AgentGoalStepRequest();
        step.setId("step-1");
        step.setTitle("完成后端");
        step.setStatus("completed");
        AgentGoalRequest request = new AgentGoalRequest();
        request.setTitle("新目标");
        request.setDescription("新描述");
        request.setGoalStatus("running");
        request.setPriority(8);
        request.setSteps(List.of(step));

        try (MockedStatic<StpUtil> stp = mockStatic(StpUtil.class)) {
            stp.when(StpUtil::getLoginId).thenReturn(1L);

            AgentGoalVO updated = service.updateGoal(10L, 40L, request);

            assertEquals("新目标", updated.getTitle());
            assertEquals("running", updated.getStatus());
            assertEquals(1, updated.getSteps().size());
            assertEquals("completed", updated.getSteps().get(0).getStatus());
        }

        verify(fixture.agentGoalMapper()).updateById(goal);
        assertEquals("新目标", goal.getTitle());
        assertTrue(goal.getExtJson().contains("\"context\":\"keep-me\""));
        assertTrue(goal.getExtJson().contains("完成后端"));
        AgentConfigEvent event = capturedEvent(fixture.agentConfigEventMapper());
        assertTrue(event.getPayloadJson().contains("goal_updated"));
    }

    @Test
    void deleteGoalSoftDeletesAndCreatesPendingConfigChangedEvent() {
        Fixture fixture = fixture();
        AgentServiceImpl service = fixture.service();
        Agent agent = boundAgent();
        agent.setGoalCount(1);
        AgentGoal goal = new AgentGoal();
        goal.setId(40L);
        goal.setAgentId(10L);
        goal.setTitle("删除目标");
        goal.setGoalStatus("pending");
        goal.setPriority(1);
        goal.setCreateTime(LocalDateTime.now());

        when(fixture.agentMapper().selectOne(any(Wrapper.class))).thenReturn(agent);
        when(fixture.agentGoalMapper().selectOne(any(Wrapper.class))).thenReturn(goal);
        when(fixture.agentTokenMapper().selectCount(any(Wrapper.class))).thenReturn(1L);

        try (MockedStatic<StpUtil> stp = mockStatic(StpUtil.class)) {
            stp.when(StpUtil::getLoginId).thenReturn(1L);

            service.deleteGoal(10L, 40L);
        }

        verify(fixture.agentGoalMapper()).updateById(goal);
        assertNotNull(goal.getDeleteTime());
        assertEquals(0, agent.getGoalCount());
        AgentConfigEvent event = capturedEvent(fixture.agentConfigEventMapper());
        assertTrue(event.getPayloadJson().contains("goal_deleted"));
    }
    @Test
    void deleteMemorySoftDeletesAndCreatesPendingConfigChangedEvent() {
        Fixture fixture = fixture();
        AgentServiceImpl service = fixture.service();
        Agent agent = boundAgent();
        AgentMemory memory = new AgentMemory();
        memory.setId(30L);
        memory.setAgentId(10L);
        memory.setTitle("Old rule");
        memory.setContent("Expired");
        memory.setMemoryType("note");
        memory.setImportance(1);
        memory.setSource("manual");
        memory.setCreateTime(LocalDateTime.now());

        when(fixture.agentMapper().selectOne(any(Wrapper.class))).thenReturn(agent);
        when(fixture.agentMemoryMapper().selectOne(any(Wrapper.class))).thenReturn(memory);
        when(fixture.agentTokenMapper().selectCount(any(Wrapper.class))).thenReturn(1L);

        try (MockedStatic<StpUtil> stp = mockStatic(StpUtil.class)) {
            stp.when(StpUtil::getLoginId).thenReturn(1L);

            service.deleteMemory(10L, 30L);
        }

        verify(fixture.agentMemoryMapper()).updateById(memory);
        assertTrue(memory.getDeleteTime() != null);
        assertEquals(0, agent.getMemoryCount());
        AgentConfigEvent event = capturedEvent(fixture.agentConfigEventMapper());
        assertTrue(event.getPayloadJson().contains("memory_deleted"));
    }

    private Fixture fixture() {
        AgentMapper agentMapper = mock(AgentMapper.class);
        AgentSkillMapper agentSkillMapper = mock(AgentSkillMapper.class);
        AgentMemoryMapper agentMemoryMapper = mock(AgentMemoryMapper.class);
        AgentGoalMapper agentGoalMapper = mock(AgentGoalMapper.class);
        AgentTokenMapper agentTokenMapper = mock(AgentTokenMapper.class);
        AgentSkillMountMapper agentSkillMountMapper = mock(AgentSkillMountMapper.class);
        SkillPackageMapper skillPackageMapper = mock(SkillPackageMapper.class);
        SkillFileMapper skillFileMapper = mock(SkillFileMapper.class);
        AgentConfigEventMapper agentConfigEventMapper = mock(AgentConfigEventMapper.class);
        AgentServiceImpl service = new AgentServiceImpl(
                agentMapper,
                agentSkillMapper,
                agentMemoryMapper,
                agentGoalMapper,
                agentTokenMapper,
                agentSkillMountMapper,
                skillPackageMapper,
                skillFileMapper,
                agentConfigEventMapper,
                mock(AgentSkillMountService.class),
                mock(AgentSyncService.class)
        );
        return new Fixture(
                service,
                agentMapper,
                agentMemoryMapper,
                agentGoalMapper,
                agentTokenMapper,
                agentSkillMountMapper,
                agentConfigEventMapper
        );
    }

    private Agent boundAgent() {
        Agent agent = new Agent();
        agent.setId(10L);
        agent.setOwnerId(1L);
        agent.setName("CodeReviewer");
        agent.setCode("code-reviewer");
        agent.setDescription("Review code");
        agent.setRole("研发专家");
        agent.setSkillCount(0);
        agent.setMemoryCount(1);
        agent.setGoalCount(0);
        agent.setAvatar("");
        agent.setBaseModel("Claude 3");
        agent.setStatus("active");
        agent.setAssociationStatus("bound");
        agent.setCreateTime(LocalDateTime.now());
        return agent;
    }

    private AgentConfigEvent capturedEvent(AgentConfigEventMapper agentConfigEventMapper) {
        ArgumentCaptor<AgentConfigEvent> eventCaptor = ArgumentCaptor.forClass(AgentConfigEvent.class);
        verify(agentConfigEventMapper).insert(eventCaptor.capture());
        return eventCaptor.getValue();
    }

    private record Fixture(AgentServiceImpl service,
                           AgentMapper agentMapper,
                           AgentMemoryMapper agentMemoryMapper,
                           AgentGoalMapper agentGoalMapper,
                           AgentTokenMapper agentTokenMapper,
                           AgentSkillMountMapper agentSkillMountMapper,
                           AgentConfigEventMapper agentConfigEventMapper) {
    }
}
