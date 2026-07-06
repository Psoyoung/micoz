package com.micoz.admin.dashboard.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 일별 매출 추이 한 점 (DA2, Q5·Q7). {@code date}는 KST 일자.
 * <b>{@code netSales}는 음수 가능</b> — 일별은 summary보다 큰 음수가 더 자주 나올 수 있다(특정일 환불 완료 몰림).
 * 클램프하지 않는다(프론트가 차트 축을 음수까지).
 */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SalesTrendPoint {

    private final LocalDate date;
    private final BigDecimal grossSales;
    private final BigDecimal netSales;
    private final long orderCount;
}
