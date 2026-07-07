package cn.xcd.lobster.service.support;

import cn.xcd.lobster.common.exception.BusinessException;
import cn.xcd.lobster.model.dto.AgentGoalStepRequest;
import cn.xcd.lobster.model.vo.AgentGoalStepVO;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public final class AgentGoalStepSupport {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final Set<String> STATUSES = Set.of(
            "pending",
            "running",
            "in_progress",
            "completed",
            "skipped",
            "failed"
    );

    private AgentGoalStepSupport() {
    }

    public static String mergeSteps(String extJson, List<AgentGoalStepRequest> requests, LocalDateTime now) {
        ObjectNode root = parseObject(extJson);
        ArrayNode steps = OBJECT_MAPPER.valueToTree(normalize(requests, now));
        root.set("steps", steps);
        try {
            return OBJECT_MAPPER.writeValueAsString(root);
        } catch (Exception ignored) {
            return "{\"steps\":[]}";
        }
    }

    public static List<AgentGoalStepVO> readSteps(String extJson) {
        JsonNode steps = parseObject(extJson).get("steps");
        if (steps == null || !steps.isArray()) {
            return List.of();
        }
        try {
            List<StoredStep> stored = OBJECT_MAPPER.convertValue(steps, new TypeReference<List<StoredStep>>() {});
            return stored.stream()
                    .map(step -> new AgentGoalStepVO(
                            defaultText(step.id(), ""),
                            defaultText(step.title(), ""),
                            defaultText(step.description(), ""),
                            defaultStatus(step.status()),
                            step.sortOrder() == null ? 0 : step.sortOrder(),
                            defaultText(step.updatedAt(), "")
                    ))
                    .toList();
        } catch (IllegalArgumentException ignored) {
            return List.of();
        }
    }

    private static List<StoredStep> normalize(List<AgentGoalStepRequest> requests, LocalDateTime now) {
        if (requests == null || requests.isEmpty()) {
            return List.of();
        }
        List<StoredStep> steps = new ArrayList<>();
        for (int index = 0; index < requests.size(); index++) {
            AgentGoalStepRequest request = requests.get(index);
            if (request == null) {
                continue;
            }
            if (!StringUtils.hasText(request.getTitle())) {
                throw new BusinessException(400, "目标步骤标题不能为空");
            }
            String status = defaultStatus(request.getStatus());
            if (!STATUSES.contains(status)) {
                throw new BusinessException(400, "目标步骤状态无效");
            }
            steps.add(new StoredStep(
                    StringUtils.hasText(request.getId()) ? request.getId().trim() : UUID.randomUUID().toString(),
                    request.getTitle().trim(),
                    defaultText(request.getDescription(), ""),
                    status,
                    request.getSortOrder() == null ? (index + 1) * 10 : request.getSortOrder(),
                    now == null ? LocalDateTime.now().toString() : now.toString()
            ));
        }
        return steps;
    }

    private static ObjectNode parseObject(String extJson) {
        if (!StringUtils.hasText(extJson)) {
            return OBJECT_MAPPER.createObjectNode();
        }
        try {
            JsonNode node = OBJECT_MAPPER.readTree(extJson);
            if (node != null && node.isObject()) {
                return (ObjectNode) node;
            }
        } catch (Exception ignored) {
            return OBJECT_MAPPER.createObjectNode();
        }
        return OBJECT_MAPPER.createObjectNode();
    }

    private static String defaultStatus(String value) {
        return StringUtils.hasText(value) ? value.trim() : "pending";
    }

    private static String defaultText(String value, String fallback) {
        return StringUtils.hasText(value) ? value.trim() : fallback;
    }

    private record StoredStep(String id,
                              String title,
                              String description,
                              String status,
                              Integer sortOrder,
                              String updatedAt) {
    }
}
