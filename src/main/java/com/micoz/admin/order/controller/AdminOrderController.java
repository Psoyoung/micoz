package com.micoz.admin.order.controller;

import com.micoz.admin.order.dto.ShipOrderRequest;
import com.micoz.admin.order.service.AdminOrderService;
import com.micoz.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 주문 상태 전이 — 관리자 액션 (O-T2, FR-ADM-05).
 * URL 게이팅(/api/v1/admin/**) + 클래스 레벨 @PreAuthorize 2차 방어(F-T4 표준).
 * order_status 단독 액션만(준비/취소). 출고·배송(2컬럼 동기화)은 O-T3에서 추가.
 */
@RestController
@RequestMapping("/api/v1/admin/orders")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrderController {

    private final AdminOrderService adminOrderService;

    /** 준비 시작: PAID → PREPARING. */
    @PatchMapping("/{orderSeq}/prepare")
    public ApiResponse<Void> prepare(@PathVariable Long orderSeq) {
        adminOrderService.prepare(orderSeq);
        return ApiResponse.success();
    }

    /** 관리자 취소: {PAID|PREPARING} → CANCELED + 재고 복원(payment 불변). */
    @PatchMapping("/{orderSeq}/cancel")
    public ApiResponse<Void> cancel(@PathVariable Long orderSeq) {
        adminOrderService.cancel(orderSeq);
        return ApiResponse.success();
    }

    /** 출고·운송장 입력: PREPARING→SHIPPING + READY→SHIPPED (2컬럼 동기화). 운송장 필수. */
    @PatchMapping("/{orderSeq}/ship")
    public ApiResponse<Void> ship(@PathVariable Long orderSeq, @Valid @RequestBody ShipOrderRequest request) {
        adminOrderService.ship(orderSeq, request.getTrackingNo());
        return ApiResponse.success();
    }

    /** 배송중 전환: SHIPPED → IN_TRANSIT (shipping_status 단독). */
    @PatchMapping("/{orderSeq}/in-transit")
    public ApiResponse<Void> markInTransit(@PathVariable Long orderSeq) {
        adminOrderService.markInTransit(orderSeq);
        return ApiResponse.success();
    }

    /** 배송완료: SHIPPING→DELIVERED + {SHIPPED|IN_TRANSIT}→DELIVERED (2컬럼 동기화). */
    @PatchMapping("/{orderSeq}/deliver")
    public ApiResponse<Void> deliver(@PathVariable Long orderSeq) {
        adminOrderService.deliver(orderSeq);
        return ApiResponse.success();
    }
}
