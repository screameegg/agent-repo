package cn.xcd.lobster.common.config;

import cn.xcd.lobster.model.entity.AgentToken;
import cn.xcd.lobster.service.AgentTokenAuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@RequiredArgsConstructor
public class AgentTokenInterceptor implements HandlerInterceptor {

    private final AgentTokenAuthService agentTokenAuthService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String token = request.getHeader("X-Agent-Token");
        if (!StringUtils.hasText(token)) {
            String authorization = request.getHeader("Authorization");
            if (StringUtils.hasText(authorization) && authorization.startsWith("Bearer ")) {
                token = authorization.substring(7);
            }
        }
        AgentToken agentToken = agentTokenAuthService.verify(token);
        request.setAttribute("agentToken", agentToken);
        return true;
    }
}
