package cn.xcd.lobster.service.support;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class SkillMetadataSupport {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };
    private static final String RUNTIME_ENVIRONMENTS = "runtimeEnvironments";
    private static final String CORE_CAPABILITIES = "coreCapabilities";

    private SkillMetadataSupport() {
    }

    public static String merge(String extJson, List<String> runtimeEnvironments, List<String> coreCapabilities) {
        Map<String, Object> value = parse(extJson);
        if (runtimeEnvironments != null) {
            value.put(RUNTIME_ENVIRONMENTS, normalizeList(runtimeEnvironments));
        }
        if (coreCapabilities != null) {
            value.put(CORE_CAPABILITIES, normalizeList(coreCapabilities));
        }
        return write(value);
    }

    public static List<String> runtimeEnvironments(String extJson) {
        return readStringList(parse(extJson).get(RUNTIME_ENVIRONMENTS));
    }

    public static List<String> coreCapabilities(String extJson) {
        return readStringList(parse(extJson).get(CORE_CAPABILITIES));
    }

    public static String searchableText(String extJson) {
        return String.join("\n", runtimeEnvironments(extJson)) + "\n" + String.join("\n", coreCapabilities(extJson));
    }

    private static Map<String, Object> parse(String extJson) {
        if (!StringUtils.hasText(extJson)) {
            return new LinkedHashMap<>();
        }
        try {
            Map<String, Object> parsed = OBJECT_MAPPER.readValue(extJson, MAP_TYPE);
            return parsed == null ? new LinkedHashMap<>() : new LinkedHashMap<>(parsed);
        } catch (Exception ignored) {
            return new LinkedHashMap<>();
        }
    }

    private static String write(Map<String, Object> value) {
        try {
            return OBJECT_MAPPER.writeValueAsString(value);
        } catch (Exception ignored) {
            return "{}";
        }
    }

    private static List<String> readStringList(Object value) {
        if (!(value instanceof List<?> list)) {
            return List.of();
        }
        List<String> result = new ArrayList<>();
        for (Object item : list) {
            if (item == null) {
                continue;
            }
            String text = String.valueOf(item).trim();
            if (StringUtils.hasText(text) && !result.contains(text)) {
                result.add(text);
            }
        }
        return result;
    }

    private static List<String> normalizeList(List<String> source) {
        List<String> result = new ArrayList<>();
        for (String item : source) {
            if (!StringUtils.hasText(item)) {
                continue;
            }
            String value = item.trim();
            if (!result.contains(value)) {
                result.add(value);
            }
        }
        return result;
    }
}
