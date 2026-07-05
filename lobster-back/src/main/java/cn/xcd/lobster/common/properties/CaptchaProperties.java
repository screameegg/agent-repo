package cn.xcd.lobster.common.properties;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "lobster.captcha")
public class CaptchaProperties {

    private String baseKey = "lobster:captcha:";
    private Long expireSeconds = 300L;
    private Integer width = 90;
    private Integer height = 40;
    private Integer length = 4;
    private Integer lineCount = 20;
    private Boolean enabled = true;
    private Boolean required = false;
}
