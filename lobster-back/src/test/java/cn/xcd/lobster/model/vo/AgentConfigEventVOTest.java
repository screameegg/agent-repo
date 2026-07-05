package cn.xcd.lobster.model.vo;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class AgentConfigEventVOTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void serializesStatusAliasForEventStatusCompatibility() throws Exception {
        AgentConfigEventVO event = new AgentConfigEventVO(
                "1001",
                "2001",
                "config_changed",
                "pending",
                "{}",
                "2026-06-24"
        );

        JsonNode json = objectMapper.readTree(objectMapper.writeValueAsString(event));

        assertEquals("pending", json.get("eventStatus").asText());
        assertNotNull(json.get("status"));
        assertEquals("pending", json.get("status").asText());
    }
}