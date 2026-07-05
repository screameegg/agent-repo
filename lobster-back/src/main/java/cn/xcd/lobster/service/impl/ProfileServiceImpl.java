package cn.xcd.lobster.service.impl;

import cn.dev33.satoken.stp.StpUtil;
import cn.xcd.lobster.common.exception.BusinessException;
import cn.xcd.lobster.mapper.UserMapper;
import cn.xcd.lobster.model.dto.PasswordUpdateRequest;
import cn.xcd.lobster.model.dto.ProfileUpdateRequest;
import cn.xcd.lobster.model.entity.User;
import cn.xcd.lobster.model.vo.ProfileVO;
import cn.xcd.lobster.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class ProfileServiceImpl implements ProfileService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    public ProfileVO current() {
        return toProfileVO(currentUser());
    }

    @Override
    @Transactional
    public ProfileVO update(ProfileUpdateRequest request) {
        User user = currentUser();
        user.setName(request.getUsername().trim());
        user.setAvatar(defaultText(request.getAvatar(), avatarFor(request.getUsername())));
        user.setBio(defaultText(request.getBio(), ""));
        if (request.getTheme() != null) {
            user.setTheme(defaultText(request.getTheme(), "system"));
        }
        if (request.getNotifyEnabled() != null) {
            user.setNotifyEnabled(request.getNotifyEnabled());
        }
        user.setUpdateTime(LocalDateTime.now());
        userMapper.updateById(user);
        return toProfileVO(user);
    }

    @Override
    @Transactional
    public void updatePassword(PasswordUpdateRequest request) {
        if (StringUtils.hasText(request.getConfirmPassword())
                && !request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BusinessException(400, "两次密码不一致");
        }
        User user = currentUser();
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BusinessException(400, "当前密码错误");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdateTime(LocalDateTime.now());
        userMapper.updateById(user);
    }

    private User currentUser() {
        Long userId = Long.valueOf(String.valueOf(StpUtil.getLoginId()));
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }
        return user;
    }

    private ProfileVO toProfileVO(User user) {
        String username = StringUtils.hasText(user.getName()) ? user.getName() : user.getAccount();
        return new ProfileVO(
                String.valueOf(user.getId()),
                username,
                user.getAccount(),
                defaultText(user.getAvatar(), avatarFor(username)),
                defaultText(user.getBio(), ""),
                defaultText(user.getTheme(), "system"),
                user.getNotifyEnabled() == null || user.getNotifyEnabled(),
                user.getCreateTime() == null ? "" : DATE_FORMATTER.format(user.getCreateTime())
        );
    }

    private String avatarFor(String name) {
        String seed = URLEncoder.encode(defaultText(name, "lobster"), StandardCharsets.UTF_8);
        return "https://api.dicebear.com/7.x/notionists/svg?seed=" + seed;
    }

    private String defaultText(String value, String fallback) {
        return StringUtils.hasText(value) ? value.trim() : fallback;
    }
}
