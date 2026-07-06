package com.micoz.inquiry.entity;

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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;

@Entity
@Table(name = "dat_inquiry")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Inquiry extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "inquiry_seq")
    private Long inquirySeq;

    @Column(name = "inquiry_no", nullable = false, length = 50)
    private String inquiryNo;

    @Column(name = "user_seq", nullable = false)
    private Long userSeq;

    /** PRODUCT / ORDER / DELIVERY / RETURN / ETC */
    @Column(name = "inquiry_type", nullable = false, length = 30)
    private String inquiryType;

    @Column(name = "title", nullable = false, length = 100)
    private String title;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "product_seq")
    private Long productSeq;

    @Column(name = "order_seq")
    private Long orderSeq;

    /** WAITING / ANSWERED */
    @Column(name = "inquiry_status", length = 20)
    private String inquiryStatus;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "private_yn", length = 1)
    private String privateYn;

    @Column(name = "answered_date")
    private OffsetDateTime answeredDate;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Builder
    private Inquiry(String inquiryNo, Long userSeq, String inquiryType,
                    String title, String content, Long productSeq, Long orderSeq,
                    String inquiryStatus, String privateYn, String useYn) {
        this.inquiryNo = inquiryNo;
        this.userSeq = userSeq;
        this.inquiryType = inquiryType;
        this.title = title;
        this.content = content;
        this.productSeq = productSeq;
        this.orderSeq = orderSeq;
        this.inquiryStatus = inquiryStatus != null ? inquiryStatus : "WAITING";
        this.privateYn = privateYn != null ? privateYn : "N";
        this.useYn = useYn != null ? useYn : "Y";
    }

    /**
     * 상태 전이 단일 choke point (CS-T1). {@link InquiryStatus} 전이표로 허용 여부를 검증하고
     * 위반이면 {@code INQUIRY_TRANSITION_INVALID}를 던진다. 모든 전이가 이 메서드를 거치므로 비허용
     * 전이는 어떤 호출자로도 우회할 수 없다(R의 {@code Return.changeStatus} 동형). free-string 대입 금지(§2.1).
     */
    public void changeStatus(InquiryStatus target) {
        InquiryStatus current = InquiryStatus.from(this.inquiryStatus);
        if (!current.canTransitionTo(target)) {
            throw new BusinessException(ErrorCode.INQUIRY_TRANSITION_INVALID);
        }
        this.inquiryStatus = target.name();
    }

    /**
     * 최초 답변: {@code changeStatus(ANSWERED)}(WAITING에서만 허용) 경유 + 답변완료일시 기록.
     * 재답변은 이 메서드를 호출하지 않는다 — ANSWERED 상태에선 답변만 append하고 {@code answeredDate}는
     * 최초값을 고정한다(CS-Q②=(a), D 대시보드 SLA 집계 보호). 호출 분기는 서비스가 담당(CS-T3).
     */
    public void markAnswered(OffsetDateTime when) {
        changeStatus(InquiryStatus.ANSWERED);
        this.answeredDate = when;
    }
}
