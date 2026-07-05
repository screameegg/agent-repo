package cn.xcd.lobster.model.vo;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
public class AgentDetailVO {

    private String syncRevision;

    private AgentVO agent;

    private List<AgentSkillVO> skills;

    private List<AgentSkillMountVO> skillMounts;

    private List<SkillPackageVO> skillPackages;

    private List<AgentMemoryVO> memories;

    private List<AgentGoalVO> goals;

    public AgentDetailVO(AgentVO agent,
                         List<AgentSkillVO> skills,
                         List<AgentSkillMountVO> skillMounts,
                         List<SkillPackageVO> skillPackages,
                         List<AgentMemoryVO> memories,
                         List<AgentGoalVO> goals) {
        this(null, agent, skills, skillMounts, skillPackages, memories, goals);
    }

    public AgentDetailVO(String syncRevision,
                         AgentVO agent,
                         List<AgentSkillVO> skills,
                         List<AgentSkillMountVO> skillMounts,
                         List<SkillPackageVO> skillPackages,
                         List<AgentMemoryVO> memories,
                         List<AgentGoalVO> goals) {
        this.syncRevision = syncRevision;
        this.agent = agent;
        this.skills = skills;
        this.skillMounts = skillMounts;
        this.skillPackages = skillPackages;
        this.memories = memories;
        this.goals = goals;
    }

    public AgentDetailVO(AgentVO agent,
                         List<AgentSkillVO> skills,
                         List<AgentMemoryVO> memories,
                         List<AgentGoalVO> goals) {
        this(agent, skills, List.of(), List.of(), memories, goals);
    }
}
