package cn.xcd.lobster.common.aspect;

import cn.xcd.lobster.common.annotation.RateLimiter;
import cn.xcd.lobster.common.exception.BusinessException;
import cn.xcd.lobster.common.properties.RateLimiterProperties;
import cn.xcd.lobster.common.support.AuthContextHolder;
import cn.xcd.lobster.common.utils.IpUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.redisson.api.RRateLimiter;
import org.redisson.api.RateIntervalUnit;
import org.redisson.api.RateType;
import org.redisson.api.RedissonClient;
import org.springframework.core.DefaultParameterNameDiscoverer;
import org.springframework.core.ParameterNameDiscoverer;
import org.springframework.expression.EvaluationContext;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Method;

@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class RateLimiterAspect {

    private final RedissonClient redissonClient;
    private final RateLimiterProperties rateLimiterProperties;
    private final ExpressionParser parser = new SpelExpressionParser();
    private final ParameterNameDiscoverer nameDiscoverer = new DefaultParameterNameDiscoverer();

    @Around("@annotation(rateLimiter)")
    public Object around(ProceedingJoinPoint pjp, RateLimiter rateLimiter) throws Throwable {
        String identifier;
        String keyPrefix = rateLimiterProperties.getBaseKey();
        String keyType;
        String owner;

        if (rateLimiter.limitType() == RateLimiter.LimitType.IP) {
            HttpServletRequest request = getHttpServletRequest();
            if (request == null) {
                throw new BusinessException(429, "无法获取请求对象，IP 限流失败");
            }
            owner = IpUtils.getClientIpAddress(request);
            if (!StringUtils.hasText(owner) || "unknown".equalsIgnoreCase(owner)) {
                throw new BusinessException(429, "无法识别客户端 IP");
            }
            keyType = RateLimiterProperties.IP;
            identifier = "IP[" + owner + "]";
        } else {
            owner = AuthContextHolder.getLoginId();
            if (!StringUtils.hasText(owner)) {
                throw new SecurityException("用户未认证");
            }
            keyType = RateLimiterProperties.USER;
            identifier = "user[" + owner + "]";
        }

        String dynamicKey = resolveDynamicKey(pjp, rateLimiter.key());
        String redisKey = keyPrefix + keyType + normalizeKeyPart(dynamicKey) + owner;
        RRateLimiter limiter = redissonClient.getRateLimiter(redisKey);
        limiter.trySetRate(RateType.OVERALL, rateLimiter.count(), rateLimiter.time(), RateIntervalUnit.SECONDS);

        if (!limiter.tryAcquire(1)) {
            log.warn("{} 请求被限流，key={}, 限制={}次/{}秒", identifier, redisKey, rateLimiter.count(), rateLimiter.time());
            throw new BusinessException(429, "操作过于频繁，请稍后再试");
        }

        log.debug("{} 通过限流检查，key={}", identifier, redisKey);
        return pjp.proceed();
    }

    private String resolveDynamicKey(ProceedingJoinPoint pjp, String keyExpression) {
        if (!StringUtils.hasText(keyExpression)) {
            return "";
        }
        MethodSignature signature = (MethodSignature) pjp.getSignature();
        Method method = signature.getMethod();
        Object[] args = pjp.getArgs();
        String[] parameterNames = nameDiscoverer.getParameterNames(method);
        EvaluationContext context = new StandardEvaluationContext();
        if (parameterNames != null) {
            for (int i = 0; i < parameterNames.length; i++) {
                context.setVariable(parameterNames[i], args[i]);
            }
        }
        String value = parser.parseExpression(keyExpression).getValue(context, String.class);
        return StringUtils.hasText(value) ? value : "";
    }

    private String normalizeKeyPart(String value) {
        return StringUtils.hasText(value) ? value + ":" : "";
    }

    private HttpServletRequest getHttpServletRequest() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attributes == null ? null : attributes.getRequest();
    }
}
