package cn.xcd.lobster.service.impl;

import cn.xcd.lobster.common.exception.BusinessException;
import cn.xcd.lobster.mapper.AgentTokenMapper;
import cn.xcd.lobster.model.entity.AgentToken;
import cn.xcd.lobster.service.AgentTokenAuthService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.DigestUtils;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AgentTokenAuthServiceImpl implements AgentTokenAuthService {

    private final AgentTokenMapper agentTokenMapper;

    @Override
    public AgentToken verify(String token) {
        if (!StringUtils.hasText(token)) {
            throw new BusinessException(401, "AI访问令牌不能为空");
        }
        String tokenHash = DigestUtils.md5DigestAsHex(token.trim().getBytes(StandardCharsets.UTF_8));
        AgentToken agentToken = agentTokenMapper.selectOne(new LambdaQueryWrapper<AgentToken>()
                .eq(AgentToken::getTokenHash, tokenHash)
                .eq(AgentToken::getStatus, "active")
                .isNull(AgentToken::getDeleteTime)
                .last("limit 1"));
        if (agentToken == null) {
            throw new BusinessException(401, "AI访问令牌无效");
        }
        if (agentToken.getExpireTime() != null && agentToken.getExpireTime().isBefore(LocalDateTime.now())) {
            throw new BusinessException(401, "AI访问令牌已过期");
        }
        agentToken.setLastUsedTime(LocalDateTime.now());
        agentToken.setUpdateTime(agentToken.getLastUsedTime());
        agentTokenMapper.updateById(agentToken);
        return agentToken;
    }
}
