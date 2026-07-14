package com.micoz.order.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequest {

    /** 주문에 포함할 카트 항목 */
    @NotEmpty
    private List<Long> cartSeqs;

    /** 저장된 배송지 사용 시 — 없으면 아래 신규 주소 필드 필수 */
    private Long addressSeq;

    /** 신규 입력 주소 */
    private String recipientName;
    private String recipientPhone;
    private String zipCode;
    private String address;
    private String addressDetail;
    private String shippingMemo;

    /** 도서산간 여부 */
    private Boolean isRemote;

    /** 클라이언트가 본 최종 금액 — 서버 재계산값과 일치해야 함 (NFR-11) */
    @NotNull
    private BigDecimal clientAmount;
}
