package cn.xcd.lobster.controller;

import cn.xcd.lobster.common.result.ApiResult;
import cn.xcd.lobster.common.exception.BusinessException;
import cn.xcd.lobster.model.dto.AiAgentRegisterRequest;
import cn.xcd.lobster.model.dto.AiAgentSyncRequest;
import cn.xcd.lobster.model.dto.SkillSaveRequest;
import cn.xcd.lobster.model.entity.AgentToken;
import cn.xcd.lobster.model.vo.AgentConfigEventVO;
import cn.xcd.lobster.model.vo.AgentDetailVO;
import cn.xcd.lobster.model.vo.SkillPackageVO;
import cn.xcd.lobster.service.AgentSyncService;
import cn.xcd.lobster.service.SkillService;
import jakarta.servlet.http.HttpServletRequest;
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
import java.util.Map;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiAgentController {

    private final AgentSyncService agentSyncService;
    private final SkillService skillService;

    @GetMapping("/token/me")
    public ApiResult<Map<String, Object>> tokenInfo(HttpServletRequest request) {
        AgentToken token = (AgentToken) request.getAttribute("agentToken");
        return ApiResult.success(Map.of(
                "tokenId", String.valueOf(token.getId()),
                "ownerId", String.valueOf(token.getOwnerId()),
                "agentId", token.getAgentId() == null ? "" : String.valueOf(token.getAgentId()),
                "permissions", token.getPermissionJson()
        ));
    }

    @PostMapping("/agents/register")
    public ApiResult<AgentDetailVO> register(HttpServletRequest servletRequest,
                                             @Valid @RequestBody AiAgentRegisterRequest request) {
        return ApiResult.success(agentSyncService.registerByToken(currentToken(servletRequest), request));
    }

    @GetMapping("/agents/{id}/config")
    public ApiResult<AgentDetailVO> config(HttpServletRequest request, @PathVariable Long id) {
        return ApiResult.success(agentSyncService.tokenConfig(currentToken(request), id));
    }

    @PostMapping("/agents/{id}/sync")
    public ApiResult<AgentDetailVO> sync(HttpServletRequest servletRequest,
                                         @PathVariable Long id,
                                         @RequestBody AiAgentSyncRequest request) {
        return ApiResult.success(agentSyncService.syncByToken(currentToken(servletRequest), id, request));
    }

    @DeleteMapping("/agents/{id}/memories/{memoryId}")
    public ApiResult<Void> deleteMemory(HttpServletRequest request,
                                        @PathVariable Long id,
                                        @PathVariable Long memoryId) {
        AgentToken token = currentToken(request);
        requirePermission(token, "memoryWrite");
        agentSyncService.deleteMemoryByToken(token, id, memoryId);
        return ApiResult.success();
    }

    @DeleteMapping("/agents/{id}/goals/{goalId}")
    public ApiResult<Void> deleteGoal(HttpServletRequest request,
                                      @PathVariable Long id,
                                      @PathVariable Long goalId) {
        AgentToken token = currentToken(request);
        requirePermission(token, "goalWrite");
        agentSyncService.deleteGoalByToken(token, id, goalId);
        return ApiResult.success();
    }
    @GetMapping("/agents/{id}/backup")
    public ApiResult<AgentDetailVO> backup(HttpServletRequest request, @PathVariable Long id) {
        AgentToken token = currentToken(request);
        if (!permissionEnabled(token.getPermissionJson(), "backupExport")) {
            throw new BusinessException(403, "令牌缺少权限：backupExport");
        }
        return ApiResult.success(agentSyncService.tokenBackup(token, id));
    }

    @GetMapping("/agents/{id}/events")
    public ApiResult<List<AgentConfigEventVO>> events(HttpServletRequest request, @PathVariable Long id) {
        AgentToken token = currentToken(request);
        requirePermission(token, "configRead");
        return ApiResult.success(agentSyncService.listTokenEvents(token, id));
    }

    @PostMapping("/events/{eventId}/ack")
    public ApiResult<Void> ackEvent(HttpServletRequest request, @PathVariable Long eventId) {
        AgentToken token = currentToken(request);
        requirePermission(token, "configRead");
        agentSyncService.ackTokenEvent(token, eventId);
        return ApiResult.success();
    }

    @GetMapping("/skills")
    public ApiResult<List<SkillPackageVO>> skills(HttpServletRequest request) {
        AgentToken token = currentToken(request);
        requirePermission(token, "skillRead");
        return ApiResult.success(skillService.mineByToken(token));
    }

    @GetMapping("/skills/{id}")
    public ApiResult<SkillPackageVO> skillDetail(HttpServletRequest request, @PathVariable Long id) {
        AgentToken token = currentToken(request);
        requirePermission(token, "skillRead");
        return ApiResult.success(skillService.detailByToken(token, id));
    }

    @PostMapping("/skills")
    public ApiResult<SkillPackageVO> createSkill(HttpServletRequest request,
                                                 @Valid @RequestBody SkillSaveRequest skillRequest) {
        AgentToken token = currentToken(request);
        requirePermission(token, "skillWrite");
        return ApiResult.success(skillService.createByToken(token, skillRequest));
    }

    @PutMapping("/skills/{id}")
    public ApiResult<SkillPackageVO> updateSkill(HttpServletRequest request,
                                                 @PathVariable Long id,
                                                 @Valid @RequestBody SkillSaveRequest skillRequest) {
        AgentToken token = currentToken(request);
        requirePermission(token, "skillWrite");
        return ApiResult.success(skillService.updateByToken(token, id, skillRequest));
    }

    private AgentToken currentToken(HttpServletRequest request) {
        return (AgentToken) request.getAttribute("agentToken");
    }

    private void requirePermission(AgentToken token, String permission) {
        if (token == null || !permissionEnabled(token.getPermissionJson(), permission)) {
            throw new BusinessException(403, "令牌缺少权限：" + permission);
        }
    }

    private boolean permissionEnabled(String permissions, String permission) {
        return permissions != null
                && Pattern.compile("\"" + permission + "\"\\s*:\\s*true").matcher(permissions).find();
    }
}
