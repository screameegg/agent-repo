package cn.xcd.lobster.service.impl;

import cn.xcd.lobster.common.exception.BusinessException;
import cn.xcd.lobster.mapper.UserFeedbackMapper;
import cn.xcd.lobster.model.dto.FeedbackSubmitRequest;
import cn.xcd.lobster.model.entity.UserFeedback;
import cn.xcd.lobster.service.FeedbackService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class FeedbackServiceImpl implements FeedbackService {

    private static final String TYPE_GENERAL = "general";
    private static final String TYPE_NPS = "nps";
    private static final String STATUS_OPEN = "open";
    private static final Set<String> FEEDBACK_TYPES = Set.of(TYPE_GENERAL, TYPE_NPS);

    private final UserFeedbackMapper userFeedbackMapper;

    @Override
    @Transactional
    public UserFeedback submit(Long userId, FeedbackSubmitRequest request, String userAgent) {
        if (userId == null) {
            throw new BusinessException(401, "请先登录");
        }
        if (request == null) {
            throw new BusinessException(400, "反馈内容不能为空");
        }

        String feedbackType = normalizeType(request.getFeedbackType());
        validateRequest(feedbackType, request);

        LocalDateTime now = LocalDateTime.now();
        UserFeedback feedback = new UserFeedback();
        feedback.setUserId(userId);
        feedback.setFeedbackType(feedbackType);
        feedback.setScore(TYPE_NPS.equals(feedbackType) ? request.getScore() : null);
        feedback.setCategory(defaultText(request.getCategory(), TYPE_NPS.equals(feedbackType) ? "recommendation" : "general"));
        feedback.setContent(defaultText(request.getContent(), ""));
        feedback.setPageUrl(limit(defaultText(request.getPageUrl(), ""), 512));
        feedback.setUserAgent(limit(defaultText(userAgent, ""), 512));
        feedback.setStatus(STATUS_OPEN);
        feedback.setCreateTime(now);
        feedback.setUpdateTime(now);
        userFeedbackMapper.insert(feedback);
        return feedback;
    }

    @Override
    public boolean hasSubmittedNps(Long userId) {
        if (userId == null) {
            return false;
        }
        return userFeedbackMapper.selectCount(new LambdaQueryWrapper<UserFeedback>()
                .eq(UserFeedback::getUserId, userId)
                .eq(UserFeedback::getFeedbackType, TYPE_NPS)
                .isNull(UserFeedback::getDeleteTime)) > 0;
    }

    private void validateRequest(String feedbackType, FeedbackSubmitRequest request) {
        if (TYPE_NPS.equals(feedbackType)) {
            Integer score = request.getScore();
            if (score == null || score < 0 || score > 10) {
                throw new BusinessException(400, "请选择0到10之间的推荐分");
            }
            return;
        }

        if (!StringUtils.hasText(request.getContent())) {
            throw new BusinessException(400, "请填写反馈内容");
        }
    }

    private String normalizeType(String value) {
        String type = defaultText(value, TYPE_GENERAL).toLowerCase(Locale.ROOT);
        if (!FEEDBACK_TYPES.contains(type)) {
            throw new BusinessException(400, "反馈类型不合法");
        }
        return type;
    }

    private String defaultText(String value, String fallback) {
        return StringUtils.hasText(value) ? value.trim() : fallback;
    }

    private String limit(String value, int maxLength) {
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }
}
