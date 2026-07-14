package com.micoz.returns.calculator;

import java.math.BigDecimal;

/**
 * 환불 산정 결과 (R-T3). {@code refundAmount}가 현금 환불액(Mock PG 대상), {@code returnShippingFee}는 기록용.
 *
 * @param thisDiscountAlloc  이번 반품에 안분된 할인(누적 안분 − 이전 누계 안분)
 * @param netProduct         현금 상품 환불(thisGross − thisDiscountAlloc; 포인트 사용분 제외됨)
 * @param shippingRefund     원배송비 환불(전량 + 조건 충족 시)
 * @param returnShippingFee  회수 배송비(고객 부담분 차감액)
 * @param refundAmount       최종 현금 환불액(음수 방지 클램프)
 * @param fullReturn         이번 반품으로 주문이 전량 소진됐는지
 */
public record RefundResult(
        BigDecimal thisDiscountAlloc,
        BigDecimal netProduct,
        BigDecimal shippingRefund,
        BigDecimal returnShippingFee,
        BigDecimal refundAmount,
        boolean fullReturn) {
}
