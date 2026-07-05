package cn.xcd.lobster.model.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AgentMemoryVO {

    private String id;

    private String title;

    private String content;

    private String memoryType;

    private Integer importance;

    private String source;

    private String createdAt;
}
