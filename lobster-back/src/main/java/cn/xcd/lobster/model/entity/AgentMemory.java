package cn.xcd.lobster.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("agent_memory")
public class AgentMemory {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    @TableField("agent_id")
    private Long agentId;

    @TableField("title")
    private String title;

    @TableField("content")
    private String content;

    @TableField("memory_type")
    private String memoryType;

    @TableField("importance")
    private Integer importance;

    @TableField("source")
    private String source;

    @TableField("ext_json")
    private String extJson;

    @TableField("create_time")
    private LocalDateTime createTime;

    @TableField("update_time")
    private LocalDateTime updateTime;

    @TableField("delete_time")
    private LocalDateTime deleteTime;
}
