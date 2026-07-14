package com.micoz.promotion.dto;

import com.micoz.common.response.PageResponse;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class MyPointResponse {
    private Integer balance;
    private PageResponse<PointHistoryItem> history;
}
