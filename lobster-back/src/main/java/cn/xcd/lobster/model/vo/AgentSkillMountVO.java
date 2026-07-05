package cn.xcd.lobster.model.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AgentSkillMountVO {

    private String id;

    private String agentId;

    private String skillId;

    private String name;

    private String description;

    private String icon;

    private String version;

    private String mountStatus;

    private String configJson;
}
