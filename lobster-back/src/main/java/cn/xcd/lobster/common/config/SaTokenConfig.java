package cn.xcd.lobster.common.config;

import cn.dev33.satoken.interceptor.SaInterceptor;
import cn.dev33.satoken.stp.StpUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;

@Configuration
@RequiredArgsConstructor
public class SaTokenConfig implements WebMvcConfigurer {

    private final AgentTokenInterceptor agentTokenInterceptor;

    @Value("${lobster.upload.root-path:uploads}")
    private String uploadRootPath;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(agentTokenInterceptor)
                .addPathPatterns("/api/ai/**");

        registry.addInterceptor(new SaInterceptor(handle -> StpUtil.checkLogin()))
                .addPathPatterns("/**")
                .excludePathPatterns(
                        "/",
                        "/error",
                        "/favicon.ico",
                        "/doc.html",
                        "/webjars/**",
                        "/swagger-ui/**",
                        "/v3/api-docs/**",
                        "/uploads/**",
                        "/api/captcha",
                        "/api/auth/login",
                        "/api/auth/register",
                        "/api/ai/**");
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String location = Path.of(uploadRootPath).toAbsolutePath().normalize().toUri().toString();
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(location);
    }
}
