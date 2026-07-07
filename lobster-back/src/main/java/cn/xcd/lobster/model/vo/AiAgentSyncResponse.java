package cn.xcd.lobster.model.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiAgentSyncResponse {

    private String syncRevision;

    private Changed changed;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Changed {

        private Boolean agent;

        private Integer skills;

        private Integer memories;

        private Integer goals;
    }
}
