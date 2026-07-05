package cn.xcd.lobster.controller;

import cn.xcd.lobster.common.result.ApiResult;
import cn.xcd.lobster.model.dto.PasswordUpdateRequest;
import cn.xcd.lobster.model.dto.ProfileUpdateRequest;
import cn.xcd.lobster.model.vo.ProfileVO;
import cn.xcd.lobster.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping
    public ApiResult<ProfileVO> current() {
        return ApiResult.success(profileService.current());
    }

    @PutMapping
    public ApiResult<ProfileVO> update(@Valid @RequestBody ProfileUpdateRequest request) {
        return ApiResult.success(profileService.update(request));
    }

    @PutMapping("/password")
    public ApiResult<Void> updatePassword(@Valid @RequestBody PasswordUpdateRequest request) {
        profileService.updatePassword(request);
        return ApiResult.success();
    }
}
