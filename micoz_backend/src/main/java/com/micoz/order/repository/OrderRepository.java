package com.micoz.order.repository;

import com.micoz.order.entity.Order;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {

    boolean existsByOrderNo(String orderNo);

    Optional<Order> findByOrderSeqAndUserSeq(Long orderSeq, Long userSeq);

    Page<Order> findAllByUserSeq(Long userSeq, Pageable pageable);

    /**
     * 주문 행 비관적 쓰기 잠금(SELECT ... FOR UPDATE). 반품 신청·완료를 <b>주문 단위로 직렬화</b>하기 위한
     * 단일 choke point — 같은 주문의 동시 반품 신청(수량검증 TOCTOU)·동시 완료(prior 이중계상)를 막는다(빚 #2).
     * 트랜잭션 종료 시 해제된다. 항상 이 메서드로 주문 행을 최초 잠금해 락 순서를 일관되게 유지한다.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM Order o WHERE o.orderSeq = :orderSeq")
    Optional<Order> findByOrderSeqForUpdate(@Param("orderSeq") Long orderSeq);
}
