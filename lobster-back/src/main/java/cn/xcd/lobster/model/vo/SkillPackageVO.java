package cn.xcd.lobster.model.vo;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
public class SkillPackageVO {

    private String id;

    private String name;

    private String code;

    private String description;

    private String icon;

    private String version;

    private String visibility;

    private String publishStatus;

    private List<String> runtimeEnvironments;

    private List<String> coreCapabilities;

    private String auditStatus;

    private String auditReason;

    private String auditTime;

    private Integer installCount;

    private Integer fileCount;

    private String author;

    private List<SkillFileVO> files;

    public SkillPackageVO(String id,
                          String name,
                          String code,
                          String description,
                          String icon,
                          String version,
                          String visibility,
                          String publishStatus,
                          List<String> runtimeEnvironments,
                          List<String> coreCapabilities,
                          String auditStatus,
                          String auditReason,
                          String auditTime,
                          Integer installCount,
                          String author,
                          List<SkillFileVO> files) {
        this(id, name, code, description, icon, version, visibility, publishStatus,
                runtimeEnvironments, coreCapabilities, auditStatus, auditReason, auditTime,
                installCount, files == null ? 0 : files.size(), author, files);
    }

    public SkillPackageVO(String id,
                          String name,
                          String code,
                          String description,
                          String icon,
                          String version,
                          String visibility,
                          String publishStatus,
                          List<String> runtimeEnvironments,
                          List<String> coreCapabilities,
                          String auditStatus,
                          String auditReason,
                          String auditTime,
                          Integer installCount,
                          Integer fileCount,
                          String author,
                          List<SkillFileVO> files) {
        this.id = id;
        this.name = name;
        this.code = code;
        this.description = description;
        this.icon = icon;
        this.version = version;
        this.visibility = visibility;
        this.publishStatus = publishStatus;
        this.runtimeEnvironments = runtimeEnvironments;
        this.coreCapabilities = coreCapabilities;
        this.auditStatus = auditStatus;
        this.auditReason = auditReason;
        this.auditTime = auditTime;
        this.installCount = installCount;
        this.fileCount = fileCount;
        this.author = author;
        this.files = files;
    }
}
