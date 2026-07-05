package cn.xcd.lobster.common.exception;

import cn.dev33.satoken.exception.NotLoginException;
import cn.xcd.lobster.common.enums.ResultCode;
import cn.xcd.lobster.common.result.ApiResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ApiResult<Void> handleBusinessException(BusinessException exception) {
        return ApiResult.fail(exception.getCode(), exception.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ApiResult<Void> handleMethodArgumentNotValidException(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getField() + " " + error.getDefaultMessage())
                .orElse(ResultCode.PARAM_ERROR.getMessage());
        return ApiResult.fail(ResultCode.PARAM_ERROR.getCode(), message);
    }

    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    @ExceptionHandler(NotLoginException.class)
    public ApiResult<Void> handleNotLoginException(NotLoginException exception) {
        return ApiResult.fail(ResultCode.UNAUTHORIZED);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ApiResult<Void> handleMaxUploadSizeExceededException(MaxUploadSizeExceededException exception) {
        return ApiResult.fail(ResultCode.PARAM_ERROR.getCode(), "上传文件过大");
    }

    @ExceptionHandler(Exception.class)
    public ApiResult<Void> handleException(Exception exception) {
        log.error("Unhandled server exception", exception);
        return ApiResult.fail(ResultCode.INTERNAL_ERROR);
    }
}
