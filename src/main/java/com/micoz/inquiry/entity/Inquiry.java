package com.micoz.inquiry.entity;

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

    public void markAnswered(OffsetDateTime when) {
        this.inquiryStatus = "ANSWERED";
        this.answeredDate = when;
    }
}
