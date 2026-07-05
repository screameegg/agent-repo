package cn.xcd.lobster.controller.admin;

import cn.xcd.lobster.common.result.ApiResult;
import cn.xcd.lobster.common.result.PageResult;
import cn.xcd.lobster.model.dto.AdminSkillRejectRequest;
import cn.xcd.lobster.model.vo.SkillPackageVO;
import cn.xcd.lobster.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/skills")
@RequiredArgsConstructor
public class AdminSkillController {

    private final AdminService adminService;

    @GetMapping
    public ApiResult<PageResult<SkillPackageVO>> skills(@RequestParam(required = false) Long current,
                                                        @RequestParam(required = false) Long size,
                                                        @RequestParam(required = false) String keyword,
                                                        @RequestParam(required = false) String auditStatus,
                                                        @RequestParam(required = false) String publishStatus) {
        return ApiResult.success(adminService.pageSkills(current, size, keyword, auditStatus, publishStatus));
    }

    @PostMapping("/{id}/approve")
    public ApiResult<SkillPackageVO> approveSkill(@PathVariable Long id) {
        return ApiResult.success(adminService.approveSkill(id));
    }

    @PostMapping("/{id}/reject")
    public ApiResult<SkillPackageVO> rejectSkill(@PathVariable Long id,
                                                 @RequestBody(required = false) AdminSkillRejectRequest request) {
        return ApiResult.success(adminService.rejectSkill(id, request == null ? null : request.getReason()));
    }

    @PostMapping("/{id}/publish")
    public ApiResult<SkillPackageVO> publishSkill(@PathVariable Long id) {
        return ApiResult.success(adminService.publishSkill(id));
    }

    @PostMapping("/{id}/offline")
    public ApiResult<SkillPackageVO> offlineSkill(@PathVariable Long id) {
        return ApiResult.success(adminService.offlineSkill(id));
    }
}
