package com.micoz.inquiry.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class InquiryReplyDto {
    private Long replySeq;
    private String content;
    private OffsetDateTime createdDate;
}
