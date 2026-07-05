package cn.xcd.lobster.service;

import cn.xcd.lobster.common.result.PageResult;
import cn.xcd.lobster.model.vo.NotificationVO;

public interface NotificationService {

    PageResult<NotificationVO> page(Long current, Long size, Boolean unreadOnly);

    Long unreadCount();

    void markRead(Long id);

    void markAllRead();

    NotificationVO createForUser(Long recipientUserId, Long senderUserId, String type, String title, String content, String bizType, Long bizId);

    int publishAnnouncement(String title, String content);
}
