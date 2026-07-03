package com.micoz.returns.entity;

import com.micoz.common.entity.BaseEntity;
import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;
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
@Table(name = "dat_return")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Return extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "return_seq")
    private Long returnSeq;

    @Column(name = "return_no", nullable = false, length = 50)
    private String returnNo;

    @Column(name = "order_seq", nullable = false)
    private Long orderSeq;

    @Column(name = "user_seq", nullable = false)
    private Long userSeq;

    /** CANCEL / EXCHANGE / RETURN */
    @Column(name = "return_type", nullable = false, length = 20)
    private String returnType;

    /** REQUESTED / APPROVED / COLLECTED / INSPECTED / COMPLETED / REJECTED */
    @Column(name = "return_status", length = 20)
    private String returnStatus;

    /** CHANGE_OF_MIND / DEFECT / WRONG_DELIVERY / ETC */
    @Column(name = "return_reason_type", length = 30)
    private String returnReasonType;

    @Column(name = "return_reason", length = 500)
    private String returnReason;

    @Column(name = "return_shipping_fee", precision = 15, scale = 2)
    private BigDecimal returnShippingFee;

    @Column(name = "refund_amount", precision = 15, scale = 2)
    private BigDecimal refundAmount;

    @Column(name = "pickup_zip_code", length = 10)
    private String pickupZipCode;

    @Column(name = "pickup_address", length = 500)
    private String pickupAddress;

    @Column(name = "pickup_address_detail", length = 500)
    private String pickupAddressDetail;

    @Column(name = "pickup_phone", length = 20)
    private String pickupPhone;

    @Column(name = "requested_date")
    private OffsetDateTime requestedDate;

    @Column(name = "completed_date")
    private OffsetDateTime completedDate;

    @Builder
    private Return(String returnNo, Long orderSeq, Long userSeq, String returnType,
                   String returnStatus, String returnReasonType, String returnReason,
                   BigDecimal returnShippingFee, BigDecimal refundAmount,
                   String pickupZipCode, String pickupAddress, String pickupAddressDetail,
                   String pickupPhone, OffsetDateTime requestedDate) {
        this.returnNo = returnNo;
        this.orderSeq = orderSeq;
        this.userSeq = userSeq;
        this.returnType = returnType;
        this.returnStatus = returnStatus != null ? returnStatus : "REQUESTED";
        this.returnReasonType = returnReasonType;
        this.returnReason = returnReason;
        this.returnShippingFee = returnShippingFee != null ? returnShippingFee : BigDecimal.ZERO;
        this.refundAmount = refundAmount != null ? refundAmount : BigDecimal.ZERO;
        this.pickupZipCode = pickupZipCode;
        this.pickupAddress = pickupAddress;
        this.pickupAddressDetail = pickupAddressDetail;
        this.pickupPhone = pickupPhone;
        this.requestedDate = requestedDate != null ? requestedDate : OffsetDateTime.now();
    }

    /**
     * 상태 전이 단일 choke point (R-T2, RD1). {@link ReturnStatus} 전이표로 허용 여부를 검증하고
     * 위반이면 {@code RETURN_TRANSITION_INVALID}를 던진다. 모든 전이 경로(승인·회수·검수·완료·반려)가
     * 이 메서드를 거치므로 비허용 전이는 어떤 호출자로도 우회할 수 없다(O의 {@code Order.changeStatus} 동형).
     */
    public void changeStatus(ReturnStatus target) {
        ReturnStatus current = ReturnStatus.from(this.returnStatus);
        if (!current.canTransitionTo(target)) {
            throw new BusinessException(ErrorCode.RETURN_TRANSITION_INVALID);
        }
        this.returnStatus = target.name();
    }

    /** 완료: {@code changeStatus(COMPLETED)}(INSPECTED에서만 허용) 경유 + 완료일시 기록. */
    public void markCompleted(OffsetDateTime when) {
        changeStatus(ReturnStatus.COMPLETED);
        this.completedDate = when;
    }
}
