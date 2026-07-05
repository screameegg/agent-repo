package cn.xcd.lobster.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AgentTokenCreateRequest {

    private Long agentId;

    @NotBlank(message = "令牌名称不能为空")
    private String name;

    private Boolean skillRead;

    private Boolean skillWrite;

    private Boolean memoryRead;

    private Boolean memoryWrite;

    private Boolean goalRead;

    private Boolean goalWrite;

    private Boolean agentRegister;

    private Boolean agentSync;

    private Boolean configRead;

    private Boolean backupExport;
}
