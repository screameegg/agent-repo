package cn.xcd.lobster.model.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AgentSkillVO {

    private String id;

    private String name;

    private String description;

    private String icon;

    private String sourceType;

    private String status;
}
