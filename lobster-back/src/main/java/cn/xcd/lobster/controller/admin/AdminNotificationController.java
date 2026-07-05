package cn.xcd.lobster.controller.admin;

import cn.dev33.satoken.stp.StpUtil;
import cn.xcd.lobster.common.exception.BusinessException;
import cn.xcd.lobster.common.result.ApiResult;
import cn.xcd.lobster.mapper.UserMapper;
import cn.xcd.lobster.model.dto.AdminAnnouncementRequest;
import cn.xcd.lobster.model.entity.User;
import cn.xcd.lobster.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/notifications")
@RequiredArgsConstructor
public class AdminNotificationController {

    private static final String ROLE_ADMIN = "admin";

    private final NotificationService notificationService;
    private final UserMapper userMapper;

    @PostMapping("/announcements")
    public ApiResult<Map<String, Integer>> publishAnnouncement(@Valid @RequestBody AdminAnnouncementRequest request) {
        requireAdmin();
        int deliveredCount = notificationService.publishAnnouncement(request.getTitle(), request.getContent());
        return ApiResult.success(Map.of("deliveredCount", deliveredCount));
    }

    private void requireAdmin() {
        Object loginId = StpUtil.getLoginId();
        User user = userMapper.selectById(Long.valueOf(String.valueOf(loginId)));
        if (user == null || !ROLE_ADMIN.equals(user.getRole())) {
            throw new BusinessException(403, "需要管理员权限");
        }
    }
}
