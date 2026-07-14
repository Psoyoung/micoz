package com.micoz.order.controller;

import com.micoz.auth.security.UserPrincipal;
import com.micoz.common.response.ApiResponse;
import com.micoz.order.dto.CreateOrderRequest;
import com.micoz.order.dto.OrderCreatedResponse;
import com.micoz.order.dto.PayOrderRequest;
import com.micoz.order.dto.PayOrderResponse;
import com.micoz.order.service.OrderService;
import com.micoz.order.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final PaymentService paymentService;

    @PostMapping
    public ApiResponse<OrderCreatedResponse> create(@AuthenticationPrincipal UserPrincipal principal,
                                                    @Valid @RequestBody CreateOrderRequest request) {
        return ApiResponse.success(orderService.create(principal.getUserSeq(), request));
    }

    @PostMapping("/{orderSeq}/pay")
    public ApiResponse<PayOrderResponse> pay(@AuthenticationPrincipal UserPrincipal principal,
                                             @PathVariable Long orderSeq,
                                             @Valid @RequestBody PayOrderRequest request) {
        return ApiResponse.success(paymentService.pay(principal.getUserSeq(), orderSeq, request));
    }
}
