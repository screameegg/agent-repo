package cn.xcd.lobster.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SkillFileRequest {

    private String id;

    private String parentId;

    @NotBlank(message = "节点类型不能为空")
    private String nodeType;

    @NotBlank(message = "名称不能为空")
    private String name;

    @NotBlank(message = "路径不能为空")
    private String path;

    private String language;

    private String content;

    private Integer sortOrder;
}
