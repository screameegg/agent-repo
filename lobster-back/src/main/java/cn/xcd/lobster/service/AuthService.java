package cn.xcd.lobster.service;

import cn.xcd.lobster.model.dto.LoginRequest;
import cn.xcd.lobster.model.dto.RegisterRequest;
import cn.xcd.lobster.model.vo.LoginResponse;

public interface AuthService {

    LoginResponse login(LoginRequest request);

    LoginResponse register(RegisterRequest request);
}
