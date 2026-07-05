package cn.xcd.lobster.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("notification")
public class Notification {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    @TableField("recipient_user_id")
    private Long recipientUserId;

    @TableField("sender_user_id")
    private Long senderUserId;

    @TableField("notification_type")
    private String notificationType;

    @TableField("title")
    private String title;

    @TableField("content")
    private String content;

    @TableField("biz_type")
    private String bizType;

    @TableField("biz_id")
    private Long bizId;

    @TableField("read_time")
    private LocalDateTime readTime;

    @TableField("create_time")
    private LocalDateTime createTime;

    @TableField("delete_time")
    private LocalDateTime deleteTime;
}
