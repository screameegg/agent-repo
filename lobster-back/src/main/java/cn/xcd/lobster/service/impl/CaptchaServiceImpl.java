package cn.xcd.lobster.service.impl;

import cn.hutool.captcha.CaptchaUtil;
import cn.hutool.captcha.LineCaptcha;
import cn.xcd.lobster.common.exception.BusinessException;
import cn.xcd.lobster.common.properties.CaptchaProperties;
import cn.xcd.lobster.model.dto.CaptchaRequest;
import cn.xcd.lobster.model.vo.CaptchaResponse;
import cn.xcd.lobster.service.CaptchaService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.DigestUtils;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CaptchaServiceImpl implements CaptchaService {

    public static final String TYPE_LOGIN = "login";
    public static final String TYPE_REGISTER = "register";

    private final StringRedisTemplate stringRedisTemplate;
    private final CaptchaProperties captchaProperties;

    @Override
    public CaptchaResponse generate(CaptchaRequest request) {
        String type = normalizeType(request.getType());
        String account = normalizeAccount(request.getAccount());
        LineCaptcha captcha = CaptchaUtil.createLineCaptcha(
                captchaProperties.getWidth(),
                captchaProperties.getHeight(),
                captchaProperties.getLength(),
                captchaProperties.getLineCount()
        );
        String captchaKey = UUID.randomUUID().toString().replace("-", "");
        String redisKey = buildRedisKey(type, account, captchaKey);
        stringRedisTemplate.opsForValue().set(
                redisKey,
                hashCaptcha(captcha.getCode()),
                Duration.ofSeconds(captchaProperties.getExpireSeconds())
        );
        return new CaptchaResponse(captchaKey, "data:image/png;base64," + captcha.getImageBase64(), captchaProperties.getExpireSeconds());
    }

    @Override
    public void validate(String account, String type, String captchaKey, String captchaCode) {
        if (!Boolean.TRUE.equals(captchaProperties.getEnabled())) {
            return;
        }
        if (!StringUtils.hasText(captchaKey) && !Boolean.TRUE.equals(captchaProperties.getRequired())) {
            return;
        }
        if (!StringUtils.hasText(captchaKey) || !StringUtils.hasText(captchaCode)) {
            throw new BusinessException(400, "验证码不能为空");
        }
        String redisKey = buildRedisKey(normalizeType(type), normalizeAccount(account), captchaKey);
        String expected = stringRedisTemplate.opsForValue().get(redisKey);
        if (!StringUtils.hasText(expected)) {
            throw new BusinessException(400, "验证码已过期");
        }
        stringRedisTemplate.delete(redisKey);
        if (!expected.equals(hashCaptcha(captchaCode))) {
            throw new BusinessException(400, "验证码错误");
        }
    }

    private String normalizeType(String type) {
        String normalized = type == null ? "" : type.trim().toLowerCase(Locale.ROOT);
        if (!TYPE_LOGIN.equals(normalized) && !TYPE_REGISTER.equals(normalized)) {
            throw new BusinessException(400, "验证码类型错误");
        }
        return normalized;
    }

    private String normalizeAccount(String account) {
        if (!StringUtils.hasText(account)) {
            throw new BusinessException(400, "账号不能为空");
        }
        return account.trim().toLowerCase(Locale.ROOT);
    }

    private String buildRedisKey(String type, String account, String captchaKey) {
        return captchaProperties.getBaseKey() + type + ":" + account + ":" + captchaKey;
    }

    private String hashCaptcha(String captchaCode) {
        return DigestUtils.md5DigestAsHex(captchaCode.trim().toLowerCase(Locale.ROOT).getBytes(StandardCharsets.UTF_8));
    }
}
