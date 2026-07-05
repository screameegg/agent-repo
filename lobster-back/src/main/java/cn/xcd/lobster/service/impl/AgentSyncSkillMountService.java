package cn.xcd.lobster.service.impl;

import cn.xcd.lobster.mapper.SkillPackageMapper;
import cn.xcd.lobster.model.dto.AgentSkillMountRequest;
import cn.xcd.lobster.model.dto.AgentSkillRequest;
import cn.xcd.lobster.model.entity.Agent;
import cn.xcd.lobster.model.entity.AgentToken;
import cn.xcd.lobster.model.entity.SkillPackage;
import cn.xcd.lobster.service.AgentSkillMountService;
import cn.xcd.lobster.service.support.AgentSkillConfigSupport;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
class AgentSyncSkillMountService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final SkillPackageMapper skillPackageMapper;
    private final AgentSkillMountService agentSkillMountService;

    void mountMatchingSkillPackage(AgentToken token, Agent agent, AgentSkillRequest request) {
        if (request == null || token == null || agent == null || !permissionEnabled(token.getPermissionJson(), "skillWrite")) {
            return;
        }
        AgentSkillConfigSupport.skillCode(request.getConfigJson())
                .flatMap(code -> findOwnedSkillPackage(token.getOwnerId(), code))
                .ifPresent(skillPackage -> mountSkill(token, agent, request, skillPackage));
    }

    private void mountSkill(AgentToken token, Agent agent, AgentSkillRequest request, SkillPackage skillPackage) {
        AgentSkillMountRequest mountRequest = new AgentSkillMountRequest();
        mountRequest.setSkillId(skillPackage.getId());
        mountRequest.setMountStatus(defaultText(request.getMountStatus(), "active"));
        mountRequest.setConfigJson(skillMountConfig(skillPackage));
        agentSkillMountService.mountSkillForOwner(token.getOwnerId(), agent.getId(), mountRequest, false);
    }

    private Optional<SkillPackage> findOwnedSkillPackage(Long ownerId, String code) {
        if (!StringUtils.hasText(code)) {
            return Optional.empty();
        }
        SkillPackage skillPackage = skillPackageMapper.selectOne(new LambdaQueryWrapper<SkillPackage>()
                .eq(SkillPackage::getOwnerId, ownerId)
                .eq(SkillPackage::getCode, code.trim())
                .isNull(SkillPackage::getDeleteTime)
                .last("limit 1"));
        return Optional.ofNullable(skillPackage);
    }

    private String skillMountConfig(SkillPackage skillPackage) {
        try {
            return OBJECT_MAPPER.writeValueAsString(Map.of(
                    "skillId", String.valueOf(skillPackage.getId()),
                    "code", defaultText(skillPackage.getCode(), ""),
                    "version", defaultText(skillPackage.getVersion(), "1.0.0")
            ));
        } catch (Exception ignored) {
            return "{\"skillId\":\"" + skillPackage.getId() + "\"}";
        }
    }

    private boolean permissionEnabled(String permissions, String permission) {
        return permissions != null
                && Pattern.compile("\"" + permission + "\"\\s*:\\s*true").matcher(permissions).find();
    }

    private String defaultText(String value, String fallback) {
        return StringUtils.hasText(value) ? value.trim() : fallback;
    }
}
