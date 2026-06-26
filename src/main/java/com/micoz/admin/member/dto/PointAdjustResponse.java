package com.micoz.admin.member.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/** 포인트 수동 조정 결과 (M-T5). 조정 후 잔액 + 생성된 이력 seq. */
@Getter
@AllArgsConstructor
public class PointAdjustResponse {
    private final Long userSeq;
    private final Integer pointBalance;
    private final Long pointSeq;
}
