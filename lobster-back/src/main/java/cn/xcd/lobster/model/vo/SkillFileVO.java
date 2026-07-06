package cn.xcd.lobster.model.vo;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SkillFileVO {

    private String id;

    private String parentId;

    private String nodeType;

    private String name;

    private String path;

    private String language;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String content;

    private Integer size;

    private Integer sortOrder;
}
