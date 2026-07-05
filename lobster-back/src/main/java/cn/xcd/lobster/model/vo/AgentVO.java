package cn.xcd.lobster.model.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AgentVO {

    private String id;

    private String name;

    private String code;

    private String description;

    private String createdAt;

    private String role;

    private Integer skillCount;

    private Integer mountedSkillCount;

    private Integer memoryCount;

    private Integer goalCount;

    private String avatar;

    private String baseModel;

    private String status;

    private Boolean isAssociated;

    private String syncStatus;

    private Integer pendingConfigEvents;

    private String lastConfigEventAt;
}
