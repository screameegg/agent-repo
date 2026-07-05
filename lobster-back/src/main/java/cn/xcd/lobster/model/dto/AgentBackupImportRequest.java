package cn.xcd.lobster.model.dto;

import cn.xcd.lobster.model.vo.AgentDetailVO;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AgentBackupImportRequest {

    @NotNull(message = "备份数据不能为空")
    private AgentDetailVO backup;

    private String name;
}
