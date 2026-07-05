package cn.xcd.lobster.model.dto;

import lombok.Data;

import java.util.List;

@Data
public class AiAgentSyncRequest {

    private String name;

    private String role;

    private String description;

    private String systemPrompt;

    private String avatar;

    private String baseModel;

    private String baseRevision;

    private Boolean confirmSync;

    private List<AgentSkillRequest> skills;

    private List<AgentMemoryRequest> memories;

    private List<AgentGoalRequest> goals;
}
