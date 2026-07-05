package cn.xcd.lobster.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PasswordUpdateRequest {

    @NotBlank(message = "当前密码不能为空")
    private String currentPassword;

    @NotBlank(message = "新密码不能为空")
    private String newPassword;

    private String confirmPassword;
}
