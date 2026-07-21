package com.micoz.returns;

import com.micoz.common.exception.BusinessException;
import com.micoz.returns.dto.CreateReturnRequest;
import com.micoz.returns.dto.ReturnItemInput;
import com.micoz.returns.service.ReturnRefundService;
import com.micoz.returns.service.ReturnService;
import com.micoz.support.IntegrationTestSupport;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 빚 #2 재현 — 같은 주문에 반품을 <b>동시 신청</b>하면 {@link ReturnService#create}의 수량 검증
 * (이미 반품된 수량 합 ≤ 주문 수량)이 락 없이 읽히므로 TOCTOU로 우회된다. 두 트랜잭션이 서로의
 * 미커밋 반품을 못 봐서 각자 통과 → 주문 수량을 초과하는 반품이 생성되고, 완료 시 Σrefund가
 * finalAmount를 초과한다(고객 과다 환불). 동시성은 간헐적이라 여러 회차 반복으로 race를 유도한다.
 *
 * <p>수정 전: race 회차에서 Σrefund &gt; finalAmount → 단언 실패(red).
 * 수정 후(주문 행 비관적 락으로 create 직렬화): race 미발생 → 초과 단언에 도달하지 않음(green).
 */
class ReturnConcurrencyIntegrationTest extends IntegrationTestSupport {

    private static final int ATTEMPTS = 50;
    private static final int FINAL_AMOUNT = 13000; // itemsTotal 10000 - 할인 0 + 배송 3000

    @Autowired
    private JdbcTemplate jdbcTemplate;
    @Autowired
    private ReturnService returnService;
    @Autowired
    private ReturnRefundService returnRefundService;

    @AfterEach
    void cleanup() {
        jdbcTemplate.update("DELETE FROM dat_return_item WHERE return_seq IN "
                + "(SELECT return_seq FROM dat_return WHERE return_no LIKE 'RCLK-%')");
        jdbcTemplate.update("DELETE FROM dat_return WHERE order_seq IN "
                + "(SELECT order_seq FROM dat_order WHERE order_no LIKE 'RCLK-%')");
        jdbcTemplate.update("DELETE FROM dat_order_item WHERE order_seq IN "
                + "(SELECT order_seq FROM dat_order WHERE order_no LIKE 'RCLK-%')");
        jdbcTemplate.update("DELETE FROM dat_order WHERE order_no LIKE 'RCLK-%'");
        jdbcTemplate.update("DELETE FROM mst_user WHERE user_id LIKE 'rclk%'");
    }

    @Test
    @DisplayName("빚 #2 재현: 같은 주문 동시 반품 신청 → 수량검증 TOCTOU 우회 → 초과 반품 → Σrefund > finalAmount")
    void concurrentCreateBypassesQuantityCheckAndOverRefunds() throws Exception {
        int raceCount = 0;
        for (int i = 0; i < ATTEMPTS; i++) {
            long userSeq = insertUser();
            long orderSeq = insertPaidOrder(userSeq);
            long itemSeq = insertOrderItem(orderSeq, 10000, 1); // 주문 수량 1

            int created = concurrentCreate(userSeq, orderSeq, itemSeq);

            if (created >= 2) {
                // race 재현 — 주문 수량 1에 반품 2건(각 1개, 합 2 > 1)이 생성됨.
                raceCount++;
                BigDecimal sumRefund = completeAllAndSumRefund(orderSeq);
                assertThat(sumRefund)
                        .as("동시 신청 우회 → 초과 환불(회차 %s): Σrefund=%s > finalAmount=%s",
                                i, sumRefund, FINAL_AMOUNT)
                        .isLessThanOrEqualTo(new BigDecimal(FINAL_AMOUNT));
            }
        }
        // 수정 후에는 race가 발생하지 않아 위 초과 단언에 도달하지 않는다(락이 create를 직렬화).
        // 수정 전에는 raceCount>0 회차에서 이미 단언이 실패해 여기 도달하지 못한다.
        System.out.println("[ReturnConcurrency] race 재현 회차 수 = " + raceCount + "/" + ATTEMPTS);
    }

    /** 두 스레드가 배리어 후 동시에 같은 주문에 전량 CANCEL 반품 신청. 성공한 create 수 반환. */
    private int concurrentCreate(long userSeq, long orderSeq, long itemSeq) throws Exception {
        CyclicBarrier barrier = new CyclicBarrier(2);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            Callable<Boolean> task = () -> {
                CreateReturnRequest req = new CreateReturnRequest();
                req.setReturnType("CANCEL");
                req.setReturnReasonType("CHANGE_OF_MIND");
                req.setItems(List.of(new ReturnItemInput(itemSeq, 1, null)));
                try {
                    barrier.await();
                    returnService.create(userSeq, orderSeq, req);
                    return true;
                } catch (BusinessException e) {
                    return false; // RETURN_QUANTITY_EXCEEDED 등 — 직렬화되면 둘 중 하나가 여기로
                }
            };
            Future<Boolean> f1 = pool.submit(task);
            Future<Boolean> f2 = pool.submit(task);
            return (f1.get() ? 1 : 0) + (f2.get() ? 1 : 0);
        } finally {
            pool.shutdownNow();
        }
    }

    /** 주문의 전 반품을 INSPECTED로 만든 뒤 finalizeRefund → Σrefund_amount. */
    private BigDecimal completeAllAndSumRefund(long orderSeq) {
        List<Long> returnSeqs = jdbcTemplate.queryForList(
                "SELECT return_seq FROM dat_return WHERE order_seq = ? ORDER BY return_seq",
                Long.class, orderSeq);
        BigDecimal sum = BigDecimal.ZERO;
        for (Long rs : returnSeqs) {
            jdbcTemplate.update("UPDATE dat_return SET return_status = 'INSPECTED' WHERE return_seq = ?", rs);
            sum = sum.add(returnRefundService.finalizeRefund(rs));
        }
        return sum;
    }

    private long insertUser() {
        return jdbcTemplate.queryForObject(
                "INSERT INTO mst_user (user_id, user_pw, user_name, user_role, point_balance, user_status, use_yn, i_user) "
                        + "VALUES (?, 'x', '동시성테스트', 'USER', 0, 'ACTIVE', 'Y', 'TEST') RETURNING user_seq",
                Long.class, "rclk" + suffix());
    }

    /** CANCEL 가능 상태(PAID). 할인 0·배송 3000 → finalAmount 13000. */
    private long insertPaidOrder(long userSeq) {
        return jdbcTemplate.queryForObject(
                "INSERT INTO dat_order (order_no, user_seq, order_status, shipping_fee, coupon_discount, "
                        + "point_used, total_discount, final_amount, point_to_earn, order_date, i_user) "
                        + "VALUES (?, ?, 'PAID', 3000, 0, 0, 0, ?, 0, NOW(), 'TEST') RETURNING order_seq",
                Long.class, "RCLK-" + suffix(), userSeq, FINAL_AMOUNT);
    }

    private long insertOrderItem(long orderSeq, int unitPrice, int qty) {
        return jdbcTemplate.queryForObject(
                "INSERT INTO dat_order_item (order_seq, product_seq, product_name, unit_price, quantity, "
                        + "item_amount, item_status, i_user) VALUES (?, 1, '반품상품', ?, ?, ?, 'NORMAL', 'TEST') "
                        + "RETURNING item_seq",
                Long.class, orderSeq, unitPrice, qty, unitPrice * qty);
    }

    private String suffix() {
        String unique = String.valueOf(System.nanoTime());
        return unique.substring(unique.length() - 9);
    }
}
