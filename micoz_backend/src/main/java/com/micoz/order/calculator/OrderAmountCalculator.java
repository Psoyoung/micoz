package com.micoz.order.calculator;

import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;
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
        // D2-ii fail-fast: 배송 3필드는 아래 산식에서 null-guard 없이 .compareTo()/.add()로 쓰인다.
        // V9 NOT NULL 제약으로 정상경로에선 도달 불가하나, 우회 진입(수동 DML 등) 시 조용한 오작동 대신
        // 명시적 실패시킨다(nullToZero 확장은 금지 — 배송비 조용히 0원 = 과금 사고, D2-iii).
        // ★ 삭제 금지: V9 NOT NULL은 mst_shipping "행"만 지킨다. 이 가드는 DB를 거치지 않는 경로
        //   (단위테스트 모킹·비-DB 소스로 조립된 setting)의 null을 막는 2차 방어선 — DB 제약과 중복 아님.
        if (setting.getShippingFee() == null
                || setting.getFreeShippingMin() == null
                || setting.getRemoteExtraFee() == null) {
            throw new BusinessException(ErrorCode.SHIPPING_SETTING_INVALID);
        }

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
