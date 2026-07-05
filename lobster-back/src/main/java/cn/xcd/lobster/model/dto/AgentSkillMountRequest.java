package cn.xcd.lobster.model.dto;

import com.fasterxml.jackson.annotation.JsonSetter;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AgentSkillMountRequest {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @NotNull(message = "技能ID不能为空")
    private Long skillId;

    private String mountStatus;

    private String configJson;

    public void setConfigJson(String configJson) {
        this.configJson = configJson;
    }

    @JsonSetter("configJson")
    public void setConfigJson(JsonNode configJson) {
        this.configJson = normalizeConfigJson(configJson);
    }

    private String normalizeConfigJson(JsonNode value) {
        if (value == null || value.isNull()) {
            return null;
        }
        if (value.isTextual()) {
            return value.asText();
        }
        try {
            return OBJECT_MAPPER.writeValueAsString(value);
        } catch (Exception ignored) {
            return value.toString();
        }
    }
}
