package cn.xcd.lobster.controller;

import cn.xcd.lobster.common.result.ApiResult;
import cn.xcd.lobster.common.result.PageResult;
import cn.xcd.lobster.model.vo.NotificationVO;
import cn.xcd.lobster.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ApiResult<PageResult<NotificationVO>> page(@RequestParam(required = false) Long current,
                                                      @RequestParam(required = false) Long size,
                                                      @RequestParam(required = false) Boolean unreadOnly) {
        return ApiResult.success(notificationService.page(current, size, unreadOnly));
    }

    @GetMapping("/unread-count")
    public ApiResult<Map<String, Long>> unreadCount() {
        return ApiResult.success(Map.of("count", notificationService.unreadCount()));
    }

    @PostMapping("/{id}/read")
    public ApiResult<Void> markRead(@PathVariable Long id) {
        notificationService.markRead(id);
        return ApiResult.success();
    }

    @PostMapping("/read-all")
    public ApiResult<Void> markAllRead() {
        notificationService.markAllRead();
        return ApiResult.success();
    }
}
