package com.micoz.promotion.service;

import com.micoz.common.response.PageResponse;
import com.micoz.promotion.dto.UserCouponItem;
import com.micoz.promotion.entity.Coupon;
import com.micoz.promotion.entity.UserCoupon;
import com.micoz.promotion.repository.CouponRepository;
import com.micoz.promotion.repository.UserCouponRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CouponQueryService {

    private final UserCouponRepository userCouponRepository;
    private final CouponRepository couponRepository;

    @Transactional(readOnly = true)
    public PageResponse<UserCouponItem> getMyCoupons(Long userSeq, String status, Pageable pageable) {
        Page<UserCoupon> page = (status == null || status.isBlank())
                ? userCouponRepository.findAllByUserSeqAndUseYn(userSeq, "Y", pageable)
                : userCouponRepository.findAllByUserSeqAndCouponStatusAndUseYn(userSeq, status, "Y", pageable);

        List<UserCoupon> userCoupons = page.getContent();
        if (userCoupons.isEmpty()) {
            return PageResponse.of(List.<UserCouponItem>of(), page);
        }

        List<Long> couponSeqs = userCoupons.stream().map(UserCoupon::getCouponSeq).distinct().toList();
        Map<Long, Coupon> couponById = couponRepository.findAllById(couponSeqs).stream()
                .collect(Collectors.toMap(Coupon::getCouponSeq, c -> c));

        List<UserCouponItem> items = userCoupons.stream().map(uc -> {
            Coupon c = couponById.get(uc.getCouponSeq());
            return UserCouponItem.builder()
                    .userCouponSeq(uc.getUserCouponSeq())
                    .couponSeq(uc.getCouponSeq())
                    .couponCode(c != null ? c.getCouponCode() : null)
                    .couponName(c != null ? c.getCouponName() : null)
                    .couponType(c != null ? c.getCouponType() : null)
                    .discountValue(c != null ? c.getDiscountValue() : null)
                    .minOrderAmount(c != null ? c.getMinOrderAmount() : null)
                    .maxDiscount(c != null ? c.getMaxDiscount() : null)
                    .description(c != null ? c.getDescription() : null)
                    .couponStatus(uc.getCouponStatus())
                    .issuedDate(uc.getIssuedDate())
                    .expireDate(uc.getExpireDate())
                    .usedDate(uc.getUsedDate())
                    .orderSeq(uc.getOrderSeq())
                    .build();
        }).toList();
        return PageResponse.of(items, page);
    }
}
