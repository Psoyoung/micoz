package com.micoz.common.response;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // COMMON
    COMMON_VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "요청 값이 올바르지 않습니다."),
    COMMON_INVALID_REQUEST(HttpStatus.BAD_REQUEST, "잘못된 요청입니다."),
    COMMON_RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND, "리소스를 찾을 수 없습니다."),
    COMMON_METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "지원하지 않는 HTTP 메서드입니다."),
    COMMON_INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 내부 오류가 발생했습니다."),

    // AUTH (M1)
    AUTH_INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "아이디 또는 비밀번호가 올바르지 않습니다."),
    AUTH_TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "토큰이 만료되었습니다."),
    AUTH_TOKEN_INVALID(HttpStatus.UNAUTHORIZED, "유효하지 않은 토큰입니다."),
    AUTH_UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "인증이 필요합니다."),
    AUTH_FORBIDDEN(HttpStatus.FORBIDDEN, "접근 권한이 없습니다."),

    // USER (M1)
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."),
    USER_DUPLICATED_ID(HttpStatus.CONFLICT, "이미 사용 중인 아이디입니다."),
    USER_AGREEMENT_REQUIRED(HttpStatus.BAD_REQUEST, "필수 약관에 동의해야 합니다."),

    // PRODUCT (M2)
    PRODUCT_NOT_FOUND(HttpStatus.NOT_FOUND, "상품을 찾을 수 없습니다."),
    PRODUCT_SOLD_OUT(HttpStatus.CONFLICT, "품절된 상품입니다."),

    // CART (M3)
    CART_OPTION_REQUIRED(HttpStatus.BAD_REQUEST, "상품 옵션을 선택해주세요."),
    CART_ITEM_NOT_FOUND(HttpStatus.NOT_FOUND, "장바구니 항목을 찾을 수 없습니다."),

    // ORDER (M4)
    ORDER_NOT_FOUND(HttpStatus.NOT_FOUND, "주문을 찾을 수 없습니다."),
    ORDER_AMOUNT_MISMATCH(HttpStatus.BAD_REQUEST, "주문 금액이 일치하지 않습니다."),
    ORDER_INVALID_STATUS(HttpStatus.CONFLICT, "현재 주문 상태에서 처리할 수 없습니다."),

    // PAY (M4)
    PAY_APPROVAL_FAILED(HttpStatus.BAD_GATEWAY, "결제 승인에 실패했습니다."),

    // RETURN (M5)
    RETURN_PERIOD_EXPIRED(HttpStatus.CONFLICT, "반품 가능 기간이 만료되었습니다."),

    // COUPON / POINT (M6)
    COUPON_NOT_APPLICABLE(HttpStatus.BAD_REQUEST, "사용할 수 없는 쿠폰입니다."),
    POINT_INSUFFICIENT(HttpStatus.BAD_REQUEST, "보유 포인트가 부족합니다.");

    private final HttpStatus httpStatus;
    private final String defaultMessage;

    ErrorCode(HttpStatus httpStatus, String defaultMessage) {
        this.httpStatus = httpStatus;
        this.defaultMessage = defaultMessage;
    }
}
