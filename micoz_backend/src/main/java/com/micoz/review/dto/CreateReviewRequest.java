package com.micoz.review.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateReviewRequest {

    @NotNull(message = "주문 상품을 선택해주세요.")
    private Long itemSeq;

    @NotNull
    @Min(1)
    @Max(5)
    private Integer rating;

    @Size(max = 100)
    private String title;

    @NotBlank(message = "리뷰 내용은 필수입니다.")
    @Size(max = 500)
    private String content;

    /** 이미지 URL 배열 (선택) */
    private List<String> imageUrls;
}
