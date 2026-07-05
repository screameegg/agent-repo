package cn.xcd.lobster.model.vo;

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

    private String content;

    private Integer sortOrder;
}
