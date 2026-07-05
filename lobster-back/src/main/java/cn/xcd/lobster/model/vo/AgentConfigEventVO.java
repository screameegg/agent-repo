package cn.xcd.lobster.model.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AgentConfigEventVO {

    private String id;

    private String agentId;

    private String eventType;

    private String eventStatus;

    private String payloadJson;

    private String createdAt;

    @JsonProperty("status")
    public String getStatus() {
        return eventStatus;
    }
}
