package com.micoz.common.exception;

import com.micoz.common.response.ApiResponse;
import com.micoz.common.response.ErrorCode;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
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

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotReadable(HttpMessageNotReadableException ex) {
        // 파싱 불가/malformed 요청 바디 → 400 (기존엔 handleUnexpected로 떨어져 500이었음, S-3/빚 #7).
        // 원인 메시지는 로그로만(응답엔 일반 메시지 — 내부구조 비노출).
        log.warn("MalformedRequestBody: {}", ex.getMostSpecificCause().getMessage());
        return ResponseEntity.status(ErrorCode.COMMON_INVALID_REQUEST.getHttpStatus())
                .body(ApiResponse.error(ErrorCode.COMMON_INVALID_REQUEST));
    }

    @ExceptionHandler({MethodArgumentTypeMismatchException.class, MissingServletRequestParameterException.class})
    public ResponseEntity<ApiResponse<Void>> handleBadRequestParam(Exception ex) {
        // 경로변수/쿼리 타입 불일치(예: /orders/abc)·필수 파라미터 누락 → 클라이언트 요청 실수 → 400
        // (기존엔 handleUnexpected로 떨어져 500이었음, S-3 확장). 응답은 일반 메시지(내부구조 비노출).
        log.warn("BadRequestParameter: {}", ex.getMessage());
        return ResponseEntity.status(ErrorCode.COMMON_INVALID_REQUEST.getHttpStatus())
                .body(ApiResponse.error(ErrorCode.COMMON_INVALID_REQUEST));
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
