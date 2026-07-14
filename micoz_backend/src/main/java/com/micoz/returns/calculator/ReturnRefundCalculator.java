package com.micoz.returns.calculator;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * 환불 금액 산정기 (R-T3, §5.3) — R 고유 <b>누적 반올림 불변식</b> + <b>포인트 사용분 현금 제외</b>.
 *
 * <p><b>누적 안분(핵심 불변식)</b>: 이번 반품의 할인 안분을 개별이 아니라 누적 gross로 계산하고 이전 누계를 뺀다.
 * {@code thisDiscountAlloc = round(TD × cumGross/itemsTotal) − round(TD × priorGross/itemsTotal)}.
 * 전량 반품(cumGross=itemsTotal)이면 누적 안분 = totalDiscount 정확 → 부분 반품을 여러 번 해도
 * Σ 환불 ≤ finalAmount, 전량 소진 시 정확히 일치(반올림 누적 오차 원천 차단). O 계산기엔 없던 R 고유 문제.
 *
 * <p><b>포인트 사용분 현금 제외</b>: totalDiscount = 쿠폰 + 포인트사용분. netProduct에서 이를 통째 차감하므로
 * 포인트로 낸 부분은 현금 환불(refundAmount)에서 자동 제외된다(전량 시 refundAmount = finalAmount 성립,
 * 판매자귀책/CANCEL 기준). 포인트 원장 환원은 이번 범위 밖(빚).
 */
@Component
public class ReturnRefundCalculator {

    public RefundResult calculate(RefundInput in) {
        BigDecimal itemsTotal = nz(in.itemsTotal());
        BigDecimal totalDiscount = nz(in.totalDiscount());
        BigDecimal priorGross = nz(in.priorGross());
        BigDecimal thisGross = nz(in.thisGross());
        BigDecimal cumGross = priorGross.add(thisGross);

        // 누적 안분 − 이전 누계 안분 = 이번 몫. 반올림 잔차가 마지막(전량) 반품에서 정확히 소진된다.
        BigDecimal thisDiscountAlloc = allocate(totalDiscount, cumGross, itemsTotal)
                .subtract(allocate(totalDiscount, priorGross, itemsTotal));

        // 현금 상품 환불 — totalDiscount(쿠폰+포인트) 통째 차감 → 포인트 사용분 현금 제외.
        BigDecimal netProduct = thisGross.subtract(thisDiscountAlloc);

        // 원배송비 환불: 전량 반품(이번으로 소진) + 서비스 판정(CANCEL 또는 판매자귀책)일 때만.
        boolean fullReturn = cumGross.compareTo(itemsTotal) >= 0;
        BigDecimal shippingRefund = (fullReturn && in.refundOriginalShippingOnFull())
                ? nz(in.orderShippingFee()) : BigDecimal.ZERO;

        BigDecimal returnShippingFee = nz(in.returnShippingFee());
        BigDecimal refund = netProduct.add(shippingRefund).subtract(returnShippingFee);
        if (refund.signum() < 0) refund = BigDecimal.ZERO; // 회수비가 커도 음수 환불 없음

        return new RefundResult(thisDiscountAlloc, netProduct, shippingRefund, returnShippingFee, refund, fullReturn);
    }

    /** round(totalDiscount × gross / itemsTotal), scale 2 HALF_UP. itemsTotal=0이면 0. */
    private BigDecimal allocate(BigDecimal totalDiscount, BigDecimal gross, BigDecimal itemsTotal) {
        if (itemsTotal.signum() == 0) {
            return BigDecimal.ZERO;
        }
        return totalDiscount.multiply(gross).divide(itemsTotal, 2, RoundingMode.HALF_UP);
    }

    private BigDecimal nz(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }
}
