package com.micoz.admin.order.controller;

import com.micoz.admin.order.dto.AdminOrderDetailResponse;
import com.micoz.admin.order.dto.AdminOrderListItem;
import com.micoz.admin.order.dto.AdminOrderSearchCondition;
import com.micoz.admin.order.dto.ShipOrderRequest;
import com.micoz.admin.order.service.AdminOrderQueryService;
import com.micoz.admin.order.service.AdminOrderService;
import com.micoz.common.response.ApiResponse;
import com.micoz.common.response.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 주문 운영 — 관리자 (O-T2 전이 액션 + O-T3 출고/배송 + O-T4 조회, FR-ADM-05).
 * URL 게이팅(/api/v1/admin/**) + 클래스 레벨 @PreAuthorize 2차 방어(F-T4 표준).
 * 관리자는 전 회원 주문 대상(사용자 측 본인-행 제약과 분리).
 */
@RestController
@RequestMapping("/api/v1/admin/orders")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrderController {

    private final AdminOrderService adminOrderService;
    private final AdminOrderQueryService adminOrderQueryService;

    /** 주문 목록 — 다축 검색(orderNo/orderStatus/userSeq/기간) + 페이징. 기본 정렬 orderDate desc. */
    @GetMapping
    public ApiResponse<PageResponse<AdminOrderListItem>> list(
            @ModelAttribute AdminOrderSearchCondition condition,
            @PageableDefault(size = 20, sort = "orderDate", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.success(adminOrderQueryService.search(condition, pageable));
    }

    /** 주문 상세 — 주문·상품스냅샷·배송·결제 결합(전 회원 대상). */
    @GetMapping("/{orderSeq}")
    public ApiResponse<AdminOrderDetailResponse> detail(@PathVariable Long orderSeq) {
        return ApiResponse.success(adminOrderQueryService.getDetail(orderSeq));
    }

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
