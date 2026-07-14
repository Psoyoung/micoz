package com.micoz.order.repository;

import com.micoz.order.entity.OrderShipping;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OrderShippingRepository extends JpaRepository<OrderShipping, Long> {

    Optional<OrderShipping> findByOrderSeq(Long orderSeq);
}
