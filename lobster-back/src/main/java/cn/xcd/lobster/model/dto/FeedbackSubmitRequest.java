package cn.xcd.lobster.model.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class FeedbackSubmitRequest {

    @Size(max = 32, message = "反馈类型不能超过32个字符")
    private String feedbackType;

    @Min(value = 0, message = "推荐分不能小于0")
    @Max(value = 10, message = "推荐分不能大于10")
    private Integer score;

    @Size(max = 64, message = "反馈分类不能超过64个字符")
    private String category;

    @Size(max = 2048, message = "反馈内容不能超过2048个字符")
    private String content;

    @Size(max = 512, message = "页面地址不能超过512个字符")
    private String pageUrl;
}
