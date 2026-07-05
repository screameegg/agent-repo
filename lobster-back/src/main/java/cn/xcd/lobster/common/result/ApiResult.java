package cn.xcd.lobster.common.result;

import cn.xcd.lobster.common.enums.ResultCode;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Unified API response")
public class ApiResult<T> {

    @Schema(description = "Business status code", example = "200")
    private Integer code;

    @Schema(description = "Response message", example = "success")
    private String message;

    @Schema(description = "Response payload")
    private T data;

    public static <T> ApiResult<T> success(T data) {
        return new ApiResult<>(ResultCode.SUCCESS.getCode(), ResultCode.SUCCESS.getMessage(), data);
    }

    public static ApiResult<Void> success() {
        return success(null);
    }

    public static ApiResult<Void> fail(ResultCode resultCode) {
        return new ApiResult<>(resultCode.getCode(), resultCode.getMessage(), null);
    }

    public static ApiResult<Void> fail(Integer code, String message) {
        return new ApiResult<>(code, message, null);
    }
}
