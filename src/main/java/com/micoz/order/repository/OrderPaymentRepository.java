package com.micoz.order.repository;

import com.micoz.order.entity.OrderPayment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrderPaymentRepository extends JpaRepository<OrderPayment, Long> {

    Optional<OrderPayment> findByOrderSeq(Long orderSeq);

    List<OrderPayment> findAllByOrderSeq(Long orderSeq);

    Optional<OrderPayment> findFirstByOrderSeqAndPaymentStatus(Long orderSeq, String paymentStatus);
}
