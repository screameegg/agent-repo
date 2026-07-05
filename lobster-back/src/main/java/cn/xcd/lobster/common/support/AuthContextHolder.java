package cn.xcd.lobster.common.support;

import cn.dev33.satoken.stp.StpUtil;

public final class AuthContextHolder {

    private AuthContextHolder() {
    }

    public static String getLoginId() {
        return StpUtil.isLogin() ? StpUtil.getLoginIdAsString() : null;
    }
}
