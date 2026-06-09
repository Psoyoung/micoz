package com.micoz.order.entity;

import com.micoz.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "dat_order_payment")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OrderPayment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payment_seq")
    private Long paymentSeq;

    @Column(name = "order_seq", nullable = false)
    private Long orderSeq;

    @Column(name = "payment_type", nullable = false, length = 20)
    private String paymentType;

    @Column(name = "payment_status", length = 20)
    private String paymentStatus;

    @Column(name = "paid_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal paidAmount;

    @Column(name = "card_company", length = 50)
    private String cardCompany;

    @Column(name = "card_no_masked", length = 30)
    private String cardNoMasked;

    @Column(name = "installment")
    private Integer installment;

    @Column(name = "approval_no", length = 50)
    private String approvalNo;

    @Column(name = "pg_tid", length = 100)
    private String pgTid;

    @Column(name = "paid_date")
    private OffsetDateTime paidDate;

    @Column(name = "canceled_date")
    private OffsetDateTime canceledDate;

    @Builder
    private OrderPayment(Long orderSeq, String paymentType, String paymentStatus,
                         BigDecimal paidAmount, String cardCompany, String cardNoMasked,
                         Integer installment, String approvalNo, String pgTid,
                         OffsetDateTime paidDate) {
        this.orderSeq = orderSeq;
        this.paymentType = paymentType;
        this.paymentStatus = paymentStatus != null ? paymentStatus : "PENDING";
        this.paidAmount = paidAmount;
        this.cardCompany = cardCompany;
        this.cardNoMasked = cardNoMasked;
        this.installment = installment != null ? installment : 0;
        this.approvalNo = approvalNo;
        this.pgTid = pgTid;
        this.paidDate = paidDate;
    }

    public void markPaid(String approvalNo, String pgTid, OffsetDateTime when) {
        this.paymentStatus = "PAID";
        this.approvalNo = approvalNo;
        this.pgTid = pgTid;
        this.paidDate = when;
    }

    public void markCanceled(OffsetDateTime when) {
        this.paymentStatus = "CANCELED";
        this.canceledDate = when;
    }
}
