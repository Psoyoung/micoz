package com.micoz.order.repository;

import com.micoz.order.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    List<OrderItem> findAllByOrderSeq(Long orderSeq);

    List<OrderItem> findAllByOrderSeqIn(Collection<Long> orderSeqs);

    /** 상품 하드삭제 가드(C-T5): 해당 상품을 참조하는 주문 상품(스냅샷)이 존재하는지. */
    boolean existsByProductSeq(Long productSeq);
}
