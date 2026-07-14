package com.micoz.favorite.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ToggleFavResponse {
    private Long productSeq;
    private boolean favorited;
}
