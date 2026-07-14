package com.micoz.returns.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReturnItemInput {

    @NotNull
    private Long itemSeq;

    @NotNull
    @Min(1)
    private Integer quantity;

    /** EXCHANGE 시에만 필수 */
    private Long exchangeOptionSeq;
}
