package com.micoz.common.exception;

import com.micoz.common.response.ApiResponse;
import com.micoz.common.response.ErrorCode;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.NoHandlerFoundException;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusiness(BusinessException ex) {
        ErrorCode code = ex.getErrorCode();
        log.warn("BusinessException: code={}, message={}", code.name(), ex.getMessage());
        return ResponseEntity.status(code.getHttpStatus())
                .body(ApiResponse.error(code, ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .orElse(ErrorCode.COMMON_VALIDATION_ERROR.getDefaultMessage());
        log.warn("ValidationException: {}", message);
        return ResponseEntity.status(ErrorCode.COMMON_VALIDATION_ERROR.getHttpStatus())
                .body(ApiResponse.error(ErrorCode.COMMON_VALIDATION_ERROR, message));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleConstraintViolation(ConstraintViolationException ex) {
        log.warn("ConstraintViolation: {}", ex.getMessage());
        return ResponseEntity.status(ErrorCode.COMMON_VALIDATION_ERROR.getHttpStatus())
                .body(ApiResponse.error(ErrorCode.COMMON_VALIDATION_ERROR));
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<Void>> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        log.warn("MethodNotAllowed: {}", ex.getMessage());
        return ResponseEntity.status(ErrorCode.COMMON_METHOD_NOT_ALLOWED.getHttpStatus())
                .body(ApiResponse.error(ErrorCode.COMMON_METHOD_NOT_ALLOWED));
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(NoHandlerFoundException ex) {
        log.warn("NoHandlerFound: {}", ex.getRequestURL());
        return ResponseEntity.status(ErrorCode.COMMON_RESOURCE_NOT_FOUND.getHttpStatus())
                .body(ApiResponse.error(ErrorCode.COMMON_RESOURCE_NOT_FOUND));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnexpected(Exception ex) {
        log.error("Unexpected exception", ex);
        return ResponseEntity.status(ErrorCode.COMMON_INTERNAL_ERROR.getHttpStatus())
                .body(ApiResponse.error(ErrorCode.COMMON_INTERNAL_ERROR));
    }
}
