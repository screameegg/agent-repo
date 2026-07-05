package cn.xcd.lobster.common.config;

import com.github.houbb.sensitive.word.bs.SensitiveWordBs;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SensitiveWordConfig {

    @Bean
    public SensitiveWordBs sensitiveWordBs() {
        return SensitiveWordBs.newInstance().init();
    }
}
