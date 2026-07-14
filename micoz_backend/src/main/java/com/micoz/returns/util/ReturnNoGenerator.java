package com.micoz.returns.util;

import com.micoz.returns.repository.ReturnRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/** RT-{yyMMdd}-{NNNNN} 반품번호. */
@Component
@RequiredArgsConstructor
public class ReturnNoGenerator {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyMMdd");
    private static final int MAX_RETRY = 5;

    private final ReturnRepository returnRepository;

    public String next() {
        String prefix = "RT-" + LocalDate.now().format(DATE_FMT) + "-";
        for (int attempt = 1; attempt <= MAX_RETRY; attempt++) {
            long seq = (System.nanoTime() + attempt) % 100000;
            String candidate = prefix + String.format("%05d", seq);
            if (!returnRepository.existsByReturnNo(candidate)) {
                return candidate;
            }
        }
        return prefix + (System.nanoTime() % 100000);
    }
}
