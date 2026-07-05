package cn.xcd.lobster.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("agent")
public class Agent {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    @TableField("owner_id")
    private Long ownerId;

    @TableField("name")
    private String name;

    @TableField("code")
    private String code;

    @TableField("role")
    private String role;

    @TableField("description")
    private String description;

    @TableField("system_prompt")
    private String systemPrompt;

    @TableField("avatar")
    private String avatar;

    @TableField("base_model")
    private String baseModel;

    @TableField("status")
    private String status;

    @TableField("association_status")
    private String associationStatus;

    @TableField("skill_count")
    private Integer skillCount;

    @TableField("memory_count")
    private Integer memoryCount;

    @TableField("goal_count")
    private Integer goalCount;

    @TableField("sort_order")
    private Integer sortOrder;

    @TableField("ext_json")
    private String extJson;

    @TableField("create_time")
    private LocalDateTime createTime;

    @TableField("update_time")
    private LocalDateTime updateTime;

    @TableField("delete_time")
    private LocalDateTime deleteTime;
}
