package cn.xcd.lobster.service;

import cn.xcd.lobster.model.dto.FeedbackSubmitRequest;
import cn.xcd.lobster.model.entity.UserFeedback;

public interface FeedbackService {

    UserFeedback submit(Long userId, FeedbackSubmitRequest request, String userAgent);

    boolean hasSubmittedNps(Long userId);
}
