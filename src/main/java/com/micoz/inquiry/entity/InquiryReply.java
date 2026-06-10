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
}
