package com.micoz.admin.inquiry.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;

/**
 * 답변 행 — <b>관리자 전용</b> (CS-T2). 사용자 측 {@code InquiryReplyDto}(replySeq/content/createdDate)와 분리하여
 * {@code adminSeq}(어느 관리자가 답했는지)를 노출한다. 사용자 응답 경로에는 이 DTO가 절대 실리지 않으므로
 * 운영자 식별정보가 고객에 노출되지 않는다(§3.5, CS-Q④).
 */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AdminInquiryReplyDto {

    private Long replySeq;
    private Long adminSeq;
    private String content;
    private OffsetDateTime createdDate;
}
