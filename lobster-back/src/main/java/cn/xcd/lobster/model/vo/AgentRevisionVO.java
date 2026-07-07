package cn.xcd.lobster.model.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AgentRevisionVO {

    private String syncRevision;

    private Integer memoryCount;

    private Integer goalCount;

    private Integer mountedSkillPackageCount;
}
