package com.micoz.order.util;

import com.micoz.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * MZ-{yyMMdd}-{NNNNN} 형식 주문번호 생성기.
 * 단일 인스턴스 가정. 다중 인스턴스 시 dat_order.order_no UNIQUE 인덱스 + retry로 충돌 회피.
 */
@Component
@RequiredArgsConstructor
public class OrderNoGenerator {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyMMdd");
    private static final int MAX_RETRY = 5;

    private final OrderRepository orderRepository;

    public String next() {
        String prefix = "MZ-" + LocalDate.now().format(DATE_FMT) + "-";
        for (int attempt = 1; attempt <= MAX_RETRY; attempt++) {
            String candidate = prefix + String.format("%05d", randomSequence(attempt));
            if (!orderRepository.existsByOrderNo(candidate)) {
                return candidate;
            }
        }
        // fallback: nanoTime 기반
        return prefix + (System.nanoTime() % 100000);
    }

    /** 단일 인스턴스 기준 간단한 채번 — attempt에 따라 분기. */
    private long randomSequence(int attempt) {
        // 단순화: nanoTime을 5자리로 잘라 사용. 충돌 시 +1
        long base = System.nanoTime() % 100000;
        return (base + attempt) % 100000;
    }
}
