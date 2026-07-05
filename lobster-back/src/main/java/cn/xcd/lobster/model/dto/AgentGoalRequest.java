package cn.xcd.lobster.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class AgentGoalRequest {

    private String id;

    @NotBlank(message = "目标标题不能为空")
    private String title;

    private String description;

    private String goalStatus;

    private Integer priority;

    private LocalDateTime dueTime;

    private List<AgentGoalStepRequest> steps;
}
