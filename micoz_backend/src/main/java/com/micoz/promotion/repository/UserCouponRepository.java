package com.micoz.promotion.repository;

import com.micoz.promotion.entity.UserCoupon;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserCouponRepository extends JpaRepository<UserCoupon, Long> {

    Page<UserCoupon> findAllByUserSeqAndUseYn(Long userSeq, String useYn, Pageable pageable);

    Page<UserCoupon> findAllByUserSeqAndCouponStatusAndUseYn(Long userSeq, String couponStatus, String useYn, Pageable pageable);
}
