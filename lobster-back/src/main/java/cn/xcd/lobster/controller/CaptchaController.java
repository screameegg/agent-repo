package cn.xcd.lobster.controller;

import cn.xcd.lobster.common.result.ApiResult;
import cn.xcd.lobster.model.dto.CaptchaRequest;
import cn.xcd.lobster.model.vo.CaptchaResponse;
import cn.xcd.lobster.service.CaptchaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/captcha")
@RequiredArgsConstructor
public class CaptchaController {

    private final CaptchaService captchaService;

    @GetMapping
    public ApiResult<CaptchaResponse> captcha(@RequestParam String account, @RequestParam String type) {
        CaptchaRequest request = new CaptchaRequest();
        request.setAccount(account);
        request.setType(type);
        return ApiResult.success(captchaService.generate(request));
    }

    @PostMapping
    public ApiResult<CaptchaResponse> captcha(@Valid @RequestBody CaptchaRequest request) {
        return ApiResult.success(captchaService.generate(request));
    }
}
