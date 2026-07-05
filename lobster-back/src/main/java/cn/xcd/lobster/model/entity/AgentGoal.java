package cn.xcd.lobster.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("agent_goal")
public class AgentGoal {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    @TableField("agent_id")
    private Long agentId;

    @TableField("title")
    private String title;

    @TableField("description")
    private String description;

    @TableField("goal_status")
    private String goalStatus;

    @TableField("priority")
    private Integer priority;

    @TableField("due_time")
    private LocalDateTime dueTime;

    @TableField("ext_json")
    private String extJson;

    @TableField("create_time")
    private LocalDateTime createTime;

    @TableField("update_time")
    private LocalDateTime updateTime;

    @TableField("delete_time")
    private LocalDateTime deleteTime;
}
