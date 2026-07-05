package cn.xcd.lobster.service;

import cn.xcd.lobster.model.dto.PasswordUpdateRequest;
import cn.xcd.lobster.model.dto.ProfileUpdateRequest;
import cn.xcd.lobster.model.vo.ProfileVO;

public interface ProfileService {

    ProfileVO current();

    ProfileVO update(ProfileUpdateRequest request);

    void updatePassword(PasswordUpdateRequest request);
}
