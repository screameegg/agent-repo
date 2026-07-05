package cn.xcd.lobster.service.impl;

import cn.dev33.satoken.stp.StpUtil;
import cn.xcd.lobster.common.exception.BusinessException;
import cn.xcd.lobster.common.result.PageResult;
import cn.xcd.lobster.mapper.NotificationMapper;
import cn.xcd.lobster.mapper.UserMapper;
import cn.xcd.lobster.model.entity.Notification;
import cn.xcd.lobster.model.entity.User;
import cn.xcd.lobster.model.vo.NotificationVO;
import cn.xcd.lobster.service.NotificationService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private static final String TYPE_ANNOUNCEMENT = "system_announcement";
    private static final String STATUS_DISABLED = "disabled";

    private final NotificationMapper notificationMapper;
    private final UserMapper userMapper;

    @Override
    public PageResult<NotificationVO> page(Long current, Long size, Boolean unreadOnly) {
        Long userId = currentUserId();
        Page<Notification> page = new Page<>(normalizeCurrent(current), normalizeSize(size));
        LambdaQueryWrapper<Notification> wrapper = new LambdaQueryWrapper<Notification>()
                .eq(Notification::getRecipientUserId, userId)
                .isNull(Notification::getDeleteTime)
                .orderByDesc(Notification::getCreateTime);
        if (Boolean.TRUE.equals(unreadOnly)) {
            wrapper.isNull(Notification::getReadTime);
        }
        Page<Notification> result = notificationMapper.selectPage(page, wrapper);
        return PageResult.of(result.getRecords().stream().map(this::toVO).toList(),
                result.getTotal(), result.getCurrent(), result.getSize());
    }

    @Override
    public Long unreadCount() {
        return notificationMapper.selectCount(new LambdaQueryWrapper<Notification>()
                .eq(Notification::getRecipientUserId, currentUserId())
                .isNull(Notification::getReadTime)
                .isNull(Notification::getDeleteTime));
    }

    @Override
    @Transactional
    public void markRead(Long id) {
        Notification notification = getOwnedNotification(id);
        if (notification.getReadTime() == null) {
            notification.setReadTime(LocalDateTime.now());
            notificationMapper.updateById(notification);
        }
    }

    @Override
    @Transactional
    public void markAllRead() {
        Long userId = currentUserId();
        LocalDateTime now = LocalDateTime.now();
        for (Notification notification : notificationMapper.selectList(new LambdaQueryWrapper<Notification>()
                .eq(Notification::getRecipientUserId, userId)
                .isNull(Notification::getReadTime)
                .isNull(Notification::getDeleteTime))) {
            notification.setReadTime(now);
            notificationMapper.updateById(notification);
        }
    }

    @Override
    @Transactional
    public NotificationVO createForUser(Long recipientUserId, Long senderUserId, String type, String title, String content, String bizType, Long bizId) {
        Notification notification = new Notification();
        notification.setRecipientUserId(recipientUserId);
        notification.setSenderUserId(senderUserId);
        notification.setNotificationType(defaultText(type, "system"));
        notification.setTitle(defaultText(title, "系统通知"));
        notification.setContent(defaultText(content, ""));
        notification.setBizType(defaultText(bizType, ""));
        notification.setBizId(bizId);
        notification.setCreateTime(LocalDateTime.now());
        notificationMapper.insert(notification);
        return toVO(notification);
    }

    @Override
    @Transactional
    public int publishAnnouncement(String title, String content) {
        Long senderId = currentUserId();
        int count = 0;
        for (User user : userMapper.selectList(new LambdaQueryWrapper<User>()
                .ne(User::getStatus, STATUS_DISABLED))) {
            createForUser(user.getId(), senderId, TYPE_ANNOUNCEMENT, title, content, "announcement", null);
            count++;
        }
        return count;
    }

    private Notification getOwnedNotification(Long id) {
        if (id == null) {
            throw new BusinessException(400, "通知ID不能为空");
        }
        Notification notification = notificationMapper.selectOne(new LambdaQueryWrapper<Notification>()
                .eq(Notification::getId, id)
                .eq(Notification::getRecipientUserId, currentUserId())
                .isNull(Notification::getDeleteTime)
                .last("limit 1"));
        if (notification == null) {
            throw new BusinessException(404, "通知不存在");
        }
        return notification;
    }

    private NotificationVO toVO(Notification notification) {
        return new NotificationVO(
                String.valueOf(notification.getId()),
                defaultText(notification.getNotificationType(), "system"),
                defaultText(notification.getTitle(), ""),
                defaultText(notification.getContent(), ""),
                defaultText(notification.getBizType(), ""),
                notification.getBizId() == null ? "" : String.valueOf(notification.getBizId()),
                notification.getReadTime() != null,
                notification.getCreateTime() == null ? "" : notification.getCreateTime().toString(),
                notification.getReadTime() == null ? "" : notification.getReadTime().toString()
        );
    }

    private Long currentUserId() {
        return Long.valueOf(String.valueOf(StpUtil.getLoginId()));
    }

    private Long normalizeCurrent(Long current) {
        return current == null || current < 1 ? 1 : current;
    }

    private Long normalizeSize(Long size) {
        if (size == null || size < 1) {
            return 12L;
        }
        return Math.min(size, 100L);
    }

    private String defaultText(String value, String fallback) {
        return StringUtils.hasText(value) ? value.trim() : fallback;
    }
}
