package com.micoz.inquiry.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.List;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class InquiryDetailResponse {
    private Long inquirySeq;
    private String inquiryNo;
    private String inquiryType;
    private String title;
    private String content;
    private Long productSeq;
    private Long orderSeq;
    private String inquiryStatus;
    private String privateYn;
    private OffsetDateTime createdDate;
    private OffsetDateTime answeredDate;
    private List<InquiryReplyDto> replies;
}
