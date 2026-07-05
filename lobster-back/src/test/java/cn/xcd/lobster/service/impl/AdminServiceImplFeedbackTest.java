package cn.xcd.lobster.service.impl;

import cn.dev33.satoken.stp.StpUtil;
import cn.xcd.lobster.common.result.PageResult;
import cn.xcd.lobster.mapper.SkillPackageMapper;
import cn.xcd.lobster.mapper.UserFeedbackMapper;
import cn.xcd.lobster.mapper.UserMapper;
import cn.xcd.lobster.model.entity.User;
import cn.xcd.lobster.model.entity.UserFeedback;
import cn.xcd.lobster.model.vo.AdminFeedbackSummaryVO;
import cn.xcd.lobster.model.vo.AdminFeedbackVO;
import cn.xcd.lobster.service.NotificationService;
import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.MockedStatic;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AdminServiceImplFeedbackTest {

    @Test
    void pageFeedbackReturnsUserInfoAndFilters() {
        SkillPackageMapper skillPackageMapper = mock(SkillPackageMapper.class);
        UserMapper userMapper = mock(UserMapper.class);
        NotificationService notificationService = mock(NotificationService.class);
        UserFeedbackMapper feedbackMapper = mock(UserFeedbackMapper.class);
        AdminServiceImpl service = new AdminServiceImpl(skillPackageMapper, userMapper, notificationService, feedbackMapper);

        User admin = user(1L, "管理员", "admin@example.com", "admin");
        User submitter = user(8L, "小李", "li@example.com", "user");
        UserFeedback feedback = feedback(101L, 8L, "nps", 9, "recommendation", "推荐意愿高", "open");
        feedback.setPageUrl("/app");
        feedback.setUserAgent("Mozilla/5.0");
        feedback.setCreateTime(LocalDateTime.of(2026, 7, 5, 10, 30));

        when(userMapper.selectById(1L)).thenReturn(admin);
        when(userMapper.selectById(8L)).thenReturn(submitter);
        when(feedbackMapper.selectPage(any(Page.class), any(Wrapper.class))).thenAnswer(invocation -> {
            Page<UserFeedback> page = invocation.getArgument(0);
            page.setRecords(List.of(feedback));
            page.setTotal(1);
            return page;
        });

        try (MockedStatic<StpUtil> stp = mockStatic(StpUtil.class)) {
            stp.when(StpUtil::getLoginId).thenReturn(1L);
            PageResult<AdminFeedbackVO> result = service.pageFeedback(1L, 12L, "nps", "open", "推荐");

            assertEquals(1L, result.getTotal());
            AdminFeedbackVO item = result.getRecords().get(0);
            assertEquals("101", item.id());
            assertEquals("8", item.userId());
            assertEquals("小李", item.username());
            assertEquals("li@example.com", item.account());
            assertEquals("nps", item.feedbackType());
            assertEquals(9, item.score());
            assertEquals("recommendation", item.category());
            assertEquals("推荐意愿高", item.content());
            assertEquals("/app", item.pageUrl());
            assertEquals("Mozilla/5.0", item.userAgent());
            assertEquals("open", item.status());
            assertEquals("2026-07-05T10:30", item.createdAt());
        }
    }

    @Test
    void summarizeFeedbackCountsNpsBucketsAndAverageScore() {
        SkillPackageMapper skillPackageMapper = mock(SkillPackageMapper.class);
        UserMapper userMapper = mock(UserMapper.class);
        NotificationService notificationService = mock(NotificationService.class);
        UserFeedbackMapper feedbackMapper = mock(UserFeedbackMapper.class);
        AdminServiceImpl service = new AdminServiceImpl(skillPackageMapper, userMapper, notificationService, feedbackMapper);

        User admin = user(1L, "管理员", "admin@example.com", "admin");
        when(userMapper.selectById(1L)).thenReturn(admin);
        when(feedbackMapper.selectList(any(Wrapper.class))).thenReturn(List.of(
                feedback(11L, 2L, "nps", 10, "recommendation", "很愿意推荐", "open"),
                feedback(12L, 3L, "nps", 8, "recommendation", "还可以", "reviewed"),
                feedback(13L, 4L, "nps", 4, "recommendation", "不太满意", "open"),
                feedback(14L, 5L, "general", null, "bug", "头像上传失败", "closed")
        ));

        try (MockedStatic<StpUtil> stp = mockStatic(StpUtil.class)) {
            stp.when(StpUtil::getLoginId).thenReturn(1L);
            AdminFeedbackSummaryVO summary = service.summarizeFeedback();

            assertEquals(4L, summary.totalCount());
            assertEquals(1L, summary.generalCount());
            assertEquals(3L, summary.npsCount());
            assertEquals(7.3, summary.averageScore());
            assertEquals(1L, summary.promoterCount());
            assertEquals(1L, summary.passiveCount());
            assertEquals(1L, summary.detractorCount());
            assertEquals(2L, summary.openCount());
        }
    }

    @Test
    void updateFeedbackStatusOnlyAllowsKnownStatuses() {
        SkillPackageMapper skillPackageMapper = mock(SkillPackageMapper.class);
        UserMapper userMapper = mock(UserMapper.class);
        NotificationService notificationService = mock(NotificationService.class);
        UserFeedbackMapper feedbackMapper = mock(UserFeedbackMapper.class);
        AdminServiceImpl service = new AdminServiceImpl(skillPackageMapper, userMapper, notificationService, feedbackMapper);

        User admin = user(1L, "管理员", "admin@example.com", "admin");
        UserFeedback feedback = feedback(101L, 8L, "general", null, "bug", "头像上传失败", "open");
        when(userMapper.selectById(1L)).thenReturn(admin);
        when(feedbackMapper.selectById(101L)).thenReturn(feedback);

        try (MockedStatic<StpUtil> stp = mockStatic(StpUtil.class)) {
            stp.when(StpUtil::getLoginId).thenReturn(1L);
            service.updateFeedbackStatus(101L, "closed");

            ArgumentCaptor<UserFeedback> captor = ArgumentCaptor.forClass(UserFeedback.class);
            verify(feedbackMapper).updateById(captor.capture());
            assertEquals("closed", captor.getValue().getStatus());
        }
    }

    private User user(Long id, String name, String account, String role) {
        User user = new User();
        user.setId(id);
        user.setName(name);
        user.setAccount(account);
        user.setRole(role);
        user.setStatus("active");
        return user;
    }

    private UserFeedback feedback(Long id, Long userId, String type, Integer score, String category, String content, String status) {
        UserFeedback feedback = new UserFeedback();
        feedback.setId(id);
        feedback.setUserId(userId);
        feedback.setFeedbackType(type);
        feedback.setScore(score);
        feedback.setCategory(category);
        feedback.setContent(content);
        feedback.setStatus(status);
        feedback.setCreateTime(LocalDateTime.now());
        return feedback;
    }
}
