package cn.xcd.lobster.model.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserVO {

    private String id;

    private String username;

    private String account;

    private String role;

    private String status;

    private String avatar;

    private String createdAt;

    private String lastLoginAt;
}
