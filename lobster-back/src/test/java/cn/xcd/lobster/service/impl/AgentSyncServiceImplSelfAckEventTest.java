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
import cn.xcd.lobster.model.dto.AgentGoalRequest;
import cn.xcd.lobster.model.dto.AgentSkillRequest;
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
import cn.xcd.lobster.model.vo.AgentMemoryVO;
import cn.xcd.lobster.model.vo.SkillFileVO;
import com.baomidou.mybatisplus.core.conditions.Wrapper;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AgentSyncServiceImplSelfAckEventTest {

    @Test
    void agentTokenDeletesMemoryWithoutCreatingSelfAckEvent() {
        Fixture fixture = new Fixture();
        Agent agent = agent("Protected Agent", 0, 1, 0);
        AgentMemory memory = memory(30L, "Old rule");
        AgentToken token = token("{\"memoryWrite\":true}");

        when(fixture.agentMapper.selectOne(any(Wrapper.class))).thenReturn(agent);
        when(fixture.agentMemoryMapper.selectOne(any(Wrapper.class))).thenReturn(memory);

        fixture.service.deleteMemoryByToken(token, 10L, 30L);

        verify(fixture.agentMemoryMapper).updateById(memory);
        assertNotNull(memory.getDeleteTime());
        assertEquals(0, agent.getMemoryCount());
        verify(fixture.agentConfigEventMapper, never()).insert(any(AgentConfigEvent.class));
    }

    @Test
    void agentTokenDeletesGoalWithoutCreatingSelfAckEvent() {
        Fixture fixture = new Fixture();
        Agent agent = agent("Goal Agent", 0, 0, 1);
        AgentGoal goal = goal(40L, "Old goal", "Expired");
        AgentToken token = token("{\"goalWrite\":true}");

        when(fixture.agentMapper.selectOne(any(Wrapper.class))).thenReturn(agent);
        when(fixture.agentGoalMapper.selectOne(any(Wrapper.class))).thenReturn(goal);

        fixture.service.deleteGoalByToken(token, 10L, 40L);

        verify(fixture.agentGoalMapper).updateById(goal);
        assertNotNull(goal.getDeleteTime());
        assertEquals(0, agent.getGoalCount());
        verify(fixture.agentConfigEventMapper, never()).insert(any(AgentConfigEvent.class));
    }

    @Test
    void agentSyncUpdatesGoalWithoutCreatingSelfAckEvent() {
        Fixture fixture = new Fixture();
        Agent agent = agent("Goal Agent", 0, 0, 1);
        AgentGoal existing = goal(40L, "Ship goals", "Existing goal");
        AgentToken token = token("{\"agentSync\":true,\"configRead\":true,\"goalRead\":true,\"goalWrite\":true}");
        stubEmptyConfig(fixture, agent, token);
        when(fixture.agentGoalMapper.selectList(any(Wrapper.class))).thenReturn(List.of(existing));
        when(fixture.agentGoalMapper.selectOne(any(Wrapper.class))).thenReturn(existing);
        AgentDetailVO config = fixture.service.tokenConfig(token, 10L);

        AgentGoalRequest goalRequest = new AgentGoalRequest();
        goalRequest.setId("40");
        goalRequest.setTitle("Ship goals");
        goalRequest.setDescription("Updated by agent");
        goalRequest.setGoalStatus("running");
        goalRequest.setPriority(7);
        AiAgentSyncRequest request = new AiAgentSyncRequest();
        request.setBaseRevision(config.getSyncRevision());
        request.setConfirmSync(true);
        request.setGoals(List.of(goalRequest));

        fixture.service.syncByToken(token, 10L, request);

        verify(fixture.agentGoalMapper).updateById(existing);
        verify(fixture.agentConfigEventMapper, never()).insert(any(AgentConfigEvent.class));
    }

    @Test
    void agentSyncDelegatesMatchingSkillAutoMount() {
        Fixture fixture = new Fixture();
        Agent agent = agent("Skill Agent", 0, 0, 0);
        AgentToken token = token("{\"agentSync\":true,\"configRead\":true,\"skillRead\":true,\"skillWrite\":true}");
        stubEmptyConfig(fixture, agent, token);
        AgentDetailVO config = fixture.service.tokenConfig(token, 10L);

        AgentSkillRequest skillRequest = new AgentSkillRequest();
        skillRequest.setName("Repository Reader");
        skillRequest.setSourceType("agent-sync");
        skillRequest.setConfigJson("{\"code\":\"repository-reader\"}");
        AiAgentSyncRequest request = new AiAgentSyncRequest();
        request.setBaseRevision(config.getSyncRevision());
        request.setConfirmSync(true);
        request.setSkills(List.of(skillRequest));

        fixture.service.syncByToken(token, 10L, request);

        verify(fixture.agentSyncSkillMountService).mountMatchingSkillPackage(token, agent, skillRequest);
    }

    @Test
    void tokenConfigBriefReturnsMountedSkillFileMetadataWithoutContent() {
        Fixture fixture = new Fixture();
        Agent agent = agent("Brief Config Agent", 0, 0, 0);
        AgentToken token = token("{\"configRead\":true,\"skillRead\":true}");
        AgentSkillMount mount = new AgentSkillMount();
        mount.setId(50L);
        mount.setAgentId(10L);
        mount.setSkillId(20L);
        mount.setMountStatus("active");
        mount.setConfigJson("{}");
        SkillPackage skill = new SkillPackage();
        skill.setId(20L);
        skill.setOwnerId(1L);
        skill.setName("Repository Reader");
        skill.setCode("repository-reader");
        skill.setDescription("Read repositories");
        skill.setIcon("BookOpen");
        skill.setVersion("1.0.0");
        skill.setVisibility("private");
        skill.setPublishStatus("draft");
        skill.setAuditStatus("none");
        skill.setInstallCount(0);
        skill.setExtJson("{}");
        String content = "# Repository Reader\n\nLong instructions.";
        SkillFile file = new SkillFile();
        file.setId(60L);
        file.setSkillId(20L);
        file.setNodeType("file");
        file.setName("SKILL.md");
        file.setPath("SKILL.md");
        file.setLanguage("markdown");
        file.setContent(content);
        file.setSortOrder(0);

        when(fixture.agentMapper.selectOne(any(Wrapper.class))).thenReturn(agent);
        when(fixture.agentTokenMapper.selectCount(any(Wrapper.class))).thenReturn(1L);
        when(fixture.agentSkillMapper.selectList(any(Wrapper.class))).thenReturn(List.of());
        when(fixture.agentSkillMountMapper.selectList(any(Wrapper.class))).thenReturn(List.of(mount));
        when(fixture.agentSkillMountMapper.selectCount(any(Wrapper.class))).thenReturn(1L);
        when(fixture.skillPackageMapper.selectById(20L)).thenReturn(skill);
        when(fixture.skillFileMapper.selectList(any(Wrapper.class))).thenReturn(List.of(file));
        when(fixture.agentMemoryMapper.selectList(any(Wrapper.class))).thenReturn(List.of());
        when(fixture.agentGoalMapper.selectList(any(Wrapper.class))).thenReturn(List.of());

        AgentDetailVO config = fixture.service.tokenConfig(token, 10L, true);

        SkillFileVO briefFile = config.getSkillPackages().get(0).getFiles().get(0);
        assertEquals("SKILL.md", briefFile.getPath());
        assertEquals("file", briefFile.getNodeType());
        assertEquals(content.getBytes(StandardCharsets.UTF_8).length, briefFile.getSize());
        assertNull(briefFile.getContent());
    }

    @Test
    void getMemoryByTokenReturnsSingleMemoryForBoundAgent() {
        Fixture fixture = new Fixture();
        Agent agent = agent("Memory Agent", 0, 1, 0);
        AgentMemory memory = memory(30L, "Project rule");
        AgentToken token = token("{\"memoryRead\":true}");

        when(fixture.agentMapper.selectOne(any(Wrapper.class))).thenReturn(agent);
        when(fixture.agentMemoryMapper.selectOne(any(Wrapper.class))).thenReturn(memory);

        AgentMemoryVO result = fixture.service.getMemoryByToken(token, 10L, 30L);

        assertEquals("30", result.getId());
        assertEquals("Project rule", result.getTitle());
        assertEquals("Expired", result.getContent());
    }

    private static void stubEmptyConfig(Fixture fixture, Agent agent, AgentToken token) {
        when(fixture.agentMapper.selectOne(any(Wrapper.class))).thenReturn(agent);
        when(fixture.agentTokenMapper.selectCount(any(Wrapper.class))).thenReturn(1L);
        when(fixture.agentSkillMountMapper.selectCount(any(Wrapper.class))).thenReturn(0L);
        when(fixture.agentSkillMapper.selectList(any(Wrapper.class))).thenReturn(List.of());
        when(fixture.agentSkillMountMapper.selectList(any(Wrapper.class))).thenReturn(List.of());
        when(fixture.agentMemoryMapper.selectList(any(Wrapper.class))).thenReturn(List.of());
        when(fixture.agentGoalMapper.selectList(any(Wrapper.class))).thenReturn(List.of());
        token.setAgentId(10L);
    }

    private static Agent agent(String name, int skillCount, int memoryCount, int goalCount) {
        Agent agent = new Agent();
        agent.setId(10L);
        agent.setOwnerId(1L);
        agent.setName(name);
        agent.setCode(name.toLowerCase().replace(' ', '-'));
        agent.setDescription(name);
        agent.setRole("研发专家");
        agent.setSkillCount(skillCount);
        agent.setMemoryCount(memoryCount);
        agent.setGoalCount(goalCount);
        agent.setAvatar("");
        agent.setBaseModel("Claude 3");
        agent.setStatus("active");
        agent.setAssociationStatus("bound");
        agent.setCreateTime(LocalDateTime.now());
        agent.setUpdateTime(LocalDateTime.now());
        return agent;
    }

    private static AgentMemory memory(Long id, String title) {
        AgentMemory memory = new AgentMemory();
        memory.setId(id);
        memory.setAgentId(10L);
        memory.setTitle(title);
        memory.setContent("Expired");
        memory.setMemoryType("note");
        memory.setImportance(1);
        memory.setSource("agent-sync");
        memory.setCreateTime(LocalDateTime.now());
        return memory;
    }

    private static AgentGoal goal(Long id, String title, String description) {
        AgentGoal goal = new AgentGoal();
        goal.setId(id);
        goal.setAgentId(10L);
        goal.setTitle(title);
        goal.setDescription(description);
        goal.setGoalStatus("running");
        goal.setPriority(5);
        goal.setExtJson("{\"source\":\"platform\"}");
        goal.setCreateTime(LocalDateTime.now());
        return goal;
    }

    private static AgentToken token(String permissions) {
        AgentToken token = new AgentToken();
        token.setOwnerId(1L);
        token.setAgentId(10L);
        token.setPermissionJson(permissions);
        return token;
    }

    private static class Fixture {
        final AgentMapper agentMapper = mock(AgentMapper.class);
        final AgentSkillMapper agentSkillMapper = mock(AgentSkillMapper.class);
        final AgentMemoryMapper agentMemoryMapper = mock(AgentMemoryMapper.class);
        final AgentGoalMapper agentGoalMapper = mock(AgentGoalMapper.class);
        final AgentTokenMapper agentTokenMapper = mock(AgentTokenMapper.class);
        final AgentSkillMountMapper agentSkillMountMapper = mock(AgentSkillMountMapper.class);
        final SkillPackageMapper skillPackageMapper = mock(SkillPackageMapper.class);
        final SkillFileMapper skillFileMapper = mock(SkillFileMapper.class);
        final AgentConfigEventMapper agentConfigEventMapper = mock(AgentConfigEventMapper.class);
        final AgentSyncSkillMountService agentSyncSkillMountService = mock(AgentSyncSkillMountService.class);
        final AgentSyncServiceImpl service = new AgentSyncServiceImpl(
                agentMapper,
                agentSkillMapper,
                agentMemoryMapper,
                agentGoalMapper,
                agentTokenMapper,
                agentSkillMountMapper,
                skillPackageMapper,
                skillFileMapper,
                agentConfigEventMapper,
                agentSyncSkillMountService
        );
    }
}
