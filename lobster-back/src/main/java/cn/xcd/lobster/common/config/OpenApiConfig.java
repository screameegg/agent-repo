package cn.xcd.lobster.common.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI lobsterOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("龙虾后端接口文档")
                        .description("龙虾后端服务 API 文档")
                        .version("1.0.0")
                        .contact(new Contact().name("龙虾后端")));
    }
}
