package com.micoz.product.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProductImageDto {
    private Long imageSeq;
    private String imageType;
    private String imageUrl;
    private String imageAlt;
    private Integer sortOrder;
}
