package cn.xcd.lobster.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AgentCreateRequest {

    @NotBlank(message = "Agent名称不能为空")
    private String name;

    @NotBlank(message = "角色定位不能为空")
    private String role;

    private String description;

    private String systemPrompt;

    private String avatar;

    private String baseModel;
}
