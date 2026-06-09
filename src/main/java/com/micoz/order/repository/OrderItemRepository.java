package com.micoz.order.repository;

import com.micoz.order.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    List<OrderItem> findAllByOrderSeq(Long orderSeq);

    List<OrderItem> findAllByOrderSeqIn(Collection<Long> orderSeqs);
}
