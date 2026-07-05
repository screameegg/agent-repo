package cn.xcd.lobster.model.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProfileVO {

    private String id;

    private String username;

    private String account;

    private String avatar;

    private String bio;

    private String theme;

    private Boolean notifyEnabled;

    private String createdAt;
}
