package com.micoz.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;

@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private static final String SUCCESS_CODE = "SUCCESS";
    private static final String SUCCESS_MESSAGE = "요청 처리 완료";

    private final String code;
    private final String message;
    private final T data;

    private ApiResponse(String code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(SUCCESS_CODE, SUCCESS_MESSAGE, data);
    }

    public static ApiResponse<Void> success() {
        return new ApiResponse<>(SUCCESS_CODE, SUCCESS_MESSAGE, null);
    }

    public static ApiResponse<Void> error(ErrorCode errorCode) {
        return new ApiResponse<>(errorCode.name(), errorCode.getDefaultMessage(), null);
    }

    public static ApiResponse<Void> error(ErrorCode errorCode, String message) {
        return new ApiResponse<>(errorCode.name(), message, null);
    }
}
