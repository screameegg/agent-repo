package cn.xcd.lobster.service.support;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AgentSkillConfigSupportTest {

    @Test
    void extractsCodeFromSyncedSkillConfig() {
        assertEquals("frontend-designer",
                AgentSkillConfigSupport.skillCode("{\"kind\":\"local-skill-snapshot\",\"code\":\"frontend-designer\"}").orElseThrow());
    }

    @Test
    void acceptsExternalSkillIdAsFallbackCode() {
        assertEquals("repository-reader",
                AgentSkillConfigSupport.skillCode("{\"externalSkillId\":\"repository-reader\",\"version\":\"1.0.0\"}").orElseThrow());
    }

    @Test
    void ignoresInvalidOrEmptyConfig() {
        assertTrue(AgentSkillConfigSupport.skillCode("").isEmpty());
        assertTrue(AgentSkillConfigSupport.skillCode("{not-json").isEmpty());
        assertTrue(AgentSkillConfigSupport.skillCode("{\"code\":\"\"}").isEmpty());
    }
}
