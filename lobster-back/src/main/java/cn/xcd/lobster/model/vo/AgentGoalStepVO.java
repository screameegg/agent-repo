package cn.xcd.lobster.model.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AgentGoalStepVO {

    private String id;

    private String title;

    private String description;

    private String status;

    private Integer sortOrder;

    private String updatedAt;
}
