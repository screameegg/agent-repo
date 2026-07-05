package cn.xcd.lobster.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("agent_skill_mount")
public class AgentSkillMount {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    @TableField("agent_id")
    private Long agentId;

    @TableField("skill_id")
    private Long skillId;

    @TableField("mount_status")
    private String mountStatus;

    @TableField("config_json")
    private String configJson;

    @TableField("sort_order")
    private Integer sortOrder;

    @TableField("create_time")
    private LocalDateTime createTime;

    @TableField("update_time")
    private LocalDateTime updateTime;

    @TableField("delete_time")
    private LocalDateTime deleteTime;
}
