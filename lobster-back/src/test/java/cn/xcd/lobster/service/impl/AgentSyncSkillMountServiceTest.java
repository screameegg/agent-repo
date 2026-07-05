package cn.xcd.lobster.service.impl;

import cn.xcd.lobster.mapper.SkillPackageMapper;
import cn.xcd.lobster.model.dto.AgentSkillMountRequest;
import cn.xcd.lobster.model.dto.AgentSkillRequest;
import cn.xcd.lobster.model.entity.Agent;
import cn.xcd.lobster.model.entity.AgentToken;
import cn.xcd.lobster.model.entity.SkillPackage;
import cn.xcd.lobster.service.AgentSkillMountService;
import com.baomidou.mybatisplus.core.conditions.Wrapper;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AgentSyncSkillMountServiceTest {

    @Test
    void mountsMatchingOwnedSkillWithoutCreatingAgentNotification() {
        SkillPackageMapper skillPackageMapper = mock(SkillPackageMapper.class);
        AgentSkillMountService mountService = mock(AgentSkillMountService.class);
        AgentSyncSkillMountService service = new AgentSyncSkillMountService(skillPackageMapper, mountService);
        SkillPackage skillPackage = skillPackage(88L, "repository-reader", "1.0.0");
        when(skillPackageMapper.selectOne(any(Wrapper.class))).thenReturn(skillPackage);
        AgentSkillRequest request = skillRequest("{\"code\":\"repository-reader\"}");

        service.mountMatchingSkillPackage(token("{\"skillWrite\":true}"), agent(), request);

        ArgumentCaptor<AgentSkillMountRequest> captor = ArgumentCaptor.forClass(AgentSkillMountRequest.class);
        verify(mountService).mountSkillForOwner(eq(1L), eq(10L), captor.capture(), eq(false));
        assertEquals(88L, captor.getValue().getSkillId());
        assertEquals("active", captor.getValue().getMountStatus());
    }

    @Test
    void skipsMountWhenTokenCannotWriteSkills() {
        SkillPackageMapper skillPackageMapper = mock(SkillPackageMapper.class);
        AgentSkillMountService mountService = mock(AgentSkillMountService.class);
        AgentSyncSkillMountService service = new AgentSyncSkillMountService(skillPackageMapper, mountService);

        service.mountMatchingSkillPackage(token("{\"skillRead\":true}"), agent(), skillRequest("{\"code\":\"repository-reader\"}"));

        verify(skillPackageMapper, never()).selectOne(any(Wrapper.class));
        verify(mountService, never()).mountSkillForOwner(any(), any(), any(), eq(false));
    }

    private static AgentSkillRequest skillRequest(String configJson) {
        AgentSkillRequest request = new AgentSkillRequest();
        request.setName("Repository Reader");
        request.setMountStatus("active");
        request.setConfigJson(configJson);
        return request;
    }

    private static SkillPackage skillPackage(Long id, String code, String version) {
        SkillPackage skillPackage = new SkillPackage();
        skillPackage.setId(id);
        skillPackage.setOwnerId(1L);
        skillPackage.setCode(code);
        skillPackage.setVersion(version);
        skillPackage.setName("Repository Reader");
        return skillPackage;
    }

    private static Agent agent() {
        Agent agent = new Agent();
        agent.setId(10L);
        agent.setOwnerId(1L);
        return agent;
    }

    private static AgentToken token(String permissions) {
        AgentToken token = new AgentToken();
        token.setOwnerId(1L);
        token.setAgentId(10L);
        token.setPermissionJson(permissions);
        return token;
    }
}
