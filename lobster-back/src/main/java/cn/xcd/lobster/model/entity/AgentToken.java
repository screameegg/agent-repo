package cn.xcd.lobster.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("agent_token")
public class AgentToken {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    @TableField("owner_id")
    private Long ownerId;

    @TableField("agent_id")
    private Long agentId;

    @TableField("name")
    private String name;

    @TableField("token_prefix")
    private String tokenPrefix;

    @TableField("token_hash")
    private String tokenHash;

    @TableField("permission_json")
    private String permissionJson;

    @TableField("status")
    private String status;

    @TableField("last_used_time")
    private LocalDateTime lastUsedTime;

    @TableField("expire_time")
    private LocalDateTime expireTime;

    @TableField("create_time")
    private LocalDateTime createTime;

    @TableField("update_time")
    private LocalDateTime updateTime;

    @TableField("delete_time")
    private LocalDateTime deleteTime;
}
