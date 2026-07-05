package cn.xcd.lobster.service.impl;

import cn.xcd.lobster.common.exception.BusinessException;
import cn.xcd.lobster.model.vo.AgentDetailVO;
import cn.xcd.lobster.model.vo.AgentGoalVO;
import cn.xcd.lobster.model.vo.AgentMemoryVO;
import cn.xcd.lobster.model.vo.AgentSkillMountVO;
import cn.xcd.lobster.model.vo.SkillFileVO;
import cn.xcd.lobster.model.vo.SkillPackageVO;
import cn.xcd.lobster.service.AgentBackupService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

@Service
@RequiredArgsConstructor
public class AgentBackupServiceImpl implements AgentBackupService {

    private static final String MANIFEST = "manifest.json";
    private static final String AGENT = "agent.json";
    private static final String MEMORIES = "memories.json";
    private static final String GOALS = "goals.json";
    private static final String MOUNTS = "mounts.json";

    private final ObjectMapper objectMapper;

    @Override
    public byte[] exportZip(AgentDetailVO backup) {
        if (backup == null || backup.getAgent() == null) {
            throw new BusinessException(400, "备份数据不完整");
        }
        try (ByteArrayOutputStream output = new ByteArrayOutputStream();
             ZipOutputStream zip = new ZipOutputStream(output, StandardCharsets.UTF_8)) {
            writeJson(zip, MANIFEST, Map.of(
                    "format", "lobster-agent-backup",
                    "version", "1.0.0",
                    "agentId", backup.getAgent().getId(),
                    "agentName", backup.getAgent().getName()
            ));
            writeJson(zip, AGENT, backup.getAgent());
            writeJson(zip, MEMORIES, nullSafe(backup.getMemories()));
            writeJson(zip, GOALS, nullSafe(backup.getGoals()));
            writeJson(zip, MOUNTS, nullSafe(backup.getSkillMounts()));
            for (SkillPackageVO skill : nullSafe(backup.getSkillPackages())) {
                String skillFolder = "skills/" + safeSegment(defaultText(skill.getCode(), skill.getName())) + "/";
                writeJson(zip, skillFolder + "skill.json", skillWithoutFiles(skill));
                for (SkillFileVO file : nullSafe(skill.getFiles())) {
                    if (!"file".equals(file.getNodeType())) {
                        continue;
                    }
                    String path = normalizeZipPath(skillFolder + normalizeRelativePath(file.getPath()));
                    writeText(zip, path, defaultText(file.getContent(), ""));
                }
            }
            zip.finish();
            return output.toByteArray();
        } catch (IOException e) {
            throw new BusinessException(500, "备份压缩失败");
        }
    }

    @Override
    public AgentDetailVO parseZip(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(400, "备份文件不能为空");
        }
        Map<String, byte[]> entries = readZipEntries(file);
        if (!entries.containsKey(MANIFEST) || !entries.containsKey(AGENT)) {
            throw new BusinessException(400, "备份ZIP缺少必要清单");
        }
        try {
            AgentDetailVO backup = new AgentDetailVO();
            backup.setAgent(objectMapper.readValue(entries.get(AGENT), cn.xcd.lobster.model.vo.AgentVO.class));
            backup.setMemories(readList(entries, MEMORIES, new TypeReference<List<AgentMemoryVO>>() {}));
            backup.setGoals(readList(entries, GOALS, new TypeReference<List<AgentGoalVO>>() {}));
            backup.setSkillMounts(readList(entries, MOUNTS, new TypeReference<List<AgentSkillMountVO>>() {}));
            backup.setSkills(List.of());
            backup.setSkillPackages(readSkillPackages(entries));
            return backup;
        } catch (IOException e) {
            throw new BusinessException(400, "备份ZIP解析失败");
        }
    }

    private List<SkillPackageVO> readSkillPackages(Map<String, byte[]> entries) throws IOException {
        Map<String, SkillPackageVO> skills = new LinkedHashMap<>();
        for (Map.Entry<String, byte[]> entry : entries.entrySet()) {
            String name = entry.getKey();
            if (name.startsWith("skills/") && name.endsWith("/skill.json")) {
                SkillPackageVO skill = objectMapper.readValue(entry.getValue(), SkillPackageVO.class);
                skill.setFiles(new ArrayList<>());
                skills.put(name.substring(0, name.length() - "skill.json".length()), skill);
            }
        }
        for (Map.Entry<String, SkillPackageVO> skillEntry : skills.entrySet()) {
            String folder = skillEntry.getKey();
            SkillPackageVO skill = skillEntry.getValue();
            int order = 0;
            for (Map.Entry<String, byte[]> entry : entries.entrySet()) {
                String name = entry.getKey();
                if (!name.startsWith(folder) || name.endsWith("/skill.json")) {
                    continue;
                }
                String relativePath = name.substring(folder.length());
                SkillFileVO file = new SkillFileVO(
                        null,
                        null,
                        "file",
                        fileName(relativePath),
                        relativePath,
                        languageOf(relativePath),
                        new String(entry.getValue(), StandardCharsets.UTF_8),
                        order++
                );
                skill.getFiles().add(file);
            }
        }
        return new ArrayList<>(skills.values());
    }

    private Map<String, byte[]> readZipEntries(MultipartFile file) {
        Map<String, byte[]> entries = new LinkedHashMap<>();
        try (ZipInputStream zip = new ZipInputStream(new ByteArrayInputStream(file.getBytes()), StandardCharsets.UTF_8)) {
            ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) {
                if (entry.isDirectory()) {
                    continue;
                }
                String path = normalizeZipPath(entry.getName());
                entries.put(path, zip.readAllBytes());
            }
        } catch (IOException e) {
            throw new BusinessException(400, "备份ZIP读取失败");
        }
        return entries;
    }

    private <T> List<T> readList(Map<String, byte[]> entries, String key, TypeReference<List<T>> type) throws IOException {
        if (!entries.containsKey(key)) {
            return List.of();
        }
        return objectMapper.readValue(entries.get(key), type);
    }

    private SkillPackageVO skillWithoutFiles(SkillPackageVO skill) {
        return new SkillPackageVO(
                skill.getId(),
                skill.getName(),
                skill.getCode(),
                skill.getDescription(),
                skill.getIcon(),
                skill.getVersion(),
                skill.getVisibility(),
                skill.getPublishStatus(),
                nullSafe(skill.getRuntimeEnvironments()),
                nullSafe(skill.getCoreCapabilities()),
                skill.getAuditStatus(),
                skill.getAuditReason(),
                skill.getAuditTime(),
                skill.getInstallCount(),
                skill.getAuthor(),
                List.of()
        );
    }

    private void writeJson(ZipOutputStream zip, String path, Object value) throws IOException {
        writeText(zip, path, objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(value));
    }

    private void writeText(ZipOutputStream zip, String path, String content) throws IOException {
        zip.putNextEntry(new ZipEntry(normalizeZipPath(path)));
        zip.write(content.getBytes(StandardCharsets.UTF_8));
        zip.closeEntry();
    }

    private String normalizeZipPath(String path) {
        String value = normalizeRelativePath(path);
        if (value.contains("../") || value.startsWith("/") || value.matches("^[A-Za-z]:.*")) {
            throw new BusinessException(400, "备份ZIP路径不合法");
        }
        return value;
    }

    private String normalizeRelativePath(String path) {
        String value = defaultText(path, "").replace("\\", "/").replaceAll("/+", "/");
        value = value.replaceAll("^/+", "").replaceAll("/+$", "");
        if (!StringUtils.hasText(value) || value.equals("..") || value.contains("/../")) {
            throw new BusinessException(400, "备份文件路径不合法");
        }
        return value;
    }

    private String safeSegment(String value) {
        String normalized = defaultText(value, "skill").toLowerCase()
                .replaceAll("[^a-z0-9\\u4e00-\\u9fa5]+", "-")
                .replaceAll("(^-+|-+$)", "");
        return StringUtils.hasText(normalized) ? normalized : "skill";
    }

    private String fileName(String path) {
        int index = path.lastIndexOf('/');
        return index < 0 ? path : path.substring(index + 1);
    }

    private String languageOf(String path) {
        if (path.endsWith(".md")) return "markdown";
        if (path.endsWith(".json")) return "json";
        if (path.endsWith(".py")) return "python";
        if (path.endsWith(".js")) return "javascript";
        if (path.endsWith(".ts")) return "typescript";
        return "text";
    }

    private <T> List<T> nullSafe(List<T> value) {
        return value == null ? List.of() : value;
    }

    private String defaultText(String value, String fallback) {
        return StringUtils.hasText(value) ? value.trim() : fallback;
    }
}
