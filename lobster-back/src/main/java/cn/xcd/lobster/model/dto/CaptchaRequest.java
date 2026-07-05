package cn.xcd.lobster.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CaptchaRequest {

    @NotBlank(message = "账号不能为空")
    private String account;

    @NotBlank(message = "验证码类型不能为空")
    private String type;
}
