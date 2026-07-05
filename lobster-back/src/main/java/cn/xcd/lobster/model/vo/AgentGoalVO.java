package cn.xcd.lobster.model.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AgentGoalVO {

    private String id;

    private String title;

    private String description;

    private String status;

    private Integer priority;

    private String dueTime;

    private List<AgentGoalStepVO> steps;

    public AgentGoalVO(String id, String title, String description, String status, Integer priority, String dueTime) {
        this(id, title, description, status, priority, dueTime, List.of());
    }
}
