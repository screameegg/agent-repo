package cn.xcd.lobster.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ProfileUpdateRequest {

    @NotBlank(message = "用户昵称不能为空")
    private String username;

    private String avatar;

    private String bio;

    private String theme;

    private Boolean notifyEnabled;
}
