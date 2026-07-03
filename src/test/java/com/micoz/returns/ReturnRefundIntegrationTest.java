package com.micoz.returns;

import com.micoz.returns.service.ReturnRefundService;
import com.micoz.support.IntegrationTestSupport;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * R-T3 환불 확정 통합 — §5.3 두 불변식을 <b>여러 번 부분 반품 시퀀스</b>로 증명(오차 수렴) +
 * prior가 <b>완료(COMPLETED) 반품만</b> 세는지(반려분 제외) 검증. 금액 정밀 제어 위해 jdbc로 주문/반품 구성.
 */
class ReturnRefundIntegrationTest extends IntegrationTestSupport {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ReturnRefundService returnRefundService;

    @AfterEach
    void cleanup() {
        jdbcTemplate.update("DELETE FROM dat_return_item WHERE return_seq IN "
                + "(SELECT return_seq FROM dat_return WHERE return_no LIKE 'RFTN-%')");
        jdbcTemplate.update("DELETE FROM dat_return WHERE return_no LIKE 'RFTN-%'");
        jdbcTemplate.update("DELETE FROM dat_order_item WHERE order_seq IN "
                + "(SELECT order_seq FROM dat_order WHERE order_no LIKE 'RFT-%')");
        jdbcTemplate.update("DELETE FROM dat_order WHERE order_no LIKE 'RFT-%'");
        jdbcTemplate.update("DELETE FROM mst_user WHERE user_id LIKE 'rft%'");
    }

    @Test
    @DisplayName("여러 번 부분 반품(DEFECT): 각 회차 refund 누계 ≤ finalAmount, 전량 완료 시 정확히 finalAmount")
    void partialReturnSequenceConvergesToFinalAmount() {
        long userSeq = insertUser();
        // itemsTotal 30000(10000×3), 할인 9000(쿠폰5000+포인트4000), 배송 3000 → finalAmount 24000
        long orderSeq = insertOrder(userSeq, 9000, 4000, 5000, 3000, 24000);
        long i1 = insertOrderItem(orderSeq, 10000, 1);
        long i2 = insertOrderItem(orderSeq, 10000, 1);
        long i3 = insertOrderItem(orderSeq, 10000, 1);

        // 부분 반품 3회(각 1개), DEFECT(판매자귀책) → 전량 완료 시 원배송비도 환불
        BigDecimal r1 = completePartialReturn(orderSeq, userSeq, i1, 1, "DEFECT");
        assertThat(r1).as("1회차: net 7000(원배송비 미환불)").isEqualByComparingTo("7000");

        BigDecimal r2 = completePartialReturn(orderSeq, userSeq, i2, 1, "DEFECT");
        assertThat(r1.add(r2)).as("2회차 누계 ≤ finalAmount").isLessThanOrEqualTo(new BigDecimal("24000"));

        BigDecimal r3 = completePartialReturn(orderSeq, userSeq, i3, 1, "DEFECT");
        BigDecimal total = r1.add(r2).add(r3);
        assertThat(total).as("전량 완료 시 Σ환불 = finalAmount").isEqualByComparingTo("24000");
    }

    @Test
    @DisplayName("포인트 사용분 현금 제외: 전량 반품(단일, DEFECT) → refund_amount = finalAmount")
    void fullReturnRefundEqualsFinalAmount() {
        long userSeq = insertUser();
        long orderSeq = insertOrder(userSeq, 9000, 4000, 5000, 3000, 24000);
        long i1 = insertOrderItem(orderSeq, 30000, 1); // 전량 한 아이템

        BigDecimal refund = completePartialReturn(orderSeq, userSeq, i1, 1, "DEFECT");
        assertThat(refund).as("전량 현금 환불 = finalAmount(포인트분 제외)").isEqualByComparingTo("24000");
    }

    @Test
    @DisplayName("변심 회수비: CHANGE_OF_MIND 전량 RETURN → 독립 상수(3000) 차감, 원배송비 환불 없음")
    void changeOfMindReturnAppliesConstantReturnFee() {
        long userSeq = insertUser();
        // itemsTotal 30000, 할인 9000, 배송 3000 → finalAmount 24000
        long orderSeq = insertOrder(userSeq, 9000, 4000, 5000, 3000, 24000);
        long i1 = insertOrderItem(orderSeq, 30000, 1);

        // 변심 전량: net 21000, 원배송비 미환불, 회수비 3000 차감 → 18000 (출고비와 무관한 상수)
        BigDecimal refund = completePartialReturn(orderSeq, userSeq, i1, 1, "CHANGE_OF_MIND");
        assertThat(refund).as("변심 회수비 3000 차감").isEqualByComparingTo("18000");
    }

    @Test
    @DisplayName("prior는 완료분만: REJECTED 반품은 이전 gross로 세지 않는다")
    void rejectedReturnNotCountedAsPrior() {
        long userSeq = insertUser();
        // itemsTotal 20000, 할인 6000, 배송 3000 → finalAmount 17000
        long orderSeq = insertOrder(userSeq, 6000, 0, 6000, 3000, 17000);
        long i1 = insertOrderItem(orderSeq, 10000, 1);
        long i2 = insertOrderItem(orderSeq, 10000, 1);

        // i1에 대한 REJECTED 반품(반려) — prior로 세면 안 됨
        long rejected = insertReturn(orderSeq, userSeq, "RETURN", "DEFECT", "REJECTED");
        insertReturnItem(rejected, i1, 1);

        // i1 반품을 완료 → prior=0(REJECTED 제외)이어야: cum=10000(부분), net=10000−round(6000×10000/20000)=10000−3000=7000
        BigDecimal refund = completePartialReturn(orderSeq, userSeq, i1, 1, "DEFECT");
        assertThat(refund).as("REJECTED가 prior로 안 세짐 → 부분 반품 net 7000").isEqualByComparingTo("7000");
    }

    // ───────────────────────── helpers ─────────────────────────

    /** INSPECTED 반품을 만들어 finalizeRefund → refund_amount 반환(+ COMPLETED 확인). */
    private BigDecimal completePartialReturn(long orderSeq, long userSeq, long itemSeq, int qty, String reason) {
        long returnSeq = insertReturn(orderSeq, userSeq, "RETURN", reason, "INSPECTED");
        insertReturnItem(returnSeq, itemSeq, qty);
        BigDecimal refund = returnRefundService.finalizeRefund(returnSeq);
        assertThat(statusOf(returnSeq)).as("완료 전이").isEqualTo("COMPLETED");
        assertThat(refundAmountOf(returnSeq)).as("refund_amount 기록").isEqualByComparingTo(refund);
        return refund;
    }

    private long insertUser() {
        return jdbcTemplate.queryForObject(
                "INSERT INTO mst_user (user_id, user_pw, user_name, user_role, point_balance, user_status, use_yn, i_user) "
                        + "VALUES (?, 'x', '반품테스트', 'USER', 0, 'ACTIVE', 'Y', 'TEST') RETURNING user_seq",
                Long.class, "rft" + suffix());
    }

    private long insertOrder(long userSeq, int totalDiscount, int pointUsed, int couponDiscount,
                             int shippingFee, int finalAmount) {
        return jdbcTemplate.queryForObject(
                "INSERT INTO dat_order (order_no, user_seq, order_status, shipping_fee, coupon_discount, "
                        + "point_used, total_discount, final_amount, point_to_earn, order_date, i_user) "
                        + "VALUES (?, ?, 'DELIVERED', ?, ?, ?, ?, ?, 0, NOW(), 'TEST') RETURNING order_seq",
                Long.class, "RFT-" + suffix(), userSeq, shippingFee, couponDiscount, pointUsed,
                totalDiscount, finalAmount);
    }

    private long insertOrderItem(long orderSeq, int unitPrice, int qty) {
        return jdbcTemplate.queryForObject(
                "INSERT INTO dat_order_item (order_seq, product_seq, product_name, unit_price, quantity, "
                        + "item_amount, item_status, i_user) VALUES (?, 1, '반품상품', ?, ?, ?, 'NORMAL', 'TEST') "
                        + "RETURNING item_seq",
                Long.class, orderSeq, unitPrice, qty, unitPrice * qty);
    }

    private long insertReturn(long orderSeq, long userSeq, String type, String reason, String status) {
        return jdbcTemplate.queryForObject(
                "INSERT INTO dat_return (return_no, order_seq, user_seq, return_type, return_status, "
                        + "return_reason_type, requested_date, i_user) VALUES (?, ?, ?, ?, ?, ?, NOW(), 'TEST') "
                        + "RETURNING return_seq",
                Long.class, "RFTN-" + suffix(), orderSeq, userSeq, type, status, reason);
    }

    private void insertReturnItem(long returnSeq, long itemSeq, int qty) {
        jdbcTemplate.update(
                "INSERT INTO dat_return_item (return_seq, item_seq, quantity, use_yn, i_user) "
                        + "VALUES (?, ?, ?, 'Y', 'TEST')",
                returnSeq, itemSeq, qty);
    }

    private String statusOf(long returnSeq) {
        return jdbcTemplate.queryForObject(
                "SELECT return_status FROM dat_return WHERE return_seq = ?", String.class, returnSeq);
    }

    private BigDecimal refundAmountOf(long returnSeq) {
        return jdbcTemplate.queryForObject(
                "SELECT refund_amount FROM dat_return WHERE return_seq = ?", BigDecimal.class, returnSeq);
    }

    private String suffix() {
        String unique = String.valueOf(System.nanoTime());
        return unique.substring(unique.length() - 9);
    }
}
