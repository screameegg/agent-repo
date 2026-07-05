package cn.xcd.lobster.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AgentMemoryRequest {

    @NotBlank(message = "记忆标题不能为空")
    private String title;

    @NotBlank(message = "记忆内容不能为空")
    private String content;

    private String memoryType;

    private Integer importance;

    private String source;
}
