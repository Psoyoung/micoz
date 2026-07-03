package com.micoz.returns.calculator;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * R-T3 환불 계산기 순수 단위 — §5.3 두 불변식을 합성 시퀀스(여러 번 부분 반품)로 증명한다.
 */
class ReturnRefundCalculatorTest {

    private final ReturnRefundCalculator calc = new ReturnRefundCalculator();

    /** DEFECT(판매자귀책) 부분 반품: 원배송비 전량 시 환불, 회수비 0. */
    private RefundInput seq(BigDecimal itemsTotal, BigDecimal totalDiscount, BigDecimal shippingFee,
                            BigDecimal priorGross, BigDecimal thisGross) {
        return new RefundInput(itemsTotal, totalDiscount, shippingFee, priorGross, thisGross,
                true, BigDecimal.ZERO);
    }

    @Test
    @DisplayName("누적 수렴: 부분 반품 3회 → Σ환불 ≤ finalAmount, 전량 완료 시 정확히 finalAmount")
    void cumulativeConvergence() {
        BigDecimal itemsTotal = new BigDecimal("30000");
        BigDecimal totalDiscount = new BigDecimal("9000");
        BigDecimal shippingFee = new BigDecimal("3000");
        BigDecimal finalAmount = itemsTotal.subtract(totalDiscount).add(shippingFee); // 24000

        BigDecimal g = new BigDecimal("10000");
        RefundResult r1 = calc.calculate(seq(itemsTotal, totalDiscount, shippingFee, BigDecimal.ZERO, g));
        RefundResult r2 = calc.calculate(seq(itemsTotal, totalDiscount, shippingFee, g, g));
        RefundResult r3 = calc.calculate(seq(itemsTotal, totalDiscount, shippingFee, g.multiply(BigDecimal.valueOf(2)), g));

        // 각 단계 누계 ≤ finalAmount
        assertThat(r1.refundAmount()).isEqualByComparingTo("7000");
        assertThat(r1.refundAmount().add(r2.refundAmount())).isEqualByComparingTo("14000")
                .isLessThanOrEqualTo(finalAmount);
        BigDecimal total = r1.refundAmount().add(r2.refundAmount()).add(r3.refundAmount());
        assertThat(total).as("전량 완료 시 Σ환불 = finalAmount").isEqualByComparingTo(finalAmount);
        assertThat(r3.fullReturn()).isTrue();
    }

    @Test
    @DisplayName("반올림 잔차: 나누어떨어지지 않는 할인도 Σ 안분 = totalDiscount 정확(잔차 0)")
    void roundingResidueConvergesToZero() {
        BigDecimal itemsTotal = new BigDecimal("30000");
        BigDecimal totalDiscount = new BigDecimal("10000"); // /3 = 3333.33...
        BigDecimal shippingFee = new BigDecimal("3000");
        BigDecimal g = new BigDecimal("10000");

        RefundResult r1 = calc.calculate(seq(itemsTotal, totalDiscount, shippingFee, BigDecimal.ZERO, g));
        RefundResult r2 = calc.calculate(seq(itemsTotal, totalDiscount, shippingFee, g, g));
        RefundResult r3 = calc.calculate(seq(itemsTotal, totalDiscount, shippingFee, new BigDecimal("20000"), g));

        BigDecimal allocSum = r1.thisDiscountAlloc().add(r2.thisDiscountAlloc()).add(r3.thisDiscountAlloc());
        assertThat(allocSum).as("Σ 할인 안분 = totalDiscount 정확").isEqualByComparingTo(totalDiscount);
        BigDecimal netSum = r1.netProduct().add(r2.netProduct()).add(r3.netProduct());
        assertThat(netSum).as("Σ 상품 순환불 = itemsTotal − totalDiscount").isEqualByComparingTo("20000");
    }

    @Test
    @DisplayName("포인트 사용분 현금 제외: 전량 반품(판매자귀책) → refundAmount = finalAmount")
    void pointUsedExcludedFromCash() {
        // totalDiscount 9000 = 쿠폰 5000 + 포인트 4000. 포인트분은 현금 환불에 안 섞여야.
        BigDecimal itemsTotal = new BigDecimal("30000");
        BigDecimal totalDiscount = new BigDecimal("9000");
        BigDecimal shippingFee = new BigDecimal("3000");
        BigDecimal finalAmount = new BigDecimal("24000");

        RefundResult full = calc.calculate(seq(itemsTotal, totalDiscount, shippingFee, BigDecimal.ZERO, itemsTotal));
        assertThat(full.refundAmount()).as("전량 현금 환불 = finalAmount(카드 결제분, 포인트분 제외)")
                .isEqualByComparingTo(finalAmount);
        assertThat(full.netProduct()).isEqualByComparingTo("21000"); // 30000 − 9000
    }

    @Test
    @DisplayName("변심 회수비: refundOriginalShipping=false + returnShippingFee 차감 → finalAmount 미만")
    void changeOfMindShippingBorneByCustomer() {
        BigDecimal itemsTotal = new BigDecimal("30000");
        BigDecimal totalDiscount = new BigDecimal("9000");
        BigDecimal shippingFee = new BigDecimal("3000");
        RefundInput in = new RefundInput(itemsTotal, totalDiscount, shippingFee,
                BigDecimal.ZERO, itemsTotal, false, new BigDecimal("3000")); // 변심 전량

        RefundResult r = calc.calculate(in);
        // net 21000, 원배송비 환불 없음, 회수비 3000 차감 → 18000 (< finalAmount 24000)
        assertThat(r.refundAmount()).isEqualByComparingTo("18000");
        assertThat(r.shippingRefund()).isEqualByComparingTo("0");
    }

    @Test
    @DisplayName("음수 방지: 회수비가 순환불보다 커도 refundAmount ≥ 0")
    void refundNeverNegative() {
        RefundInput in = new RefundInput(new BigDecimal("10000"), BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, new BigDecimal("1000"), false, new BigDecimal("5000"));
        assertThat(calc.calculate(in).refundAmount()).isEqualByComparingTo("0");
    }
}
