package cn.xcd.lobster.model.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class AiAgentRegisterRequest {

    @NotBlank(message = "智能体名称不能为空")
    private String name;

    @NotBlank(message = "角色定位不能为空")
    private String role;

    private String description;

    private String systemPrompt;

    private String avatar;

    @JsonAlias("model")
    private String baseModel;

    private List<String> tags;

    private List<AgentSkillRequest> skills;

    private List<AgentMemoryRequest> memories;

    private List<AgentGoalRequest> goals;

    private Boolean force;
}
