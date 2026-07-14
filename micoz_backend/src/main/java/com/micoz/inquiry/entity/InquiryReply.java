package com.micoz.inquiry.entity;

import com.micoz.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "dat_inquiry_reply")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class InquiryReply extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reply_seq")
    private Long replySeq;

    @Column(name = "inquiry_seq", nullable = false)
    private Long inquirySeq;

    @Column(name = "admin_seq", nullable = false)
    private Long adminSeq;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "use_yn", length = 1)
    private String useYn;

    private InquiryReply(Long inquirySeq, Long adminSeq, String content) {
        this.inquirySeq = inquirySeq;
        this.adminSeq = adminSeq;
        this.content = content;
        this.useYn = "Y";
    }

    /**
     * 답변 생성 — <b>append-only</b>(§3.4, CS-Q①). 정정/삭제는 새 답변 추가로 대체하며 update·soft-delete
     * mutator는 두지 않는다(스키마에 use_yn·u_* 컬럼이 있어도 정책상 미사용). 등록자(i_user)는 AuditorAware 자동.
     */
    public static InquiryReply create(Long inquirySeq, Long adminSeq, String content) {
        return new InquiryReply(inquirySeq, adminSeq, content);
    }
}
