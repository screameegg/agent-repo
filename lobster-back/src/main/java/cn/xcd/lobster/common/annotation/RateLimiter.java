package cn.xcd.lobster.common.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target({ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimiter {

    LimitType limitType() default LimitType.USER;

    String key() default "";

    long time() default 60;

    long count() default 10;

    enum LimitType {
        USER,
        IP
    }
}
