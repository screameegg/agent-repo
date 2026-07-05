package cn.xcd.lobster.model.vo;

public record AdminFeedbackSummaryVO(
        Long totalCount,
        Long generalCount,
        Long npsCount,
        Double averageScore,
        Long promoterCount,
        Long passiveCount,
        Long detractorCount,
        Long openCount
) {
}
