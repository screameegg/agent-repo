package cn.xcd.lobster.controller.admin;

import cn.xcd.lobster.common.result.ApiResult;
import cn.xcd.lobster.common.result.PageResult;
import cn.xcd.lobster.model.dto.AdminUserRoleRequest;
import cn.xcd.lobster.model.dto.AdminUserStatusRequest;
import cn.xcd.lobster.model.vo.AdminUserVO;
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
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminService adminService;

    @GetMapping
    public ApiResult<PageResult<AdminUserVO>> users(@RequestParam(required = false) Long current,
                                                    @RequestParam(required = false) Long size,
                                                    @RequestParam(required = false) String keyword) {
        return ApiResult.success(adminService.pageUsers(current, size, keyword));
    }

    @PutMapping("/{id}/role")
    public ApiResult<AdminUserVO> updateRole(@PathVariable Long id, @RequestBody AdminUserRoleRequest request) {
        return ApiResult.success(adminService.updateUserRole(id, request == null ? null : request.getRole()));
    }

    @PutMapping("/{id}/status")
    public ApiResult<AdminUserVO> updateStatus(@PathVariable Long id, @RequestBody AdminUserStatusRequest request) {
        return ApiResult.success(adminService.updateUserStatus(id, request == null ? null : request.getStatus()));
    }
}
