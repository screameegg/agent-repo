package cn.xcd.lobster.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("skill_package")
public class SkillPackage {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    @TableField("owner_id")
    private Long ownerId;

    @TableField("name")
    private String name;

    @TableField("code")
    private String code;

    @TableField("description")
    private String description;

    @TableField("icon")
    private String icon;

    @TableField("version")
    private String version;

    @TableField("visibility")
    private String visibility;

    @TableField("publish_status")
    private String publishStatus;

    @TableField("audit_status")
    private String auditStatus;

    @TableField("audit_reason")
    private String auditReason;

    @TableField("audit_operator_id")
    private Long auditOperatorId;

    @TableField("audit_time")
    private LocalDateTime auditTime;

    @TableField("install_count")
    private Integer installCount;

    @TableField("ext_json")
    private String extJson;

    @TableField("create_time")
    private LocalDateTime createTime;

    @TableField("update_time")
    private LocalDateTime updateTime;

    @TableField("delete_time")
    private LocalDateTime deleteTime;
}
