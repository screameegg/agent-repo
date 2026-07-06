package cn.xcd.lobster.controller;

import cn.xcd.lobster.common.exception.BusinessException;
import cn.xcd.lobster.model.dto.SkillSaveRequest;
import cn.xcd.lobster.model.entity.AgentToken;
import cn.xcd.lobster.service.AgentSyncService;
import cn.xcd.lobster.service.SkillService;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.mock;

class AiAgentControllerPermissionTest {

    @Test
    void createSkillRequiresSkillWriteInsteadOfSkillRead() {
        AiAgentController controller = new AiAgentController(
                mock(AgentSyncService.class),
                mock(SkillService.class)
        );
        AgentToken token = new AgentToken();
        token.setPermissionJson("{\"skillRead\":true,\"skillWrite\":false}");
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute("agentToken", token);

        BusinessException error = assertThrows(
                BusinessException.class,
                () -> controller.createSkill(request, new SkillSaveRequest())
        );

        assertEquals(403, error.getCode());
        assertEquals("令牌缺少权限：skillWrite", error.getMessage());
    }

    @Test
    void legacySkillsPermissionDoesNotAllowSkillRead() {
        AiAgentController controller = new AiAgentController(
                mock(AgentSyncService.class),
                mock(SkillService.class)
        );
        AgentToken token = new AgentToken();
        token.setPermissionJson("{\"skills\":true}");
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute("agentToken", token);

        BusinessException error = assertThrows(
                BusinessException.class,
                () -> controller.skills(request)
        );

        assertEquals(403, error.getCode());
        assertEquals("令牌缺少权限：skillRead", error.getMessage());
    }

    @Test
    void deleteMemoryRequiresMemoryWrite() {
        AiAgentController controller = new AiAgentController(
                mock(AgentSyncService.class),
                mock(SkillService.class)
        );
        AgentToken token = new AgentToken();
        token.setPermissionJson("{\"memoryRead\":true,\"memoryWrite\":false}");
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute("agentToken", token);

        BusinessException error = assertThrows(
                BusinessException.class,
                () -> controller.deleteMemory(request, 10L, 30L)
        );

        assertEquals(403, error.getCode());
        assertEquals("令牌缺少权限：memoryWrite", error.getMessage());
    }
    @Test
    void deleteGoalRequiresGoalWrite() {
        AiAgentController controller = new AiAgentController(
                mock(AgentSyncService.class),
                mock(SkillService.class)
        );
        AgentToken token = new AgentToken();
        token.setPermissionJson("{\"goalRead\":true,\"goalWrite\":false}");
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute("agentToken", token);

        BusinessException error = assertThrows(
                BusinessException.class,
                () -> controller.deleteGoal(request, 10L, 40L)
        );

        assertEquals(403, error.getCode());
        assertEquals("令牌缺少权限：goalWrite", error.getMessage());
    }

    @Test
    void configBriefDelegatesToBriefServiceRead() {
        AgentSyncService agentSyncService = mock(AgentSyncService.class);
        AiAgentController controller = new AiAgentController(
                agentSyncService,
                mock(SkillService.class)
        );
        AgentToken token = new AgentToken();
        token.setPermissionJson("{\"configRead\":true}");
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute("agentToken", token);

        controller.config(request, 10L, true);

        verify(agentSyncService).tokenConfig(token, 10L, true);
    }

    @Test
    void memoryDetailRequiresMemoryReadAndDelegates() {
        AgentSyncService agentSyncService = mock(AgentSyncService.class);
        AiAgentController controller = new AiAgentController(
                agentSyncService,
                mock(SkillService.class)
        );
        AgentToken token = new AgentToken();
        token.setPermissionJson("{\"memoryRead\":true}");
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute("agentToken", token);

        controller.memoryDetail(request, 10L, 30L);

        verify(agentSyncService).getMemoryByToken(token, 10L, 30L);
    }

    @Test
    void skillDetailAcceptsCodeIdentifier() {
        SkillService skillService = mock(SkillService.class);
        AiAgentController controller = new AiAgentController(
                mock(AgentSyncService.class),
                skillService
        );
        AgentToken token = new AgentToken();
        token.setPermissionJson("{\"skillRead\":true}");
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute("agentToken", token);

        controller.skillDetail(request, "repository-reader");

        verify(skillService).detailByToken(token, "repository-reader");
    }
}
