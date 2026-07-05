package cn.xcd.lobster.controller;

import cn.dev33.satoken.stp.StpUtil;
import cn.xcd.lobster.common.result.ApiResult;
import cn.xcd.lobster.model.dto.LoginRequest;
import cn.xcd.lobster.model.dto.RegisterRequest;
import cn.xcd.lobster.model.vo.LoginResponse;
import cn.xcd.lobster.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ApiResult<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResult.success(authService.login(request));
    }

    @PostMapping("/register")
    public ApiResult<LoginResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResult.success(authService.register(request));
    }

    @PostMapping("/logout")
    public ApiResult<Void> logout() {
        StpUtil.logout();
        return ApiResult.success();
    }
}
