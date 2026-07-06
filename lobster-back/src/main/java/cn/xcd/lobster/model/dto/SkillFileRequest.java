package cn.xcd.lobster.model.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SkillFileRequest {

    private String id;

    private String parentId;

    @JsonAlias({"type", "node_type"})
    @NotBlank(message = "节点类型不能为空")
    private String nodeType;

    @JsonAlias({"filename", "fileName"})
    @NotBlank(message = "名称不能为空")
    private String name;

    @NotBlank(message = "路径不能为空")
    private String path;

    private String language;

    private String content;

    private Integer sortOrder;
}
