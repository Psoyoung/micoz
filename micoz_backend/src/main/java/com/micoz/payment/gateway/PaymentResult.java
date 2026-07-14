package com.micoz.payment.gateway;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class PaymentResult {
    private boolean success;
    private String approvalNo;
    private String pgTid;
    private String cardCompany;
    private String cardNoMasked;
    private String failureReason;
}
