package cn.xcd.lobster.controller;

import cn.xcd.lobster.common.result.ApiResult;
import cn.xcd.lobster.model.dto.AgentTokenCreateRequest;
import cn.xcd.lobster.model.dto.AgentTokenUpdateRequest;
import cn.xcd.lobster.model.vo.AgentTokenCreateVO;
import cn.xcd.lobster.model.vo.AgentTokenVO;
import cn.xcd.lobster.service.AgentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/agent-tokens")
@RequiredArgsConstructor
public class AgentTokenController {

    private final AgentService agentService;

    @GetMapping
    public ApiResult<List<AgentTokenVO>> list() {
        return ApiResult.success(agentService.listTokens());
    }

    @PostMapping
    public ApiResult<AgentTokenCreateVO> create(@Valid @RequestBody AgentTokenCreateRequest request) {
        return ApiResult.success(agentService.createToken(request));
    }

    @PutMapping("/{id}")
    public ApiResult<AgentTokenVO> update(@PathVariable Long id, @Valid @RequestBody AgentTokenUpdateRequest request) {
        return ApiResult.success(agentService.updateToken(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResult<Void> delete(@PathVariable Long id) {
        agentService.deleteToken(id);
        return ApiResult.success();
    }
}
