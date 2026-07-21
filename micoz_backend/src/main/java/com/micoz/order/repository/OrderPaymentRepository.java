package com.micoz.order.repository;

import com.micoz.order.entity.OrderPayment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface OrderPaymentRepository extends JpaRepository<OrderPayment, Long> {

    Optional<OrderPayment> findByOrderSeq(Long orderSeq);

    List<OrderPayment> findAllByOrderSeq(Long orderSeq);

    Optional<OrderPayment> findFirstByOrderSeqAndPaymentStatus(Long orderSeq, String paymentStatus);

    /**
     * 주문의 <b>성사된 결제행</b>을 상태 무관하게 조회(주문 상세 표시용).
     * 한 주문에 결제 재시도로 버려진 {@code FAILED}/{@code CANCELED} 행이 잔존할 수 있고
     * (PaymentService.pay가 noRollbackFor), 성공행은 결제 후 환불 시 {@code PAID}→{@code REFUNDED}로 전이된다.
     * {@code {PAID, REFUNDED}} 중 최신 1건을 집어 실패행을 배제하고 다중행에서도 예외 없이 대표행을 반환한다.
     */
    Optional<OrderPayment> findFirstByOrderSeqAndPaymentStatusInOrderByPaymentSeqDesc(
            Long orderSeq, Collection<String> paymentStatuses);
}
