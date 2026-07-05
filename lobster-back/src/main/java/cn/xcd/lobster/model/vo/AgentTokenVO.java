package cn.xcd.lobster.model.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AgentTokenVO {

    private String id;

    private String agentId;

    private String name;

    private String key;

    private String createdAt;

    private String lastUsed;

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
