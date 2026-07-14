package com.micoz.cart.repository;

import com.micoz.cart.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CartRepository extends JpaRepository<Cart, Long> {

    List<Cart> findAllByUserSeq(Long userSeq);

    /**
     * 동일 (user, product, option) 행 조회.
     * Spring Data 파생 쿼리는 optionSeq=null 입력 시 'IS NULL' 자동 생성.
     */
    Optional<Cart> findByUserSeqAndProductSeqAndOptionSeq(Long userSeq, Long productSeq, Long optionSeq);

    Optional<Cart> findByCartSeqAndUserSeq(Long cartSeq, Long userSeq);

    List<Cart> findAllByCartSeqInAndUserSeq(Collection<Long> cartSeqs, Long userSeq);
}
