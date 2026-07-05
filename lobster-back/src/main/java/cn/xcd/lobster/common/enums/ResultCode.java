package cn.xcd.lobster.common.enums;

import lombok.Getter;

@Getter
public enum ResultCode {

    SUCCESS(200, "success"),
    PARAM_ERROR(400, "param error"),
    UNAUTHORIZED(401, "unauthorized"),
    FORBIDDEN(403, "forbidden"),
    NOT_FOUND(404, "not found"),
    INTERNAL_ERROR(500, "internal server error");

    private final Integer code;
    private final String message;

    ResultCode(Integer code, String message) {
        this.code = code;
        this.message = message;
    }
}
