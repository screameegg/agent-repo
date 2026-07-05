package cn.xcd.lobster.common.properties;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "lobster.rate-limiter")
public class RateLimiterProperties {

    public static final String USER = "user:";
    public static final String IP = "ip:";

    private String baseKey = "lobster:rate-limiter:";
}
