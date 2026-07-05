package cn.xcd.lobster.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("sys_user")
public class User {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    @TableField("name")
    private String name;

    @TableField("account")
    private String account;

    @TableField("password")
    private String password;

    @TableField("role")
    private String role;

    @TableField("status")
    private String status;

    @TableField("avatar")
    private String avatar;

    @TableField("bio")
    private String bio;

    @TableField("theme")
    private String theme;

    @TableField("notify_enabled")
    private Boolean notifyEnabled;

    @TableField("create_time")
    private LocalDateTime createTime;

    @TableField("last_login_time")
    private LocalDateTime lastLoginTime;

    @TableField("update_time")
    private LocalDateTime updateTime;
}
