package com.micoz.order.calculator;

import com.micoz.settings.entity.ShippingSetting;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/**
 * NFR-11: 서버에서 금액 재계산 — 클라이언트 값 불신뢰.
 *
 * <pre>
 * itemsTotal     = Σ unitPrice × qty
 * totalDiscount  = couponDiscount + pointUsed
 * itemsAfterDis  = max(0, itemsTotal - totalDiscount)
 * shippingFee    = (itemsAfterDis ≥ freeShippingMin ? 0 : shippingFee_setting) + (isRemote ? remoteExtraFee : 0)
 * finalAmount    = itemsAfterDis + shippingFee
 * pointToEarn    = floor(itemsAfterDis × gradePointRate / 100)
 * </pre>
 */
@Component
public class OrderAmountCalculator {

    public OrderAmount calculate(List<OrderItemInput> items,
                                 ShippingSetting setting,
                                 boolean isRemote,
                                 BigDecimal couponDiscount,
                                 int pointUsed,
                                 BigDecimal gradePointRate) {
        BigDecimal itemsTotal = items.stream()
                .map(i -> i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal discount = nullToZero(couponDiscount).add(BigDecimal.valueOf(pointUsed));
        BigDecimal itemsAfterDis = itemsTotal.subtract(discount);
        if (itemsAfterDis.signum() < 0) itemsAfterDis = BigDecimal.ZERO;

        BigDecimal baseFee = (itemsAfterDis.compareTo(setting.getFreeShippingMin()) >= 0)
                ? BigDecimal.ZERO
                : setting.getShippingFee();
        BigDecimal remoteExtra = isRemote ? setting.getRemoteExtraFee() : BigDecimal.ZERO;
        BigDecimal shippingFee = baseFee.add(remoteExtra);

        BigDecimal finalAmount = itemsAfterDis.add(shippingFee);

        int pointToEarn = itemsAfterDis
                .multiply(nullToZero(gradePointRate))
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.FLOOR)
                .intValue();

        return new OrderAmount(itemsTotal, discount, shippingFee, finalAmount, pointToEarn);
    }

    private BigDecimal nullToZero(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }
}
