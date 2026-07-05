package cn.xcd.lobster.controller;

import cn.xcd.lobster.common.result.ApiResult;
import cn.xcd.lobster.common.result.PageResult;
import cn.xcd.lobster.model.dto.SkillSaveRequest;
import cn.xcd.lobster.model.vo.SkillPackageVO;
import cn.xcd.lobster.service.SkillService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/skills")
@RequiredArgsConstructor
public class SkillController {

    private final SkillService skillService;

    @GetMapping("/market")
    public ApiResult<PageResult<SkillPackageVO>> market(@RequestParam(required = false) Long current,
                                                        @RequestParam(required = false) Long size,
                                                        @RequestParam(required = false) String keyword) {
        return ApiResult.success(skillService.market(current, size, keyword));
    }

    @GetMapping("/mine")
    public ApiResult<PageResult<SkillPackageVO>> mine(@RequestParam(required = false) Long current,
                                                      @RequestParam(required = false) Long size) {
        return ApiResult.success(skillService.mine(current, size));
    }

    @GetMapping("/installed")
    public ApiResult<PageResult<SkillPackageVO>> installed(@RequestParam(required = false) Long current,
                                                          @RequestParam(required = false) Long size) {
        return ApiResult.success(skillService.installed(current, size));
    }

    @GetMapping("/{id}")
    public ApiResult<SkillPackageVO> detail(@PathVariable Long id) {
        return ApiResult.success(skillService.detail(id));
    }

    @PostMapping
    public ApiResult<SkillPackageVO> create(@Valid @RequestBody SkillSaveRequest request) {
        return ApiResult.success(skillService.create(request));
    }

    @PutMapping("/{id}")
    public ApiResult<SkillPackageVO> update(@PathVariable Long id, @Valid @RequestBody SkillSaveRequest request) {
        return ApiResult.success(skillService.update(id, request));
    }

    @PostMapping("/{id}/publish")
    public ApiResult<SkillPackageVO> publish(@PathVariable Long id) {
        return ApiResult.success(skillService.publish(id));
    }

    @PostMapping("/{id}/offline")
    public ApiResult<SkillPackageVO> offline(@PathVariable Long id) {
        return ApiResult.success(skillService.offline(id));
    }

    @PostMapping("/{id}/install")
    public ApiResult<SkillPackageVO> install(@PathVariable Long id) {
        return ApiResult.success(skillService.install(id));
    }

    @PostMapping("/{id}/fork")
    public ApiResult<SkillPackageVO> fork(@PathVariable Long id) {
        return ApiResult.success(skillService.fork(id));
    }

    @DeleteMapping("/{id}")
    public ApiResult<Void> delete(@PathVariable Long id) {
        skillService.delete(id);
        return ApiResult.success();
    }

    @DeleteMapping("/{id}/install")
    public ApiResult<Void> uninstall(@PathVariable Long id) {
        skillService.uninstall(id);
        return ApiResult.success();
    }
}
