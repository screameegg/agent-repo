package cn.xcd.lobster.model.vo;

public record AdminFeedbackVO(
        String id,
        String userId,
        String username,
        String account,
        String feedbackType,
        Integer score,
        String category,
        String content,
        String pageUrl,
        String userAgent,
        String status,
        String createdAt
) {
}
