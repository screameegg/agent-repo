package cn.xcd.lobster.common.properties;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "lobster.admin")
public class AdminProperties {

    private String loginId = "admin";
    private String username = "admin";
    private String password = "admin";
}
