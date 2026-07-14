package com.micoz.order.calculator;

import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;
import com.micoz.settings.entity.ShippingSetting;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class OrderAmountCalculatorTest {

    private final OrderAmountCalculator calc = new OrderAmountCalculator();
    private ShippingSetting setting;

    @BeforeEach
    void setUp() throws Exception {
        Constructor<ShippingSetting> ctor = ShippingSetting.class.getDeclaredConstructor();
        ctor.setAccessible(true);
        setting = ctor.newInstance();
        setField("shippingFee", new BigDecimal("3000"));
        setField("freeShippingMin", new BigDecimal("50000"));
        setField("remoteExtraFee", new BigDecimal("3000"));
    }

    private void setField(String name, Object value) throws Exception {
        Field f = ShippingSetting.class.getDeclaredField(name);
        f.setAccessible(true);
        f.set(setting, value);
    }

    @Test
    @DisplayName("무료배송 미달: 배송비 3000 부과")
    void belowFreeShippingMin() {
        OrderAmount a = calc.calculate(
                List.of(new OrderItemInput(1L, 1L, new BigDecimal("28000"), 1)),
                setting, false, BigDecimal.ZERO, 0, BigDecimal.ZERO);
        assertThat(a.getItemsTotal()).isEqualByComparingTo("28000");
        assertThat(a.getShippingFee()).isEqualByComparingTo("3000");
        assertThat(a.getFinalAmount()).isEqualByComparingTo("31000");
    }

    @Test
    @DisplayName("무료배송 도달(>=50000): 배송비 0")
    void atFreeShippingMin() {
        OrderAmount a = calc.calculate(
                List.of(new OrderItemInput(1L, 1L, new BigDecimal("28000"), 2)),
                setting, false, BigDecimal.ZERO, 0, BigDecimal.ZERO);
        assertThat(a.getItemsTotal()).isEqualByComparingTo("56000");
        assertThat(a.getShippingFee()).isEqualByComparingTo("0");
        assertThat(a.getFinalAmount()).isEqualByComparingTo("56000");
    }

    @Test
    @DisplayName("도서산간: 배송비 + remoteExtraFee")
    void remoteArea() {
        OrderAmount a = calc.calculate(
                List.of(new OrderItemInput(1L, 1L, new BigDecimal("28000"), 1)),
                setting, true, BigDecimal.ZERO, 0, BigDecimal.ZERO);
        assertThat(a.getShippingFee()).isEqualByComparingTo("6000"); // 3000 + 3000
        assertThat(a.getFinalAmount()).isEqualByComparingTo("34000");
    }

    @Test
    @DisplayName("쿠폰/포인트로 음수 방지: finalAmount=배송비만")
    void negativeProtection() {
        OrderAmount a = calc.calculate(
                List.of(new OrderItemInput(1L, 1L, new BigDecimal("10000"), 1)),
                setting, false, new BigDecimal("5000"), 99999, BigDecimal.ZERO);
        // itemsAfterDis = max(0, 10000 - 5000 - 99999) = 0
        // shippingFee = 3000 (무료배송 기준 미달)
        // finalAmount = 0 + 3000
        assertThat(a.getTotalDiscount()).isEqualByComparingTo("104999");
        assertThat(a.getShippingFee()).isEqualByComparingTo("3000");
        assertThat(a.getFinalAmount()).isEqualByComparingTo("3000");
    }

    @Test
    @DisplayName("적립률: 100000 × 5% = 5000")
    void pointToEarn() {
        OrderAmount a = calc.calculate(
                List.of(new OrderItemInput(1L, 1L, new BigDecimal("100000"), 1)),
                setting, false, BigDecimal.ZERO, 0, new BigDecimal("5"));
        assertThat(a.getPointToEarn()).isEqualTo(5000);
    }

    // ---- O-T1 (D2-ii): 배송 3필드 null 시 fail-fast (nullToZero로 삼키지 않음) ----

    @Test
    @DisplayName("fail-fast: shippingFee=null → SHIPPING_SETTING_INVALID")
    void nullShippingFeeFailsFast() throws Exception {
        setField("shippingFee", null);
        assertThatThrownBy(() -> calc.calculate(
                List.of(new OrderItemInput(1L, 1L, new BigDecimal("28000"), 1)),
                setting, false, BigDecimal.ZERO, 0, BigDecimal.ZERO))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.SHIPPING_SETTING_INVALID);
    }

    @Test
    @DisplayName("fail-fast: freeShippingMin=null → SHIPPING_SETTING_INVALID")
    void nullFreeShippingMinFailsFast() throws Exception {
        setField("freeShippingMin", null);
        assertThatThrownBy(() -> calc.calculate(
                List.of(new OrderItemInput(1L, 1L, new BigDecimal("28000"), 1)),
                setting, false, BigDecimal.ZERO, 0, BigDecimal.ZERO))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.SHIPPING_SETTING_INVALID);
    }

    @Test
    @DisplayName("fail-fast: remoteExtraFee=null → SHIPPING_SETTING_INVALID")
    void nullRemoteExtraFeeFailsFast() throws Exception {
        setField("remoteExtraFee", null);
        assertThatThrownBy(() -> calc.calculate(
                List.of(new OrderItemInput(1L, 1L, new BigDecimal("28000"), 1)),
                setting, false, BigDecimal.ZERO, 0, BigDecimal.ZERO))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.SHIPPING_SETTING_INVALID);
    }
}
