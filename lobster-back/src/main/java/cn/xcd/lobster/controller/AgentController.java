package cn.xcd.lobster.controller;

import cn.xcd.lobster.common.result.ApiResult;
import cn.xcd.lobster.common.result.PageResult;
import cn.xcd.lobster.model.dto.AgentBackupImportRequest;
import cn.xcd.lobster.model.dto.AgentCreateRequest;
import cn.xcd.lobster.model.dto.AgentGoalRequest;
import cn.xcd.lobster.model.dto.AgentMemoryRequest;
import cn.xcd.lobster.model.dto.AgentSkillMountRequest;
import cn.xcd.lobster.model.dto.AgentSkillRequest;
import cn.xcd.lobster.model.dto.AgentUpdateRequest;
import cn.xcd.lobster.model.vo.AgentDetailVO;
import cn.xcd.lobster.model.vo.AgentGoalVO;
import cn.xcd.lobster.model.vo.AgentMemoryVO;
import cn.xcd.lobster.model.vo.AgentSkillMountVO;
import cn.xcd.lobster.model.vo.AgentSkillVO;
import cn.xcd.lobster.model.vo.AgentVO;
import cn.xcd.lobster.service.AgentBackupService;
import cn.xcd.lobster.service.AgentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/agents")
@RequiredArgsConstructor
public class AgentController {

    private final AgentService agentService;
    private final AgentBackupService agentBackupService;

    @GetMapping
    public ApiResult<PageResult<AgentVO>> page(@RequestParam(required = false) Long current,
                                               @RequestParam(required = false) Long size,
                                               @RequestParam(required = false) String keyword) {
        return ApiResult.success(agentService.page(current, size, keyword));
    }

    @GetMapping("/{id}/profile")
    public ApiResult<AgentVO> profile(@PathVariable Long id) {
        return ApiResult.success(agentService.profile(id));
    }

    @GetMapping("/{id}/backup")
    public ApiResult<AgentDetailVO> exportBackup(@PathVariable Long id) {
        return ApiResult.success(agentService.exportBackup(id));
    }

    @GetMapping("/{id}/backup.zip")
    public ResponseEntity<byte[]> exportBackupZip(@PathVariable Long id) {
        AgentDetailVO backup = agentService.exportBackup(id);
        byte[] body = agentBackupService.exportZip(backup);
        String filename = "agent-backup-" + id + ".zip";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/zip"))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(filename, StandardCharsets.UTF_8)
                        .build()
                        .toString())
                .body(body);
    }

    @PostMapping("/import")
    public ApiResult<AgentDetailVO> importBackup(@Valid @RequestBody AgentBackupImportRequest request) {
        return ApiResult.success(agentService.importBackup(request));
    }

    @PostMapping(value = "/import.zip", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResult<AgentDetailVO> importBackupZip(@RequestParam("file") MultipartFile file) {
        AgentBackupImportRequest request = new AgentBackupImportRequest();
        request.setBackup(agentBackupService.parseZip(file));
        return ApiResult.success(agentService.importBackup(request));
    }

    @PostMapping
    public ApiResult<AgentVO> create(@Valid @RequestBody AgentCreateRequest request) {
        return ApiResult.success(agentService.create(request));
    }

    @PutMapping("/{id}")
    public ApiResult<AgentVO> update(@PathVariable Long id, @Valid @RequestBody AgentUpdateRequest request) {
        return ApiResult.success(agentService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResult<Void> delete(@PathVariable Long id) {
        agentService.delete(id);
        return ApiResult.success();
    }

    @GetMapping("/{id}/skills")
    public ApiResult<List<AgentSkillVO>> skills(@PathVariable Long id) {
        return ApiResult.success(agentService.listSkills(id));
    }

    @PostMapping("/{id}/skills")
    public ApiResult<AgentSkillVO> createSkill(@PathVariable Long id, @Valid @RequestBody AgentSkillRequest request) {
        return ApiResult.success(agentService.createSkill(id, request));
    }

    @GetMapping("/{id}/skill-mounts")
    public ApiResult<List<AgentSkillMountVO>> skillMounts(@PathVariable Long id) {
        return ApiResult.success(agentService.listSkillMounts(id));
    }

    @PostMapping("/{id}/skill-mounts")
    public ApiResult<AgentSkillMountVO> mountSkill(@PathVariable Long id,
                                                   @Valid @RequestBody AgentSkillMountRequest request) {
        return ApiResult.success(agentService.mountSkill(id, request));
    }

    @DeleteMapping("/{id}/skill-mounts/{skillId}")
    public ApiResult<Void> unmountSkill(@PathVariable Long id, @PathVariable Long skillId) {
        agentService.unmountSkill(id, skillId);
        return ApiResult.success();
    }

    @GetMapping("/{id}/memories")
    public ApiResult<List<AgentMemoryVO>> memories(@PathVariable Long id) {
        return ApiResult.success(agentService.listMemories(id));
    }

    @PostMapping("/{id}/memories")
    public ApiResult<AgentMemoryVO> createMemory(@PathVariable Long id, @Valid @RequestBody AgentMemoryRequest request) {
        return ApiResult.success(agentService.createMemory(id, request));
    }

    @DeleteMapping("/{id}/memories/{memoryId}")
    public ApiResult<Void> deleteMemory(@PathVariable Long id, @PathVariable Long memoryId) {
        agentService.deleteMemory(id, memoryId);
        return ApiResult.success();
    }

    @GetMapping("/{id}/goals")
    public ApiResult<List<AgentGoalVO>> goals(@PathVariable Long id) {
        return ApiResult.success(agentService.listGoals(id));
    }

    @PostMapping("/{id}/goals")
    public ApiResult<AgentGoalVO> createGoal(@PathVariable Long id, @Valid @RequestBody AgentGoalRequest request) {
        return ApiResult.success(agentService.createGoal(id, request));
    }

    @PutMapping("/{id}/goals/{goalId}")
    public ApiResult<AgentGoalVO> updateGoal(@PathVariable Long id,
                                             @PathVariable Long goalId,
                                             @Valid @RequestBody AgentGoalRequest request) {
        return ApiResult.success(agentService.updateGoal(id, goalId, request));
    }

    @DeleteMapping("/{id}/goals/{goalId}")
    public ApiResult<Void> deleteGoal(@PathVariable Long id, @PathVariable Long goalId) {
        agentService.deleteGoal(id, goalId);
        return ApiResult.success();
    }
}
