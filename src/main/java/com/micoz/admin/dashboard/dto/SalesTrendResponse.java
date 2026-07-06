package com.micoz.admin.dashboard.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * 일별 매출 추이 응답 (DA2). {@code points}는 기간 내 <b>모든 KST 일이 연속</b>(빈 날은 0으로 채움).
 */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SalesTrendResponse {

    private final List<SalesTrendPoint> points;
}
