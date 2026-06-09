package com.micoz.order.repository;

import com.micoz.order.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    boolean existsByOrderNo(String orderNo);

    Optional<Order> findByOrderSeqAndUserSeq(Long orderSeq, Long userSeq);

    Page<Order> findAllByUserSeq(Long userSeq, Pageable pageable);
}
