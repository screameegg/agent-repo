package cn.xcd.lobster.model.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AiAgentRequestCompatibilityTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void registerAcceptsModelAliasAndTagsFromAgentClients() throws Exception {
        AiAgentRegisterRequest request = objectMapper.readValue("""
                {
                  "name": "Code Agent",
                  "role": "Reviewer",
                  "model": "gpt-4.1",
                  "tags": ["review", "backend"]
                }
                """, AiAgentRegisterRequest.class);

        assertEquals("gpt-4.1", request.getBaseModel());
        assertEquals(List.of("review", "backend"), request.getTags());
    }

    @Test
    void skillConfigJsonAcceptsObjectPayloads() throws Exception {
        AgentSkillRequest request = objectMapper.readValue("""
                {
                  "name": "Repository Reader",
                  "configJson": {"code": "repository-reader", "version": "1.0.0"}
                }
                """, AgentSkillRequest.class);

        assertEquals("{\"code\":\"repository-reader\",\"version\":\"1.0.0\"}", request.getConfigJson());
    }

    @Test
    void skillMountConfigJsonAcceptsObjectPayloads() throws Exception {
        AgentSkillMountRequest request = objectMapper.readValue("""
                {
                  "skillId": 10,
                  "configJson": {"skillId": "10", "code": "repository-reader"}
                }
                """, AgentSkillMountRequest.class);

        assertEquals("{\"skillId\":\"10\",\"code\":\"repository-reader\"}", request.getConfigJson());
    }

    @Test
    void skillConfigJsonStillAcceptsStringPayloads() throws Exception {
        AgentSkillRequest request = objectMapper.readValue("""
                {
                  "name": "Repository Reader",
                  "configJson": "{\\\"code\\\":\\\"repository-reader\\\"}"
                }
                """, AgentSkillRequest.class);

        assertEquals("{\"code\":\"repository-reader\"}", request.getConfigJson());
    }

    @Test
    void skillSaveFilesAcceptAgentFriendlyFileAliases() throws Exception {
        SkillSaveRequest request = objectMapper.readValue("""
                {
                  "name": "Repository Reader",
                  "files": [
                    {
                      "type": "file",
                      "filename": "SKILL.md",
                      "path": "SKILL.md",
                      "content": "# Skill"
                    }
                  ]
                }
                """, SkillSaveRequest.class);

        assertEquals(1, request.getFiles().size());
        assertEquals("file", request.getFiles().get(0).getNodeType());
        assertEquals("SKILL.md", request.getFiles().get(0).getName());
        assertEquals("# Skill", request.getFiles().get(0).getContent());
    }
}
