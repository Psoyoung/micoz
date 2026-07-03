package com.micoz.admin.returns.dto;

import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 검수 요청 (R-T4, R-Q1). restockYn=재입고 오버라이드(Y/N). 미지정 시 기본: DEFECT=N·그 외=Y.
 * dat_return_item.restock_yn(V10)에 영속.
 */
@Getter
@Setter
@NoArgsConstructor
public class InspectReturnRequest {

    @Pattern(regexp = "[YNyn]", message = "restockYn은 Y 또는 N")
    private String restockYn;
}
