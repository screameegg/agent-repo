package cn.xcd.lobster.model.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationVO {

    private String id;

    private String notificationType;

    private String title;

    private String content;

    private String bizType;

    private String bizId;

    private Boolean read;

    private String createdAt;

    private String readAt;
}
