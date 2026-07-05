package cn.xcd.lobster.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("skill_file")
public class SkillFile {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    @TableField("skill_id")
    private Long skillId;

    @TableField("parent_id")
    private Long parentId;

    @TableField("node_type")
    private String nodeType;

    @TableField("name")
    private String name;

    @TableField("path")
    private String path;

    @TableField("language")
    private String language;

    @TableField("content")
    private String content;

    @TableField("sort_order")
    private Integer sortOrder;

    @TableField("create_time")
    private LocalDateTime createTime;

    @TableField("update_time")
    private LocalDateTime updateTime;

    @TableField("delete_time")
    private LocalDateTime deleteTime;
}
