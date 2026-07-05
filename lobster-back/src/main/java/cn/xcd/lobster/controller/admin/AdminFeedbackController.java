package cn.xcd.lobster.controller.admin;

import cn.xcd.lobster.common.result.ApiResult;
import cn.xcd.lobster.common.result.PageResult;
import cn.xcd.lobster.model.dto.AdminFeedbackStatusRequest;
import cn.xcd.lobster.model.vo.AdminFeedbackSummaryVO;
import cn.xcd.lobster.model.vo.AdminFeedbackVO;
import cn.xcd.lobster.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/feedback")
@RequiredArgsConstructor
public class AdminFeedbackController {

    private final AdminService adminService;

    @GetMapping
    public ApiResult<PageResult<AdminFeedbackVO>> feedback(@RequestParam(required = false) Long current,
                                                           @RequestParam(required = false) Long size,
                                                           @RequestParam(required = false) String feedbackType,
                                                           @RequestParam(required = false) String status,
                                                           @RequestParam(required = false) String keyword) {
        return ApiResult.success(adminService.pageFeedback(current, size, feedbackType, status, keyword));
    }

    @GetMapping("/summary")
    public ApiResult<AdminFeedbackSummaryVO> summary() {
        return ApiResult.success(adminService.summarizeFeedback());
    }

    @PutMapping("/{id}/status")
    public ApiResult<AdminFeedbackVO> updateStatus(@PathVariable Long id,
                                                   @RequestBody(required = false) AdminFeedbackStatusRequest request) {
        return ApiResult.success(adminService.updateFeedbackStatus(id, request == null ? null : request.getStatus()));
    }
}
