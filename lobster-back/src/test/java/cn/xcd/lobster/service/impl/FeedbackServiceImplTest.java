package cn.xcd.lobster.service.impl;

import cn.xcd.lobster.mapper.UserFeedbackMapper;
import cn.xcd.lobster.model.dto.FeedbackSubmitRequest;
import cn.xcd.lobster.model.entity.UserFeedback;
import com.baomidou.mybatisplus.core.conditions.Wrapper;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class FeedbackServiceImplTest {

    @Test
    void submitNpsStoresScoreAndMarksUserAsSubmitted() {
        UserFeedbackMapper feedbackMapper = mock(UserFeedbackMapper.class);
        FeedbackServiceImpl service = new FeedbackServiceImpl(feedbackMapper);

        FeedbackSubmitRequest request = new FeedbackSubmitRequest();
        request.setFeedbackType("nps");
        request.setScore(9);
        request.setCategory("recommendation");
        request.setContent("整体体验顺手，愿意推荐。 核心路径清晰。");
        request.setPageUrl("/app");

        service.submit(1001L, request, "Mozilla/5.0");

        ArgumentCaptor<UserFeedback> captor = ArgumentCaptor.forClass(UserFeedback.class);
        verify(feedbackMapper).insert(captor.capture());
        UserFeedback saved = captor.getValue();
        assertEquals(1001L, saved.getUserId());
        assertEquals("nps", saved.getFeedbackType());
        assertEquals(9, saved.getScore());
        assertEquals("recommendation", saved.getCategory());
        assertEquals("/app", saved.getPageUrl());
        assertEquals("Mozilla/5.0", saved.getUserAgent());
        assertEquals("open", saved.getStatus());
        assertNotNull(saved.getCreateTime());

        when(feedbackMapper.selectCount(any(Wrapper.class))).thenReturn(1L);
        assertTrue(service.hasSubmittedNps(1001L));
    }
}
