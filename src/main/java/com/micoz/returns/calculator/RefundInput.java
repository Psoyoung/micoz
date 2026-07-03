package com.micoz.returns.calculator;

import java.math.BigDecimal;

/**
 * 환불 산정 입력 (R-T3, §5.3). 금액은 주문 스냅샷에서, priorGross는 <b>이전 완료(COMPLETED) 반품</b>의 gross 합.
 *
 * @param itemsTotal                    주문 상품 총액(Σ orderItem.itemAmount)
 * @param totalDiscount                 주문 총 할인(쿠폰 + 포인트 사용분) — 이걸 통째 차감해 포인트 사용분이 현금에서 제외됨
 * @param orderShippingFee              주문 배송비(원배송비)
 * @param priorGross                    이 주문의 이전 완료 반품 gross 누계(반려분 제외)
 * @param thisGross                     이번 반품 gross(Σ unitPrice × 반품수량)
 * @param refundOriginalShippingOnFull  전량 반품 시 원배송비 환불 여부(서비스가 판정: CANCEL 또는 판매자귀책)
 * @param returnShippingFee             회수 배송비(변심계열 고객 부담; 서비스 정책, R-Q4)
 */
public record RefundInput(
        BigDecimal itemsTotal,
        BigDecimal totalDiscount,
        BigDecimal orderShippingFee,
        BigDecimal priorGross,
        BigDecimal thisGross,
        boolean refundOriginalShippingOnFull,
        BigDecimal returnShippingFee) {
}
