package cn.xcd.lobster.service.support;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.util.StringUtils;

import java.util.Optional;

public final class AgentSkillConfigSupport {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private AgentSkillConfigSupport() {
    }

    public static Optional<String> skillCode(String configJson) {
        if (!StringUtils.hasText(configJson)) {
            return Optional.empty();
        }
        try {
            JsonNode node = OBJECT_MAPPER.readTree(configJson);
            return firstText(node, "code")
                    .or(() -> firstText(node, "skillCode"))
                    .or(() -> firstText(node, "externalSkillId"));
        } catch (Exception ignored) {
            return Optional.empty();
        }
    }

    private static Optional<String> firstText(JsonNode node, String fieldName) {
        if (node == null || node.get(fieldName) == null || !node.get(fieldName).isTextual()) {
            return Optional.empty();
        }
        String value = node.get(fieldName).asText();
        return StringUtils.hasText(value) ? Optional.of(value.trim()) : Optional.empty();
    }
}
