package cn.xcd.lobster.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("agent_config_event")
public class AgentConfigEvent {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    @TableField("owner_id")
    private Long ownerId;

    @TableField("agent_id")
    private Long agentId;

    @TableField("event_type")
    private String eventType;

    @TableField("event_status")
    private String eventStatus;

    @TableField("payload_json")
    private String payloadJson;

    @TableField("read_time")
    private LocalDateTime readTime;

    @TableField("create_time")
    private LocalDateTime createTime;

    @TableField("update_time")
    private LocalDateTime updateTime;

    @TableField("delete_time")
    private LocalDateTime deleteTime;
}
