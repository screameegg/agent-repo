package cn.xcd.lobster.service.impl;

import cn.dev33.satoken.stp.StpUtil;
import cn.xcd.lobster.common.exception.BusinessException;
import cn.xcd.lobster.mapper.UserMapper;
import cn.xcd.lobster.model.dto.LoginRequest;
import cn.xcd.lobster.model.dto.RegisterRequest;
import cn.xcd.lobster.model.entity.User;
import cn.xcd.lobster.model.vo.LoginResponse;
import cn.xcd.lobster.model.vo.LoginUserVO;
import cn.xcd.lobster.service.AuthService;
import cn.xcd.lobster.service.CaptchaService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final String ROLE_ADMIN = "admin";
    private static final String ROLE_USER = "user";
    private static final String STATUS_ACTIVE = "active";
    private static final String STATUS_DISABLED = "disabled";

    private final UserMapper userMapper;
    private final CaptchaService captchaService;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    @Transactional
    public LoginResponse login(LoginRequest request) {
        captchaService.validate(request.getUsername(), CaptchaServiceImpl.TYPE_LOGIN, request.getCaptchaKey(), request.getCaptcha());

        if (userMapper.selectCount(null) == 0) {
            return createInitialAdmin(request.getUsername(), request.getPassword());
        }

        User user = findByAccount(request.getUsername());
        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException(400, "用户名或密码错误");
        }
        if (STATUS_DISABLED.equals(user.getStatus())) {
            throw new BusinessException(403, "账号已被禁用，请联系管理员");
        }

        LocalDateTime now = LocalDateTime.now();
        user.setLastLoginTime(now);
        user.setUpdateTime(now);
        userMapper.updateById(user);

        StpUtil.login(user.getId());
        return buildLoginResponse(user, StpUtil.getTokenValue());
    }

    @Override
    @Transactional
    public LoginResponse register(RegisterRequest request) {
        captchaService.validate(request.getUsername(), CaptchaServiceImpl.TYPE_REGISTER, request.getCaptchaKey(), request.getCaptcha());

        if (StringUtils.hasText(request.getConfirmPassword())
                && !request.getPassword().equals(request.getConfirmPassword())) {
            throw new BusinessException(400, "两次密码不一致");
        }
        if (findByAccount(request.getUsername()) != null) {
            throw new BusinessException(400, "账号已存在");
        }

        String role = hasAdminUser() ? ROLE_USER : ROLE_ADMIN;
        return createUser(request.getUsername(), request.getPassword(), role);
    }

    private LoginResponse createInitialAdmin(String username, String password) {
        return createUser(username, password, ROLE_ADMIN);
    }

    private LoginResponse createUser(String username, String password, String role) {
        LocalDateTime now = LocalDateTime.now();
        User user = new User();
        user.setName(username);
        user.setAccount(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);
        user.setStatus(STATUS_ACTIVE);
        user.setCreateTime(now);
        user.setLastLoginTime(now);
        user.setUpdateTime(now);
        userMapper.insert(user);

        StpUtil.login(user.getId());
        return buildLoginResponse(user, StpUtil.getTokenValue());
    }

    private User findByAccount(String account) {
        return userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getAccount, account)
                .last("limit 1"));
    }

    private LoginResponse buildLoginResponse(User user, String token) {
        String username = StringUtils.hasText(user.getName()) ? user.getName() : user.getAccount();
        String avatarSeed = URLEncoder.encode(username, StandardCharsets.UTF_8);
        String avatar = StringUtils.hasText(user.getAvatar())
                ? user.getAvatar()
                : "https://api.dicebear.com/7.x/notionists/svg?seed=" + avatarSeed;
        LoginUserVO userVO = new LoginUserVO(
                String.valueOf(user.getId()),
                username,
                avatar,
                defaultText(user.getRole(), ROLE_USER)
        );
        return new LoginResponse(token, userVO);
    }

    private boolean hasAdminUser() {
        Long adminCount = userMapper.selectCount(new LambdaQueryWrapper<User>()
                .eq(User::getRole, ROLE_ADMIN));
        return adminCount != null && adminCount > 0;
    }

    private String defaultText(String value, String fallback) {
        return StringUtils.hasText(value) ? value.trim() : fallback;
    }
}
