package com.micoz.review.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.List;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ReviewResponse {
    private Long reviewSeq;
    private Long productSeq;
    private Long itemSeq;
    private String userIdMasked;
    private Integer rating;
    private String title;
    private String content;
    private List<String> imageUrls;
    private OffsetDateTime createdDate;
}
