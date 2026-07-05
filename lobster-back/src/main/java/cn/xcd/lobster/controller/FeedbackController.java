package cn.xcd.lobster.controller;

import cn.dev33.satoken.stp.StpUtil;
import cn.xcd.lobster.common.result.ApiResult;
import cn.xcd.lobster.model.dto.FeedbackSubmitRequest;
import cn.xcd.lobster.model.entity.UserFeedback;
import cn.xcd.lobster.service.FeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;

    @GetMapping("/nps-status")
    public ApiResult<Map<String, Boolean>> npsStatus() {
        return ApiResult.success(Map.of("submitted", feedbackService.hasSubmittedNps(currentUserId())));
    }

    @PostMapping
    public ApiResult<Map<String, String>> submit(@Valid @RequestBody FeedbackSubmitRequest request,
                                                 @RequestHeader(value = "User-Agent", required = false) String userAgent) {
        UserFeedback feedback = feedbackService.submit(currentUserId(), request, userAgent);
        return ApiResult.success(Map.of("id", String.valueOf(feedback.getId())));
    }

    private Long currentUserId() {
        return Long.valueOf(String.valueOf(StpUtil.getLoginId()));
    }
}
