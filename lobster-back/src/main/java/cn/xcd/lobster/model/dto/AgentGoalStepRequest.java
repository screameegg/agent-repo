package cn.xcd.lobster.model.dto;

import lombok.Data;

@Data
public class AgentGoalStepRequest {

    private String id;

    private String title;

    private String description;

    private String status;

    private Integer sortOrder;
}
