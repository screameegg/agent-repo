package cn.xcd.lobster.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class SkillSaveRequest {

    @NotBlank(message = "技能名称不能为空")
    private String name;

    private String code;

    private String description;

    private String icon;

    private String version;

    private String visibility;

    private String publishStatus;

    private List<String> runtimeEnvironments;

    private List<String> coreCapabilities;

    private List<SkillFileRequest> files;
}
