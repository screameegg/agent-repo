package cn.xcd.lobster.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("skill_publish_apply_log")
public class SkillPublishApplyLog {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    @TableField("user_id")
    private Long userId;

    @TableField("skill_id")
    private Long skillId;

    @TableField("apply_result")
    private String applyResult;

    @TableField("reason")
    private String reason;

    @TableField("create_time")
    private LocalDateTime createTime;
}
