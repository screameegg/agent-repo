package cn.xcd.lobster.service;

import cn.xcd.lobster.model.entity.AgentToken;

public interface AgentTokenAuthService {

    AgentToken verify(String token);
}
