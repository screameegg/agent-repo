package cn.xcd.lobster.service;

import cn.xcd.lobster.model.dto.CaptchaRequest;
import cn.xcd.lobster.model.vo.CaptchaResponse;

public interface CaptchaService {

    CaptchaResponse generate(CaptchaRequest request);

    void validate(String account, String type, String captchaKey, String captchaCode);
}
